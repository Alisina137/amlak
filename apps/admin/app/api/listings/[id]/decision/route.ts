import {NextResponse} from "next/server";
import {API,safeOrigin,staffToken} from "../../../../../lib/staff";
export async function POST(request:Request,context:{params:Promise<{id:string}>}){
 if(!safeOrigin(request))return NextResponse.json({error:"CROSS_SITE_REQUEST"},{status:403});
 const token=await staffToken();if(!token)return NextResponse.json({error:"AUTH_REQUIRED"},{status:401});
 const {id}=await context.params;
 if(!/^[0-9a-f-]{36}$/i.test(id))return NextResponse.json({error:"INVALID_ID"},{status:422});
 let payload:unknown;try{payload=await request.json();}catch{return NextResponse.json({error:"INVALID_INPUT"},{status:422});}
 const data=payload && typeof payload==="object"?payload as Record<string,unknown>:{};
 if(typeof data.revisionId!=="string"||!["approve","reject"].includes(String(data.decision))||typeof data.reason!=="string"||data.reason.trim().length<8)
  return NextResponse.json({error:"INVALID_INPUT"},{status:422});
 try{
  const result=await fetch(API+"/v1/admin/listings/"+id+"/decision",{
   method:"POST",headers:{Authorization:"Bearer "+token,"Content-Type":"application/json"},
   body:JSON.stringify({revisionId:data.revisionId,decision:data.decision,reason:data.reason}),cache:"no-store"});
  return NextResponse.json(await result.json(),{status:result.status});
 }catch{return NextResponse.json({error:"API_UNAVAILABLE"},{status:503});}
}
