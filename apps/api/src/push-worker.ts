import {and,asc,desc,eq,gt,gte,inArray,isNull,lt,lte,or} from "drizzle-orm";
import {type Database,schema} from "@amlaklink/database";
import {pushCategory,pushEnabled} from "./push";

type Delivery=typeof schema.pushDeliveries.$inferSelect;
type PushReceipt={status:"ok"|"error";id?:string;message?:string;details?:{error?:string}};
const EXPO_SEND="https://exp.host/--/api/v2/push/send";
const EXPO_RECEIPTS="https://exp.host/--/api/v2/push/getReceipts";
const MAX=50,RECENT_MS=3*86_400_000;
export const pushAllowed=(p:{enabled:boolean;enabledAt:Date|null;
 savedSearches:boolean;inquiries:boolean;viewings:boolean;account:boolean},
 kind:string,createdAt:Date)=>Boolean(p.enabled&&p.enabledAt&&p.enabledAt<=createdAt&&p[pushCategory(kind)]);
/** Generic lock-screen text: an offline logout cannot prevent old device tokens
 * receiving a scheduled push, so NEVER expose inquiry/transaction/customer text. */
export function expoPayload(to:string,n:{id:string;userId:string;kind:string;title:string;referenceId:string|null}){
 return {to,title:"AmlakLink",body:"You have a new update. Open AmlakLink to view it.",
  data:{notificationId:n.id,recipientId:n.userId,kind:n.kind,
   ...(n.referenceId?{referenceId:n.referenceId}:{})},
  ttl:3600,priority:"default" as const,channelId:"amlaklink-alerts"};
}
export function retryableExpoError(error:string){
 return ["MessageRateExceeded","InternalError","ServiceUnavailable","EXPO_RETRY",
  "EXPO_NETWORK_FAILURE","EXPO_MALFORMED_RESPONSE"].includes(error);
}
async function postExpo(path:string,body:unknown,fetcher:typeof fetch){
 const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),12000);
 try{
  const response=await fetcher(path,{method:"POST",
   headers:{"Content-Type":"application/json","Accept":"application/json",
    ...(process.env.EXPO_PUSH_ACCESS_TOKEN?{Authorization:"Bearer "+process.env.EXPO_PUSH_ACCESS_TOKEN}:{})},
   body:JSON.stringify(body),signal:controller.signal});
  if(!response.ok)throw Error(response.status===429||response.status>=500?"EXPO_RETRY":"EXPO_HTTP_"+response.status);
  return await response.json() as {data?:unknown;errors?:unknown[]};
 }finally{clearTimeout(timeout);}
}
async function disableDevice(db:Database,id:string){
 await db.update(schema.pushDevices).set({active:false,updatedAt:new Date()})
  .where(eq(schema.pushDevices.id,id));
}
async function updateFailure(db:Database,row:Delivery,code:string,now:Date,canRetry=true){
 const final=!canRetry||row.attempts>=3;
 await db.update(schema.pushDeliveries).set({status:final?"failed":"pending",leaseUntil:null,
   nextTryAt:new Date(now.getTime()+Math.min(30,2**row.attempts)*60_000),
   lastError:code.slice(0,120)})
  .where(and(eq(schema.pushDeliveries.id,row.id),eq(schema.pushDeliveries.status,"sending")));
}
/**
 * Processes EXISTING in-app notifications only. Dry-run makes no writes and no outbound calls.
 * Run with a private scheduled job. A crash after Expo accepts a request but before
 * the ticket is persisted can cause a duplicate on retry (at-least-once delivery).
 */
export async function scanPushDeliveries(db:Database,options:{execute:boolean;now?:Date;fetcher?:typeof fetch}){
 const now=options.now||new Date(),fetcher=options.fetcher||fetch;
 const metrics={execute:options.execute,enabled:pushEnabled(),candidateNotifications:0,eligible:0,
  claimed:0,expoAccepted:0,expoDelivered:0,expoRejected:0,retried:0,
  receiptChecked:0,deviceDisabled:0};
 if(!pushEnabled())return metrics;
 const notifications=await db.select({notice:schema.notifications,preferences:schema.pushPreferences,
  user:schema.users}).from(schema.notifications)
  .innerJoin(schema.pushPreferences,eq(schema.pushPreferences.userId,schema.notifications.userId))
  .innerJoin(schema.users,eq(schema.users.id,schema.notifications.userId))
  .where(and(eq(schema.users.status,"active"),eq(schema.pushPreferences.enabled,true),
   gte(schema.notifications.createdAt,new Date(now.getTime()-RECENT_MS)),
   eq(schema.notifications.isRead,false)))
  .orderBy(desc(schema.notifications.createdAt)).limit(1000);
 metrics.candidateNotifications=notifications.length;
 for(const {notice,preferences,user} of notifications){
  if(!user.emailVerifiedAt||!pushAllowed(preferences,notice.kind,notice.createdAt))continue;
  const devices=await db.select().from(schema.pushDevices).where(and(
   eq(schema.pushDevices.userId,user.id),eq(schema.pushDevices.active,true)));
  for(const device of devices){
   // A newly enrolled device cannot receive old notices from before its registration.
   if(device.createdAt>notice.createdAt)continue;
   metrics.eligible++;
   if(options.execute)await db.insert(schema.pushDeliveries)
    .values({notificationId:notice.id,deviceId:device.id})
    .onConflictDoNothing();
  }
 }
 if(!options.execute)return metrics;
 const claims=await db.transaction(async tx=>{
  const locked=await tx.select().from(schema.pushDeliveries)
   .where(and(or(eq(schema.pushDeliveries.status,"pending"),
    and(eq(schema.pushDeliveries.status,"sending"),lt(schema.pushDeliveries.leaseUntil,now))),
    lte(schema.pushDeliveries.nextTryAt,now),lt(schema.pushDeliveries.attempts,3)))
   .orderBy(asc(schema.pushDeliveries.nextTryAt)).limit(MAX).for("update",{skipLocked:true});
  if(!locked.length)return [];
  await tx.update(schema.pushDeliveries).set({status:"sending",
   leaseUntil:new Date(now.getTime()+120_000),nextTryAt:new Date(now.getTime()+120_000)})
   .where(inArray(schema.pushDeliveries.id,locked.map(x=>x.id)));
  // Returned attempts include the current attempt number.
  for(const row of locked)await tx.update(schema.pushDeliveries)
   .set({attempts:row.attempts+1}).where(eq(schema.pushDeliveries.id,row.id));
  return locked.map(r=>({...r,attempts:r.attempts+1}));
 });
 metrics.claimed=claims.length;
 const outgoing:{delivery:Delivery;to:string;notice:typeof schema.notifications.$inferSelect}[]=[];
 for(const delivery of claims){
  const [entry]=await db.select({notice:schema.notifications,device:schema.pushDevices,
   prefs:schema.pushPreferences,user:schema.users}).from(schema.pushDeliveries)
   .innerJoin(schema.notifications,eq(schema.notifications.id,schema.pushDeliveries.notificationId))
   .innerJoin(schema.pushDevices,eq(schema.pushDevices.id,schema.pushDeliveries.deviceId))
   .innerJoin(schema.pushPreferences,eq(schema.pushPreferences.userId,schema.notifications.userId))
   .innerJoin(schema.users,eq(schema.users.id,schema.notifications.userId))
   .where(eq(schema.pushDeliveries.id,delivery.id)).limit(1);
  if(!entry||!entry.device.active||entry.device.userId!==entry.notice.userId
    ||entry.user.status!=="active"||!entry.user.emailVerifiedAt
    ||entry.notice.isRead||entry.device.createdAt>entry.notice.createdAt
    ||!pushAllowed(entry.prefs,entry.notice.kind,entry.notice.createdAt)){
   await db.update(schema.pushDeliveries).set({status:"failed",lastError:"NOT_ELIGIBLE",leaseUntil:null})
    .where(eq(schema.pushDeliveries.id,delivery.id));continue;
  }
  outgoing.push({delivery,to:entry.device.expoToken,notice:entry.notice});
 }
 if(outgoing.length){
  try{
   const response=await postExpo(EXPO_SEND,outgoing.map(v=>expoPayload(v.to,v.notice)),fetcher);
   const tickets=Array.isArray(response.data)?response.data as PushReceipt[]:[];
   if(tickets.length!==outgoing.length)throw Error("EXPO_MALFORMED_RESPONSE");
   for(let i=0;i<outgoing.length;i++){
    const {delivery}=outgoing[i],ticket=tickets[i];
    if(ticket.status==="ok"&&typeof ticket.id==="string"&&ticket.id.length<=120){
     await db.update(schema.pushDeliveries).set({status:"sent",expoTicketId:ticket.id,
      sentAt:now,leaseUntil:null,lastError:null}).where(eq(schema.pushDeliveries.id,delivery.id));
     metrics.expoAccepted++;
    }else{
     const code=ticket.details?.error||"EXPO_TICKET_ERROR";
     await updateFailure(db,delivery,code,now,retryableExpoError(code));
     if(code==="DeviceNotRegistered"){await disableDevice(db,delivery.deviceId);metrics.deviceDisabled++;}
     metrics.expoRejected++;
    }
   }
  }catch(err){
   // Expo may have accepted this batch before network failure; retry can duplicate.
   const code=err instanceof Error?err.message:"EXPO_NETWORK_FAILURE";
   for(const {delivery} of outgoing){await updateFailure(db,delivery,code,now,
    retryableExpoError(code)||!code.startsWith("EXPO_HTTP_"));metrics.retried++;}
  }
 }
 // Receipt verification confirms submission to Google/Apple, NOT handset delivery.
 const prior=await db.select().from(schema.pushDeliveries).where(and(
  eq(schema.pushDeliveries.status,"sent"),lte(schema.pushDeliveries.sentAt,new Date(now.getTime()-15*60_000)),
  isNull(schema.pushDeliveries.receiptCheckedAt))).orderBy(asc(schema.pushDeliveries.sentAt)).limit(MAX);
 if(prior.length){
  try{
   const response=await postExpo(EXPO_RECEIPTS,{ids:prior.map(x=>x.expoTicketId)},fetcher);
   const receipts=response.data&&typeof response.data==="object"&&!Array.isArray(response.data)?
    response.data as Record<string,PushReceipt>:{};
   for(const delivery of prior){
    const receipt=delivery.expoTicketId?receipts[delivery.expoTicketId]:undefined;
    if(!receipt){
     if(delivery.sentAt && delivery.sentAt.getTime()<now.getTime()-23*3600_000)
      await db.update(schema.pushDeliveries).set({status:"failed",lastError:"EXPO_RECEIPT_UNAVAILABLE",
       receiptCheckedAt:now}).where(eq(schema.pushDeliveries.id,delivery.id));
     continue;
    }
    const error=receipt.details?.error||"EXPO_RECEIPT_ERROR";
    metrics.receiptChecked++;
    await db.update(schema.pushDeliveries).set({status:receipt.status==="ok"?"delivered":"failed",
     receiptCheckedAt:now,lastError:receipt.status==="ok"?null:error})
     .where(eq(schema.pushDeliveries.id,delivery.id));
    if(receipt.status==="ok")metrics.expoDelivered++;
    else {metrics.expoRejected++;if(error==="DeviceNotRegistered"){await disableDevice(db,delivery.deviceId);metrics.deviceDisabled++;}}
   }
  }catch{
   // Retain tickets for the next worker run; do not resend already accepted messages.
  }
 }
 return metrics;
}
