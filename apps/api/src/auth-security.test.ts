import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
import test from "node:test";
import {and,eq} from "drizzle-orm";
import {connectDatabase,schema} from "@amlaklink/database";
import {buildApp} from "./app";
import {passwordHash} from "./security";
import type {SendCode} from "./mail";

test("verification codes are single-use under concurrent attempts; resend avoids account disclosure",{
 skip:!process.env.DATABASE_URL},async()=>{
 const {db,sql}=connectDatabase();
 const outbox:{email:string;purpose:string;code:string}[]=[];
 const mail:SendCode=async(email,purpose,code)=>{outbox.push({email,purpose,code});};
 const app=buildApp({db,mailer:mail}),tag=randomUUID().slice(0,9),email="security-a-"+tag+"@example.test";
 const post=async(path:string,body:object)=>{
  const r=await app.inject({method:"POST",url:path,payload:body});
  return {status:r.statusCode,body:r.json() as Record<string,any>};
 };
 try{
  const reg=await post("/v1/auth/register",{email,password:"LongerPassword555!",displayName:"Test account",locale:"fa"});
  assert.equal(reg.status,200);
  const code=outbox.find(v=>v.email===email&&v.purpose==="verify")?.code;
  assert.ok(code);
  const attempts=await Promise.all([
   post("/v1/auth/verify",{email,code}),
   post("/v1/auth/verify",{email,code})
  ]);
  assert.deepEqual(attempts.map(v=>v.status).sort(),[200,422]);
  assert.equal((await post("/v1/auth/verify",{email,code})).status,422);
  const before=outbox.length;
  const unknown=await post("/v1/auth/resend-verification",{email:"absent-"+tag+"@example.test"});
  const verified=await post("/v1/auth/resend-verification",{email});
  assert.equal(unknown.status,200);assert.equal(verified.status,200);
  assert.deepEqual(unknown.body,verified.body);
  assert.equal(outbox.length,before);
  const second="security-b-"+tag+"@example.test";
  assert.equal((await post("/v1/auth/register",{email:second,password:"LongerPassword555!",
   displayName:"Another person",locale:"ps"})).status,200);
  const initial=outbox.length;
  const cooldown=await Promise.all([
   post("/v1/auth/resend-verification",{email:second}),
   post("/v1/auth/resend-verification",{email:second})
  ]);
  assert.ok(cooldown.every(v=>v.status===200));
  assert.equal(outbox.length,initial,"cooldown must not generate additional delivery");
  const incorrect=await post("/v1/auth/verify",{email:second,code:"999999"});
  assert.equal(incorrect.status,422);
  const [challenge]=await db.select().from(schema.challenges).where(and(
   eq(schema.challenges.email,second),eq(schema.challenges.purpose,"verify")));
  assert.equal(challenge.attempts,1,"wrong-code attempts must commit even if endpoint responds 422");
 }finally{await app.close();await sql.end();}
});

test("sessions can be revoked remotely, refresh rotation is atomic, and password reset invalidates all",{
 skip:!process.env.DATABASE_URL},async()=>{
 const {db,sql}=connectDatabase();
 const codes=new Map<string,string>();
 const mail:SendCode=async(email,_purpose,code)=>{codes.set(email,code);};
 const app=buildApp({db,mailer:mail});
 const email="sessions-"+randomUUID().slice(0,9)+"@example.test";
 const password="SignInPassword443!";const created=await db.insert(schema.users)
  .values({email,displayName:"Session owner",passwordHash:await passwordHash(password),
   emailVerifiedAt:new Date()}).returning();
 const call=async(method:"GET"|"POST"|"DELETE",path:string,token?:string,body?:object)=>{
  const r=await app.inject({method,url:path,
   headers:token?{authorization:"Bearer "+token}:{},...(body?{payload:body}:{})});
  return {status:r.statusCode,data:r.json() as Record<string,any>};
 };
 const signIn=async(pass=password)=>{
  const result=await call("POST","/v1/auth/login",undefined,{email,password:pass});
  assert.equal(result.status,200);
  return result.data.token as string;
 };
 try{
  const first=await signIn(),second=await signIn();
  const sessions=await call("GET","/v1/auth/sessions",second);
  assert.equal(sessions.status,200);
  assert.equal(sessions.data.items.length,2);
  assert.equal(sessions.data.items.filter((s:{current:boolean})=>s.current).length,1);
  assert.equal(JSON.stringify(sessions.data).includes(first),false);
  assert.equal(JSON.stringify(sessions.data).includes(second),false);
  assert.equal((await call("POST","/v1/auth/sessions/revoke-others",second,{confirm:false})).status,422);
  const revoke=await call("POST","/v1/auth/sessions/revoke-others",second,{confirm:true});
  assert.equal(revoke.status,200);
  assert.equal(revoke.data.revoked,1);
  assert.equal((await call("GET","/v1/me",first)).status,401);
  assert.equal((await call("GET","/v1/me",second)).status,200);
  const rotations=await Promise.all([
   call("POST","/v1/auth/refresh",second),
   call("POST","/v1/auth/refresh",second)
  ]);
  assert.deepEqual(rotations.map(x=>x.status).sort(),[200,401]);
  const rotated=rotations.find(x=>x.status===200)!.data.token as string;
  assert.equal((await call("GET","/v1/me",second)).status,401);
  assert.equal((await call("GET","/v1/me",rotated)).status,200);
  assert.equal((await call("POST","/v1/auth/recover",undefined,{email})).status,200);
  const reset=await call("POST","/v1/auth/recover/complete",undefined,{
   email,code:codes.get(email),newPassword:"NewSecurePassword228!"
  });
  assert.equal(reset.status,200);
  assert.equal((await call("GET","/v1/me",rotated)).status,401);
  assert.equal((await call("POST","/v1/auth/login",undefined,{email,password})).status,401);
  const fresh=await signIn("NewSecurePassword228!");
  await db.update(schema.users).set({status:"suspended"}).where(eq(schema.users.id,created[0].id));
  assert.equal((await call("GET","/v1/me",fresh)).status,403);
 }finally{await app.close();await sql.end();}
});
