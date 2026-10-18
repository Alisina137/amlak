import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
import test from "node:test";
import {connectDatabase,schema} from "@amlaklink/database";
import {listingDraftSchema} from "@amlaklink/contracts";
import {buildApp} from "./app";
import {newToken,hashToken} from "./security";

test("Phase 8 shortlists enforce private membership, opt-in invites and revocation",{skip:!process.env.DATABASE_URL},async()=>{
 const {db,sql}=connectDatabase(),app=buildApp({db});
 const tag=randomUUID().slice(0,8);
 const users=await db.insert(schema.users).values(
  Array.from({length:6},(_,i)=>({displayName:"Shortlist user "+i,
   email:"shortlist-"+i+"-"+tag+"@example.test",emailVerifiedAt:new Date(),passwordHash:"test"}))
 ).returning();
 const tokens=users.map(()=>newToken());
 await db.insert(schema.sessions).values(users.map((person,i)=>({audience:"user" as const,userId:person.id,
  tokenHash:hashToken(tokens[i]),expiresAt:new Date(Date.now()+3600000)})));
 const request=async(method:"GET"|"POST"|"PUT"|"DELETE",url:string,as?:number,payload?:object)=>{
  const response=await app.inject({method,url,headers:as===undefined?{}:{authorization:"Bearer "+tokens[as]},
   ...(payload?{payload}:{})});
  return {status:response.statusCode,body:response.json() as Record<string,any>};
 };
 try{
  assert.equal((await request("GET","/v1/shortlists")).status,401);
  assert.equal((await request("POST","/v1/shortlists",0,{title:"Family visits"})).status,200);
  const lists=await request("GET","/v1/shortlists",0);
  const id=lists.body.items[0].id as string;
  const url="/v1/shortlists/"+id;
  assert.equal((await request("GET",url,5)).status,404);
  assert.equal((await request("POST",url+"/invitations",1,{email:users[2].email})).status,404);
  assert.equal((await request("POST",url+"/invitations",0,{email:users[0].email})).status,422);
  for(let i=1;i<=4;i++){
   assert.equal((await request("POST",url+"/invitations",0,{email:users[i].email})).status,200);
  }
  assert.equal((await request("POST",url+"/invitations",0,{email:users[5].email})).status,409);
  assert.equal((await request("GET",url,1)).status,404);
  assert.equal((await request("POST",url+"/accept",1)).status,200);
  assert.equal((await request("GET",url,1)).status,200);
  const [listing]=await db.insert(schema.listings).values({authorId:users[0].id,
   publisher:"private",clientRequestId:randomUUID(),status:"published",lastConfirmedAt:new Date(),publishedAt:new Date()}).returning();
  const [revision]=await db.insert(schema.revisions).values({listingId:listing.id,sequence:1,status:"approved",
   data:listingDraftSchema.parse({title:"Kabul villa",transactionType:"sale",price:{askingPrice:12000,currency:"AFN"}})}).returning();
  await db.update(schema.listings).set({approvedRevisionId:revision.id}).where(
   (await import("drizzle-orm")).eq(schema.listings.id,listing.id));
  assert.equal((await request("POST",url+"/items",5,{listingId:listing.id})).status,404);
  const add=await request("POST",url+"/items",1,{listingId:listing.id});
  assert.equal(add.status,200);
  const itemId=add.body.id as string;
  assert.equal((await request("POST",url+"/items",1,{listingId:listing.id})).body.reused,true);
  assert.equal((await request("PUT",url+"/items/"+itemId+"/vote",5,{vote:"interested"})).status,404);
  assert.equal((await request("PUT",url+"/items/"+itemId+"/vote",1,{vote:"interested",note:"Visit this one"})).status,200);
  const data=await request("GET",url,0);
  assert.equal(data.body.items[0].votes[0].note,"Visit this one");
  assert.equal((await request("DELETE",url+"/members/"+users[1].id,0)).status,200);
  assert.equal((await request("GET",url,1)).status,404);
  assert.equal((await request("PUT",url+"/items/"+itemId+"/vote",1,{vote:"pass"})).status,404);
  assert.equal((await request("POST",url+"/invitations",0,{email:users[5].email})).status,200);
  assert.equal((await request("DELETE",url+"/members/"+users[0].id,0)).status,403);
  assert.equal((await request("DELETE",url,1)).status,404);
  assert.equal((await request("DELETE",url,0)).status,200);
  assert.equal((await request("GET",url,0)).status,404);
 }finally{await app.close();await sql.end();}
});
