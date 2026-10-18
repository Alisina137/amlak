import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
import test from "node:test";
import {connectDatabase,schema} from "@amlaklink/database";
import {buildApp} from "./app";
import {PRODUCTS} from "./billing";
import {hashToken,newToken} from "./security";
import {DAY_MS,RENEWAL_GRACE_DAYS,describeSubscription,renewalStage,readSubscription,subscriptionNotice} from "./subscription-lifecycle";
import {scanSubscriptionRenewals} from "./subscription-worker";

test("subscription lifecycle: paid quota ends exactly at expiry; grace is not a paid extension",()=>{
 const now=new Date("2030-02-10T12:00:00Z");
 const expiry=new Date(now.getTime()+2*DAY_MS);
 const grant={id:randomUUID(),invoiceId:randomUUID(),agencyId:randomUUID(),userId:null,
  planCode:"agency_growth",listingLimit:200,seatLimit:15,
  startsAt:new Date(now.getTime()-20*DAY_MS),expiresAt:expiry};
 const ongoing=describeSubscription([grant],"agency",now);
 assert.equal(ongoing.status,"active");assert.equal(ongoing.listingLimit,200);
 assert.equal(ongoing.daysRemaining,2);assert.equal(ongoing.renewalNeeded,true);
 const atExpiry=describeSubscription([grant],"agency",expiry);
 assert.equal(atExpiry.status,"grace");assert.equal(atExpiry.plan,"free");
 assert.equal(atExpiry.listingLimit,3);assert.equal(atExpiry.seatLimit,3);
 assert.equal(atExpiry.graceAllowsNewPaidCapacity,false);
 assert.equal(atExpiry.graceDaysRemaining,RENEWAL_GRACE_DAYS);
 assert.equal(describeSubscription([grant],"agency",new Date(expiry.getTime()+3*DAY_MS)).status,"expired");
 assert.equal(describeSubscription([],"solo",now).status,"free");
 assert.equal(describeSubscription([],"solo",now).seatLimit,1);
 const renewal={...grant,id:randomUUID(),invoiceId:randomUUID(),
  planCode:"agency_standard",listingLimit:50,seatLimit:5,startsAt:expiry,
  expiresAt:new Date(expiry.getTime()+30*DAY_MS)};
 const before=describeSubscription([grant,renewal],"agency",now);
 assert.equal(before.status,"active");assert.equal(before.plan,"agency_growth");
 assert.equal(before.scheduled?.plan,"agency_standard");assert.equal(before.renewalNeeded,false);
 const switched=describeSubscription([grant,renewal],"agency",expiry);
 assert.equal(switched.status,"active");assert.equal(switched.plan,"agency_standard");
 assert.equal(switched.listingLimit,50);
 assert.equal(switched.scheduled,null);
});
test("renewal thresholds and localized notices have no past-due blast",()=>{
 const now=new Date("2030-02-01T00:00:00Z"),e=(days:number)=>new Date(now.getTime()+days*DAY_MS);
 assert.equal(renewalStage(e(8),now),null);
 assert.equal(renewalStage(e(7),now),"seven_days");
 assert.equal(renewalStage(e(3),now),"three_days");
 assert.equal(renewalStage(e(1),now),"one_day");
 assert.equal(renewalStage(e(0),now),"grace_started");
 assert.equal(renewalStage(e(-2.5),now),"grace_ending");
 assert.equal(renewalStage(e(-3),now),"expired");
 for(const locale of ["fa","ps","en"])assert.ok(subscriptionNotice(locale,"expired","solo_agent").length<=160);
});
test("renewal API and worker: private scope, owner-only notice, dedupe, confirmed renewal suppression",
 {skip:!process.env.DATABASE_URL},async()=>{
 const {db,sql}=connectDatabase(),app=buildApp({db});
 const tag=randomUUID().slice(0,8),now=new Date();
 const [owner,member,outsider]=await db.insert(schema.users).values([
  {displayName:"Renewal owner",email:"renewowner-"+tag+"@example.test",passwordHash:"test",emailVerifiedAt:now,locale:"fa"},
  {displayName:"Renewal teammate",email:"renewmember-"+tag+"@example.test",passwordHash:"test",emailVerifiedAt:now,locale:"ps"},
  {displayName:"Renewal outside",email:"renewother-"+tag+"@example.test",passwordHash:"test",emailVerifiedAt:now}
 ]).returning();
 const [agency]=await db.insert(schema.agencies).values({
  name:"Renewal test "+tag,provinceId:"kabul",creatorId:owner.id,status:"active"
 }).returning();
 await db.insert(schema.memberships).values([
  {agencyId:agency.id,userId:owner.id,role:"owner",status:"active"},
  {agencyId:agency.id,userId:member.id,role:"agent",status:"active"}
 ]);
 const tokens=[newToken(),newToken(),newToken()];
 await db.insert(schema.sessions).values([owner,member,outsider].map((u,i)=>({
  audience:"user",userId:u.id,tokenHash:hashToken(tokens[i]),expiresAt:new Date(Date.now()+3600_000)
 })));
 const [invoice]=await db.insert(schema.growthInvoices).values({
  payerId:owner.id,requestId:randomUUID(),agencyId:agency.id,productCode:"agency_growth",
  amountAfn:PRODUCTS.agency_growth.amountAfn,status:"confirmed"
 }).returning();
 const expiry=new Date(now.getTime()+2*DAY_MS);
 const [grant]=await db.insert(schema.growthEntitlements).values({
  invoiceId:invoice.id,agencyId:agency.id,planCode:"agency_growth",
  listingLimit:200,seatLimit:15,startsAt:new Date(now.getTime()-20*DAY_MS),expiresAt:expiry
 }).returning();
 const get=async(as:number,path:string)=>{
  const res=await app.inject({method:"GET",url:path,
   headers:{authorization:"Bearer "+tokens[as]}});
  return {status:res.statusCode,body:res.json() as Record<string,any>};
 };
 try{
  const active=await get(0,"/v1/entitlements?agencyId="+agency.id);
  assert.equal(active.status,200);assert.equal(active.body.plan,"agency_growth");
  assert.equal(active.body.status,"active");assert.equal(active.body.listingLimit,200);
  assert.equal((await get(2,"/v1/entitlements?agencyId="+agency.id)).status,403);
  assert.equal((await get(1,"/v1/entitlements?agencyId="+agency.id)).body.plan,"agency_growth");
  assert.equal((await readSubscription(db,{agencyId:agency.id},expiry)).status,"grace");
  assert.equal((await readSubscription(db,{agencyId:agency.id},expiry)).listingLimit,3);
  const dry=await scanSubscriptionRenewals(db,{execute:false,now,limit:100});
  assert.ok(dry.due>=1);assert.equal(dry.notified,0);
  const first=await scanSubscriptionRenewals(db,{execute:true,now,limit:100});
  assert.ok(first.notified>=1);
  const notices=await db.select().from(schema.notifications);
  const target=notices.filter(n=>n.dedupeKey==="subscription:"+grant.id+":three_days");
  assert.equal(target.length,1);
  assert.equal(target[0].userId,owner.id);
  assert.equal(target[0].kind,"subscription_agency");
  const again=await scanSubscriptionRenewals(db,{execute:true,now,limit:100});
  assert.equal(again.notified,0);
  const [nextInvoice]=await db.insert(schema.growthInvoices).values({
   payerId:owner.id,requestId:randomUUID(),agencyId:agency.id,
   productCode:"agency_standard",amountAfn:PRODUCTS.agency_standard.amountAfn,status:"confirmed"
  }).returning();
  await db.insert(schema.growthEntitlements).values({
   invoiceId:nextInvoice.id,agencyId:agency.id,planCode:"agency_standard",
   listingLimit:50,seatLimit:5,startsAt:expiry,expiresAt:new Date(expiry.getTime()+30*DAY_MS)
  });
  const scheduled=await get(0,"/v1/entitlements?agencyId="+agency.id);
  assert.equal(scheduled.body.scheduled.plan,"agency_standard");
  assert.equal(scheduled.body.renewalNeeded,false);
  const after=await scanSubscriptionRenewals(db,{execute:true,now:new Date(now.getTime()+DAY_MS),limit:100});
  assert.equal(after.notified,0);
  assert.ok(after.skippedRenewed>=1);
 }finally{await app.close();await sql.end();}
});
