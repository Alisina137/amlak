import AsyncStorage from "@react-native-async-storage/async-storage";
import {requestJson} from "./auth";
import type {ListingDTO} from "./listing-client";
export type SearchFilters={
 q?:string;intent?:"sale"|"rent"|"gharawi";type?:string;provinceId?:string;
 city?:string;district?:string;neighborhood?:string;currency?:"AFN"|"USD";
 minPrice?:string;maxPrice?:string;minArea?:string;maxArea?:string;
 bedrooms?:string;bathrooms?:string;furnished?:string;parking?:string;water?:string;electricity?:string;
 advertiser?:string;verifiedAgency?:string;sort?:"newest"|"recent_confirmed"|"price_asc"|"price_desc";
};
export type DiscoveryResult={items:ListingDTO[];nextCursor:string|null;appliedFilters:SearchFilters};
export function queryString(filters:SearchFilters,extra:Record<string,string>={}){
 const params=new URLSearchParams();
 for(const [key,val] of Object.entries({...filters,...extra}))
  if(val!==undefined&&String(val).trim()!=="")params.append(key,String(val).trim());
 return params.toString();
}
export async function fetchDiscovery(filters:SearchFilters,cursor?:string){
 return requestJson<DiscoveryResult>("/v1/discovery?"+queryString(filters,cursor?{cursor}:{}));
}
// Public discovery only. Offline results are stale previews, not availability guarantees.
const CACHE_PREFIX="amlak:search:v5:",CACHE_MAX_AGE_MS=48*3600_000,CACHE_LIMIT=24;
export function parseCachedDiscovery(raw:string|null,now=Date.now()):{timestamp:number;items:ListingDTO[]}|null{
 if(!raw)return null;
 try{
  const value=JSON.parse(raw) as {timestamp:unknown;items:unknown};
  if(!value||typeof value!=="object"||typeof value.timestamp!=="number"||
   !Number.isFinite(value.timestamp)||value.timestamp>now||
   now-value.timestamp>CACHE_MAX_AGE_MS||!Array.isArray(value.items))return null;
  const items=value.items as ListingDTO[];
  if(items.length>50||items.some(x=>!x||typeof x.id!=="string"||!x.data))return null;
  return {timestamp:value.timestamp,items};
 }catch{return null;}
}
export async function cachedDiscovery(filters:SearchFilters){
 const key=CACHE_PREFIX+queryString(filters);
 try{
  const online=await fetchDiscovery(filters);
  try{
   // Bounded on-device public cache: avoid unbounded query variants.
   const keys=(await AsyncStorage.getAllKeys()).filter(x=>x.startsWith(CACHE_PREFIX));
   if(!keys.includes(key)&&keys.length>=CACHE_LIMIT)
    await AsyncStorage.multiRemove(keys.slice(0,keys.length-CACHE_LIMIT+1));
   await AsyncStorage.setItem(key,JSON.stringify({timestamp:Date.now(),items:online.items.slice(0,50)}));
  }catch{} // Cache storage issues never turn a successful request into an error.
  return {...online,fromCache:false,cacheDate:null as number|null};
 }catch(error){
  const cached=parseCachedDiscovery(await AsyncStorage.getItem(key).catch(()=>null));
  if(!cached)throw error;
  return {items:cached.items,nextCursor:null,appliedFilters:filters,fromCache:true,cacheDate:cached.timestamp};
 }
}
export type PropertyMapPoint={id:string;latitude:number;longitude:number;title:string;transactionType:string;price:ListingDTO["data"]["price"]};
export async function fetchMap(filters:SearchFilters,viewport?:string){
 const result=await requestJson<{items:PropertyMapPoint[];nextCursor:string|null;unmappedListings:number}>(
  "/v1/discovery/map?"+queryString(filters,viewport?{viewport}:{}));
 return result;
}
export type AdvertiserProfile={id:string;kind:"agency"|"user";name:string;provinceId?:string;
 badges:{kind:string;description:string;reviewedAt?:string|null}[]};
export const advertiserKind=(listing:ListingDTO)=>listing.agencyId?"agency":"user";
export const advertiserId=(listing:ListingDTO)=>listing.agencyId||listing.authorId;
export function fetchAdvertiser(kind:string,id:string){return requestJson<AdvertiserProfile>("/v1/advertisers/"+kind+"/"+id);}
export function fetchAdvertiserProperties(kind:string,id:string){return requestJson<{items:ListingDTO[]}>("/v1/advertisers/"+kind+"/"+id+"/properties");}
export async function getContact(id:string,channel:"call"|"whatsapp"){return requestJson<{href:string;channel:string;note:string}>("/v1/properties/"+id+"/contact?channel="+channel);}
