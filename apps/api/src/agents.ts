import {and,eq} from "drizzle-orm";
import {type FastifyInstance} from "fastify";
import {z} from "zod";
import {type Database,schema} from "@amlaklink/database";
import {HttpProblem,requireActor,requireStaffRole,requireVerified} from "./access";
const decision=z.object({decision:z.enum(["approve","reject"]),reason:z.string().trim().min(8).max(500)}).strict();
export function registerAgentRoutes(app:FastifyInstance,db:Database){
 app.post("/v1/agents/apply",async request=>{
  const actor=await requireActor(db,request,"user");
  const user=await requireVerified(db,actor);
  const payload=z.object({acceptedProfessionalRules:z.literal(true)}).strict().safeParse(request.body);
  if(!payload.success)throw new HttpProblem(422,"VALIDATION_ERROR");
  if(user.independentAgentStatus==="pending"||user.independentAgentStatus==="approved")
   throw new HttpProblem(409,"AGENT_APPLICATION_ALREADY_ACTIVE");
  await db.update(schema.users).set({independentAgentStatus:"pending",updatedAt:new Date()}).where(eq(schema.users.id,actor.id));
  await db.insert(schema.audit).values({actorType:"user",actorId:actor.id,action:"agent_application_submitted",targetType:"user",targetId:actor.id});
  return {status:"pending"};
 });
 app.get("/v1/admin/agents",async request=>{
  const actor=await requireActor(db,request,"staff");
  requireStaffRole(actor,["verification","admin","super_admin"]);
  const items=await db.select({id:schema.users.id,displayName:schema.users.displayName,
    email:schema.users.email,agentStatus:schema.users.independentAgentStatus})
    .from(schema.users).where(eq(schema.users.independentAgentStatus,"pending"));
  return {items};
 });
 app.post<{Params:{id:string}}>("/v1/admin/agents/:id/decision",async request=>{
  const actor=await requireActor(db,request,"staff");
  requireStaffRole(actor,["verification","admin","super_admin"]);
  if(!z.uuid().safeParse(request.params.id).success)throw new HttpProblem(422,"INVALID_ID");
  const input=decision.safeParse(request.body);if(!input.success)throw new HttpProblem(422,"VALIDATION_ERROR");
  const result=await db.update(schema.users).set({independentAgentStatus:input.data.decision==="approve"?"approved":"rejected",updatedAt:new Date()})
    .where(and(eq(schema.users.id,request.params.id),eq(schema.users.independentAgentStatus,"pending")))
    .returning({id:schema.users.id,agentStatus:schema.users.independentAgentStatus});
  if(!result.length)throw new HttpProblem(409,"AGENT_APPLICATION_NOT_PENDING");
  await db.insert(schema.audit).values({actorType:"staff",actorId:actor.id,action:"agent_"+input.data.decision,
     targetType:"user",targetId:request.params.id,reason:input.data.reason});
  return result[0];
 });
}
