import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
import test from "node:test";
import {and,eq} from "drizzle-orm";
import {connectDatabase,schema} from "@amlaklink/database";
import {buildApp} from "./app";
import {freshnessAction,freshnessSweep,pilotScorecard} from "./pilot";
import {hashToken,newToken,encryptTotp,newTotpSecret} from "./security";

test("freshness boundaries and no premature pause",()=>{
 const now=new Date("2026-10-18T12:00:00.000Z");
 assert.equal(freshnessAction(new Date("2026-10-05T12:00:00Z"),now),null);
 assert.equal(freshnessAction(new Date("2026-10-04T12:00:00Z"),now),"remind");
 assert.equal(freshnessAction(new Date("2026-09-18T12:00:00Z"),now),"pause");
 assert.equal(freshnessAction(null,now),"pause");
});
test("pilot freshness job: scoped, safe dry-run, deduped reminders, stale pause, roles",{skip:!process.env.DATABASE_URL},async()=>{
 const {db,sql}=connectDatabase(),app=buildApp({db});
 const tag=randomUUID().slice(0,8),now=new Date(),day=86400_000;
 const user=await db.insert(schema.users).values({
  displayName:"Pilot advertiser",email:"pilot-"+tag+"@example.test",passwordHash:"test",advertiserEnabled:true,emailVerifiedAt:now
 }).returning().then(r=>r[0]);
 const staff=await db.insert(schema.staff).values([
  {displayName:"Operations administrator",email:"pilot-admin-"+tag+"@example.test",
   passwordHash:"test",role:"admin",totpSecretEncrypted:encryptTotp(newTotpSecret())},
  {displayName:"Support viewer",email:"pilot-support-"+tag+"@example.test",
   passwordHash:"test",role:"support",totpSecretEncrypted:encryptTotp(newTotpSecret())}
 ]).returning();
 const tokens=[newToken(),newToken(),newToken()];
 await db.insert(schema.sessions).values([
  {audience:"user",userId:user.id,tokenHash:hashToken(tokens[0]),expiresAt:new Date(now.getTime()+day)},
  ...staff.map((u,i)=>({audience:"staff",staffId:u.id,tokenHash:hashToken(tokens[i+1]),expiresAt:new Date(now.getTime()+day)}))
 ]);
 const past=(d:number)=>new Date(now.getTime()-d*day);
 const rows=await db.insert(schema.listings).values([
  {authorId:user.id,publisher:"private",clientRequestId:randomUUID(),status:"published",lastConfirmedAt:past(20),publishedAt:past(25)},
  {authorId:user.id,publisher:"private",clientRequestId:randomUUID(),status:"published",lastConfirmedAt:past(35),publishedAt:past(40)},
  {authorId:user.id,publisher:"private",clientRequestId:randomUUID(),status:"published",lastConfirmedAt:past(7),publishedAt:past(10)}
 ]).returning();
 const listingIds=rows.map(r=>r.id);
 const call=async(path:string,index?:number,method:"GET"|"POST"="GET")=>{
  const r=await app.inject({method,url:path,headers:index===undefined?{}:{authorization:"Bearer "+tokens[index]}});
  return {status:r.statusCode,data:r.json() as Record<string,any>};
 };
 try{
  const dry=await freshnessSweep(db,{execute:false,now,listingIds});
  assert.equal(dry.dueReminder,1);assert.equal(dry.duePause,1);
  assert.equal(dry.reminded,0);assert.equal(dry.paused,0);
  assert.equal((await call("/v1/admin/pilot/scorecard")).status,401);
  assert.equal((await call("/v1/admin/pilot/scorecard",0)).status,401);
  assert.equal((await call("/v1/admin/pilot/scorecard",2)).status,200);
  assert.equal((await call("/v1/admin/pilot/freshness/run",2,"POST")).status,403);
  assert.equal((await call("/v1/admin/pilot/scorecard",1)).status,200);
  const report=await pilotScorecard(db,now);assert.equal(report.releaseApproved,false);
  const run=await freshnessSweep(db,{execute:true,now,listingIds});
  assert.equal(run.reminded,1);assert.equal(run.paused,1);
  const rerun=await freshnessSweep(db,{execute:true,now,listingIds});
  assert.equal(rerun.dueReminder,0);assert.equal(rerun.duePause,0);
  assert.equal((await db.select().from(schema.listings).where(eq(schema.listings.id,rows[1].id)))[0].status,"paused");
  const notices=await db.select().from(schema.notifications).where(eq(schema.notifications.userId,user.id));
  assert.equal(notices.filter(n=>n.kind==="freshness").length,2);
  // Next confirmation starts a new 14-day cycle (not suppressed by previous notifications).
  await db.update(schema.listings).set({lastConfirmedAt:past(15)})
   .where(eq(schema.listings.id,rows[0].id));
  const refresh=await freshnessSweep(db,{execute:true,now,listingIds});
  assert.equal(refresh.reminded,1);
  const noticesAfter=await db.select().from(schema.notifications).where(eq(schema.notifications.userId,user.id));
  assert.equal(noticesAfter.filter(n=>n.kind==="freshness").length,3);
 }finally{await app.close();await sql.end();}
});
