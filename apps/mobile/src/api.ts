import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
type Status="checking"|"connected"|"offline"|"unconfigured";
const API_URL=(process.env.EXPO_PUBLIC_API_URL||"").replace(/\/+$/,"");
/** Recheck on foreground and periodically; avoid foreground/background race and leaked timers. */
export function useApiStatus(){
 const [status,setStatus]=useState<Status>(API_URL?"checking":"unconfigured");
 const epoch=useRef(0),controllerRef=useRef<AbortController|null>(null);
 const refresh=useCallback(async()=>{
  const requestId=++epoch.current;
  controllerRef.current?.abort();
  if(!API_URL){setStatus("unconfigured");return;}
  const controller=new AbortController();controllerRef.current=controller;
  setStatus("checking");
  const timer=setTimeout(()=>controller.abort(),5000);
  try{
   const response=await fetch(API_URL+"/health",{signal:controller.signal,
    headers:{Accept:"application/json"}});
   const body:unknown=await response.json();
   if(requestId!==epoch.current)return;
   setStatus(response.ok&&!!body&&typeof body==="object"&&
    (body as {status?:unknown}).status==="ok"?"connected":"offline");
  }catch{if(requestId===epoch.current)setStatus("offline");}
  finally{
   clearTimeout(timer);
   if(controllerRef.current===controller)controllerRef.current=null;
  }
 },[]);
 useEffect(()=>{
  void refresh();
  const listener=AppState.addEventListener("change",state=>{
   if(state==="active")void refresh();
   else {epoch.current++;controllerRef.current?.abort();}
  });
  const timer=setInterval(()=>{if(AppState.currentState==="active")void refresh();},45000);
  return()=>{
   epoch.current++;controllerRef.current?.abort();clearInterval(timer);listener.remove();
  };
 },[refresh]);
 return {status,refresh};
}
