import {and,desc,eq,gt,lt,lte,or,sql} from "drizzle-orm";
import {type Database,schema} from "@amlaklink/database";
import {DAY_MS,renewalStage,subscriptionNotice} from "./subscription-lifecycle";

const MAX=100,MAX_CURSOR_CHARS=180;
export type RenewalCursor={expiresAt:Date;id:string};
/** Stable keyset pagination. Never use offsets for a live subscription queue. */
export function encodeRenewalCursor(row:RenewalCursor):string{
 return Buffer.from(row.expiresAt.toISOString()+"|"+row.id).toString("base64url");
}
export function decodeRenewalCursor(raw:string):RenewalCursor{
 if(!raw||raw.length>MAX_CURSOR_CHARS||!/^[A-Za-z0-9_-]+$/.test(raw))
  throw Error("INVALID_RENEWAL_CURSOR");
 try{
  const plain=Buffer.from(raw,"base64url").toString("utf8");
  const [date,id,...rest]=plain.split("|");
  const expiresAt=new Date(date);
  if(rest.length||!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(date)||
   !Number.isFinite(expiresAt.getTime())||expiresAt.toISOString()!==date||
   !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))
   throw Error("INVALID_RENEWAL_CURSOR");
  return {expiresAt,id};
 }catch{throw Error("INVALID_RENEWAL_CURSOR");}
}
/** No charges, plan mutations or new paid capacity: in-app reminders only.
 * Cursors enable an external worker to drain large queues without repeatedly
 * processing the first 100 records. Dry run never writes notifications. */
export async function scanSubscriptionRenewals(db:Database,options:{
 execute:boolean;now?:Date;limit?:number;cursor?:string
}){
 const now=options.now||new Date(),limit=options.limit??MAX;
 if(!Number.isInteger(limit)||limit<1||limit>MAX)throw Error("INVALID_RENEWAL_BATCH_LIMIT");
 if(!Number.isFinite(now.getTime()))throw Error("INVALID_RENEWAL_TIME");
 const cursor=options.cursor?decodeRenewalCursor(options.cursor):null;
 const earliest=new Date(now.getTime()-14*DAY_MS),latest=new Date(now.getTime()+7*DAY_MS);
 const page=await db.select().from(schema.growthEntitlements)
  .where(and(gt(schema.growthEntitlements.expiresAt,earliest),
   lte(schema.growthEntitlements.expiresAt,latest),
   ...(cursor?[or(
    lt(schema.growthEntitlements.expiresAt,cursor.expiresAt),
    and(eq(schema.growthEntitlements.expiresAt,cursor.expiresAt),
     lt(schema.growthEntitlements.id,cursor.id))
   )]:[])))
  .orderBy(desc(schema.growthEntitlements.expiresAt),desc(schema.growthEntitlements.id))
  .limit(limit+1);
 const grants=page.slice(0,limit),hasMore=page.length>limit;
 const result={scanned:grants.length,due:0,notified:0,skippedRenewed:0,execute:options.execute,
  at:now.toISOString(),hasMore,
  nextCursor:hasMore&&grants.length?encodeRenewalCursor(grants[grants.length-1]):null};
 for(const grant of grants){
  const stage=renewalStage(grant.expiresAt,now);
  if(!stage)continue;
  const scope=grant.agencyId?eq(schema.growthEntitlements.agencyId,grant.agencyId):
   grant.userId?eq(schema.growthEntitlements.userId,grant.userId):null;
  if(!scope)continue;
  await db.transaction(async tx=>{
   // Billing confirmation locks on this beneficiary. If a plan is confirmed
   // concurrently with a reminder, it cannot create a stale warning.
   if(options.execute){
    const lock=grant.agencyId?"agency:"+grant.agencyId:"solo:"+grant.userId;
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${lock}::text))`);
   }
   // Any newer confirmed entitlement supersedes the older period, whether
   // it was continuous or resumed after a renewal gap.
   const [next]=await tx.select({id:schema.growthEntitlements.id})
    .from(schema.growthEntitlements)
    .where(and(scope,gt(schema.growthEntitlements.expiresAt,grant.expiresAt)))
    .limit(1);
   if(next){result.skippedRenewed++;return;}
   const recipients:string[]=[];
   if(grant.agencyId){
    const [agency]=await tx.select({status:schema.agencies.status}).from(schema.agencies)
     .where(eq(schema.agencies.id,grant.agencyId)).limit(1);
    if(!agency||agency.status!=="active")return;
    const members=await tx.select({id:schema.users.id}).from(schema.memberships)
     .innerJoin(schema.users,eq(schema.users.id,schema.memberships.userId))
     .where(and(eq(schema.memberships.agencyId,grant.agencyId),
      eq(schema.memberships.role,"owner"),eq(schema.memberships.status,"active"),
      eq(schema.users.status,"active")));
    recipients.push(...members.map(x=>x.id));
   }else if(grant.userId){
    const [agent]=await tx.select({id:schema.users.id,status:schema.users.status})
     .from(schema.users).where(eq(schema.users.id,grant.userId)).limit(1);
    if(agent?.status==="active")recipients.push(agent.id);
   }
   for(const id of new Set(recipients)){
    result.due++;
    if(!options.execute)continue;
    const [user]=await tx.select({locale:schema.users.locale}).from(schema.users)
     .where(eq(schema.users.id,id)).limit(1);
    const [inserted]=await tx.insert(schema.notifications).values({userId:id,
     kind:grant.agencyId?"subscription_agency":"subscription_solo",
     referenceId:grant.agencyId||grant.userId,
     dedupeKey:"subscription:"+grant.id+":"+stage,
     title:subscriptionNotice(user?.locale||"fa",stage,grant.planCode)})
     .onConflictDoNothing().returning({id:schema.notifications.id});
    if(inserted)result.notified++;
   }
  });
 }
 return result;
}
