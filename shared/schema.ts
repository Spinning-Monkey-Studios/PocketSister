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
  adminEmail: varchar("admin_email"), // Admin email for notifications and testing
  subscriptionStatus: varchar("subscription_status", { length: 20 }).default("free"), // free, basic, premium, family
  subscriptionTier: varchar("subscription_tier", { length: 20 }).default("free"), // free, basic, premium, family
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  freeTrialStarted: timestamp("free_trial_started").defaultNow(),
  freeTrialTokensUsed: integer("free_trial_tokens_used").default(0),
  freeTrialEnded: boolean("free_trial_ended").default(false),
  tokenUsageThisMonth: integer("token_usage_this_month").default(0),
  lastTokenReset: timestamp("last_token_reset").defaultNow(),
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
  includesSafetyMonitoring: boolean("includes_safety_monitoring").default(false), // Family tier includes it
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

// Stage 3: Advanced AI Personalization - Conversation Memory System
export const conversationMemory = pgTable("conversation_memory", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  childId: varchar("child_id").notNull(),
  memoryType: varchar("memory_type").notNull(), // 'fact', 'preference', 'emotion', 'achievement', 'concern'
  content: text("content").notNull(),
  importance: integer("importance").default(5), // 1-10 scale
  emotionalContext: jsonb("emotional_context").default('{}'),
  relatedTopics: text("related_topics").array().default(sql`ARRAY[]::text[]`),
  lastReferenced: timestamp("last_referenced"),
  createdAt: timestamp("created_at").defaultNow(),
  isActive: boolean("is_active").default(true)
});

// Stage 3: AI Learning and Adaptation Tracking
export const aiLearningData = pgTable("ai_learning_data", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  childId: varchar("child_id").notNull(),
  interactionType: varchar("interaction_type").notNull(), // 'chat', 'mood', 'goal', 'affirmation'
  userInput: text("user_input"),
  aiResponse: text("ai_response"),
  userReaction: varchar("user_reaction"), // 'positive', 'negative', 'neutral', 'ignored'
  emotionalTone: varchar("emotional_tone"), // detected from input
  personalityAdaptation: jsonb("personality_adaptation").default('{}'),
  learningScore: decimal("learning_score", { precision: 3, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow()
});

// Stage 3: Emotional Intelligence Tracking
export const emotionalProfiles = pgTable("emotional_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  childId: varchar("child_id").notNull(),
  currentMoodPattern: jsonb("current_mood_pattern").default('{}'),
  emotionalTriggers: jsonb("emotional_triggers").default('{}'),
  copingStrategies: jsonb("coping_strategies").default('{}'),
  communicationStyle: jsonb("communication_style").default('{}'),
  growthAreas: text("growth_areas").array().default(sql`ARRAY[]::text[]`),
  strengths: text("strengths").array().default(sql`ARRAY[]::text[]`),
  lastAnalysis: timestamp("last_analysis").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Stage 3: Enhanced Conversation History with Advanced Context
export const enhancedConversationHistory = pgTable("enhanced_conversation_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  childId: varchar("child_id").notNull(),
  sessionId: varchar("session_id").notNull(),
  messageOrder: integer("message_order").notNull(),
  role: varchar("role").notNull(), // 'user', 'assistant'
  content: text("content").notNull(),
  emotionalContext: jsonb("emotional_context").default('{}'),
  personalityUsed: varchar("personality_used"), // which avatar personality was used
  memoryReferences: text("memory_references").array().default(sql`ARRAY[]::text[]`),
  adaptationApplied: jsonb("adaptation_applied").default('{}'),
  createdAt: timestamp("created_at").defaultNow()
});

export type ConversationMemory = typeof conversationMemory.$inferSelect;
export type InsertConversationMemory = typeof conversationMemory.$inferInsert;
export type AiLearningData = typeof aiLearningData.$inferSelect;
export type InsertAiLearningData = typeof aiLearningData.$inferInsert; 
export type EmotionalProfile = typeof emotionalProfiles.$inferSelect;
export type InsertEmotionalProfile = typeof emotionalProfiles.$inferInsert;
export type EnhancedConversationHistory = typeof enhancedConversationHistory.$inferSelect;
export type InsertEnhancedConversationHistory = typeof enhancedConversationHistory.$inferInsert;

// Stage 5: Conversation Management System - Saved conversations with intelligent naming
export const savedConversations = pgTable("saved_conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  childId: varchar("child_id").notNull(),
  title: text("title").notNull(), // AI-generated title
  description: text("description"), // Brief AI-generated description
  groupId: varchar("group_id"), // Optional group assignment
  lastMessageAt: timestamp("last_message_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  isActive: boolean("is_active").default(true).notNull(), // For soft delete
  messageCount: integer("message_count").default(0).notNull(),
  isTabOpen: boolean("is_tab_open").default(false).notNull(), // Track if conversation is open in a tab
  contextSnapshot: text("context_snapshot"), // JSON snapshot of context when saved
});

// Conversation groups for organization
export const conversationGroups = pgTable("conversation_groups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  childId: varchar("child_id").notNull(),
  name: text("name").notNull(),
  color: text("color").default("#3B82F6").notNull(), // Hex color code
  icon: text("icon").default("💬").notNull(), // Emoji icon
  position: integer("position").default(0).notNull(), // For ordering
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Messages within saved conversations
export const conversationMessages = pgTable("conversation_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").notNull(),
  childId: varchar("child_id").notNull(),
  role: text("role").notNull(), // 'user' or 'assistant'
  content: text("content").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  contextSnapshot: text("context_snapshot"), // JSON snapshot of context at time of message
});

export type SavedConversation = typeof savedConversations.$inferSelect;
export type InsertSavedConversation = typeof savedConversations.$inferInsert;
export type ConversationGroup = typeof conversationGroups.$inferSelect;

// Safety monitoring for concerning behavior - preserves child privacy
export const safetyAlerts = pgTable("safety_alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  childId: varchar("child_id").notNull().references(() => childProfiles.id),
  userId: varchar("user_id").notNull().references(() => users.id), // Parent to notify
  alertType: varchar("alert_type").notNull(), // 'safety_concern', 'inappropriate_content', 'bullying_detected', 'self_harm_concern'
  severity: varchar("severity").notNull(), // 'low', 'medium', 'high', 'critical'
  triggerKeywords: text("trigger_keywords").array().default(sql`ARRAY[]::text[]`), // What triggered the alert
  contextSummary: text("context_summary"), // Non-identifying summary for parent
  messageId: varchar("message_id").references(() => conversationMessages.id), // Reference for admin review
  isResolved: boolean("is_resolved").default(false),
  parentNotified: boolean("parent_notified").default(false),
  adminReviewed: boolean("admin_reviewed").default(false),
  reviewNotes: text("review_notes"),
  createdAt: timestamp("created_at").defaultNow(),
  resolvedAt: timestamp("resolved_at"),
});

// Parent-controlled settings for child profiles
export const parentControls = pgTable("parent_controls", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  childId: varchar("child_id").notNull().references(() => childProfiles.id),
  parentId: varchar("parent_id").notNull().references(() => users.id),
  ageOverride: integer("age_override"), // Parent can set/update child's age
  personalitySettings: jsonb("personality_settings").default({}), // Parent-controlled personality traits
  safetyLevel: varchar("safety_level").default("standard"), // 'strict', 'standard', 'relaxed'
  allowedTopics: text("allowed_topics").array().default(sql`ARRAY[]::text[]`),
  blockedTopics: text("blocked_topics").array().default(sql`ARRAY[]::text[]`),
  chatTimeRestrictions: jsonb("chat_time_restrictions").default({}), // Time limits
  requireApprovalFor: text("require_approval_for").array().default(sql`ARRAY[]::text[]`), // Features requiring approval
  privacySettings: jsonb("privacy_settings").default({}),
  emergencyContactsOnly: boolean("emergency_contacts_only").default(false),
  alertThresholds: jsonb("alert_thresholds").default({
    critical: true,
    high: true, 
    medium: false,
    low: false,
    confidenceMinimum: 0.7
  }), // Configurable alert sensitivity
  safetyMonitoringEnabled: boolean("safety_monitoring_enabled").default(false), // Requires subscription add-on
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Safety Monitoring Add-on (for Basic/Premium tiers)
export const safetyMonitoringAddons = pgTable("safety_monitoring_addons", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  childId: varchar("child_id").notNull().references(() => childProfiles.id),
  isActive: boolean("is_active").default(true),
  price: decimal("price", { precision: 10, scale: 2 }).default("9.99"), // Monthly add-on price
  purchaseDate: timestamp("purchase_date").defaultNow(),
  expiresAt: timestamp("expires_at"), // For monthly billing
  stripeSubscriptionId: varchar("stripe_subscription_id"), // Track Stripe subscription
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Content monitoring with privacy protection
export const contentReviews = pgTable("content_reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  childId: varchar("child_id").notNull().references(() => childProfiles.id),
  messageId: varchar("message_id").references(() => conversationMessages.id),
  contentType: varchar("content_type").notNull(), // 'message', 'image', 'voice'
  riskLevel: varchar("risk_level").notNull(), // 'safe', 'monitor', 'concern', 'alert'
  flaggedReasons: text("flagged_reasons").array().default(sql`ARRAY[]::text[]`),
  aiConfidence: decimal("ai_confidence", { precision: 3, scale: 2 }), // 0.00-1.00
  requiresHumanReview: boolean("requires_human_review").default(false),
  humanReviewed: boolean("human_reviewed").default(false),
  reviewerNotes: text("reviewer_notes"),
  actionTaken: varchar("action_taken"), // 'none', 'parent_notified', 'content_blocked', 'session_ended'
  createdAt: timestamp("created_at").defaultNow(),
  reviewedAt: timestamp("reviewed_at"),
});

export type SafetyAlert = typeof safetyAlerts.$inferSelect;
export type InsertSafetyAlert = typeof safetyAlerts.$inferInsert;
export type ParentControl = typeof parentControls.$inferSelect;
export type InsertParentControl = typeof parentControls.$inferInsert;
export type ContentReview = typeof contentReviews.$inferSelect;
export type InsertContentReview = typeof contentReviews.$inferInsert;
export type InsertConversationGroup = typeof conversationGroups.$inferInsert;
export type ConversationMessage = typeof conversationMessages.$inferSelect;
export type InsertConversationMessage = typeof conversationMessages.$inferInsert;
export type SafetyMonitoringAddon = typeof safetyMonitoringAddons.$inferSelect;
export type InsertSafetyMonitoringAddon = typeof safetyMonitoringAddons.$inferInsert;

// Parent-to-child messaging system
export const parentMessages = pgTable("parent_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  parentId: varchar("parent_id").notNull().references(() => users.id),
  childId: varchar("child_id").notNull().references(() => childProfiles.id),
  message: text("message").notNull(),
  messageType: varchar("message_type").default("general"), // general, encouragement, reminder, achievement
  scheduledFor: timestamp("scheduled_for"), // For scheduled messages
  sentAt: timestamp("sent_at"),
  deliveredAt: timestamp("delivered_at"),
  readAt: timestamp("read_at"),
  isRead: boolean("is_read").default(false),
  isDelivered: boolean("is_delivered").default(false),
  priority: varchar("priority").default("normal"), // low, normal, high, urgent
  createdAt: timestamp("created_at").defaultNow(),
});

// Child app activation and device management
export const childDevices = pgTable("child_devices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  childId: varchar("child_id").notNull().references(() => childProfiles.id),
  deviceId: varchar("device_id").notNull().unique(), // Unique device identifier
  deviceName: varchar("device_name"), // User-friendly device name
  platform: varchar("platform").notNull(), // android, ios
  appVersion: varchar("app_version"),
  isActivated: boolean("is_activated").default(false),
  activatedAt: timestamp("activated_at"),
  activatedBy: varchar("activated_by").references(() => users.id), // Parent who activated
  lastSeenAt: timestamp("last_seen_at").defaultNow(),
  pushToken: varchar("push_token"), // For push notifications
  createdAt: timestamp("created_at").defaultNow(),
});

// GPS location tracking (privacy-compliant)
export const childLocations = pgTable("child_locations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  childId: varchar("child_id").notNull().references(() => childProfiles.id),
  deviceId: varchar("device_id").notNull().references(() => childDevices.id),
  latitude: decimal("latitude", { precision: 10, scale: 8 }).notNull(),
  longitude: decimal("longitude", { precision: 11, scale: 8 }).notNull(),
  accuracy: decimal("accuracy", { precision: 8, scale: 2 }), // in meters
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  isEmergency: boolean("is_emergency").default(false), // Emergency location request
  batteryLevel: integer("battery_level"), // Device battery percentage
  createdAt: timestamp("created_at").defaultNow(),
});

// Location settings and permissions
export const locationSettings = pgTable("location_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  childId: varchar("child_id").notNull().references(() => childProfiles.id).unique(),
  parentId: varchar("parent_id").notNull().references(() => users.id),
  isLocationEnabled: boolean("is_location_enabled").default(false),
  trackingInterval: integer("tracking_interval").default(30), // minutes
  shareLocationWithParent: boolean("share_location_with_parent").default(false),
  onlyEmergencyTracking: boolean("only_emergency_tracking").default(true),
  allowedTimeStart: varchar("allowed_time_start").default("06:00"), // 24h format
  allowedTimeEnd: varchar("allowed_time_end").default("22:00"),
  geofenceEnabled: boolean("geofence_enabled").default(false),
  geofenceRadius: integer("geofence_radius").default(500), // meters
  geofenceLatitude: decimal("geofence_latitude", { precision: 10, scale: 8 }),
  geofenceLongitude: decimal("geofence_longitude", { precision: 11, scale: 8 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// App activation requests (for parent approval)
export const activationRequests = pgTable("activation_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  childId: varchar("child_id").notNull().references(() => childProfiles.id),
  deviceId: varchar("device_id").notNull(),
  deviceInfo: jsonb("device_info"), // Device details for parent review
  requestedAt: timestamp("requested_at").defaultNow(),
  approvedAt: timestamp("approved_at"),
  rejectedAt: timestamp("rejected_at"),
  approvedBy: varchar("approved_by").references(() => users.id),
  status: varchar("status").default("pending"), // pending, approved, rejected
  parentNotified: boolean("parent_notified").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export type ParentMessage = typeof parentMessages.$inferSelect;
export type InsertParentMessage = typeof parentMessages.$inferInsert;
export type ChildDevice = typeof childDevices.$inferSelect;
export type InsertChildDevice = typeof childDevices.$inferInsert;
export type ChildLocation = typeof childLocations.$inferSelect;
export type InsertChildLocation = typeof childLocations.$inferInsert;
export type LocationSetting = typeof locationSettings.$inferSelect;
export type InsertLocationSetting = typeof locationSettings.$inferInsert;
export type ActivationRequest = typeof activationRequests.$inferSelect;
export type InsertActivationRequest = typeof activationRequests.$inferInsert;

export const insertSavedConversationSchema = createInsertSchema(savedConversations);
export const insertConversationGroupSchema = createInsertSchema(conversationGroups);
export const insertConversationMessageSchema = createInsertSchema(conversationMessages);

// Stage 4: Advanced Context Management for Remote AI Integration
export const contextSessions = pgTable("context_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull().unique(),
  childId: varchar("child_id").notNull(),
  aiProvider: varchar("ai_provider").notNull().default("gemini"), // "gemini", "openai", etc.
  systemIdentity: jsonb("system_identity").default('{}'), // unique system signature
  startTime: timestamp("start_time").defaultNow(),
  lastActivity: timestamp("last_activity").defaultNow(),
  contextLength: integer("context_length").default(0),
  performanceMetrics: jsonb("performance_metrics").default('{}'),
  status: varchar("status").default("active"), // "active", "inactive", "expired"
  createdAt: timestamp("created_at").defaultNow(),
});

export const contextRetrievalLogs = pgTable("context_retrieval_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull(),
  retrievalType: varchar("retrieval_type").notNull(), // "memory", "interests", "personality", "history"
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  responseTime: integer("response_time"), // milliseconds
  dataSize: integer("data_size"), // bytes
  success: boolean("success").default(false),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const aiInstanceManagement = pgTable("ai_instance_management", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  instanceId: varchar("instance_id").notNull().unique(),
  sessionId: varchar("session_id").notNull(),
  instanceType: varchar("instance_type").notNull(), // "primary", "backup-smalltalk"
  status: varchar("status").default("active"), // "active", "standby", "processing", "terminated"
  spawnReason: varchar("spawn_reason"), // "timeout", "load", "manual"
  startTime: timestamp("start_time").defaultNow(),
  endTime: timestamp("end_time"),
  performanceScore: decimal("performance_score", { precision: 3, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const remoteContextCache = pgTable("remote_context_cache", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  childId: varchar("child_id").notNull(),
  contextType: varchar("context_type").notNull(), // "interests", "memories", "personality", "recent_history"
  contextData: jsonb("context_data").notNull(),
  lastUpdated: timestamp("last_updated").defaultNow(),
  expiresAt: timestamp("expires_at").notNull(),
  priority: integer("priority").default(5), // 1-10 scale for cache eviction
  accessCount: integer("access_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Context Management Types
export type ContextSession = typeof contextSessions.$inferSelect;
export type InsertContextSession = typeof contextSessions.$inferInsert;
export type ContextRetrievalLog = typeof contextRetrievalLogs.$inferSelect;
export type InsertContextRetrievalLog = typeof contextRetrievalLogs.$inferInsert;
export type AiInstanceManagement = typeof aiInstanceManagement.$inferSelect;
export type InsertAiInstanceManagement = typeof aiInstanceManagement.$inferInsert;
export type RemoteContextCache = typeof remoteContextCache.$inferSelect;
export type InsertRemoteContextCache = typeof remoteContextCache.$inferInsert;

// Stage 4: Avatar Creation Game Enhancement
export const avatarConfigurations = pgTable("avatar_configurations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  childId: varchar("child_id").notNull(),
  name: varchar("name").notNull(),
  configData: jsonb("config_data").notNull(),
  isActive: boolean("is_active").default(false),
  unlockLevel: integer("unlock_level").default(1),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const avatarUnlocks = pgTable("avatar_unlocks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  childId: varchar("child_id").notNull(),
  itemCategory: varchar("item_category").notNull(),
  itemId: varchar("item_id").notNull(),
  unlockedAt: timestamp("unlocked_at").defaultNow(),
  unlockReason: varchar("unlock_reason"),
});

export type AvatarConfiguration = typeof avatarConfigurations.$inferSelect;
export type InsertAvatarConfiguration = typeof avatarConfigurations.$inferInsert;
export type AvatarUnlock = typeof avatarUnlocks.$inferSelect;
export type InsertAvatarUnlock = typeof avatarUnlocks.$inferInsert;

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

// PersonalityProfile type for AI personalization
export interface PersonalityProfile {
  traits?: {
    supportiveness?: number;
    playfulness?: number;
    empathy?: number;
    enthusiasm?: number;
    patience?: number;
    formality?: number;
  };
  communicationStyle?: string;
  interests?: string[];
  preferredTopics?: string[];
  adaptationLevel?: number;
  learningData?: {
    interactions: number;
    positiveResponses: number;
    preferredTopics: string[];
    adaptationNotes: string[];
  };
}

export const insertUsageAlertSchema = createInsertSchema(usageAlerts);
export const insertTokenUsageHistorySchema = createInsertSchema(tokenUsageHistory);
export const insertTokenUsageSchema = createInsertSchema(tokenUsage);