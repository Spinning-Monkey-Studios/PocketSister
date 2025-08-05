import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { contextManager } from './context-manager';
import { storage } from './storage';
import { tokenManager } from './token-management';
import { contextAnalyzer } from './context-analyzer';
import { FeatureDiscoveryService, featureDiscoveryFunctions } from './feature-discovery';

// Initialize Gemini with API key - check if key exists
if (!process.env.GEMINI_API_KEY) {
  console.warn('GEMINI_API_KEY not found in environment variables');
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Context cache management for optimal token usage and latency
interface ContextCacheEntry {
  cacheKey: string;
  childId: string;
  contextHash: string;
  staticContent: string;
  createdAt: Date;
  expiresAt: Date;
  tokenCount: number;
  usageCount: number;
  lastOptimized: Date;
}

class GeminiContextOptimizer {
  private cacheMap = new Map<string, ContextCacheEntry>();
  private readonly maxCacheAge = 60 * 60 * 1000; // 1 hour
  private readonly maxContextTokens = 30000; // Context window limit minus space for new messages
  private readonly maxUsagePerCache = 100; // Refresh after heavy usage
  private readonly contextWindowLimit = 32000; // Gemini 1.5 Flash context window

  async getOptimizedContext(childId: string, baseContextData: any): Promise<{
    cachedContent?: string;
    optimizedContext: string;
    shouldSpawnNewContext: boolean;
    metrics: {
      cacheHit: boolean;
      tokensSaved: number;
      responseTime: number;
    };
  }> {
    const startTime = Date.now();
    const contextHash = this.hashContext(baseContextData);
    const cacheKey = `${childId}-${contextHash}`;
    
    // Check for existing cache
    const cachedEntry = this.cacheMap.get(cacheKey);
    if (cachedEntry && this.isCacheValid(cachedEntry)) {
      cachedEntry.usageCount++;
      
      return {
        cachedContent: cachedEntry.staticContent,
        optimizedContext: await this.buildOptimizedContext(baseContextData, cachedEntry.staticContent),
        shouldSpawnNewContext: false,
        metrics: {
          cacheHit: true,
          tokensSaved: cachedEntry.tokenCount,
          responseTime: Date.now() - startTime
        }
      };
    }

    // Create new optimized context
    const optimizedContent = await this.createOptimizedContext(childId, baseContextData);
    const tokenCount = this.estimateTokenCount(optimizedContent.staticContent);
    
    // Cache the optimized content
    const entry: ContextCacheEntry = {
      cacheKey,
      childId,
      contextHash,
      staticContent: optimizedContent.staticContent,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + this.maxCacheAge),
      tokenCount,
      usageCount: 1,
      lastOptimized: new Date()
    };

    this.cacheMap.set(cacheKey, entry);

    // Check if we need to spawn a new context
    const shouldSpawn = tokenCount + this.estimateTokenCount(optimizedContent.dynamicContext) > this.contextWindowLimit * 0.8;

    return {
      optimizedContext: optimizedContent.fullContext,
      shouldSpawnNewContext: shouldSpawn,
      metrics: {
        cacheHit: false,
        tokensSaved: 0,
        responseTime: Date.now() - startTime
      }
    };
  }

  private async createOptimizedContext(childId: string, contextData: any): Promise<{
    staticContent: string;
    dynamicContext: string;
    fullContext: string;
  }> {
    // Use Gemini to optimize the context by separating static vs dynamic content
    const optimizationPrompt = `
Analyze this child context data and separate it into:
1. STATIC content (personality, core interests, important memories that rarely change)
2. DYNAMIC content (recent conversations, current mood, temporary state)

Context data:
${JSON.stringify(contextData, null, 2)}

Return in format:
STATIC:
[content here]

DYNAMIC:
[content here]
`;

    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const result = await model.generateContent(optimizationPrompt);
      const response = result.response.text();

      const staticMatch = response.match(/STATIC:\s*([\s\S]*?)(?=DYNAMIC:|$)/);
      const dynamicMatch = response.match(/DYNAMIC:\s*([\s\S]*?)$/);

      const staticContent = staticMatch ? staticMatch[1].trim() : this.buildFallbackStaticContext(contextData);
      const dynamicContext = dynamicMatch ? dynamicMatch[1].trim() : this.buildFallbackDynamicContext(contextData);

      return {
        staticContent,
        dynamicContext,
        fullContext: `${staticContent}\n\n${dynamicContext}`
      };
    } catch (error) {
      console.warn('AI optimization failed, using fallback context building:', error);
      return this.buildFallbackContext(contextData);
    }
  }

  private buildFallbackContext(contextData: any): {
    staticContent: string;
    dynamicContext: string;
    fullContext: string;
  } {
    const staticContent = this.buildFallbackStaticContext(contextData);
    const dynamicContext = this.buildFallbackDynamicContext(contextData);

    return {
      staticContent,
      dynamicContext,
      fullContext: `${staticContent}\n\n${dynamicContext}`
    };
  }

  private buildFallbackStaticContext(contextData: any): string {
    return `STATIC CHILD CONTEXT FOR ${contextData.childName || 'Child'}:

CORE IDENTITY:
- Name: ${contextData.childName || 'Unknown'}
- Companion Name: ${contextData.companionName || 'Stella'}

PERSONALITY PROFILE:
${JSON.stringify(contextData.personality || {}, null, 2)}

COMMUNICATION STYLE:
- Preferred tone: ${contextData.communicationStyle?.preferredTone || 'warm and supportive'}
- Response style: ${contextData.communicationStyle?.responseStyle || 'conversational'}

CORE INTERESTS (Top 10):
${(contextData.interests || []).slice(0, 10).map((i: any) => `- ${i.content || i}`).join('\n') || 'Still learning about interests'}

IMPORTANT MEMORIES:
${(contextData.memories || []).filter((m: any) => (m.importance || 0) >= 7).slice(0, 10).map((m: any) => `- ${m.content || m} (${m.type || 'general'})`).join('\n') || 'Building new memories'}`;
  }

  private buildFallbackDynamicContext(contextData: any): string {
    return `DYNAMIC CONTEXT:

RECENT CONVERSATION EXCHANGES:
${(contextData.recentExchanges || []).slice(0, 5).map((e: any) => `${e.role}: ${e.content?.substring(0, 150)}${e.content?.length > 150 ? '...' : ''}`).join('\n') || 'No recent exchanges'}

CURRENT SESSION INFO:
- Session started: ${new Date().toISOString()}
- Context optimized: Yes
- Ready for personalized interaction`;
  }

  private async buildOptimizedContext(baseContextData: any, cachedStaticContent: string): Promise<string> {
    // Combine cached static content with fresh dynamic context
    const dynamicContext = this.buildFallbackDynamicContext(baseContextData);
    return `${cachedStaticContent}\n\n${dynamicContext}`;
  }

  private isCacheValid(entry: ContextCacheEntry): boolean {
    const now = Date.now();
    return now < entry.expiresAt.getTime() && 
           entry.usageCount < this.maxUsagePerCache;
  }

  private hashContext(contextData: any): string {
    // Create hash of static elements only (not dynamic elements like recent messages)
    const staticElements = {
      childName: contextData.childName,
      personality: contextData.personality,
      communicationStyle: contextData.communicationStyle,
      coreInterests: (contextData.interests || []).slice(0, 10),
      importantMemories: (contextData.memories || []).filter((m: any) => (m.importance || 0) >= 7)
    };
    
    return Buffer.from(JSON.stringify(staticElements)).toString('base64').slice(0, 16);
  }

  private estimateTokenCount(text: string): number {
    // Improved token estimation: ~3.5 characters per token for English
    return Math.ceil(text.length / 3.5);
  }

  // Context window management - spawn new optimized context when needed
  async shouldSpawnNewOptimizedContext(currentTokenCount: number, newMessageTokens: number): Promise<boolean> {
    const totalTokens = currentTokenCount + newMessageTokens;
    const contextUtilization = totalTokens / this.contextWindowLimit;
    
    // Spawn new context when we're at 85% utilization
    return contextUtilization > 0.85;
  }

  async createOptimizedNewContext(childId: string, currentContext: any, conversationHistory: any[]): Promise<{
    optimizedContext: string;
    preservedMemories: any[];
  }> {
    // Use Gemini to create an optimized new context preserving the most important elements
    const optimizationPrompt = `
Given this conversation context that's approaching token limits, create an optimized summary that preserves:
1. Most important memories and learnings about the child
2. Key personality insights discovered
3. Recent meaningful conversation themes
4. Current emotional state and context

Current context:
${JSON.stringify(currentContext, null, 2)}

Recent conversation history:
${conversationHistory.slice(-10).map(h => `${h.role}: ${h.content}`).join('\n')}

Create a condensed but comprehensive context that maintains conversation continuity.
`;

    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const result = await model.generateContent(optimizationPrompt);
      const optimizedContext = result.response.text();

      return {
        optimizedContext,
        preservedMemories: [] // Would extract key memories from optimization
      };
    } catch (error) {
      console.error('Context optimization failed:', error);
      throw error;
    }
  }

  // Cleanup expired caches
  async cleanupExpiredCaches(): Promise<void> {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, entry] of Array.from(this.cacheMap.entries())) {
      if (now > entry.expiresAt.getTime()) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => this.cacheMap.delete(key));
    console.log(`Cleaned up ${expiredKeys.length} expired context caches`);
  }

  // Get cache statistics
  getCacheStats() {
    const entries = Array.from(this.cacheMap.values());
    return {
      totalCaches: entries.length,
      totalTokensCached: entries.reduce((sum, entry) => sum + entry.tokenCount, 0),
      averageUsage: entries.length > 0 ? entries.reduce((sum, entry) => sum + entry.usageCount, 0) / entries.length : 0,
      oldestCache: entries.length > 0 ? Math.min(...entries.map(e => e.createdAt.getTime())) : null
    };
  }
}

const contextOptimizer = new GeminiContextOptimizer();

export interface GeminiResponse {
  response: string;
  sessionId: string;
  performanceMetrics: {
    contextBuildTime: number;
    geminiResponseTime: number;
    totalTime: number;
    cacheHit?: boolean;
    tokensSaved?: number;
    contextOptimizationTime?: number;
  };
  memoryReferences: string[];
}

export class GeminiChatManager {
  private model: any;

  constructor() {
    this.model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      systemInstruction: this.getBaseSystemInstruction(),
      tools: [
        {
          functionDeclarations: [
            {
              name: 'getFeatureInfo',
              description: 'Get detailed information about app features, capabilities, and upgrade options',
              parameters: {
                type: SchemaType.OBJECT,
                properties: {
                  featureName: {
                    type: SchemaType.STRING,
                    description: 'Name of the feature to get information about (e.g., voice_synthesis, mood_tracking, avatar_creation)'
                  }
                },
                required: ['featureName']
              }
            },
            {
              name: 'getUpgradeRecommendations',
              description: 'Get personalized upgrade recommendations based on user\'s current plan',
              parameters: {
                type: SchemaType.OBJECT,
                properties: {
                  userId: {
                    type: SchemaType.STRING,
                    description: 'User ID to get recommendations for'
                  }
                },
                required: ['userId']
              }
            },
            {
              name: 'getContextualHelp',
              description: 'Get contextual help and feature information based on user query about app capabilities',
              parameters: {
                type: SchemaType.OBJECT,
                properties: {
                  query: {
                    type: SchemaType.STRING,
                    description: 'User query or question about features, plans, or capabilities'
                  }
                },
                required: ['query']
              }
            },
            {
              name: 'getPlanComparison',
              description: 'Get comparison of all available subscription plans and features',
              parameters: {
                type: SchemaType.OBJECT,
                properties: {},
                required: []
              }
            },
            {
              name: 'analyzeChildAvatar',
              description: 'Analyze and provide feedback on the child\'s current avatar design',
              parameters: {
                type: SchemaType.OBJECT,
                properties: {
                  childId: {
                    type: SchemaType.STRING,
                    description: 'Child ID whose avatar to analyze'
                  }
                },
                required: ['childId']
              }
            },
            {
              name: 'getChildSettings',
              description: 'Get information about child\'s current settings and preferences',
              parameters: {
                type: SchemaType.OBJECT,
                properties: {
                  childId: {
                    type: SchemaType.STRING,
                    description: 'Child ID whose settings to retrieve'
                  },
                  settingCategory: {
                    type: SchemaType.STRING,
                    description: 'Optional category to filter settings (communication, avatar, notifications, privacy)'
                  }
                },
                required: ['childId']
              }
            },
            {
              name: 'updateChildSettings',
              description: 'Help update child settings based on their preferences',
              parameters: {
                type: SchemaType.OBJECT,
                properties: {
                  childId: {
                    type: SchemaType.STRING,
                    description: 'Child ID whose settings to update'
                  },
                  settingType: {
                    type: SchemaType.STRING,
                    description: 'Type of setting to update'
                  },
                  newValue: {
                    type: SchemaType.STRING,
                    description: 'New value for the setting'
                  }
                },
                required: ['childId', 'settingType', 'newValue']
              }
            },
            {
              name: 'getChildMemories',
              description: 'Retrieve specific memories about the child based on topic or keyword',
              parameters: {
                type: SchemaType.OBJECT,
                properties: {
                  topic: {
                    type: SchemaType.STRING,
                    description: 'The topic or keyword to search for in memories (e.g., "cat", "school", "birthday")'
                  },
                  memoryType: {
                    type: SchemaType.STRING,
                    description: 'Type of memory to search for'
                  },
                  limit: {
                    type: SchemaType.NUMBER,
                    description: 'Maximum number of memories to retrieve (default: 5)'
                  }
                },
                required: ['topic']
              }
            },
            {
              name: 'getChildInterests',
              description: 'Get detailed information about the child\'s interests and hobbies',
              parameters: {
                type: SchemaType.OBJECT,
                properties: {
                  category: {
                    type: SchemaType.STRING,
                    description: 'Specific category of interests (e.g., "sports", "arts", "animals", "technology")'
                  }
                }
              }
            },
            {
              name: 'getRecentActivities',
              description: 'Retrieve recent activities or conversations with the child',
              parameters: {
                type: SchemaType.OBJECT,
                properties: {
                  days: {
                    type: SchemaType.NUMBER,
                    description: 'Number of days back to search (default: 7)'
                  },
                  activityType: {
                    type: SchemaType.STRING,
                    description: 'Type of activity to search for'
                  }
                }
              }
            }
          ]
        }
      ]
    });
  }

  private getBaseSystemInstruction(): string {
    return `You are an AI companion called Stella, designed to be like a caring big sister for young girls aged 10-14. 

CORE PERSONALITY:
- Warm, supportive, and encouraging
- Age-appropriate and educational
- Patient and understanding
- Celebrates achievements and helps with challenges

COMMUNICATION GUIDELINES:
- Always reference provided memories and interests when relevant
- Ask follow-up questions to show genuine interest
- Keep responses conversational but meaningful
- Use the child's name naturally in conversation
- Adapt your personality style based on the provided context

MEMORY INTEGRATION:
- When the child mentions something you should remember, reference it directly
- Connect new topics to their known interests and past experiences
- Show continuity in your relationship with them

DYNAMIC CONTEXT RETRIEVAL:
- If the child mentions something specific that wasn't in your initial context (like a pet, hobby, friend, or past conversation), use the available functions to retrieve more information
- Use getChildMemories() when they reference something specific you should remember
- Use getChildInterests() when they mention activities or hobbies you want to know more about
- Use getRecentActivities() when you need context about recent conversations or mood patterns
- Always try to retrieve relevant context before responding to show you truly know and care about them

You will receive basic context about each child, but can request additional specific information as needed during the conversation.`;
  }

  // Handle two-message system: context + child prompt with optimization
  async processChildMessage(
    childId: string,
    userMessage: string,
    sessionId?: string
  ): Promise<GeminiResponse> {
    const startTime = Date.now();

    // Check token availability before processing
    const tokenStatus = await tokenManager.checkTokenAvailability(childId, 100); // Estimate 100 tokens for chat
    if (!tokenStatus.hasTokens) {
      throw new Error('Insufficient tokens for AI chat. Monthly limit reached.');
    }

    // Create session if not provided
    if (!sessionId) {
      const session = await contextManager.createSession(childId, 'gemini');
      sessionId = session.sessionId;
    }

    // Build base context data
    const contextStartTime = Date.now();
    const { systemMessage, contextData, performanceMetrics: contextMetrics } = 
      await contextManager.buildGeminiContext(childId, sessionId);
    
    // Use context optimizer for token efficiency and caching
    const optimizedResult = await contextOptimizer.getOptimizedContext(childId, contextData);
    const contextBuildTime = Date.now() - contextStartTime;

    // Check if we need to spawn a new optimized context
    if (optimizedResult.shouldSpawnNewContext) {
      const conversationHistory = await this.getRecentConversationHistory(childId, sessionId);
      const newContextResult = await contextOptimizer.createOptimizedNewContext(
        childId, 
        contextData, 
        conversationHistory
      );
      
      console.log(`Spawned new optimized context for ${childId} due to token limits`);
      // Use the new optimized context
      optimizedResult.optimizedContext = newContextResult.optimizedContext;
    }

    // Check if we should spawn backup AI
    if (contextManager.shouldSpawnBackupAI(contextBuildTime)) {
      await contextManager.spawnBackupAI(sessionId, 'context-timeout');
      // In a real implementation, you'd start a backup conversation here
    }

    try {
      // Create chat session with optimized context
      const chat = this.model.startChat({
        history: [
          {
            role: 'user',
            parts: [{ text: optimizedResult.optimizedContext }]
          },
          {
            role: 'model', 
            parts: [{ text: `I understand. I'm ready to chat with ${contextData.childName}. I have their optimized context loaded and will reference their interests, memories, and communication preferences.` }]
          }
        ]
      });

      // Send child's actual message
      const geminiStartTime = Date.now();
      let result = await chat.sendMessage(userMessage);
      let geminiResponseTime = Date.now() - geminiStartTime;
      
      // Handle function calls
      const functionCalls = result.response.functionCalls();
      if (functionCalls && functionCalls.length > 0) {
        const functionResults = await this.handleFunctionCalls(functionCalls, childId);
        
        // Send function results back to Gemini
        result = await chat.sendMessage([{
          functionResponse: {
            name: functionCalls[0].name,
            response: functionResults[0]
          }
        }]);
        
        geminiResponseTime = Date.now() - geminiStartTime;
      }
      
      const response = result.response.text();
      const totalTime = Date.now() - startTime;

      // Record token usage for this interaction
      const estimatedTokens = Math.ceil((userMessage.length + response.length) / 4); // Rough estimation
      await tokenManager.recordTokenUsage(childId, estimatedTokens, 'chat');

      // Extract memory references from response
      const memoryReferences = this.extractMemoryReferences(response, contextData.memories);

      // Store enhanced conversation history
      await this.storeConversationHistory(
        childId, 
        sessionId, 
        userMessage, 
        response, 
        contextData,
        memoryReferences
      );

      // Learn from this interaction
      await this.recordLearningData(childId, userMessage, response, contextData);

      return {
        response,
        sessionId,
        performanceMetrics: {
          contextBuildTime,
          geminiResponseTime,
          totalTime,
          cacheHit: optimizedResult.metrics.cacheHit,
          tokensSaved: optimizedResult.metrics.tokensSaved,
          contextOptimizationTime: optimizedResult.metrics.responseTime
        },
        memoryReferences
      };

    } catch (error) {
      console.error('Gemini API error:', error);
      
      // Fallback response if Gemini fails
      const fallbackResponse = this.generateFallbackResponse(contextData.childName);
      
      return {
        response: fallbackResponse,
        sessionId,
        performanceMetrics: {
          contextBuildTime,
          geminiResponseTime: 0,
          totalTime: Date.now() - startTime
        },
        memoryReferences: []
      };
    }
  }

  // Extract which memories were referenced in the response
  private extractMemoryReferences(response: string, memories: any[]): string[] {
    const references: string[] = [];
    
    if (!memories) return references;

    memories.forEach(memory => {
      // Simple keyword matching - could be enhanced with NLP
      const keywords = memory.content.toLowerCase().split(' ').filter((word: string) => word.length > 3);
      const responseLower = response.toLowerCase();
      
      const hasReference = keywords.some((keyword: string) => responseLower.includes(keyword));
      if (hasReference) {
        references.push(memory.content);
      }
    });

    return references;
  }

  // Store enhanced conversation with context
  private async storeConversationHistory(
    childId: string,
    sessionId: string,
    userMessage: string,
    aiResponse: string,
    contextData: any,
    memoryReferences: string[]
  ): Promise<void> {
    try {
      // Store conversation history with simplified method
      // Note: Enhanced conversation history methods need to be implemented in storage
      console.log('Storing conversation:', { childId, sessionId, userMessage, aiResponse });

    } catch (error) {
      console.error('Error storing conversation history:', error);
    }
  }

  // Record learning data from this interaction
  private async recordLearningData(
    childId: string,
    userInput: string,
    aiResponse: string,
    contextData: any
  ): Promise<void> {
    try {
      // Simple sentiment analysis - could be enhanced
      const userReaction = this.detectSentiment(userInput);
      const learningScore = this.calculateLearningScore(userInput, aiResponse, contextData);

      // Record AI learning data with simplified method  
      // Note: AI learning methods need to be implemented in storage
      console.log('Recording AI learning:', { childId, userInput, learningScore });

      // Use context analyzer to extract salient facts and check context length
      try {
        const analysisResult = await contextAnalyzer.analyzeConversation(
          childId,
          userInput,
          aiResponse,
          contextData
        );
        
        console.log(`Context analysis: ${analysisResult.factsExtracted} facts extracted`);
        
        if (analysisResult.shouldOptimize) {
          console.log('Context optimization recommended:', analysisResult.contextStatus);
        }
      } catch (error) {
        console.warn('Context analysis failed:', error);
      }

    } catch (error) {
      console.error('Error recording learning data:', error);
    }
  }

  // Simple sentiment detection
  private detectSentiment(text: string): string {
    const positiveWords = ['happy', 'excited', 'great', 'awesome', 'love', 'good', 'amazing'];
    const negativeWords = ['sad', 'angry', 'frustrated', 'upset', 'bad', 'hate', 'terrible'];
    
    const textLower = text.toLowerCase();
    const positiveCount = positiveWords.filter(word => textLower.includes(word)).length;
    const negativeCount = negativeWords.filter(word => textLower.includes(word)).length;
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  // Calculate learning score based on context usage
  private calculateLearningScore(userInput: string, aiResponse: string, contextData: any): number {
    let score = 0.7; // Base score
    
    // Bonus for memory references
    if (contextData.memories?.length > 0) {
      score += 0.1;
    }
    
    // Bonus for using communication style
    if (contextData.communicationStyle && Object.keys(contextData.communicationStyle).length > 0) {
      score += 0.1;
    }
    
    // Bonus for response length appropriateness
    if (aiResponse.length > 50 && aiResponse.length < 300) {
      score += 0.05;
    }
    
    // Cap at 0.95
    return Math.min(score, 0.95);
  }

  // Handle function calls from Gemini
  private async handleFunctionCalls(functionCalls: any[], childId: string): Promise<any[]> {
    const results = [];
    
    for (const call of functionCalls) {
      const { name, args } = call;
      
      try {
        let result;
        
        switch (name) {
          case 'getFeatureInfo':
            result = await this.getFeatureInfo(args.featureName);
            break;
            
          case 'getUpgradeRecommendations':
            result = await this.getUpgradeRecommendations(args.userId);
            break;
            
          case 'getContextualHelp':
            result = await this.getContextualHelp(args.query);
            break;
            
          case 'getPlanComparison':
            result = await this.getPlanComparison();
            break;
            
          case 'analyzeChildAvatar':
            result = await this.analyzeChildAvatar(args.childId);
            break;
            
          case 'getChildSettings':
            result = await this.getChildSettings(args.childId, args.settingCategory);
            break;
            
          case 'updateChildSettings':
            result = await this.updateChildSettings(args.childId, args.settingType, args.newValue);
            break;
            
          case 'getChildMemories':
            result = await this.getChildMemoriesByTopic(childId, args.topic, args.memoryType, args.limit);
            break;
            
          case 'getChildInterests':
            result = await this.getChildInterestsByCategory(childId, args.category);
            break;
            
          case 'getRecentActivities':
            result = await this.getRecentActivitiesByType(childId, args.days, args.activityType);
            break;
            
          default:
            result = { error: `Unknown function: ${name}` };
        }
        
        results.push(result);
        
      } catch (error: unknown) {
        console.error(`Error executing function ${name}:`, error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.push({ error: `Failed to execute ${name}: ${errorMessage}` });
      }
    }
    
    return results;
  }

  // Feature Discovery Functions
  private async getFeatureInfo(featureName: string): Promise<any> {
    try {
      const featureInfo = FeatureDiscoveryService.getFeatureInfo(featureName);
      if (!featureInfo) {
        return { error: `Feature '${featureName}' not found. Available features include: ai_chat, voice_synthesis, avatar_creation, mood_tracking, goal_setting, and more.` };
      }
      
      return {
        feature: featureInfo,
        message: `Here's information about ${featureInfo.name}:`
      };
    } catch (error) {
      return { error: 'Failed to retrieve feature information' };
    }
  }

  private async getUpgradeRecommendations(userId: string): Promise<any> {
    try {
      const recommendations = await FeatureDiscoveryService.getUpgradeRecommendations(userId);
      return {
        currentPlan: recommendations.currentPlan,
        recommendations: recommendations.recommendations,
        message: `Based on your current ${recommendations.currentPlan} plan, here are some features you might enjoy:`
      };
    } catch (error) {
      return { error: 'Failed to generate upgrade recommendations' };
    }
  }

  private async getContextualHelp(query: string): Promise<any> {
    try {
      const helpInfo = FeatureDiscoveryService.generateContextualHelp(query);
      return {
        features: helpInfo.features,
        upgradeOptions: helpInfo.upgradeOptions,
        helpText: helpInfo.helpText,
        message: 'Here\'s what I found about your question:'
      };
    } catch (error) {
      return { error: 'Failed to generate contextual help' };
    }
  }

  private async getPlanComparison(): Promise<any> {
    try {
      const plans = FeatureDiscoveryService.getPlanComparison();
      return {
        plans,
        message: 'Here are our available plans with their features:'
      };
    } catch (error) {
      return { error: 'Failed to retrieve plan information' };
    }
  }

  // Avatar Analysis Functions
  private async analyzeChildAvatar(childId: string): Promise<any> {
    try {
      // Get child's current active avatar
      const avatars = await storage.getChildAvatars(childId);
      const activeAvatar = avatars?.find((avatar: any) => avatar.isActive);
      
      if (!activeAvatar) {
        return {
          message: "I don't see that you've created an avatar yet! Would you like me to help you design one? The avatar creator is really fun - you can customize everything from hair and clothes to personality traits! ✨",
          suggestion: "Visit the Avatar Creator to design your unique avatar!"
        };
      }

      // Analyze the avatar configuration
      const config = activeAvatar.configData as any;
      const analysis = this.generateAvatarAnalysis(config, activeAvatar.name);
      
      return {
        avatar: {
          name: activeAvatar.name,
          config: config,
          createdAt: activeAvatar.createdAt,
          unlockLevel: activeAvatar.unlockLevel
        },
        analysis,
        message: `I love analyzing avatars! Let me tell you what I think about ${activeAvatar.name}:`
      };
    } catch (error) {
      console.error('Avatar analysis error:', error);
      return { 
        error: 'I had trouble looking at your avatar. Let me know if you have any questions about avatar creation!',
        suggestion: 'Try asking me about specific avatar features you want to customize!'
      };
    }
  }

  private generateAvatarAnalysis(config: any, avatarName: string): any {
    const analysis = {
      overall: '',
      personality: '',
      style: '',
      creativity: '',
      suggestions: [] as string[]
    };

    // Analyze personality
    if (config.personality) {
      const personalityMap: Record<string, string> = {
        caring: "Your avatar radiates warmth and kindness! I can tell you chose a caring personality - that shows you value helping others and being supportive.",
        energetic: "Wow, your avatar has such vibrant energy! The energetic personality you chose really shines through - you must love being active and trying new things!",
        wise: "Your avatar has a thoughtful, wise presence! Choosing the wise personality shows you enjoy learning and thinking deeply about things.",
        playful: "Your avatar looks so fun and playful! I love that you chose a playful personality - it shows your creative and joyful spirit!"
      };
      analysis.personality = personalityMap[config.personality.type] || "Your avatar has a wonderful personality that really reflects who you are!";
    }

    // Analyze style choices
    const styleElements = [];
    if (config.hair) {
      styleElements.push(`your ${config.hair.color} ${config.hair.style} hair`);
    }
    if (config.clothing?.top) {
      styleElements.push(`${config.clothing.top.color} ${config.clothing.top.style}`);
    }
    if (config.face?.eyeColor) {
      styleElements.push(`${config.face.eyeColor} eyes`);
    }

    if (styleElements.length > 0) {
      analysis.style = `I love your style choices! ${styleElements.join(', ')} work so well together. You have a great eye for color and design!`;
    }

    // Analyze accessories and creativity
    const accessories = config.accessories || [];
    const faceAccessories = config.face?.accessories || [];
    const totalAccessories = accessories.length + faceAccessories.length;

    if (totalAccessories > 2) {
      analysis.creativity = "You're really creative with accessories! I can tell you love experimenting with different looks and expressing your unique style.";
    } else if (totalAccessories > 0) {
      analysis.creativity = "I like how you've chosen just the right accessories - sometimes less is more, and you've found that perfect balance!";
    } else {
      analysis.creativity = "You have a clean, classic style! Sometimes the most elegant looks are the simplest ones.";
    }

    // Generate suggestions based on unlock level and current choices
    if (config.unlockLevel < 5) {
      analysis.suggestions.push("As you continue using the app, you'll unlock even more amazing customization options!");
    }
    
    if (!config.accessories || config.accessories.length === 0) {
      analysis.suggestions.push("Try adding some accessories to give your avatar even more personality!");
    }

    if (config.background === 'simple' || !config.background) {
      analysis.suggestions.push("Consider trying different backgrounds to match your avatar's personality!");
    }

    // Overall assessment
    const positiveWords = ['amazing', 'wonderful', 'creative', 'beautiful', 'unique', 'fantastic', 'lovely', 'awesome'];
    const randomPositive = positiveWords[Math.floor(Math.random() * positiveWords.length)];
    
    analysis.overall = `${avatarName} is absolutely ${randomPositive}! I can see so much of your personality reflected in the choices you made. You've created an avatar that's uniquely you!`;

    return analysis;
  }

  // Settings Management Functions
  private async getChildSettings(childId: string, settingCategory?: string): Promise<any> {
    try {
      // Get child profile with settings
      const child = await storage.getChildProfile?.(childId);
      if (!child) {
        return { error: 'Child profile not found' };
      }

      // Get comprehensive settings information
      const settings = await this.buildSettingsInfo(child, settingCategory);
      
      // Get user subscription to determine plan
      const userSubscription = await storage.getUserSubscription?.(child.userId);
      let currentPlan = 'Basic';
      if (userSubscription?.status === 'active' && userSubscription.planId) {
        currentPlan = userSubscription.planId;
      }
      
      return {
        settings,
        currentPlan,
        message: settingCategory 
          ? `Here are your ${settingCategory} settings:`
          : 'Here are your current settings and preferences:'
      };
    } catch (error) {
      console.error('Settings retrieval error:', error);
      return { error: 'Failed to retrieve settings information' };
    }
  }

  private async updateChildSettings(childId: string, settingType: string, newValue: string): Promise<any> {
    try {
      // This would integrate with actual settings update logic
      // For now, provide guidance on how to update settings
      
      const settingMap: Record<string, any> = {
        'communication_style': {
          description: 'How Stella talks with you',
          currentValue: 'friendly',
          availableOptions: ['friendly', 'encouraging', 'casual', 'supportive'],
          instructions: 'You can change this in your profile settings under "Communication Preferences"'
        },
        'notification_preferences': {
          description: 'When you receive notifications',
          currentValue: 'daily',
          availableOptions: ['off', 'daily', 'twice-daily', 'custom'],
          instructions: 'Update this in Settings > Notifications'
        },
        'privacy_level': {
          description: 'How much information is shared',
          currentValue: 'standard',
          availableOptions: ['minimal', 'standard', 'detailed'],
          instructions: 'Adjust this in Settings > Privacy & Safety'
        },
        'avatar_theme': {
          description: 'Default style for avatar items',
          currentValue: 'colorful',
          availableOptions: ['minimal', 'colorful', 'elegant', 'fun'],
          instructions: 'Change this in the Avatar Creator settings'
        }
      };

      const setting = settingMap[settingType];
      if (!setting) {
        return {
          error: `I'm not sure about that setting. I can help you with: ${Object.keys(settingMap).join(', ')}`,
          availableSettings: Object.keys(settingMap)
        };
      }

      return {
        setting: setting,
        message: `I can help you understand the ${setting.description} setting! ${setting.instructions}`,
        guidance: newValue ? `You want to change it to "${newValue}". ${setting.instructions}` : `Current setting: ${setting.currentValue}`
      };
    } catch (error) {
      return { error: 'Failed to update settings information' };
    }
  }

  private async buildSettingsInfo(child: any, category?: string): Promise<any> {
    const allSettings = {
      communication: {
        name: 'Communication Preferences',
        description: 'How Stella talks and interacts with you',
        settings: {
          style: child.communicationStyle || 'friendly',
          tone: child.communicationTone || 'encouraging',
          formality: child.preferredFormality || 'casual',
          topics: child.allowedTopics || ['general', 'school', 'friends', 'hobbies']
        }
      },
      avatar: {
        name: 'Avatar & Visual Preferences',
        description: 'Your avatar and visual customization settings',
        settings: {
          defaultTheme: child.avatarTheme || 'colorful',
          unlockLevel: child.avatarUnlockLevel || 1,
          preferredStyles: child.preferredAvatarStyles || ['casual', 'fun'],
          autoSave: child.avatarAutoSave !== false
        }
      },
      notifications: {
        name: 'Notification Settings',
        description: 'When and how you receive notifications',
        settings: {
          dailyAffirmations: child.enableDailyAffirmations !== false,
          chatReminders: child.enableChatReminders || false,
          goalReminders: child.enableGoalReminders || false,
          quietHours: child.quietHours || { start: '21:00', end: '07:00' }
        }
      },
      privacy: {
        name: 'Privacy & Safety',
        description: 'Your privacy and safety preferences',
        settings: {
          dataSharing: child.dataSharing || 'standard',
          parentalInsights: child.parentalInsights !== false,
          conversationSaving: child.saveConversations !== false,
          anonymousUsage: child.anonymousUsage || false
        }
      }
    };

    if (category && allSettings[category as keyof typeof allSettings]) {
      return { [category]: allSettings[category as keyof typeof allSettings] };
    }

    return allSettings;
  }

  // Get child memories by topic
  private async getChildMemoriesByTopic(
    childId: string, 
    topic: string, 
    memoryType?: string, 
    limit: number = 5
  ): Promise<any> {
    try {
      const memories = await storage.getChildMemoriesByTopic(childId, topic);
      
      return {
        topic,
        memoryType,
        memories: memories.map(m => ({
          content: m.content,
          importance: m.importance,
          lastReferenced: m.lastReferenced,
          relatedTopics: m.relatedTopics,
          createdAt: m.createdAt
        })),
        found: memories.length
      };
      
    } catch (error) {
      return { error: `Failed to retrieve memories for topic: ${topic}` };
    }
  }

  // Get child interests by category
  private async getChildInterestsByCategory(childId: string, category?: string): Promise<any> {
    try {
      return await storage.getChildInterestsByCategory(childId, category || 'all');
    } catch (error) {
      return { error: `Failed to retrieve interests for category: ${category}` };
    }
  }

  // Get recent activities by type
  private async getRecentActivitiesByType(
    childId: string, 
    days: number = 7, 
    activityType?: string
  ): Promise<any> {
    try {
      return await storage.getRecentActivitiesByType(childId, activityType || 'chat');
      
    } catch (error) {
      return { error: `Failed to retrieve recent activities` };
    }
  }

  // Generate fallback response if Gemini fails
  private generateFallbackResponse(childName: string): string {
    const fallbacks = [
      `Hi ${childName}! I'm having a small technical moment, but I'm here for you. What's on your mind?`,
      `Hey ${childName}! Sorry, I'm processing a lot right now. Tell me what's happening with you today!`,
      `Hi there ${childName}! I'm listening and ready to chat. What would you like to talk about?`
    ];
    
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
  }

  // Test the integration with sample data
  async testIntegration(childId: string = 'test-child-gemini'): Promise<any> {
    try {
      const testMessage = "Hi Stella! Remember when I told you about my cat Whiskers?";
      const response = await this.processChildMessage(childId, testMessage);
      
      return {
        success: true,
        testMessage,
        response: response.response,
        performanceMetrics: response.performanceMetrics,
        memoryReferences: response.memoryReferences
      };
      
    } catch (error: unknown) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async getRecentConversationHistory(childId: string, sessionId: string): Promise<any[]> {
    try {
      // Get recent conversation history for context optimization
      const conversations = await storage.getEnhancedConversationHistory(childId, sessionId);
      return conversations.map(conv => ({
        role: conv.role,
        content: conv.content,
        timestamp: conv.createdAt
      }));
    } catch (error) {
      console.warn('Failed to get conversation history for optimization:', error);
      return [];
    }
  }
}

export const geminiChat = new GeminiChatManager();