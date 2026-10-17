import {NextResponse} from "next/server";
import {API,safeOrigin,staffToken} from "../../../../../lib/staff";
export async function POST(request:Request,context:{params:Promise<{id:string}>}){
 if(!safeOrigin(request))return NextResponse.json({error:"CROSS_SITE_REQUEST"},{status:403});
 const token=await staffToken();if(!token)return NextResponse.json({error:"AUTH_REQUIRED"},{status:401});
 const {id}=await context.params;if(!/^[0-9a-f-]{36}$/i.test(id))return NextResponse.json({error:"INVALID_ID"},{status:422});
 let body:unknown;try{body=await request.json();}catch{return NextResponse.json({error:"INVALID_INPUT"},{status:422});}
 const obj=body&&typeof body==="object"?body as Record<string,unknown>:{};
 if(!["approve","reject"].includes(String(obj.decision))||typeof obj.reason!=="string"||obj.reason.trim().length<8)
  return NextResponse.json({error:"INVALID_INPUT"},{status:422});
 try{const response=await fetch(API+"/v1/admin/agents/"+id+"/decision",{
  method:"POST",headers:{Authorization:"Bearer "+token,"Content-Type":"application/json"},
  body:JSON.stringify({decision:obj.decision,reason:obj.reason}),cache:"no-store"});
  return NextResponse.json(await response.json(),{status:response.status});
 }catch{return NextResponse.json({error:"API_UNAVAILABLE"},{status:503});}
}
