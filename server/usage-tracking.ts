import { storage } from "./storage";
import { db } from "./db";
import { users, childProfiles, conversationMessages } from "@shared/schema";
import { eq, and, gte, lte, sum, count, sql } from "drizzle-orm";

export interface UsageReport {
  userId: string;
  tier: string;
  billingPeriod: {
    start: Date;
    end: Date;
  };
  usage: {
    totalInteractions: number;
    tokensUsed: number;
    interactionsIncluded: number;
    overageInteractions: number;
    overageCharge: number;
  };
  childBreakdown: Array<{
    childId: string;
    childName: string;
    interactions: number;
    tokensUsed: number;
    topTopics: string[];
    moodTrends: string[];
  }>;
  parentControls: {
    safetyAlertsTriggered: number;
    contentFiltered: number;
    timeRestrictionsApplied: number;
  };
}

export class UsageTracker {
  // Get detailed usage report for Family tier
  static async generateFamilyUsageReport(userId: string): Promise<UsageReport> {
    const user = await storage.getUserById(userId);
    if (!user) throw new Error('User not found');

    const currentDate = new Date();
    const billingStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const billingEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    // Get all child profiles for this user
    const children = await db.select()
      .from(childProfiles)
      .where(eq(childProfiles.userId, userId));

    // Calculate usage per child
    const childBreakdown = await Promise.all(
      children.map(async (child: any) => {
        const interactions = await db.select({ count: count() })
          .from(conversationMessages)
          .where(and(
            eq(conversationMessages.childId, child.id),
            gte(conversationMessages.timestamp, billingStart),
            lte(conversationMessages.timestamp, billingEnd),
            eq(conversationMessages.role, 'assistant')
          ));

        return {
          childId: child.id,
          childName: child.name,
          interactions: interactions[0]?.count || 0,
          tokensUsed: interactions[0]?.count || 0, // 1 token per interaction for simplicity
          topTopics: ['Friends', 'School', 'Hobbies'], // Would analyze conversation content
          moodTrends: ['Happy', 'Curious', 'Confident'] // Would analyze mood tracking data
        };
      })
    );

    const totalInteractions = childBreakdown.reduce((sum, child) => sum + child.interactions, 0);
    const tierLimits = {
      basic: 50,
      premium: 200,
      family: 300 // 300k tokens shared
    };

    const limit = tierLimits[user.subscriptionTier as keyof typeof tierLimits] || 0;
    const overageInteractions = Math.max(0, totalInteractions - limit);
    const overageCharge = overageInteractions * 0.01;

    return {
      userId,
      tier: user.subscriptionTier || 'free',
      billingPeriod: {
        start: billingStart,
        end: billingEnd
      },
      usage: {
        totalInteractions,
        tokensUsed: totalInteractions,
        interactionsIncluded: limit,
        overageInteractions,
        overageCharge
      },
      childBreakdown,
      parentControls: {
        safetyAlertsTriggered: 0, // Would query safety alerts
        contentFiltered: 0, // Would query filtered content
        timeRestrictionsApplied: 0 // Would query time restrictions
      }
    };
  }

  // Generate billing notification for parents
  static async generateBillingNotification(userId: string): Promise<string> {
    const report = await this.generateFamilyUsageReport(userId);
    
    const notification = `
📊 **Monthly Billing Summary - ${report.billingPeriod.start.toLocaleDateString()} to ${report.billingPeriod.end.toLocaleDateString()}**

**Your ${report.tier.toUpperCase()} Plan:**
• Total AI Interactions: ${report.usage.totalInteractions}
• Included: ${report.usage.interactionsIncluded}
• Overage: ${report.usage.overageInteractions} interactions
• Additional Charges: $${report.usage.overageCharge.toFixed(2)}

**Per Child Usage:**
${report.childBreakdown.map(child => 
  `• ${child.childName}: ${child.interactions} interactions`
).join('\n')}

**Safety & Controls:**
• Safety alerts: ${report.parentControls.safetyAlertsTriggered}
• Content filtered: ${report.parentControls.contentFiltered}

Need to adjust usage? Contact support or modify your child's settings in the parent portal.
    `.trim();

    return notification;
  }

  // Track token usage with tier-specific limits
  static async trackTokenUsage(userId: string, childId: string, tokensUsed: number = 1): Promise<{
    allowed: boolean;
    usage: number;
    limit: number;
    overageCharge: number;
    tier: string;
    message: string;
  }> {
    const user = await storage.getUserById(userId);
    if (!user) throw new Error('User not found');

    const currentMonth = new Date().getMonth();
    const usage = await storage.getMonthlyUsage(userId, currentMonth);
    
    const tierLimits = {
      free: 500,
      basic: 50,
      premium: 200,
      family: 300 // 300k shared across all children
    };

    const tier = user.subscriptionTier || 'free';
    const limit = tierLimits[tier as keyof typeof tierLimits] || 0;
    const newUsage = usage.interactions + tokensUsed;
    
    let allowed = true;
    let overageCharge = 0;
    let message = '';

    if (tier === 'free') {
      allowed = newUsage <= limit;
      message = allowed ? 
        `Free trial: ${limit - newUsage} interactions remaining` :
        'Free trial limit reached - upgrade required';
    } else if (tier === 'basic' || tier === 'premium') {
      // Allow overage with billing
      if (newUsage > limit) {
        const overage = newUsage - limit;
        overageCharge = overage * 0.01;
        message = `Overage: ${overage} interactions × $0.01 = $${overageCharge.toFixed(2)}`;
      } else {
        message = `Within limit: ${newUsage}/${limit} interactions used`;
      }
    } else if (tier === 'family') {
      // Family has high limit but still can have overage
      if (newUsage > limit) {
        const overage = newUsage - limit;
        overageCharge = overage * 0.01;
        message = `Family plan overage: ${overage} interactions × $0.01 = $${overageCharge.toFixed(2)}`;
      } else {
        message = `Family plan: ${newUsage}/${limit} interactions across all children`;
      }
    }

    return {
      allowed,
      usage: newUsage,
      limit,
      overageCharge,
      tier,
      message
    };
  }
}