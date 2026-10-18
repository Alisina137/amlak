import {NextResponse} from "next/server";
import {API,staffToken,safeOrigin} from "../../../../lib/staff";
type Context={params:Promise<{path:string[]}>};
async function run(request:Request,context:Context,method:"GET"|"POST"){
 const {path}=await context.params;
 const name=path.join("/");
 if(!["scorecard","freshness","freshness/run"].includes(name))
  return NextResponse.json({error:"INVALID_PATH"},{status:422});
 if(method==="POST"&&(name!=="freshness/run"||!safeOrigin(request)))
  return NextResponse.json({error:"FORBIDDEN"},{status:403});
 if(method==="GET"&&name==="freshness/run")
  return NextResponse.json({error:"FORBIDDEN"},{status:403});
 const token=await staffToken();
 if(!token)return NextResponse.json({error:"AUTH_REQUIRED"},{status:401});
 try{
  const response=await fetch(API+"/v1/admin/pilot/"+name,{method,
   headers:{Authorization:"Bearer "+token},cache:"no-store"});
  return NextResponse.json(await response.json(),{status:response.status});
 }catch{return NextResponse.json({error:"API_UNAVAILABLE"},{status:503});}
}
export async function GET(req:Request,context:Context){return run(req,context,"GET");}
export async function POST(req:Request,context:Context){return run(req,context,"POST");}
