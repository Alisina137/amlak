import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
import test from "node:test";
import {eq} from "drizzle-orm";
import {connectDatabase,schema} from "@amlaklink/database";
import {listingDraftSchema} from "@amlaklink/contracts";
import {buildApp} from "./app";
import {newToken,hashToken,passwordHash} from "./security";

test("phase 5: inquiry, message retries, viewing consent, notifications and tenant isolation",{skip:!process.env.DATABASE_URL},async()=>{
 const {db,sql}=connectDatabase(),app=buildApp({db});
 const suffix=randomUUID().slice(0,8),now=new Date();
 const users=await db.insert(schema.users).values([
  {displayName:"Advertiser",email:"phase5-owner-"+suffix+"@example.test",passwordHash:await passwordHash("TestingPass123!"),emailVerifiedAt:now,advertiserEnabled:true},
  {displayName:"Seeker",email:"phase5-seeker-"+suffix+"@example.test",passwordHash:await passwordHash("TestingPass123!"),emailVerifiedAt:now},
  {displayName:"Other",email:"phase5-other-"+suffix+"@example.test",passwordHash:await passwordHash("TestingPass123!"),emailVerifiedAt:now}
 ]).returning();
 const [owner,seeker,other]=users;
 const tokens=users.map(()=>newToken());
 await db.insert(schema.sessions).values(users.map((u,i)=>({userId:u.id,audience:"user",tokenHash:hashToken(tokens[i]),expiresAt:new Date(Date.now()+86400_000)})));
 const [listing]=await db.insert(schema.listings).values({authorId:owner.id,publisher:"private",clientRequestId:randomUUID(),status:"published",publishedAt:now,lastConfirmedAt:now}).returning();
 const draft=listingDraftSchema.parse({
  title:"Two-bedroom home for Kabul viewing",description:"Excellent central home with water, secure electric supply and nearby market.",
  propertyType:"house",transactionType:"rent",location:{provinceId:"herat",city:"Herat",district:"District 3",neighborhood:"Taimani"},
  attributes:{areaM2:150,bedrooms:2},price:{currency:"AFN",monthlyRent:6000,refundableDeposit:20000},
  contact:{allowPhone:true,phone:"+93700000000"}
 });
 const [rev]=await db.insert(schema.revisions).values({listingId:listing.id,sequence:1,status:"approved",data:draft}).returning();
 await db.update(schema.listings).set({approvedRevisionId:rev.id}).where(eq(schema.listings.id,listing.id));
 const send=async(method:"GET"|"POST"|"DELETE",path:string,t?:number,body?:object)=>{
  const response=await app.inject({method,url:path,headers:t===undefined?{}:{authorization:"Bearer "+tokens[t]},...(body?{payload:body}:{})});
  return {status:response.statusCode,body:response.json() as Record<string,any>};
 };
 try{
  assert.equal((await send("POST","/v1/properties/"+listing.id+"/inquiries",undefined,{clientRequestId:randomUUID(),body:"Hi"})).status,401);
  assert.equal((await send("POST","/v1/properties/"+listing.id+"/inquiries",0,{clientRequestId:randomUUID(),body:"Hi"})).status,403);
  const initial={clientRequestId:randomUUID(),body:"Can we view your home next week?"};
  const made=await send("POST","/v1/properties/"+listing.id+"/inquiries",1,initial);
  assert.equal(made.status,200);const threadId=made.body.id as string;
  assert.equal((await send("POST","/v1/properties/"+listing.id+"/inquiries",1,initial)).body.id,threadId);
  assert.equal((await send("GET","/v1/inquiries/"+threadId,2)).status,403);
  assert.equal((await send("GET","/v1/inquiries/"+threadId,1)).body.messages.length,1);
  assert.equal((await send("GET","/v1/inquiries/"+threadId,0)).body.priceSnapshot.monthlyRent,6000);
  const message={clientRequestId:randomUUID(),body:"The property is available for viewing."};
  assert.equal((await send("POST","/v1/inquiries/"+threadId+"/messages",0,message)).status,200);
  assert.equal((await send("POST","/v1/inquiries/"+threadId+"/messages",0,message)).body.reused,true);
  const own=await send("GET","/v1/inquiries/"+threadId,1);
  assert.equal(own.body.messages.length,2);
  assert.equal(own.body.status,"responded");
  assert.equal((await send("GET","/v1/notifications",1)).body.unread>=1,true);
  assert.equal((await send("GET","/v1/notifications",2)).body.items.length,0);
  const future1=new Date(Date.now()+2*86400_000).toISOString();
  const future2=new Date(Date.now()+3*86400_000).toISOString();
  const request={clientRequestId:randomUUID(),proposedSlots:[future1,future2],note:"We can arrive in the morning."};
  const visit=await send("POST","/v1/inquiries/"+threadId+"/viewings",1,request);
  assert.equal(visit.status,200);assert.equal(visit.body.status,"requested");const visitId=visit.body.id as string;
  assert.equal((await send("POST","/v1/inquiries/"+threadId+"/viewings",1,request)).body.id,visitId);
  assert.equal((await send("POST","/v1/viewings/"+visitId+"/decision",1,{action:"confirm",slot:future1,expectedVersion:1})).status,403);
  assert.equal((await send("POST","/v1/viewings/"+visitId+"/decision",0,{action:"confirm",slot:future1,expectedVersion:1})).body.status,"confirmed");
  // The listing cannot confirm two different seekers for the exact same time.
  const otherInquiry=await send("POST","/v1/properties/"+listing.id+"/inquiries",2,
    {clientRequestId:randomUUID(),body:"Another interested visitor"});
  assert.equal(otherInquiry.status,200);
  const otherVisit=await send("POST","/v1/inquiries/"+otherInquiry.body.id+"/viewings",2,
    {clientRequestId:randomUUID(),proposedSlots:[future1,future2]});
  assert.equal(otherVisit.status,200);
  assert.equal((await send("POST","/v1/viewings/"+otherVisit.body.id+"/decision",0,
    {action:"confirm",slot:future1,expectedVersion:1})).status,409);
  assert.equal((await send("POST","/v1/viewings/"+otherVisit.body.id+"/decision",0,
    {action:"confirm",slot:future2,expectedVersion:1})).body.status,"confirmed");

  assert.equal((await send("POST","/v1/viewings/"+visitId+"/decision",0,{action:"confirm",slot:future1,expectedVersion:1})).status,409);
  assert.equal((await send("POST","/v1/viewings/"+visitId+"/decision",1,{action:"cancel",expectedVersion:2})).body.status,"cancelled");
  assert.equal((await send("POST","/v1/viewings/"+visitId+"/decision",0,{action:"confirm",slot:future2,expectedVersion:3})).status,409);
  assert.equal((await send("GET","/v1/viewings",2)).body.items.length,1);
  assert.equal((await send("POST","/v1/listings/"+listing.id+"/pause",0)).status,200);
  assert.equal((await send("GET","/v1/viewings",2)).body.items[0].status,"confirmed");
  assert.equal((await send("POST","/v1/listings/"+listing.id+"/close",0,{outcome:"rented"})).status,200);
  assert.equal((await send("GET","/v1/viewings",2)).body.items[0].status,"cancelled");
  assert.equal((await send("GET","/v1/inquiries/"+threadId+"/lead-notes",1)).status,403);
  assert.equal((await send("POST","/v1/inquiries/"+threadId+"/lead-status",1,{status:"won"})).status,403);
  assert.equal((await send("POST","/v1/inquiries/"+threadId+"/lead-status",0,{status:"contacted"})).body.leadStatus,"contacted");
  assert.equal((await send("POST","/v1/users/"+owner.id+"/block",1)).status,200);
  assert.equal((await send("POST","/v1/inquiries/"+threadId+"/messages",0,{clientRequestId:randomUUID(),body:"Still there?"})).status,403);
  assert.equal((await send("DELETE","/v1/users/"+owner.id+"/block",1)).body.blocked,false);
  assert.equal((await send("POST","/v1/inquiries/"+threadId+"/close",1)).body.status,"closed");
  assert.equal((await send("POST","/v1/inquiries/"+threadId+"/messages",0,{clientRequestId:randomUUID(),body:"Reply after close"})).status,409);
 }finally{await app.close();await sql.end();}
});

test("phase 5 agency scope: managers own queue, agents assigned only, notes private and revocation immediate",{skip:!process.env.DATABASE_URL},async()=>{
 const {db,sql}=connectDatabase(),app=buildApp({db});
 const suffix=randomUUID().slice(0,8),now=new Date(),tokens=[newToken(),newToken(),newToken(),newToken()];
 const users=await db.insert(schema.users).values(
  ["Owner","Agent","Seeker","Rogue"].map((displayName,i)=>({displayName,email:"phase5-ag-"+i+"-"+suffix+"@example.test",
    passwordHash:"test_hash",emailVerifiedAt:now}))
 ).returning();
 await db.insert(schema.sessions).values(users.map((u,i)=>({userId:u.id,audience:"user",tokenHash:hashToken(tokens[i]),expiresAt:new Date(Date.now()+86400_000)})));
 const agency=(await db.insert(schema.agencies).values({name:"Agency "+suffix,status:"active",creatorId:users[0].id,provinceId:"kabul"}).returning())[0];
 const members=await db.insert(schema.memberships).values([
  {userId:users[0].id,agencyId:agency.id,status:"active",role:"owner"},
  {userId:users[1].id,agencyId:agency.id,status:"active",role:"agent"}
 ]).returning();
 const [listing]=await db.insert(schema.listings).values({authorId:users[0].id,agencyId:agency.id,publisher:"agency",clientRequestId:randomUUID(),
  status:"published",publishedAt:now,lastConfirmedAt:now}).returning();
 const draft=listingDraftSchema.parse({title:"Agency residence for viewings",description:"A spacious property on a main road with convenient access.",
  propertyType:"house",transactionType:"sale",location:{provinceId:"herat",city:"Herat",district:"District 4"},
  attributes:{areaM2:120},price:{currency:"AFN",askingPrice:125000}});
 const [rev]=await db.insert(schema.revisions).values({listingId:listing.id,sequence:1,status:"approved",data:draft}).returning();
 await db.update(schema.listings).set({approvedRevisionId:rev.id}).where(eq(schema.listings.id,listing.id));
 const send=async(method:"GET"|"POST",path:string,userIdx:number,body?:object)=>{
  const response=await app.inject({method,url:path,headers:{authorization:"Bearer "+tokens[userIdx]},...(body?{payload:body}:{})});
  return {status:response.statusCode,data:response.json() as Record<string,any>};
 };
 try{
  const made=await send("POST","/v1/properties/"+listing.id+"/inquiries",2,{clientRequestId:randomUUID(),body:"Interested in the property"});
  assert.equal(made.status,200);const thread=made.data.id as string;
  assert.equal((await send("GET","/v1/inquiries/"+thread,1)).status,403);
  assert.equal((await send("GET","/v1/inquiries/"+thread,3)).status,403);
  assert.equal((await send("GET","/v1/inquiries",1)).data.items.length,0);
  assert.equal((await send("POST","/v1/inquiries/"+thread+"/assign",2,{assignedTo:users[1].id})).status,403);
  assert.equal((await send("POST","/v1/inquiries/"+thread+"/assign",0,{assignedTo:users[1].id})).status,200);
  assert.equal((await send("GET","/v1/inquiries/"+thread,1)).status,200);
  assert.equal((await send("POST","/v1/inquiries/"+thread+"/lead-notes",1,{body:"Internal meeting follow-up"})).status,200);
  assert.equal((await send("GET","/v1/inquiries/"+thread+"/lead-notes",2)).status,403);
  assert.equal((await send("GET","/v1/inquiries/"+thread+"/lead-notes",0)).data.items[0].body,"Internal meeting follow-up");
  assert.equal((await send("POST","/v1/inquiries/"+thread+"/assign",0,{assignedTo:users[3].id})).status,422);
  assert.equal((await send("POST","/v1/agencies/"+agency.id+"/members/"+members[1].id+"/revoke",0)).status,200);
  assert.equal((await send("GET","/v1/inquiries/"+thread,0)).data.assignedTo,null);
  assert.equal((await send("GET","/v1/inquiries/"+thread,1)).status,403);
  assert.equal((await send("GET","/v1/inquiries",1)).data.items.length,0);
  assert.equal((await send("GET","/v1/inquiries/"+thread,0)).status,200);
 }finally{await app.close();await sql.end();}
});
