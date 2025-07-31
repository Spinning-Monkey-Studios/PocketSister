import {
  users,
  childProfiles,
  pricingPlans,
  subscriptions,
  announcements,
  conversations,
  messages,
  blogPosts,
  testimonials,
  contactMessages,
  motivationalMessages,
  usageAlerts,
  tokenUsageHistory,
  deviceTokens,
  notifications,
  notificationPreferences,
  childPersonalities,
  dailyAffirmations,
  moodEntries,
  childGoals,
  childReminders,
  type User,
  type UpsertUser,
  type DeviceToken,
  type InsertDeviceToken,
  type Notification,
  type InsertNotification,
  type NotificationPreferences,
  type InsertNotificationPreferences,
  type ChildProfile,
  type InsertChildProfile,
  type PricingPlan,
  type Subscription,
  type InsertSubscription,
  type Announcement,
  type InsertAnnouncement,
  type Conversation,
  type Message,
  type BlogPost,
  type Testimonial,
  type ContactMessage,
  type MotivationalMessage,
  type UsageAlert,
  type InsertUsageAlert,
  type TokenUsageHistory,
  type InsertTokenUsageHistory,
  type ChildPersonality,
  type InsertChildPersonality,
  type DailyAffirmation,
  type InsertDailyAffirmation,
  type MoodEntry,
  type InsertMoodEntry,
  type ChildGoal,
  type InsertChildGoal,
  type ChildReminder,
  type InsertChildReminder,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql, gte, lt } from "drizzle-orm";
import { getTestModeAccess, getTestModeSubscription, getTestModeAffirmationsLimit, isTestModeEnabled } from "./test-mode";

// Interface for storage operations
export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Child profile operations
  getChildProfiles(userId: string): Promise<ChildProfile[]>;
  createChildProfile(profile: InsertChildProfile): Promise<ChildProfile>;
  updateChildProfile(id: string, updates: Partial<ChildProfile>): Promise<ChildProfile>;
  
  // Subscription operations
  getUserSubscription(userId: string): Promise<Subscription | undefined>;
  createSubscription(subscription: InsertSubscription): Promise<Subscription>;
  updateSubscription(id: string, updates: Partial<Subscription>): Promise<Subscription>;
  
  // Pricing plan operations
  getPricingPlans(): Promise<PricingPlan[]>;
  
  // Admin operations
  getAllUsers(): Promise<User[]>;
  updateUserSubscription(userId: string, status: string): Promise<void>;
  
  // Announcement operations
  getAnnouncements(targetAudience?: string): Promise<Announcement[]>;
  createAnnouncement(announcement: InsertAnnouncement): Promise<Announcement>;
  
  // Blog operations
  getBlogPosts(): Promise<BlogPost[]>;
  
  // Testimonial operations
  getTestimonials(): Promise<Testimonial[]>;
  
  // Contact operations
  saveContactMessage(message: any): Promise<ContactMessage>;
  
  // Motivational messages
  getRandomMotivationalMessage(category?: string): Promise<MotivationalMessage | undefined>;
  
  // Chat operations
  getConversations(childId: string): Promise<Conversation[]>;
  createConversation(conversation: any): Promise<Conversation>;
  getMessages(conversationId: string): Promise<Message[]>;
  createMessage(message: any): Promise<Message>;
  
  // Token usage tracking
  getTokenUsage(childId: string, month: number, year: number): Promise<TokenUsageHistory[]>;
  recordTokenUsage(childId: string, tokens: number): Promise<void>;
  getUserTokenStats(userId: string): Promise<any[]>;
  
  // Usage alerts
  getUsageAlerts(childId: string): Promise<UsageAlert[]>;
  createUsageAlert(alert: InsertUsageAlert): Promise<UsageAlert>;
  checkAndTriggerAlerts(childId: string): Promise<void>;
  
  // Push notifications
  saveDeviceToken(token: InsertDeviceToken): Promise<DeviceToken>;
  getUserDeviceTokens(userId: string): Promise<string[]>;
  removeDeviceToken(token: string): Promise<void>;
  recordNotification(notification: InsertNotification): Promise<Notification>;
  getUserNotificationHistory(userId: string, limit: number): Promise<Notification[]>;
  updateUserNotificationPreferences(userId: string, preferences: Partial<NotificationPreferences>): Promise<void>;
  getAllUsersWithNotificationPreferences(): Promise<any[]>;
  recordAnnouncementBroadcast(broadcast: any): Promise<void>;
  getChildProfile(childId: string): Promise<ChildProfile | undefined>;
  markNotificationAsRead(notificationId: string): Promise<void>;

  // Child personality tracking
  getChildPersonality(childId: string): Promise<ChildPersonality | undefined>;
  createOrUpdateChildPersonality(childId: string, personalityData: Partial<InsertChildPersonality>): Promise<ChildPersonality>;
  getRecentConversationContext(childId: string, limit?: number): Promise<Message[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations (required for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {    
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Child profile operations
  async getChildProfiles(userId: string): Promise<ChildProfile[]> {
    return await db.select().from(childProfiles).where(eq(childProfiles.userId, userId));
  }

  async createChildProfile(profile: InsertChildProfile): Promise<ChildProfile> {
    const [child] = await db.insert(childProfiles).values(profile).returning();
    return child;
  }

  async updateChildProfile(id: string, updates: Partial<ChildProfile>): Promise<ChildProfile> {
    const [child] = await db
      .update(childProfiles)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(childProfiles.id, id))
      .returning();
    return child;
  }

  // Subscription operations
  async getUserSubscription(userId: string): Promise<Subscription | undefined> {
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId));
    return subscription;
  }

  async createSubscription(subscription: InsertSubscription): Promise<Subscription> {
    const [sub] = await db.insert(subscriptions).values(subscription).returning();
    return sub;
  }

  async updateSubscription(id: string, updates: Partial<Subscription>): Promise<Subscription> {
    const [sub] = await db
      .update(subscriptions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(subscriptions.id, id))
      .returning();
    return sub;
  }

  // Pricing plan operations
  async getPricingPlans(): Promise<PricingPlan[]> {
    return await db.select().from(pricingPlans).where(eq(pricingPlans.isActive, true));
  }

  // Admin operations
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async updateUserSubscription(userId: string, status: string): Promise<void> {
    await db
      .update(users)
      .set({ subscriptionStatus: status, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  // Announcement operations
  async getAnnouncements(targetAudience?: string): Promise<Announcement[]> {
    let query = db.select().from(announcements).where(eq(announcements.isActive, true));
    
    if (targetAudience) {
      query = query.where(
        and(
          eq(announcements.isActive, true),
          eq(announcements.targetAudience, targetAudience)
        )
      );
    }
    
    return await query.orderBy(desc(announcements.createdAt));
  }

  async createAnnouncement(announcement: InsertAnnouncement): Promise<Announcement> {
    const [ann] = await db.insert(announcements).values(announcement).returning();
    return ann;
  }

  // Blog operations
  async getBlogPosts(): Promise<BlogPost[]> {
    return await db.select().from(blogPosts).orderBy(desc(blogPosts.createdAt));
  }

  // Testimonial operations
  async getTestimonials(): Promise<Testimonial[]> {
    return await db.select().from(testimonials);
  }

  // Contact operations
  async createContactMessage(message: any): Promise<ContactMessage> {
    const [contact] = await db.insert(contactMessages).values(message).returning();
    return contact;
  }

  async saveContactMessage(message: any): Promise<ContactMessage> {
    return this.createContactMessage(message);
  }

  // Motivational messages
  async getRandomMotivationalMessage(category?: string): Promise<MotivationalMessage | undefined> {
    let query = db.select().from(motivationalMessages).where(eq(motivationalMessages.isActive, true));
    
    if (category) {
      query = query.where(
        and(
          eq(motivationalMessages.isActive, true),
          eq(motivationalMessages.category, category)
        )
      );
    }
    
    const messages = await query;
    if (messages.length === 0) return undefined;
    
    return messages[Math.floor(Math.random() * messages.length)];
  }

  // Chat operations
  async getConversations(childId: string): Promise<Conversation[]> {
    return await db
      .select()
      .from(conversations)
      .where(eq(conversations.childId, childId))
      .orderBy(desc(conversations.updatedAt));
  }

  async createConversation(conversation: any): Promise<Conversation> {
    const [conv] = await db.insert(conversations).values(conversation).returning();
    return conv;
  }

  async getMessages(conversationId: string): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(messages.createdAt);
  }

  async createMessage(message: any): Promise<Message> {
    const [msg] = await db.insert(messages).values(message).returning();
    return msg;
  }

  async addMessage(messageData: any): Promise<Message> {
    return this.createMessage(messageData);
  }

  // Additional subscription methods
  async getUserSubscription(userId: string): Promise<Subscription | undefined> {
    const [subscription] = await db.select().from(subscriptions).where(eq(subscriptions.userId, userId));
    return subscription;
  }

  async createSubscription(subscriptionData: InsertSubscription): Promise<Subscription> {
    const [subscription] = await db.insert(subscriptions).values(subscriptionData).returning();
    return subscription;
  }

  // Notification methods for web content requests
  async createNotification(notificationData: InsertNotification): Promise<Notification> {
    const [notification] = await db.insert(notifications).values(notificationData).returning();
    return notification;
  }
  
  // Token usage tracking methods
  async getTokenUsage(childId: string, month: number, year: number): Promise<TokenUsageHistory[]> {
    return await db
      .select()
      .from(tokenUsageHistory)
      .where(
        and(
          eq(tokenUsageHistory.childId, childId),
          eq(tokenUsageHistory.month, month),
          eq(tokenUsageHistory.year, year)
        )
      );
  }
  
  async recordTokenUsage(childId: string, tokens: number): Promise<void> {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    
    // Update child profile token count
    await db
      .update(childProfiles)
      .set({ 
        tokensUsed: sql`${childProfiles.tokensUsed} + ${tokens}`,
        updatedAt: now 
      })
      .where(eq(childProfiles.id, childId));
    
    // Record in token usage history table
    await db.insert(tokenUsageHistory).values({
      childId,
      usageDate: now,
      tokensUsed: tokens,
      month,
      year,
    });
    
    // Check if alerts should be triggered
    await this.checkAndTriggerAlerts(childId);
  }
  
  async getUserTokenStats(userId: string): Promise<any[]> {
    const profiles = await db
      .select({
        childId: childProfiles.id,
        childName: childProfiles.name,
        companionName: childProfiles.companionName,
        tokensUsed: childProfiles.tokensUsed,
        monthlyLimit: childProfiles.monthlyTokenLimit,
        lastReset: childProfiles.lastResetDate,
      })
      .from(childProfiles)
      .where(eq(childProfiles.userId, userId));
    
    return profiles;
  }
  
  // Usage alerts methods
  async getUsageAlerts(childId: string): Promise<UsageAlert[]> {
    return await db
      .select()
      .from(usageAlerts)
      .where(
        and(
          eq(usageAlerts.childId, childId),
          eq(usageAlerts.isActive, true)
        )
      );
  }
  
  async createUsageAlert(alert: InsertUsageAlert): Promise<UsageAlert> {
    const [newAlert] = await db.insert(usageAlerts).values(alert).returning();
    return newAlert;
  }
  
  async checkAndTriggerAlerts(childId: string): Promise<void> {
    // Get child's current usage
    const [child] = await db
      .select()
      .from(childProfiles)
      .where(eq(childProfiles.id, childId));
    
    if (!child) return;
    
    const usagePercentage = (child.tokensUsed / child.monthlyTokenLimit) * 100;
    
    // Get active alerts for this child
    const alerts = await this.getUsageAlerts(childId);
    
    for (const alert of alerts) {
      let shouldTrigger = false;
      
      if (alert.alertType === 'warning' && usagePercentage >= alert.threshold) {
        shouldTrigger = true;
      } else if (alert.alertType === 'limit_reached' && child.messageCount >= alert.threshold) {
        shouldTrigger = true;
      }
      
      if (shouldTrigger && (!alert.lastTriggered || 
          (new Date().getTime() - new Date(alert.lastTriggered).getTime()) > 24 * 60 * 60 * 1000)) {
        // Update alert as triggered
        await db
          .update(usageAlerts)
          .set({ lastTriggered: new Date() })
          .where(eq(usageAlerts.id, alert.id));
        
        // Trigger push notification
        const { notificationService } = await import("./notifications");
        await notificationService.sendUsageAlert(childId, usagePercentage, child.tokensUsed, child.monthlyTokenLimit);
        
        console.log(`Alert triggered for child ${childId}: ${alert.alertType} at ${usagePercentage}%`);
      }
    }
  }
  
  // Push notification methods
  async saveDeviceToken(tokenData: InsertDeviceToken): Promise<DeviceToken> {
    // First, deactivate any existing tokens for this user/platform
    await db
      .update(deviceTokens)
      .set({ isActive: false })
      .where(
        and(
          eq(deviceTokens.userId, tokenData.userId),
          eq(deviceTokens.platform, tokenData.platform)
        )
      );

    // Insert new token
    const [token] = await db.insert(deviceTokens).values(tokenData).returning();
    return token;
  }

  async getUserDeviceTokens(userId: string): Promise<string[]> {
    const tokens = await db
      .select({ token: deviceTokens.token })
      .from(deviceTokens)
      .where(
        and(
          eq(deviceTokens.userId, userId),
          eq(deviceTokens.isActive, true)
        )
      );
    
    return tokens.map(t => t.token);
  }

  async removeDeviceToken(token: string): Promise<void> {
    await db
      .update(deviceTokens)
      .set({ isActive: false })
      .where(eq(deviceTokens.token, token));
  }

  async recordNotification(notificationData: InsertNotification): Promise<Notification> {
    const [notification] = await db.insert(notifications).values(notificationData).returning();
    return notification;
  }

  async getUserNotificationHistory(userId: string, limit: number): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.sentAt))
      .limit(limit);
  }

  async updateUserNotificationPreferences(userId: string, preferences: Partial<NotificationPreferences>): Promise<void> {
    await db
      .insert(notificationPreferences)
      .values({
        userId,
        ...preferences,
        updatedAt: new Date()
      })
      .onConflictDoUpdate({
        target: notificationPreferences.userId,
        set: {
          ...preferences,
          updatedAt: new Date()
        }
      });
  }

  async getAllUsersWithNotificationPreferences(): Promise<any[]> {
    const usersWithPrefs = await db
      .select({
        id: users.id,
        email: users.email,
        subscriptionStatus: users.email, // Placeholder - you might have this in subscriptions table
        subscriptionTier: users.email, // Placeholder
        hasChildren: sql<boolean>`EXISTS(SELECT 1 FROM ${childProfiles} WHERE ${childProfiles.userId} = ${users.id})`,
        notificationPreferences: {
          usageAlerts: notificationPreferences.usageAlerts,
          systemAnnouncements: notificationPreferences.systemAnnouncements,
          emergencyAlerts: notificationPreferences.emergencyAlerts
        }
      })
      .from(users)
      .leftJoin(notificationPreferences, eq(users.id, notificationPreferences.userId));

    return usersWithPrefs;
  }

  async recordAnnouncementBroadcast(broadcast: any): Promise<void> {
    // You might want to create a separate table for tracking announcement broadcasts
    console.log("Recording announcement broadcast:", broadcast);
  }

  async getChildProfile(childId: string): Promise<ChildProfile | undefined> {
    const [child] = await db.select().from(childProfiles).where(eq(childProfiles.id, childId));
    return child;
  }

  async markNotificationAsRead(notificationId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(eq(notifications.id, notificationId));
  }

  // Child personality tracking methods
  async getChildPersonality(childId: string): Promise<ChildPersonality | undefined> {
    const [personality] = await db
      .select()
      .from(childPersonalities)
      .where(eq(childPersonalities.childId, childId));
    return personality;
  }

  async createOrUpdateChildPersonality(
    childId: string, 
    personalityData: Partial<InsertChildPersonality>
  ): Promise<ChildPersonality> {
    const [personality] = await db
      .insert(childPersonalities)
      .values({ ...personalityData, childId })
      .onConflictDoUpdate({
        target: childPersonalities.childId,
        set: {
          ...personalityData,
          updatedAt: new Date(),
          lastInteraction: new Date(),
        },
      })
      .returning();
    return personality;
  }

  async getRecentConversationContext(childId: string, limit: number = 10): Promise<Message[]> {
    // Get recent conversations for this child
    const recentConversations = await db
      .select({ id: conversations.id })
      .from(conversations)
      .where(eq(conversations.childId, childId))
      .orderBy(desc(conversations.updatedAt))
      .limit(3);

    if (recentConversations.length === 0) {
      return [];
    }

    const conversationIds = recentConversations.map(c => c.id);
    
    // Get recent messages from these conversations
    return await db
      .select()
      .from(messages)
      .where(sql`${messages.conversationId} = ANY(${conversationIds})`)
      .orderBy(desc(messages.createdAt))
      .limit(limit);
  }

  // Stage 2 Proactive Features - Daily Affirmations
  async createDailyAffirmation(affirmationData: InsertDailyAffirmation): Promise<DailyAffirmation> {
    const [affirmation] = await db
      .insert(dailyAffirmations)
      .values(affirmationData)
      .returning();
    return affirmation;
  }

  async getTodaysAffirmations(childId: string): Promise<DailyAffirmation[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return await db
      .select()
      .from(dailyAffirmations)
      .where(
        and(
          eq(dailyAffirmations.childId, childId),
          gte(dailyAffirmations.sentAt, today),
          lt(dailyAffirmations.sentAt, tomorrow)
        )
      )
      .orderBy(desc(dailyAffirmations.sentAt));
  }

  async markAffirmationAsRead(affirmationId: string): Promise<void> {
    await db
      .update(dailyAffirmations)
      .set({ wasRead: true })
      .where(eq(dailyAffirmations.id, affirmationId));
  }

  // Stage 2 Proactive Features - Mood Tracking
  async createMoodEntry(moodData: InsertMoodEntry): Promise<MoodEntry> {
    const [mood] = await db
      .insert(moodEntries)
      .values(moodData)
      .returning();
    return mood;
  }

  async getMoodHistory(childId: string, days: number = 30): Promise<MoodEntry[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return await db
      .select()
      .from(moodEntries)
      .where(
        and(
          eq(moodEntries.childId, childId),
          gte(moodEntries.entryDate, startDate.toISOString().split('T')[0])
        )
      )
      .orderBy(desc(moodEntries.entryDate));
  }

  async getTodaysMoodEntry(childId: string): Promise<MoodEntry | undefined> {
    const today = new Date().toISOString().split('T')[0];
    const [mood] = await db
      .select()
      .from(moodEntries)
      .where(
        and(
          eq(moodEntries.childId, childId),
          eq(moodEntries.entryDate, today)
        )
      );
    return mood;
  }

  // Stage 2 Proactive Features - Goals
  async createChildGoal(goalData: InsertChildGoal): Promise<ChildGoal> {
    const [goal] = await db
      .insert(childGoals)
      .values(goalData)
      .returning();
    return goal;
  }

  async getChildGoals(childId: string, includeCompleted: boolean = true): Promise<ChildGoal[]> {
    const conditions = [eq(childGoals.childId, childId)];
    if (!includeCompleted) {
      conditions.push(eq(childGoals.isCompleted, false));
    }

    return await db
      .select()
      .from(childGoals)
      .where(and(...conditions))
      .orderBy(desc(childGoals.createdAt));
  }

  async updateGoalProgress(goalId: string, progress: number): Promise<ChildGoal> {
    const updateData: any = { progress, updatedAt: new Date() };
    if (progress >= 100) {
      updateData.isCompleted = true;
      updateData.completedAt = new Date();
    }

    const [goal] = await db
      .update(childGoals)
      .set(updateData)
      .where(eq(childGoals.id, goalId))
      .returning();
    return goal;
  }

  // Stage 2 Proactive Features - Reminders
  async createChildReminder(reminderData: InsertChildReminder): Promise<ChildReminder> {
    const [reminder] = await db
      .insert(childReminders)
      .values(reminderData)
      .returning();
    return reminder;
  }

  async getUpcomingReminders(childId: string): Promise<ChildReminder[]> {
    const now = new Date();
    return await db
      .select()
      .from(childReminders)
      .where(
        and(
          eq(childReminders.childId, childId),
          eq(childReminders.isCompleted, false),
          gte(childReminders.reminderDate, now)
        )
      )
      .orderBy(childReminders.reminderDate);
  }

  async completeReminder(reminderId: string): Promise<void> {
    await db
      .update(childReminders)
      .set({ isCompleted: true, completedAt: new Date() })
      .where(eq(childReminders.id, reminderId));
  }

  // Tier restriction helpers
  async getUserSubscriptionPlan(userId: string): Promise<PricingPlan | undefined> {
    const [subscription] = await db
      .select({
        plan: pricingPlans
      })
      .from(subscriptions)
      .innerJoin(pricingPlans, eq(subscriptions.planId, pricingPlans.id))
      .where(
        and(
          eq(subscriptions.userId, userId),
          eq(subscriptions.status, 'active')
        )
      );
    
    return subscription?.plan;
  }

  async checkFeatureAccess(userId: string, feature: string): Promise<boolean> {
    const plan = await this.getUserSubscriptionPlan(userId);
    if (!plan) return false; // No active subscription

    switch (feature) {
      case 'advancedPersonalityAI':
        return plan.advancedPersonalityAI;
      case 'moodTracking':
        return plan.moodTrackingEnabled;
      case 'goalTracking':
        return plan.goalTrackingEnabled;
      case 'reminderSystem':
        return plan.reminderSystemEnabled;
      case 'parentInsights':
        return plan.parentInsightsEnabled;
      default:
        return false;
    }
  }

  async getDailyAffirmationLimit(userId: string): Promise<number> {
    const plan = await this.getUserSubscriptionPlan(userId);
    return plan?.dailyAffirmationsLimit || 1; // Default to 1 if no plan
  }

  async getAllChildProfiles(): Promise<ChildProfile[]> {
    return await db.select().from(childProfiles);
  }

  // Initialize default pricing plans with Stage 2 tier restrictions
  async initializePricingPlans(): Promise<void> {
    try {
      const existingPlans = await this.getPricingPlans();
      if (existingPlans.length > 0) {
        return; // Plans already exist
      }

      // Basic Plan - Limited features
      await db.insert(pricingPlans).values({
        id: 'basic',
        name: 'Basic',
        description: 'Essential AI companion with basic features',
        price: '0.00',
        tokenLimit: 100,
        dailyAffirmationsLimit: 1,
        advancedPersonalityAI: false,
        moodTrackingEnabled: false,
        goalTrackingEnabled: false,
        reminderSystemEnabled: false,
        parentInsightsEnabled: false,
        features: ['Basic AI Chat', 'Avatar Creation', 'Simple Affirmations']
      });

      // Premium Plan - Stage 2 proactive features
      await db.insert(pricingPlans).values({
        id: 'premium',
        name: 'Premium',
        description: 'Advanced AI with proactive big sister features',
        price: '19.99',
        tokenLimit: 1000,
        dailyAffirmationsLimit: 3,
        advancedPersonalityAI: true,
        moodTrackingEnabled: true,
        goalTrackingEnabled: true,
        reminderSystemEnabled: true,
        parentInsightsEnabled: false,
        features: ['Advanced Personality AI', 'Mood Tracking', 'Goal Setting', 'Multiple Daily Affirmations', 'Proactive Check-ins']
      });

      // Family Plan - All features
      await db.insert(pricingPlans).values({
        id: 'family',
        name: 'Family',
        description: 'Complete AI companion with parent insights',
        price: '39.99',
        tokenLimit: 2500,
        dailyAffirmationsLimit: 5,
        advancedPersonalityAI: true,
        moodTrackingEnabled: true,
        goalTrackingEnabled: true,
        reminderSystemEnabled: true,
        parentInsightsEnabled: true,
        features: ['All Premium Features', 'Parent Dashboard', 'Multiple Child Profiles', 'Advanced Insights', 'Priority Support']
      });

      console.log('Default pricing plans initialized with Stage 2 features');
    } catch (error) {
      console.error('Error initializing pricing plans:', error);
    }
  }
}

export const storage = new DatabaseStorage();