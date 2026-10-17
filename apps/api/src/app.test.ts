import assert from "node:assert/strict";
import test from "node:test";
import {buildApp} from "./app";
test("public guest browsing and health remain available without credentials",async()=>{
 const app=buildApp();try{
  const h=await app.inject({method:"GET",url:"/health"});
  assert.equal(h.statusCode,200);assert.equal(h.json().status,"ok");
  assert.equal((await app.inject({method:"GET",url:"/ready"})).statusCode,503);
  const all=await app.inject({method:"GET",url:"/v1/catalog/provinces"});
  assert.equal(all.statusCode,200);assert.equal(all.json().count,34);
  assert.equal(all.json().defaultProvinceId,"kabul");
  assert.equal((await app.inject({method:"GET",url:"/v1/catalog/provinces?q=%D9%83%D8%A7%D8%A8%D9%84&locale=fa"})).json().items[0].id,"kabul");
  assert.equal((await app.inject({method:"GET",url:"/v1/catalog/provinces?locale=unknown"})).statusCode,400);
 }finally{await app.close();}
});
