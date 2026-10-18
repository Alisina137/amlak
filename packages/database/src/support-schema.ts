import {pgTable,uuid,varchar,timestamp,text,index} from "drizzle-orm/pg-core";
import {users,staff} from "./schema";
export const supportTickets=pgTable("support_tickets",{
 id:uuid("id").primaryKey().defaultRandom(),
 userId:uuid("user_id").notNull().references(()=>users.id),
 category:varchar("category",{length:24}).$type<"account"|"listing"|"payments"|"safety"|"other">().notNull(),
 subject:varchar("subject",{length:150}).notNull(),
 status:varchar("status",{length:16}).$type<"open"|"awaiting_user"|"resolved"|"closed">().notNull().default("open"),
 createdAt:timestamp("created_at",{withTimezone:true}).notNull().defaultNow(),
 updatedAt:timestamp("updated_at",{withTimezone:true}).notNull().defaultNow()
},t=>[index("support_user_idx").on(t.userId,t.updatedAt),index("support_queue_idx").on(t.status,t.updatedAt)]);
export const supportMessages=pgTable("support_messages",{
 id:uuid("id").primaryKey().defaultRandom(),
 ticketId:uuid("ticket_id").notNull().references(()=>supportTickets.id,{onDelete:"cascade"}),
 authorUserId:uuid("author_user_id").references(()=>users.id),
 authorStaffId:uuid("author_staff_id").references(()=>staff.id),
 body:text("body").notNull(),
 createdAt:timestamp("created_at",{withTimezone:true}).notNull().defaultNow()
},t=>[index("support_message_ticket_idx").on(t.ticketId,t.createdAt)]);
