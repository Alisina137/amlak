import assert from "node:assert/strict";
import test from "node:test";
import {randomUUID} from "node:crypto";
import {eq} from "drizzle-orm";
import {connectDatabase,schema} from "@amlaklink/database";
import {listingDraftSchema} from "@amlaklink/contracts";
import {buildApp} from "./app";
import {newToken,hashToken,passwordHash} from "./security";
import {normalizeText,parseDiscovery} from "./search";
test("Afghan query normalization and price comparison guard",()=>{
 assert.equal(normalizeText(" كابل   ۱۲۳ "),"کابل 123");
 assert.equal(normalizeText("كابلي"),"کابلی");
 assert.throws(()=>parseDiscovery({minPrice:"1",intent:"rent"}),{code:"PRICE_REQUIRES_INTENT_AND_CURRENCY"});
 assert.throws(()=>parseDiscovery({minPrice:"5000",maxPrice:"100",intent:"sale",currency:"AFN"}),{code:"PRICE_RANGE_INVALID"});
 assert.throws(()=>parseDiscovery({provinceId:"usa"}),{code:"UNKNOWN_PROVINCE"});
 assert.throws(()=>parseDiscovery({viewport:"0,0,0,100"}),{code:"INVALID_VIEWPORT"});
 assert.equal(parseDiscovery({intent:"gharawi",currency:"AFN",minPrice:"0"}).minPrice,0);
});
test("public discovery: filters, pagination, privacy, saved history and contact actions",{skip:!process.env.DATABASE_URL},async()=>{
 const {db,sql}=connectDatabase(),app=buildApp({db});
 const suffix=randomUUID().slice(0,9),now=new Date();
 const [alice,bob]=await db.insert(schema.users).values([
  {email:"search-owner-"+suffix+"@example.test",displayName:"Owner",passwordHash:await passwordHash("Secure123!"),emailVerifiedAt:now,advertiserEnabled:true},
  {email:"search-bob-"+suffix+"@example.test",displayName:"Seeker",passwordHash:await passwordHash("Secure123!"),emailVerifiedAt:now}
 ]).returning();
 const [suspended]=await db.insert(schema.users).values({
  email:"search-banned-"+suffix+"@example.test",displayName:"Banned",passwordHash:await passwordHash("Secure123!"),emailVerifiedAt:now,status:"suspended",advertiserEnabled:true
 }).returning();
 const tokens=[newToken(),newToken()];
 await db.insert(schema.sessions).values([
  {userId:alice.id,audience:"user",tokenHash:hashToken(tokens[0]),expiresAt:new Date(Date.now()+86400_000)},
  {userId:bob.id,audience:"user",tokenHash:hashToken(tokens[1]),expiresAt:new Date(Date.now()+86400_000)}
 ]);
 const cases=[
  {title:"Sunny كابلي Apartment "+suffix,status:"published" as const,tx:"rent" as const,owner:alice.id,price:5000,exact:false},
  {title:"Fresh Central Kabul Apartment "+suffix,status:"published" as const,tx:"rent" as const,owner:alice.id,price:8000,exact:true},
  {title:"House for Sale "+suffix,status:"published" as const,tx:"sale" as const,owner:alice.id,price:900000,exact:false},
  {title:"Paused in Kabul "+suffix,status:"paused" as const,tx:"rent" as const,owner:alice.id,price:1000,exact:false},
  {title:"Blocked property "+suffix,status:"published" as const,tx:"rent" as const,owner:suspended.id,price:500,exact:false}
 ];
 const ids:string[]=[];
 for(const [index,v] of cases.entries()){
  const [listing]=await db.insert(schema.listings).values({authorId:v.owner,publisher:"private",clientRequestId:randomUUID(),
   status:v.status,publishedAt:new Date(Date.now()-(index+1)*1000),lastConfirmedAt:now}).returning();
  const body=listingDraftSchema.parse({
   title:v.title,description:"Verified listing for search integration testing with complete public description.",
   propertyType:"apartment",transactionType:v.tx,attributes:{areaM2:85,bedrooms:2,bathrooms:1,parking:true},
   location:{provinceId:"kabul",city:"Kabul",district:"District 4",neighborhood:"Taimani",streetAddress:"PRIVATE 123",
    precision:v.exact?"exact":"approximate",latitude:34.6,longitude:69.3},
   price:v.tx==="sale"?{currency:"AFN",askingPrice:v.price}:{currency:"AFN",monthlyRent:v.price,refundableDeposit:0},
   contact:{allowPhone:true,phone:"+93700111222",allowWhatsApp:false}
  });
  const [revision]=await db.insert(schema.revisions).values({listingId:listing.id,sequence:1,status:"approved",data:body}).returning();
  await db.update(schema.listings).set({approvedRevisionId:revision.id}).where(eq(schema.listings.id,listing.id));
  ids.push(listing.id);
 }
 const call=async(method:"GET"|"POST"|"DELETE",path:string,token?:string)=>{
  const resp=await app.inject({method,url:path,headers:token?{authorization:"Bearer "+token}:{}});
  return {status:resp.statusCode,data:resp.json() as Record<string,any>};
 };
 try{
  const page1=await call("GET","/v1/discovery?intent=rent&provinceId=kabul&currency=AFN&minPrice=1000&maxPrice=10000&sort=price_asc&limit=1");
  assert.equal(page1.status,200);assert.equal(page1.data.items.length,1);assert.equal(page1.data.items[0].id,ids[0]);
  assert.equal(page1.data.items[0].data.location.streetAddress,undefined);
  assert.equal(page1.data.items[0].data.location.latitude,undefined);
  assert.equal(page1.data.items[0].data.contact.phone,undefined);
  const p2=await call("GET","/v1/discovery?intent=rent&provinceId=kabul&currency=AFN&minPrice=1000&maxPrice=10000&sort=price_asc&limit=1&cursor="+encodeURIComponent(page1.data.nextCursor));
  assert.equal(p2.status,200);assert.equal(p2.data.items[0].id,ids[1]);
  assert.equal((await call("GET","/v1/discovery?intent=rent&currency=AFN&minPrice=1000&sort=price_asc&limit=1&cursor="+encodeURIComponent(page1.data.nextCursor))).status,422);
  const searchable=await call("GET","/v1/discovery?q="+encodeURIComponent("کابلی")+"&intent=rent&provinceId=kabul");
  assert.equal(searchable.status,200);assert.equal(searchable.data.items.length,1);
  const affordable=await call("GET","/v1/discovery?intent=sale&currency=AFN&minPrice=500000");
  assert.equal(affordable.data.items.length,1);assert.equal(affordable.data.items[0].id,ids[2]);
  const map=await call("GET","/v1/discovery/map?intent=rent&provinceId=kabul");
  assert.equal(map.status,200);assert.equal(map.data.items.length,1);assert.equal(map.data.items[0].id,ids[1]);
  assert.equal(map.data.items[0].latitude,34.6);
  const owner=await call("GET","/v1/advertisers/user/"+alice.id);
  assert.equal(owner.status,200);assert.equal(JSON.stringify(owner.data).includes(alice.email),false);
  assert.equal(owner.data.badges[0].kind,"contact_email_verified");
  const publicDetail=await call("GET","/v1/properties/"+ids[0]);
  assert.equal(JSON.stringify(publicDetail.data).includes("+93700111222"),false);
  assert.equal((await call("GET","/v1/properties/"+ids[0]+"/contact?channel=whatsapp")).status,404);
  const contact=await call("GET","/v1/properties/"+ids[0]+"/contact?channel=call");
  assert.equal(contact.status,200);assert.equal(contact.data.href,"tel:+93700111222");
  assert.equal((await call("GET","/v1/properties/"+ids[3]+"/contact?channel=call")).status,404);
  assert.equal((await call("GET","/v1/favorites")).status,401);
  assert.equal((await call("POST","/v1/favorites/"+ids[0],tokens[1])).status,200);
  assert.equal((await call("POST","/v1/favorites/"+ids[0],tokens[1])).status,200);
  assert.equal((await call("GET","/v1/favorites/"+ids[0],tokens[0])).data.saved,false);
  assert.equal((await call("GET","/v1/favorites/"+ids[0],tokens[1])).data.saved,true);
  assert.equal((await call("GET","/v1/favorites",tokens[1])).data.items.length,1);
  assert.equal((await call("POST","/v1/favorites/"+ids[3],tokens[1])).status,404);
  await db.update(schema.listings).set({status:"paused"}).where(eq(schema.listings.id,ids[0]));
  assert.equal((await call("GET","/v1/favorites",tokens[1])).data.items[0].status,"paused");
  assert.equal((await call("DELETE","/v1/favorites/"+ids[0],tokens[1])).status,200);
  assert.equal((await call("GET","/v1/favorites",tokens[1])).data.items.length,0);
  assert.equal((await call("GET","/v1/discovery")).data.items.some((i:{id:string})=>i.id===ids[4]),false);
 }finally{await app.close();await sql.end();}
});
