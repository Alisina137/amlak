import {and,desc,eq,gt,inArray,sql} from "drizzle-orm";
import type {FastifyInstance,FastifyRequest} from "fastify";
import {z} from "zod";
import {type Database,schema} from "@amlaklink/database";
import {createListingSchema,listingDraftSchema,listingSubmissionSchema,listingSubmitSchema,saveDraftSchema,reviewDecisionSchema,publicListingPayload} from "@amlaklink/contracts";
import {canSubmitListing,HttpProblem,requireActor,requireAgencyMember,requireStaffRole,requireVerified} from "./access";
type Listing=typeof schema.listings.$inferSelect;
type Revision=typeof schema.revisions.$inferSelect;
export function parse<T>(s:z.ZodType<T>,body:unknown):T{
 const r=s.safeParse(body);
 if(!r.success)throw new HttpProblem(422,"VALIDATION_ERROR",JSON.stringify(r.error.issues.map(i=>({path:i.path,message:i.message}))));
 return r.data;
}
export const validId=(value:string)=>{if(!z.uuid().safeParse(value).success)throw new HttpProblem(422,"INVALID_ID");return value;};
export async function getListing(db:Database,value:string){
 const [l]=await db.select().from(schema.listings).where(eq(schema.listings.id,validId(value))).limit(1);
 if(!l)throw new HttpProblem(404,"LISTING_NOT_FOUND");return l;
}
export async function getRevision(db:Database,value:string){
 const [r]=await db.select().from(schema.revisions).where(eq(schema.revisions.id,validId(value))).limit(1);
 if(!r)throw new HttpProblem(409,"REVISION_NOT_FOUND");return r;
}
export async function requireEditor(db:Database,request:FastifyRequest,l:Listing){
 const actor=await requireActor(db,request,"user"),user=await requireVerified(db,actor);
 if(l.agencyId){
  const member=await requireAgencyMember(db,actor,l.agencyId,["owner","manager","agent"]);
  if(member.role==="agent" && l.authorId!==actor.id)throw new HttpProblem(403,"LISTING_NOT_ASSIGNED");
 }else{
  if(l.authorId!==actor.id)throw new HttpProblem(403,"LISTING_ACCESS_DENIED");
  if(!canSubmitListing({verified:true,advertiserEnabled:user.advertiserEnabled,independentAgentApproved:user.independentAgentStatus==="approved"},l.publisher))
    throw new HttpProblem(403,"ADVERTISER_PERMISSION_REVOKED");
 }
 return actor;
}
export async function canShowPublic(db:Database,l:Listing):Promise<boolean>{
 const [author]=await db.select({status:schema.users.status}).from(schema.users).where(eq(schema.users.id,l.authorId)).limit(1);
 if(!author||author.status!=="active")return false;
 if(l.agencyId){
  const [agency]=await db.select({status:schema.agencies.status}).from(schema.agencies).where(eq(schema.agencies.id,l.agencyId)).limit(1);
  if(!agency||agency.status!=="active")return false;
 }
 return true;
}
export function listingDTO(l:Listing,r:Revision,publicView:boolean){
 const value=listingDraftSchema.parse(r.data),data=publicView?publicListingPayload(value):value;
 return {id:l.id,status:l.status,version:l.version,publisher:l.publisher,agencyId:l.agencyId,revisionId:r.id,
  revisionStatus:publicView?undefined:r.status,revisionReason:publicView?undefined:r.reason,currentRevisionId:publicView?undefined:l.currentRevisionId,
  approvedRevisionId:l.approvedRevisionId,lastConfirmedAt:l.lastConfirmedAt,publishedAt:l.publishedAt,
  data,photos:data.photoIds.map(id=>({id,url:"/v1/photos/"+id}))};
}
export function registerListingRoutes(app:FastifyInstance,db:Database){
 app.post("/v1/listings",async request=>{
  const actor=await requireActor(db,request,"user"),user=await requireVerified(db,actor),input=parse(createListingSchema,request.body);
  if(input.publisher==="agency"){
   if(!input.agencyId)throw new HttpProblem(422,"AGENCY_REQUIRED");
   await requireAgencyMember(db,actor,input.agencyId,["owner","manager","agent"]);
  }else if(input.agencyId||!canSubmitListing({verified:true,advertiserEnabled:user.advertiserEnabled,independentAgentApproved:user.independentAgentStatus==="approved"},input.publisher))
   throw new HttpProblem(403,"ADVERTISER_PERMISSION_REQUIRED");
  return db.transaction(async tx=>{
   const where=and(eq(schema.listings.authorId,actor.id),eq(schema.listings.clientRequestId,input.clientRequestId));
   const [prior]=await tx.select().from(schema.listings).where(where).limit(1);
   if(prior)return {id:prior.id,status:prior.status,version:prior.version,reused:true};
   const [l]=await tx.insert(schema.listings).values({authorId:actor.id,publisher:input.publisher,agencyId:input.agencyId||null,clientRequestId:input.clientRequestId}).onConflictDoNothing().returning();
   if(!l){
    const [again]=await tx.select().from(schema.listings).where(where);
    if(!again)throw new HttpProblem(409,"CREATE_RETRY");return {id:again.id,status:again.status,version:again.version,reused:true};
   }
   const [r]=await tx.insert(schema.revisions).values({listingId:l.id,sequence:1,data:listingDraftSchema.parse({propertyType:input.propertyType,transactionType:input.transactionType})}).returning();
   await tx.update(schema.listings).set({currentRevisionId:r.id}).where(eq(schema.listings.id,l.id));
   await tx.insert(schema.audit).values({actorType:"user",actorId:actor.id,action:"listing_draft_created",targetType:"listing",targetId:l.id});
   return {id:l.id,status:"draft",version:1,reused:false};
  });
 });
 app.get("/v1/listings/mine",async request=>{
  const actor=await requireActor(db,request,"user");
  const rows=await db.select().from(schema.listings).where(eq(schema.listings.authorId,actor.id)).orderBy(desc(schema.listings.updatedAt)).limit(100);
  const items=[];for(const l of rows){const revId=l.currentRevisionId||l.approvedRevisionId;const rev=revId?await getRevision(db,revId):null;items.push({id:l.id,status:l.status,version:l.version,agencyId:l.agencyId,updatedAt:l.updatedAt,title:rev?listingDraftSchema.parse(rev.data).title:""});}return {items};
 });
 app.get<{Params:{agencyId:string}}>("/v1/agencies/:agencyId/listings",async request=>{
  const actor=await requireActor(db,request,"user"),agencyId=validId(request.params.agencyId);
  const member=await requireAgencyMember(db,actor,agencyId,["owner","manager","agent"]);
  const clauses=[eq(schema.listings.agencyId,agencyId)];
  if(member.role==="agent")clauses.push(eq(schema.listings.authorId,actor.id));
  const rows=await db.select().from(schema.listings).where(and(...clauses)).orderBy(desc(schema.listings.updatedAt)).limit(100);
  return {items:rows.map(l=>({id:l.id,status:l.status,version:l.version,agencyId:l.agencyId,updatedAt:l.updatedAt}))};
 });
 app.get<{Params:{id:string}}>("/v1/listings/:id",async request=>{
  const l=await getListing(db,request.params.id);await requireEditor(db,request,l);
  const r=await getRevision(db,l.currentRevisionId||l.approvedRevisionId||"");
  const approved=l.approvedRevisionId?listingDraftSchema.parse((await getRevision(db,l.approvedRevisionId)).data):null;
  return {...listingDTO(l,r,false),approvedData:approved};
 });
 app.put<{Params:{id:string}}>("/v1/listings/:id/draft",async request=>{
  const l=await getListing(db,request.params.id);await requireEditor(db,request,l);
  const input=parse(saveDraftSchema,request.body);
  return db.transaction(async tx=>{
   const [lock]=await tx.select().from(schema.listings).where(eq(schema.listings.id,l.id)).for("update");
   if(!lock||lock.version!==input.expectedVersion)throw new HttpProblem(409,"STALE_LISTING_VERSION");
   if(["sold","rented","archived"].includes(lock.status))throw new HttpProblem(409,"LISTING_IS_CLOSED");
   const [old]=lock.currentRevisionId?await tx.select().from(schema.revisions).where(eq(schema.revisions.id,lock.currentRevisionId)):[];
   if(old?.status==="submitted")throw new HttpProblem(409,"REVISION_UNDER_REVIEW");
   let rid=old?.id;
   if(old?.status==="draft")await tx.update(schema.revisions).set({data:input.data}).where(eq(schema.revisions.id,old.id));
   else{const [r]=await tx.insert(schema.revisions).values({listingId:l.id,sequence:lock.version+1,data:input.data}).returning();rid=r.id;}
   const [updated]=await tx.update(schema.listings).set({currentRevisionId:rid,version:lock.version+1,updatedAt:new Date(),status:lock.approvedRevisionId?lock.status:"draft"})
    .where(and(eq(schema.listings.id,l.id),eq(schema.listings.version,input.expectedVersion))).returning();
   if(!updated)throw new HttpProblem(409,"STALE_LISTING_VERSION");
   return {id:l.id,version:updated.version,status:updated.status,revisionId:rid};
  });
 });
 app.post<{Params:{id:string}}>("/v1/listings/:id/submit",async request=>{
  const l=await getListing(db,request.params.id),actor=await requireEditor(db,request,l);
  const input=parse(listingSubmitSchema,request.body);
  return db.transaction(async tx=>{
   const [lock]=await tx.select().from(schema.listings).where(eq(schema.listings.id,l.id)).for("update");
   if(!lock||lock.version!==input.expectedVersion)throw new HttpProblem(409,"STALE_LISTING_VERSION");
   if(!lock.currentRevisionId)throw new HttpProblem(409,"NO_EDITABLE_REVISION");
   const [r]=await tx.select().from(schema.revisions).where(eq(schema.revisions.id,lock.currentRevisionId));
   if(r?.status==="submitted")return {id:l.id,status:"pending_review",version:lock.version,reused:true};
   if(r?.status!=="draft")throw new HttpProblem(409,"NO_EDITABLE_REVISION");
   const v=listingSubmissionSchema.safeParse(r.data);
   if(!v.success)throw new HttpProblem(422,"LISTING_VALIDATION_FAILED",JSON.stringify(v.error.issues.map(i=>({path:i.path,message:i.message}))));
   const p=await tx.select({id:schema.photos.id}).from(schema.photos).where(and(eq(schema.photos.listingId,l.id),inArray(schema.photos.id,v.data.photoIds)));
   if(p.length!==v.data.photoIds.length||new Set(v.data.photoIds).size!==p.length)throw new HttpProblem(422,"PHOTO_OWNERSHIP_MISMATCH");
   if(!lock.approvedRevisionId&&!lock.agencyId){
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${actor.id}::text))`);
    const [num]=await tx.select({count:sql.raw("count(*)::integer")}).from(schema.listings)
     .where(and(eq(schema.listings.authorId,actor.id),inArray(schema.listings.status,["pending_review","published","paused"])));
    if(Number(num?.count||0)>=3)throw new HttpProblem(409,"FREE_LISTING_LIMIT_REACHED");
   }
   await tx.update(schema.revisions).set({status:"submitted"}).where(eq(schema.revisions.id,r.id));
   await tx.update(schema.listings).set({status:lock.approvedRevisionId?lock.status:"pending_review",updatedAt:new Date()}).where(eq(schema.listings.id,l.id));
   await tx.insert(schema.audit).values({actorType:"user",actorId:actor.id,action:"listing_submitted",targetType:"listing",targetId:l.id,reason:r.id});
   return {id:l.id,status:"pending_review",version:lock.version,revisionId:r.id,reused:false};
  });
 });
 app.post<{Params:{id:string}}>("/v1/listings/:id/withdraw",async request=>{
  const l=await getListing(db,request.params.id);await requireEditor(db,request,l);
  return db.transaction(async tx=>{
   const [lock]=await tx.select().from(schema.listings).where(eq(schema.listings.id,l.id)).for("update");
   if(!lock?.currentRevisionId)throw new HttpProblem(409,"NO_PENDING_REVIEW");
   const [r]=await tx.update(schema.revisions).set({status:"withdrawn"}).where(and(eq(schema.revisions.id,lock.currentRevisionId),eq(schema.revisions.status,"submitted"))).returning();
   if(!r)throw new HttpProblem(409,"NO_PENDING_REVIEW");
   await tx.update(schema.listings).set({status:lock.approvedRevisionId?lock.status:"draft",version:lock.version+1,updatedAt:new Date()}).where(eq(schema.listings.id,l.id));
   return {status:"withdrawn"};
  });
 });
 app.post<{Params:{id:string}}>("/v1/listings/:id/pause",async request=>{
  const l=await getListing(db,request.params.id),actor=await requireEditor(db,request,l);
  const [row]=await db.update(schema.listings).set({status:"paused",updatedAt:new Date()})
    .where(and(eq(schema.listings.id,l.id),eq(schema.listings.status,"published"))).returning();
  if(!row)throw new HttpProblem(409,"LISTING_NOT_PUBLISHED");
  await db.insert(schema.audit).values({actorType:"user",actorId:actor.id,action:"listing_paused",targetType:"listing",targetId:l.id});
  return {status:row.status};
 });
 app.post<{Params:{id:string}}>("/v1/listings/:id/resume",async request=>{
  const l=await getListing(db,request.params.id),actor=await requireEditor(db,request,l);
  const [row]=await db.update(schema.listings).set({status:"published",lastConfirmedAt:new Date(),updatedAt:new Date()})
    .where(and(eq(schema.listings.id,l.id),eq(schema.listings.status,"paused"))).returning();
  if(!row||!row.approvedRevisionId)throw new HttpProblem(409,"LISTING_NOT_PAUSED");
  await db.insert(schema.audit).values({actorType:"user",actorId:actor.id,action:"listing_resumed",targetType:"listing",targetId:l.id});
  return {status:row.status};
 });
 app.post<{Params:{id:string}}>("/v1/listings/:id/confirm-availability",async request=>{
  const l=await getListing(db,request.params.id),actor=await requireEditor(db,request,l);
  const [row]=await db.update(schema.listings).set({lastConfirmedAt:new Date(),updatedAt:new Date()})
    .where(and(eq(schema.listings.id,l.id),eq(schema.listings.status,"published"))).returning();
  if(!row)throw new HttpProblem(409,"LISTING_NOT_PUBLISHED");
  await db.insert(schema.audit).values({actorType:"user",actorId:actor.id,action:"listing_availability_confirmed",targetType:"listing",targetId:l.id});
  return {lastConfirmedAt:row.lastConfirmedAt};
 });
 app.post<{Params:{id:string}}>("/v1/listings/:id/close",async request=>{
  const l=await getListing(db,request.params.id),actor=await requireEditor(db,request,l);
  const input=parse(z.object({outcome:z.enum(["sold","rented"])}).strict(),request.body);
  const [row]=await db.update(schema.listings).set({status:input.outcome,updatedAt:new Date()})
    .where(and(eq(schema.listings.id,l.id),inArray(schema.listings.status,["published","paused"]))).returning();
  if(!row)throw new HttpProblem(409,"LISTING_NOT_ACTIVE");
  await db.insert(schema.audit).values({actorType:"user",actorId:actor.id,action:"listing_closed",targetType:"listing",targetId:l.id,reason:input.outcome});
  return {status:row.status};
 });
 app.get("/v1/properties",async request=>{
  const q=parse(z.object({provinceId:z.string().max(50).optional(),limit:z.coerce.number().int().min(1).max(30).default(12)}),request.query);
  const rows=await db.select().from(schema.listings).where(and(eq(schema.listings.status,"published"),gt(schema.listings.lastConfirmedAt,new Date(Date.now()-30*86400_000))))
    .orderBy(desc(schema.listings.publishedAt),desc(schema.listings.id)).limit(150);
  const items=[];
  for(const l of rows){
   if(!l.approvedRevisionId || !await canShowPublic(db,l))continue;
   const r=await getRevision(db,l.approvedRevisionId),data=listingDraftSchema.parse(r.data);
   if(q.provinceId && data.location.provinceId!==q.provinceId)continue;
   items.push(listingDTO(l,r,true));if(items.length>=q.limit)break;
  }
  return {items};
 });
 app.get<{Params:{id:string}}>("/v1/properties/:id",async request=>{
  const l=await getListing(db,request.params.id);
  if(!l.approvedRevisionId||!["published","paused","sold","rented"].includes(l.status)||!await canShowPublic(db,l))throw new HttpProblem(404,"PROPERTY_NOT_PUBLIC");
  const r=await getRevision(db,l.approvedRevisionId);
  return {...listingDTO(l,r,true),available:l.status==="published"&&!!l.lastConfirmedAt&&Date.now()-l.lastConfirmedAt.getTime()<30*86400_000};
 });
 app.get("/v1/admin/listings/review-queue",async request=>{
  const actor=await requireActor(db,request,"staff");requireStaffRole(actor,["moderator","admin","super_admin"]);
  const revs=await db.select().from(schema.revisions).where(eq(schema.revisions.status,"submitted")).orderBy(desc(schema.revisions.createdAt)).limit(100);
  const items=[];for(const r of revs){const l=await getListing(db,r.listingId);if(l.currentRevisionId===r.id)items.push({...listingDTO(l,r,false),submittedAt:r.createdAt});}
  return {items};
 });
 app.post<{Params:{id:string}}>("/v1/admin/listings/:id/decision",async request=>{
  const actor=await requireActor(db,request,"staff");requireStaffRole(actor,["moderator","admin","super_admin"]);
  const listingId=validId(request.params.id),input=parse(reviewDecisionSchema,request.body);
  return db.transaction(async tx=>{
   const [l]=await tx.select().from(schema.listings).where(eq(schema.listings.id,listingId)).for("update");
   if(!l||l.currentRevisionId!==input.revisionId)throw new HttpProblem(409,"REVIEW_CONFLICT");
   const [r]=await tx.update(schema.revisions).set({status:input.decision==="approve"?"approved":"rejected",moderatorId:actor.id,reason:input.reason,reviewedAt:new Date()})
    .where(and(eq(schema.revisions.id,input.revisionId),eq(schema.revisions.listingId,listingId),eq(schema.revisions.status,"submitted"))).returning();
   if(!r)throw new HttpProblem(409,"REVIEW_CONFLICT");
   const status:Listing["status"]=input.decision==="reject"?(l.approvedRevisionId?l.status:"rejected"):(l.status==="paused"?"paused":"published");
   await tx.update(schema.listings).set({status,version:l.version+1,updatedAt:new Date(),
    currentRevisionId:input.decision==="approve"?null:r.id,approvedRevisionId:input.decision==="approve"?r.id:l.approvedRevisionId,
    publishedAt:input.decision==="approve"?(l.publishedAt||new Date()):l.publishedAt,
    lastConfirmedAt:input.decision==="approve"?new Date():l.lastConfirmedAt}).where(eq(schema.listings.id,listingId));
   await tx.insert(schema.audit).values({actorType:"staff",actorId:actor.id,action:"listing_"+input.decision,targetType:"listing",targetId:listingId,reason:input.reason+" revision "+r.id});
   return {id:listingId,status,revisionId:r.id};
  });
 });
}
