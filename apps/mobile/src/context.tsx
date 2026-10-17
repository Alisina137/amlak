import AsyncStorage from "@react-native-async-storage/async-storage";
import { DEFAULT_PROVINCE_ID, findProvince } from "@amlaklink/catalog";
import { DEFAULT_LOCALE, isLocale, type Locale } from "@amlaklink/localization";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
type PreferenceContext = {locale:Locale; setLocale:(value:Locale)=>void; provinceId:string; setProvinceId:(value:string)=>void};
const Context=createContext<PreferenceContext | null>(null);
const STORE_KEY="amlaklink:preferences:v1";
export function PreferencesProvider({children}:{children:ReactNode}){
 const [locale,setLocaleState]=useState<Locale>(DEFAULT_LOCALE);
 const [provinceId,setProvinceState]=useState(DEFAULT_PROVINCE_ID);
 const [hydrated,setHydrated]=useState(false);
 useEffect(()=>{let active=true;AsyncStorage.getItem(STORE_KEY).then(raw=>{
   if (!active || !raw) return;
   const obj:unknown=JSON.parse(raw);
   if (!obj || typeof obj!=="object") return;
   const value=obj as Record<string,unknown>;
   if(isLocale(value.locale))setLocaleState(value.locale);
   if(typeof value.provinceId==="string" && findProvince(value.provinceId))setProvinceState(value.provinceId);
 }).catch(()=>{}).finally(()=>{if(active)setHydrated(true);});return()=>{active=false;};},[]);
 useEffect(()=>{if(hydrated)void AsyncStorage.setItem(STORE_KEY,JSON.stringify({locale,provinceId})).catch(()=>{});},[locale,provinceId,hydrated]);
 const setLocale=useCallback((value:Locale)=>setLocaleState(value),[]);
 const setProvinceId=useCallback((value:string)=>{if(findProvince(value))setProvinceState(value);},[]);
 const value=useMemo(()=>({locale,setLocale,provinceId,setProvinceId}),[locale,setLocale,provinceId,setProvinceId]);
 return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function usePreferences(){const ctx=useContext(Context);if(!ctx)throw new Error("PreferencesProvider missing");return ctx;}
