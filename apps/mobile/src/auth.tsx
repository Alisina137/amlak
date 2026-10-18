import * as SecureStore from "expo-secure-store";
import {createContext,useCallback,useContext,useEffect,useMemo,useRef,useState,type ReactNode} from "react";
const BASE_URL=(process.env.EXPO_PUBLIC_API_URL||"").replace(/\/+$/,"");
const KEY="amlaklink:user-session:v1";
export type Account={id:string;displayName:string;email:string;verified:boolean;advertiserEnabled:boolean;independentAgentStatus:"none"|"pending"|"approved"|"rejected";locale:string;status:string};
type AuthContext={user:Account|null;token:string|null;loading:boolean;signIn:(email:string,password:string)=>Promise<void>;
 verify:(email:string,code:string)=>Promise<void>;signOut:()=>Promise<void>;refresh:()=>Promise<void>};
const Context=createContext<AuthContext|null>(null);
export class ApiError extends Error{constructor(public code:string,public status:number){super(code);}}
export async function requestJson<T>(path:string,options:{method?:string;body?:object;token?:string|null}={}):Promise<T>{
 if(!BASE_URL)throw new ApiError("API_NOT_CONFIGURED",0);
 const method=options.method||"GET",attempts=method==="GET"?2:1;
 for(let attempt=0;attempt<attempts;attempt++){
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),10000);
  try{
   const response=await fetch(BASE_URL+path,{method,
    headers:{"Content-Type":"application/json",...(options.token?{Authorization:"Bearer "+options.token}:{})},
    ...(options.body?{body:JSON.stringify(options.body)}:{}),signal:controller.signal});
   const data=await response.json().catch(()=>({error:"INVALID_SERVER_RESPONSE"}));
   if(!response.ok){
    if(method==="GET"&&attempt+1<attempts&&[502,503,504].includes(response.status)){
     await new Promise(resolve=>setTimeout(resolve,400));continue;
    }
    throw new ApiError(typeof data?.error==="string"?data.error:"REQUEST_FAILED",response.status);
   }
   return data as T;
  }catch(err){
   if(err instanceof ApiError)throw err;
   if(method==="GET"&&attempt+1<attempts){await new Promise(resolve=>setTimeout(resolve,400));continue;}
   throw new ApiError("NETWORK_UNAVAILABLE",0);
  }finally{clearTimeout(timer);}
 }
 throw new ApiError("NETWORK_UNAVAILABLE",0);
}
export function AuthProvider({children}:{children:ReactNode}){
 const [user,setUser]=useState<Account|null>(null),[token,setToken]=useState<string|null>(null),[loading,setLoading]=useState(true);
 // In-flight /me from a previous session must never revive a signed-out or switched account.
 const sessionEpoch=useRef(0);
 const persist=useCallback(async(nextToken:string,nextUser:Account)=>{
   const epoch=++sessionEpoch.current;
   await SecureStore.setItemAsync(KEY,nextToken);
   if(epoch!==sessionEpoch.current)return;
   setToken(nextToken);setUser(nextUser);
 },[]);
 const refresh=useCallback(async()=>{
  const epoch=sessionEpoch.current;
  const saved=token||await SecureStore.getItemAsync(KEY);
  if(epoch!==sessionEpoch.current||!saved)return;
  try{
   const res=await requestJson<{user:Account}>("/v1/me",{token:saved});
   if(epoch===sessionEpoch.current){setToken(saved);setUser(res.user);}
  }catch(err){
   // Offline is not a logout. Only an authoritative auth rejection invalidates stored credentials.
   if(epoch===sessionEpoch.current && err instanceof ApiError && [401,403].includes(err.status)){
    sessionEpoch.current++;
    await SecureStore.deleteItemAsync(KEY);setToken(null);setUser(null);
   }
  }
 },[token]);
 useEffect(()=>{let mounted=true;void (async()=>{try{await refresh();}finally{if(mounted)setLoading(false);}})();return()=>{mounted=false;};},[]); // once at launch
 const signIn=useCallback(async(email:string,password:string)=>{
   const epoch=sessionEpoch.current;
   const data=await requestJson<{token:string;user:Account}>("/v1/auth/login",{method:"POST",body:{email,password}});
   if(epoch!==sessionEpoch.current)return;
   await persist(data.token,data.user);
 },[persist]);
 const verify=useCallback(async(email:string,code:string)=>{
   const epoch=sessionEpoch.current;
   const data=await requestJson<{token:string;user:Account}>("/v1/auth/verify",{method:"POST",body:{email,code}});
   if(epoch!==sessionEpoch.current)return;
   await persist(data.token,data.user);
 },[persist]);
 const signOut=useCallback(async()=>{
   // Invalidate all previous /me responses before calling the network.
   sessionEpoch.current++;
   setToken(null);setUser(null);
   if(token)await import("./push-client").then(p=>p.unregisterCurrentDevice(token)).catch(()=>{});
   if(token)await requestJson("/v1/auth/logout",{method:"POST",token}).catch(()=>{});
   await SecureStore.deleteItemAsync(KEY);setToken(null);setUser(null);
 },[token]);
 const value=useMemo(()=>({user,token,loading,signIn,verify,signOut,refresh}),[user,token,loading,signIn,verify,signOut,refresh]);
 return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useAuth(){const ctx=useContext(Context);if(!ctx)throw new Error("AuthProvider missing");return ctx;}
