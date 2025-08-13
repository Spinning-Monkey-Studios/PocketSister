import { sql } from 'drizzle-orm';
import {
  pgTable,
  varchar,
  text,
  boolean,
  timestamp,
  integer,
  decimal,
  jsonb,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

// Admin users table for secure authentication
export const adminUsers = pgTable("admin_users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").notNull().unique(),
  passwordHash: varchar("password_hash").notNull(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  role: varchar("role").default("admin"), // admin, super_admin
  isActive: boolean("is_active").default(true),
  lastLogin: timestamp("last_login"),
  twoFactorSecret: varchar("two_factor_secret"),
  twoFactorEnabled: boolean("two_factor_enabled").default(false),
  passwordResetToken: varchar("password_reset_token"),
  passwordResetExpires: timestamp("password_reset_expires"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Admin sessions for secure session management
export const adminSessions = pgTable("admin_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  adminId: varchar("admin_id").notNull().references(() => adminUsers.id),
  sessionToken: varchar("session_token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  lastActivity: timestamp("last_activity").defaultNow(),
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
});

// Usage metrics tracking
export const usageMetrics = pgTable("usage_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  childId: varchar("child_id").notNull(),
  date: varchar("date").notNull(), // YYYY-MM-DD format
  minutesSpent: integer("minutes_spent").default(0),
  tokensUsed: integer("tokens_used").default(0),
  messagesExchanged: integer("messages_exchanged").default(0),
  avgResponseTime: decimal("avg_response_time", { precision: 8, scale: 2 }).default('0'),
  sessionCount: integer("session_count").default(0),
  aiProvider: varchar("ai_provider").default("gemini"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Real-time session tracking
export const activeUserSessions = pgTable("active_user_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  childId: varchar("child_id").notNull(),
  sessionId: varchar("session_id").notNull().unique(),
  startTime: timestamp("start_time").defaultNow(),
  lastActivity: timestamp("last_activity").defaultNow(),
  tokensThisSession: integer("tokens_this_session").default(0),
  messagesThisSession: integer("messages_this_session").default(0),
  isActive: boolean("is_active").default(true),
  deviceInfo: jsonb("device_info").default({}),
});

// GPS location requests and data
export const gpsRequests = pgTable("gps_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  childId: varchar("child_id").notNull(),
  parentId: varchar("parent_id").notNull(),
  requestType: varchar("request_type").default("location_check"), // location_check, emergency, tracking
  status: varchar("status").default("pending"), // pending, approved, denied, completed
  requestedAt: timestamp("requested_at").defaultNow(),
  respondedAt: timestamp("responded_at"),
  locationData: jsonb("location_data"), // {lat, lng, accuracy, timestamp}
  isEmergency: boolean("is_emergency").default(false),
  reason: text("reason"), // Optional reason for the request
});

// Customizable AI messages for offline/unreachable states
export const aiMessageTemplates = pgTable("ai_message_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  templateKey: varchar("template_key").notNull().unique(), // offline, unreachable, maintenance, etc
  title: varchar("title").notNull(),
  message: text("message").notNull(), // Supports handlebars: {pocketSisterName}
  isActive: boolean("is_active").default(true),
  priority: integer("priority").default(1), // For ordering
  customVariables: jsonb("custom_variables").default({}), // Additional template variables
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Admin audit log
export const adminAuditLog = pgTable("admin_audit_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  adminId: varchar("admin_id").references(() => adminUsers.id),
  action: varchar("action").notNull(),
  resource: varchar("resource"), // user, child, settings, etc
  resourceId: varchar("resource_id"),
  details: jsonb("details").default({}),
  ipAddress: varchar("ip_address"),
  timestamp: timestamp("timestamp").defaultNow(),
});

// Export types
export type AdminUser = typeof adminUsers.$inferSelect;
export type InsertAdminUser = typeof adminUsers.$inferInsert;
export type AdminSession = typeof adminSessions.$inferSelect;
export type InsertAdminSession = typeof adminSessions.$inferInsert;
export type UsageMetric = typeof usageMetrics.$inferSelect;
export type InsertUsageMetric = typeof usageMetrics.$inferInsert;
export type ActiveUserSession = typeof activeUserSessions.$inferSelect;
export type InsertActiveUserSession = typeof activeUserSessions.$inferInsert;
export type GpsRequest = typeof gpsRequests.$inferSelect;
export type InsertGpsRequest = typeof gpsRequests.$inferInsert;
export type AiMessageTemplate = typeof aiMessageTemplates.$inferSelect;
export type InsertAiMessageTemplate = typeof aiMessageTemplates.$inferInsert;
export type AdminAuditLog = typeof adminAuditLog.$inferSelect;
export type InsertAdminAuditLog = typeof adminAuditLog.$inferInsert;

// Zod schemas
export const insertAdminUserSchema = createInsertSchema(adminUsers);
export const insertUsageMetricSchema = createInsertSchema(usageMetrics);
export const insertGpsRequestSchema = createInsertSchema(gpsRequests);
export const insertAiMessageTemplateSchema = createInsertSchema(aiMessageTemplates);

// Additional schemas for admin authentication
export const adminLoginSchema = insertAdminUserSchema.pick({ 
  email: true, 
  passwordHash: true 
}).extend({
  password: insertAdminUserSchema.shape.passwordHash,
});

export const adminPasswordResetRequestSchema = insertAdminUserSchema.pick({
  email: true
});

export const adminPasswordResetSchema = insertAdminUserSchema.pick({
  passwordHash: true
}).extend({
  password: insertAdminUserSchema.shape.passwordHash,
  token: insertAdminUserSchema.shape.passwordResetToken,
});