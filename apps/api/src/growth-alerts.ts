import {and,asc,desc,eq,gt,lt,lte,or,isNull} from "drizzle-orm";
import {type Database,schema} from "@amlaklink/database";
import {listingDraftSchema} from "@amlaklink/contracts";
import {parseDiscovery,searchConditions} from "./search";
const MAX_SEARCHES=30,MAX_MATCHES=50;
export function matchingAlert(locale:string,kind:"new"|"price_drop",title:string){
 const text=kind==="new"?
  locale==="en"?"New property matching your saved search: ":locale==="ps"?"ستاسو د خوندي شوې پلټنې لپاره نوی ملکیت: ":"ملک جدید مطابق جستجوی ذخیره‌شده: ":
  locale==="en"?"Price reduced on a saved-search match: ":locale==="ps"?"د ملکیت بیه راټیټه شوې: ":"قیمت ملک در جستجوی شما کاهش یافت: ";
 return (text+title).slice(0,160);
}
export function isPriceDrop(current:unknown,old:unknown):boolean{
 const now=listingDraftSchema.safeParse(current),before=listingDraftSchema.safeParse(old);
 if(!now.success||!before.success||now.data.transactionType!==before.data.transactionType
  ||now.data.price.currency!==before.data.price.currency)return false;
 const key=now.data.transactionType==="sale"?"askingPrice":
  now.data.transactionType==="rent"?"monthlyRent":"refundablePrincipal";
 const n=Number((now.data.price as unknown as Record<string,unknown>)[key]);
 const b=Number((before.data.price as unknown as Record<string,unknown>)[key]);
 return Number.isFinite(n)&&Number.isFinite(b)&&n>=0&&b>n;
}
/** Bounded, restart-safe worker. Only matches public, fresh, eligible listings. */
export async function scanSavedSearchAlerts(db:Database,options:{execute:boolean;limit?:number;now?:Date}){
 const now=options.now||new Date(),until=new Date(now.getTime()-60_000);
 const limit=Math.max(1,Math.min(MAX_SEARCHES,options.limit||MAX_SEARCHES));
 const searches=await db.select({search:schema.savedSearches,locale:schema.users.locale})
  .from(schema.savedSearches).innerJoin(schema.users,eq(schema.users.id,schema.savedSearches.userId))
  .where(and(eq(schema.savedSearches.alertsEnabled,true),eq(schema.users.status,"active")))
  .orderBy(asc(schema.savedSearches.lastScannedAt),asc(schema.savedSearches.id)).limit(limit);
 const result={scanned:searches.length,matched:0,newMatches:0,priceDrops:0,notified:0,execute:options.execute,at:now.toISOString()};
 for(const {search,locale} of searches){
  const query=parseDiscovery(search.filters),cursor=search.lastScannedAt;
  const after=search.lastListingId?or(gt(schema.listings.updatedAt,cursor),
    and(eq(schema.listings.updatedAt,cursor),gt(schema.listings.id,search.lastListingId)))!:
     gt(schema.listings.updatedAt,cursor);
  const rows=await db.select({listing:schema.listings,revision:schema.revisions}).from(schema.listings)
   .innerJoin(schema.revisions,eq(schema.revisions.id,schema.listings.approvedRevisionId))
   .innerJoin(schema.users,eq(schema.users.id,schema.listings.authorId))
   .leftJoin(schema.agencies,eq(schema.agencies.id,schema.listings.agencyId))
   .where(and(after,lte(schema.listings.updatedAt,until),...searchConditions(query)))
   .orderBy(asc(schema.listings.updatedAt),asc(schema.listings.id)).limit(MAX_MATCHES);
  for(const {listing,revision} of rows){
   let kind:"new"|"price_drop"|null=null;
   if(listing.publishedAt&&listing.publishedAt>=search.createdAt&&listing.publishedAt>=cursor)
    kind="new";
   else{
    const [previous]=await db.select({data:schema.revisions.data}).from(schema.revisions)
     .where(and(eq(schema.revisions.listingId,listing.id),eq(schema.revisions.status,"approved"),
      lt(schema.revisions.sequence,revision.sequence)))
     .orderBy(desc(schema.revisions.sequence)).limit(1);
    if(previous&&isPriceDrop(revision.data,previous.data))kind="price_drop";
   }
   if(!kind)continue;
   result.matched++;
   if(kind==="new")result.newMatches++;else result.priceDrops++;
   if(options.execute){
    const title=listingDraftSchema.parse(revision.data).title;
    const dedupe="saved:"+search.id+":"+listing.id+":"+revision.id;
    const [notice]=await db.insert(schema.notifications).values({userId:search.userId,
     kind:"saved_search",referenceId:listing.id,dedupeKey:dedupe,
     title:matchingAlert(locale,kind,title)}).onConflictDoNothing().returning({id:schema.notifications.id});
    if(notice)result.notified++;
   }
  }
  if(options.execute){
   const last=rows.at(-1);
   // Cursor ordering includes the UUID to avoid skipping same-millisecond updates.
   await db.update(schema.savedSearches).set({
    lastScannedAt:last?.listing.updatedAt||until,
    lastListingId:last?.listing.id||null
   }).where(and(eq(schema.savedSearches.id,search.id),
     eq(schema.savedSearches.lastScannedAt,search.lastScannedAt),
     search.lastListingId?eq(schema.savedSearches.lastListingId,search.lastListingId):
      isNull(schema.savedSearches.lastListingId)));
  }
 }
 return result;
}
