import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, jsonb, decimal, index, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const blogPosts = pgTable("blog_posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  content: text("content").notNull(),
  excerpt: text("excerpt").notNull(),
  category: text("category").notNull(),
  imageUrl: text("image_url").notNull(),
  readTime: integer("read_time").notNull(),
  likes: integer("likes").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const testimonials = pgTable("testimonials", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  age: integer("age").notNull(),
  content: text("content").notNull(),
  rating: integer("rating").notNull(),
  verified: integer("verified").notNull().default(1),
});

export const contactMessages = pgTable("contact_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull(),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const motivationalMessages = pgTable("motivational_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  content: text("content").notNull(),
  category: text("category").notNull(),
  author: text("author").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User accounts (Replit Auth integration)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  isAdmin: boolean("is_admin").default(false),
  subscriptionStatus: varchar("subscription_status", { length: 20 }).default("free"), // free, pro, premium
  subscriptionId: varchar("subscription_id"),
  customerId: varchar("customer_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Child profiles linked to user accounts
export const childProfiles = pgTable("child_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  name: varchar("name", { length: 100 }).notNull(),
  age: integer("age").notNull(),
  avatarId: varchar("avatar_id"),
  companionName: varchar("companion_name", { length: 100 }).default("Stella"),
  avatarImageUrl: varchar("avatar_image_url"),
  personalityProfile: jsonb("personality_profile").default({}),
  preferences: jsonb("preferences").default({}),
  tokensUsed: integer("tokens_used").default(0),
  monthlyTokenLimit: integer("monthly_token_limit").default(50000), // Basic: 50k, Premium: 200k, Family: 300k per child
  lastResetDate: timestamp("last_reset_date").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Pricing plans with tier-based feature restrictions
export const pricingPlans = pgTable("pricing_plans", {
  id: varchar("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("USD"),
  interval: varchar("interval", { length: 10 }).default("month"), // month, year
  tokenLimit: integer("token_limit").notNull().default(500), // Monthly token allowance
  overageRate: decimal("overage_rate", { precision: 10, scale: 4 }).notNull().default("0.01"), // Cost per token over limit
  features: jsonb("features").default([]),
  stripePriceId: varchar("stripe_price_id"),
  isActive: boolean("is_active").default(true),
  isTrial: boolean("is_trial").default(false), // Free trial indicator
  trialDays: integer("trial_days").default(0), // Trial period length
  // Stage 2 tier-based feature restrictions
  dailyAffirmationsLimit: integer("daily_affirmations_limit").notNull().default(1), // How many daily messages
  advancedPersonalityAI: boolean("advanced_personality_ai").default(false), // Premium AI features
  moodTrackingEnabled: boolean("mood_tracking_enabled").default(false), // Mood tracking access
  goalTrackingEnabled: boolean("goal_tracking_enabled").default(false), // Goal setting access
  reminderSystemEnabled: boolean("reminder_system_enabled").default(false), // Reminder access
  parentInsightsEnabled: boolean("parent_insights_enabled").default(false), // Parent wellness insights
  createdAt: timestamp("created_at").defaultNow(),
});

// Subscriptions
export const subscriptions = pgTable("subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  planId: varchar("plan_id").notNull().references(() => pricingPlans.id),
  stripeSubscriptionId: varchar("stripe_subscription_id").unique(),
  status: varchar("status", { length: 20 }).notNull(), // active, canceled, past_due, etc.
  currentPeriodStart: timestamp("current_period_start"),
  currentPeriodEnd: timestamp("current_period_end"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Admin announcements/broadcasts
export const announcements = pgTable("announcements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title", { length: 200 }).notNull(),
  content: text("content").notNull(),
  type: varchar("type", { length: 20 }).default("info"), // info, warning, success, error
  targetAudience: varchar("target_audience", { length: 20 }).default("all"), // all, free, pro, premium
  isActive: boolean("is_active").default(true),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at"),
});

// Chat conversations
export const conversations = pgTable("conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  childId: varchar("child_id").notNull().references(() => childProfiles.id),
  title: varchar("title", { length: 200 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Chat messages
export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").notNull().references(() => conversations.id),
  role: varchar("role", { length: 10 }).notNull(), // user, assistant
  content: text("content").notNull(),
  tokensUsed: integer("tokens_used").default(0), // Track tokens for this specific message
  fileUrl: varchar("file_url"),
  fileMimeType: varchar("file_mime_type"),
  fileName: varchar("file_name"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Token usage tracking
export const tokenUsage = pgTable("token_usage", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  childId: varchar("child_id").notNull().references(() => childProfiles.id),
  messageId: varchar("message_id").references(() => messages.id), // Optional reference to specific message
  tokensUsed: integer("tokens_used").notNull(),
  usageType: varchar("usage_type", { length: 20 }).default("chat"), // chat, image_generation, avatar_creation
  createdAt: timestamp("created_at").defaultNow(),
});

// Child personality profiles derived from AI interactions
export const childPersonalities = pgTable("child_personalities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  childId: varchar("child_id").notNull().references(() => childProfiles.id).unique(),
  interestsKeywords: text("interests_keywords").array(), // Array of interests: ["dancing", "art", "science"]
  communicationStyle: varchar("communication_style", { length: 50 }), // "playful", "serious", "shy", "outgoing"
  emotionalPreferences: varchar("emotional_preferences", { length: 50 }), // "supportive", "encouraging", "gentle"
  topicsDiscussed: text("topics_discussed").array(), // ["friendship", "school", "family"]
  preferredActivities: text("preferred_activities").array(), // ["drawing", "reading", "games"]
  personalMemories: jsonb("personal_memories"), // {pets: "has a cat named Fluffy", school: "loves math class"}
  aiPersonalityNotes: text("ai_personality_notes"), // AI's adaptation notes for this specific child
  lastInteraction: timestamp("last_interaction").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Usage alerts for token limits
export const usageAlerts = pgTable("usage_alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  childId: varchar("child_id").notNull().references(() => childProfiles.id),
  alertType: varchar("alert_type", { length: 20 }).notNull(), // warning, limit_reached
  threshold: integer("threshold").notNull(), // percentage threshold (e.g., 80 for 80%)
  isActive: boolean("is_active").default(true),
  lastTriggered: timestamp("last_triggered"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  childProfiles: many(childProfiles),
  subscriptions: many(subscriptions),
  announcements: many(announcements),
}));

export const childProfilesRelations = relations(childProfiles, ({ one, many }) => ({
  user: one(users, {
    fields: [childProfiles.userId],
    references: [users.id],
  }),
  conversations: many(conversations),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  user: one(users, {
    fields: [subscriptions.userId],
    references: [users.id],
  }),
  plan: one(pricingPlans, {
    fields: [subscriptions.planId],
    references: [pricingPlans.id],
  }),
}));

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  child: one(childProfiles, {
    fields: [conversations.childId],
    references: [childProfiles.id],
  }),
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
}));

// Export schema types
export type BlogPost = typeof blogPosts.$inferSelect;
export type InsertBlogPost = typeof blogPosts.$inferInsert;

export type Testimonial = typeof testimonials.$inferSelect;
export type InsertTestimonial = typeof testimonials.$inferInsert;

export type ContactMessage = typeof contactMessages.$inferSelect;
export type InsertContactMessage = typeof contactMessages.$inferInsert;

export type MotivationalMessage = typeof motivationalMessages.$inferSelect;
export type InsertMotivationalMessage = typeof motivationalMessages.$inferInsert;

export type User = typeof users.$inferSelect;

// User Consent Records for legal compliance
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
export type UpsertUser = typeof users.$inferInsert;
export type ChildProfile = typeof childProfiles.$inferSelect;
export type InsertChildProfile = typeof childProfiles.$inferInsert;
export type PricingPlan = typeof pricingPlans.$inferSelect;
export type InsertPricingPlan = typeof pricingPlans.$inferInsert;
export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = typeof subscriptions.$inferInsert;
export type Announcement = typeof announcements.$inferSelect;
export type InsertAnnouncement = typeof announcements.$inferInsert;

export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = typeof conversations.$inferInsert;

export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;

export type ChildPersonality = typeof childPersonalities.$inferSelect;
export type InsertChildPersonality = typeof childPersonalities.$inferInsert;

// Insert schemas for validation
export const insertBlogPostSchema = createInsertSchema(blogPosts);
export const insertTestimonialSchema = createInsertSchema(testimonials);
export const insertContactMessageSchema = createInsertSchema(contactMessages);
export const insertMotivationalMessageSchema = createInsertSchema(motivationalMessages);
export const insertChildProfileSchema = createInsertSchema(childProfiles);
export const insertAnnouncementSchema = createInsertSchema(announcements);
export const insertConversationSchema = createInsertSchema(conversations);
export const insertMessageSchema = createInsertSchema(messages);
export const insertChildPersonalitySchema = createInsertSchema(childPersonalities);

export type InsertBlogPostType = z.infer<typeof insertBlogPostSchema>;
export type InsertTestimonialType = z.infer<typeof insertTestimonialSchema>;
export type InsertContactMessageType = z.infer<typeof insertContactMessageSchema>;
export type InsertMotivationalMessageType = z.infer<typeof insertMotivationalMessageSchema>;
export type InsertChildProfileType = z.infer<typeof insertChildProfileSchema>;
export type InsertAnnouncementType = z.infer<typeof insertAnnouncementSchema>;
export type InsertConversationType = z.infer<typeof insertConversationSchema>;
export type InsertMessageType = z.infer<typeof insertMessageSchema>;

// Token usage tracking for billing and limits (replacing message usage)
export const tokenUsageHistory = pgTable("token_usage_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  childId: varchar("child_id").notNull().references(() => childProfiles.id),
  usageDate: timestamp("usage_date").defaultNow(),
  tokensUsed: integer("tokens_used").notNull(),
  month: integer("month").notNull(),
  year: integer("year").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export type UsageAlert = typeof usageAlerts.$inferSelect;
export type InsertUsageAlert = typeof usageAlerts.$inferInsert;
export type TokenUsageHistory = typeof tokenUsageHistory.$inferSelect;

// Daily affirmations and proactive messages for Stage 2
export const dailyAffirmations = pgTable("daily_affirmations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  childId: varchar("child_id").notNull().references(() => childProfiles.id, { onDelete: "cascade" }),
  message: text("message").notNull(),
  category: varchar("category", { length: 50 }).notNull(), // "motivation", "confidence", "friendship", "school"
  sentAt: timestamp("sent_at").defaultNow(),
  wasRead: boolean("was_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Mood tracking entries for Stage 2
export const moodEntries = pgTable("mood_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  childId: varchar("child_id").notNull().references(() => childProfiles.id, { onDelete: "cascade" }),
  mood: varchar("mood", { length: 20 }).notNull(), // "happy", "sad", "excited", "worried", "calm"
  moodScore: integer("mood_score").notNull(), // 1-5 scale
  notes: text("notes"), // Optional notes about why they feel this way
  entryDate: date("entry_date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Goals and achievements for Stage 2
export const childGoals = pgTable("child_goals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  childId: varchar("child_id").notNull().references(() => childProfiles.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 50 }).notNull(), // "school", "friendship", "hobby", "health"
  targetDate: date("target_date"),
  isCompleted: boolean("is_completed").default(false),
  completedAt: timestamp("completed_at"),
  progress: integer("progress").default(0), // 0-100 percentage
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Simple reminders system for Stage 2
export const childReminders = pgTable("child_reminders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  childId: varchar("child_id").notNull().references(() => childProfiles.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  reminderDate: timestamp("reminder_date").notNull(),
  isCompleted: boolean("is_completed").default(false),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// New proactive feature types
export type DailyAffirmation = typeof dailyAffirmations.$inferSelect;
export type InsertDailyAffirmation = typeof dailyAffirmations.$inferInsert;
export type MoodEntry = typeof moodEntries.$inferSelect;
export type InsertMoodEntry = typeof moodEntries.$inferInsert;
export type ChildGoal = typeof childGoals.$inferSelect;
export type InsertChildGoal = typeof childGoals.$inferInsert;
export type ChildReminder = typeof childReminders.$inferSelect;
export type InsertChildReminder = typeof childReminders.$inferInsert;

// Zod schemas for new proactive features
export const insertDailyAffirmationSchema = createInsertSchema(dailyAffirmations).omit({
  id: true,
  sentAt: true,
  createdAt: true,
});

export const insertMoodEntrySchema = createInsertSchema(moodEntries).omit({
  id: true,
  createdAt: true,
});

export const insertChildGoalSchema = createInsertSchema(childGoals).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  completedAt: true,
});

export const insertChildReminderSchema = createInsertSchema(childReminders).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});
export type InsertTokenUsageHistory = typeof tokenUsageHistory.$inferInsert;

// Device tokens for push notifications
export const deviceTokens = pgTable("device_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: varchar("token").notNull().unique(),
  platform: varchar("platform").notNull(), // "android" | "ios"
  registeredAt: timestamp("registered_at").defaultNow(),
  lastUsed: timestamp("last_used"),
  isActive: boolean("is_active").default(true),
});

// Notification history
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  childId: varchar("child_id").references(() => childProfiles.id, { onDelete: "cascade" }),
  type: varchar("type").notNull(), // "usage_alert" | "announcement" | "emergency_alert"
  title: varchar("title").notNull(),
  body: text("body").notNull(),
  data: jsonb("data"),
  sentAt: timestamp("sent_at").defaultNow(),
  readAt: timestamp("read_at"),
  priority: varchar("priority").default("normal"), // "low" | "normal" | "high"
});

// User notification preferences
export const notificationPreferences = pgTable("notification_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  usageAlerts: boolean("usage_alerts").default(true),
  systemAnnouncements: boolean("system_announcements").default(true),
  emergencyAlerts: boolean("emergency_alerts").default(true),
  quietHours: jsonb("quiet_hours"), // {start: "22:00", end: "08:00", timezone: "America/New_York"}
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type DeviceToken = typeof deviceTokens.$inferSelect;
export type InsertDeviceToken = typeof deviceTokens.$inferInsert;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;
export type NotificationPreferences = typeof notificationPreferences.$inferSelect;
export type InsertNotificationPreferences = typeof notificationPreferences.$inferInsert;
export type TokenUsage = typeof tokenUsage.$inferSelect;
export type InsertTokenUsage = typeof tokenUsage.$inferInsert;

export const insertUsageAlertSchema = createInsertSchema(usageAlerts);
export const insertTokenUsageHistorySchema = createInsertSchema(tokenUsageHistory);
export const insertTokenUsageSchema = createInsertSchema(tokenUsage);