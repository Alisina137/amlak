import {NextResponse} from "next/server";
import {API,staffToken} from "../../../lib/staff";
export async function GET(){
 const token=await staffToken();if(!token)return NextResponse.json({error:"AUTH_REQUIRED"},{status:401});
 try{
  const response=await fetch(API+"/v1/admin/listings/review-queue",{headers:{Authorization:"Bearer "+token},cache:"no-store"});
  return NextResponse.json(await response.json(),{status:response.status});
 }catch{return NextResponse.json({error:"API_UNAVAILABLE"},{status:503});}
}
