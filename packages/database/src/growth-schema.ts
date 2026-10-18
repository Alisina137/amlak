import {pgTable,uuid,varchar,integer,timestamp,jsonb,boolean,uniqueIndex,index} from "drizzle-orm/pg-core";
import {users,agencies,staff} from "./schema";
import {listings} from "./listing-schema";

/** User filters remain private and are never exposed from public search responses. */
export const savedSearches=pgTable("saved_searches",{
 id:uuid("id").primaryKey().defaultRandom(),userId:uuid("user_id").notNull().references(()=>users.id),
 title:varchar("title",{length:80}).notNull(),
 filters:jsonb("filters").$type<Record<string,string>>().notNull(),
 alertsEnabled:boolean("alerts_enabled").notNull().default(false),
 lastScannedAt:timestamp("last_scanned_at",{withTimezone:true}).notNull().defaultNow(),
 lastListingId:uuid("last_listing_id"),
 createdAt:timestamp("created_at",{withTimezone:true}).notNull().defaultNow()
},t=>[index("saved_search_owner_idx").on(t.userId,t.createdAt)]);
export const growthInvoices=pgTable("growth_invoices",{
 id:uuid("id").primaryKey().defaultRandom(),
 payerId:uuid("payer_id").notNull().references(()=>users.id),
 agencyId:uuid("agency_id").references(()=>agencies.id),
 listingId:uuid("listing_id").references(()=>listings.id),
 requestId:uuid("request_id").notNull(),
 productCode:varchar("product_code",{length:32}).notNull(),
 amountAfn:integer("amount_afn").notNull(),
 status:varchar("status",{length:16}).$type<"unpaid"|"submitted"|"confirmed"|"rejected">().notNull().default("unpaid"),
 reviewedBy:uuid("reviewed_by").references(()=>staff.id),
 reviewedAt:timestamp("reviewed_at",{withTimezone:true}),
 createdAt:timestamp("created_at",{withTimezone:true}).notNull().defaultNow()
},t=>[uniqueIndex("growth_invoice_retry_idx").on(t.payerId,t.requestId),index("growth_invoice_owner_idx").on(t.payerId,t.createdAt)]);
export const paymentClaims=pgTable("growth_payment_claims",{
 id:uuid("id").primaryKey().defaultRandom(),invoiceId:uuid("invoice_id").notNull().references(()=>growthInvoices.id),
 submittedBy:uuid("submitted_by").notNull().references(()=>users.id),
 method:varchar("method",{length:20}).notNull(),
 reference:varchar("reference",{length:120}).notNull(),
 referenceHash:varchar("reference_hash",{length:64}).notNull(),
 status:varchar("status",{length:16}).$type<"submitted"|"confirmed"|"rejected">().notNull().default("submitted"),
 reviewReason:varchar("review_reason",{length:700}),
 reviewedBy:uuid("reviewed_by").references(()=>staff.id),
 reviewedAt:timestamp("reviewed_at",{withTimezone:true}),
 createdAt:timestamp("created_at",{withTimezone:true}).notNull().defaultNow()
},t=>[uniqueIndex("growth_claim_reference_idx").on(t.referenceHash),index("growth_claim_queue_idx").on(t.status,t.createdAt)]);
export const growthEntitlements=pgTable("growth_entitlements",{
 id:uuid("id").primaryKey().defaultRandom(),invoiceId:uuid("invoice_id").notNull().references(()=>growthInvoices.id),
 agencyId:uuid("agency_id").references(()=>agencies.id),
 userId:uuid("user_id").references(()=>users.id),
 planCode:varchar("plan_code",{length:32}).notNull(),
 seatLimit:integer("seat_limit").notNull(),listingLimit:integer("listing_limit").notNull(),
 startsAt:timestamp("starts_at",{withTimezone:true}).notNull(),
 expiresAt:timestamp("expires_at",{withTimezone:true}).notNull()
},t=>[uniqueIndex("growth_entitlement_invoice_idx").on(t.invoiceId),index("growth_entitlement_agency_idx").on(t.agencyId,t.expiresAt),index("growth_entitlement_user_idx").on(t.userId,t.expiresAt)]);
export const growthPromotions=pgTable("growth_promotions",{
 id:uuid("id").primaryKey().defaultRandom(),invoiceId:uuid("invoice_id").notNull().references(()=>growthInvoices.id),
 listingId:uuid("listing_id").notNull().references(()=>listings.id),
 startsAt:timestamp("starts_at",{withTimezone:true}).notNull(),
 endsAt:timestamp("ends_at",{withTimezone:true}).notNull()
},t=>[uniqueIndex("growth_promotion_invoice_idx").on(t.invoiceId),index("growth_promotion_live_idx").on(t.startsAt,t.endsAt)]);
