import { db } from "./db";
import { usageMetrics, activeUserSessions, childProfiles } from "@shared/schema";
import { eq, and, sql } from "drizzle-orm";
import type { InsertUsageMetric, InsertActiveUserSession } from "@shared/schema";

export class UsageTrackingService {
  // Start a user session
  static async startSession(childId: string, deviceInfo?: any): Promise<string> {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    await db.insert(activeUserSessions).values({
      childId,
      sessionId,
      deviceInfo: deviceInfo || {},
      startTime: new Date(),
      lastActivity: new Date(),
      isActive: true,
      tokensThisSession: 0,
      messagesThisSession: 0,
    });

    return sessionId;
  }

  // Update session activity
  static async updateSessionActivity(
    sessionId: string,
    tokensUsed: number = 0,
    messageCount: number = 0
  ): Promise<void> {
    await db
      .update(activeUserSessions)
      .set({
        lastActivity: new Date(),
        tokensThisSession: sql`tokens_this_session + ${tokensUsed}`,
        messagesThisSession: sql`messages_this_session + ${messageCount}`,
      })
      .where(eq(activeUserSessions.sessionId, sessionId));
  }

  // End a session and update daily metrics
  static async endSession(sessionId: string): Promise<void> {
    const session = await db
      .select()
      .from(activeUserSessions)
      .where(eq(activeUserSessions.sessionId, sessionId))
      .limit(1);

    if (session.length === 0) return;

    const sessionData = session[0];
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    // Calculate session duration in minutes
    const sessionDuration = Math.round(
      (new Date().getTime() - new Date(sessionData.startTime).getTime()) / (1000 * 60)
    );

    // Update or create daily metrics
    const existingMetrics = await db
      .select()
      .from(usageMetrics)
      .where(
        and(
          eq(usageMetrics.childId, sessionData.childId),
          eq(usageMetrics.date, today)
        )
      )
      .limit(1);

    if (existingMetrics.length > 0) {
      // Update existing metrics
      await db
        .update(usageMetrics)
        .set({
          minutesSpent: sql`minutes_spent + ${sessionDuration}`,
          tokensUsed: sql`tokens_used + ${sessionData.tokensThisSession}`,
          messagesExchanged: sql`messages_exchanged + ${sessionData.messagesThisSession}`,
          sessionCount: sql`session_count + 1`,
          updatedAt: new Date(),
        })
        .where(eq(usageMetrics.id, existingMetrics[0].id));
    } else {
      // Create new daily metrics
      await db.insert(usageMetrics).values({
        childId: sessionData.childId,
        date: today,
        minutesSpent: sessionDuration,
        tokensUsed: sessionData.tokensThisSession,
        messagesExchanged: sessionData.messagesThisSession,
        sessionCount: 1,
        avgResponseTime: 0,
        aiProvider: "gemini",
      });
    }

    // Deactivate the session
    await db
      .update(activeUserSessions)
      .set({ isActive: false })
      .where(eq(activeUserSessions.sessionId, sessionId));
  }

  // Get usage metrics for admin dashboard
  static async getUsageMetrics(
    startDate?: string,
    endDate?: string,
    childId?: string
  ) {
    let query = db.select({
      id: usageMetrics.id,
      childId: usageMetrics.childId,
      childName: childProfiles.name,
      date: usageMetrics.date,
      minutesSpent: usageMetrics.minutesSpent,
      tokensUsed: usageMetrics.tokensUsed,
      messagesExchanged: usageMetrics.messagesExchanged,
      sessionCount: usageMetrics.sessionCount,
      avgResponseTime: usageMetrics.avgResponseTime,
      aiProvider: usageMetrics.aiProvider,
    })
    .from(usageMetrics)
    .leftJoin(childProfiles, eq(usageMetrics.childId, childProfiles.id));

    // Apply filters
    const conditions = [];
    if (startDate) conditions.push(sql`${usageMetrics.date} >= ${startDate}`);
    if (endDate) conditions.push(sql`${usageMetrics.date} <= ${endDate}`);
    if (childId) conditions.push(eq(usageMetrics.childId, childId));

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    return await query.orderBy(sql`${usageMetrics.date} DESC`);
  }

  // Get daily usage summary for admin dashboard
  static async getDailyUsageSummary(days: number = 30) {
    return await db
      .select({
        date: usageMetrics.date,
        totalMinutes: sql`SUM(${usageMetrics.minutesSpent})`.mapWith(Number),
        totalTokens: sql`SUM(${usageMetrics.tokensUsed})`.mapWith(Number),
        totalMessages: sql`SUM(${usageMetrics.messagesExchanged})`.mapWith(Number),
        uniqueUsers: sql`COUNT(DISTINCT ${usageMetrics.childId})`.mapWith(Number),
        totalSessions: sql`SUM(${usageMetrics.sessionCount})`.mapWith(Number),
      })
      .from(usageMetrics)
      .where(sql`${usageMetrics.date} >= DATE('now', '-${days} days')`)
      .groupBy(usageMetrics.date)
      .orderBy(sql`${usageMetrics.date} DESC`);
  }

  // Get active sessions count
  static async getActiveSessionsCount(): Promise<number> {
    const result = await db
      .select({ count: sql`COUNT(*)`.mapWith(Number) })
      .from(activeUserSessions)
      .where(eq(activeUserSessions.isActive, true));
    
    return result[0]?.count || 0;
  }

  // Get top users by usage
  static async getTopUsersByUsage(limit: number = 10) {
    return await db
      .select({
        childId: usageMetrics.childId,
        childName: childProfiles.name,
        totalMinutes: sql`SUM(${usageMetrics.minutesSpent})`.mapWith(Number),
        totalTokens: sql`SUM(${usageMetrics.tokensUsed})`.mapWith(Number),
        totalMessages: sql`SUM(${usageMetrics.messagesExchanged})`.mapWith(Number),
        avgSessionLength: sql`AVG(${usageMetrics.minutesSpent} * 1.0 / NULLIF(${usageMetrics.sessionCount}, 0))`.mapWith(Number),
      })
      .from(usageMetrics)
      .leftJoin(childProfiles, eq(usageMetrics.childId, childProfiles.id))
      .groupBy(usageMetrics.childId, childProfiles.name)
      .orderBy(sql`SUM(${usageMetrics.minutesSpent}) DESC`)
      .limit(limit);
  }
}

// Middleware to automatically track API usage
export function trackApiUsage(tokensUsed: number) {
  return async (req: any, res: any, next: any) => {
    const sessionId = req.headers['x-session-id'];
    if (sessionId) {
      await UsageTrackingService.updateSessionActivity(sessionId, tokensUsed, 1);
    }
    next();
  };
}