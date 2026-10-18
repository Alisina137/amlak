import {and,eq,isNull,ne,inArray,gt,lte,desc,sql} from "drizzle-orm";
import {type FastifyInstance} from "fastify";
import {z} from "zod";
import {findProvince} from "@amlaklink/catalog";
import {type Database,schema} from "@amlaklink/database";
import {HttpProblem,canSubmitListing,requireActor,requireAgencyMember,requireStaffRole,requireVerified} from "./access";
import {normalizeEmail} from "./security";
const agencyId=z.uuid();
const apply=z.object({name:z.string().trim().min(3).max(160),provinceId:z.string().min(2).max(50)}).strict();
const memberAdd=z.object({email:z.email().max(254),role:z.enum(["agent","manager"])}).strict();
const decision=z.object({decision:z.enum(["approve","reject"]),reason:z.string().trim().min(8).max(500)}).strict();
const parse=<T>(contract:z.ZodType<T>,input:unknown):T=>{
 const result=contract.safeParse(input);
 if(!result.success)throw new HttpProblem(422,"VALIDATION_ERROR");
 return result.data;
};
const getId=(id:unknown)=>parse(agencyId,id);
export function registerAgencyRoutes(app:FastifyInstance,db:Database){
 app.post("/v1/agencies/apply",async request=>{
  const actor=await requireActor(db,request,"user");
  await requireVerified(db,actor);
  const payload=parse(apply,request.body);
  if(!findProvince(payload.provinceId))throw new HttpProblem(422,"UNKNOWN_PROVINCE");
  const [org]=await db.insert(schema.agencies).values({...payload,creatorId:actor.id}).returning();
  await db.insert(schema.memberships).values({agencyId:org.id,userId:actor.id,role:"owner",status:"pending"});
  await db.insert(schema.audit).values({actorType:"user",actorId:actor.id,action:"agency_application_submitted",targetType:"agency",targetId:org.id});
  return {id:org.id,status:org.status,name:org.name,provinceId:org.provinceId};
 });
 app.get("/v1/agencies/mine",async request=>{
  const actor=await requireActor(db,request,"user");
  const rows=await db.select({
    agencyId:schema.agencies.id,name:schema.agencies.name,provinceId:schema.agencies.provinceId,
    agencyStatus:schema.agencies.status,role:schema.memberships.role,
    membershipStatus:schema.memberships.status
  }).from(schema.memberships).innerJoin(schema.agencies,eq(schema.agencies.id,schema.memberships.agencyId))
    .where(and(eq(schema.memberships.userId,actor.id),ne(schema.memberships.status,"revoked")));
  return {items:rows};
 });
 app.get<{Params:{id:string}}>("/v1/agencies/:id/workspace",async request=>{
  const actor=await requireActor(db,request,"user");
  const id=getId(request.params.id);
  const membership=await requireAgencyMember(db,actor,id,["owner","manager","agent"]);
  const [org]=await db.select({id:schema.agencies.id,name:schema.agencies.name,provinceId:schema.agencies.provinceId,status:schema.agencies.status})
    .from(schema.agencies).where(eq(schema.agencies.id,id)).limit(1);
  return {agency:org,membership:{role:membership.role,id:membership.id},canManageMembers:membership.role!=="agent",
    canSubmitListing:canSubmitListing({verified:true,advertiserEnabled:false,memberRole:membership.role,agencyActive:true},"agency")};
 });
 app.get<{Params:{id:string}}>("/v1/agencies/:id/members",async request=>{
  const actor=await requireActor(db,request,"user");
  const id=getId(request.params.id);
  await requireAgencyMember(db,actor,id,["owner","manager","agent"]);
  const members=await db.select({id:schema.memberships.id,userId:schema.memberships.userId,role:schema.memberships.role,status:schema.memberships.status,displayName:schema.users.displayName})
  .from(schema.memberships).innerJoin(schema.users,eq(schema.users.id,schema.memberships.userId))
  .where(and(eq(schema.memberships.agencyId,id),ne(schema.memberships.status,"revoked")));
  return {items:members};
 });
 // Restricted admin association; self-enrollment never grants access.
 app.post<{Params:{id:string}}>("/v1/agencies/:id/members",async request=>{
  const actor=await requireActor(db,request,"user");
  const id=getId(request.params.id),values=parse(memberAdd,request.body);
  const manager=await requireAgencyMember(db,actor,id,["owner","manager"]);
  if(manager.role==="manager" && values.role==="manager")throw new HttpProblem(403,"OWNER_APPROVAL_REQUIRED");
  const [person]=await db.select().from(schema.users).where(eq(schema.users.email,normalizeEmail(values.email))).limit(1);
  if(!person || !person.emailVerifiedAt || person.status!=="active")throw new HttpProblem(404,"VERIFIED_MEMBER_NOT_FOUND");
  await db.transaction(async tx=>{
   // Lock agency membership changes, including seat-capacity checks, per organization.
   await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${id}::text))`);
   const [existing]=await tx.select().from(schema.memberships)
    .where(and(eq(schema.memberships.agencyId,id),eq(schema.memberships.userId,person.id))).limit(1);
   if(existing?.status==="active")throw new HttpProblem(409,"MEMBER_ALREADY_ACTIVE");
   const now=new Date();
   const [entitlement]=await tx.select({seats:schema.growthEntitlements.seatLimit})
    .from(schema.growthEntitlements).where(and(eq(schema.growthEntitlements.agencyId,id),
     lte(schema.growthEntitlements.startsAt,now),gt(schema.growthEntitlements.expiresAt,now)))
    .orderBy(desc(schema.growthEntitlements.seatLimit),desc(schema.growthEntitlements.expiresAt)).limit(1);
   if(!existing||existing.status==="revoked"){
    const [count]=await tx.select({n:sql<number>`count(*)::integer`}).from(schema.memberships)
      .where(and(eq(schema.memberships.agencyId,id),inArray(schema.memberships.status,["active","pending"])));
    if(Number(count?.n||0)>=(entitlement?.seats||3))throw new HttpProblem(409,"AGENCY_SEAT_LIMIT_REACHED");
   }
   if(existing)await tx.update(schema.memberships).set({role:values.role,status:"pending",updatedAt:now})
     .where(eq(schema.memberships.id,existing.id));
   else await tx.insert(schema.memberships).values({agencyId:id,userId:person.id,role:values.role,status:"pending"});
   await tx.insert(schema.audit).values({actorType:"user",actorId:actor.id,action:"agency_member_invited",
    targetType:"agency",targetId:id,reason:person.id});
  });
  return {success:true,userId:person.id,role:values.role,status:"pending"};
 });
 app.post<{Params:{id:string;memberId:string}}>("/v1/agencies/:id/members/:memberId/revoke",async request=>{
  const actor=await requireActor(db,request,"user");
  const id=getId(request.params.id);
  const manager=await requireAgencyMember(db,actor,id,["owner","manager"]);
  const memberId=getId(request.params.memberId);
  const [member]=await db.select().from(schema.memberships).where(and(eq(schema.memberships.id,memberId),eq(schema.memberships.agencyId,id))).limit(1);
  if(!member || member.status==="revoked")throw new HttpProblem(404,"MEMBER_NOT_ACTIVE");
  // Owner transfer requires an audited dedicated workflow. Disallow revoking any owner here.
  if(member.role==="owner" || (member.role==="manager" && manager.role!=="owner"))throw new HttpProblem(403,"OWNER_APPROVAL_REQUIRED");
  await db.transaction(async tx=>{
   // Serialize revocation with invitation accept and lead reassignment.
   // The preflight membership lookup above is for friendly errors only;
   // authorization/target status are rechecked after acquiring the lock.
   await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${id}::text))`);
   const [currentManager]=await tx.select().from(schema.memberships).where(and(
    eq(schema.memberships.agencyId,id),eq(schema.memberships.userId,actor.id),
    eq(schema.memberships.status,"active"))).limit(1);
   if(!currentManager||!["owner","manager"].includes(currentManager.role))
    throw new HttpProblem(403,"AGENCY_ACCESS_DENIED");
   const [current]=await tx.select().from(schema.memberships).where(and(
    eq(schema.memberships.id,memberId),eq(schema.memberships.agencyId,id))).limit(1);
   if(!current||current.status==="revoked")throw new HttpProblem(404,"MEMBER_NOT_ACTIVE");
   if(current.role==="owner"||(current.role==="manager"&&currentManager.role!=="owner"))
    throw new HttpProblem(403,"OWNER_APPROVAL_REQUIRED");
   await tx.update(schema.memberships).set({status:"revoked",updatedAt:new Date()})
    .where(eq(schema.memberships.id,memberId));
   // Removing a member returns their lead assignments to the manager's
   // unassigned queue without revealing these leads to former members.
   await tx.update(schema.inquiries).set({assignedTo:null,updatedAt:new Date()})
    .where(and(eq(schema.inquiries.agencyId,id),eq(schema.inquiries.assignedTo,current.userId)));
   await tx.insert(schema.audit).values({actorType:"user",actorId:actor.id,action:"agency_member_revoked",
    targetType:"agency",targetId:id,reason:current.userId});
  });
  return {success:true};
 });
 app.post<{Params:{id:string}}>("/v1/agencies/:id/invitation/accept",async request=>{
  const actor=await requireActor(db,request,"user");
  await requireVerified(db,actor);
  const id=getId(request.params.id);
  const [org]=await db.select().from(schema.agencies).where(eq(schema.agencies.id,id)).limit(1);
  if(!org || org.status!=="active")throw new HttpProblem(403,"AGENCY_INACTIVE");
  return db.transaction(async tx=>{
   // Pending invitations granted while a paid plan was active must not bypass a
   // later downgrade/expiry. Existing ACTIVE users are never revoked by a plan ending.
   await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${id}::text))`);
   const [pending]=await tx.select().from(schema.memberships).where(and(
    eq(schema.memberships.agencyId,id),eq(schema.memberships.userId,actor.id),
    eq(schema.memberships.status,"pending"),ne(schema.memberships.role,"owner"))).limit(1);
   if(!pending)throw new HttpProblem(404,"INVITATION_NOT_FOUND");
   const now=new Date();
   const [grant]=await tx.select({seats:schema.growthEntitlements.seatLimit})
    .from(schema.growthEntitlements).where(and(eq(schema.growthEntitlements.agencyId,id),
     lte(schema.growthEntitlements.startsAt,now),gt(schema.growthEntitlements.expiresAt,now)))
    .orderBy(desc(schema.growthEntitlements.seatLimit)).limit(1);
   const [count]=await tx.select({n:sql<number>`count(*)::integer`}).from(schema.memberships)
    .where(and(eq(schema.memberships.agencyId,id),eq(schema.memberships.status,"active")));
   if(Number(count?.n||0)>=(grant?.seats||3))throw new HttpProblem(409,"AGENCY_SEAT_LIMIT_REACHED");
   const [changed]=await tx.update(schema.memberships).set({status:"active",updatedAt:now})
    .where(and(eq(schema.memberships.id,pending.id),eq(schema.memberships.status,"pending")))
    .returning({role:schema.memberships.role});
   if(!changed)throw new HttpProblem(409,"INVITATION_CHANGED");
   await tx.insert(schema.audit).values({actorType:"user",actorId:actor.id,
    action:"agency_invitation_accepted",targetType:"agency",targetId:id});
   return {success:true,role:changed.role};
  });
 });
 app.get("/v1/admin/agencies",async request=>{
  const actor=await requireActor(db,request,"staff");
  requireStaffRole(actor,["verification","admin","super_admin"]);
  const items=await db.select({
   id:schema.agencies.id,name:schema.agencies.name,status:schema.agencies.status,
   provinceId:schema.agencies.provinceId,createdAt:schema.agencies.createdAt
  }).from(schema.agencies).where(eq(schema.agencies.status,"pending"));
  return {items};
 });
 app.post<{Params:{id:string}}>("/v1/admin/agencies/:id/decision",async request=>{
  const actor=await requireActor(db,request,"staff");
  requireStaffRole(actor,["verification","admin","super_admin"]);
  const id=getId(request.params.id),input=parse(decision,request.body);
  const changed=await db.update(schema.agencies).set({
   status:input.decision==="approve"?"active":"rejected",reviewedAt:new Date(),reviewedBy:actor.id
  }).where(and(eq(schema.agencies.id,id),eq(schema.agencies.status,"pending")))
  .returning({id:schema.agencies.id,status:schema.agencies.status});
  if(!changed.length)throw new HttpProblem(409,"AGENCY_NOT_PENDING");
  if(input.decision==="approve"){
   await db.update(schema.memberships).set({status:"active",updatedAt:new Date()})
   .where(and(eq(schema.memberships.agencyId,id),eq(schema.memberships.role,"owner"),eq(schema.memberships.status,"pending")));
  }
  await db.insert(schema.audit).values({actorType:"staff",actorId:actor.id,action:"agency_"+input.decision,targetType:"agency",targetId:id,reason:input.reason});
  return changed[0];
 });
}
