import {NextResponse} from "next/server";
import {API,safeOrigin,staffToken} from "../../../../lib/staff";
type Context={params:Promise<{path:string[]}>};
async function handle(request:Request,context:Context,method:"GET"|"POST"){
 if(method==="POST"&&!safeOrigin(request))return NextResponse.json({error:"CROSS_SITE_REQUEST"},{status:403});
 const token=await staffToken();if(!token)return NextResponse.json({error:"AUTH_REQUIRED"},{status:401});
 const {path}=await context.params;
 if(!Array.isArray(path)||path.length<1||path.length>5||
  path.some(part=>!/^[A-Za-z0-9_-]{1,64}$/.test(part)))
  return NextResponse.json({error:"INVALID_PATH"},{status:422});
 const full=API+"/v1/admin/safety/"+path.map(encodeURIComponent).join("/");
 const url=new URL(request.url);
 const status=url.searchParams.get("status");
 const query=method==="GET"&&status&&/^[a-z_]{3,20}$/.test(status)?"?status="+encodeURIComponent(status):"";
 let body:string|undefined;
 if(method==="POST"){
  try{body=JSON.stringify(await request.json());}catch{return NextResponse.json({error:"INVALID_INPUT"},{status:422});}
  if(body.length>8000)return NextResponse.json({error:"INPUT_TOO_LARGE"},{status:413});
 }
 try{
  const response=await fetch(full+query,{method,headers:{Authorization:"Bearer "+token,...(body?{"Content-Type":"application/json"}:{})},
   ...(body?{body}:{}),cache:"no-store"});
  return NextResponse.json(await response.json(),{status:response.status});
 }catch{return NextResponse.json({error:"API_UNAVAILABLE"},{status:503});}
}
export async function GET(request:Request,context:Context){return handle(request,context,"GET");}
export async function POST(request:Request,context:Context){return handle(request,context,"POST");}
