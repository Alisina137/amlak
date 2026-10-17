import assert from "node:assert/strict";
import test from "node:test";
import {buildApp} from "./app";
test("health and readiness",async()=>{
 const app=buildApp();try {
  const health=await app.inject({method:"GET",url:"/health"});
  assert.equal(health.statusCode,200);assert.deepEqual(health.json(),{status:"ok",service:"amlaklink-api"});
  assert.equal((await app.inject({method:"GET",url:"/ready"})).statusCode,200);
 }finally{await app.close();}
});
test("catalog is searchable with no authentication and returns all 34 provinces",async()=>{
 const app=buildApp();try{
  const all=await app.inject({method:"GET",url:"/v1/catalog/provinces"});
  assert.equal(all.statusCode,200);assert.equal(all.json().count,34);
  assert.equal(all.json().defaultProvinceId,"kabul");
  const q=await app.inject({method:"GET",url:"/v1/catalog/provinces?q=%D9%83%D8%A7%D8%A8%D9%84&locale=fa"});
  assert.equal(q.statusCode,200);assert.equal(q.json().items[0].id,"kabul");
  const bad=await app.inject({method:"GET",url:"/v1/catalog/provinces?locale=unknown"});
  assert.equal(bad.statusCode,400);
  assert.equal((await app.inject({method:"GET",url:"/v1/catalog/provinces/invalid"})).statusCode,404);
 }finally{await app.close();}
});
