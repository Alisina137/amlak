import {NextResponse} from "next/server";
import {API,staffToken,safeOrigin} from "../../../../lib/staff";
type Context={params:Promise<{path:string[]}>};
async function route(req:Request,ctx:Context,method:"GET"|"POST"){
 const {path}=await ctx.params;
 const allowed=method==="GET"?
  (path.length===1&&path[0]==="tickets"||path.length===2&&path[0]==="tickets"&&/^[a-f0-9-]{36}$/.test(path[1])):
  path.length===3&&path[0]==="tickets"&&/^[a-f0-9-]{36}$/.test(path[1])&&["replies","status"].includes(path[2]);
 if(!allowed)return NextResponse.json({error:"INVALID_PATH"},{status:422});
 if(method==="POST"&&!safeOrigin(req))return NextResponse.json({error:"FORBIDDEN"},{status:403});
 const token=await staffToken();if(!token)return NextResponse.json({error:"AUTH_REQUIRED"},{status:401});
 try{
  const body=method==="POST"?await req.text():undefined;
  if(body&&body.length>4096)return NextResponse.json({error:"BODY_TOO_LARGE"},{status:422});
  const response=await fetch(API+"/v1/admin/support/"+path.join("/"),{
   method,cache:"no-store",headers:{Authorization:"Bearer "+token,...(body?{"Content-Type":"application/json"}:{})},
   ...(body?{body}:{})});
  return NextResponse.json(await response.json(),{status:response.status});
 }catch{return NextResponse.json({error:"API_UNAVAILABLE"},{status:503});}
}
export async function GET(req:Request,ctx:Context){return route(req,ctx,"GET");}
export async function POST(req:Request,ctx:Context){return route(req,ctx,"POST");}
