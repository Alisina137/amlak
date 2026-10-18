import {pgTable,pgEnum,uuid,varchar,timestamp,text,integer,jsonb,index,uniqueIndex,bigint,boolean} from "drizzle-orm/pg-core";
import {users,agencies,staff} from "./schema";
export const listingStatus=pgEnum("listing_status",["draft","pending_review","published","paused","sold","rented","rejected","archived"]);
export const publisherKind=pgEnum("publisher_kind",["private","independent_agent","agency"]);
export const revisionStatus=pgEnum("revision_status",["draft","submitted","approved","rejected","withdrawn"]);
export const listings=pgTable("listings",{
 id:uuid("id").primaryKey().defaultRandom(),
 authorId:uuid("author_id").notNull().references(()=>users.id),
 agencyId:uuid("agency_id").references(()=>agencies.id),
 publisher:publisherKind("publisher").notNull(),
 clientRequestId:uuid("client_request_id").notNull(),
 status:listingStatus("status").notNull().default("draft"),
 safetyHold:boolean("safety_hold").notNull().default(false),
 version:integer("version").notNull().default(1),
 currentRevisionId:uuid("current_revision_id"),
 approvedRevisionId:uuid("approved_revision_id"),
 lastConfirmedAt:timestamp("last_confirmed_at",{withTimezone:true}),
 createdAt:timestamp("created_at",{withTimezone:true}).notNull().defaultNow(),
 updatedAt:timestamp("updated_at",{withTimezone:true}).notNull().defaultNow(),
 publishedAt:timestamp("published_at",{withTimezone:true}),
},t=>[
 uniqueIndex("listing_create_idempotency").on(t.authorId,t.clientRequestId),
 index("listing_author_status_idx").on(t.authorId,t.status),
 index("listing_agency_status_idx").on(t.agencyId,t.status),
 index("listing_public_idx").on(t.status,t.publishedAt)
]);
export const revisions=pgTable("listing_revisions",{
 id:uuid("id").primaryKey().defaultRandom(),
 listingId:uuid("listing_id").notNull().references(()=>listings.id),
 sequence:integer("sequence").notNull(),
 status:revisionStatus("status").notNull().default("draft"),
 data:jsonb("data").$type<Record<string,unknown>>().notNull(),
 moderatorId:uuid("moderator_id").references(()=>staff.id),
 reason:text("reason"),
 createdAt:timestamp("created_at",{withTimezone:true}).notNull().defaultNow(),
 reviewedAt:timestamp("reviewed_at",{withTimezone:true}),
},t=>[uniqueIndex("revision_sequence_unique").on(t.listingId,t.sequence),index("revision_queue_idx").on(t.status,t.createdAt)]);
export const photos=pgTable("listing_photos",{
 id:uuid("id").primaryKey().defaultRandom(),
 listingId:uuid("listing_id").notNull().references(()=>listings.id),
 uploaderId:uuid("uploader_id").notNull().references(()=>users.id),
 storageKey:text("storage_key").notNull(),
 storageMode:varchar("storage_mode",{length:16}).notNull(),
 contentType:varchar("content_type",{length:50}).notNull().default("image/webp"),
 bytes:integer("bytes").notNull(),
 width:integer("width").notNull(),height:integer("height").notNull(),
 fingerprint:varchar("fingerprint",{length:64}).notNull(),
 createdAt:timestamp("created_at",{withTimezone:true}).notNull().defaultNow(),
},t=>[index("photos_listing_idx").on(t.listingId),index("photos_fingerprint_idx").on(t.fingerprint)]);
