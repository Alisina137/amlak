import {pgTable,uuid,varchar,integer,timestamp,uniqueIndex,index} from "drizzle-orm/pg-core";
import {users,staff} from "./schema";
import {growthInvoices} from "./growth-schema";

/** Only platform-service adjustments. No property rent/deposit/escrow refunds. */
export const billingAdjustments=pgTable("growth_billing_adjustments",{
 id:uuid("id").primaryKey().defaultRandom(),
 invoiceId:uuid("invoice_id").notNull().references(()=>growthInvoices.id),
 payerId:uuid("payer_id").notNull().references(()=>users.id),
 requestId:uuid("request_id").notNull(),
 kind:varchar("kind",{length:8}).$type<"refund"|"credit">().notNull(),
 amountAfn:integer("amount_afn").notNull(),
 reason:varchar("reason",{length:700}).notNull(),
 status:varchar("status",{length:16}).$type<"requested"|"approved"|"rejected"|"settled"|"issued">().notNull().default("requested"),
 reviewedBy:uuid("reviewed_by").references(()=>staff.id),
 reviewedAt:timestamp("reviewed_at",{withTimezone:true}),
 reviewReason:varchar("review_reason",{length:700}),
 settledBy:uuid("settled_by").references(()=>staff.id),
 settledAt:timestamp("settled_at",{withTimezone:true}),
 settlementMethod:varchar("settlement_method",{length:20}),
 settlementReferenceHash:varchar("settlement_reference_hash",{length:64}),
 createdAt:timestamp("created_at",{withTimezone:true}).notNull().defaultNow()
},t=>[
 uniqueIndex("billing_adjustment_retry_idx").on(t.payerId,t.requestId),
 uniqueIndex("billing_adjustment_settlement_idx").on(t.settlementReferenceHash),
 index("billing_adjustment_invoice_idx").on(t.invoiceId,t.createdAt),
 index("billing_adjustment_queue_idx").on(t.status,t.createdAt)
]);
