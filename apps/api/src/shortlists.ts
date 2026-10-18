import {and,asc,desc,eq,inArray,ne,sql} from "drizzle-orm";
import type {FastifyInstance} from "fastify";
import {z} from "zod";
import {type Database,schema} from "@amlaklink/database";
import {HttpProblem,requireActor,requireVerified} from "./access";
import {canShowPublic,getListing,getRevision,listingDTO,validId} from "./listings";
import {normalizeEmail} from "./security";

const make=z.object({title:z.string().trim().min(2).max(100)}).strict();
const invite=z.object({email:z.email().max(254)}).strict();
const addItem=z.object({listingId:z.uuid()}).strict();
const comment=z.object({vote:z.enum(["interested","pass"]),note:z.string().trim().max(500).default("")}).strict();
function parse<T>(schemaValue:z.ZodType<T>,data:unknown):T{
 const parsed=schemaValue.safeParse(data);
 if(!parsed.success)throw new HttpProblem(422,"VALIDATION_ERROR");
 return parsed.data;
}
const DAY=86_400_000,MAX_MEMBERS=5,MAX_ITEMS=30;

export async function shortlistAccess(db:Database,id:string,userId:string,ownerOnly=false){
 const [list]=await db.select().from(schema.shortlists).where(eq(schema.shortlists.id,validId(id))).limit(1);
 if(!list)throw new HttpProblem(404,"SHORTLIST_NOT_FOUND");
 if(list.ownerId===userId)return {list,owner:true};
 if(ownerOnly)throw new HttpProblem(404,"SHORTLIST_NOT_FOUND");
 const [member]=await db.select().from(schema.shortlistMembers).where(and(
   eq(schema.shortlistMembers.shortlistId,id),eq(schema.shortlistMembers.userId,userId),
   eq(schema.shortlistMembers.status,"active"))).limit(1);
 if(!member)throw new HttpProblem(404,"SHORTLIST_NOT_FOUND");
 return {list,owner:false};
}
async function eligible(db:Database,listingId:string){
 const l=await getListing(db,listingId);
 if(l.status!=="published"||l.safetyHold||!l.approvedRevisionId||!l.lastConfirmedAt
   ||l.lastConfirmedAt.getTime()<=Date.now()-30*DAY||!await canShowPublic(db,l))
  throw new HttpProblem(404,"PROPERTY_NOT_AVAILABLE");
 return l;
}

export function registerShortlistRoutes(app:FastifyInstance,db:Database){
 app.get("/v1/shortlists",async request=>{
  const actor=await requireActor(db,request,"user");
  const owned=await db.select().from(schema.shortlists)
   .where(eq(schema.shortlists.ownerId,actor.id)).orderBy(desc(schema.shortlists.createdAt)).limit(30);
  const invited=await db.select({list:schema.shortlists,status:schema.shortlistMembers.status})
   .from(schema.shortlistMembers).innerJoin(schema.shortlists,eq(schema.shortlists.id,schema.shortlistMembers.shortlistId))
   .where(and(eq(schema.shortlistMembers.userId,actor.id),inArray(schema.shortlistMembers.status,["pending","active"])))
   .orderBy(desc(schema.shortlistMembers.createdAt)).limit(30);
  return {items:[...owned.map(l=>({...l,role:"owner",membershipStatus:"active"})),
   ...invited.map(r=>({...r.list,role:"member",membershipStatus:r.status}))]};
 });
 app.post("/v1/shortlists",async request=>{
  const actor=await requireActor(db,request,"user");await requireVerified(db,actor);
  const {title}=parse(make,request.body);
  return db.transaction(async tx=>{
   await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${actor.id}::text))`);
   const [c]=await tx.select({n:sql<number>`count(*)::integer`}).from(schema.shortlists)
    .where(eq(schema.shortlists.ownerId,actor.id));
   if(Number(c?.n||0)>=20)throw new HttpProblem(409,"SHORTLIST_LIMIT_REACHED");
   const [row]=await tx.insert(schema.shortlists).values({ownerId:actor.id,title}).returning();
   return {...row,role:"owner",membershipStatus:"active"};
  });
 });
 app.get<{Params:{id:string}}>("/v1/shortlists/:id",async request=>{
  const actor=await requireActor(db,request,"user"),id=validId(request.params.id);
  const {list,owner}=await shortlistAccess(db,id,actor.id);
  const members=await db.select({id:schema.shortlistMembers.id,userId:schema.shortlistMembers.userId,
   displayName:schema.users.displayName,status:schema.shortlistMembers.status})
   .from(schema.shortlistMembers).innerJoin(schema.users,eq(schema.users.id,schema.shortlistMembers.userId))
   .where(and(eq(schema.shortlistMembers.shortlistId,id),ne(schema.shortlistMembers.status,"revoked")))
   .orderBy(asc(schema.shortlistMembers.createdAt));
  const rows=await db.select().from(schema.shortlistItems)
   .where(eq(schema.shortlistItems.shortlistId,id)).orderBy(desc(schema.shortlistItems.createdAt)).limit(MAX_ITEMS);
  const items=[];
  for(const item of rows){
   const [l]=await db.select().from(schema.listings).where(eq(schema.listings.id,item.listingId)).limit(1);
   let property=null;
   if(l&&l.approvedRevisionId&&l.status==="published"&&!l.safetyHold&&l.lastConfirmedAt
      &&l.lastConfirmedAt.getTime()>Date.now()-30*DAY&&await canShowPublic(db,l))
     property=listingDTO(l,await getRevision(db,l.approvedRevisionId),true);
   const votes=await db.select({userId:schema.shortlistVotes.userId,vote:schema.shortlistVotes.vote,
    note:schema.shortlistVotes.note}).from(schema.shortlistVotes).where(eq(schema.shortlistVotes.itemId,item.id));
   // Hidden/deleted listings retain only a non-revealing unavailable placeholder.
   items.push({id:item.id,listingId:item.listingId,addedBy:item.addedBy,createdAt:item.createdAt,
    available:!!property,property,votes});
  }
  return {id:list.id,title:list.title,ownerId:list.ownerId,isOwner:owner,
   members:[{userId:list.ownerId,displayName:"Owner",status:"active",id:null},...members],items};
 });
 app.post<{Params:{id:string}}>("/v1/shortlists/:id/invitations",async request=>{
  const actor=await requireActor(db,request,"user");await requireVerified(db,actor);
  const id=validId(request.params.id);await shortlistAccess(db,id,actor.id,true);
  const {email}=parse(invite,request.body);
  const [person]=await db.select({id:schema.users.id,status:schema.users.status,
   verified:schema.users.emailVerifiedAt}).from(schema.users)
   .where(eq(schema.users.email,normalizeEmail(email))).limit(1);
  if(!person||person.status!=="active"||!person.verified)throw new HttpProblem(404,"VERIFIED_USER_NOT_FOUND");
  if(person.id===actor.id)throw new HttpProblem(422,"OWNER_ALREADY_INCLUDED");
  return db.transaction(async tx=>{
   // Serialize invitations even when multiple owner devices submit simultaneously.
   await tx.select().from(schema.shortlists).where(eq(schema.shortlists.id,id)).for("update");
   const [count]=await tx.select({n:sql<number>`count(*)::integer`}).from(schema.shortlistMembers)
    .where(and(eq(schema.shortlistMembers.shortlistId,id),
     inArray(schema.shortlistMembers.status,["pending","active"])));
   const [prior]=await tx.select().from(schema.shortlistMembers)
    .where(and(eq(schema.shortlistMembers.shortlistId,id),eq(schema.shortlistMembers.userId,person.id))).limit(1);
   if(prior&&prior.status!=="revoked")throw new HttpProblem(409,"INVITATION_EXISTS");
   if(Number(count?.n||0)>=MAX_MEMBERS-1)throw new HttpProblem(409,"SHORTLIST_MEMBER_LIMIT");
   if(prior)await tx.update(schema.shortlistMembers).set({status:"pending",joinedAt:null})
    .where(eq(schema.shortlistMembers.id,prior.id));
   else await tx.insert(schema.shortlistMembers).values({shortlistId:id,userId:person.id,status:"pending"});
   await tx.insert(schema.audit).values({actorType:"user",actorId:actor.id,
    action:"shortlist_member_invited",targetType:"shortlist",targetId:id});
   return {status:"pending"};
  });
 });
 app.post<{Params:{id:string}}>("/v1/shortlists/:id/accept",async request=>{
  const actor=await requireActor(db,request,"user");await requireVerified(db,actor);
  const id=validId(request.params.id);
  const [changed]=await db.update(schema.shortlistMembers)
   .set({status:"active",joinedAt:new Date()})
   .where(and(eq(schema.shortlistMembers.shortlistId,id),eq(schema.shortlistMembers.userId,actor.id),
    eq(schema.shortlistMembers.status,"pending"))).returning({id:schema.shortlistMembers.id});
  if(!changed)throw new HttpProblem(404,"INVITATION_NOT_FOUND");
  return {accepted:true};
 });
 app.delete<{Params:{id:string;userId:string}}>("/v1/shortlists/:id/members/:userId",async request=>{
  const actor=await requireActor(db,request,"user"),id=validId(request.params.id),target=validId(request.params.userId);
  const {list,owner}=await shortlistAccess(db,id,actor.id);
  if(!owner&&target!==actor.id)throw new HttpProblem(403,"OWNER_REQUIRED");
  if(list.ownerId===target)throw new HttpProblem(403,"CANNOT_REMOVE_OWNER");
  const updated=await db.update(schema.shortlistMembers).set({status:"revoked"})
   .where(and(eq(schema.shortlistMembers.shortlistId,id),eq(schema.shortlistMembers.userId,target),
     ne(schema.shortlistMembers.status,"revoked"))).returning({id:schema.shortlistMembers.id});
  if(!updated.length)throw new HttpProblem(404,"MEMBER_NOT_FOUND");
  return {revoked:true};
 });
 app.post<{Params:{id:string}}>("/v1/shortlists/:id/items",async request=>{
  const actor=await requireActor(db,request,"user"),id=validId(request.params.id);
  await shortlistAccess(db,id,actor.id);
  const {listingId}=parse(addItem,request.body);
  await eligible(db,listingId);
  return db.transaction(async tx=>{
   await tx.select().from(schema.shortlists).where(eq(schema.shortlists.id,id)).for("update");
   // Check access inside lock to prevent a concurrent revocation from being ignored.
   await shortlistAccess(tx as unknown as Database,id,actor.id);
   const [count]=await tx.select({n:sql<number>`count(*)::integer`}).from(schema.shortlistItems)
    .where(eq(schema.shortlistItems.shortlistId,id));
   const [existing]=await tx.select().from(schema.shortlistItems)
    .where(and(eq(schema.shortlistItems.shortlistId,id),eq(schema.shortlistItems.listingId,listingId))).limit(1);
   if(existing)return {...existing,reused:true};
   if(Number(count?.n||0)>=MAX_ITEMS)throw new HttpProblem(409,"SHORTLIST_ITEM_LIMIT");
   const [row]=await tx.insert(schema.shortlistItems).values({shortlistId:id,listingId,addedBy:actor.id}).returning();
   return {...row,reused:false};
  });
 });
 app.delete<{Params:{id:string;itemId:string}}>("/v1/shortlists/:id/items/:itemId",async request=>{
  const actor=await requireActor(db,request,"user"),id=validId(request.params.id),itemId=validId(request.params.itemId);
  const {owner}=await shortlistAccess(db,id,actor.id);
  const [item]=await db.select().from(schema.shortlistItems).where(and(
   eq(schema.shortlistItems.id,itemId),eq(schema.shortlistItems.shortlistId,id))).limit(1);
  if(!item)throw new HttpProblem(404,"SHORTLIST_ITEM_NOT_FOUND");
  if(!owner&&item.addedBy!==actor.id)throw new HttpProblem(403,"ITEM_REMOVE_DENIED");
  await db.delete(schema.shortlistItems).where(eq(schema.shortlistItems.id,itemId));
  return {deleted:true};
 });
 app.put<{Params:{id:string;itemId:string}}>("/v1/shortlists/:id/items/:itemId/vote",async request=>{
  const actor=await requireActor(db,request,"user"),id=validId(request.params.id),itemId=validId(request.params.itemId);
  await shortlistAccess(db,id,actor.id);
  const {vote,note}=parse(comment,request.body);
  const [item]=await db.select({id:schema.shortlistItems.id}).from(schema.shortlistItems)
   .where(and(eq(schema.shortlistItems.id,itemId),eq(schema.shortlistItems.shortlistId,id))).limit(1);
  if(!item)throw new HttpProblem(404,"SHORTLIST_ITEM_NOT_FOUND");
  const [row]=await db.insert(schema.shortlistVotes).values({itemId,userId:actor.id,vote,note})
   .onConflictDoUpdate({target:[schema.shortlistVotes.itemId,schema.shortlistVotes.userId],
    set:{vote,note,updatedAt:new Date()}}).returning();
  return {vote:row.vote,note:row.note};
 });
 app.delete<{Params:{id:string}}>("/v1/shortlists/:id",async request=>{
  const actor=await requireActor(db,request,"user"),id=validId(request.params.id);
  await shortlistAccess(db,id,actor.id,true);
  await db.delete(schema.shortlists).where(and(eq(schema.shortlists.id,id),eq(schema.shortlists.ownerId,actor.id)));
  return {deleted:true};
 });
}
