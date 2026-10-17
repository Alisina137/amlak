import AsyncStorage from "@react-native-async-storage/async-storage";
import {createContext,useCallback,useContext,useEffect,useMemo,useState,type ReactNode} from "react";
import type {SearchFilters} from "./discovery-client";
const KEY="amlak:filters:v4";
type State={filters:SearchFilters;setFilters:(patch:SearchFilters)=>void;replaceFilters:(all:SearchFilters)=>void;reset:()=>void;hydrated:boolean};
const Context=createContext<State|null>(null);
export function SearchProvider({children}:{children:ReactNode}){
 const [filters,set]=useState<SearchFilters>({intent:"sale",provinceId:"kabul",sort:"newest"});
 const [hydrated,setHydrated]=useState(false);
 useEffect(()=>{let live=true;
  void AsyncStorage.getItem(KEY).then(raw=>{
   if(!live||!raw)return;
   const p=JSON.parse(raw) as SearchFilters;
   if(p && typeof p==="object"&&!Array.isArray(p))set(p);
  }).catch(()=>{}).finally(()=>{if(live)setHydrated(true);});
  return()=>{live=false;};
 },[]);
 useEffect(()=>{if(hydrated)void AsyncStorage.setItem(KEY,JSON.stringify(filters)).catch(()=>{});},[filters,hydrated]);
 const setFilters=useCallback((patch:SearchFilters)=>set(previous=>({...previous,...patch})),[]);
 const replaceFilters=useCallback((all:SearchFilters)=>set(all),[]);
 const reset=useCallback(()=>set({intent:"sale",provinceId:"kabul",sort:"newest"}),[]);
 return <Context.Provider value={useMemo(()=>({filters,setFilters,replaceFilters,reset,hydrated}),[filters,setFilters,replaceFilters,reset,hydrated])}>{children}</Context.Provider>;
}
export function useSearchFilters(){const value=useContext(Context);if(!value)throw new Error("SearchProvider missing");return value;}
