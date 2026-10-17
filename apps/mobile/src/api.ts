import { useCallback, useEffect, useState } from "react";
type Status="checking" | "connected" | "offline" | "unconfigured";
const API_URL=(process.env.EXPO_PUBLIC_API_URL || "").replace(/\/+$/,"");
export function useApiStatus(){
 const [status,setStatus]=useState<Status>(API_URL?"checking":"unconfigured");
 const refresh=useCallback(async()=>{
   if(!API_URL){setStatus("unconfigured");return;}
   setStatus("checking");
   const controller=new AbortController();
   const timer=setTimeout(()=>controller.abort(),5000);
   try{
     const response=await fetch(API_URL+"/health",{signal:controller.signal});
     const body:unknown=await response.json();
     if(response.ok && !!body && typeof body==="object" && (body as {status?:unknown}).status==="ok")setStatus("connected");
     else setStatus("offline");
   }catch{setStatus("offline");}finally{clearTimeout(timer);}
 },[]);
 useEffect(()=>{void refresh();},[refresh]);
 return {status,refresh};
}
