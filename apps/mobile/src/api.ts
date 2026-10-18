import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
type Status="checking"|"connected"|"offline"|"unconfigured";
const API_URL=(process.env.EXPO_PUBLIC_API_URL||"").replace(/\/+$/,"");
/** Recheck on foreground and periodically; avoid foreground/background race and leaked timers. */
export function useApiStatus(){
 const [status,setStatus]=useState<Status>(API_URL?"checking":"unconfigured");
 const epoch=useRef(0),controllerRef=useRef<AbortController|null>(null);
 const lastResult=useRef<Status>("checking");
 const [reconnectEpoch,setReconnectEpoch]=useState(0);
 const refresh=useCallback(async()=>{
  const requestId=++epoch.current;
  controllerRef.current?.abort();
  if(!API_URL){setStatus("unconfigured");return;}
  const controller=new AbortController();controllerRef.current=controller;
  setStatus(previous=>previous==="connected"?"connected":"checking");
  const timer=setTimeout(()=>controller.abort(),5000);
  try{
   const response=await fetch(API_URL+"/health",{signal:controller.signal,
    headers:{Accept:"application/json"}});
   const body:unknown=await response.json();
   if(requestId!==epoch.current)return;
   const next=response.ok&&!!body&&typeof body==="object"&&
    (body as {status?:unknown}).status==="ok"?"connected":"offline";
   if(next==="connected"&&lastResult.current==="offline")setReconnectEpoch(x=>x+1);
   lastResult.current=next;
   setStatus(next);
  }catch{if(requestId===epoch.current){lastResult.current="offline";setStatus("offline");}}
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
 return {status,refresh,reconnectEpoch};
}
