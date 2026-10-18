import assert from "node:assert/strict";
import test from "node:test";
import {randomUUID} from "node:crypto";
import {eq} from "drizzle-orm";
import {type Database,connectDatabase,schema} from "@amlaklink/database";
import {listingDraftSchema} from "@amlaklink/contracts";
import {buildApp} from "./app";
import {newToken,hashToken} from "./security";
import {duplicates,normalizeDuplicateToken} from "./safety";
test("normalization never labels unrelated listings as duplicates",()=>{
 const make=(title:string,city:string)=>listingDraftSchema.parse({
  title,description:"A large two-bedroom property with photos and local access.",
  propertyType:"apartment",transactionType:"rent",location:{provinceId:"kabul",city,district:"District 4"},
  attributes:{areaM2:120},price:{currency:"AFN",monthlyRent:8000,refundableDeposit:0}
 });
 assert.equal(normalizeDuplicateToken("كابل  Apartment"),normalizeDuplicateToken("کابل Apartment"));
 assert.equal(duplicates(make("Same listing","Kabul"),make("Same listing","Herat")),false);
 assert.equal(duplicates(make("Same listing","Kabul"),make("Another","Kabul")),false);
 assert.equal(duplicates(make("Same listing","Kabul"),make("Same listing","Kabul")),true);
});
test("safety: reporter isolation, staff roles, audited holds, appeals and expiry",{skip:!process.env.DATABASE_URL},async()=>{
 const {db,sql}=connectDatabase(),app=buildApp({db}),suffix=randomUUID().slice(0,7),now=new Date();
 const persons=await db.insert(schema.users).values(["Owner","Seeker","Another"].map((displayName,i)=>({
  displayName,email:"safety-"+suffix+"-"+i+"@example.test",passwordHash:"test_hash",
  emailVerifiedAt:now,advertiserEnabled:true
 }))).returning();
 const staff=await db.insert(schema.staff).values(["moderator","verification","support"].map((role,i)=>({
  displayName:"Staff "+role,email:"safety-staff-"+suffix+"-"+i+"@example.test",passwordHash:"test_hash",
  role:role as "moderator"|"verification"|"support",totpSecretEncrypted:"unused_in_test"
 }))).returning();
 const tokens=[...persons,...staff].map(()=>newToken());
 await db.insert(schema.sessions).values([
  ...persons.map((p,i)=>({userId:p.id,audience:"user",tokenHash:hashToken(tokens[i]),expiresAt:new Date(Date.now()+86400_000)})),
  ...staff.map((p,i)=>({staffId:p.id,audience:"staff",tokenHash:hashToken(tokens[i+persons.length]),expiresAt:new Date(Date.now()+86400_000)}))
 ]);
 const draft=listingDraftSchema.parse({title:"Safe downtown apartment "+suffix,
  description:"Large furnished property in the center, nearby public transport and services.",
  propertyType:"apartment",transactionType:"rent",location:{provinceId:"kabul",city:"Kabul",district:"District 4"},
  attributes:{areaM2:130},price:{currency:"AFN",monthlyRent:12000,refundableDeposit:20000}});
 const insertListing=async(userId:string)=>{
  const [l]=await db.insert(schema.listings).values({authorId:userId,publisher:"private",clientRequestId:randomUUID(),status:"published",
   lastConfirmedAt:now,publishedAt:now}).returning();
  const [rev]=await db.insert(schema.revisions).values({listingId:l.id,sequence:1,status:"approved",data:draft}).returning();
  await db.update(schema.listings).set({approvedRevisionId:rev.id}).where(eq(schema.listings.id,l.id));
  return l;
 };
 const listing=await insertListing(persons[0].id),duplicate=await insertListing(persons[2].id);
 const call=async(method:"GET"|"POST",url:string,tokenIndex?:number,body?:object)=>{
  const result=await app.inject({method,url,headers:tokenIndex===undefined?{}:{authorization:"Bearer "+tokens[tokenIndex]},
   ...(body?{payload:body}:{})});
  return {status:result.statusCode,data:result.json() as Record<string,any>};
 };
 try{
  const report={requestId:randomUUID(),reason:"suspected_fraud",details:"The property appears suspicious based on the photos."};
  assert.equal((await call("POST","/v1/properties/"+listing.id+"/reports",undefined,report)).status,401);
  assert.equal((await call("POST","/v1/properties/"+listing.id+"/reports",0,report)).status,403);
  const create=await call("POST","/v1/properties/"+listing.id+"/reports",1,report);
  assert.equal(create.status,200);const caseId=create.data.id as string;
  assert.equal((await call("POST","/v1/properties/"+listing.id+"/reports",1,report)).data.id,caseId);
  assert.equal((await call("GET","/v1/reports/mine",0)).data.items.length,0);
  assert.equal((await call("GET","/v1/reports/mine",1)).data.items.length,1);
  assert.equal((await call("GET","/v1/admin/safety/cases",1)).status,401);
  assert.equal((await call("GET","/v1/admin/safety/cases",5)).status,200);
  assert.equal((await call("POST","/v1/admin/safety/cases/"+caseId+"/transition",5,{expectedVersion:1,status:"triaged",reason:"Investigation required"})).status,403);
  const caseDetail=await call("GET","/v1/admin/safety/cases/"+caseId,3);
  assert.equal(caseDetail.data.report.reason,"suspected_fraud");assert.equal(caseDetail.data.listing.safetyHold,false);
  const hold=await call("POST","/v1/admin/safety/listings/"+listing.id+"/hold",3,{
   expectedVersion:caseDetail.data.listing.version,reason:"Suspicious information needs review",action:"hold"});
  assert.equal(hold.status,200);assert.equal(hold.data.safetyHold,true);
  assert.equal((await call("POST","/v1/listings/"+listing.id+"/resume",0)).status,409);
  assert.equal((await call("GET","/v1/discovery?provinceId=kabul")).data.items.some((i:{id:string})=>i.id===listing.id),false);
  assert.equal((await call("POST","/v1/admin/safety/cases/"+caseId+"/transition",3,{
   expectedVersion:1,status:"triaged",reason:"Manual investigation ongoing"})).status,200);
  assert.equal((await call("POST","/v1/admin/safety/cases/"+caseId+"/transition",3,{
   expectedVersion:1,status:"investigating",reason:"Should fail on stale version"})).status,409);
  assert.equal((await call("POST","/v1/admin/safety/cases/"+caseId+"/transition",3,{
   expectedVersion:2,status:"closed",reason:"Not an allowed jump"})).status,409);
  assert.equal((await call("POST","/v1/admin/safety/cases/"+caseId+"/transition",3,{
   expectedVersion:2,status:"investigating",reason:"Reviewed evidence and listing"})).status,200);
  assert.equal((await call("POST","/v1/admin/safety/cases/"+caseId+"/transition",3,{
   expectedVersion:3,status:"resolved",reason:"Retained temporary safety hold"})).status,200);
  assert.equal((await call("POST","/v1/safety-cases/"+caseId+"/appeal",1,{reason:"I am not the property owner"})).status,403);
  assert.equal((await call("POST","/v1/safety-cases/"+caseId+"/appeal",0,{reason:"I can provide additional verification documents offline."})).status,200);
  assert.equal((await call("POST","/v1/safety-cases/"+caseId+"/appeal",0,{reason:"Trying to appeal again"})).status,409);
  assert.equal((await call("POST","/v1/admin/safety/cases/"+caseId+"/appeal-decision",3,{
   decision:"overturned",reason:"Independent manual verification resolved"})).status,200);
  const release=await call("POST","/v1/admin/safety/listings/"+listing.id+"/hold",3,{
   expectedVersion:hold.data.version,reason:"Evidence checked by trained moderator",action:"release"});
  assert.equal(release.status,200);assert.equal(release.data.safetyHold,false);
  assert.equal((await call("POST","/v1/admin/safety/verification",3,{
   subjectKind:"listing",subjectId:listing.id,scope:"listing_authorization_reviewed",
   method:"manual_review",result:"approved",reason:"Reviewed advertiser authorization offline"})).status,403);
  assert.equal((await call("POST","/v1/admin/safety/verification",4,{
   subjectKind:"listing",subjectId:listing.id,scope:"listing_authorization_reviewed",
   method:"manual_review",result:"approved",reason:"Reviewed advertiser authorization offline",
   expiresAt:new Date(Date.now()+86400_000).toISOString()})).status,200);
  assert.equal((await call("GET","/v1/properties/"+listing.id+"/verified-checks")).data.items.length,1);
  assert.equal((await call("POST","/v1/admin/safety/verification",4,{
   subjectKind:"listing",subjectId:listing.id,scope:"listing_authorization_reviewed",
   method:"manual_review",result:"revoked",reason:"Documents no longer acceptable"})).status,200);
  assert.equal((await call("GET","/v1/properties/"+listing.id+"/verified-checks")).data.items.length,0);
  const scan=await call("POST","/v1/admin/safety/duplicates/scan",3,{limit:90});
  assert.equal(scan.status,200);assert.equal(scan.data.created>=1,true);
  const duplicates=await call("GET","/v1/admin/safety/duplicates",3);
  const candidate=(duplicates.data.items as Array<{id:string;listingId:string;otherListingId:string}>).find(x=>
   [x.listingId,x.otherListingId].includes(listing.id)&&[x.listingId,x.otherListingId].includes(duplicate.id));
  assert.ok(candidate);
  assert.equal((await call("POST","/v1/admin/safety/duplicates/"+candidate.id+"/decision",3,{
   decision:"distinct",reason:"Both advertisers provided different authorization evidence"})).status,200);
  assert.equal((await call("POST","/v1/admin/safety/duplicates/"+candidate.id+"/decision",3,{
   decision:"duplicate",reason:"Stale double decision"})).status,409);
  assert.equal((await call("GET","/v1/properties/"+listing.id)).status,200);
 }finally{await app.close();await sql.end();}
});
