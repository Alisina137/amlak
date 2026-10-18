import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
import test from "node:test";
import {connectDatabase,schema} from "@amlaklink/database";
import {buildApp} from "./app";
import {referenceHash} from "./billing";
import {encryptTotp,hashToken,newToken,newTotpSecret} from "./security";

test("Step 4 finance: scoped history, replay protection, refunds and noncash credits",
 {skip:!process.env.DATABASE_URL},async()=>{
 const {db,sql}=connectDatabase(),app=buildApp({db});
 const tag=randomUUID().slice(0,8);
 const people=await db.insert(schema.users).values([
  {displayName:"Billing owner",email:"billing-payer-"+tag+"@example.test",
   passwordHash:"test",emailVerifiedAt:new Date()},
  {displayName:"Another person",email:"billing-outsider-"+tag+"@example.test",
   passwordHash:"test",emailVerifiedAt:new Date()}
 ]).returning();
 const staff=await db.insert(schema.staff).values([
  {displayName:"Billing reviewer 1",email:"finance-one-"+tag+"@example.test",passwordHash:"test",
   role:"billing",totpSecretEncrypted:encryptTotp(newTotpSecret())},
  {displayName:"Billing reviewer 2",email:"finance-two-"+tag+"@example.test",passwordHash:"test",
   role:"billing",totpSecretEncrypted:encryptTotp(newTotpSecret())},
  {displayName:"Moderator not finance",email:"moderator-fin-"+tag+"@example.test",passwordHash:"test",
   role:"moderator",totpSecretEncrypted:encryptTotp(newTotpSecret())}
 ]).returning();
 const tokens=[...people,...staff].map(()=>newToken());
 await db.insert(schema.sessions).values([
  ...people.map((person,i)=>({audience:"user",userId:person.id,
   tokenHash:hashToken(tokens[i]),expiresAt:new Date(Date.now()+3600_000)})),
  ...staff.map((person,i)=>({audience:"staff",staffId:person.id,
   tokenHash:hashToken(tokens[i+people.length]),expiresAt:new Date(Date.now()+3600_000)}))
 ]);
 const invoiceValues={payerId:people[0].id,requestId:randomUUID(),productCode:"solo_agent",amountAfn:500};
 const [invoice]=await db.insert(schema.growthInvoices).values({...invoiceValues,status:"confirmed"}).returning();
 const [claimInvoice]=await db.insert(schema.growthInvoices).values({
  ...invoiceValues,requestId:randomUUID(),status:"submitted"}).returning();
 const [claim]=await db.insert(schema.paymentClaims).values({
  invoiceId:claimInvoice.id,submittedBy:people[0].id,method:"bank_transfer",
  reference:"bank-pay-"+tag,referenceHash:referenceHash("bank_transfer","bank-pay-"+tag)
 }).returning();
 const call=async(method:"GET"|"POST",path:string,who?:number,payload?:object)=>{
  const r=await app.inject({method,url:path,headers:who===undefined?{}:{authorization:"Bearer "+tokens[who]},
   ...(payload?{payload}:{})});
  return {status:r.statusCode,body:r.json() as Record<string,any>};
 };
 const reason="This adjustment relates only to a verified AmlakLink platform fee.";
 try{
  assert.equal((await call("GET","/v1/billing/adjustments")).status,401);
  assert.equal((await call("GET","/v1/admin/billing/history",0)).status,401);
  assert.equal((await call("GET","/v1/admin/billing/adjustments",4)).status,403);
  assert.equal((await call("GET","/v1/invoices/"+invoice.id+"/claims",1)).status,404);
  assert.equal((await call("POST","/v1/invoices/"+invoice.id+"/adjustments",1,{
   requestId:randomUUID(),kind:"refund",amountAfn:100,reason})).status,404);
  const decisionPath="/v1/admin/billing/claims/"+claim.id+"/decision";
  const rejectData={decision:"reject",reason:"Independent statement did not match the receipt."};
  assert.equal((await call("POST",decisionPath,2,{decision:"confirm",
   reason:"The statement matches the transfer."})).status,422);
  assert.equal((await call("POST",decisionPath,2,{decision:"confirm",
   reason:"The statement matches the transfer.",reconciliation:{
    statementReference:"independent-"+tag,matchedAmountAfn:499,
    statementDate:new Date().toISOString().slice(0,10),independentlyVerified:true
   }})).status,409);
  const ok=await call("POST",decisionPath,2,{decision:"confirm",
   reason:"Financial statement independently reviewed and matched.",reconciliation:{
    statementReference:"independent-"+tag,matchedAmountAfn:500,
    statementDate:new Date().toISOString().slice(0,10),independentlyVerified:true
   }});
  assert.equal(ok.status,200);
  assert.equal((await call("POST",decisionPath,2,rejectData)).status,409);
  // Rejected claims do not activate anything; a *new* external reference is
  // necessary for resubmission and may not be recycled on a different invoice.
  const [retryInvoice]=await db.insert(schema.growthInvoices).values({
   ...invoiceValues,requestId:randomUUID(),status:"submitted"}).returning();
  const [rejected]=await db.insert(schema.paymentClaims).values({
   invoiceId:retryInvoice.id,submittedBy:people[0].id,method:"cash_deposit",
   reference:"wrong-receipt-"+tag,
   referenceHash:referenceHash("cash_deposit","wrong-receipt-"+tag)
  }).returning();
  const rejectResult=await call("POST","/v1/admin/billing/claims/"+rejected.id+"/decision",2,
   {decision:"reject",reason:"No matching cash receipt could be found in the external ledger."});
  assert.equal(rejectResult.status,200);
  const rejectedClaims=await call("GET","/v1/invoices/"+retryInvoice.id+"/claims",0);
  assert.equal(rejectedClaims.body.items[0].status,"rejected");
  assert.match(rejectedClaims.body.items[0].reviewReason,/external ledger/);
  assert.equal((await call("POST","/v1/invoices/"+retryInvoice.id+"/claims",0,
   {method:"cash_deposit",reference:"wrong-receipt-"+tag})).body.status,"rejected");
  const retried=await call("POST","/v1/invoices/"+retryInvoice.id+"/claims",0,
   {method:"cash_deposit",reference:"correct-receipt-"+tag});
  assert.equal(retried.status,200);assert.equal(retried.body.status,"submitted");
  assert.equal((await call("POST","/v1/admin/billing/claims/"+retried.body.id+"/decision",2,
   {decision:"reject",reason:"Customer needs an additional bank confirmation document."})).status,200);
  const safeHistory=await call("GET","/v1/invoices/"+claimInvoice.id+"/claims",0);
  assert.equal(safeHistory.status,200);
  assert.equal(safeHistory.body.items[0].status,"confirmed");
  assert.equal(safeHistory.body.items[0].reference,undefined);
  assert.equal(safeHistory.body.items[0].reconciliationReferenceHash,undefined);
  const item={requestId:randomUUID(),kind:"refund",amountAfn:250,reason};
  const created=await call("POST","/v1/invoices/"+invoice.id+"/adjustments",0,item);
  assert.equal(created.status,200);const adjustmentId=created.body.id as string;
  const reused=await call("POST","/v1/invoices/"+invoice.id+"/adjustments",0,item);
  assert.equal(reused.body.id,adjustmentId);assert.equal(reused.body.reused,true);
  assert.equal((await call("POST","/v1/invoices/"+invoice.id+"/adjustments",0,{
   requestId:randomUUID(),kind:"credit",amountAfn:300,reason})).status,409);
  assert.equal((await call("GET","/v1/billing/adjustments",1)).body.items.length,0);
  const approvePath="/v1/admin/billing/adjustments/"+adjustmentId+"/decision";
  assert.equal((await call("POST",approvePath,4,{decision:"approve",reason})).status,403);
  assert.equal((await call("POST",approvePath,2,{decision:"approve",reason})).status,200);
  assert.equal((await call("POST",approvePath,2,{decision:"approve",reason})).status,409);
  const settlePath="/v1/admin/billing/adjustments/"+adjustmentId+"/settle";
  assert.equal((await call("POST",settlePath,2,{
   method:"bank_transfer",reference:"refund-"+tag,reason,independentlyVerified:true})).status,403);
  assert.equal((await call("POST",settlePath,3,{
   method:"bank_transfer",reference:"refund-"+tag,reason,independentlyVerified:true})).status,200);
  assert.equal((await call("POST",settlePath,3,{
   method:"bank_transfer",reference:"refund-"+tag,reason,independentlyVerified:true})).status,409);
  const credit=await call("POST","/v1/invoices/"+invoice.id+"/adjustments",0,{
   requestId:randomUUID(),kind:"credit",amountAfn:250,reason});
  assert.equal(credit.status,200);
  assert.equal((await call("POST","/v1/admin/billing/adjustments/"+credit.body.id+"/decision",2,
   {decision:"approve",reason})).status,200);
  const end=await call("GET","/v1/billing/adjustments",0);
  assert.equal(end.body.items.find((r:{id:string})=>r.id===credit.body.id).status,"issued");
  const history=await call("GET","/v1/admin/billing/history",2);
  assert.equal(history.status,200);
  const evidence=history.body.claims.find((x:{claim:{id:string}})=>x.claim.id===claim.id);
  assert.equal(evidence.claim.reconciliationAmountAfn,500);
  assert.ok(!JSON.stringify(end.body).includes("refund-"+tag));
 }finally{await app.close();await sql.end();}
});
