import {and,desc,eq,inArray} from "drizzle-orm";
import type {FastifyInstance} from "fastify";
import {z} from "zod";
import {type Database,schema} from "@amlaklink/database";
import {listingDraftSchema} from "@amlaklink/contracts";
import {HttpProblem,requireActor,requireStaffRole} from "./access";
import {getListing,validId,canShowPublic} from "./listings";
import {duplicates,latestChecks} from "./safety";
const verifyRoles:typeof schema.staff.$inferSelect.role[]=["verification","admin","super_admin"];
const modRoles:typeof schema.staff.$inferSelect.role[]=["moderator","admin","super_admin"];
const contract=z.object({subjectKind:z.enum(["user","agency","listing"]),subjectId:z.uuid(),scope:z.enum(["identity_reviewed","agency_registration_reviewed","professional_application_reviewed","listing_authorization_reviewed"]),method:z.string().trim().min(4).max(80),result:z.enum(["approved","rejected","revoked","expired"]),reason:z.string().trim().min(8).max(1000),expiresAt:z.string().datetime({offset:true}).nullable().optional()}).strict();
function parse<T>(s:z.ZodType<T>,input:unknown){const r=s.safeParse(input);if(!r.success)throw new HttpProblem(422,"INVALID_INPUT");return r.data;}
export function registerVerificationRoutes(app:FastifyInstance,db:Database){
 app.post("/v1/admin/safety/verification",async request=>{
  const actor=await requireActor(db,request,"staff");requireStaffRole(actor,verifyRoles);
  const input=parse(contract,request.body),allowed={user:["identity_reviewed","professional_application_reviewed"],agency:["agency_registration_reviewed"],listing:["listing_authorization_reviewed"]};
  if(!allowed[input.subjectKind].includes(input.scope))throw new HttpProblem(422,"INVALID_SCOPE");
  const expires=input.expiresAt?new Date(input.expiresAt):null;
  if(input.result==="approved"&&expires&&expires<=new Date())throw new HttpProblem(422,"INVALID_EXPIRY");
  if(input.subjectKind==="user"){
   const [p]=await db.select({id:schema.users.id}).from(schema.users).where(eq(schema.users.id,input.subjectId));
   if(!p)throw new HttpProblem(404,"USER_NOT_FOUND");
  }else if(input.subjectKind==="agency"){
   const [p]=await db.select({id:schema.agencies.id}).from(schema.agencies).where(eq(schema.agencies.id,input.subjectId));
   if(!p)throw new HttpProblem(404,"AGENCY_NOT_FOUND");
  }else await getListing(db,input.subjectId);
  return db.transaction(async tx=>{
   const [r]=await tx.insert(schema.verificationRecords).values({subjectKind:input.subjectKind,subjectId:input.subjectId,
    scope:input.scope,method:input.method,result:input.result,reviewerId:actor.id,reviewReason:input.reason,expiresAt:expires}).returning();
   await tx.insert(schema.audit).values({actorType:"staff",actorId:actor.id,action:"verification_"+input.result,
    targetType:input.subjectKind,targetId:input.subjectId,reason:input.scope+" "+input.reason});
   return {id:r.id,result:r.result,scope:r.scope};
  });
 });
 app.get<{Params:{kind:string;id:string}}>("/v1/admin/safety/verification/:kind/:id",async request=>{
  const actor=await requireActor(db,request,"staff");requireStaffRole(actor,verifyRoles);
  const kind=request.params.kind;if(!["user","agency","listing"].includes(kind))throw new HttpProblem(422,"INVALID_SUBJECT");
  const items=await db.select().from(schema.verificationRecords).where(and(eq(schema.verificationRecords.subjectKind,kind),
   eq(schema.verificationRecords.subjectId,validId(request.params.id)))).orderBy(desc(schema.verificationRecords.reviewedAt)).limit(100);
  return {items};
 });
 app.get<{Params:{id:string}}>("/v1/properties/:id/verified-checks",async request=>{
  const l=await getListing(db,request.params.id);
  if(!l.approvedRevisionId||!["published","paused","sold","rented"].includes(l.status)||!await canShowPublic(db,l))throw new HttpProblem(404,"PROPERTY_NOT_AVAILABLE");
  return {items:(await latestChecks(db,"listing",l.id)).filter(s=>s.scope==="listing_authorization_reviewed").map(s=>({...s,
   description:"Listing authorization documents reviewed; does not certify legal title or ownership."}))};
 });
 app.post("/v1/admin/safety/duplicates/scan",async request=>{
  const actor=await requireActor(db,request,"staff");requireStaffRole(actor,modRoles);
  const input=parse(z.object({limit:z.number().int().min(2).max(120).default(60)}).strict(),request.body||{});
  const rows=await db.select({listing:schema.listings,revision:schema.revisions}).from(schema.listings)
   .innerJoin(schema.revisions,eq(schema.revisions.id,schema.listings.approvedRevisionId))
   .where(inArray(schema.listings.status,["published","paused"])).orderBy(desc(schema.listings.createdAt)).limit(input.limit);
  const list=rows.map(r=>({...r,data:listingDraftSchema.parse(r.revision.data)}));
  let created=0;
  for(let i=0;i<list.length;i++)for(let j=i+1;j<list.length;j++){
   const x=list[i],y=list[j];if(x.listing.authorId===y.listing.authorId||!duplicates(x.data,y.data))continue;
   const [a,b]=[x.listing.id,y.listing.id].sort();
   const [candidate]=await db.insert(schema.duplicateCandidates).values({listingId:a,otherListingId:b,
    rationale:"Similar title, location, transaction type, and area; human review required."}).onConflictDoNothing().returning();
   if(candidate)created++;
  }
  await db.insert(schema.audit).values({actorType:"staff",actorId:actor.id,action:"duplicate_scan",targetType:"listing",
   reason:"checked "+list.length+", created "+created});
  return {checked:list.length,created};
 });
 app.get("/v1/admin/safety/duplicates",async request=>{
  const actor=await requireActor(db,request,"staff");requireStaffRole(actor,modRoles);
  return {items:await db.select().from(schema.duplicateCandidates).where(eq(schema.duplicateCandidates.status,"pending"))
   .orderBy(desc(schema.duplicateCandidates.createdAt)).limit(100)};
 });
 app.post<{Params:{id:string}}>("/v1/admin/safety/duplicates/:id/decision",async request=>{
  const actor=await requireActor(db,request,"staff");requireStaffRole(actor,modRoles);
  const input=parse(z.object({decision:z.enum(["duplicate","distinct"]),reason:z.string().trim().min(8).max(500)}).strict(),request.body);
  return db.transaction(async tx=>{
   const [row]=await tx.update(schema.duplicateCandidates).set({status:input.decision,reviewedBy:actor.id,
    reviewReason:input.reason,reviewedAt:new Date()}).where(and(eq(schema.duplicateCandidates.id,validId(request.params.id)),
    eq(schema.duplicateCandidates.status,"pending"))).returning();
   if(!row)throw new HttpProblem(409,"ALREADY_REVIEWED");
   await tx.insert(schema.audit).values({actorType:"staff",actorId:actor.id,action:"duplicate_"+input.decision,
    targetType:"listing",targetId:row.listingId,reason:input.reason+" candidate "+row.otherListingId});
   return {status:row.status,automaticallyHidden:false};
  });
 });
}
