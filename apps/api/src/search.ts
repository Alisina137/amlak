import {createHash} from "node:crypto";
import {and,asc,desc,eq,gt,gte,ilike,lt,lte,or,sql,type SQL} from "drizzle-orm";
import {z} from "zod";
import {findProvince} from "@amlaklink/catalog";
import {type Database,schema} from "@amlaklink/database";
import {listingDraftSchema} from "@amlaklink/contracts";
import {HttpProblem} from "./access";
import {listingDTO} from "./listings";
const qschema=z.object({
 q:z.string().trim().max(120).optional(),
 intent:z.enum(["sale","rent","gharawi"]).optional(),
 type:z.enum(["house","apartment","land","shop","office","commercial"]).optional(),
 provinceId:z.string().max(50).optional(),city:z.string().trim().max(100).optional(),
 district:z.string().trim().max(100).optional(),neighborhood:z.string().trim().max(120).optional(),
 currency:z.enum(["AFN","USD"]).optional(),
 minPrice:z.coerce.number().nonnegative().max(1e15).optional(),maxPrice:z.coerce.number().nonnegative().max(1e15).optional(),
 minArea:z.coerce.number().nonnegative().max(1e8).optional(),maxArea:z.coerce.number().nonnegative().max(1e8).optional(),
 bedrooms:z.coerce.number().int().min(0).max(99).optional(),bathrooms:z.coerce.number().int().min(0).max(99).optional(),
 furnished:z.enum(["true","false"]).optional(),parking:z.enum(["true","false"]).optional(),
 water:z.enum(["true","false"]).optional(),electricity:z.enum(["true","false"]).optional(),
 advertiser:z.enum(["private","independent_agent","agency"]).optional(),
 verifiedAgency:z.enum(["true","false"]).optional(),
 sort:z.enum(["newest","recent_confirmed","price_asc","price_desc"]).default("newest"),
 limit:z.coerce.number().int().min(1).max(30).default(20),
 cursor:z.string().max(600).optional(),
 viewport:z.string().max(120).optional(),
}).strict();
export type DiscoveryFilters=z.infer<typeof qschema>;
export function normalizeText(value:string){
 return value.normalize("NFKC").replace(/[يى]/g,"ی").replace(/ك/g,"ک")
 .replace(/[۰-۹]/g,c=>String("۰۱۲۳۴۵۶۷۸۹".indexOf(c)))
 .replace(/[٠-٩]/g,c=>String("٠١٢٣٤٥٦٧٨٩".indexOf(c)))
 .toLowerCase().replace(/\s+/g," ").trim();
}
function escapeLike(value:string){return value.replace(/[%_\\]/g,c=>"\\"+c);}
function column(section:string,key:string):SQL{
 // Only ever called with code-owned constant field names (never user input).
 return sql.raw("(listing_revisions.data->'"+section+"'->>'"+key+"')");
}
function top(name:string):SQL{return sql.raw("(listing_revisions.data->>'"+name+"')");}
function numeric(section:string,key:string):SQL<number>{
 return sql.raw("nullif((listing_revisions.data->'"+section+"'->>'"+key+"'),'')::numeric") as SQL<number>;
}
export function parseDiscovery(raw:unknown):DiscoveryFilters{
 const result=qschema.safeParse(raw);
 if(!result.success)throw new HttpProblem(422,"INVALID_SEARCH_FILTERS");
 const q=result.data;
 if(q.provinceId&&!findProvince(q.provinceId))throw new HttpProblem(422,"UNKNOWN_PROVINCE");
 if(q.minPrice!==undefined&&q.maxPrice!==undefined&&q.minPrice>q.maxPrice)throw new HttpProblem(422,"PRICE_RANGE_INVALID");
 if(q.minArea!==undefined&&q.maxArea!==undefined&&q.minArea>q.maxArea)throw new HttpProblem(422,"AREA_RANGE_INVALID");
 if((q.minPrice!==undefined||q.maxPrice!==undefined||q.sort.startsWith("price"))&&(!q.intent||!q.currency))
  throw new HttpProblem(422,"PRICE_REQUIRES_INTENT_AND_CURRENCY");
 if(q.viewport){
  if(!/^[-\d.]+,[-\d.]+,[-\d.]+,[-\d.]+$/.test(q.viewport))throw new HttpProblem(422,"INVALID_VIEWPORT");
  const [s,w,n,e]=q.viewport.split(",").map(Number);
  if(![s,w,n,e].every(Number.isFinite)||s>=n||w>=e||s < -90||n>90||w < -180||e>180)
   throw new HttpProblem(422,"INVALID_VIEWPORT");
 }
 return q;
}
const cursorSchema=z.object({hash:z.string().length(20),value:z.union([z.string(),z.number()]),id:z.uuid()}).strict();
function hashFilters(q:DiscoveryFilters){
 const {cursor,limit,...filters}=q;
 return createHash("sha256").update(JSON.stringify(filters)).digest("hex").slice(0,20);
}
function cursorDecode(cursor:string|undefined,hash:string){
 if(!cursor)return null;
 try{
  const decoded=cursorSchema.parse(JSON.parse(Buffer.from(cursor,"base64url").toString("utf8")));
  if(decoded.hash!==hash)throw Error("mismatched filters");
  return decoded;
 }catch{throw new HttpProblem(422,"INVALID_CURSOR");}
}
function priceKey(q:DiscoveryFilters){return q.intent==="sale"?"askingPrice":q.intent==="rent"?"monthlyRent":"refundablePrincipal";}
function sortColumn(q:DiscoveryFilters){
 return q.sort==="newest"?schema.listings.publishedAt:q.sort==="recent_confirmed"?schema.listings.lastConfirmedAt:numeric("price",priceKey(q));
}
export function searchConditions(q:DiscoveryFilters):SQL[]{
 const conditions:SQL[]=[
  eq(schema.listings.status,"published"),
  gt(schema.listings.lastConfirmedAt,new Date(Date.now()-30*86400_000)),
  eq(schema.users.status,"active"),
  or(sql.raw("listings.agency_id IS NULL"),eq(schema.agencies.status,"active"))!
 ];
 if(q.provinceId)conditions.push(eq(column("location","provinceId"),q.provinceId));
 if(q.intent)conditions.push(eq(top("transactionType"),q.intent));
 if(q.type)conditions.push(eq(top("propertyType"),q.type));
 for(const k of ["city","district","neighborhood"] as const)
  if(q[k])conditions.push(ilike(column("location",k),"%"+escapeLike(normalizeText(q[k]!))+"%"));
 if(q.q){
  const term="%"+escapeLike(normalizeText(q.q))+"%";
  // Kaf and Yeh character variants are normalized in searchable public text.
  const fields=["(listing_revisions.data->>'title')","(listing_revisions.data->>'description')",
    "(listing_revisions.data->'location'->>'city')",
    "(listing_revisions.data->'location'->>'district')",
    "(listing_revisions.data->'location'->>'neighborhood')"];
  conditions.push(or(...fields.map(f=>ilike(sql.raw("replace(replace("+f+",'ي','ی'),'ك','ک')"),term)))!);
 }
 if(q.minArea!==undefined)conditions.push(gte(numeric("attributes","areaM2"),q.minArea));
 if(q.maxArea!==undefined)conditions.push(lte(numeric("attributes","areaM2"),q.maxArea));
 for(const k of ["bedrooms","bathrooms"] as const)
  if(q[k]!==undefined)conditions.push(gte(numeric("attributes",k),q[k]!));
 for(const k of ["furnished","parking","water","electricity"] as const)
  if(q[k])conditions.push(eq(column("attributes",k),q[k]));
 if(q.advertiser)conditions.push(eq(schema.listings.publisher,q.advertiser));
 if(q.verifiedAgency==="true")conditions.push(eq(schema.listings.publisher,"agency"));
 if(q.minPrice!==undefined||q.maxPrice!==undefined||q.sort.startsWith("price"))
  conditions.push(eq(column("price","currency"),q.currency!));
 if(q.minPrice!==undefined)conditions.push(gte(numeric("price",priceKey(q)),q.minPrice));
 if(q.maxPrice!==undefined)conditions.push(lte(numeric("price",priceKey(q)),q.maxPrice));
 if(q.viewport){
  const [south,west,north,east]=q.viewport.split(",").map(Number);
  conditions.push(eq(column("location","precision"),"exact"));
  conditions.push(gte(numeric("location","latitude"),south),lte(numeric("location","latitude"),north));
  conditions.push(gte(numeric("location","longitude"),west),lte(numeric("location","longitude"),east));
 }
 return conditions;
}
export async function searchProperties(db:Database,q:DiscoveryFilters){
 const clauses=searchConditions(q),sort=sortColumn(q),hash=hashFilters(q),cursor=cursorDecode(q.cursor,hash);
 if(cursor){
  if(q.sort.startsWith("price")){
   if(typeof cursor.value!=="number"||!Number.isFinite(cursor.value))throw new HttpProblem(422,"INVALID_CURSOR");
  }else if(typeof cursor.value!=="string"||Number.isNaN(Date.parse(cursor.value)))throw new HttpProblem(422,"INVALID_CURSOR");
  const key=q.sort.startsWith("price")?cursor.value:new Date(cursor.value as string);
  clauses.push(q.sort==="price_asc"?
    or(gt(sort,key),and(eq(sort,key),gt(schema.listings.id,cursor.id)))!:
    or(lt(sort,key),and(eq(sort,key),lt(schema.listings.id,cursor.id)))!);
 }
 const rows=await db.select({listing:schema.listings,revision:schema.revisions}).from(schema.listings)
  .innerJoin(schema.revisions,eq(schema.revisions.id,schema.listings.approvedRevisionId))
  .innerJoin(schema.users,eq(schema.users.id,schema.listings.authorId))
  .leftJoin(schema.agencies,eq(schema.agencies.id,schema.listings.agencyId))
  .where(and(...clauses))
  .orderBy(q.sort==="price_asc"?asc(sort):desc(sort),
    q.sort==="price_asc"?asc(schema.listings.id):desc(schema.listings.id))
  .limit(q.limit+1);
 const more=rows.length>q.limit,last=rows.slice(0,q.limit).at(-1);
 const lastValue=last?(q.sort.startsWith("price")?
   Number(listingDraftSchema.parse(last.revision.data).price[priceKey(q)]):
   (q.sort==="recent_confirmed"?last.listing.lastConfirmedAt:last.listing.publishedAt)!.toISOString()):null;
 const nextCursor=more&&last&&lastValue!==null?
  Buffer.from(JSON.stringify({hash,value:lastValue,id:last.listing.id})).toString("base64url"):null;
 return {items:rows.slice(0,q.limit).map(({listing,revision})=>listingDTO(listing,revision,true)),
  nextCursor,appliedFilters:{...q,cursor:undefined}};
}
