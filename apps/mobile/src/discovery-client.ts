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
export async function cachedDiscovery(filters:SearchFilters){
 const key="amlak:search:v4:"+queryString(filters);
 try{
  const online=await fetchDiscovery(filters);
  await AsyncStorage.setItem(key,JSON.stringify({timestamp:Date.now(),items:online.items})).catch(()=>{});
  return {...online,fromCache:false,cacheDate:null as number|null};
 }catch(error){
  const raw=await AsyncStorage.getItem(key).catch(()=>null);
  if(!raw)throw error;
  const data=JSON.parse(raw) as {timestamp:number;items:ListingDTO[]};
  if(!Array.isArray(data.items)||Date.now()-data.timestamp>7*86400_000)throw error;
  return {items:data.items,nextCursor:null,appliedFilters:filters,fromCache:true,cacheDate:data.timestamp};
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
