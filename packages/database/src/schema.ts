import { pgTable, uuid, varchar, text, timestamp, integer, boolean, uniqueIndex, index, pgEnum } from "drizzle-orm/pg-core";
export const userStatus = pgEnum("user_status", ["active","suspended","deleted"]);
export const agentStatus = pgEnum("agent_status", ["none","pending","approved","rejected"]);
export const agencyStatus = pgEnum("agency_status", ["pending","active","rejected","suspended"]);
export const memberRole = pgEnum("agency_role", ["owner","manager","agent"]);
export const memberStatus = pgEnum("membership_status", ["pending","active","revoked"]);
export const staffRole = pgEnum("staff_role", ["moderator","verification","billing","support","admin","super_admin"]);
export const users=pgTable("users", {
 id:uuid("id").primaryKey().defaultRandom(),
 displayName:varchar("display_name",{length:100}).notNull(),
 email:varchar("email",{length:254}).notNull(),
 passwordHash:text("password_hash").notNull(),
 emailVerifiedAt:timestamp("email_verified_at",{withTimezone:true}),
 status:userStatus("status").notNull().default("active"),
 locale:varchar("locale",{length:2}).notNull().default("fa"),
 advertiserEnabled:boolean("advertiser_enabled").notNull().default(false),
 independentAgentStatus:agentStatus("agent_status").notNull().default("none"),
 createdAt:timestamp("created_at",{withTimezone:true}).notNull().defaultNow(),
 updatedAt:timestamp("updated_at",{withTimezone:true}).notNull().defaultNow(),
},table=>[uniqueIndex("users_email_unique").on(table.email)]);
export const challenges=pgTable("verification_challenges",{
 id:uuid("id").primaryKey().defaultRandom(), userId:uuid("user_id").references(()=>users.id),
 email:varchar("email",{length:254}).notNull(),purpose:varchar("purpose",{length:24}).notNull(),
 secretHash:text("secret_hash").notNull(),attempts:integer("attempts").notNull().default(0),
 expiresAt:timestamp("expires_at",{withTimezone:true}).notNull(),sentAt:timestamp("sent_at",{withTimezone:true}).notNull().defaultNow(),
 consumedAt:timestamp("consumed_at",{withTimezone:true}),
},t=>[index("challenge_email_idx").on(t.email,t.purpose,t.sentAt)]);
export const sessions=pgTable("sessions",{
 id:uuid("id").primaryKey().defaultRandom(),
 userId:uuid("user_id").references(()=>users.id),staffId:uuid("staff_id").references(()=>staff.id),
 audience:varchar("audience",{length:8}).notNull(),
 tokenHash:varchar("token_hash",{length:64}).notNull(),createdAt:timestamp("created_at",{withTimezone:true}).notNull().defaultNow(),
 expiresAt:timestamp("expires_at",{withTimezone:true}).notNull(),revokedAt:timestamp("revoked_at",{withTimezone:true}),
},t=>[uniqueIndex("session_token_unique").on(t.tokenHash),index("session_user_idx").on(t.userId),index("session_staff_idx").on(t.staffId)]);
export const agencies=pgTable("agencies",{
 id:uuid("id").primaryKey().defaultRandom(),name:varchar("name",{length:160}).notNull(),
 provinceId:varchar("province_id",{length:50}).notNull().default("kabul"),
 status:agencyStatus("status").notNull().default("pending"),
 creatorId:uuid("creator_id").notNull().references(()=>users.id),
 reviewedBy:uuid("reviewed_by").references(()=>staff.id),
 reviewedAt:timestamp("reviewed_at",{withTimezone:true}),
 createdAt:timestamp("created_at",{withTimezone:true}).notNull().defaultNow(),
},t=>[index("agency_creator_idx").on(t.creatorId)]);
export const memberships=pgTable("agency_memberships",{
 id:uuid("id").primaryKey().defaultRandom(),agencyId:uuid("agency_id").notNull().references(()=>agencies.id),
 userId:uuid("user_id").notNull().references(()=>users.id), role:memberRole("role").notNull(),
 status:memberStatus("status").notNull().default("pending"),
 createdAt:timestamp("created_at",{withTimezone:true}).notNull().defaultNow(),
 updatedAt:timestamp("updated_at",{withTimezone:true}).notNull().defaultNow(),
},t=>[uniqueIndex("membership_unique").on(t.agencyId,t.userId),index("membership_user_idx").on(t.userId)]);
export const staff=pgTable("staff",{
 id:uuid("id").primaryKey().defaultRandom(),email:varchar("email",{length:254}).notNull(),
 displayName:varchar("display_name",{length:100}).notNull(),
 passwordHash:text("password_hash").notNull(),role:staffRole("role").notNull(),
 totpSecretEncrypted:text("totp_secret_encrypted").notNull(),
 lastTotpStep:integer("last_totp_step").notNull().default(0),
 active:boolean("active").notNull().default(true),
 createdAt:timestamp("created_at",{withTimezone:true}).notNull().defaultNow(),
},t=>[uniqueIndex("staff_email_unique").on(t.email)]);
export const audit=pgTable("audit_events",{
 id:uuid("id").primaryKey().defaultRandom(),actorType:varchar("actor_type",{length:12}).notNull(),
 actorId:uuid("actor_id"),action:varchar("action",{length:100}).notNull(),
 targetType:varchar("target_type",{length:36}).notNull(),targetId:uuid("target_id"),
 reason:text("reason"),createdAt:timestamp("created_at",{withTimezone:true}).notNull().defaultNow(),
},t=>[index("audit_target_idx").on(t.targetType,t.targetId)]);
