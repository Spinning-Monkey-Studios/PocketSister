import { storage } from './storage';
import { db } from './db';
import { childProfiles, tokenUsage, pricingPlans, subscriptions } from '@shared/schema';
import { eq, and, gte, sum, sql } from 'drizzle-orm';

export interface TokenUsageResult {
  hasTokens: boolean;
  remainingTokens: number;
  monthlyLimit: number;
  currentUsage: number;
  resetDate: Date;
  subscription?: {
    planName: string;
    overageRate: number;
    canPurchaseTokens: boolean;
  };
}

export interface TokenRestriction {
  restricted: boolean;
  reason?: string;
  upgradeRequired?: boolean;
  allowedActions?: string[];
}

/**
 * Token Management System
 * Handles token validation, usage tracking, and restrictions
 */
export class TokenManager {
  
  /**
   * Check if child has sufficient tokens for a specific action
   */
  async checkTokenAvailability(childId: string, requiredTokens: number = 100): Promise<TokenUsageResult> {
    // Get child profile with current usage
    const [child] = await db.select().from(childProfiles).where(eq(childProfiles.id, childId));
    
    if (!child) {
      throw new Error('Child profile not found');
    }

    // Get user's subscription and plan details
    const userSubscription = await storage.getUserSubscription(child.userId);
    let subscriptionPlan = null;
    
    if (userSubscription) {
      const [plan] = await db.select().from(pricingPlans).where(eq(pricingPlans.id, userSubscription.planId));
      subscriptionPlan = plan;
    }

    // Calculate current month's usage
    const currentDate = new Date();
    const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    
    const [usageResult] = await db
      .select({ totalUsage: sum(tokenUsage.tokensUsed) })
      .from(tokenUsage)
      .where(
        and(
          eq(tokenUsage.childId, childId),
          gte(tokenUsage.createdAt, monthStart)
        )
      );

    const currentUsage = Number(usageResult?.totalUsage) || 0;
    const monthlyLimit = child.monthlyTokenLimit || 50000; // Default limit
    const remainingTokens = Math.max(0, monthlyLimit - currentUsage);
    
    // Calculate reset date (first day of next month)
    const resetDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);

    return {
      hasTokens: remainingTokens >= requiredTokens,
      remainingTokens,
      monthlyLimit,
      currentUsage,
      resetDate,
      subscription: subscriptionPlan ? {
        planName: subscriptionPlan.name,
        overageRate: parseFloat(subscriptionPlan.overageRate.toString()),
        canPurchaseTokens: subscriptionPlan.name !== 'Basic' // Only paid plans can buy extra tokens
      } : undefined
    };
  }

  /**
   * Record token usage for a specific action
   */
  async recordTokenUsage(
    childId: string, 
    tokensUsed: number, 
    usageType: 'chat' | 'image_generation' | 'avatar_creation' | 'voice_synthesis' = 'chat',
    messageId?: string
  ): Promise<void> {
    await db.insert(tokenUsage).values({
      childId,
      messageId,
      tokensUsed,
      usageType,
      createdAt: new Date()
    });

    // Update child's total usage counter
    await db
      .update(childProfiles)
      .set({ 
        tokensUsed: sql`${childProfiles.tokensUsed} + ${tokensUsed}`,
        updatedAt: new Date()
      })
      .where(eq(childProfiles.id, childId));
  }

  /**
   * Determine what features should be restricted based on token availability
   */
  async getFeatureRestrictions(childId: string): Promise<{
    chat: TokenRestriction;
    imageGeneration: TokenRestriction;
    avatarCreation: TokenRestriction;
    voiceSynthesis: TokenRestriction;
    advancedPersonality: TokenRestriction;
  }> {
    const tokenStatus = await this.checkTokenAvailability(childId);
    const baseRestriction = !tokenStatus.hasTokens;

    // Get user's subscription for premium feature checks
    const [child] = await db.select().from(childProfiles).where(eq(childProfiles.id, childId));
    const userSubscription = await storage.getUserSubscription(child.userId);
    let plan = null;
    
    if (userSubscription) {
      const [subscriptionPlan] = await db.select().from(pricingPlans).where(eq(pricingPlans.id, userSubscription.planId));
      plan = subscriptionPlan;
    }

    const isPremium = plan && plan.name !== 'Basic';

    return {
      chat: {
        restricted: baseRestriction,
        reason: baseRestriction ? 'Monthly token limit reached' : undefined,
        upgradeRequired: !isPremium && baseRestriction
      },
      imageGeneration: {
        restricted: baseRestriction || !isPremium,
        reason: !isPremium ? 'Premium subscription required' : (baseRestriction ? 'Token limit reached' : undefined),
        upgradeRequired: !isPremium
      },
      avatarCreation: {
        restricted: baseRestriction,
        reason: baseRestriction ? 'Token limit reached' : undefined,
        upgradeRequired: !isPremium && baseRestriction
      },
      voiceSynthesis: {
        restricted: baseRestriction || !isPremium,
        reason: !isPremium ? 'Premium subscription required' : (baseRestriction ? 'Token limit reached' : undefined),
        upgradeRequired: !isPremium
      },
      advancedPersonality: {
        restricted: !isPremium || baseRestriction,
        reason: !isPremium ? 'Premium subscription required' : (baseRestriction ? 'Token limit reached' : undefined),
        upgradeRequired: !isPremium
      }
    };
  }

  /**
   * Purchase additional tokens (for premium users)
   */
  async purchaseTokens(childId: string, tokenAmount: number): Promise<{
    success: boolean;
    newLimit?: number;
    cost?: number;
    error?: string;
  }> {
    const [child] = await db.select().from(childProfiles).where(eq(childProfiles.id, childId));
    if (!child) {
      return { success: false, error: 'Child profile not found' };
    }

    const userSubscription = await storage.getUserSubscription(child.userId);
    if (!userSubscription) {
      return { success: false, error: 'Active subscription required to purchase tokens' };
    }

    const [plan] = await db.select().from(pricingPlans).where(eq(pricingPlans.id, userSubscription.planId));
    if (!plan || plan.name === 'Basic') {
      return { success: false, error: 'Premium subscription required to purchase additional tokens' };
    }

    const cost = tokenAmount * parseFloat(plan.overageRate.toString());
    const newLimit = (child.monthlyTokenLimit || 50000) + tokenAmount;

    // This would integrate with Stripe for actual payment processing
    // For now, we'll just update the limit
    await db
      .update(childProfiles)
      .set({ 
        monthlyTokenLimit: newLimit,
        updatedAt: new Date()
      })
      .where(eq(childProfiles.id, childId));

    return {
      success: true,
      newLimit,
      cost
    };
  }

  /**
   * Reset monthly token usage (called by scheduled job)
   */
  async resetMonthlyUsage(): Promise<void> {
    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Reset all children whose last reset was before this month
    await db
      .update(childProfiles)
      .set({ 
        tokensUsed: 0,
        lastResetDate: firstOfMonth,
        updatedAt: new Date()
      })
      .where(sql`${childProfiles.lastResetDate} < ${firstOfMonth}`);
  }

  /**
   * Get token usage analytics for a child
   */
  async getUsageAnalytics(childId: string, days: number = 30): Promise<{
    dailyUsage: Array<{ date: string; tokens: number; type: string }>;
    totalUsage: number;
    averageDaily: number;
    topUsageTypes: Array<{ type: string; tokens: number; percentage: number }>;
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const usageData = await db
      .select({
        date: sql<string>`DATE(${tokenUsage.createdAt})`,
        type: tokenUsage.usageType,
        tokens: sum(tokenUsage.tokensUsed)
      })
      .from(tokenUsage)
      .where(
        and(
          eq(tokenUsage.childId, childId),
          gte(tokenUsage.createdAt, startDate)
        )
      )
      .groupBy(sql`DATE(${tokenUsage.createdAt})`, tokenUsage.usageType)
      .orderBy(sql`DATE(${tokenUsage.createdAt})`);

    const totalUsage = usageData.reduce((sum: number, item: any) => sum + Number(item.tokens || 0), 0);
    const averageDaily = totalUsage / days;

    // Group by usage type for top types
    const typeUsage = usageData.reduce((acc: any, item: any) => {
      const type = item.type || 'unknown';
      acc[type] = (acc[type] || 0) + Number(item.tokens || 0);
      return acc;
    }, {} as Record<string, number>);

    const topUsageTypes = Object.entries(typeUsage)
      .map(([type, tokens]) => ({
        type,
        tokens,
        percentage: totalUsage > 0 ? (Number(tokens) / totalUsage) * 100 : 0
      }))
      .sort((a, b) => Number(b.tokens) - Number(a.tokens));

    return {
      dailyUsage: usageData.map((item: any) => ({
        date: item.date,
        tokens: Number(item.tokens || 0),
        type: item.type || 'unknown'
      })),
      totalUsage,
      averageDaily,
      topUsageTypes: topUsageTypes.map(item => ({
        type: item.type,
        tokens: Number(item.tokens),
        percentage: item.percentage
      }))
    };
  }
}

export const tokenManager = new TokenManager();