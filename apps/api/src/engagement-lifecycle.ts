import {and,eq,inArray} from "drizzle-orm";
import {type Database,schema} from "@amlaklink/database";
/**
 * Reconciles pending visits after the advertisement becomes inactive.
 * A pause leaves already-confirmed appointments intact; a final sale/rental
 * cancels them as well. Independent of mobile polling or external push.
 */
export async function cancelInactiveListingVisits(db:Database,listingId:string,finalClose:boolean){
 const threads=await db.select({id:schema.inquiries.id,seekerId:schema.inquiries.seekerId,advertiserId:schema.inquiries.advertiserId})
  .from(schema.inquiries).where(eq(schema.inquiries.listingId,listingId));
 if(threads.length===0)return 0;
 const openStates=finalClose?["requested","counterproposed","confirmed"] as const:["requested","counterproposed"] as const;
 const visits=await db.select().from(schema.viewings).where(and(
  inArray(schema.viewings.inquiryId,threads.map(i=>i.id)),inArray(schema.viewings.status,[...openStates])
 ));
 let changed=0;
 for(const viewing of visits){
  const [updated]=await db.update(schema.viewings).set({status:"cancelled",version:viewing.version+1,updatedAt:new Date()})
   .where(and(eq(schema.viewings.id,viewing.id),inArray(schema.viewings.status,[...openStates]))).returning();
  if(!updated)continue;
  changed++;
  const thread=threads.find(x=>x.id===viewing.inquiryId);
  if(!thread)continue;
  for(const recipientId of new Set([thread.seekerId,thread.advertiserId])){
   await db.insert(schema.notifications).values({userId:recipientId,kind:"viewing",referenceId:thread.id,
    dedupeKey:"inactive:"+viewing.id,title:"Property availability changed. The viewing was cancelled."}).onConflictDoNothing();
  }
 }
 return changed;
}
