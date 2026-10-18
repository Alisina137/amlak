import {pgTable,uuid,varchar,timestamp,uniqueIndex,index} from "drizzle-orm/pg-core";
import {users} from "./schema";
import {listings} from "./listing-schema";

/** Shortlists are invitation-only; membership must be checked on EVERY read/write. */
export const shortlists=pgTable("shared_shortlists",{
 id:uuid("id").primaryKey().defaultRandom(),
 ownerId:uuid("owner_id").notNull().references(()=>users.id),
 title:varchar("title",{length:100}).notNull(),
 createdAt:timestamp("created_at",{withTimezone:true}).notNull().defaultNow()
},t=>[index("shortlist_owner_idx").on(t.ownerId)]);
export const shortlistMembers=pgTable("shared_shortlist_members",{
 id:uuid("id").primaryKey().defaultRandom(),
 shortlistId:uuid("shortlist_id").notNull().references(()=>shortlists.id,{onDelete:"cascade"}),
 userId:uuid("user_id").notNull().references(()=>users.id),
 status:varchar("status",{length:12}).$type<"pending"|"active"|"revoked">().notNull().default("pending"),
 createdAt:timestamp("created_at",{withTimezone:true}).notNull().defaultNow(),
 joinedAt:timestamp("joined_at",{withTimezone:true})
},t=>[
 uniqueIndex("shortlist_member_unique").on(t.shortlistId,t.userId),
 index("shortlist_member_user_idx").on(t.userId,t.status)
]);
export const shortlistItems=pgTable("shared_shortlist_items",{
 id:uuid("id").primaryKey().defaultRandom(),
 shortlistId:uuid("shortlist_id").notNull().references(()=>shortlists.id,{onDelete:"cascade"}),
 listingId:uuid("listing_id").notNull().references(()=>listings.id),
 addedBy:uuid("added_by").notNull().references(()=>users.id),
 createdAt:timestamp("created_at",{withTimezone:true}).notNull().defaultNow()
},t=>[
 uniqueIndex("shortlist_item_unique").on(t.shortlistId,t.listingId),
 index("shortlist_items_created_idx").on(t.shortlistId,t.createdAt)
]);
export const shortlistVotes=pgTable("shared_shortlist_votes",{
 id:uuid("id").primaryKey().defaultRandom(),
 itemId:uuid("item_id").notNull().references(()=>shortlistItems.id,{onDelete:"cascade"}),
 userId:uuid("user_id").notNull().references(()=>users.id),
 vote:varchar("vote",{length:12}).$type<"interested"|"pass">().notNull(),
 note:varchar("note",{length:500}).notNull().default(""),
 updatedAt:timestamp("updated_at",{withTimezone:true}).notNull().defaultNow()
},t=>[uniqueIndex("shortlist_vote_unique").on(t.itemId,t.userId)]);
