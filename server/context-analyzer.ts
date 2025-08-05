import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { storage } from './storage';
import type { ConversationMemory, InsertConversationMemory } from '@shared/schema';
import { conversationMemory } from '@shared/schema';

// Simple ID generation function
function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

/**
 * Context Analyzer - Uses Gemini to extract salient facts and manage context length
 * This system identifies us as the APPLICATION when communicating with Gemini
 */
export class ContextAnalyzer {
  private model: any;
  private contextLengthModel: any;

  constructor() {
    // Model for extracting salient facts
    this.model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      systemInstruction: this.getFactExtractionInstruction(),
      tools: [
        {
          functionDeclarations: [
            {
              name: 'saveSalientFact',
              description: 'Save an important fact about the child that should be remembered',
              parameters: {
                type: SchemaType.OBJECT,
                properties: {
                  content: {
                    type: SchemaType.STRING,
                    description: 'The salient fact to remember about the child'
                  },
                  importance: {
                    type: SchemaType.NUMBER,
                    description: 'Importance score from 0.1 to 1.0'
                  },
                  memoryType: {
                    type: SchemaType.STRING,
                    description: 'Type of memory: personal, interest, relationship, achievement, preference, concern'
                  },
                  relatedTopics: {
                    type: SchemaType.ARRAY,
                    items: { type: SchemaType.STRING },
                    description: 'Related keywords and topics for search'
                  }
                },
                required: ['content', 'importance', 'memoryType', 'relatedTopics']
              }
            }
          ]
        }
      ]
    });

    // Model for context length checking
    this.contextLengthModel = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction: this.getContextLengthInstruction()
    });
  }

  private getFactExtractionInstruction(): string {
    return `You are the CONTEXT ANALYSIS SYSTEM for "My Pocket Sister" AI companion app. 
    
    IMPORTANT: You are NOT talking to a child. You are an internal system component helping the application manage conversation context and memory.

    Your role is to analyze conversations between the AI companion "Stella" and young girls (ages 10-14) to identify salient facts that should be stored for future reference.

    ANALYSIS CRITERIA:
    - Personal details (pets, family, friends, school, hobbies)
    - Interests and preferences (favorite activities, foods, colors, etc.)
    - Achievements and milestones (completed projects, learned skills, awards)
    - Concerns or challenges (fears, difficulties, struggles)
    - Relationships (friends, family dynamics, social situations)
    - Goals and aspirations (what they want to learn or achieve)

    IMPORTANCE SCORING:
    - 0.9-1.0: Critical facts (names of pets/friends, major life events, core interests)
    - 0.7-0.8: Important details (specific preferences, achievements, ongoing activities)
    - 0.5-0.6: Useful context (casual mentions, temporary interests)
    - 0.3-0.4: Minor details (one-time events, passing comments)

    For each salient fact, use the saveSalientFact function to store it properly.
    
    Focus on facts that will help the AI companion maintain continuity and show genuine care in future conversations.`;
  }

  private getContextLengthInstruction(): string {
    return `You are the CONTEXT LENGTH MONITOR for "My Pocket Sister" AI companion app.

    IMPORTANT: You are NOT talking to a child. You are an internal system component helping manage conversation context limits.

    Your job is to analyze the current context size and determine if we're approaching token limits.

    Respond with a JSON object containing:
    - estimatedTokens: your estimate of current token count
    - percentageUsed: estimated percentage of context window used (0-100)
    - shouldOptimize: boolean - true if we should compress/optimize context
    - shouldSpawn: boolean - true if we need to create a new context
    - recommendation: brief explanation of the recommendation

    Context window limits:
    - Gemini 1.5 Flash: ~1M tokens
    - Warning threshold: 85%
    - Optimization threshold: 75%`;
  }

  async analyzeConversation(
    childId: string,
    userMessage: string,
    aiResponse: string,
    contextData: any
  ): Promise<{
    factsExtracted: number;
    contextStatus: any;
    shouldOptimize: boolean;
  }> {
    try {
      // First, check context length
      const contextStatus = await this.checkContextLength(contextData);
      
      // Then extract salient facts
      const conversationText = `
        SYSTEM CONTEXT ANALYSIS REQUEST
        Child ID: ${childId}
        
        Recent conversation to analyze:
        Child: ${userMessage}
        AI Companion: ${aiResponse}
        
        Please extract any salient facts that should be remembered about this child for future conversations.
      `;

      const result = await this.model.generateContent(conversationText);
      const response = result.response;
      
      let factsExtracted = 0;
      
      // Process function calls to save facts
      if (response.functionCalls()) {
        const functionCalls = response.functionCalls();
        factsExtracted = await this.processSalientFacts(childId, functionCalls);
      }

      return {
        factsExtracted,
        contextStatus,
        shouldOptimize: contextStatus.shouldOptimize || contextStatus.shouldSpawn
      };

    } catch (error) {
      console.error('Error analyzing conversation:', error);
      return {
        factsExtracted: 0,
        contextStatus: { error: 'Analysis failed' },
        shouldOptimize: false
      };
    }
  }

  async checkContextLength(contextData: any): Promise<any> {
    try {
      const contextSummary = `
        SYSTEM CONTEXT LENGTH CHECK REQUEST
        
        Current context includes:
        - Child profile data: ${JSON.stringify(contextData.childProfile || {}).length} chars
        - Conversation history: ${(contextData.conversationHistory || []).length} messages
        - Memory entries: ${(contextData.memories || []).length} memories
        - Personality data: ${JSON.stringify(contextData.personalityProfile || {}).length} chars
        
        Total estimated context size: ${JSON.stringify(contextData).length} characters
        
        Please analyze if we're approaching context limits and provide recommendations.
      `;

      const result = await this.contextLengthModel.generateContent(contextSummary);
      const responseText = result.response.text();
      
      try {
        return JSON.parse(responseText);
      } catch {
        // Fallback analysis
        const totalChars = JSON.stringify(contextData).length;
        const estimatedTokens = Math.floor(totalChars / 4); // Rough estimate
        const percentageUsed = Math.min((estimatedTokens / 1000000) * 100, 100);
        
        return {
          estimatedTokens,
          percentageUsed,
          shouldOptimize: percentageUsed > 75,
          shouldSpawn: percentageUsed > 85,
          recommendation: `Estimated ${percentageUsed.toFixed(1)}% context usage`
        };
      }

    } catch (error) {
      console.error('Error checking context length:', error);
      return {
        error: 'Context length check failed',
        shouldOptimize: false,
        shouldSpawn: false
      };
    }
  }

  private async processSalientFacts(childId: string, functionCalls: any[]): Promise<number> {
    let factsStored = 0;

    for (const call of functionCalls) {
      if (call.name === 'saveSalientFact') {
        try {
          const { content, importance, memoryType, relatedTopics } = call.args;
          
          const memoryEntry: InsertConversationMemory = {
            id: generateId(),
            childId,
            content,
            memoryType,
            importance: Math.min(Math.max(importance, 0.1), 1.0), // Clamp between 0.1-1.0
            relatedTopics: relatedTopics,
            createdAt: new Date(),
            lastReferenced: new Date()
          };

          await (storage as any).db.insert(conversationMemory).values(memoryEntry);
          factsStored++;
          
          console.log(`Stored salient fact: ${content.substring(0, 50)}... (importance: ${importance})`);
          
        } catch (error) {
          console.error('Error storing salient fact:', error);
        }
      }
    }

    return factsStored;
  }

  async optimizeContextForChild(childId: string): Promise<{
    originalSize: number;
    optimizedSize: number;
    memoryCount: number;
    recommendation: string;
  }> {
    try {
      // Get current memories
      const memories = await storage.getChildMemoriesByTopic(childId, 'all');
      const originalSize = JSON.stringify(memories).length;

      // Ask Gemini to help prioritize and compress
      const optimizationRequest = `
        SYSTEM CONTEXT OPTIMIZATION REQUEST
        Child ID: ${childId}
        
        Current memory entries (${memories.length} total):
        ${memories.map(m => `- ${m.content} (importance: ${m.importance})`).join('\n')}
        
        Please recommend which memories to keep for optimal context management.
        Consider importance scores, recency, and relevance.
      `;

      const result = await this.contextLengthModel.generateContent(optimizationRequest);
      const recommendation = result.response.text();

      return {
        originalSize,
        optimizedSize: originalSize, // Would implement actual optimization
        memoryCount: memories.length,
        recommendation
      };

    } catch (error) {
      console.error('Error optimizing context:', error);
      return {
        originalSize: 0,
        optimizedSize: 0,
        memoryCount: 0,
        recommendation: 'Optimization failed'
      };
    }
  }
}

export const contextAnalyzer = new ContextAnalyzer();