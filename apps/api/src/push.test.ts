import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
import test from "node:test";
import {eq} from "drizzle-orm";
import {connectDatabase,schema} from "@amlaklink/database";
import {buildApp} from "./app";
import {tokenDigest,pushCategory,pushEnabled} from "./push";
import {expoPayload,pushAllowed,scanPushDeliveries,retryableExpoError} from "./push-worker";
import {hashToken,newToken} from "./security";

test("push policy maps kinds to private opt-in categories",()=>{
 const time=new Date("2026-10-18T06:00:00Z");
 const p={enabled:true,enabledAt:time,savedSearches:true,inquiries:true,viewings:false,account:true};
 assert.equal(pushCategory("saved_search"),"savedSearches");
 assert.equal(pushCategory("support"),"account");
 assert.equal(pushCategory("lead"),"inquiries");
 assert.equal(pushAllowed(p,"viewing",new Date(time.getTime()+1000)),false);
 assert.equal(pushAllowed(p,"saved_search",new Date(time.getTime()-1000)),false);
 assert.equal(pushAllowed({...p,enabled:false},"inquiry",new Date(time.getTime()+1000)),false);
 assert.equal(pushAllowed(p,"saved_search",new Date(time.getTime()+1000)),true);
 const notif=expoPayload("ExpoPushToken[12345678901234567890]",
  {id:randomUUID(),userId:randomUUID(),kind:"saved_search",title:"PRIVATE PATIENT PHONE NUMBER",referenceId:randomUUID()});
 assert.equal(notif.ttl,3600);
 assert.equal(notif.channelId,"amlaklink-alerts");
 assert.ok(!JSON.stringify(notif).includes("PRIVATE PATIENT PHONE NUMBER"));
 assert.match(String(notif.data.recipientId),/^[0-9a-f-]{36}$/i);
 assert.equal(retryableExpoError("MessageRateExceeded"),true);
 assert.equal(retryableExpoError("ServiceUnavailable"),true);
 assert.equal(retryableExpoError("DeviceNotRegistered"),false);
 assert.equal(retryableExpoError("MessageTooBig"),false);
 assert.ok(!("url" in notif.data));
 assert.equal(tokenDigest("x"),tokenDigest("x"));
 assert.notEqual(tokenDigest("x"),tokenDigest("y"));
});

test("push routes enforce user consent, token ownership and in-app fallback",{skip:!process.env.DATABASE_URL},async()=>{
 const previousFlag=process.env.AMLAK_PUSH_ENABLED,previousProject=process.env.AMLAK_EXPO_PROJECT_ID;
 const projectId=randomUUID();
 process.env.AMLAK_PUSH_ENABLED="true";process.env.AMLAK_EXPO_PROJECT_ID=projectId;
 const {db,sql}=connectDatabase(),app=buildApp({db});
 const suffix=randomUUID().slice(0,8);
 const accounts=await db.insert(schema.users).values([
  {displayName:"Push user",email:"push-"+suffix+"@example.test",passwordHash:"test",emailVerifiedAt:new Date()},
  {displayName:"Wrong user",email:"push-other-"+suffix+"@example.test",passwordHash:"test",emailVerifiedAt:new Date()}
 ]).returning();
 const tokens=accounts.map(()=>newToken());
 await db.insert(schema.sessions).values(accounts.map((p,i)=>({
  audience:"user",userId:p.id,tokenHash:hashToken(tokens[i]),
  expiresAt:new Date(Date.now()+3600_000)
 })));
 const call=async(method:"GET"|"POST"|"PATCH"|"DELETE",url:string,as?:number,body?:object)=>{
  const response=await app.inject({method,url,headers:as===undefined?{}:{authorization:"Bearer "+tokens[as]},
   ...(body?{payload:body}:{})});
  return {code:response.statusCode,body:response.json() as Record<string,any>};
 };
 try{
  assert.equal(pushEnabled(),true);
  assert.equal((await call("GET","/v1/push/preferences")).code,401);
  const init=await call("GET","/v1/push/preferences",0);
  assert.equal(init.body.preferences.enabled,false);
  assert.equal((await call("POST","/v1/push/test")).code,401);
  assert.equal((await call("POST","/v1/push/test",0)).code,409);
  assert.equal((await call("PATCH","/v1/push/preferences",0,{enabled:true})).code,409);
  const installationId=randomUUID(),expoToken="ExpoPushToken[1234567890123456789012345678]";
  assert.equal((await call("POST","/v1/push/devices",0,{
   installationId,projectId,platform:"android",expoToken:"invalid"})).code,422);
  assert.equal((await call("POST","/v1/push/devices",0,{
   installationId,projectId:randomUUID(),platform:"android",expoToken})).code,422);
  assert.equal((await call("POST","/v1/push/devices",0,{
   installationId,projectId,platform:"android",expoToken})).code,200);
  assert.equal((await call("POST","/v1/push/devices",1,{
   installationId:randomUUID(),projectId,platform:"android",expoToken})).code,409);
  assert.equal((await call("PATCH","/v1/push/preferences",0,{enabled:true})).code,200);
  assert.equal((await call("GET","/v1/push/preferences",1)).body.preferences.enabled,false);
  assert.equal((await call("PATCH","/v1/push/preferences",1,{savedSearches:false})).code,200);
  const [notice]=await db.insert(schema.notifications).values({
   userId:accounts[0].id,kind:"saved_search",title:"A property meets your search",
   referenceId:randomUUID(),dedupeKey:"push-test-"+suffix
  }).returning();
  const dry=await scanPushDeliveries(db,{execute:false,now:new Date(Date.now()+120_000)});
  assert.equal(dry.execute,false);assert.ok(dry.eligible>=1);
  assert.equal((await db.select().from(schema.pushDeliveries).where(eq(schema.pushDeliveries.notificationId,notice.id))).length,0);
  const ticketId=randomUUID();let sends=0,receipts=0;
  const fakeFetch=(async (url:string|URL|Request)=>{
   const path=String(url);
   if(path.includes("getReceipts")){
    receipts++;
    return new Response(JSON.stringify({data:{[ticketId]:{status:"ok"}}}),{status:200});
   }
   sends++;return new Response(JSON.stringify({data:[{status:"ok",id:ticketId}]}),{status:200});
  }) as typeof fetch;
  const first=await scanPushDeliveries(db,{execute:true,now:new Date(Date.now()+120_000),fetcher:fakeFetch});
  assert.ok(first.expoAccepted>=1);assert.ok(sends>=1);
  const receipt=await scanPushDeliveries(db,{execute:true,now:new Date(Date.now()+20*60_000),fetcher:fakeFetch});
  assert.ok(receipt.expoDelivered>=1);assert.ok(receipts>=1);
  const pushes=await db.select().from(schema.pushDeliveries).where(eq(schema.pushDeliveries.notificationId,notice.id));
  assert.equal(pushes[0].status,"delivered");
  const testSend=await call("POST","/v1/push/test",0);
  assert.equal(testSend.code,200);
  assert.equal(testSend.body.queued,true);
  const [testNotice]=await db.select().from(schema.notifications)
   .where(eq(schema.notifications.id,testSend.body.notificationId)).limit(1);
  assert.equal(testNotice.kind,"push_test");
  assert.equal(testNotice.userId,accounts[0].id);
  const testDelivery=await scanPushDeliveries(db,{execute:true,
   now:new Date(Date.now()+21*60_000),fetcher:fakeFetch});
  assert.equal(testDelivery.expoAccepted,1);
  assert.equal((await call("POST","/v1/push/test",1)).code,409);
  assert.equal((await call("PATCH","/v1/push/preferences",0,{enabled:false})).code,200);
  const countBefore=sends;
  const disabled=await scanPushDeliveries(db,{execute:true,now:new Date(Date.now()+25*60_000),fetcher:fakeFetch});
  assert.equal(disabled.eligible,0);assert.equal(sends,countBefore);
  assert.equal((await call("DELETE","/v1/push/devices/"+installationId,1)).code,200);
  assert.equal((await call("DELETE","/v1/push/devices/"+installationId,0)).code,200);
  assert.equal((await call("GET","/v1/push/preferences",0)).body.registeredDevices,0);
 }finally{
  await app.close();await sql.end();
  if(previousFlag===undefined)delete process.env.AMLAK_PUSH_ENABLED;else process.env.AMLAK_PUSH_ENABLED=previousFlag;
  if(previousProject===undefined)delete process.env.AMLAK_EXPO_PROJECT_ID;else process.env.AMLAK_EXPO_PROJECT_ID=previousProject;
 }
});
