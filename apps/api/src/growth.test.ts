import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
import test from "node:test";
import {connectDatabase,schema} from "@amlaklink/database";
import {listingDraftSchema} from "@amlaklink/contracts";
import {buildApp} from "./app";
import {PRODUCTS,feePeriod,referenceHash,billingEnabled} from "./billing";
import {matchingAlert,isPriceDrop,scanSavedSearchAlerts} from "./growth-alerts";
import {hashToken,newToken} from "./security";
test("manual fee logic: separate currency, stable reference, expiration",()=>{
 assert.equal(PRODUCTS.featured_7d.kind,"promotion");
 assert.equal(PRODUCTS.agency_standard.seatLimit,5);
 assert.equal(feePeriod(new Date("2026-10-18T00:00:00Z"),30).toISOString(),"2026-11-17T00:00:00.000Z");
 assert.equal(referenceHash("bank_transfer"," aBc12345 "),referenceHash("bank_transfer","ABC12345"));
 assert.notEqual(referenceHash("bank_transfer","ABC12345"),referenceHash("cash_deposit","ABC12345"));
 assert.match(matchingAlert("fa","price_drop","ملک در کابل"),/قیمت/);
 assert.ok(matchingAlert("en","new","house").length<=160);
});
test("price alerts: only real same-currency asking-price reductions",()=>{
 const old=listingDraftSchema.parse({transactionType:"sale",price:{currency:"AFN",askingPrice:10000}});
 const lower=listingDraftSchema.parse({transactionType:"sale",price:{currency:"AFN",askingPrice:9000}});
 const higher=listingDraftSchema.parse({transactionType:"sale",price:{currency:"AFN",askingPrice:12000}});
 const dollars=listingDraftSchema.parse({transactionType:"sale",price:{currency:"USD",askingPrice:100}});
 assert.equal(isPriceDrop(lower,old),true);
 assert.equal(isPriceDrop(old,lower),false);
 assert.equal(isPriceDrop(higher,old),false);
 assert.equal(isPriceDrop(dollars,old),false);
 assert.equal(isPriceDrop({},old),false);
});
test("growth API: private bookmarks, guest comparison validation, billing starts disabled",{skip:!process.env.DATABASE_URL},async()=>{
 const {db,sql}=connectDatabase(),app=buildApp({db});
 const uuid=randomUUID().slice(0,8),token=newToken();
 const [user]=await db.insert(schema.users).values({
  displayName:"Growth Test",email:"growth-"+uuid+"@example.test",
  passwordHash:"test",emailVerifiedAt:new Date()
 }).returning();
 await db.insert(schema.sessions).values({audience:"user",userId:user.id,
  tokenHash:hashToken(token),expiresAt:new Date(Date.now()+3600_000)});
 const call=async(method:"GET"|"POST"|"PATCH"|"DELETE",url:string,body?:unknown,auth?:string)=>{
  const r=await app.inject({method,url,...(body?{payload:body}:{}),
   headers:auth?{authorization:"Bearer "+auth}:{}});
  return {status:r.statusCode,data:r.json() as Record<string,any>};
 };
 try{
  assert.equal((await call("GET","/v1/saved-searches")).status,401);
  assert.equal((await call("POST","/v1/saved-searches",{title:"Kabul",filters:{provinceId:"kabul"}})).status,401);
  const created=await call("POST","/v1/saved-searches",{
   title:"Kabul homes",filters:{provinceId:"kabul",intent:"rent"},alertsEnabled:true},token);
  assert.equal(created.status,200);
  assert.equal(created.data.alertsEnabled,true);
  const id=created.data.id as string;
  assert.equal((await call("GET","/v1/saved-searches",undefined,token)).data.items.length,1);
  assert.equal((await call("PATCH","/v1/saved-searches/"+id,{alertsEnabled:false},token)).status,200);
  assert.equal((await call("PATCH","/v1/saved-searches/"+randomUUID(),{alertsEnabled:true},token)).status,404);
  assert.equal((await call("POST","/v1/properties/compare",{ids:[randomUUID(),randomUUID()]})).status,404);
  const duplicate=randomUUID();
  assert.equal((await call("POST","/v1/properties/compare",{ids:[duplicate,duplicate]})).status,422);
  assert.equal((await call("POST","/v1/saved-searches",{
   title:"GPS attempt",filters:{viewport:"1,1,2,2"},alertsEnabled:true},token)).status,422);
  const plans=await call("GET","/v1/plans");
  assert.equal(plans.status,200);assert.equal(plans.data.currency,"AFN");
  if(!billingEnabled())assert.equal((await call("POST","/v1/invoices",{
   requestId:randomUUID(),productCode:"solo_agent"},token)).status,503);
  assert.equal((await call("GET","/v1/admin/billing/claims",undefined,token)).status,401);
  const dry=await scanSavedSearchAlerts(db,{execute:false,limit:10});
  assert.equal(dry.execute,false);
  assert.equal((await call("DELETE","/v1/saved-searches/"+id,undefined,token)).status,200);
  assert.equal((await call("GET","/v1/saved-searches",undefined,token)).data.items.length,0);
 }finally{await app.close();await sql.end();}
});
