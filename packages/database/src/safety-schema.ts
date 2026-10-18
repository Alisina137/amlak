import {pgTable,pgEnum,uuid,varchar,text,timestamp,integer,boolean,index,uniqueIndex} from "drizzle-orm/pg-core";
import {users,staff} from "./schema";
import {listings} from "./listing-schema";
export const reportReason=pgEnum("report_reason",["false_price","inaccurate_details","unavailable","duplicate","impersonation","inappropriate_media","suspected_fraud","other"]);
export const caseStatus=pgEnum("safety_case_status",["open","triaged","investigating","resolved","rejected","appealed","closed"]);
export const safetyReports=pgTable("safety_reports",{
 id:uuid("id").primaryKey().defaultRandom(),
 listingId:uuid("listing_id").notNull().references(()=>listings.id),
 reporterId:uuid("reporter_id").notNull().references(()=>users.id),
 requestId:uuid("request_id").notNull(),
 reason:reportReason("reason").notNull(),
 details:varchar("details",{length:2000}).notNull(),
 createdAt:timestamp("created_at",{withTimezone:true}).notNull().defaultNow(),
},t=>[uniqueIndex("safety_report_retry_idx").on(t.reporterId,t.requestId),
 index("safety_report_listing_idx").on(t.listingId,t.createdAt)]);
export const safetyCases=pgTable("safety_cases",{
 id:uuid("id").primaryKey().defaultRandom(),
 listingId:uuid("listing_id").notNull().references(()=>listings.id),
 reportId:uuid("report_id").references(()=>safetyReports.id),
 status:caseStatus("status").notNull().default("open"),
 severity:varchar("severity",{length:10}).notNull().default("normal"),
 assignedTo:uuid("assigned_to").references(()=>staff.id),
 resolution:text("resolution"),version:integer("version").notNull().default(1),
 createdAt:timestamp("created_at",{withTimezone:true}).notNull().defaultNow(),
 updatedAt:timestamp("updated_at",{withTimezone:true}).notNull().defaultNow(),
 resolvedAt:timestamp("resolved_at",{withTimezone:true}),
},t=>[uniqueIndex("safety_case_report_idx").on(t.reportId),index("safety_case_state_idx").on(t.status,t.createdAt),
 index("safety_case_listing_idx").on(t.listingId,t.createdAt)]);
export const safetyAppeals=pgTable("safety_appeals",{
 id:uuid("id").primaryKey().defaultRandom(),
 caseId:uuid("case_id").notNull().references(()=>safetyCases.id),
 appellantId:uuid("appellant_id").notNull().references(()=>users.id),
 reason:varchar("reason",{length:2000}).notNull(),
 decision:varchar("decision",{length:12}),
 reviewerId:uuid("reviewer_id").references(()=>staff.id),
 reviewReason:varchar("review_reason",{length:1000}),
 reviewedAt:timestamp("reviewed_at",{withTimezone:true}),
 createdAt:timestamp("created_at",{withTimezone:true}).notNull().defaultNow()
},t=>[uniqueIndex("safety_appeal_case_once_idx").on(t.caseId)]);
export const verificationRecords=pgTable("verification_records",{
 id:uuid("id").primaryKey().defaultRandom(),
 subjectKind:varchar("subject_kind",{length:12}).notNull(),
 subjectId:uuid("subject_id").notNull(),
 scope:varchar("scope",{length:40}).notNull(),
 method:varchar("method",{length:80}).notNull(),
 result:varchar("result",{length:20}).notNull(),
 reviewerId:uuid("reviewer_id").notNull().references(()=>staff.id),
 reviewReason:varchar("review_reason",{length:1000}).notNull(),
 expiresAt:timestamp("expires_at",{withTimezone:true}),
 reviewedAt:timestamp("reviewed_at",{withTimezone:true}).notNull().defaultNow(),
},t=>[index("verification_subject_idx").on(t.subjectKind,t.subjectId,t.reviewedAt)]);
export const duplicateCandidates=pgTable("duplicate_candidates",{
 id:uuid("id").primaryKey().defaultRandom(),
 listingId:uuid("listing_id").notNull().references(()=>listings.id),
 otherListingId:uuid("other_listing_id").notNull().references(()=>listings.id),
 status:varchar("status",{length:12}).notNull().default("pending"),
 rationale:varchar("rationale",{length:200}).notNull(),
 reviewedBy:uuid("reviewed_by").references(()=>staff.id),
 reviewReason:varchar("review_reason",{length:500}),
 reviewedAt:timestamp("reviewed_at",{withTimezone:true}),
 createdAt:timestamp("created_at",{withTimezone:true}).notNull().defaultNow()
},t=>[uniqueIndex("duplicate_pair_unique_idx").on(t.listingId,t.otherListingId),index("duplicate_status_idx").on(t.status,t.createdAt)]);
