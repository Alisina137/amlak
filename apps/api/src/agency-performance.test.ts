import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
import test from "node:test";
import {connectDatabase,schema} from "@amlaklink/database";
import {buildApp} from "./app";
import {firstResponseMs,reportSlice} from "./agency-performance";
import {hashToken,newToken} from "./security";
test("agent performance measures first advertiser reply only",()=>{
 const t=new Date("2026-10-18T10:00:00Z"),seeker=randomUUID(),rep=randomUUID();
 assert.equal(firstResponseMs(t,[{authorId:seeker,createdAt:new Date(t.getTime()+1000)},
  {authorId:rep,createdAt:new Date(t.getTime()+120000)}],seeker),120000);
 assert.equal(firstResponseMs(t,[{authorId:seeker,createdAt:t}],seeker),null);
 assert.equal((Date.now()-reportSlice(7).getTime())>6*86400_000,true);
 assert.throws(()=>reportSlice(1));
});
test("agency performance is private to active management; agents see only assigned queue",
 {skip:!process.env.DATABASE_URL},async()=>{
 const {db,sql}=connectDatabase(),app=buildApp({db});
 const suffix=randomUUID().slice(0,8);
 const [owner,agent,outsider]=await db.insert(schema.users).values([
  {displayName:"Reporting owner",email:"agency-report-owner-"+suffix+"@example.test",passwordHash:"test",emailVerifiedAt:new Date()},
  {displayName:"Reporting agent",email:"agency-report-agent-"+suffix+"@example.test",passwordHash:"test",emailVerifiedAt:new Date()},
  {displayName:"Reporting stranger",email:"agency-report-other-"+suffix+"@example.test",passwordHash:"test",emailVerifiedAt:new Date()}
 ]).returning();
 const [agency]=await db.insert(schema.agencies).values({name:"Reporting agency "+suffix,
  status:"active",provinceId:"kabul",creatorId:owner.id}).returning();
 await db.insert(schema.memberships).values([
  {agencyId:agency.id,userId:owner.id,role:"owner",status:"active"},
  {agencyId:agency.id,userId:agent.id,role:"agent",status:"active"}]);
 const tokens=[newToken(),newToken(),newToken()];
 await db.insert(schema.sessions).values([owner,agent,outsider].map((u,i)=>({
  audience:"user",userId:u.id,tokenHash:hashToken(tokens[i]),expiresAt:new Date(Date.now()+3600_000)})));
 const get=async(path:string,who?:number)=>{
  const r=await app.inject({method:"GET",url:path,headers:who===undefined?{}:{authorization:"Bearer "+tokens[who]}});
  return {status:r.statusCode,body:r.json() as Record<string,any>};
 };
 try{
  const base="/v1/agencies/"+agency.id;
  assert.equal((await get(base+"/performance?days=30")).status,401);
  assert.equal((await get(base+"/performance?days=30",2)).status,403);
  assert.equal((await get(base+"/performance?days=30",1)).status,403);
  assert.equal((await get(base+"/performance?days=14",0)).status,422);
  const report=await get(base+"/performance?days=30",0);
  assert.equal(report.status,200);assert.equal(report.body.aggregates.total,0);
  assert.equal(report.body.agents.length,2);
  assert.equal((await get(base+"/lead-queue?status=unassigned",1)).status,403);
  assert.equal((await get(base+"/lead-queue?status=all",1)).status,200);
  assert.equal((await get(base+"/lead-queue?status=all",2)).status,403);
  assert.equal((await get(base+"/lead-queue?status=unassigned",0)).status,200);
 }finally{await app.close();await sql.end();}
});
