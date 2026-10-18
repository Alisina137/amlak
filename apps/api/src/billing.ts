import {createHash} from "node:crypto";
import {and,desc,eq,gt,lte} from "drizzle-orm";
import type {FastifyInstance} from "fastify";
import {z} from "zod";
import {type Database,schema} from "@amlaklink/database";
import {HttpProblem,requireActor,requireAgencyMember,requireStaffRole,requireVerified} from "./access";
import {canShowPublic,getListing,validId} from "./listings";
export const PRODUCTS={
 solo_agent:{kind:"subscription",amountAfn:500,listingLimit:15,seatLimit:1,days:30},
 agency_standard:{kind:"subscription",amountAfn:1500,listingLimit:50,seatLimit:5,days:30},
 agency_growth:{kind:"subscription",amountAfn:3000,listingLimit:200,seatLimit:15,days:30},
 featured_7d:{kind:"promotion",amountAfn:300,listingLimit:0,seatLimit:0,days:7}
} as const;
export type ProductCode=keyof typeof PRODUCTS;
export const billingEnabled=()=>process.env.AMLAK_BILLING_ENABLED==="true";
export function feePeriod(start:Date,days:number){return new Date(start.getTime()+days*86400_000);}
export function referenceHash(method:string,reference:string){
 return createHash("sha256").update(method+":"+reference.trim().normalize("NFKC").toUpperCase()).digest("hex");
}
const parse=<T>(contract:z.ZodType<T>,input:unknown):T=>{
 const r=contract.safeParse(input);if(!r.success)throw new HttpProblem(422,"VALIDATION_ERROR");return r.data;
};
const invoiceInput=z.object({requestId:z.uuid(),
 productCode:z.enum(["solo_agent","agency_standard","agency_growth","featured_7d"]),
 agencyId:z.uuid().optional(),listingId:z.uuid().optional()}).strict();
const paymentInput=z.object({method:z.enum(["bank_transfer","cash_deposit","other"]),
 reference:z.string().trim().min(8).max(120)}).strict();
const decisionInput=z.object({decision:z.enum(["confirm","reject"]),
 reason:z.string().trim().min(12).max(700),reconciled:z.boolean().optional()}).strict();

export async function currentAgencyLimits(db:Database,id:string){
 const now=new Date();
 const [e]=await db.select().from(schema.growthEntitlements).where(and(
  eq(schema.growthEntitlements.agencyId,id),lte(schema.growthEntitlements.startsAt,now),
  gt(schema.growthEntitlements.expiresAt,now))).orderBy(desc(schema.growthEntitlements.listingLimit),
  desc(schema.growthEntitlements.expiresAt)).limit(1);
 return {plan:e?.planCode||"free",listingLimit:e?.listingLimit||3,seatLimit:e?.seatLimit||3,
  expiresAt:e?.expiresAt||null};
}
export function registerBillingRoutes(app:FastifyInstance,db:Database){
 app.get("/v1/plans",async()=>({currency:"AFN",billingEnabled:billingEnabled(),illustrativePricing:true,
  disclaimer:"Only AmlakLink platform services. These proposed prices require local pilot validation; never property deposits or escrow.",
  products:Object.entries(PRODUCTS).map(([code,p])=>({code,...p}))}));
 app.get("/v1/invoices",async request=>{
  const actor=await requireActor(db,request,"user");
  return {items:await db.select().from(schema.growthInvoices).where(eq(schema.growthInvoices.payerId,actor.id))
   .orderBy(desc(schema.growthInvoices.createdAt)).limit(100)};
 });
 app.post("/v1/invoices",async request=>{
  const actor=await requireActor(db,request,"user");await requireVerified(db,actor);
  if(!billingEnabled())throw new HttpProblem(503,"BILLING_NOT_ENABLED");
  const input=parse(invoiceInput,request.body),product=PRODUCTS[input.productCode];
  if(input.productCode==="solo_agent"){
   if(input.agencyId||input.listingId)throw new HttpProblem(422,"INVALID_INVOICE_SCOPE");
   const [u]=await db.select().from(schema.users).where(eq(schema.users.id,actor.id)).limit(1);
   if(u?.independentAgentStatus!=="approved")throw new HttpProblem(403,"AGENT_APPROVAL_REQUIRED");
  }else if(product.kind==="subscription"){
   if(!input.agencyId||input.listingId)throw new HttpProblem(422,"AGENCY_REQUIRED");
   await requireAgencyMember(db,actor,input.agencyId,["owner"]);
  }else{
   if(!input.listingId||input.agencyId)throw new HttpProblem(422,"LISTING_REQUIRED");
   const l=await getListing(db,input.listingId);
   if(l.status!=="published"||!l.approvedRevisionId||l.safetyHold||!l.lastConfirmedAt
     ||l.lastConfirmedAt.getTime()<=Date.now()-30*86400_000||!await canShowPublic(db,l))
      throw new HttpProblem(409,"LISTING_NOT_ELIGIBLE");
   if(l.agencyId)await requireAgencyMember(db,actor,l.agencyId,["owner"]);
   else if(l.authorId!==actor.id)throw new HttpProblem(403,"LISTING_ACCESS_DENIED");
  }
  const [prior]=await db.select().from(schema.growthInvoices).where(and(
   eq(schema.growthInvoices.payerId,actor.id),eq(schema.growthInvoices.requestId,input.requestId))).limit(1);
  if(prior){
   if(prior.productCode!==input.productCode||prior.agencyId!==(input.agencyId||null)
      ||prior.listingId!==(input.listingId||null))throw new HttpProblem(409,"INVOICE_REQUEST_REUSED");
   return {...prior,reused:true};
  }
  const [row]=await db.insert(schema.growthInvoices).values({
   payerId:actor.id,requestId:input.requestId,productCode:input.productCode,amountAfn:product.amountAfn,
   agencyId:input.agencyId||null,listingId:input.listingId||null}).onConflictDoNothing().returning();
  if(!row)throw new HttpProblem(409,"INVOICE_REQUEST_RETRY");
  await db.insert(schema.audit).values({actorType:"user",actorId:actor.id,action:"invoice_created",
   targetType:"platform_invoice",targetId:row.id});
  return {...row,reused:false};
 });
 app.post<{Params:{id:string}}>("/v1/invoices/:id/claims",async request=>{
  const actor=await requireActor(db,request,"user");await requireVerified(db,actor);
  const id=validId(request.params.id),input=parse(paymentInput,request.body);
  const fingerprint=referenceHash(input.method,input.reference);
  return db.transaction(async tx=>{
   const [invoice]=await tx.select().from(schema.growthInvoices).where(eq(schema.growthInvoices.id,id)).for("update");
   if(!invoice||invoice.payerId!==actor.id)throw new HttpProblem(404,"INVOICE_NOT_FOUND");
   if(invoice.status==="confirmed")throw new HttpProblem(409,"INVOICE_ALREADY_CONFIRMED");
   const [duplicate]=await tx.select().from(schema.paymentClaims).where(eq(schema.paymentClaims.referenceHash,fingerprint)).limit(1);
   if(duplicate){
    if(duplicate.invoiceId!==id)throw new HttpProblem(409,"PAYMENT_REFERENCE_ALREADY_USED");
    return {id:duplicate.id,status:duplicate.status,reused:true};
   }
   if(invoice.status==="submitted")throw new HttpProblem(409,"PAYMENT_REVIEW_PENDING");
   const [row]=await tx.insert(schema.paymentClaims).values({invoiceId:id,
    submittedBy:actor.id,method:input.method,reference:input.reference,referenceHash:fingerprint}).returning();
   await tx.update(schema.growthInvoices).set({status:"submitted"}).where(eq(schema.growthInvoices.id,id));
   await tx.insert(schema.audit).values({actorType:"user",actorId:actor.id,action:"payment_claim_submitted",
    targetType:"platform_invoice",targetId:id});
   return {id:row.id,status:row.status,reused:false};
  });
 });
 app.get("/v1/admin/billing/claims",async request=>{
  const actor=await requireActor(db,request,"staff");requireStaffRole(actor,["billing","admin","super_admin"]);
  const items=await db.select({claim:schema.paymentClaims,invoice:schema.growthInvoices})
   .from(schema.paymentClaims).innerJoin(schema.growthInvoices,eq(schema.growthInvoices.id,schema.paymentClaims.invoiceId))
   .where(eq(schema.paymentClaims.status,"submitted")).orderBy(desc(schema.paymentClaims.createdAt)).limit(100);
  return {items};
 });
 app.post<{Params:{id:string}}>("/v1/admin/billing/claims/:id/decision",async request=>{
  const actor=await requireActor(db,request,"staff");requireStaffRole(actor,["billing","admin","super_admin"]);
  const id=validId(request.params.id),input=parse(decisionInput,request.body);
  if(input.decision==="confirm"&&input.reconciled!==true)throw new HttpProblem(422,"EXTERNAL_RECONCILIATION_REQUIRED");
  return db.transaction(async tx=>{
   const [claim]=await tx.select().from(schema.paymentClaims).where(eq(schema.paymentClaims.id,id)).for("update");
   if(!claim||claim.status!=="submitted")throw new HttpProblem(409,"CLAIM_NOT_PENDING");
   const [invoice]=await tx.select().from(schema.growthInvoices).where(eq(schema.growthInvoices.id,claim.invoiceId)).for("update");
   if(!invoice||invoice.status!=="submitted")throw new HttpProblem(409,"INVOICE_NOT_PENDING");
   const confirmed=input.decision==="confirm",now=new Date();
   if(confirmed){
    const product=PRODUCTS[invoice.productCode as ProductCode];
    if(!product||product.amountAfn!==invoice.amountAfn)throw new HttpProblem(409,"INVOICE_PRICE_CHANGED");
    if(product.kind==="promotion"){
     if(!invoice.listingId)throw new HttpProblem(409,"PROMOTION_LISTING_MISSING");
     const [l]=await tx.select().from(schema.listings).where(eq(schema.listings.id,invoice.listingId)).for("update");
     if(!l||l.status!=="published"||l.safetyHold||!l.approvedRevisionId
       ||!l.lastConfirmedAt||l.lastConfirmedAt.getTime()<=Date.now()-30*86400_000)
      throw new HttpProblem(409,"LISTING_NOT_ELIGIBLE");
     await tx.insert(schema.growthPromotions).values({invoiceId:invoice.id,listingId:l.id,
      startsAt:now,endsAt:feePeriod(now,product.days)});
    }else{
     const condition=invoice.agencyId?eq(schema.growthEntitlements.agencyId,invoice.agencyId):
       eq(schema.growthEntitlements.userId,invoice.payerId);
     const [previous]=await tx.select({expiresAt:schema.growthEntitlements.expiresAt})
      .from(schema.growthEntitlements).where(condition)
      .orderBy(desc(schema.growthEntitlements.expiresAt)).limit(1);
     const start=previous?.expiresAt&&previous.expiresAt>now?previous.expiresAt:now;
     await tx.insert(schema.growthEntitlements).values({invoiceId:invoice.id,agencyId:invoice.agencyId,
      userId:invoice.agencyId?null:invoice.payerId,planCode:invoice.productCode,
      listingLimit:product.listingLimit,seatLimit:product.seatLimit,
      startsAt:start,expiresAt:feePeriod(start,product.days)});
    }
   }
   await tx.update(schema.paymentClaims).set({status:confirmed?"confirmed":"rejected",
    reviewReason:input.reason,reviewedBy:actor.id,reviewedAt:now}).where(eq(schema.paymentClaims.id,id));
   await tx.update(schema.growthInvoices).set({status:confirmed?"confirmed":"rejected",
    reviewedBy:actor.id,reviewedAt:now}).where(eq(schema.growthInvoices.id,invoice.id));
   await tx.insert(schema.audit).values({actorType:"staff",actorId:actor.id,
    action:confirmed?"platform_fee_confirmed":"platform_fee_rejected",targetType:"platform_invoice",
    targetId:invoice.id,reason:input.reason});
   return {id:claim.id,invoiceId:invoice.id,status:confirmed?"confirmed":"rejected"};
  });
 });
 app.get<{Querystring:{agencyId?:string}}>("/v1/entitlements",async request=>{
  const actor=await requireActor(db,request,"user");await requireVerified(db,actor);
  const agencyId=request.query?.agencyId;
  if(agencyId){
   await requireAgencyMember(db,actor,validId(agencyId),["owner","manager","agent"]);
   return currentAgencyLimits(db,agencyId);
  }
  const now=new Date();
  const [grant]=await db.select().from(schema.growthEntitlements).where(and(eq(schema.growthEntitlements.userId,actor.id),
   lte(schema.growthEntitlements.startsAt,now),gt(schema.growthEntitlements.expiresAt,now)))
   .orderBy(desc(schema.growthEntitlements.expiresAt)).limit(1);
  return {plan:grant?.planCode||"free",listingLimit:grant?.listingLimit||3,
   seatLimit:1,expiresAt:grant?.expiresAt||null};
 });
}
