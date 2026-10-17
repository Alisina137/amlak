import {and,desc,eq,gt,or,sql} from "drizzle-orm";
import type {FastifyInstance} from "fastify";
import {type Database,schema} from "@amlaklink/database";
import {listingDraftSchema} from "@amlaklink/contracts";
import {HttpProblem,requireActor} from "./access";
import {canShowPublic,getListing,getRevision,listingDTO,validId} from "./listings";
import {parseDiscovery,searchProperties} from "./search";
export function registerDiscoveryRoutes(app:FastifyInstance,db:Database){
 app.get("/v1/discovery",async request=>searchProperties(db,parseDiscovery(request.query)));
 app.get("/v1/discovery/map",async request=>{
  const query=parseDiscovery(request.query);
  const result=await searchProperties(db,{...query,sort:"newest",limit:30,cursor:undefined});
  // Never infer a pin from an approximate address or invent neighborhood centroids.
  return {items:result.items.filter(item=>item.data.location.precision==="exact" &&
   item.data.location.latitude!==undefined&&item.data.location.longitude!==undefined).map(item=>({
    id:item.id,latitude:item.data.location.latitude,longitude:item.data.location.longitude,
    title:item.data.title,price:item.data.price,transactionType:item.data.transactionType
  })),nextCursor:result.nextCursor,unmappedListings:result.items.filter(x=>x.data.location.precision!=="exact").length};
 });
 app.get("/v1/favorites",async request=>{
  const actor=await requireActor(db,request,"user");
  const rows=await db.select({listing:schema.listings,revision:schema.revisions,savedAt:schema.favorites.createdAt})
   .from(schema.favorites).innerJoin(schema.listings,eq(schema.listings.id,schema.favorites.listingId))
   .innerJoin(schema.revisions,eq(schema.revisions.id,schema.listings.approvedRevisionId))
   .where(eq(schema.favorites.userId,actor.id))
   .orderBy(desc(schema.favorites.createdAt)).limit(100);
  const items=[];for(const row of rows)
   if(await canShowPublic(db,row.listing))items.push({...listingDTO(row.listing,row.revision,true),savedAt:row.savedAt});
  return {items};
 });
 app.get<{Params:{id:string}}>("/v1/favorites/:id",async request=>{
  const actor=await requireActor(db,request,"user"),listingId=validId(request.params.id);
  const [r]=await db.select({id:schema.favorites.id}).from(schema.favorites)
   .where(and(eq(schema.favorites.listingId,listingId),eq(schema.favorites.userId,actor.id))).limit(1);
  return {saved:!!r};
 });
 app.post<{Params:{id:string}}>("/v1/favorites/:id",async request=>{
  const actor=await requireActor(db,request,"user"),listing=await getListing(db,request.params.id);
  if(!listing.approvedRevisionId||listing.status!=="published"||!await canShowPublic(db,listing))
   throw new HttpProblem(404,"PROPERTY_NOT_AVAILABLE");
  await db.insert(schema.favorites).values({listingId:listing.id,userId:actor.id}).onConflictDoNothing();
  return {saved:true};
 });
 app.delete<{Params:{id:string}}>("/v1/favorites/:id",async request=>{
  const actor=await requireActor(db,request,"user"),listingId=validId(request.params.id);
  await db.delete(schema.favorites)
   .where(and(eq(schema.favorites.userId,actor.id),eq(schema.favorites.listingId,listingId)));
  return {saved:false};
 });
 app.get<{Params:{id:string};Querystring:{channel?:string}}>("/v1/properties/:id/contact",
  {config:{rateLimit:{max:6,timeWindow:"1 minute"}}},async request=>{
   const listing=await getListing(db,request.params.id),channel=request.query.channel;
   if(channel!=="call"&&channel!=="whatsapp")throw new HttpProblem(422,"CONTACT_CHANNEL_REQUIRED");
   if(listing.status!=="published"||!listing.approvedRevisionId||!listing.lastConfirmedAt||
    listing.lastConfirmedAt.getTime()<=Date.now()-30*86400_000||!await canShowPublic(db,listing))
    throw new HttpProblem(404,"PROPERTY_NOT_AVAILABLE");
   const d=listingDraftSchema.parse((await getRevision(db,listing.approvedRevisionId)).data);
   const number=channel==="call"?(d.contact.allowPhone?d.contact.phone:undefined):
    (d.contact.allowWhatsApp?d.contact.whatsapp:undefined);
   if(!number)throw new HttpProblem(404,"CONTACT_CHANNEL_DISABLED");
   // Called only upon explicit seeker tap; never put raw contacts in search cards.
   const href=channel==="call"?"tel:"+number:"https://wa.me/"+number.replace(/\D/g,"");
   await db.insert(schema.contactTaps).values({listingId:listing.id,channel});
   return {channel,href,note:"tap_recorded_not_confirmed_contact"};
 });
 app.get<{Params:{kind:string;id:string}}>("/v1/advertisers/:kind/:id",async request=>{
  const kind=request.params.kind,identity=validId(request.params.id);
  if(kind==="agency"){
   const [agency]=await db.select().from(schema.agencies)
    .where(and(eq(schema.agencies.id,identity),eq(schema.agencies.status,"active"))).limit(1);
   if(!agency)throw new HttpProblem(404,"PROFILE_NOT_FOUND");
   return {id:agency.id,kind,name:agency.name,provinceId:agency.provinceId,badges:[
    {kind:"agency_registration_reviewed",description:"Agency registration reviewed by staff. Does not certify individual property ownership or legal title.",reviewedAt:agency.reviewedAt}
   ]};
  }
  if(kind==="user"){
   const [person]=await db.select().from(schema.users)
    .where(and(eq(schema.users.id,identity),eq(schema.users.status,"active"))).limit(1);
   if(!person?.emailVerifiedAt)throw new HttpProblem(404,"PROFILE_NOT_FOUND");
   return {id:person.id,kind,name:person.displayName,badges:[
    {kind:"contact_email_verified",description:"Email was verified. This does not verify ownership of any property."},
    ...(person.independentAgentStatus==="approved"?[{kind:"professional_application_reviewed",description:"Professional application approved by staff; not a property title guarantee."}]:[])
   ]};
  }
  throw new HttpProblem(404,"PROFILE_NOT_FOUND");
 });
 app.get<{Params:{kind:string;id:string}}>("/v1/advertisers/:kind/:id/properties",async request=>{
  const {kind}=request.params,identity=validId(request.params.id);
  if(!["agency","user"].includes(kind))throw new HttpProblem(404,"PROFILE_NOT_FOUND");
  const rows=await db.select({listing:schema.listings,revision:schema.revisions})
   .from(schema.listings).innerJoin(schema.revisions,eq(schema.revisions.id,schema.listings.approvedRevisionId))
   .innerJoin(schema.users,eq(schema.users.id,schema.listings.authorId))
   .leftJoin(schema.agencies,eq(schema.agencies.id,schema.listings.agencyId))
   .where(and(eq(schema.listings.status,"published"),
     gt(schema.listings.lastConfirmedAt,new Date(Date.now()-30*86400_000)),
     eq(schema.users.status,"active"),
     or(sql.raw("listings.agency_id IS NULL"),eq(schema.agencies.status,"active"))!,
     kind==="agency"?eq(schema.listings.agencyId,identity):eq(schema.listings.authorId,identity)))
   .orderBy(desc(schema.listings.publishedAt)).limit(40);
  return {items:rows.map(({listing,revision})=>listingDTO(listing,revision,true))};
 });
}
