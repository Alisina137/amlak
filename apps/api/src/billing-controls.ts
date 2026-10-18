import {and,desc,eq,inArray,ne,sql} from "drizzle-orm";
import type {FastifyInstance} from "fastify";
import {z} from "zod";
import {type Database,schema} from "@amlaklink/database";
import {HttpProblem,requireActor,requireStaffRole,requireVerified} from "./access";
import {validId} from "./listings";
import {referenceHash} from "./billing";

const requestAdjustment=z.object({requestId:z.uuid(),kind:z.enum(["refund","credit"]),
 amountAfn:z.number().int().positive().max(1_000_000),
 reason:z.string().trim().min(15).max(700)}).strict();
const reviewAdjustment=z.object({decision:z.enum(["approve","reject"]),
 reason:z.string().trim().min(15).max(700)}).strict();
const settleRefund=z.object({method:z.enum(["bank_transfer","cash_deposit","other"]),
 reference:z.string().trim().min(8).max(120),
 reason:z.string().trim().min(15).max(700),
 independentlyVerified:z.literal(true)}).strict();
const parse=<T>(contract:z.ZodType<T>,value:unknown):T=>{
 const parsed=contract.safeParse(value);
 if(!parsed.success)throw new HttpProblem(422,"INVALID_BILLING_ADJUSTMENT");
 return parsed.data;
};
const permissions=["billing","admin","super_admin"] as (typeof schema.staff.$inferSelect.role)[];
/** Ledger holds service credits as noncash memos; no wallet/spend capability before policy approval. */
export function registerBillingControlRoutes(app:FastifyInstance,db:Database){
 app.get<{Params:{id:string}}>("/v1/invoices/:id/claims",async request=>{
  const actor=await requireActor(db,request,"user"),id=validId(request.params.id);
  const [invoice]=await db.select({id:schema.growthInvoices.id}).from(schema.growthInvoices)
   .where(and(eq(schema.growthInvoices.id,id),eq(schema.growthInvoices.payerId,actor.id))).limit(1);
  if(!invoice)throw new HttpProblem(404,"INVOICE_NOT_FOUND");
  // Exclude receipt references and sensitive reconciliation references.
  const items=await db.select({id:schema.paymentClaims.id,status:schema.paymentClaims.status,
    method:schema.paymentClaims.method,createdAt:schema.paymentClaims.createdAt,
    reviewReason:schema.paymentClaims.reviewReason,reviewedAt:schema.paymentClaims.reviewedAt})
   .from(schema.paymentClaims).where(eq(schema.paymentClaims.invoiceId,id))
   .orderBy(desc(schema.paymentClaims.createdAt)).limit(50);
  return {items};
 });
 app.get("/v1/billing/adjustments",async request=>{
  const actor=await requireActor(db,request,"user");
  return {items:await db.select({id:schema.billingAdjustments.id,
   invoiceId:schema.billingAdjustments.invoiceId,kind:schema.billingAdjustments.kind,
   amountAfn:schema.billingAdjustments.amountAfn,reason:schema.billingAdjustments.reason,
   status:schema.billingAdjustments.status,reviewReason:schema.billingAdjustments.reviewReason,
   createdAt:schema.billingAdjustments.createdAt,reviewedAt:schema.billingAdjustments.reviewedAt,
   settledAt:schema.billingAdjustments.settledAt})
    .from(schema.billingAdjustments).where(eq(schema.billingAdjustments.payerId,actor.id))
    .orderBy(desc(schema.billingAdjustments.createdAt)).limit(100)};
 });
 app.post<{Params:{id:string}}>("/v1/invoices/:id/adjustments",
  {config:{rateLimit:{max:8,timeWindow:"15 minutes"}}},async request=>{
  const actor=await requireActor(db,request,"user");await requireVerified(db,actor);
  const id=validId(request.params.id),input=parse(requestAdjustment,request.body);
  return db.transaction(async tx=>{
   const [invoice]=await tx.select().from(schema.growthInvoices)
    .where(and(eq(schema.growthInvoices.id,id),eq(schema.growthInvoices.payerId,actor.id))).for("update");
   if(!invoice)throw new HttpProblem(404,"INVOICE_NOT_FOUND");
   const [prior]=await tx.select().from(schema.billingAdjustments)
    .where(and(eq(schema.billingAdjustments.payerId,actor.id),
     eq(schema.billingAdjustments.requestId,input.requestId))).limit(1);
   if(prior){
    if(prior.invoiceId!==id||prior.kind!==input.kind||prior.amountAfn!==input.amountAfn||
      prior.reason!==input.reason)throw new HttpProblem(409,"ADJUSTMENT_REQUEST_REUSED");
    return {id:prior.id,status:prior.status,reused:true};
   }
   if(invoice.status!=="confirmed")throw new HttpProblem(409,"INVOICE_NOT_CONFIRMED");
   const [caseCount]=await tx.select({n:sql<number>`count(*)::integer`}).from(schema.billingAdjustments)
    .where(eq(schema.billingAdjustments.invoiceId,id));
   if(Number(caseCount?.n||0)>=10)throw new HttpProblem(409,"ADJUSTMENT_CASE_LIMIT_REACHED");
   const [committed]=await tx.select({total:sql<number>`COALESCE(SUM(amount_afn),0)::integer`})
    .from(schema.billingAdjustments).where(and(eq(schema.billingAdjustments.invoiceId,id),
     ne(schema.billingAdjustments.status,"rejected")));
   if(Number(committed?.total||0)+input.amountAfn>invoice.amountAfn)
    throw new HttpProblem(409,"ADJUSTMENT_EXCEEDS_INVOICE");
   const [entry]=await tx.insert(schema.billingAdjustments).values({
    invoiceId:id,payerId:actor.id,...input
   }).returning();
   await tx.insert(schema.audit).values({actorType:"user",actorId:actor.id,
    action:"billing_adjustment_requested",targetType:"platform_invoice",
    targetId:id,reason:input.kind});
   return {id:entry.id,status:entry.status,reused:false};
  });
 });
 app.get("/v1/admin/billing/adjustments",async request=>{
  const actor=await requireActor(db,request,"staff");requireStaffRole(actor,permissions);
  const items=await db.select({adjustment:schema.billingAdjustments,invoice:schema.growthInvoices})
   .from(schema.billingAdjustments)
   .innerJoin(schema.growthInvoices,eq(schema.growthInvoices.id,schema.billingAdjustments.invoiceId))
   .where(inArray(schema.billingAdjustments.status,["requested","approved"]))
   .orderBy(desc(schema.billingAdjustments.createdAt)).limit(100);
  return {items};
 });
 app.get("/v1/admin/billing/reconciliation",async request=>{
  const actor=await requireActor(db,request,"staff");requireStaffRole(actor,permissions);
  const [verified,pending,refunds,credits]=await Promise.all([
   db.select({total:sql<number>`COALESCE(SUM(amount_afn),0)::integer`,
    count:sql<number>`count(*)::integer`}).from(schema.growthInvoices)
    .where(eq(schema.growthInvoices.status,"confirmed")),
   db.select({count:sql<number>`count(*)::integer`}).from(schema.paymentClaims)
    .where(eq(schema.paymentClaims.status,"submitted")),
   db.select({total:sql<number>`COALESCE(SUM(amount_afn),0)::integer`})
    .from(schema.billingAdjustments).where(and(
     eq(schema.billingAdjustments.kind,"refund"),eq(schema.billingAdjustments.status,"settled"))),
   db.select({total:sql<number>`COALESCE(SUM(amount_afn),0)::integer`})
    .from(schema.billingAdjustments).where(and(
     eq(schema.billingAdjustments.kind,"credit"),eq(schema.billingAdjustments.status,"issued")))
  ]);
  const fees=Number(verified[0]?.total||0),returns=Number(refunds[0]?.total||0);
  return {currency:"AFN",confirmedPlatformInvoices:Number(verified[0]?.count||0),
   verifiedPlatformFeesAfn:fees,externallySettledRefundsAfn:returns,
   noncashCreditMemosAfn:Number(credits[0]?.total||0),
   feesMinusExternallySettledRefundsAfn:fees-returns,
   pendingClaimCount:Number(pending[0]?.count||0),
   notice:"Internal AmlakLink platform-fee records only, not a bank statement, reconciliation certification, escrow or property transaction."};
 });
 app.get("/v1/admin/billing/history",async request=>{
  const actor=await requireActor(db,request,"staff");requireStaffRole(actor,permissions);
  const claims=await db.select({claim:schema.paymentClaims,invoice:schema.growthInvoices})
   .from(schema.paymentClaims).innerJoin(schema.growthInvoices,
    eq(schema.growthInvoices.id,schema.paymentClaims.invoiceId))
   .where(inArray(schema.paymentClaims.status,["confirmed","rejected"]))
   .orderBy(desc(schema.paymentClaims.reviewedAt)).limit(100);
  const adjustments=await db.select().from(schema.billingAdjustments)
   .where(inArray(schema.billingAdjustments.status,["settled","issued","rejected"]))
   .orderBy(desc(schema.billingAdjustments.createdAt)).limit(100);
  return {claims,adjustments};
 });
 app.post<{Params:{id:string}}>("/v1/admin/billing/adjustments/:id/decision",async request=>{
  const actor=await requireActor(db,request,"staff");requireStaffRole(actor,permissions);
  const id=validId(request.params.id),input=parse(reviewAdjustment,request.body);
  return db.transaction(async tx=>{
   const [entry]=await tx.select().from(schema.billingAdjustments)
    .where(eq(schema.billingAdjustments.id,id)).for("update");
   if(!entry||entry.status!=="requested")throw new HttpProblem(409,"ADJUSTMENT_NOT_PENDING");
   const [invoice]=await tx.select().from(schema.growthInvoices)
    .where(eq(schema.growthInvoices.id,entry.invoiceId)).for("update");
   if(!invoice||invoice.status!=="confirmed")throw new HttpProblem(409,"INVOICE_NOT_CONFIRMED");
   const approved=input.decision==="approve",now=new Date();
   const status=approved?(entry.kind==="credit"?"issued":"approved"):"rejected";
   await tx.update(schema.billingAdjustments).set({status,reviewedBy:actor.id,reviewedAt:now,
    reviewReason:input.reason}).where(eq(schema.billingAdjustments.id,id));
   await tx.insert(schema.audit).values({actorType:"staff",actorId:actor.id,
    action:"billing_adjustment_"+status,targetType:"platform_invoice",
    targetId:invoice.id,reason:input.reason});
   if(approved&&entry.kind==="credit"){
    // A credit memo is NOT an invoice payment or withdrawable balance yet.
    const [payer]=await tx.select({locale:schema.users.locale}).from(schema.users)
     .where(eq(schema.users.id,entry.payerId)).limit(1);
    const title=payer?.locale==="ps"?
      "ستاسو د املاک لینک خدمت غیرنغدي اعتبار یادښت تایید شو.":
     payer?.locale==="fa"?"یادداشت اعتبار غیرنقدی خدمات املاک لینک شما ثبت شد.":
      "Your AmlakLink platform noncash service credit memo was recorded.";
    await tx.insert(schema.notifications).values({userId:entry.payerId,kind:"billing",
     referenceId:invoice.id,dedupeKey:"billing:credit:"+id,title}).onConflictDoNothing();
   }
   return {id,status,amountAfn:entry.amountAfn};
  });
 });
 app.post<{Params:{id:string}}>("/v1/admin/billing/adjustments/:id/settle",async request=>{
  const actor=await requireActor(db,request,"staff");requireStaffRole(actor,permissions);
  const id=validId(request.params.id),input=parse(settleRefund,request.body);
  const hash=referenceHash("refund_settlement",input.reference);
  return db.transaction(async tx=>{
   const [entry]=await tx.select().from(schema.billingAdjustments)
    .where(eq(schema.billingAdjustments.id,id)).for("update");
   if(!entry||entry.status!=="approved"||entry.kind!=="refund")
    throw new HttpProblem(409,"REFUND_NOT_APPROVED");
   if(entry.reviewedBy===actor.id)throw new HttpProblem(403,"SECOND_REVIEWER_REQUIRED");
   // Independent reference is never echoed to the mobile client. UNIQUE protects replay.
   const [matched]=await tx.select({id:schema.billingAdjustments.id}).from(schema.billingAdjustments)
    .where(eq(schema.billingAdjustments.settlementReferenceHash,hash)).limit(1);
   if(matched)throw new HttpProblem(409,"REFUND_REFERENCE_ALREADY_USED");
   await tx.update(schema.billingAdjustments).set({status:"settled",settledBy:actor.id,
    settledAt:new Date(),settlementMethod:input.method,settlementReferenceHash:hash})
    .where(eq(schema.billingAdjustments.id,id));
   await tx.insert(schema.audit).values({actorType:"staff",actorId:actor.id,
    action:"platform_refund_external_settlement_verified",targetType:"platform_invoice",
    targetId:entry.invoiceId,reason:input.reason});
   const [payer]=await tx.select({locale:schema.users.locale}).from(schema.users)
    .where(eq(schema.users.id,entry.payerId)).limit(1);
   const title=payer?.locale==="ps"?"ستاسو د املاک لینک خدمت پیسو بیرته ورکړه په بهرني حساب کې ثبت شوه.":
    payer?.locale==="fa"?"بازپرداخت خدمات املاک لینک شما پس از تسویه بیرونی ثبت شد.":
    "Your AmlakLink platform service refund was recorded after external settlement.";
   await tx.insert(schema.notifications).values({userId:entry.payerId,kind:"billing",
    referenceId:entry.invoiceId,dedupeKey:"billing:refund:"+id,title})
    .onConflictDoNothing();
   return {id,status:"settled",amountAfn:entry.amountAfn};
  });
 });
}
