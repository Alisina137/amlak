import {and,desc,eq,inArray,sql} from "drizzle-orm";
import type {FastifyInstance,FastifyRequest} from "fastify";
import {z} from "zod";
import {type Database,schema} from "@amlaklink/database";
import {listingDraftSchema} from "@amlaklink/contracts";
import {HttpProblem,requireActor,requireAgencyMember,requireStaffRole,requireVerified} from "./access";
import {canShowPublic,getListing,getRevision,validId} from "./listings";
import {cancelInactiveListingVisits} from "./engagement-lifecycle";
const reportInput=z.object({requestId:z.uuid(),reason:z.enum(["false_price","inaccurate_details","unavailable","duplicate","impersonation","inappropriate_media","suspected_fraud","other"]),details:z.string().trim().min(12).max(2000)}).strict();
const transitionInput=z.object({expectedVersion:z.number().int().positive(),status:z.enum(["triaged","investigating","resolved","rejected","closed"]),reason:z.string().trim().min(8).max(1000),severity:z.enum(["normal","high"]).optional()}).strict();
const holdInput=z.object({expectedVersion:z.number().int().positive(),reason:z.string().trim().min(12).max(1000),action:z.enum(["hold","release"])}).strict();
const reviewInput=z.object({decision:z.enum(["upheld","overturned"]),reason:z.string().trim().min(8).max(1000)}).strict();
const checkInput=z.object({subjectKind:z.enum(["user","agency","listing"]),subjectId:z.uuid(),scope:z.enum(["identity_reviewed","agency_registration_reviewed","professional_application_reviewed","listing_authorization_reviewed"]),method:z.string().trim().min(4).max(80),result:z.enum(["approved","rejected","revoked","expired"]),reason:z.string().trim().min(8).max(1000),expiresAt:z.string().datetime({offset:true}).nullable().optional()}).strict();
function parse<T>(contract:z.ZodType<T>,value:unknown){const parsed=contract.safeParse(value);if(!parsed.success)throw new HttpProblem(422,"INVALID_INPUT");return parsed.data;}
const moderators:typeof schema.staff.$inferSelect.role[]=["moderator","admin","super_admin"];
const support:typeof schema.staff.$inferSelect.role[]=["moderator","support","admin","super_admin"];
const verification:typeof schema.staff.$inferSelect.role[]=["verification","admin","super_admin"];
async function staff(db:Database,request:FastifyRequest,roles:typeof schema.staff.$inferSelect.role[]){
 const actor=await requireActor(db,request,"staff");requireStaffRole(actor,roles);return actor;
}
async function owner(db:Database,request:FastifyRequest,id:string){
 const actor=await requireActor(db,request,"user");await requireVerified(db,actor);
 const l=await getListing(db,id);
 if(l.agencyId)await requireAgencyMember(db,actor,l.agencyId,["owner","manager"]);
 else if(l.authorId!==actor.id)throw new HttpProblem(403,"NOT_ADVERTISER");
 return {l,actor};
}
async function getCase(db:Database,id:string){
 const [c]=await db.select().from(schema.safetyCases).where(eq(schema.safetyCases.id,validId(id))).limit(1);
 if(!c)throw new HttpProblem(404,"CASE_NOT_FOUND");return c;
}
async function alert(db:Database,userId:string,referenceId:string,key:string,title:string){
 await db.insert(schema.notifications).values({userId,kind:"safety",referenceId,dedupeKey:key,title}).onConflictDoNothing();
}
export async function latestChecks(db:Database,kind:"user"|"agency"|"listing",id:string){
 const records=await db.select().from(schema.verificationRecords).where(and(eq(schema.verificationRecords.subjectKind,kind),eq(schema.verificationRecords.subjectId,id)))
  .orderBy(desc(schema.verificationRecords.reviewedAt),desc(schema.verificationRecords.id)).limit(60);
 const latest=new Map<string,typeof records[number]>();
 for(const r of records)if(!latest.has(r.scope))latest.set(r.scope,r);
 return [...latest.values()].filter(r=>r.result==="approved"&&(!r.expiresAt||r.expiresAt>new Date()))
  .map(r=>({scope:r.scope,reviewedAt:r.reviewedAt,expiresAt:r.expiresAt}));
}
const caseTransitions:Record<string,string[]>={open:["triaged","investigating","rejected"],triaged:["investigating","resolved","rejected"],investigating:["resolved","rejected"],resolved:["closed"],rejected:["closed"],appealed:[],closed:[]};
export function normalizeDuplicateToken(value:string){return value.normalize("NFKC").toLowerCase().replace(/[يى]/g,"ی").replace(/ك/g,"ک").replace(/[\u064b-\u065f\u200c]/g,"").replace(/[^\p{L}\p{N}]/gu," ").replace(/\s+/g," ").trim();}
export function duplicates(a:ReturnType<typeof listingDraftSchema.parse>,b:ReturnType<typeof listingDraftSchema.parse>){
 if(a.propertyType!==b.propertyType||a.transactionType!==b.transactionType)return false;
 for(const key of ["provinceId","city","district"] as const){
  const left=a.location[key]||"",right=b.location[key]||"";
  if(!left||!right||normalizeDuplicateToken(left)!==normalizeDuplicateToken(right))return false;
 }
 return normalizeDuplicateToken(a.title)===normalizeDuplicateToken(b.title)&&Math.abs(a.attributes.areaM2-b.attributes.areaM2)<=Math.max(8,a.attributes.areaM2*.08);
}
export function registerSafetyRoutes(app:FastifyInstance,db:Database){
 app.post<{Params:{id:string}}>("/v1/properties/:id/reports",{config:{rateLimit:{max:4,timeWindow:"1 minute"}}},async request=>{
  const actor=await requireActor(db,request,"user");await requireVerified(db,actor);
  const input=parse(reportInput,request.body),l=await getListing(db,request.params.id);
  if(l.authorId===actor.id)throw new HttpProblem(403,"CANNOT_REPORT_OWN_LISTING");
  if(l.agencyId){
   const [member]=await db.select({id:schema.memberships.id}).from(schema.memberships)
    .where(and(eq(schema.memberships.agencyId,l.agencyId),eq(schema.memberships.userId,actor.id),
     eq(schema.memberships.status,"active"))).limit(1);
   if(member)throw new HttpProblem(403,"CANNOT_REPORT_OWN_AGENCY");
  }
  if(!l.approvedRevisionId||!["published","paused","sold","rented"].includes(l.status)||!await canShowPublic(db,l))
   throw new HttpProblem(404,"PROPERTY_NOT_AVAILABLE");
  return db.transaction(async tx=>{
   const [report]=await tx.insert(schema.safetyReports).values({listingId:l.id,reporterId:actor.id,
    requestId:input.requestId,reason:input.reason,details:input.details}).onConflictDoNothing().returning();
   if(!report){
    const [existing]=await tx.select().from(schema.safetyReports).where(and(eq(schema.safetyReports.reporterId,actor.id),
     eq(schema.safetyReports.requestId,input.requestId))).limit(1);
    if(!existing||existing.listingId!==l.id)throw new HttpProblem(409,"REPORT_RETRY_CONFLICT");
    const [c]=await tx.select().from(schema.safetyCases).where(eq(schema.safetyCases.reportId,existing.id)).limit(1);
    if(!c)throw new HttpProblem(409,"REPORT_RETRY_CONFLICT");
    return {id:c.id,status:c.status,reused:true};
   }
   const [c]=await tx.insert(schema.safetyCases).values({listingId:l.id,reportId:report.id,
    severity:["suspected_fraud","impersonation"].includes(input.reason)?"high":"normal"}).returning();
   await tx.insert(schema.audit).values({actorType:"user",actorId:actor.id,action:"property_report_submitted",
    targetType:"safety_case",targetId:c.id,reason:input.reason});
   return {id:c.id,status:c.status,reused:false};
  });
 });
 app.get("/v1/reports/mine",async request=>{
  const actor=await requireActor(db,request,"user");await requireVerified(db,actor);
  const items=await db.select({id:schema.safetyCases.id,listingId:schema.safetyCases.listingId,
   reason:schema.safetyReports.reason,status:schema.safetyCases.status,createdAt:schema.safetyReports.createdAt})
   .from(schema.safetyReports).innerJoin(schema.safetyCases,eq(schema.safetyCases.reportId,schema.safetyReports.id))
   .where(eq(schema.safetyReports.reporterId,actor.id)).orderBy(desc(schema.safetyReports.createdAt)).limit(100);
  return {items};
 });
 app.get<{Params:{id:string}}>("/v1/properties/:id/safety-cases",async request=>{
  const {l}=await owner(db,request,request.params.id);
  const rows=await db.select({id:schema.safetyCases.id,status:schema.safetyCases.status,resolution:schema.safetyCases.resolution,
   createdAt:schema.safetyCases.createdAt,resolvedAt:schema.safetyCases.resolvedAt})
   .from(schema.safetyCases).where(eq(schema.safetyCases.listingId,l.id)).orderBy(desc(schema.safetyCases.createdAt)).limit(50);
  const appeals=rows.length?await db.select({caseId:schema.safetyAppeals.caseId}).from(schema.safetyAppeals)
   .where(inArray(schema.safetyAppeals.caseId,rows.map(r=>r.id))):[];
  return {items:rows.map(r=>({...r,appealed:appeals.some(a=>a.caseId===r.id)})),safetyHold:l.safetyHold};
 });
 app.post<{Params:{id:string}}>("/v1/safety-cases/:id/appeal",async request=>{
  const c=await getCase(db,request.params.id),{actor}=await owner(db,request,c.listingId);
  const input=parse(z.object({reason:z.string().trim().min(12).max(2000)}).strict(),request.body);
  return db.transaction(async tx=>{
   const [lock]=await tx.select().from(schema.safetyCases).where(eq(schema.safetyCases.id,c.id)).for("update");
   if(!lock||!["resolved","rejected","closed"].includes(lock.status))throw new HttpProblem(409,"CASE_NOT_APPEALABLE");
   const [appeal]=await tx.insert(schema.safetyAppeals).values({caseId:c.id,appellantId:actor.id,reason:input.reason})
    .onConflictDoNothing().returning();
   if(!appeal)throw new HttpProblem(409,"APPEAL_ALREADY_SUBMITTED");
   await tx.update(schema.safetyCases).set({status:"appealed",version:lock.version+1,updatedAt:new Date()}).where(eq(schema.safetyCases.id,c.id));
   await tx.insert(schema.audit).values({actorType:"user",actorId:actor.id,action:"safety_appeal_submitted",targetType:"safety_case",targetId:c.id});
   return {id:appeal.id,status:"appealed"};
  });
 });
 app.get("/v1/admin/safety/cases",async request=>{
  await staff(db,request,support);
  const q=parse(z.object({status:z.enum(["open","triaged","investigating","resolved","rejected","appealed","closed"]).optional()}).strict(),request.query);
  const items=await db.select().from(schema.safetyCases).where(q.status?eq(schema.safetyCases.status,q.status):undefined)
   .orderBy(desc(schema.safetyCases.createdAt)).limit(100);
  return {items};
 });
 app.get<{Params:{id:string}}>("/v1/admin/safety/cases/:id",async request=>{
  await staff(db,request,support);
  const c=await getCase(db,request.params.id),l=await getListing(db,c.listingId);
  const [report]=c.reportId?await db.select({reason:schema.safetyReports.reason,details:schema.safetyReports.details})
   .from(schema.safetyReports).where(eq(schema.safetyReports.id,c.reportId)).limit(1):[];
  const [appeal]=await db.select().from(schema.safetyAppeals).where(eq(schema.safetyAppeals.caseId,c.id)).limit(1);
  return {case:c,listing:{id:l.id,status:l.status,safetyHold:l.safetyHold,version:l.version},
   report:report||null,appeal:appeal?{reason:appeal.reason,decision:appeal.decision,reviewReason:appeal.reviewReason}:null};
 });
 app.post<{Params:{id:string}}>("/v1/admin/safety/cases/:id/transition",async request=>{
  const actor=await staff(db,request,moderators),c=await getCase(db,request.params.id),input=parse(transitionInput,request.body);
  return db.transaction(async tx=>{
   const [lock]=await tx.select().from(schema.safetyCases).where(eq(schema.safetyCases.id,c.id)).for("update");
   if(!lock||lock.version!==input.expectedVersion)throw new HttpProblem(409,"CASE_VERSION_CONFLICT");
   if(!caseTransitions[lock.status]?.includes(input.status))throw new HttpProblem(409,"INVALID_CASE_TRANSITION");
   const [row]=await tx.update(schema.safetyCases).set({status:input.status,version:lock.version+1,
    severity:input.severity||lock.severity,resolution:input.reason,assignedTo:actor.id,updatedAt:new Date(),
    resolvedAt:["resolved","rejected"].includes(input.status)?new Date():lock.resolvedAt}).where(eq(schema.safetyCases.id,c.id)).returning();
   await tx.insert(schema.audit).values({actorType:"staff",actorId:actor.id,action:"safety_case_"+input.status,
    targetType:"safety_case",targetId:c.id,reason:input.reason});
   return {id:row.id,status:row.status,version:row.version};
  });
 });
 app.post<{Params:{id:string}}>("/v1/admin/safety/cases/:id/appeal-decision",async request=>{
  const actor=await staff(db,request,moderators),c=await getCase(db,request.params.id),input=parse(reviewInput,request.body);
  return db.transaction(async tx=>{
   const [lock]=await tx.select().from(schema.safetyCases).where(eq(schema.safetyCases.id,c.id)).for("update");
   if(lock?.status!=="appealed")throw new HttpProblem(409,"CASE_NOT_APPEALED");
   const [appeal]=await tx.update(schema.safetyAppeals).set({decision:input.decision,reviewerId:actor.id,
    reviewReason:input.reason,reviewedAt:new Date()}).where(and(eq(schema.safetyAppeals.caseId,c.id),
    sql.raw("safety_appeals.decision IS NULL"))).returning();
   if(!appeal)throw new HttpProblem(409,"APPEAL_ALREADY_DECIDED");
   const status=input.decision==="overturned"?"resolved":"closed";
   await tx.update(schema.safetyCases).set({status,version:lock.version+1,
    resolution:input.reason,updatedAt:new Date(),resolvedAt:new Date()}).where(eq(schema.safetyCases.id,c.id));
   await tx.insert(schema.audit).values({actorType:"staff",actorId:actor.id,action:"appeal_"+input.decision,
    targetType:"safety_case",targetId:c.id,reason:input.reason});
   return {status,listingRestored:false};
  });
 });
 app.post<{Params:{id:string}}>("/v1/admin/safety/listings/:id/hold",async request=>{
  const actor=await staff(db,request,moderators),l=await getListing(db,request.params.id),input=parse(holdInput,request.body);
  const result=await db.transaction(async tx=>{
   const [lock]=await tx.select().from(schema.listings).where(eq(schema.listings.id,l.id)).for("update");
   if(!lock||lock.version!==input.expectedVersion)throw new HttpProblem(409,"STALE_LISTING_VERSION");
   if(input.action==="hold"&&lock.status!=="published")throw new HttpProblem(409,"LISTING_NOT_PUBLISHED");
   if(input.action==="release"&&(!lock.safetyHold||lock.status!=="paused"||!lock.approvedRevisionId))
    throw new HttpProblem(409,"NO_ACTIVE_SAFETY_HOLD");
   const [row]=await tx.update(schema.listings).set({status:input.action==="hold"?"paused":"published",
    safetyHold:input.action==="hold",version:lock.version+1,updatedAt:new Date()}).where(eq(schema.listings.id,l.id)).returning();
   await tx.insert(schema.audit).values({actorType:"staff",actorId:actor.id,action:"listing_safety_"+input.action,
    targetType:"listing",targetId:l.id,reason:input.reason});
   return row;
  });
  if(input.action==="hold")await cancelInactiveListingVisits(db,l.id,false).catch(e=>app.log.error({e},"Visit reconciliation failed"));
  await alert(db,l.authorId,l.id,"hold:"+l.id+":"+result.version,input.action==="hold"?"Your property is paused for safety review":"Safety hold released").catch(()=>{});
  return {id:l.id,status:result.status,safetyHold:result.safetyHold,version:result.version};
 });
}
