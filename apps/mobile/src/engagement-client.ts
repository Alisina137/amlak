import * as Crypto from "expo-crypto";
import {requestJson} from "./auth";
export type InquirySummary={id:string;listingId:string;title:string;side:"seeker"|"advertiser";status:string;leadStatus:string;
 assignedTo:string|null;agencyId:string|null;lastMessageAt:string;lastMessagePreview?:string|null};
export type ChatMessage={id:string;authorId:string;body:string;createdAt:string};
export type Viewing={id:string;inquiryId:string;seekerId:string;clientRequestId:string;proposedSlots:string[];
 counterSlot:string|null;confirmedSlot:string|null;note:string|null;status:"requested"|"counterproposed"|"confirmed"|"declined"|"cancelled"|"completed"|"no_show";version:number;createdAt:string;updatedAt:string};
export type InquiryDetail={id:string;listingId:string;title:string;propertyStatus:string;side:"seeker"|"advertiser";role:"seeker"|"agent"|"manager"|"owner";
 seekerId:string;seekerName:string;advertiserId:string;advertiserName:string;agencyId:string|null;assignedTo:string|null;
 status:string;leadStatus:string;priceSnapshot:Record<string,unknown>;priceChanged:boolean;messages:ChatMessage[];viewings:Viewing[]};
export type Alert={id:string;userId:string;kind:string;title:string;referenceId:string|null;isRead:boolean;createdAt:string};
export type LeadNote={id:string;inquiryId:string;authorId:string;body:string;createdAt:string};
export const requestId=()=>Crypto.randomUUID();
export function inbox(token:string){return requestJson<{items:InquirySummary[]}>("/v1/inquiries",{token});}
export function openInquiry(listingId:string,token:string,body:string,clientRequestId:string){return requestJson<{id:string;reused:boolean}>("/v1/properties/"+listingId+"/inquiries",{method:"POST",token,body:{body,clientRequestId}});}
export function inquiry(id:string,token:string){return requestJson<InquiryDetail>("/v1/inquiries/"+id,{token});}
export function sendMessage(id:string,token:string,body:string,clientRequestId:string){return requestJson<{id:string;reused:boolean}>("/v1/inquiries/"+id+"/messages",{method:"POST",token,body:{body,clientRequestId}});}
export function reopenInquiry(id:string,token:string){return requestJson("/v1/inquiries/"+id+"/reopen",{method:"POST",token});}
export function closeInquiry(id:string,token:string){return requestJson<{status:string}>("/v1/inquiries/"+id+"/close",{method:"POST",token});}
export function fetchViewings(token:string){return requestJson<{items:Viewing[]}>("/v1/viewings",{token});}
export function requestViewing(id:string,token:string,slots:string[],note:string,clientRequestId:string){
 return requestJson<{id:string;status:string}>("/v1/inquiries/"+id+"/viewings",{method:"POST",token,body:{proposedSlots:slots,note,clientRequestId}});
}
export function viewingDecision(id:string,token:string,expectedVersion:number,action:string,slot?:string){
 return requestJson<Viewing>("/v1/viewings/"+id+"/decision",{method:"POST",token,body:{expectedVersion,action,...(slot?{slot}:{})}});
}
export function fetchAlerts(token:string){return requestJson<{items:Alert[];unread:number}>("/v1/notifications",{token});}
export function readAlert(id:string,token:string){return requestJson("/v1/notifications/"+id+"/read",{method:"POST",token});}
export function readAllAlerts(token:string){return requestJson("/v1/notifications/read-all",{method:"POST",token});}
export function assignInquiry(id:string,token:string,assignedTo:string|null){return requestJson("/v1/inquiries/"+id+"/assign",{method:"POST",token,body:{assignedTo}});}
export function updateLeadStatus(id:string,token:string,status:string){return requestJson("/v1/inquiries/"+id+"/lead-status",{method:"POST",token,body:{status}});}
export function fetchLeadNotes(id:string,token:string){return requestJson<{items:LeadNote[]}>("/v1/inquiries/"+id+"/lead-notes",{token});}
export function addLeadNote(id:string,token:string,body:string){return requestJson("/v1/inquiries/"+id+"/lead-notes",{method:"POST",token,body:{body}});}
export function blockUser(id:string,token:string){return requestJson("/v1/users/"+id+"/block",{method:"POST",token});}
export const VIEWING_STATES=["requested","counterproposed","confirmed","declined","cancelled","completed","no_show"] as const;
export function kabulSlots():{date:Date;iso:string}[]{
 const offset=270*60000,kabulNow=new Date(Date.now()+offset),start=new Date(Date.UTC(kabulNow.getUTCFullYear(),kabulNow.getUTCMonth(),kabulNow.getUTCDate()));
 const values:{date:Date;iso:string}[]=[];
 for(let day=0;day<7;day++)for(let hour of [9,11,14,16]){
  const date=new Date(start.getTime()+day*86400_000+hour*3600_000-offset);
  if(date.getTime()>Date.now()+60*60000){values.push({date,iso:date.toISOString()});}
 }
 return values;
}
export function displayKabul(value:string|Date,locale:"fa"|"ps"|"en"){
 const date=value instanceof Date?value:new Date(value);
 if(Number.isNaN(date.getTime()))return "—";
 return new Intl.DateTimeFormat(locale==="en"?"en-US":locale==="fa"?"fa-AF":"ps-AF",{
  timeZone:"Asia/Kabul",month:"short",day:"numeric",hour:"numeric",minute:"2-digit",hourCycle:"h12"
 }).format(date);
}
