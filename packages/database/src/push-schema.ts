import {pgTable,uuid,varchar,timestamp,boolean,integer,uniqueIndex,index} from "drizzle-orm/pg-core";
import {users} from "./schema";
import {notifications} from "./engagement-schema";

/** No push is permitted until the user explicitly enables it. */
export const pushPreferences=pgTable("push_preferences",{
 userId:uuid("user_id").primaryKey().references(()=>users.id,{onDelete:"cascade"}),
 enabled:boolean("enabled").notNull().default(false),
 savedSearches:boolean("saved_searches").notNull().default(true),
 inquiries:boolean("inquiries").notNull().default(true),
 viewings:boolean("viewings").notNull().default(true),
 account:boolean("account").notNull().default(true),
 enabledAt:timestamp("enabled_at",{withTimezone:true}),
 updatedAt:timestamp("updated_at",{withTimezone:true}).notNull().defaultNow()
});
/** Expo tokens are credentials. Never return them in listing or notification responses. */
export const pushDevices=pgTable("push_devices",{
 id:uuid("id").primaryKey().defaultRandom(),
 userId:uuid("user_id").notNull().references(()=>users.id,{onDelete:"cascade"}),
 installationId:uuid("installation_id").notNull(),
 expoToken:varchar("expo_token",{length:256}).notNull(),
 tokenHash:varchar("token_hash",{length:64}).notNull(),
 projectId:uuid("project_id").notNull(),
 platform:varchar("platform",{length:8}).$type<"android"|"ios">().notNull(),
 active:boolean("active").notNull().default(true),
 createdAt:timestamp("created_at",{withTimezone:true}).notNull().defaultNow(),
 updatedAt:timestamp("updated_at",{withTimezone:true}).notNull().defaultNow()
},t=>[
 uniqueIndex("push_device_user_installation_unique").on(t.userId,t.installationId),
 uniqueIndex("push_token_hash_unique").on(t.tokenHash),
 index("push_device_user_active_idx").on(t.userId,t.active)
]);
/** One durable delivery intent per in-app notification/device; Expo ticket and receipt tracked separately. */
export const pushDeliveries=pgTable("push_deliveries",{
 id:uuid("id").primaryKey().defaultRandom(),
 notificationId:uuid("notification_id").notNull().references(()=>notifications.id,{onDelete:"cascade"}),
 deviceId:uuid("device_id").notNull().references(()=>pushDevices.id,{onDelete:"cascade"}),
 status:varchar("status",{length:16}).$type<"pending"|"sending"|"sent"|"delivered"|"failed">().notNull().default("pending"),
 attempts:integer("attempts").notNull().default(0),
 nextTryAt:timestamp("next_try_at",{withTimezone:true}).notNull().defaultNow(),
 leaseUntil:timestamp("lease_until",{withTimezone:true}),
 expoTicketId:varchar("expo_ticket_id",{length:120}),
 lastError:varchar("last_error",{length:120}),
 sentAt:timestamp("sent_at",{withTimezone:true}),
 receiptCheckedAt:timestamp("receipt_checked_at",{withTimezone:true}),
 createdAt:timestamp("created_at",{withTimezone:true}).notNull().defaultNow()
},t=>[
 uniqueIndex("push_delivery_notification_device_unique").on(t.notificationId,t.deviceId),
 index("push_delivery_queue_idx").on(t.status,t.nextTryAt),
 index("push_delivery_receipt_idx").on(t.status,t.receiptCheckedAt)
]);
