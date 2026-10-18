import * as SecureStore from "expo-secure-store";
import {createContext,useCallback,useContext,useEffect,useMemo,useRef,useState,type ReactNode} from "react";
const BASE_URL=(process.env.EXPO_PUBLIC_API_URL||"").replace(/\/+$/,"");
const KEY="amlaklink:user-session:v1";
export type Account={id:string;displayName:string;email:string;verified:boolean;advertiserEnabled:boolean;independentAgentStatus:"none"|"pending"|"approved"|"rejected";locale:string;status:string};
type AuthContext={user:Account|null;token:string|null;loading:boolean;signIn:(email:string,password:string)=>Promise<void>;
 verify:(email:string,code:string)=>Promise<void>;signOut:()=>Promise<void>;refresh:()=>Promise<void>};
const Context=createContext<AuthContext|null>(null);
export class ApiError extends Error{constructor(public code:string,public status:number){super(code);}}
/** Bounded GET recovery only. Mutations are never retried automatically: the server
 * may already have committed them before a client timeout. */
const GET_ATTEMPTS=3,REQUEST_TIMEOUT_MS=12000;
const wait=(ms:number)=>new Promise<void>(resolve=>setTimeout(resolve,ms));
export function retryableReadStatus(status:number){
 return status===408||status===429||[502,503,504].includes(status);
}
export function retryDelayMs(attempt:number,retryAfter?:string|null){
 // Retry-After is respected only within a small mobile-friendly upper bound.
 if(retryAfter){
  const parsed=Number(retryAfter);
  if(Number.isFinite(parsed)&&parsed>=0)return Math.min(2500,Math.max(300,parsed*1000));
 }
 return Math.min(2500,500*Math.pow(2,attempt));
}
export async function requestJson<T>(path:string,options:{method?:string;body?:object;token?:string|null;timeoutMs?:number}={}):Promise<T>{
 if(!BASE_URL)throw new ApiError("API_NOT_CONFIGURED",0);
 const method=(options.method||"GET").toUpperCase(),read=method==="GET";
 const attempts=read?GET_ATTEMPTS:1;
 const timeoutMs=Math.min(60000,Math.max(1000,options.timeoutMs??REQUEST_TIMEOUT_MS));
 for(let attempt=0;attempt<attempts;attempt++){
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeoutMs);
  try{
   const response=await fetch(BASE_URL+path,{method,
    headers:{"Accept":"application/json",...(options.body?{"Content-Type":"application/json"}:{}),
     ...(options.token?{Authorization:"Bearer "+options.token}:{})},
    ...(options.body?{body:JSON.stringify(options.body)}:{}),signal:controller.signal});
   if(!response.ok){
    const data=await response.json().catch(()=>({error:"REQUEST_FAILED"}));
    if(read&&attempt+1<attempts&&retryableReadStatus(response.status)){
     clearTimeout(timer);await wait(retryDelayMs(attempt,response.headers.get("Retry-After")));continue;
    }
    throw new ApiError(typeof data?.error==="string"?data.error:"REQUEST_FAILED",response.status);
   }
   try{return await response.json() as T;}
   catch{throw new ApiError("INVALID_SERVER_RESPONSE",response.status);}
  }catch(err){
   if(err instanceof ApiError)throw err;
   const error=new ApiError(controller.signal.aborted?"REQUEST_TIMEOUT":"NETWORK_UNAVAILABLE",0);
   if(read&&attempt+1<attempts){
    clearTimeout(timer);await wait(retryDelayMs(attempt));continue;
   }
   // Failed POST/PUT/DELETE response does not imply the server rejected the write.
   throw error;
  }finally{clearTimeout(timer);}
 }
 throw new ApiError("NETWORK_UNAVAILABLE",0);
}
export function AuthProvider({children}:{children:ReactNode}){
 const [user,setUser]=useState<Account|null>(null),[token,setToken]=useState<string|null>(null),[loading,setLoading]=useState(true);
 // In-flight /me from a previous session must never revive a signed-out or switched account.
 const sessionEpoch=useRef(0);
 const secureStoreQueue=useRef<Promise<void>>(Promise.resolve());
 const queueCredentialWrite=(action:()=>Promise<void>)=>{
  const result=secureStoreQueue.current.catch(()=>{}).then(action);
  secureStoreQueue.current=result.catch(()=>{});
  return result;
 };
 const persist=useCallback(async(nextToken:string,nextUser:Account)=>{
   const epoch=++sessionEpoch.current;
   await queueCredentialWrite(async()=>{
    if(epoch===sessionEpoch.current)await SecureStore.setItemAsync(KEY,nextToken);
   });
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
    setToken(null);setUser(null);
    await queueCredentialWrite(async()=>{
     if(epoch+1===sessionEpoch.current)await SecureStore.deleteItemAsync(KEY);
    });
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
   // Clear this phone first, even when the network is down. A delayed logout
   // must never erase the token of a newer sign-in.
   const epoch=++sessionEpoch.current;
   const oldToken=token;
   setToken(null);setUser(null);
   await queueCredentialWrite(async()=>{
    if(epoch===sessionEpoch.current)await SecureStore.deleteItemAsync(KEY);
   });
   // Best-effort remote revocation, not a guarantee while offline. Users can
   // revoke remote devices from Account > Sessions after reconnecting.
   if(oldToken){
    void import("./push-client").then(p=>p.unregisterCurrentDevice(oldToken)).catch(()=>{});
    void requestJson("/v1/auth/logout",{method:"POST",token:oldToken,timeoutMs:4000}).catch(()=>{});
   }
 },[token]);
 const value=useMemo(()=>({user,token,loading,signIn,verify,signOut,refresh}),[user,token,loading,signIn,verify,signOut,refresh]);
 return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useAuth(){const ctx=useContext(Context);if(!ctx)throw new Error("AuthProvider missing");return ctx;}
