import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
import {tmpdir} from "node:os";
import {join} from "node:path";
import test from "node:test";
import sharp from "sharp";
import {eq} from "drizzle-orm";
import {connectDatabase,schema} from "@amlaklink/database";
import {listingDraftSchema,listingSubmissionSchema,publicListingPayload} from "@amlaklink/contracts";
import {buildApp} from "./app";
import {hashToken,newToken,passwordHash,encryptTotp,newTotpSecret} from "./security";
test("Afghanistan prices, location and privacy follow product rules",()=>{
 const base=listingDraftSchema.parse({
  title:"Well maintained three-bedroom house",description:"Property is available for appointment and viewing with agency staff.",
  propertyType:"house",transactionType:"gharawi",
  location:{provinceId:"kabul",city:"Kabul",district:"District 3",neighborhood:"Taimani",precision:"approximate",
    streetAddress:"Private alley 14",latitude:34.5,longitude:69.18},
  attributes:{areaM2:210,bedrooms:3},
  price:{currency:"AFN",refundablePrincipal:450000,monthlyRent:0,durationMonths:12,refundTerms:"Principal refundable in full at end of 12 months"},
  photoIds:[randomUUID()],contact:{allowPhone:true,phone:"+93700111222",allowWhatsApp:false}
 });
 assert.equal(listingSubmissionSchema.safeParse(base).success,true);
 assert.deepEqual(base.photoDetails,{}); // Existing listings remain valid without a migration.
 const roomAndCaption=listingDraftSchema.parse({...base,photoDetails:{
  [base.photoIds[0]]:{room:"bedroom",caption:"Light-filled master bedroom"}
 }});
 assert.equal(listingSubmissionSchema.safeParse(roomAndCaption).success,true);
 assert.equal(listingSubmissionSchema.safeParse({...roomAndCaption,photoDetails:{
  [randomUUID()]:{room:"bathroom",caption:"Unrelated file"}
 }}).success,false);
 assert.equal(listingSubmissionSchema.safeParse({...roomAndCaption,
  photoIds:[base.photoIds[0],base.photoIds[0]]}).success,false);
 assert.equal(listingDraftSchema.safeParse({...roomAndCaption,photoDetails:{
  [base.photoIds[0]]:{room:"unknown_room",caption:"test"}
 }}).success,false);
 assert.equal(listingDraftSchema.safeParse({...roomAndCaption,photoDetails:{
  [base.photoIds[0]]:{room:"bedroom",caption:"x".repeat(101)}
 }}).success,false);
 assert.equal(publicListingPayload(roomAndCaption).photoDetails[base.photoIds[0]].room,"bedroom");

 assert.equal(publicListingPayload(base).location.latitude,undefined);
 assert.equal(publicListingPayload(base).location.streetAddress,undefined);
 assert.equal(publicListingPayload(base).contact.phone,undefined);
 assert.equal(listingSubmissionSchema.safeParse({...base,price:{...base.price,monthlyRent:undefined}}).success,false);
 assert.equal(listingSubmissionSchema.safeParse({...base,location:{...base.location,provinceId:"uzbekistan"}}).success,false);
 assert.equal(listingSubmissionSchema.safeParse({...base,propertyType:"land"}).success,false);
});
test("real DB: advertiser draft→photo→review→publish→pause; edits never bypass moderation",{skip:!process.env.DATABASE_URL},async()=>{
 process.env.MEDIA_LOCAL_DIR=join(tmpdir(),"amlak-test-"+randomUUID());
 const {db,sql}=connectDatabase(),app=buildApp({db});
 const prefix=randomUUID().slice(0,8);
 const [owner]=await db.insert(schema.users).values({displayName:"Private owner",email:"listing-owner-"+prefix+"@example.test",
  passwordHash:await passwordHash("SecureTest12345!"),emailVerifiedAt:new Date(),advertiserEnabled:true}).returning();
 const [other]=await db.insert(schema.users).values({displayName:"Other person",email:"listing-other-"+prefix+"@example.test",
  passwordHash:await passwordHash("SecureTest12345!"),emailVerifiedAt:new Date(),advertiserEnabled:true}).returning();
 const [moderator]=await db.insert(schema.staff).values({displayName:"Moderator",email:"listing-mod-"+prefix+"@example.test",
  passwordHash:await passwordHash("SecureStaff123!"),role:"moderator",totpSecretEncrypted:encryptTotp(newTotpSecret())}).returning();
 const tokens=[newToken(),newToken(),newToken()];
 await db.insert(schema.sessions).values([
  {userId:owner.id,audience:"user",tokenHash:hashToken(tokens[0]),expiresAt:new Date(Date.now()+86400_000)},
  {userId:other.id,audience:"user",tokenHash:hashToken(tokens[1]),expiresAt:new Date(Date.now()+86400_000)},
  {staffId:moderator.id,audience:"staff",tokenHash:hashToken(tokens[2]),expiresAt:new Date(Date.now()+86400_000)}
 ]);
 const call=async(method:"GET"|"POST"|"PUT",url:string,token?:string,payload?:object)=>{
  const r=await app.inject({method,url,headers:token?{authorization:"Bearer "+token}:{},...(payload?{payload}:{})});
  return {status:r.statusCode,body:r.json() as Record<string,any>};
 };
 try{
  const key=randomUUID(),created=await call("POST","/v1/listings",tokens[0],{clientRequestId:key,publisher:"private",propertyType:"house",transactionType:"sale"});
  assert.equal(created.status,200);const id=created.body.id as string;
  const retry=await call("POST","/v1/listings",tokens[0],{clientRequestId:key,publisher:"private",propertyType:"house",transactionType:"sale"});
  assert.equal(retry.body.id,id);assert.equal(retry.body.reused,true);
  assert.equal((await call("GET","/v1/listings/"+id,tokens[1])).status,403);
  assert.equal((await call("POST","/v1/listings/"+id+"/submit",tokens[0],{expectedVersion:1})).status,422);
  const img=await sharp({create:{width:640,height:480,channels:3,background:"#456789"}}).png().toBuffer();
  const boundary="amlak-"+randomUUID();
  const multipart=Buffer.concat([Buffer.from("--"+boundary+"\r\nContent-Disposition: form-data; name=\"file\"; filename=\"house.png\"\r\nContent-Type: image/png\r\n\r\n"),img,Buffer.from("\r\n--"+boundary+"--\r\n")]);
  const uploaded=await app.inject({method:"POST",url:"/v1/listings/"+id+"/photos",headers:{authorization:"Bearer "+tokens[0],"content-type":"multipart/form-data; boundary="+boundary},payload:multipart});
  assert.equal(uploaded.statusCode,200,uploaded.body);const photoId=(uploaded.json() as {id:string}).id;
  assert.equal((await call("GET","/v1/photos/"+photoId)).status,404);
  const approvedData=listingDraftSchema.parse({
   title:"Modern apartment located in Kabul",description:"Sunny home with separate living area, working water and suitable neighborhood.",
   propertyType:"house",transactionType:"sale",location:{provinceId:"kabul",city:"Kabul",district:"District 4",neighborhood:"Wazir Akbar Khan",precision:"approximate",streetAddress:"Private block",latitude:34.5,longitude:69.15},
   attributes:{areaM2:220,bedrooms:3,bathrooms:2},price:{currency:"AFN",askingPrice:6500000},
   photoIds:[photoId],photoDetails:{[photoId]:{room:"living_room",caption:"Bright and open living room"}},contact:{allowPhone:true,phone:"+93700111222"}
  });
  const saved=await call("PUT","/v1/listings/"+id+"/draft",tokens[0],{expectedVersion:1,data:approvedData});
  assert.equal(saved.status,200);assert.equal(saved.body.version,2);
  assert.equal((await call("PUT","/v1/listings/"+id+"/draft",tokens[0],{expectedVersion:1,data:approvedData})).status,409);
  assert.equal((await call("POST","/v1/listings/"+id+"/submit",tokens[0],{expectedVersion:2})).status,200);
  assert.equal((await call("GET","/v1/properties/"+id)).status,404);
  assert.equal((await call("GET","/v1/admin/listings/review-queue",tokens[0])).status,401);
  const queue=await call("GET","/v1/admin/listings/review-queue",tokens[2]);
  assert.equal(queue.status,200);const item=(queue.body.items as {id:string;revisionId:string;data:{photoDetails:Record<string,{room:string}>}}[]).find(x=>x.id===id);
  assert.ok(item);
  assert.equal(item.data.photoDetails[photoId].room,"living_room");
  const review=await call("POST","/v1/admin/listings/"+id+"/decision",tokens[2],{revisionId:item!.revisionId,decision:"approve",reason:"Images and property information inspected"});
  assert.equal(review.status,200);
  assert.equal((await call("POST","/v1/admin/listings/"+id+"/decision",tokens[2],{revisionId:item!.revisionId,decision:"approve",reason:"Second reviewer tries stale version"})).status,409);
  const visible=await call("GET","/v1/properties/"+id);
  assert.equal(visible.status,200);assert.equal(visible.body.data.price.askingPrice,6500000);
  assert.equal(visible.body.data.location.latitude,undefined);
  assert.equal(visible.body.data.contact.phone,undefined);
  assert.equal(visible.body.photos[0].room,"living_room");
  assert.equal(visible.body.photos[0].caption,"Bright and open living room");
  assert.equal((await app.inject({method:"GET",url:"/v1/photos/"+photoId})).headers["content-type"],"image/webp");
  const status=await call("POST","/v1/listings/"+id+"/pause",tokens[0]);assert.equal(status.status,200);
  const feed=await call("GET","/v1/properties?provinceId=kabul");assert.equal((feed.body.items as {id:string}[]).some(x=>x.id===id),false);
  assert.equal((await call("POST","/v1/listings/"+id+"/resume",tokens[0])).status,200);
  const owned=await call("GET","/v1/listings/"+id,tokens[0]);const v=owned.body.version as number;
  const changed=await call("PUT","/v1/listings/"+id+"/draft",tokens[0],{expectedVersion:v,data:{...approvedData,photoDetails:{[photoId]:{room:"bathroom",caption:"New metadata still under review"}},price:{currency:"AFN",askingPrice:7200000}}});
  assert.equal(changed.status,200);
  assert.equal((await call("POST","/v1/listings/"+id+"/submit",tokens[0],{expectedVersion:changed.body.version})).status,200);
  const approvedBeforeDecision=await call("GET","/v1/properties/"+id);
  assert.equal(approvedBeforeDecision.body.data.price.askingPrice,6500000);
  assert.equal(approvedBeforeDecision.body.photos[0].room,"living_room");
  const reviews=await call("GET","/v1/admin/listings/review-queue",tokens[2]);
  const revision=(reviews.body.items as {id:string;revisionId:string}[]).find(x=>x.id===id);
  assert.ok(revision);
  assert.equal((await call("POST","/v1/admin/listings/"+id+"/decision",tokens[2],{revisionId:revision!.revisionId,decision:"reject",reason:"Price update requires documentary correction"})).status,200);
  const afterRejection=await call("GET","/v1/properties/"+id);
  assert.equal(afterRejection.body.data.price.askingPrice,6500000);
  assert.equal(afterRejection.body.photos[0].room,"living_room");
  assert.equal(afterRejection.body.photos[0].caption,"Bright and open living room");
  assert.equal((await call("POST","/v1/listings/"+id+"/pause",tokens[1])).status,403);
  await db.update(schema.users).set({status:"suspended"}).where(eq(schema.users.id,owner.id));
  assert.equal((await call("GET","/v1/properties/"+id)).status,404);
  assert.equal((await call("GET","/v1/photos/"+photoId)).status,404);
 }finally{await app.close();await sql.end();}
});
