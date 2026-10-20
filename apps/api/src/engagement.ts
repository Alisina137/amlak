import {and,desc,eq,gt,inArray,or,sql} from "drizzle-orm";
import type {FastifyInstance,FastifyRequest} from "fastify";
import {z} from "zod";
import {type Database,schema} from "@amlaklink/database";
import {listingDraftSchema} from "@amlaklink/contracts";
import {HttpProblem,requireActor,requireAgencyMember,requireVerified,type Actor} from "./access";
import {canShowPublic,getListing,getRevision,validId} from "./listings";
type Inquiry=typeof schema.inquiries.$inferSelect;
type Viewing=typeof schema.viewings.$inferSelect;
const key=z.uuid(),sentence=z.string().trim().min(1).max(3000);
const messageInput=z.object({clientRequestId:key,body:sentence}).strict();
const inquiryInput=z.object({clientRequestId:key,body:sentence}).strict();
const viewingInput=z.object({
 clientRequestId:key,proposedSlots:z.array(z.string().datetime({offset:true})).min(2).max(3),
 note:z.string().trim().max(500).optional()
}).strict();
const decisionInput=z.object({
 expectedVersion:z.number().int().positive(),
 action:z.enum(["confirm","counter","accept_counter","decline","cancel","complete","no_show"]),
 slot:z.string().datetime({offset:true}).optional()
}).strict();
const leadInput=z.object({status:z.enum(["new","contacted","viewing","negotiating","won","lost","archived"])}).strict();
function parse<T>(contract:z.ZodType<T>,body:unknown):T{
 const result=contract.safeParse(body);
 if(!result.success)throw new HttpProblem(422,"INVALID_INPUT");
 return result.data;
}
const selectionMax=100;
function slotsValid(slots:string[]){
 const timestamps=slots.map(s=>new Date(s).getTime()),now=Date.now();
 return timestamps.every(s=>Number.isFinite(s)&&s>now+30*60_000&&s<now+45*86400_000)&&new Set(timestamps).size===timestamps.length;
}
async function alert(db:Database,recipientId:string,kind:string,referenceId:string,key:string,title:string){
 await db.insert(schema.notifications).values({userId:recipientId,kind,referenceId,dedupeKey:key,title}).onConflictDoNothing();
}
async function checkBlocks(db:Database,a:string,b:string){
 const [block]=await db.select().from(schema.userBlocks).where(or(
  and(eq(schema.userBlocks.blockerId,a),eq(schema.userBlocks.blockedId,b)),
  and(eq(schema.userBlocks.blockerId,b),eq(schema.userBlocks.blockedId,a))
 )).limit(1);
 if(block)throw new HttpProblem(403,"CONVERSATION_BLOCKED");
}
async function checkConversationBlocks(db:Database,thread:Inquiry,actorId:string){
 await checkBlocks(db,thread.seekerId,thread.advertiserId);
 if(thread.assignedTo && thread.assignedTo!==thread.advertiserId)await checkBlocks(db,thread.seekerId,thread.assignedTo);
 if(actorId!==thread.seekerId && actorId!==thread.advertiserId && actorId!==thread.assignedTo)
  await checkBlocks(db,thread.seekerId,actorId);
}
async function lookup(db:Database,id:string){
 const [row]=await db.select().from(schema.inquiries).where(eq(schema.inquiries.id,validId(id))).limit(1);
 if(!row)throw new HttpProblem(404,"INQUIRY_NOT_FOUND");
 return row;
}
type Granted={side:"seeker"|"advertiser";role:"seeker"|"owner"|"manager"|"agent";actor:Actor};
async function access(db:Database,request:FastifyRequest,thread:Inquiry):Promise<Granted>{
 const actor=await requireActor(db,request,"user");await requireVerified(db,actor);
 if(actor.id===thread.seekerId)return {actor,side:"seeker",role:"seeker"};
 if(!thread.agencyId){
  if(actor.id!==thread.advertiserId)throw new HttpProblem(403,"INQUIRY_ACCESS_DENIED");
  return {actor,side:"advertiser",role:"owner"};
 }
 const member=await requireAgencyMember(db,actor,thread.agencyId,["owner","manager","agent"]);
 if(member.role==="agent"&&thread.assignedTo!==actor.id)
  throw new HttpProblem(403,"LEAD_NOT_ASSIGNED");
 return {actor,side:"advertiser",role:member.role};
}
async function validListing(db:Database,l:typeof schema.listings.$inferSelect){
 if(l.status!=="published"||!l.approvedRevisionId||!l.lastConfirmedAt||
  l.lastConfirmedAt.getTime()<Date.now()-30*86400_000||!await canShowPublic(db,l))
  throw new HttpProblem(409,"PROPERTY_NOT_AVAILABLE");
}
async function messageRecipients(db:Database,thread:Inquiry,exclude:string){
 if(!thread.agencyId)return [thread.advertiserId,thread.seekerId].filter(id=>id!==exclude);
 const active=await db.select({userId:schema.memberships.userId,role:schema.memberships.role})
  .from(schema.memberships).where(and(eq(schema.memberships.agencyId,thread.agencyId),eq(schema.memberships.status,"active")));
 const people=active.filter(m=>m.role!=="agent"||m.userId===thread.assignedTo).map(m=>m.userId);
 return [...new Set([thread.seekerId,...people])].filter(id=>id!==exclude);
}
async function notifyOthers(db:Database,thread:Inquiry,exclude:string,kind:string,nonce:string,title:string,referenceId=thread.id){
 for(const recipient of await messageRecipients(db,thread,exclude))
  await alert(db,recipient,kind,referenceId,kind+":"+nonce,title);
}
async function listAccessible(db:Database,actor:Actor){
 const memberships=await db.select().from(schema.memberships).innerJoin(schema.agencies,eq(schema.agencies.id,schema.memberships.agencyId))
  .where(and(eq(schema.memberships.userId,actor.id),eq(schema.memberships.status,"active"),eq(schema.agencies.status,"active")));
 const managerAgencies=memberships.filter(x=>["owner","manager"].includes(x.agency_memberships.role)).map(x=>x.agency_memberships.agencyId);
 const agentAgencies=memberships.filter(x=>x.agency_memberships.role==="agent").map(x=>x.agency_memberships.agencyId);
 const filters=[eq(schema.inquiries.seekerId,actor.id),eq(schema.inquiries.advertiserId,actor.id),eq(schema.inquiries.assignedTo,actor.id)];
 if(managerAgencies.length)filters.push(inArray(schema.inquiries.agencyId,managerAgencies));
 const rows=await db.select().from(schema.inquiries).where(or(...filters)).orderBy(desc(schema.inquiries.lastMessageAt)).limit(selectionMax);
 return rows.filter(row=>row.seekerId===actor.id ||
  (!row.agencyId && row.advertiserId===actor.id) ||
  (row.agencyId && (managerAgencies.includes(row.agencyId) ||
    (agentAgencies.includes(row.agencyId) && row.assignedTo===actor.id))));
}
async function getViewing(db:Database,id:string){
 const [row]=await db.select().from(schema.viewings).where(eq(schema.viewings.id,validId(id))).limit(1);
 if(!row)throw new HttpProblem(404,"VIEWING_NOT_FOUND");return row;
}
export function registerEngagementRoutes(app:FastifyInstance,db:Database){
 app.post<{Params:{id:string}}>("/v1/properties/:id/inquiries",{config:{rateLimit:{max:8,timeWindow:"1 minute"}}},async request=>{
  const actor=await requireActor(db,request,"user");await requireVerified(db,actor);
  const input=parse(inquiryInput,request.body),l=await getListing(db,request.params.id);
  await validListing(db,l);
  if(l.authorId===actor.id)throw new HttpProblem(403,"CANNOT_INQUIRE_OWN_LISTING");
  if(l.agencyId){
   const [member]=await db.select().from(schema.memberships).where(and(eq(schema.memberships.agencyId,l.agencyId),
     eq(schema.memberships.userId,actor.id),eq(schema.memberships.status,"active"))).limit(1);
   if(member)throw new HttpProblem(403,"CANNOT_INQUIRE_OWN_AGENCY");
  }
  await checkBlocks(db,actor.id,l.authorId);
  const price=listingDraftSchema.parse((await getRevision(db,l.approvedRevisionId!)).data).price;
  // A first inquiry and its first message must commit as one unit.
  const outcome=await db.transaction(async tx=>{
   const [created]=await tx.insert(schema.inquiries).values({
    seekerId:actor.id,listingId:l.id,advertiserId:l.authorId,agencyId:l.agencyId,
    requestId:input.clientRequestId,priceSnapshot:price
   }).onConflictDoNothing().returning();
   if(!created){
    const [existing]=await tx.select().from(schema.inquiries).where(and(eq(schema.inquiries.seekerId,actor.id),
      eq(schema.inquiries.listingId,l.id))).limit(1);
    if(!existing)throw new HttpProblem(409,"INQUIRY_RETRY");
    return {id:existing.id,status:existing.status,reused:true};
   }
   await tx.insert(schema.messages).values({inquiryId:created.id,authorId:actor.id,
    clientRequestId:input.clientRequestId,body:input.body});
   return {id:created.id,status:"new" as const,reused:false};
  });
  if(!outcome.reused){
   const row=await lookup(db,outcome.id);
   await notifyOthers(db,row,actor.id,"inquiry",row.id,"New inquiry about your property")
    .catch(error=>app.log.warn({error},"Inquiry created but in-app notification was not delivered"));
  }
  return outcome;
 });
 app.get("/v1/inquiries",async request=>{
  const actor=await requireActor(db,request,"user");await requireVerified(db,actor);
  const rows=await listAccessible(db,actor);
  const result=[];
  for(const row of rows){
   const l=await getListing(db,row.listingId);
   const revision=l.approvedRevisionId?await getRevision(db,l.approvedRevisionId):null;
   result.push({id:row.id,listingId:row.listingId,title:revision?listingDraftSchema.parse(revision.data).title:"Property",
    side:row.seekerId===actor.id?"seeker":"advertiser",status:row.status,leadStatus:row.leadStatus,
    assignedTo:row.assignedTo,agencyId:row.agencyId,lastMessageAt:row.lastMessageAt});
  }
  return {items:result};
 });
 app.get<{Params:{id:string}}>("/v1/inquiries/:id",async request=>{
  const row=await lookup(db,request.params.id),permission=await access(db,request,row);
  const [seeker]=await db.select({displayName:schema.users.displayName}).from(schema.users).where(eq(schema.users.id,row.seekerId));
  const [advertiser]=await db.select({displayName:schema.users.displayName}).from(schema.users).where(eq(schema.users.id,row.advertiserId));
  const l=await getListing(db,row.listingId),rev=l.approvedRevisionId?await getRevision(db,l.approvedRevisionId):null;
  const messages=await db.select({id:schema.messages.id,authorId:schema.messages.authorId,body:schema.messages.body,createdAt:schema.messages.createdAt})
   .from(schema.messages).where(eq(schema.messages.inquiryId,row.id)).orderBy(desc(schema.messages.createdAt)).limit(100);
  const appointments=await db.select().from(schema.viewings).where(eq(schema.viewings.inquiryId,row.id)).orderBy(desc(schema.viewings.createdAt)).limit(30);
  return {id:row.id,listingId:row.listingId,title:rev?listingDraftSchema.parse(rev.data).title:"Property",
   propertyStatus:l.status,side:permission.side,role:permission.role,seekerId:row.seekerId,
   seekerName:seeker?.displayName||"Seeker",advertiserId:row.advertiserId,advertiserName:advertiser?.displayName||"Advertiser",
   agencyId:row.agencyId,assignedTo:row.assignedTo,status:row.status,leadStatus:row.leadStatus,
   priceSnapshot:row.priceSnapshot,priceChanged:!!rev&&JSON.stringify(row.priceSnapshot)!==JSON.stringify(listingDraftSchema.parse(rev.data).price),
   messages:messages.reverse(),viewings:appointments};
 });
 // Mark only this actor's inquiry/message notifications as read when viewing the conversation.
 // Status updates and other kinds remain unread until inspected in Notifications.
 app.post<{Params:{id:string}}>("/v1/inquiries/:id/read-notifications",async request=>{
  const row=await lookup(db,request.params.id),permission=await access(db,request,row);
  await db.update(schema.notifications).set({isRead:true}).where(and(
   eq(schema.notifications.userId,permission.actor.id),
   eq(schema.notifications.referenceId,row.id),
   inArray(schema.notifications.kind,["inquiry","lead","message"])
  ));
  return {success:true};
 });
 app.post<{Params:{id:string}}>("/v1/inquiries/:id/messages",{config:{rateLimit:{max:20,timeWindow:"1 minute"}}},async request=>{
  const row=await lookup(db,request.params.id),permission=await access(db,request,row);
  const input=parse(messageInput,request.body);
  await checkConversationBlocks(db,row,permission.actor.id);
  const result=await db.transaction(async tx=>{
   const [locked]=await tx.select().from(schema.inquiries).where(eq(schema.inquiries.id,row.id)).for("update");
   if(!locked)throw new HttpProblem(404,"INQUIRY_NOT_FOUND");
   const [prior]=await tx.select().from(schema.messages).where(and(eq(schema.messages.inquiryId,row.id),
    eq(schema.messages.authorId,permission.actor.id),eq(schema.messages.clientRequestId,input.clientRequestId))).limit(1);
   if(prior)return {id:prior.id,reused:true};
   if(["closed","blocked"].includes(locked.status))throw new HttpProblem(409,"INQUIRY_CLOSED");
   const [created]=await tx.insert(schema.messages).values({inquiryId:row.id,authorId:permission.actor.id,
    clientRequestId:input.clientRequestId,body:input.body}).onConflictDoNothing().returning();
   if(!created)throw new HttpProblem(409,"MESSAGE_RETRY");
   await tx.update(schema.inquiries).set({status:permission.side==="seeker"?"open":"responded",
    lastMessageAt:new Date(),updatedAt:new Date()}).where(eq(schema.inquiries.id,row.id));
   return {id:created.id,reused:false};
  });
  if(!result.reused)await notifyOthers(db,row,permission.actor.id,"message",result.id,"New message about a property")
    .catch(error=>app.log.warn({error},"Message stored but in-app alert failed"));
  return result;
 });
 app.post<{Params:{id:string}}>("/v1/inquiries/:id/close",async request=>{
  const row=await lookup(db,request.params.id);await access(db,request,row);
  return db.transaction(async tx=>{
   const [locked]=await tx.select().from(schema.inquiries).where(eq(schema.inquiries.id,row.id)).for("update");
   if(!locked)throw new HttpProblem(404,"INQUIRY_NOT_FOUND");
   if(locked.status==="closed")return {status:"closed",reused:true};
   if(locked.status==="blocked")throw new HttpProblem(409,"INQUIRY_BLOCKED");
   await tx.update(schema.inquiries).set({status:"closed",updatedAt:new Date()}).where(eq(schema.inquiries.id,row.id));
   return {status:"closed",reused:false};
  });
 });
 app.post<{Params:{id:string}}>("/v1/inquiries/:id/reopen",async request=>{
  const row=await lookup(db,request.params.id),p=await access(db,request,row);
  if(p.side!=="seeker")throw new HttpProblem(403,"SEEKER_ONLY");
  await checkConversationBlocks(db,row,p.actor.id);
  await validListing(db,await getListing(db,row.listingId));
  await db.transaction(async tx=>{
   const [locked]=await tx.select().from(schema.inquiries).where(eq(schema.inquiries.id,row.id)).for("update");
   if(locked?.status!=="closed")throw new HttpProblem(409,"INQUIRY_NOT_CLOSED");
   await tx.update(schema.inquiries).set({status:"open",updatedAt:new Date()}).where(eq(schema.inquiries.id,row.id));
  });
  await notifyOthers(db,row,p.actor.id,"inquiry",row.id+":reopened","Property inquiry reopened");
  return {status:"open"};
 });
 app.post<{Params:{id:string}}>("/v1/inquiries/:id/viewings",{config:{rateLimit:{max:6,timeWindow:"1 minute"}}},async request=>{
  const inquiry=await lookup(db,request.params.id),permission=await access(db,request,inquiry);
  if(permission.side!=="seeker")throw new HttpProblem(403,"ONLY_SEEKER_REQUESTS_VIEWING");
  if(["blocked","closed"].includes(inquiry.status))throw new HttpProblem(409,"INQUIRY_CLOSED");
  await checkConversationBlocks(db,inquiry,permission.actor.id);
  await validListing(db,await getListing(db,inquiry.listingId));
  const input=parse(viewingInput,request.body);
  if(!slotsValid(input.proposedSlots))throw new HttpProblem(422,"INVALID_VIEWING_TIMES");
  const [created]=await db.insert(schema.viewings).values({inquiryId:inquiry.id,seekerId:inquiry.seekerId,
   clientRequestId:input.clientRequestId,proposedSlots:input.proposedSlots,note:input.note}).onConflictDoNothing().returning();
  if(!created){
   const [prior]=await db.select().from(schema.viewings).where(and(eq(schema.viewings.seekerId,inquiry.seekerId),
    eq(schema.viewings.clientRequestId,input.clientRequestId))).limit(1);
   if(!prior||prior.inquiryId!==inquiry.id)throw new HttpProblem(409,"VIEWING_RETRY_CONFLICT");
   return {id:prior.id,status:prior.status,version:prior.version,reused:true};
  }
  await notifyOthers(db,inquiry,permission.actor.id,"viewing",created.id,"New property viewing request",created.id);
  return {id:created.id,status:created.status,version:created.version,reused:false};
 });
 app.get("/v1/viewings",async request=>{
  const actor=await requireActor(db,request,"user");await requireVerified(db,actor);
  const mine=await listAccessible(db,actor),allowed=new Set(mine.map(i=>i.id));
  if(!allowed.size)return {items:[]};
  const rows=await db.select().from(schema.viewings).where(inArray(schema.viewings.inquiryId,[...allowed]))
   .orderBy(desc(schema.viewings.createdAt)).limit(100);
  return {items:rows};
 });
 // Mark this user's viewing notices read only after the actor is authorized for this viewing.
 app.post<{Params:{id:string}}>("/v1/viewings/:id/read-notifications",async request=>{
  const visit=await getViewing(db,request.params.id),thread=await lookup(db,visit.inquiryId),
   permission=await access(db,request,thread);
  await db.update(schema.notifications).set({isRead:true}).where(and(
   eq(schema.notifications.userId,permission.actor.id),
   eq(schema.notifications.kind,"viewing"),
   eq(schema.notifications.referenceId,visit.id)
  ));
  return {success:true};
 });
 app.post<{Params:{id:string}}>("/v1/viewings/:id/decision",async request=>{
  const v=await getViewing(db,request.params.id),thread=await lookup(db,v.inquiryId);
  const p=await access(db,request,thread),input=parse(decisionInput,request.body);
  await checkConversationBlocks(db,thread,p.actor.id);
  const outcome=await db.transaction(async tx=>{
   const [locked]=await tx.select().from(schema.viewings).where(eq(schema.viewings.id,v.id)).for("update");
   if(!locked||locked.version!==input.expectedVersion)throw new HttpProblem(409,"VIEWING_VERSION_CONFLICT");
   const action=input.action;
   let status:Viewing["status"]=locked.status;
   let confirmedSlot=locked.confirmedSlot,counterSlot=locked.counterSlot;
   if(action==="cancel"){
    if(!["requested","counterproposed","confirmed"].includes(status))throw new HttpProblem(409,"VIEWING_ALREADY_FINISHED");
    status="cancelled";
   }else if(p.side==="advertiser"){
    if(action==="confirm"&&status==="requested"&&input.slot&&locked.proposedSlots.some(s=>new Date(s).getTime()===new Date(input.slot!).getTime())){
     if(new Date(input.slot).getTime()<Date.now()+5*60_000)throw new HttpProblem(409,"VIEWING_TIME_PASSED");
     await validListing(db,await getListing(db,thread.listingId));
     confirmedSlot=new Date(input.slot);status="confirmed";
    }else if(action==="counter"&&["requested","counterproposed"].includes(status)&&input.slot && slotsValid([input.slot,new Date(Date.now()+40*60_000).toISOString()])){
     counterSlot=new Date(input.slot);status="counterproposed";
    }else if(action==="decline"&&["requested","counterproposed"].includes(status))status="declined";
    else if(action==="complete"&&status==="confirmed"&&confirmedSlot&&confirmedSlot.getTime()<=Date.now())status="completed";
    else if(action==="no_show"&&status==="confirmed"&&confirmedSlot&&confirmedSlot.getTime()<=Date.now())status="no_show";
    else throw new HttpProblem(409,"INVALID_VIEWING_TRANSITION");
   }else{
    if(action==="accept_counter"&&status==="counterproposed"&&counterSlot&&counterSlot.getTime()>Date.now()+5*60_000){
     await validListing(db,await getListing(db,thread.listingId));
     confirmedSlot=counterSlot;status="confirmed";
    }else throw new HttpProblem(403,"VIEWING_ACTION_NOT_ALLOWED");
   }
   // Lock the listing for atomic time-slot reservation across different inquiries.
   if(status==="confirmed" && confirmedSlot){
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${thread.listingId}::text))`);
    const booked=await tx.select({id:schema.viewings.id}).from(schema.viewings)
     .innerJoin(schema.inquiries,eq(schema.inquiries.id,schema.viewings.inquiryId))
     .where(and(eq(schema.inquiries.listingId,thread.listingId),eq(schema.viewings.status,"confirmed"),
       eq(schema.viewings.confirmedSlot,confirmedSlot))).limit(1);
    if(booked.length)throw new HttpProblem(409,"VIEWING_TIME_CONFLICT");
   }
   const [updated]=await tx.update(schema.viewings).set({status,counterSlot,confirmedSlot,version:locked.version+1,updatedAt:new Date()})
    .where(and(eq(schema.viewings.id,v.id),eq(schema.viewings.version,input.expectedVersion))).returning();
   if(!updated)throw new HttpProblem(409,"VIEWING_VERSION_CONFLICT");
   await tx.insert(schema.audit).values({actorType:"user",actorId:p.actor.id,action:"viewing_"+action,
    targetType:"viewing",targetId:v.id,reason:status});
   return {id:v.id,status,version:updated.version,confirmedSlot:updated.confirmedSlot,counterSlot:updated.counterSlot};
  });
  await notifyOthers(db,thread,p.actor.id,"viewing",v.id+":"+outcome.version,"Property viewing updated",v.id);
  return outcome;
 });
 app.post<{Params:{id:string}}>("/v1/inquiries/:id/assign",async request=>{
  const row=await lookup(db,request.params.id),p=await access(db,request,row);
  if(!row.agencyId||p.side!=="advertiser"||!["owner","manager"].includes(p.role))
   throw new HttpProblem(403,"AGENCY_MANAGER_REQUIRED");
  const input=parse(z.object({assignedTo:z.uuid().nullable()}).strict(),request.body);
  // The same agency lock is used when inviting, accepting or revoking members.
  // Never assign a lead to someone revoked between validation and the write.
  const result=await db.transaction(async tx=>{
   await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${row.agencyId}::text))`);
   const [manager]=await tx.select().from(schema.memberships).where(and(
    eq(schema.memberships.agencyId,row.agencyId!),
    eq(schema.memberships.userId,p.actor.id),eq(schema.memberships.status,"active"))).limit(1);
   if(!manager||!["owner","manager"].includes(manager.role))
    throw new HttpProblem(403,"AGENCY_MANAGER_REQUIRED");
   const [lockedLead]=await tx.select().from(schema.inquiries)
    .where(eq(schema.inquiries.id,row.id)).for("update");
   if(!lockedLead||lockedLead.agencyId!==row.agencyId)
    throw new HttpProblem(409,"INQUIRY_CHANGED");
   if(input.assignedTo){
    await checkBlocks(tx as unknown as Database,lockedLead.seekerId,input.assignedTo);
    const [member]=await tx.select().from(schema.memberships).where(and(
     eq(schema.memberships.userId,input.assignedTo),
     eq(schema.memberships.agencyId,row.agencyId!),
     eq(schema.memberships.status,"active"))).limit(1);
    if(!member||!["agent","manager","owner"].includes(member.role))
     throw new HttpProblem(422,"ASSIGNEE_NOT_ACTIVE");
   }
   if(lockedLead.assignedTo===input.assignedTo)return {changed:false};
   await tx.update(schema.inquiries).set({assignedTo:input.assignedTo,updatedAt:new Date()})
    .where(eq(schema.inquiries.id,row.id));
   await tx.insert(schema.audit).values({actorType:"user",actorId:p.actor.id,
    action:"lead_assigned",targetType:"inquiry",targetId:row.id});
   return {changed:true};
  });
  if(result.changed&&input.assignedTo)
   await alert(db,input.assignedTo,"lead",row.id,"lead:"+row.id+":"+input.assignedTo,
    "A property inquiry was assigned to you");
  return {assignedTo:input.assignedTo};
 });
 app.post<{Params:{id:string}}>("/v1/inquiries/:id/lead-status",async request=>{
  const row=await lookup(db,request.params.id),p=await access(db,request,row);
  if(p.side!=="advertiser")throw new HttpProblem(403,"ADVERTISER_ONLY");
  const input=parse(leadInput,request.body);
  await db.update(schema.inquiries).set({leadStatus:input.status,updatedAt:new Date()}).where(eq(schema.inquiries.id,row.id));
  await db.insert(schema.audit).values({actorType:"user",actorId:p.actor.id,action:"lead_status_changed",targetType:"inquiry",targetId:row.id,reason:input.status});
  return {leadStatus:input.status};
 });
 app.get<{Params:{id:string}}>("/v1/inquiries/:id/lead-notes",async request=>{
  const row=await lookup(db,request.params.id),p=await access(db,request,row);
  if(!row.agencyId||p.side!=="advertiser")throw new HttpProblem(403,"AGENCY_ONLY");
  const items=await db.select().from(schema.leadNotes).where(eq(schema.leadNotes.inquiryId,row.id)).orderBy(desc(schema.leadNotes.createdAt)).limit(50);
  return {items};
 });
 app.post<{Params:{id:string}}>("/v1/inquiries/:id/lead-notes",async request=>{
  const row=await lookup(db,request.params.id),p=await access(db,request,row);
  if(!row.agencyId||p.side!=="advertiser")throw new HttpProblem(403,"AGENCY_ONLY");
  const input=parse(z.object({body:z.string().trim().min(2).max(1000)}).strict(),request.body);
  const [note]=await db.insert(schema.leadNotes).values({inquiryId:row.id,agencyId:row.agencyId,
   authorId:p.actor.id,body:input.body}).returning();
  return {id:note.id};
 });
 app.get("/v1/notifications",async request=>{
  const p=await requireActor(db,request,"user");await requireVerified(db,p);
  const items=await db.select().from(schema.notifications).where(eq(schema.notifications.userId,p.id))
   .orderBy(desc(schema.notifications.createdAt)).limit(100);
  return {items,unread:items.filter(i=>!i.isRead).length};
 });
 app.post<{Params:{id:string}}>("/v1/notifications/:id/read",async request=>{
  const p=await requireActor(db,request,"user");await requireVerified(db,p);
  const [updated]=await db.update(schema.notifications).set({isRead:true}).where(and(eq(schema.notifications.id,validId(request.params.id)),
   eq(schema.notifications.userId,p.id))).returning({id:schema.notifications.id});
  if(!updated)throw new HttpProblem(404,"NOTIFICATION_NOT_FOUND");
  return {success:true};
 });
 app.post("/v1/notifications/read-all",async request=>{
  const p=await requireActor(db,request,"user");await requireVerified(db,p);
  await db.update(schema.notifications).set({isRead:true}).where(eq(schema.notifications.userId,p.id));
  return {success:true};
 });
 app.post<{Params:{id:string}}>("/v1/users/:id/block",async request=>{
  const p=await requireActor(db,request,"user"),blocked=validId(request.params.id);
  await requireVerified(db,p);
  if(blocked===p.id)throw new HttpProblem(422,"CANNOT_BLOCK_SELF");
  const [user]=await db.select({id:schema.users.id}).from(schema.users).where(eq(schema.users.id,blocked));
  if(!user)throw new HttpProblem(404,"USER_NOT_FOUND");
  await db.insert(schema.userBlocks).values({blockerId:p.id,blockedId:blocked}).onConflictDoNothing();
  return {blocked:true};
 });
 app.delete<{Params:{id:string}}>("/v1/users/:id/block",async request=>{
  const p=await requireActor(db,request,"user");await requireVerified(db,p);
  await db.delete(schema.userBlocks).where(and(eq(schema.userBlocks.blockerId,p.id),eq(schema.userBlocks.blockedId,validId(request.params.id))));
  return {blocked:false};
 });
}
