import {createHash} from "node:crypto";
import {and,eq,sql} from "drizzle-orm";
import type {FastifyInstance} from "fastify";
import {z} from "zod";
import {type Database,schema} from "@amlaklink/database";
import {HttpProblem,requireActor,requireVerified} from "./access";
import {validId} from "./listings";

const pushToken=z.string().min(26).max(256).regex(/^(Expo|Exponent)PushToken\[[A-Za-z0-9_-]{16,180}\]$/);
const registerBody=z.object({
 installationId:z.uuid(),projectId:z.uuid(),platform:z.enum(["android","ios"]),
 expoToken:pushToken
}).strict();
const prefBody=z.object({enabled:z.boolean().optional(),savedSearches:z.boolean().optional(),
 inquiries:z.boolean().optional(),viewings:z.boolean().optional(),account:z.boolean().optional()
}).strict().refine(v=>Object.keys(v).length>0);
function parse<T>(s:z.ZodType<T>,v:unknown):T{
 const r=s.safeParse(v);if(!r.success)throw new HttpProblem(422,"VALIDATION_ERROR");return r.data;
}
export const pushEnabled=()=>process.env.AMLAK_PUSH_ENABLED==="true" &&
 !!process.env.AMLAK_EXPO_PROJECT_ID && z.uuid().safeParse(process.env.AMLAK_EXPO_PROJECT_ID).success;
export const tokenDigest=(raw:string)=>createHash("sha256").update(raw).digest("hex");
export const pushCategory=(kind:string):"savedSearches"|"inquiries"|"viewings"|"account"=>{
 if(kind==="saved_search")return "savedSearches";
 if(["inquiry","lead"].includes(kind))return "inquiries";
 if(kind==="viewing")return "viewings";
 return "account";
};
const defaultPrefs={enabled:false,savedSearches:true,inquiries:true,viewings:true,account:true,enabledAt:null};
export function registerPushRoutes(app:FastifyInstance,db:Database){
 app.get("/v1/push/preferences",async request=>{
  const actor=await requireActor(db,request,"user");
  const [preferences]=await db.select().from(schema.pushPreferences)
   .where(eq(schema.pushPreferences.userId,actor.id)).limit(1);
  const [deviceCount]=await db.select({n:sql<number>`count(*)::integer`}).from(schema.pushDevices)
   .where(and(eq(schema.pushDevices.userId,actor.id),eq(schema.pushDevices.active,true)));
  return {preferences:preferences||{...defaultPrefs,userId:actor.id},
   registeredDevices:Number(deviceCount?.n||0),serverConfigured:pushEnabled()};
 });
 app.post("/v1/push/devices",{config:{rateLimit:{max:12,timeWindow:"15 minutes"}}},async request=>{
  const actor=await requireActor(db,request,"user");await requireVerified(db,actor);
  if(!pushEnabled())throw new HttpProblem(503,"PUSH_NOT_CONFIGURED");
  const input=parse(registerBody,request.body);
  if(input.projectId.toLowerCase()!==process.env.AMLAK_EXPO_PROJECT_ID?.toLowerCase())
   throw new HttpProblem(422,"PUSH_PROJECT_MISMATCH");
  const tokenHash=tokenDigest(input.expoToken);
  return db.transaction(async tx=>{
   // Reject a device token owned by another account instead of silently transferring access.
   const [other]=await tx.select().from(schema.pushDevices)
    .where(eq(schema.pushDevices.tokenHash,tokenHash)).limit(1);
   if(other && (other.userId!==actor.id || other.installationId!==input.installationId))
    throw new HttpProblem(409,"PUSH_TOKEN_ALREADY_REGISTERED");
   const [existing]=await tx.select().from(schema.pushDevices)
    .where(and(eq(schema.pushDevices.userId,actor.id),
     eq(schema.pushDevices.installationId,input.installationId))).limit(1);
   const [count]=await tx.select({n:sql<number>`count(*)::integer`}).from(schema.pushDevices)
    .where(and(eq(schema.pushDevices.userId,actor.id),eq(schema.pushDevices.active,true)));
   if(!existing && Number(count?.n||0)>=5)throw new HttpProblem(409,"PUSH_DEVICE_LIMIT");
   if(existing){
    // Old pending sends must not be delivered to a changed Expo token.
    if(existing.tokenHash!==tokenHash)await tx.delete(schema.pushDeliveries)
     .where(eq(schema.pushDeliveries.deviceId,existing.id));
    await tx.update(schema.pushDevices).set({expoToken:input.expoToken,tokenHash,projectId:input.projectId,
      platform:input.platform,active:true,updatedAt:new Date()})
     .where(eq(schema.pushDevices.id,existing.id));
   }else await tx.insert(schema.pushDevices).values({userId:actor.id,
     installationId:input.installationId,expoToken:input.expoToken,tokenHash,
     projectId:input.projectId,platform:input.platform});
   return {registered:true};
  });
 });
 app.delete<{Params:{installationId:string}}>("/v1/push/devices/:installationId",async request=>{
  const actor=await requireActor(db,request,"user");
  const installationId=validId(request.params.installationId);
  await db.delete(schema.pushDevices).where(and(
   eq(schema.pushDevices.userId,actor.id),eq(schema.pushDevices.installationId,installationId)));
  return {unregistered:true};
 });
 app.patch("/v1/push/preferences",async request=>{
  const actor=await requireActor(db,request,"user");await requireVerified(db,actor);
  const input=parse(prefBody,request.body);
  if(input.enabled===true){
   if(!pushEnabled())throw new HttpProblem(503,"PUSH_NOT_CONFIGURED");
   const [device]=await db.select({id:schema.pushDevices.id}).from(schema.pushDevices)
    .where(and(eq(schema.pushDevices.userId,actor.id),eq(schema.pushDevices.active,true))).limit(1);
   if(!device)throw new HttpProblem(409,"PUSH_DEVICE_REQUIRED");
  }
  const [prior]=await db.select().from(schema.pushPreferences)
   .where(eq(schema.pushPreferences.userId,actor.id)).limit(1);
  const now=new Date();
  const changes={...input,updatedAt:now,
   // Only notifications created AFTER explicit user opt-in can be sent.
   ...(input.enabled===true&&!prior?.enabled?{enabledAt:now}:{})};
  const [row]=await db.insert(schema.pushPreferences).values({userId:actor.id,...changes})
   .onConflictDoUpdate({target:schema.pushPreferences.userId,set:changes}).returning();
  if(prior?.enabled!==row.enabled)
   await db.insert(schema.audit).values({actorType:"user",actorId:actor.id,
    action:row.enabled?"push_opted_in":"push_opted_out",targetType:"user",targetId:actor.id});
  return {preferences:row};
 });
}
