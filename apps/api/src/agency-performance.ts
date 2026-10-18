import {and,desc,eq,gte,inArray,sql} from "drizzle-orm";
import type {FastifyInstance} from "fastify";
import {z} from "zod";
import {type Database,schema} from "@amlaklink/database";
import {HttpProblem,requireActor,requireAgencyMember} from "./access";
import {validId} from "./listings";

const DAY=86400_000;
const DAYS=[7,30,90] as const;
export function firstResponseMs(createdAt:Date,replies:{authorId:string;createdAt:Date}[],seekerId:string){
 const first=replies.filter(m=>m.authorId!==seekerId&&m.createdAt>=createdAt)
  .sort((a,b)=>a.createdAt.getTime()-b.createdAt.getTime())[0];
 return first?Math.max(0,first.createdAt.getTime()-createdAt.getTime()):null;
}
export function reportSlice(days:number,now=new Date()){
 if(!DAYS.includes(days as typeof DAYS[number]))throw new HttpProblem(422,"INVALID_REPORT_PERIOD");
 return new Date(now.getTime()-days*DAY);
}
export function registerAgencyAnalyticsRoutes(app:FastifyInstance,db:Database){
 app.get<{Params:{id:string};Querystring:{days?:string}}>("/v1/agencies/:id/performance",async request=>{
  const actor=await requireActor(db,request,"user"),agencyId=validId(request.params.id);
  await requireAgencyMember(db,actor,agencyId,["owner","manager"]);
  const query=z.object({days:z.enum(["7","30","90"]).default("30")}).strict().safeParse(request.query);
  if(!query.success)throw new HttpProblem(422,"INVALID_REPORT_PERIOD");
  const days=Number(query.data.days),from=reportSlice(days);
  const members=await db.select({userId:schema.memberships.userId,role:schema.memberships.role,
   name:schema.users.displayName,status:schema.memberships.status})
   .from(schema.memberships).innerJoin(schema.users,eq(schema.users.id,schema.memberships.userId))
   .where(and(eq(schema.memberships.agencyId,agencyId),eq(schema.memberships.status,"active")));
  const leads=await db.select({id:schema.inquiries.id,assignedTo:schema.inquiries.assignedTo,
   advertiserId:schema.inquiries.advertiserId,seekerId:schema.inquiries.seekerId,
   status:schema.inquiries.status,leadStatus:schema.inquiries.leadStatus,
   createdAt:schema.inquiries.createdAt})
   .from(schema.inquiries).where(and(eq(schema.inquiries.agencyId,agencyId),
    gte(schema.inquiries.createdAt,from)))
   .orderBy(desc(schema.inquiries.createdAt)).limit(1000);
  // The result is a capped sample, clearly reported. NEVER claim these are bank
  // settlements or completed property sales; 'won' is an unverified CRM label.
  const messages=leads.length?await db.select({inquiryId:schema.messages.inquiryId,
   authorId:schema.messages.authorId,createdAt:schema.messages.createdAt})
   .from(schema.messages).where(inArray(schema.messages.inquiryId,leads.map(l=>l.id)))
   .orderBy(schema.messages.createdAt).limit(10000):[];
  const byLead=new Map<string,{authorId:string;createdAt:Date}[]>();
  for(const m of messages){const bucket=byLead.get(m.inquiryId)||[];bucket.push(m);byLead.set(m.inquiryId,bucket);}
  const response=leads.map(l=>({...l,firstReplyMs:firstResponseMs(l.createdAt,byLead.get(l.id)||[],l.seekerId)}));
  const answered=response.filter(l=>l.firstReplyMs!==null);
  const average=answered.length?Math.round(answered.reduce((n,l)=>n+(l.firstReplyMs||0),0)/answered.length/60000):null;
  const aggregates={total:response.length,unassigned:response.filter(l=>!l.assignedTo).length,
   awaitingFirstReply:response.filter(l=>l.firstReplyMs===null).length,
   answeredWithin24h:response.filter(l=>l.firstReplyMs!==null&&l.firstReplyMs<=DAY).length,
   avgFirstResponseMinutes:average,crmWon:response.filter(l=>l.leadStatus==="won").length,
   viewings:response.filter(l=>l.leadStatus==="viewing").length,
   open:response.filter(l=>["new","open","responded"].includes(l.status)).length};
  return {days,from,through:new Date(),sampled:leads.length>=1000||messages.length>=10000,
   aggregates,agents:members.map(m=>{
    const assigned=response.filter(l=>l.assignedTo===m.userId);
    const responded=assigned.filter(l=>l.firstReplyMs!==null);
    return {userId:m.userId,displayName:m.name,role:m.role,assigned:assigned.length,
     awaitingFirstReply:assigned.length-responded.length,
     answeredWithin24h:responded.filter(l=>l.firstReplyMs!==null&&l.firstReplyMs<=DAY).length,
     avgFirstResponseMinutes:responded.length?Math.round(responded.reduce((n,l)=>n+(l.firstReplyMs||0),0)/responded.length/60000):null,
     crmWon:assigned.filter(l=>l.leadStatus==="won").length};
   }),note:"Privacy-scoped in-app lead activity only. Response time is the first non-seeker message, not an agent's phone response. CRM won is self-reported and is not a verified sale."};
 });
 app.get<{Params:{id:string};Querystring:{status?:string}}>("/v1/agencies/:id/lead-queue",async request=>{
  const actor=await requireActor(db,request,"user"),id=validId(request.params.id);
  const member=await requireAgencyMember(db,actor,id,["owner","manager","agent"]);
  const query=z.object({status:z.enum(["all","unassigned","mine"]).default("all")}).strict().safeParse(request.query);
  if(!query.success)throw new HttpProblem(422,"INVALID_LEAD_FILTER");
  if(member.role==="agent"&&query.data.status==="unassigned")throw new HttpProblem(403,"AGENCY_MANAGER_REQUIRED");
  const filters=[eq(schema.inquiries.agencyId,id)];
  if(member.role==="agent"||query.data.status==="mine")filters.push(eq(schema.inquiries.assignedTo,actor.id));
  if(query.data.status==="unassigned")filters.push(sql`${schema.inquiries.assignedTo} IS NULL`);
  const items=await db.select({id:schema.inquiries.id,listingId:schema.inquiries.listingId,
   status:schema.inquiries.status,leadStatus:schema.inquiries.leadStatus,
   assignedTo:schema.inquiries.assignedTo,createdAt:schema.inquiries.createdAt,
   lastMessageAt:schema.inquiries.lastMessageAt})
   .from(schema.inquiries).where(and(...filters))
   .orderBy(desc(schema.inquiries.lastMessageAt)).limit(100);
  return {items};
 });
}
