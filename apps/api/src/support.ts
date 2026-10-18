import {and,desc,eq,inArray,sql} from "drizzle-orm";
import type {FastifyInstance} from "fastify";
import {z} from "zod";
import {type Database,schema} from "@amlaklink/database";
import {HttpProblem,requireActor,requireVerified,requireStaffRole} from "./access";
import {validId} from "./listings";

const ticketInput=z.object({requestId:z.uuid(),
 category:z.enum(["account","listing","payments","safety","other"]),
 subject:z.string().trim().min(6).max(150),
 body:z.string().trim().min(10).max(2000)}).strict();
const replyInput=z.object({requestId:z.uuid(),body:z.string().trim().min(2).max(2000)}).strict();
const statusInput=z.object({status:z.enum(["resolved","closed","open"]),
 reason:z.string().trim().min(8).max(500)}).strict();
const parse=<T>(contract:z.ZodType<T>,value:unknown):T=>{
 const r=contract.safeParse(value);if(!r.success)throw new HttpProblem(422,"VALIDATION_ERROR");return r.data;
};
const supportRoles=["support","admin","super_admin"] as (typeof schema.staff.$inferSelect.role)[];
const MAX_OPEN=5;
async function getOwn(db:Database,id:string,userId:string){
 const [ticket]=await db.select().from(schema.supportTickets).where(and(
  eq(schema.supportTickets.id,validId(id)),eq(schema.supportTickets.userId,userId))).limit(1);
 if(!ticket)throw new HttpProblem(404,"TICKET_NOT_FOUND");
 return ticket;
}
async function ticketMessages(db:Database,id:string){
 return db.select({id:schema.supportMessages.id,body:schema.supportMessages.body,
  authorUserId:schema.supportMessages.authorUserId,authorStaffId:schema.supportMessages.authorStaffId,
  createdAt:schema.supportMessages.createdAt}).from(schema.supportMessages)
  .where(eq(schema.supportMessages.ticketId,id)).orderBy(desc(schema.supportMessages.createdAt)).limit(100);
}
export function registerSupportRoutes(app:FastifyInstance,db:Database){
 app.get("/v1/support/tickets",async request=>{
  const actor=await requireActor(db,request,"user");
  const items=await db.select().from(schema.supportTickets).where(eq(schema.supportTickets.userId,actor.id))
   .orderBy(desc(schema.supportTickets.updatedAt)).limit(50);
  return {items};
 });
 app.post("/v1/support/tickets",async request=>{
  const actor=await requireActor(db,request,"user");await requireVerified(db,actor);
  const input=parse(ticketInput,request.body);
  return db.transaction(async tx=>{
   await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${actor.id}::text))`);
   const [prior]=await tx.select().from(schema.supportTickets).where(and(
    eq(schema.supportTickets.userId,actor.id),eq(schema.supportTickets.requestId,input.requestId))).limit(1);
   if(prior)return {...prior,reused:true};
   const [count]=await tx.select({n:sql<number>`count(*)::integer`}).from(schema.supportTickets)
    .where(and(eq(schema.supportTickets.userId,actor.id),inArray(schema.supportTickets.status,["open","awaiting_user"])));
   if(Number(count?.n||0)>=MAX_OPEN)throw new HttpProblem(409,"TOO_MANY_OPEN_TICKETS");
   const [ticket]=await tx.insert(schema.supportTickets).values({userId:actor.id,requestId:input.requestId,
    category:input.category,subject:input.subject}).returning();
   await tx.insert(schema.supportMessages).values({ticketId:ticket.id,authorUserId:actor.id,
    requestId:input.requestId,body:input.body});
   await tx.insert(schema.audit).values({actorType:"user",actorId:actor.id,
    action:"support_ticket_created",targetType:"support_ticket",targetId:ticket.id});
   return {...ticket,reused:false};
  });
 });
 app.get<{Params:{id:string}}>("/v1/support/tickets/:id",async request=>{
  const actor=await requireActor(db,request,"user"),ticket=await getOwn(db,request.params.id,actor.id);
  return {ticket,messages:await ticketMessages(db,ticket.id)};
 });
 app.post<{Params:{id:string}}>("/v1/support/tickets/:id/replies",async request=>{
  const actor=await requireActor(db,request,"user");await requireVerified(db,actor);
  const id=validId(request.params.id),input=parse(replyInput,request.body);
  return db.transaction(async tx=>{
   const [ticket]=await tx.select().from(schema.supportTickets).where(and(
    eq(schema.supportTickets.id,id),eq(schema.supportTickets.userId,actor.id))).for("update");
   if(!ticket)throw new HttpProblem(404,"TICKET_NOT_FOUND");
   const [prior]=await tx.select().from(schema.supportMessages).where(and(
    eq(schema.supportMessages.authorUserId,actor.id),eq(schema.supportMessages.requestId,input.requestId))).limit(1);
   if(prior){
    if(prior.ticketId!==id)throw new HttpProblem(409,"REQUEST_ID_REUSED");
    return {id:prior.id,reused:true};
   }
   if(ticket.status==="closed")throw new HttpProblem(409,"TICKET_CLOSED");
   const [message]=await tx.insert(schema.supportMessages).values({ticketId:id,authorUserId:actor.id,
    body:input.body,requestId:input.requestId}).returning();
   await tx.update(schema.supportTickets).set({status:"open",updatedAt:new Date()})
    .where(eq(schema.supportTickets.id,id));
   return {id:message.id,reused:false};
  });
 });
 app.get("/v1/admin/support/tickets",async request=>{
  const actor=await requireActor(db,request,"staff");requireStaffRole(actor,supportRoles);
  return {items:await db.select({ticket:schema.supportTickets,userName:schema.users.displayName})
   .from(schema.supportTickets).innerJoin(schema.users,eq(schema.users.id,schema.supportTickets.userId))
   .where(inArray(schema.supportTickets.status,["open","awaiting_user","resolved"]))
   .orderBy(desc(schema.supportTickets.updatedAt)).limit(100)};
 });
 app.get<{Params:{id:string}}>("/v1/admin/support/tickets/:id",async request=>{
  const actor=await requireActor(db,request,"staff");requireStaffRole(actor,supportRoles);
  const id=validId(request.params.id);
  const [ticket]=await db.select().from(schema.supportTickets).where(eq(schema.supportTickets.id,id)).limit(1);
  if(!ticket)throw new HttpProblem(404,"TICKET_NOT_FOUND");
  return {ticket,messages:await ticketMessages(db,id)};
 });
 app.post<{Params:{id:string}}>("/v1/admin/support/tickets/:id/replies",async request=>{
  const actor=await requireActor(db,request,"staff");requireStaffRole(actor,supportRoles);
  const id=validId(request.params.id),input=parse(replyInput,request.body);
  return db.transaction(async tx=>{
   const [ticket]=await tx.select().from(schema.supportTickets).where(eq(schema.supportTickets.id,id)).for("update");
   if(!ticket)throw new HttpProblem(404,"TICKET_NOT_FOUND");
   const [prior]=await tx.select().from(schema.supportMessages).where(and(
    eq(schema.supportMessages.authorStaffId,actor.id),eq(schema.supportMessages.requestId,input.requestId))).limit(1);
   if(prior){
    if(prior.ticketId!==id)throw new HttpProblem(409,"REQUEST_ID_REUSED");
    return {id:prior.id,reused:true};
   }
   if(ticket.status==="closed")throw new HttpProblem(409,"TICKET_CLOSED");
   const [reply]=await tx.insert(schema.supportMessages).values({ticketId:id,authorStaffId:actor.id,
    body:input.body,requestId:input.requestId}).returning();
   await tx.update(schema.supportTickets).set({status:"awaiting_user",updatedAt:new Date()})
    .where(eq(schema.supportTickets.id,id));
   await tx.insert(schema.notifications).values({userId:ticket.userId,kind:"support",referenceId:id,
    dedupeKey:"support:reply:"+reply.id,title:"AmlakLink support replied to your request."}).onConflictDoNothing();
   return {id:reply.id,reused:false};
  });
 });
 app.post<{Params:{id:string}}>("/v1/admin/support/tickets/:id/status",async request=>{
  const actor=await requireActor(db,request,"staff");requireStaffRole(actor,supportRoles);
  const id=validId(request.params.id),input=parse(statusInput,request.body);
  return db.transaction(async tx=>{
   const [ticket]=await tx.select().from(schema.supportTickets).where(eq(schema.supportTickets.id,id)).for("update");
   if(!ticket)throw new HttpProblem(404,"TICKET_NOT_FOUND");
   if(ticket.status==="closed")throw new HttpProblem(409,"TICKET_CLOSED");
   await tx.update(schema.supportTickets).set({status:input.status,updatedAt:new Date()}).where(eq(schema.supportTickets.id,id));
   await tx.insert(schema.audit).values({actorType:"staff",actorId:actor.id,action:"support_ticket_"+input.status,
    targetType:"support_ticket",targetId:id,reason:input.reason});
   return {status:input.status};
  });
 });
}
