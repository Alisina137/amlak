import {and,asc,eq,gt,lte} from "drizzle-orm";
import {type Database,schema} from "@amlaklink/database";
import {DAY_MS,RENEWAL_GRACE_DAYS,renewalStage,subscriptionNotice} from "./subscription-lifecycle";

const MAX=100;
/** A bounded, retry-safe, in-app-only scan. No automatic charges or plan extensions. */
export async function scanSubscriptionRenewals(db:Database,options:{execute:boolean;now?:Date;limit?:number}){
 const now=options.now||new Date(),limit=Math.max(1,Math.min(MAX,options.limit||MAX));
 const earliest=new Date(now.getTime()-14*DAY_MS),latest=new Date(now.getTime()+7*DAY_MS);
 const grants=await db.select().from(schema.growthEntitlements)
  .where(and(gt(schema.growthEntitlements.expiresAt,earliest),
   lte(schema.growthEntitlements.expiresAt,latest)))
  .orderBy(asc(schema.growthEntitlements.expiresAt)).limit(limit);
 const result={scanned:grants.length,due:0,notified:0,skippedRenewed:0,execute:options.execute,
  at:now.toISOString()};
 for(const grant of grants){
  const stage=renewalStage(grant.expiresAt,now);
  if(!stage)continue;
  const scope=grant.agencyId?eq(schema.growthEntitlements.agencyId,grant.agencyId):
   grant.userId?eq(schema.growthEntitlements.userId,grant.userId):null;
  if(!scope)continue;
  // A future confirmed period covering this expiry cancels all renewal warnings.
  const [next]=await db.select({id:schema.growthEntitlements.id}).from(schema.growthEntitlements)
   .where(and(scope,gt(schema.growthEntitlements.expiresAt,grant.expiresAt),
    lte(schema.growthEntitlements.startsAt,grant.expiresAt))).limit(1);
  if(next){result.skippedRenewed++;continue;}
  const recipients:string[]=[];
  if(grant.agencyId){
   const [agency]=await db.select().from(schema.agencies)
    .where(eq(schema.agencies.id,grant.agencyId)).limit(1);
   if(!agency||agency.status!=="active")continue;
   const members=await db.select({id:schema.users.id}).from(schema.memberships)
    .innerJoin(schema.users,eq(schema.users.id,schema.memberships.userId))
    .where(and(eq(schema.memberships.agencyId,grant.agencyId),eq(schema.memberships.role,"owner"),
     eq(schema.memberships.status,"active"),eq(schema.users.status,"active")));
   recipients.push(...members.map(x=>x.id));
  }else if(grant.userId){
   const [agent]=await db.select({id:schema.users.id,status:schema.users.status}).from(schema.users)
    .where(eq(schema.users.id,grant.userId)).limit(1);
   if(agent?.status==="active")recipients.push(agent.id);
  }
  for(const id of new Set(recipients)){
   result.due++;
   if(!options.execute)continue;
   const [user]=await db.select({locale:schema.users.locale}).from(schema.users)
    .where(eq(schema.users.id,id)).limit(1);
   const [inserted]=await db.insert(schema.notifications).values({userId:id,
    kind:grant.agencyId?"subscription_agency":"subscription_solo",
    referenceId:grant.agencyId||grant.userId,
    dedupeKey:"subscription:"+grant.id+":"+stage,
    title:subscriptionNotice(user?.locale||"fa",stage,grant.planCode)})
    .onConflictDoNothing().returning({id:schema.notifications.id});
   if(inserted)result.notified++;
  }
 }
 return result;
}
