import {NextResponse} from "next/server";
import {API,COOKIE,safeOrigin} from "../../../../lib/staff";
export async function POST(request:Request){
 if(!safeOrigin(request))return NextResponse.json({error:"CROSS_SITE_REQUEST"},{status:403});
 let body:unknown;
 try{body=await request.json();}catch{return NextResponse.json({error:"INVALID_INPUT"},{status:422});}
 const obj=body && typeof body==="object"?body as Record<string,unknown>:{};
 if(typeof obj.email!=="string"||typeof obj.password!=="string"||typeof obj.totp!=="string")
   return NextResponse.json({error:"INVALID_INPUT"},{status:422});
 try{
  const response=await fetch(API+"/v1/staff/auth/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:obj.email,password:obj.password,totp:obj.totp}),cache:"no-store"});
  const data:unknown=await response.json();
  if(!response.ok)return NextResponse.json({error:"AUTHENTICATION_FAILED"},{status:response.status===429?429:401});
  if(!data||typeof data!=="object"||typeof(data as {token?:unknown}).token!=="string")
    return NextResponse.json({error:"INVALID_BACKEND_RESPONSE"},{status:502});
  const token=(data as {token:string}).token;
  const answer=NextResponse.json({success:true});
  answer.cookies.set(COOKIE,token,{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"strict",path:"/",maxAge:24*60*60});
  return answer;
 }catch{return NextResponse.json({error:"API_UNAVAILABLE"},{status:503});}
}
