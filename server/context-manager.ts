import NodeCache from 'node-cache';
import { db } from './db';
import { storage } from './storage';
import {
  contextSessions,
  contextRetrievalLogs,
  remoteContextCache,
  aiInstanceManagement,
  type ContextSession,
  type InsertContextSession,
  type InsertContextRetrievalLog,
  type InsertRemoteContextCache,
  type InsertAiInstanceManagement,
} from '@shared/schema';
import { eq, and, gte, desc } from 'drizzle-orm';

// High-performance in-memory cache for context data
class ContextCache {
  private cache: NodeCache;
  
  constructor() {
    // Cache with 30-minute TTL and 5-minute check period
    this.cache = new NodeCache({ 
      stdTTL: 1800, // 30 minutes
      checkperiod: 300, // 5 minutes
      useClones: false // Better performance
    });
  }

  get(key: string): any {
    return this.cache.get(key);
  }

  set(key: string, value: any, ttl?: number): boolean {
    return this.cache.set(key, value, ttl || 1800);
  }

  del(key: string): number {
    return this.cache.del(key);
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  flush(): void {
    this.cache.flushAll();
  }

  getStats() {
    return this.cache.getStats();
  }
}

export class ContextManager {
  private cache: ContextCache;
  private performanceThreshold = 2000; // 2 seconds

  constructor() {
    this.cache = new ContextCache();
  }

  // Generate unique system identity for AI sessions
  generateSystemIdentity(childId: string): object {
    return {
      systemId: `mps-system-${Date.now()}`,
      childId,
      timestamp: new Date().toISOString(),
      role: 'system',
      platform: 'my-pocket-sister',
      version: '3.1'
    };
  }

  // Create new context session
  async createSession(childId: string, aiProvider: string = 'gemini'): Promise<ContextSession> {
    const sessionId = `session-${childId}-${Date.now()}`;
    const systemIdentity = this.generateSystemIdentity(childId);

    const [session] = await db
      .insert(contextSessions)
      .values({
        sessionId,
        childId,
        aiProvider,
        systemIdentity,
        status: 'active'
      })
      .returning();

    // Pre-load child context into cache
    await this.preloadChildContext(childId);

    return session;
  }

  // Pre-load child-specific context data into memory cache
  async preloadChildContext(childId: string): Promise<void> {
    const startTime = Date.now();

    try {
      // Load child interests and preferences
      const interests = await this.getChildInterests(childId);
      this.cache.set(`interests:${childId}`, interests);

      // Load recent memories (high importance)
      const memories = await this.getRecentMemories(childId);
      this.cache.set(`memories:${childId}`, memories);

      // Load personality profile
      const personality = await this.getPersonalityProfile(childId);
      this.cache.set(`personality:${childId}`, personality);

      // Load recent conversation context
      const recentContext = await this.getRecentConversationContext(childId);
      this.cache.set(`recent_context:${childId}`, recentContext);

      const loadTime = Date.now() - startTime;
      console.log(`Context preloaded for child ${childId} in ${loadTime}ms`);

    } catch (error) {
      console.error('Error preloading child context:', error);
    }
  }

  // Fast context retrieval with fallback to database
  async getChildContextFast(childId: string, contextType: string): Promise<any> {
    const startTime = Date.now();
    const cacheKey = `${contextType}:${childId}`;

    // Try memory cache first
    if (this.cache.has(cacheKey)) {
      const data = this.cache.get(cacheKey);
      const responseTime = Date.now() - startTime;
      
      // Log performance
      await this.logContextRetrieval(childId, contextType, startTime, responseTime, true);
      
      return data;
    }

    // Fallback to database with caching
    try {
      let data;
      switch (contextType) {
        case 'interests':
          data = await this.getChildInterests(childId);
          break;
        case 'memories':
          data = await this.getRecentMemories(childId);
          break;
        case 'personality':
          data = await this.getPersonalityProfile(childId);
          break;
        case 'recent_context':
          data = await this.getRecentConversationContext(childId);
          break;
        default:
          throw new Error(`Unknown context type: ${contextType}`);
      }

      // Cache the result
      this.cache.set(cacheKey, data);
      
      const responseTime = Date.now() - startTime;
      await this.logContextRetrieval(childId, contextType, startTime, responseTime, true);
      
      return data;

    } catch (error) {
      const responseTime = Date.now() - startTime;
      await this.logContextRetrieval(childId, contextType, startTime, responseTime, false, (error as Error).message);
      throw error;
    }
  }

  // Get child interests from AI learning data
  private async getChildInterests(childId: string): Promise<any> {
    // Note: getChildMemories method needs to be implemented
    const memories: any[] = [];
    const interests = memories
      .filter((m: any) => m.memoryType === 'interest')
      .map((m: any) => ({ content: m.content, importance: m.importance }));
    
    return { interests, lastUpdated: new Date().toISOString() };
  }

  // Get recent high-importance memories
  private async getRecentMemories(childId: string): Promise<any> {
    // Note: getChildMemories method needs to be implemented
    const memories: any[] = [];
    const importantMemories = memories
      .filter((m: any) => m.importance >= 7)
      .sort((a: any, b: any) => b.importance - a.importance)
      .slice(0, 10);

    return { 
      memories: importantMemories.map((m: any) => ({
        type: m.memoryType,
        content: m.content,
        importance: m.importance,
        lastReferenced: m.lastReferenced
      })),
      count: importantMemories.length 
    };
  }

  // Get personality profile and communication preferences
  private async getPersonalityProfile(childId: string): Promise<any> {
    // Note: getEmotionalProfile and getChildLearningData methods need to be implemented
    const profile: any = null;
    const learningData: any[] = [];
    
    return {
      emotionalProfile: profile,
      communicationStyle: profile?.communicationStyle || {},
      strengths: profile?.strengths || [],
      recentLearningScore: learningData[0]?.learningScore || 0.8,
      lastAnalysis: profile?.lastAnalysis
    };
  }

  // Get recent conversation context
  private async getRecentConversationContext(childId: string): Promise<any> {
    // Note: getEnhancedConversationHistory method needs to be implemented
    const conversations: any[] = [];
    
    return {
      recentExchanges: conversations.map((c: any) => ({
        role: c.role,
        content: c.content.substring(0, 200), // Truncate for efficiency
        personalityUsed: c.personalityUsed,
        memoryReferences: c.memoryReferences
      })),
      lastSessionId: conversations[0]?.sessionId
    };
  }

  // Log context retrieval performance
  private async logContextRetrieval(
    childId: string, 
    retrievalType: string, 
    startTime: number, 
    responseTime: number, 
    success: boolean, 
    errorMessage?: string
  ): Promise<void> {
    try {
      await db.insert(contextRetrievalLogs).values({
        sessionId: `temp-${childId}-${Date.now()}`, // Will be updated with actual session
        retrievalType,
        startTime: new Date(startTime),
        endTime: new Date(startTime + responseTime),
        responseTime,
        success,
        errorMessage
      });
    } catch (error) {
      console.error('Error logging context retrieval:', error);
    }
  }

  // Build comprehensive context for Gemini AI
  async buildGeminiContext(childId: string, sessionId: string): Promise<{
    systemMessage: string;
    contextData: any;
    performanceMetrics: any;
  }> {
    const startTime = Date.now();

    try {
      // Get all context types in parallel for speed
      const [interests, memories, personality, recentContext] = await Promise.all([
        this.getChildContextFast(childId, 'interests'),
        this.getChildContextFast(childId, 'memories'),
        this.getChildContextFast(childId, 'personality'),
        this.getChildContextFast(childId, 'recent_context')
      ]);

      // Get child profile
      const childProfile = await storage.getChildProfile(childId);

      const systemMessage = this.buildSystemMessage(childProfile, interests, memories, personality);
      
      const contextData = {
        childName: childProfile?.name || 'friend',
        interests: interests.interests,
        memories: memories.memories,
        personality: personality.emotionalProfile,
        communicationStyle: personality.communicationStyle,
        recentExchanges: recentContext.recentExchanges
      };

      const buildTime = Date.now() - startTime;
      const performanceMetrics = {
        buildTime,
        cacheHits: this.cache.getStats().hits,
        cacheMisses: this.cache.getStats().misses
      };

      return { systemMessage, contextData, performanceMetrics };

    } catch (error) {
      console.error('Error building Gemini context:', error);
      throw error;
    }
  }

  // Build system message for Gemini (lighter initial context)
  private buildSystemMessage(childProfile: any, interests: any, memories: any, personality: any): string {
    const childName = childProfile?.name || 'friend';
    const companionName = childProfile?.companionName || 'Stella';
    
    return `You are ${companionName}, a caring AI companion for ${childName}. You are designed to be like a supportive big sister.

SYSTEM IDENTITY: This message is from the My Pocket Sister platform, providing you with ${childName}'s personal context.

CHILD PROFILE:
- Name: ${childName}
- Age: ${childProfile?.age || 'unknown'}
- Companion Name: ${companionName}

TOP INTERESTS:
${interests.interests?.slice(0, 3).map((i: any) => `- ${i.content}`).join('\n') || 'Still learning about their interests'}

RECENT IMPORTANT MEMORIES:
${memories.memories?.slice(0, 3).map((m: any) => `- ${m.content} (${m.type})`).join('\n') || 'Building new memories together'}

COMMUNICATION PREFERENCES:
- Preferred tone: ${personality.communicationStyle?.preferredTone || 'warm and supportive'}
- Response style: ${personality.communicationStyle?.responseStyle || 'conversational'}

Remember: You have access to functions to retrieve more specific information about ${childName}'s memories, interests, and recent activities when needed. Use them when the conversation touches on topics you want to know more about to provide personalized responses.`;
  }

  // Check if backup AI instance should be spawned
  shouldSpawnBackupAI(responseTime: number): boolean {
    return responseTime > this.performanceThreshold;
  }

  // Spawn backup AI for small talk
  async spawnBackupAI(sessionId: string, reason: string): Promise<string> {
    const instanceId = `backup-${sessionId}-${Date.now()}`;
    
    await db.insert(aiInstanceManagement).values({
      instanceId,
      sessionId,
      instanceType: 'backup-smalltalk',
      spawnReason: reason,
      status: 'active'
    });

    return instanceId;
  }

  // Get cache statistics
  getCacheStats() {
    return this.cache.getStats();
  }

  // Clear cache for specific child
  clearChildCache(childId: string): void {
    const keys = ['interests', 'memories', 'personality', 'recent_context'];
    keys.forEach(key => {
      this.cache.del(`${key}:${childId}`);
    });
  }
}

export const contextManager = new ContextManager();