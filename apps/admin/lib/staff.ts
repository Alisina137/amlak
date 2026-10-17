import {cookies} from "next/headers";
export const COOKIE="amlak_staff_session";
export const API=(process.env.AMLAK_API_INTERNAL_URL||"http://127.0.0.1:4000").replace(/\/+$/,"");
export type Staff={id:string;displayName:string;role:string};
export async function staffToken(){return (await cookies()).get(COOKIE)?.value||null;}
export async function getStaff():Promise<Staff|null>{
 const token=await staffToken();if(!token)return null;
 try{
  const response=await fetch(API+"/v1/staff/me",{headers:{Authorization:"Bearer "+token},cache:"no-store"});
  if(!response.ok)return null;
  const data:unknown=await response.json();
  if(!data||typeof data!=="object"||!("staff" in data))return null;
  return (data as {staff:Staff}).staff;
 }catch{return null;}
}
export function safeOrigin(request:Request){
 const origin=request.headers.get("origin");
 return !!origin && origin===new URL(request.url).origin;
}
