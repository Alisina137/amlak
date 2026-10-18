import {and,desc,eq,gt,inArray,lte,sql} from "drizzle-orm";
import type {FastifyInstance} from "fastify";
import {z} from "zod";
import {type Database,schema} from "@amlaklink/database";
import {requireActor,requireAgencyMember,requireVerified,HttpProblem} from "./access";
import {canShowPublic,listingDTO,validId} from "./listings";
import {parseDiscovery,searchConditions} from "./search";
const savedInput=z.object({title:z.string().trim().min(2).max(80),
 filters:z.record(z.string(),z.string()),alertsEnabled:z.boolean().default(false)}).strict();
const compareInput=z.object({ids:z.array(z.uuid()).min(2).max(4)}).strict();
function parse<T>(contract:z.ZodType<T>,value:unknown):T{
 const r=contract.safeParse(value);if(!r.success)throw new HttpProblem(422,"VALIDATION_ERROR");return r.data;
}
export function registerGrowthRoutes(app:FastifyInstance,db:Database){
 app.get("/v1/saved-searches",async request=>{
  const actor=await requireActor(db,request,"user");
  return {items:await db.select().from(schema.savedSearches).where(eq(schema.savedSearches.userId,actor.id))
   .orderBy(desc(schema.savedSearches.createdAt)).limit(12)};
 });
 app.post("/v1/saved-searches",async request=>{
  const actor=await requireActor(db,request,"user");await requireVerified(db,actor);
  const input=parse(savedInput,request.body);
  if(["cursor","limit","viewport"].some(k=>k in input.filters))throw new HttpProblem(422,"UNSUPPORTED_SAVED_FILTER");
  const parsed=parseDiscovery(input.filters);
  const filters=Object.fromEntries(Object.entries(parsed)
   .filter(([k,v])=>!["cursor","limit","viewport"].includes(k)&&v!==undefined)
   .map(([k,v])=>[k,String(v)]));
  return db.transaction(async tx=>{
   await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${actor.id}::text))`);
   const [count]=await tx.select({n:sql<number>`count(*)::integer`}).from(schema.savedSearches)
    .where(eq(schema.savedSearches.userId,actor.id));
   if(Number(count?.n||0)>=12)throw new HttpProblem(409,"SAVED_SEARCH_LIMIT");
   const [item]=await tx.insert(schema.savedSearches)
    .values({title:input.title,userId:actor.id,filters,alertsEnabled:input.alertsEnabled}).returning();
   await tx.insert(schema.audit).values({actorType:"user",actorId:actor.id,
    action:"saved_search_created",targetType:"saved_search",targetId:item.id});
   return item;
  });
 });
 app.patch<{Params:{id:string}}>("/v1/saved-searches/:id",async request=>{
  const actor=await requireActor(db,request,"user");
  const {alertsEnabled}=parse(z.object({alertsEnabled:z.boolean()}).strict(),request.body);
  const [item]=await db.update(schema.savedSearches).set({alertsEnabled,lastScannedAt:new Date()})
   .where(and(eq(schema.savedSearches.id,validId(request.params.id)),eq(schema.savedSearches.userId,actor.id))).returning();
  if(!item)throw new HttpProblem(404,"SAVED_SEARCH_NOT_FOUND");
  return item;
 });
 app.delete<{Params:{id:string}}>("/v1/saved-searches/:id",async request=>{
  const actor=await requireActor(db,request,"user");
  const rows=await db.delete(schema.savedSearches).where(and(eq(schema.savedSearches.id,validId(request.params.id)),
   eq(schema.savedSearches.userId,actor.id))).returning({id:schema.savedSearches.id});
  return {deleted:rows.length>0};
 });
 app.post("/v1/properties/compare",async request=>{
  const {ids}=parse(compareInput,request.body);
  if(new Set(ids).size!==ids.length)throw new HttpProblem(422,"DUPLICATE_LISTING");
  const rows=await db.select({listing:schema.listings,revision:schema.revisions}).from(schema.listings)
    .innerJoin(schema.revisions,eq(schema.revisions.id,schema.listings.approvedRevisionId))
    .where(inArray(schema.listings.id,ids));
  const byId=new Map<string,ReturnType<typeof listingDTO>>();
  for(const r of rows)if(["published","paused","sold","rented"].includes(r.listing.status)
    &&await canShowPublic(db,r.listing))byId.set(r.listing.id,listingDTO(r.listing,r.revision,true));
  if(byId.size!==ids.length)throw new HttpProblem(404,"COMPARISON_PROPERTY_UNAVAILABLE");
  const items=ids.map(id=>byId.get(id)!);
  return {items,currenciesDiffer:new Set(items.map(i=>i.data.price.currency)).size>1,
   notice:"Prices are original asking terms. No conversion, verified purchase price or property-title guarantee."};
 });
 app.get<{Querystring:{provinceId?:string;intent?:string}}>("/v1/promotions/featured",async request=>{
  const filters=parseDiscovery({provinceId:request.query?.provinceId,intent:request.query?.intent,limit:3});
  const now=new Date();
  const rows=await db.select({listing:schema.listings,revision:schema.revisions})
   .from(schema.growthPromotions).innerJoin(schema.listings,eq(schema.listings.id,schema.growthPromotions.listingId))
   .innerJoin(schema.revisions,eq(schema.revisions.id,schema.listings.approvedRevisionId))
   .innerJoin(schema.users,eq(schema.users.id,schema.listings.authorId))
   .leftJoin(schema.agencies,eq(schema.agencies.id,schema.listings.agencyId))
   .where(and(lte(schema.growthPromotions.startsAt,now),gt(schema.growthPromotions.endsAt,now),
    eq(schema.listings.safetyHold,false),...searchConditions(filters)))
   .orderBy(desc(schema.growthPromotions.startsAt)).limit(3);
  return {items:rows.map(r=>({...listingDTO(r.listing,r.revision,true),sponsored:true,
   disclosure:"Sponsored · Paid platform placement"}))};
 });
 app.get<{Params:{id:string}}>("/v1/agencies/:id/reports",async request=>{
  const actor=await requireActor(db,request,"user"),agencyId=validId(request.params.id);
  await requireAgencyMember(db,actor,agencyId,["owner","manager"]);
  const [properties]=await db.select({total:sql<number>`count(*)::integer`,
   published:sql<number>`count(*) FILTER (WHERE status='published')::integer`}).from(schema.listings)
    .where(eq(schema.listings.agencyId,agencyId));
  const [leads]=await db.select({total:sql<number>`count(*)::integer`,
   open:sql<number>`count(*) FILTER (WHERE status IN ('new','open','responded'))::integer`}).from(schema.inquiries)
    .where(eq(schema.inquiries.agencyId,agencyId));
  const [taps]=await db.select({total:sql<number>`count(*)::integer`}).from(schema.contactTaps)
    .innerJoin(schema.listings,eq(schema.listings.id,schema.contactTaps.listingId))
    .where(eq(schema.listings.agencyId,agencyId));
  return {properties:properties||{total:0,published:0},leads:leads||{total:0,open:0},contactTaps:taps?.total||0,
   note:"App-captured inquiries and deliberate contact taps only; external conversations and completed sales are not verified."};
 });
}
