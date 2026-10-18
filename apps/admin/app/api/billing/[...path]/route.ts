import {NextResponse} from "next/server";
import {API,staffToken,safeOrigin} from "../../../../lib/staff";
type Context={params:Promise<{path:string[]}>};
async function run(request:Request,context:Context,method:"GET"|"POST"){
 const {path}=await context.params;
 const name=path.join("/");
 const allowed=method==="GET"?["claims","history","adjustments","reconciliation","exceptions"].includes(name):
   (path.length===3&&/^[0-9a-f-]{36}$/.test(path[1])&&
    (path[0]==="claims"&&path[2]==="decision"||
     path[0]==="adjustments"&&["decision","settle"].includes(path[2])));
 if(!allowed)return NextResponse.json({error:"INVALID_PATH"},{status:422});
 if(method==="POST"&&!safeOrigin(request))return NextResponse.json({error:"FORBIDDEN"},{status:403});
 const token=await staffToken();
 if(!token)return NextResponse.json({error:"AUTH_REQUIRED"},{status:401});
 try{
  const body=method==="POST"?await request.text():undefined;
  if(body&&body.length>4096)return NextResponse.json({error:"INVALID_BODY"},{status:422});
  const response=await fetch(API+"/v1/admin/billing/"+name,{method,cache:"no-store",
   headers:{Authorization:"Bearer "+token,...(body?{"Content-Type":"application/json"}:{})},
   ...(body?{body}: {})});
  return NextResponse.json(await response.json(),{status:response.status});
 }catch{return NextResponse.json({error:"API_UNAVAILABLE"},{status:503});}
}
export async function GET(req:Request,ctx:Context){return run(req,ctx,"GET");}
export async function POST(req:Request,ctx:Context){return run(req,ctx,"POST");}
