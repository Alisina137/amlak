import assert from "node:assert/strict";
import {test} from "node:test";
import {randomUUID} from "node:crypto";
import {connectDatabase,schema} from "@amlaklink/database";
import {buildApp} from "./app";
import {hashToken,newToken,encryptTotp,newTotpSecret} from "./security";

const guestDenied=[
 "/v1/saved-searches","/v1/shortlists","/v1/support/tickets",
 "/v1/invoices","/v1/billing/adjustments","/v1/entitlements",
 "/v1/push/preferences","/v1/agencies/mine","/v1/inquiries",
 "/v1/notifications","/v1/admin/billing/claims","/v1/admin/billing/history",
 "/v1/admin/billing/reconciliation","/v1/admin/billing/adjustments",
 "/v1/admin/support/tickets","/v1/admin/pilot/scorecard"
];
const staffOnly=[
 "/v1/admin/billing/claims","/v1/admin/billing/history",
 "/v1/admin/billing/reconciliation","/v1/admin/billing/adjustments",
 "/v1/admin/support/tickets","/v1/admin/pilot/scorecard"
];
const financeOnly=[
 "/v1/admin/billing/claims","/v1/admin/billing/history",
 "/v1/admin/billing/reconciliation","/v1/admin/billing/adjustments"
];
test("Phase 8 read paths must not disclose data to unauthenticated requests",{
 skip:!process.env.DATABASE_URL},async()=>{
 const {db,sql}=connectDatabase(),app=buildApp({db});
 try{
  for(const url of guestDenied){
   const r=await app.inject({method:"GET",url});
   assert.equal(r.statusCode,401,"Unexpected guest access at "+url);
   assert.equal(r.headers["cache-control"],"no-store");
   assert.equal(r.headers["x-content-type-options"],"nosniff");
   assert.equal(r.headers["referrer-policy"],"no-referrer");
   assert.ok(r.headers["x-request-id"]);
   assert.equal(r.json().error,"AUTH_REQUIRED");
   assert.ok(!JSON.stringify(r.json()).includes("DATABASE_URL"));
  }
  const invalid=await app.inject({method:"GET",url:"/v1/shortlists/not-a-uuid"});
  assert.equal(invalid.statusCode,401);
 }finally{await app.close();await sql.end();}
});
test("Phase 8 role matrix: ordinary users and unrelated staff cannot see finance cases",{
 skip:!process.env.DATABASE_URL},async()=>{
 const {db,sql}=connectDatabase(),app=buildApp({db});
 const tag=randomUUID().slice(0,8);
 const [user]=await db.insert(schema.users).values({displayName:"QA seeker",
  email:"qa-seeker-"+tag+"@example.test",passwordHash:"test",emailVerifiedAt:new Date()}).returning();
 const [moderator,billingStaff]=await db.insert(schema.staff).values([
  {displayName:"QA moderator",email:"qa-mod-"+tag+"@example.test",passwordHash:"test",
   role:"moderator",totpSecretEncrypted:encryptTotp(newTotpSecret())},
  {displayName:"QA billing",email:"qa-billing-"+tag+"@example.test",passwordHash:"test",
   role:"billing",totpSecretEncrypted:encryptTotp(newTotpSecret())}
 ]).returning();
 const tokens=[newToken(),newToken(),newToken()];
 await db.insert(schema.sessions).values([
  {audience:"user",userId:user.id,tokenHash:hashToken(tokens[0]),
   expiresAt:new Date(Date.now()+3600_000)},
  {audience:"staff",staffId:moderator.id,tokenHash:hashToken(tokens[1]),
   expiresAt:new Date(Date.now()+3600_000)},
  {audience:"staff",staffId:billingStaff.id,tokenHash:hashToken(tokens[2]),
   expiresAt:new Date(Date.now()+3600_000)}
 ]);
 const call=async(url:string,index:number)=>app.inject({method:"GET",url,
  headers:{authorization:"Bearer "+tokens[index]}});
 try{
  for(const url of staffOnly)assert.equal((await call(url,0)).statusCode,401,"User accessed staff-only "+url);
  for(const url of financeOnly)assert.equal((await call(url,1)).statusCode,403,"Moderator accessed finance "+url);
  for(const url of financeOnly)assert.equal((await call(url,2)).statusCode,200,"Billing access failed "+url);
  const staffToUser=await call("/v1/saved-searches",2);
  assert.equal(staffToUser.statusCode,401,"Staff session must not impersonate user session");
  const inaccessible=await call("/v1/agencies/"+randomUUID()+"/performance?days=30",0);
  assert.equal(inaccessible.statusCode,403);
  const notFound=await call("/v1/support/tickets/"+randomUUID(),0);
  assert.equal(notFound.statusCode,404);
 }finally{await app.close();await sql.end();}
});
