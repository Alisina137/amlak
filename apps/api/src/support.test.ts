import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
import test from "node:test";
import {connectDatabase,schema} from "@amlaklink/database";
import {buildApp} from "./app";
import {newToken,hashToken,newTotpSecret,encryptTotp} from "./security";
test("Phase 8 support tickets are retry-safe, private, staffed and auditable",{skip:!process.env.DATABASE_URL},async()=>{
 const {db,sql}=connectDatabase(),app=buildApp({db});
 const tag=randomUUID().slice(0,8),now=new Date();
 const people=await db.insert(schema.users).values([
  {displayName:"Asker",email:"asker-"+tag+"@example.test",passwordHash:"test",emailVerifiedAt:now},
  {displayName:"Other",email:"other-"+tag+"@example.test",passwordHash:"test",emailVerifiedAt:now}
 ]).returning();
 const staff=await db.insert(schema.staff).values([
  {displayName:"Support agent",email:"sup-"+tag+"@example.test",passwordHash:"test",
   role:"support",totpSecretEncrypted:encryptTotp(newTotpSecret())},
  {displayName:"Moderator",email:"mod-"+tag+"@example.test",passwordHash:"test",
   role:"moderator",totpSecretEncrypted:encryptTotp(newTotpSecret())}
 ]).returning();
 const tokens=Array.from({length:4},()=>newToken());
 await db.insert(schema.sessions).values([
  ...people.map((u,i)=>({audience:"user",userId:u.id,tokenHash:hashToken(tokens[i]),
   expiresAt:new Date(Date.now()+3600000)})),
  ...staff.map((u,i)=>({audience:"staff",staffId:u.id,tokenHash:hashToken(tokens[i+2]),
   expiresAt:new Date(Date.now()+3600000)}))
 ]);
 const call=async(method:"GET"|"POST",path:string,who?:number,payload?:object)=>{
  const r=await app.inject({method,url:path,headers:who===undefined?{}:{authorization:"Bearer "+tokens[who]},
   ...(payload?{payload}:{})});
  return {status:r.statusCode,data:r.json() as Record<string,any>};
 };
 try{
  assert.equal((await call("GET","/v1/support/tickets")).status,401);
  const body={requestId:randomUUID(),category:"listing",subject:"My listing isn't visible",
   body:"I submitted my listing but cannot find it in results."};
  const created=await call("POST","/v1/support/tickets",0,body);
  assert.equal(created.status,200);
  const id=created.data.id as string;
  const reused=await call("POST","/v1/support/tickets",0,body);
  assert.equal(reused.data.id,id);assert.equal(reused.data.reused,true);
  assert.equal((await call("GET","/v1/support/tickets/"+id,1)).status,404);
  assert.equal((await call("GET","/v1/admin/support/tickets",0)).status,401);
  assert.equal((await call("GET","/v1/admin/support/tickets",3)).status,403);
  assert.equal((await call("GET","/v1/admin/support/tickets",2)).status,200);
  const reply={requestId:randomUUID(),body:"Please check whether you confirmed availability."};
  const staffReply=await call("POST","/v1/admin/support/tickets/"+id+"/replies",2,reply);
  assert.equal(staffReply.status,200);
  const again=await call("POST","/v1/admin/support/tickets/"+id+"/replies",2,reply);
  assert.equal(again.data.reused,true);
  const details=await call("GET","/v1/support/tickets/"+id,0);
  assert.equal(details.data.messages.length,2);
  assert.equal(details.data.ticket.status,"awaiting_user");
  const userReply=await call("POST","/v1/support/tickets/"+id+"/replies",0,
   {requestId:randomUUID(),body:"It is published and fresh."});
  assert.equal(userReply.status,200);
  assert.equal((await call("POST","/v1/admin/support/tickets/"+id+"/status",3,
   {status:"resolved",reason:"Issue has been explained."})).status,403);
  assert.equal((await call("POST","/v1/admin/support/tickets/"+id+"/status",2,
   {status:"resolved",reason:"Issue has been explained."})).status,200);
  assert.equal((await call("POST","/v1/admin/support/tickets/"+id+"/status",2,
   {status:"closed",reason:"User received requested explanation."})).status,200);
  assert.equal((await call("POST","/v1/support/tickets/"+id+"/replies",0,
   {requestId:randomUUID(),body:"Hello?"})).status,409);
  const notices=await db.select().from(schema.notifications);
  assert.ok(notices.some(n=>n.userId===people[0].id&&n.kind==="support"&&n.referenceId===id));
 }finally{await app.close();await sql.end();}
});
