import AsyncStorage from "@react-native-async-storage/async-storage";
import {router} from "expo-router";
import {createContext,useCallback,useContext,useEffect,useMemo,useRef,useState,type ReactNode} from "react";
import {requestJson} from "./auth";
import {useAuth} from "./auth";
const PENDING="amlak:pending-favorite:v1";
type State={saved:Set<string>;toggle:(id:string)=>Promise<void>;isSaved:(id:string)=>boolean;refresh:()=>Promise<void>;loading:boolean};
const Context=createContext<State|null>(null);
export function FavoriteProvider({children}:{children:ReactNode}){
 const {token}=useAuth();
 const [snapshot,setSnapshot]=useState<{token:string|null;ids:Set<string>}>({token:null,ids:new Set()});
 const currentToken=useRef<string|null>(token),requestVersion=useRef(0);
 currentToken.current=token;
 // Never render another signed-in account's favorites, even for a single frame.
 const saved=snapshot.token===token?snapshot.ids:new Set<string>();
 const setSaved=useCallback((update:(ids:Set<string>)=>Set<string>)=>{
  setSnapshot(previous=>({token,ids:update(previous.token===token?previous.ids:new Set())}));
 },[token]);
 const [loading,setLoading]=useState(false);
 const refresh=useCallback(async()=>{
  const version=++requestVersion.current;
  if(!token){setSaved(()=>new Set());setLoading(false);return;}
  setLoading(true);
  try{
   const data=await requestJson<{items:{id:string}[]}>("/v1/favorites",{token});
   if(currentToken.current===token&&version===requestVersion.current)
    setSaved(()=>new Set(data.items.map(row=>row.id)));
  }catch{}finally{if(currentToken.current===token&&version===requestVersion.current)setLoading(false);}
 },[token]);
 useEffect(()=>{let active=true;
  if(!token){requestVersion.current++;setSaved(()=>new Set());setLoading(false);return;}
  void (async()=>{
   const pending=await AsyncStorage.getItem(PENDING).catch(()=>null);
   if(active && pending && /^[0-9a-f-]{36}$/i.test(pending)){
    try{await requestJson("/v1/favorites/"+pending,{method:"POST",token});
     await AsyncStorage.removeItem(PENDING);
    }catch{}
   }
   if(active&&currentToken.current===token)await refresh();
  })();
  return()=>{active=false;};
 },[token,refresh]);
 const toggle=useCallback(async(id:string)=>{
  if(!token){
   await AsyncStorage.setItem(PENDING,id).catch(()=>{});
   router.push({pathname:"/auth/[action]",params:{action:"login",returnPropertyId:id}});
   return;
  }
  const next=!saved.has(id);
  setSaved(current=>{const s=new Set(current);if(next)s.add(id);else s.delete(id);return s;});
  try{await requestJson("/v1/favorites/"+id,{token,method:next?"POST":"DELETE"});}
  catch{await refresh();throw Error("SAVE_FAILED");}
 },[token,saved,refresh]);
 const isSaved=useCallback((id:string)=>saved.has(id),[saved]);
 return <Context.Provider value={useMemo(()=>({saved,toggle,isSaved,refresh,loading}),[saved,toggle,isSaved,refresh,loading])}>{children}</Context.Provider>;
}
export function useFavorites(){const value=useContext(Context);if(!value)throw Error("FavoriteProvider missing");return value;}
export async function getPendingFavorite(){return AsyncStorage.getItem(PENDING).catch(()=>null);}
