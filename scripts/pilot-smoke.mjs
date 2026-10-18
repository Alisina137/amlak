const base=(process.env.AMLAK_SMOKE_URL||"http://127.0.0.1:4000").replace(/\/+$/,"");
const checks=[
 ["/health",body=>body.status==="ok","Liveness"],
 ["/ready",body=>body.status==="ok","Database readiness"],
 ["/v1/catalog/provinces?locale=fa",body=>body.count===34,"Afghanistan provinces"],
 ["/v1/discovery?intent=rent&provinceId=kabul&limit=1",body=>Array.isArray(body.items),"Public discovery"]
];
let failures=0;
for(const [path,accept,label] of checks){
 try{
  const start=Date.now(),r=await fetch(base+path,{signal:AbortSignal.timeout(10000)});
  const result=await r.json();
  if(!r.ok||!accept(result))throw Error("unexpected HTTP response");
  console.log("PASS",label,Date.now()-start+"ms");
 }catch(e){failures++;console.error("FAIL",label,e instanceof Error?e.message:String(e));}
}
if(failures)process.exitCode=1;
