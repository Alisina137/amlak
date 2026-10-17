import {NextResponse} from "next/server";
import {API,staffToken} from "../../../../lib/staff";
export async function GET(_request:Request,context:{params:Promise<{id:string}>}){
 const token=await staffToken();if(!token)return new NextResponse(null,{status:401});
 const {id}=await context.params;
 if(!/^[0-9a-f-]{36}$/i.test(id))return new NextResponse(null,{status:404});
 try{
  const response=await fetch(API+"/v1/photos/"+id,{headers:{Authorization:"Bearer "+token},cache:"no-store"});
  if(!response.ok)return new NextResponse(null,{status:response.status});
  const bytes=await response.arrayBuffer();
  if(bytes.byteLength>4_000_000)return new NextResponse(null,{status:413});
  return new NextResponse(bytes,{headers:{"Content-Type":"image/webp","X-Content-Type-Options":"nosniff","Cache-Control":"private,no-store"}});
 }catch{return new NextResponse(null,{status:503});}
}
