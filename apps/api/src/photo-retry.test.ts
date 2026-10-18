import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
import test from "node:test";
import {eq} from "drizzle-orm";
import sharp from "sharp";
import {connectDatabase,schema} from "@amlaklink/database";
import {buildApp} from "./app";
import {hashToken,newToken} from "./security";

test("media retry: a repeated image uses one photo ID, even for concurrent retries",{
 skip:!process.env.DATABASE_URL},async()=>{
 const {db,sql}=connectDatabase(),app=buildApp({db});
 const tag=randomUUID().slice(0,8),token=newToken();
 const [actor]=await db.insert(schema.users).values({displayName:"Photo retry owner",
  email:"photo-retry-"+tag+"@example.test",passwordHash:"test",emailVerifiedAt:new Date(),
  advertiserEnabled:true}).returning();
 await db.insert(schema.sessions).values({userId:actor.id,audience:"user",
  tokenHash:hashToken(token),expiresAt:new Date(Date.now()+3600_000)});
 const [listing]=await db.insert(schema.listings).values({authorId:actor.id,
  publisher:"private",status:"draft",clientRequestId:randomUUID()}).returning();
 const image=await sharp({create:{width:640,height:480,channels:3,background:"#87A59F"}})
  .png().toBuffer();
 const boundary="----amlak-retry-"+tag;
 const payload=Buffer.concat([
  Buffer.from("--"+boundary+"\r\nContent-Disposition: form-data; name=\"file\"; filename=\"photo.png\"\r\nContent-Type: image/png\r\n\r\n"),
  image,Buffer.from("\r\n--"+boundary+"--\r\n")
 ]);
 const upload=async()=>app.inject({method:"POST",url:"/v1/listings/"+listing.id+"/photos",
  headers:{"authorization":"Bearer "+token,"content-type":"multipart/form-data; boundary="+boundary},
  payload});
 try{
  const first=await upload();
  assert.equal(first.statusCode,200,first.body);
  assert.equal(first.json().reused,false);
  const [second,third]=await Promise.all([upload(),upload()]);
  assert.equal(second.statusCode,200,second.body);
  assert.equal(third.statusCode,200,third.body);
  assert.equal(second.json().id,first.json().id);
  assert.equal(third.json().id,first.json().id);
  assert.equal(second.json().reused,true);
  const rows=await db.select({id:schema.photos.id}).from(schema.photos)
   .where(eq(schema.photos.listingId,listing.id));
  assert.equal(rows.length,1,"retry must not create orphan database photo rows");
  const deletion=await app.inject({method:"DELETE",
   url:"/v1/listings/"+listing.id+"/photos/"+first.json().id,
   headers:{"authorization":"Bearer "+token}});
  assert.equal(deletion.statusCode,200,deletion.body);
  assert.equal(deletion.json().mediaCleanupPending,false);
  const remaining=await db.select({id:schema.photos.id}).from(schema.photos)
   .where(eq(schema.photos.listingId,listing.id));
  assert.equal(remaining.length,0,"deleted photo must leave no DB pointer");
  const missing=await app.inject({method:"GET",url:"/v1/photos/"+first.json().id});
  assert.equal(missing.statusCode,404);
 }finally{await app.close();await sql.end();}
});
