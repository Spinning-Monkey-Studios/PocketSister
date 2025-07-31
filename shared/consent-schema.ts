import { pgTable, varchar, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { sql } from "drizzle-orm";
import { users } from "./schema";

// User Consent Records
export const userConsents = pgTable("user_consents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  termsAccepted: boolean("terms_accepted").notNull().default(false),
  privacyAccepted: boolean("privacy_accepted").notNull().default(false),
  parentalConsent: boolean("parental_consent").notNull().default(false),
  communityGuidelines: boolean("community_guidelines").notNull().default(false),
  isOver18: boolean("is_over_18").notNull().default(false),
  marketingEmails: boolean("marketing_emails").notNull().default(false),
  consentDate: timestamp("consent_date").notNull().defaultNow(),
  ipAddress: varchar("ip_address"),
  userAgent: varchar("user_agent"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserConsentSchema = createInsertSchema(userConsents).omit({
  id: true,
  consentDate: true,
  updatedAt: true,
});

export type InsertUserConsent = z.infer<typeof insertUserConsentSchema>;
export type UserConsent = typeof userConsents.$inferSelect;