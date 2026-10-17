import type {ListingDraft} from "@amlaklink/contracts";
import {requestJson,ApiError} from "./auth";
export const API_ROOT=(process.env.EXPO_PUBLIC_API_URL||"").replace(/\/+$/,"");
export type ListingDTO={
 id:string;status:string;version:number;publisher:string;agencyId:string|null;
 revisionId:string;revisionStatus?:string;approvedRevisionId:string|null;currentRevisionId?:string|null;
 lastConfirmedAt:string|null;publishedAt:string|null;data:ListingDraft;approvedData?:ListingDraft|null;
 photos:{id:string;url:string}[];available?:boolean;
};
export type InventoryItem={id:string;status:string;version:number;agencyId:string|null;updatedAt:string};
export async function listPublic(provinceId?:string){return requestJson<{items:ListingDTO[]}>("/v1/properties"+(provinceId?"?provinceId="+encodeURIComponent(provinceId):""));}
export async function getPublic(id:string){return requestJson<ListingDTO>("/v1/properties/"+id);}
export async function getOwned(id:string,token:string){return requestJson<ListingDTO>("/v1/listings/"+id,{token});}
export async function getMyListings(token:string,agencyId?:string){
 return requestJson<{items:InventoryItem[]}>(agencyId?"/v1/agencies/"+agencyId+"/listings":"/v1/listings/mine",{token});
}
export async function uploadPhoto(listingId:string,token:string,uri:string,mime:string="image/jpeg"){
 if(!API_ROOT)throw new ApiError("API_NOT_CONFIGURED",0);
 const form=new FormData();
 form.append("file",{uri,name:"property-photo.jpg",type:mime} as unknown as Blob);
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),30000);
 try{
  const response=await fetch(API_ROOT+"/v1/listings/"+listingId+"/photos",{method:"POST",headers:{Authorization:"Bearer "+token},body:form,signal:controller.signal});
  const data=await response.json() as {id?:string;error?:string;bytes?:number};
  if(!response.ok||!data.id)throw new ApiError(data.error||"IMAGE_UPLOAD_FAILED",response.status);
  return data as {id:string;bytes:number};
 }catch(err){if(err instanceof ApiError)throw err;throw new ApiError("IMAGE_NETWORK_FAILED",0);}
 finally{clearTimeout(timer);}
}
export function photoSource(id:string,token?:string|null){
 return {uri:API_ROOT+"/v1/photos/"+id,...(token?{headers:{Authorization:"Bearer "+token}}:{})};
}
