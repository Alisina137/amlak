import {pgEnum,pgTable,uuid,varchar,text,timestamp,integer,jsonb,uniqueIndex,index,boolean} from "drizzle-orm/pg-core";
import {users,agencies} from "./schema";
import {listings} from "./listing-schema";
export const inquiryStatus=pgEnum("inquiry_status",["new","open","responded","closed","blocked"]);
export const leadStatus=pgEnum("lead_status",["new","contacted","viewing","negotiating","won","lost","archived"]);
export const viewingStatus=pgEnum("viewing_status",["requested","counterproposed","confirmed","declined","cancelled","completed","no_show"]);
export const inquiries=pgTable("inquiries",{
 id:uuid("id").primaryKey().defaultRandom(),
 listingId:uuid("listing_id").notNull().references(()=>listings.id),
 seekerId:uuid("seeker_id").notNull().references(()=>users.id),
 agencyId:uuid("agency_id").references(()=>agencies.id),
 advertiserId:uuid("advertiser_id").notNull().references(()=>users.id),
 assignedTo:uuid("assigned_to").references(()=>users.id),
 requestId:uuid("request_id").notNull(),
 status:inquiryStatus("status").notNull().default("new"),
 leadStatus:leadStatus("lead_status").notNull().default("new"),
 priceSnapshot:jsonb("price_snapshot").$type<Record<string,unknown>>().notNull(),
 lastMessageAt:timestamp("last_message_at",{withTimezone:true}).notNull().defaultNow(),
 createdAt:timestamp("created_at",{withTimezone:true}).notNull().defaultNow(),
 updatedAt:timestamp("updated_at",{withTimezone:true}).notNull().defaultNow(),
},t=>[
 uniqueIndex("inquiry_seeker_listing_unique").on(t.seekerId,t.listingId),
 uniqueIndex("inquiry_seeker_request_unique").on(t.seekerId,t.requestId),
 index("inquiry_seeker_idx").on(t.seekerId,t.lastMessageAt),
 index("inquiry_advertiser_idx").on(t.advertiserId,t.lastMessageAt),
 index("inquiry_agency_idx").on(t.agencyId,t.lastMessageAt),
 index("inquiry_assignee_idx").on(t.assignedTo,t.lastMessageAt)
]);
export const messages=pgTable("inquiry_messages",{
 id:uuid("id").primaryKey().defaultRandom(),
 inquiryId:uuid("inquiry_id").notNull().references(()=>inquiries.id),
 authorId:uuid("author_id").notNull().references(()=>users.id),
 clientRequestId:uuid("client_request_id").notNull(),
 body:text("body").notNull(),
 createdAt:timestamp("created_at",{withTimezone:true}).notNull().defaultNow(),
},t=>[uniqueIndex("message_retry_unique").on(t.inquiryId,t.authorId,t.clientRequestId),index("message_inquiry_created_idx").on(t.inquiryId,t.createdAt)]);
export const viewings=pgTable("property_viewings",{
 id:uuid("id").primaryKey().defaultRandom(),
 inquiryId:uuid("inquiry_id").notNull().references(()=>inquiries.id),
 seekerId:uuid("seeker_id").notNull().references(()=>users.id),
 clientRequestId:uuid("client_request_id").notNull(),
 proposedSlots:jsonb("proposed_slots").$type<string[]>().notNull(),
 counterSlot:timestamp("counter_slot",{withTimezone:true}),
 confirmedSlot:timestamp("confirmed_slot",{withTimezone:true}),
 note:varchar("note",{length:500}),
 status:viewingStatus("status").notNull().default("requested"),
 version:integer("version").notNull().default(1),
 createdAt:timestamp("created_at",{withTimezone:true}).notNull().defaultNow(),
 updatedAt:timestamp("updated_at",{withTimezone:true}).notNull().defaultNow(),
},t=>[uniqueIndex("viewing_request_retry_unique").on(t.seekerId,t.clientRequestId),index("viewing_inquiry_idx").on(t.inquiryId,t.createdAt)]);
export const leadNotes=pgTable("inquiry_lead_notes",{
 id:uuid("id").primaryKey().defaultRandom(),
 inquiryId:uuid("inquiry_id").notNull().references(()=>inquiries.id),
 agencyId:uuid("agency_id").notNull().references(()=>agencies.id),
 authorId:uuid("author_id").notNull().references(()=>users.id),
 body:varchar("body",{length:1000}).notNull(),
 createdAt:timestamp("created_at",{withTimezone:true}).notNull().defaultNow(),
},t=>[index("lead_notes_inquiry_idx").on(t.inquiryId,t.createdAt)]);
export const notifications=pgTable("user_notifications",{
 id:uuid("id").primaryKey().defaultRandom(),
 userId:uuid("user_id").notNull().references(()=>users.id),
 kind:varchar("kind",{length:50}).notNull(),
 title:varchar("title",{length:160}).notNull(),
 referenceId:uuid("reference_id"),
 dedupeKey:varchar("dedupe_key",{length:150}).notNull(),
 isRead:boolean("is_read").notNull().default(false),
 createdAt:timestamp("created_at",{withTimezone:true}).notNull().defaultNow(),
},t=>[uniqueIndex("notification_recipient_dedupe_idx").on(t.userId,t.dedupeKey),index("notification_user_idx").on(t.userId,t.isRead,t.createdAt)]);
export const userBlocks=pgTable("user_blocks",{
 blockerId:uuid("blocker_id").notNull().references(()=>users.id),
 blockedId:uuid("blocked_id").notNull().references(()=>users.id),
 createdAt:timestamp("created_at",{withTimezone:true}).notNull().defaultNow(),
},t=>[uniqueIndex("block_user_pair").on(t.blockerId,t.blockedId)]);
