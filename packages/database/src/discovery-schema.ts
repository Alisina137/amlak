import {pgTable,uuid,timestamp,varchar,index,uniqueIndex} from "drizzle-orm/pg-core";
import {users} from "./schema";
import {listings} from "./listing-schema";
export const favorites=pgTable("property_favorites",{
 id:uuid("id").primaryKey().defaultRandom(),
 userId:uuid("user_id").notNull().references(()=>users.id),
 listingId:uuid("listing_id").notNull().references(()=>listings.id),
 createdAt:timestamp("created_at",{withTimezone:true}).notNull().defaultNow(),
},t=>[uniqueIndex("property_favorites_user_listing_unique").on(t.userId,t.listingId),
 index("property_favorites_user_created_idx").on(t.userId,t.createdAt)]);
export const contactTaps=pgTable("property_contact_taps",{
 id:uuid("id").primaryKey().defaultRandom(),
 listingId:uuid("listing_id").notNull().references(()=>listings.id),
 channel:varchar("channel",{length:12}).notNull(),
 createdAt:timestamp("created_at",{withTimezone:true}).notNull().defaultNow(),
},t=>[index("contact_taps_listing_date_idx").on(t.listingId,t.createdAt)]);
