import {and,asc,eq,gte,isNull,lt,lte,or,sql} from "drizzle-orm";
import type {FastifyInstance,FastifyRequest} from "fastify";
import {type Database,schema} from "@amlaklink/database";
import {requireActor,requireStaffRole} from "./access";
import {cancelInactiveListingVisits} from "./engagement-lifecycle";
const DAY=86_400_000,MAX_BATCH=100;
export const FRESHNESS_REMIND_DAYS=14,FRESHNESS_EXPIRE_DAYS=30;
const cutoff=(now:Date,days:number)=>new Date(now.getTime()-days*DAY);
export function freshnessAction(confirmed:Date|null,now:Date):"pause"|"remind"|null{
 if(!confirmed||confirmed.getTime()<=cutoff(now,FRESHNESS_EXPIRE_DAYS).getTime())return "pause";
 if(confirmed.getTime()<=cutoff(now,FRESHNESS_REMIND_DAYS).getTime())return "remind";
 return null;
}
export async function freshnessSweep(db:Database,options:{execute:boolean;limit?:number;now?:Date}){
 const now=options.now||new Date(),limit=Math.max(1,Math.min(options.limit||MAX_BATCH,MAX_BATCH));
 const rows=await db.select().from(schema.listings).where(and(eq(schema.listings.status,"published"),
  or(isNull(schema.listings.lastConfirmedAt),lte(schema.listings.lastConfirmedAt,cutoff(now,FRESHNESS_REMIND_DAYS)))))
  .orderBy(asc(schema.listings.lastConfirmedAt),asc(schema.listings.id)).limit(limit);
 const result={inspected:rows.length,dueReminder:0,duePause:0,reminded:0,paused:0,visitCancellations:0,
  executed:options.execute,limit,at:now.toISOString()};
 for(const item of rows){
  const action=freshnessAction(item.lastConfirmedAt,now);
  if(!action)continue;
  const cycle=item.lastConfirmedAt?.toISOString()||"never";
  if(action==="remind"){
   result.dueReminder++;
   if(options.execute){
    const [inserted]=await db.insert(schema.notifications).values({userId:item.authorId,kind:"freshness",
     referenceId:item.id,dedupeKey:"freshness:remind:"+item.id+":"+cycle,
     title:"Please reconfirm that your property is still available."}).onConflictDoNothing()
      .returning({id:schema.notifications.id});
    if(inserted)result.reminded++;
   }
  }else{
   result.duePause++;
   if(options.execute){
    const [changed]=await db.update(schema.listings).set({status:"paused",version:sql.raw('"listings"."version" + 1'),updatedAt:now})
     .where(and(eq(schema.listings.id,item.id),eq(schema.listings.status,"published"),
      item.lastConfirmedAt?eq(schema.listings.lastConfirmedAt,item.lastConfirmedAt):isNull(schema.listings.lastConfirmedAt),
      or(isNull(schema.listings.lastConfirmedAt),lte(schema.listings.lastConfirmedAt,cutoff(now,FRESHNESS_EXPIRE_DAYS)))))
     .returning({id:schema.listings.id});
    if(!changed)continue;
    result.paused++;
    await db.insert(schema.audit).values({actorType:"system",actorId:null,action:"listing_auto_paused_stale",
     targetType:"listing",targetId:item.id,reason:"Availability unconfirmed for 30 days"});
    await db.insert(schema.notifications).values({userId:item.authorId,kind:"freshness",referenceId:item.id,
     dedupeKey:"freshness:paused:"+item.id+":"+cycle,
     title:"Your property was paused after 30 days without an availability confirmation."}).onConflictDoNothing();
    result.visitCancellations+=await cancelInactiveListingVisits(db,item.id,false);
   }
  }
 }
 return result;
}
async function count(query:Promise<{n:number}[]>):Promise<number>{return Number((await query)[0]?.n||0);}
const n=sql<number>/* count */.raw("count(*)::int");
export async function pilotScorecard(db:Database,now=new Date()){
 const date14=cutoff(now,14),date30=cutoff(now,30);
 const loc=sql.raw("listing_revisions.data->'location'->>'provinceId'");
 const [agencyTotal,agencyActive,kabulPublished,kabulFresh14,fresh30,stalePublished,pendingReview,
 openCases,highRisk,inquiries30,viewings30]=await Promise.all([
  count(db.select({n}).from(schema.agencies)),
  count(db.select({n}).from(schema.agencies).where(eq(schema.agencies.status,"active"))),
  count(db.select({n}).from(schema.listings)
   .innerJoin(schema.revisions,eq(schema.revisions.id,schema.listings.approvedRevisionId))
   .where(and(eq(schema.listings.status,"published"),eq(loc,"kabul")))),
  count(db.select({n}).from(schema.listings)
   .innerJoin(schema.revisions,eq(schema.revisions.id,schema.listings.approvedRevisionId))
   .where(and(eq(schema.listings.status,"published"),gte(schema.listings.lastConfirmedAt,date14),eq(loc,"kabul")))),
  count(db.select({n}).from(schema.listings)
   .where(and(eq(schema.listings.status,"published"),gte(schema.listings.lastConfirmedAt,date30)))),
  count(db.select({n}).from(schema.listings)
   .where(and(eq(schema.listings.status,"published"),
    or(isNull(schema.listings.lastConfirmedAt),lt(schema.listings.lastConfirmedAt,date30))))),
  count(db.select({n}).from(schema.revisions).where(eq(schema.revisions.status,"submitted"))),
  count(db.select({n}).from(schema.safetyCases)
   .where(sql.raw("safety_cases.status in ('open','triaged','investigating','appealed')"))),
  count(db.select({n}).from(schema.safetyCases)
   .where(and(eq(schema.safetyCases.severity,"high"),
    sql.raw("safety_cases.status in ('open','triaged','investigating','appealed')")))),
  count(db.select({n}).from(schema.inquiries).where(gte(schema.inquiries.createdAt,date30))),
  count(db.select({n}).from(schema.viewings)
   .where(and(eq(schema.viewings.status,"confirmed"),gte(schema.viewings.createdAt,date30))))
 ]);
 const freshPct=kabulPublished?Math.round(kabulFresh14/kabulPublished*1000)/10:0;
 return {asOf:now.toISOString(),agencyTotal,agencyActive,kabulPublished,kabulFresh14,
  kabulFresh14Percent:freshPct,fresh30,stalePublished,pendingReview,openCases,highRisk,
  inquiries30,viewings30,pilotTargets:{kabulAgencies:10,kabulListings:150,freshPercent:80},
  automatedEligibility:agencyActive>=10&&kabulPublished>=150&&freshPct>=80,
  releaseApproved:false,releaseReason:"Only staffed operations may authorize release after safety, backups, legal and physical-device QA."};
}
export function registerPilotRoutes(app:FastifyInstance,db:Database){
 const authorize=async(request:FastifyRequest,write=false)=>{
  const actor=await requireActor(db,request,"staff");
  requireStaffRole(actor,write?["admin","super_admin"]:["moderator","support","verification","admin","super_admin"]);
  return actor;
 };
 app.get("/v1/admin/pilot/scorecard",async request=>{await authorize(request);return pilotScorecard(db);});
 app.get("/v1/admin/pilot/freshness",async request=>{await authorize(request);return freshnessSweep(db,{execute:false});});
 app.post("/v1/admin/pilot/freshness/run",{config:{rateLimit:{max:2,timeWindow:"1 minute"}}},async request=>{
  const person=await authorize(request,true);
  const data=await freshnessSweep(db,{execute:true});
  await db.insert(schema.audit).values({actorType:"staff",actorId:person.id,action:"pilot_freshness_sweep",
   targetType:"pilot",reason:JSON.stringify({paused:data.paused,reminded:data.reminded,at:data.at})});
  return data;
 });
}
