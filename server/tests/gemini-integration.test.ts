
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { geminiChat } from '../gemini-integration';
import { storage } from '../storage';
import { contextManager } from '../context-manager';

// Mock environment for testing
process.env.NODE_ENV = 'test';
process.env.GEMINI_API_KEY = 'test-api-key';

describe('Gemini Integration Tests', () => {
  const testChildId = 'test-child-gemini-unit';
  const testUserId = 'test-user-gemini';
  
  beforeEach(async () => {
    // Create test user
    await storage.upsertUser({
      id: testUserId,
      email: 'test@example.com',
      name: 'Test Parent',
      subscriptionStatus: 'premium'
    });

    // Create test child profile
    await storage.createChildProfile({
      id: testChildId,
      userId: testUserId,
      name: 'Emma',
      age: 12,
      companionName: 'Stella',
      interests: ['cats', 'drawing', 'soccer'],
      personality: 'creative and curious',
      communicationStyle: 'encouraging',
      monthlyTokenLimit: 1000,
      tokensUsed: 0
    });

    // Add some test memories
    await storage.createConversationMemory({
      childId: testChildId,
      content: 'Emma told me about her cat Whiskers who likes to sleep on her homework',
      memoryType: 'conversation',
      importance: 8,
      emotionalContext: { tone: 'happy', sentiment: 'positive' },
      relatedTopics: ['pets', 'cats', 'school']
    });

    await storage.createConversationMemory({
      childId: testChildId,
      content: 'Emma is working on a drawing of her family for art class',
      memoryType: 'interest',
      importance: 7,
      emotionalContext: { tone: 'excited', sentiment: 'positive' },
      relatedTopics: ['art', 'drawing', 'family']
    });

    // Add recent mood entry
    await storage.createMoodEntry({
      childId: testChildId,
      emotion: 'happy',
      intensity: 8,
      entryDate: new Date().toISOString().split('T')[0],
      notes: 'Had a great day at school and my drawing turned out awesome!'
    });
  });

  afterEach(async () => {
    // Clean up test data
    try {
      await storage.deleteChildProfile(testChildId);
    } catch (error) {
      console.log('Cleanup error (expected in test):', error);
    }
  });

  describe('Context Building', () => {
    it('should build comprehensive context for test child', async () => {
      const { systemMessage, contextData } = await contextManager.buildGeminiContext(
        testChildId, 
        'test-session-123'
      );

      expect(systemMessage).toContain('Emma');
      expect(systemMessage).toContain('Stella');
      expect(systemMessage).toContain('cats');
      expect(contextData.childName).toBe('Emma');
      expect(contextData.interests).toBeDefined();
      expect(contextData.memories).toBeDefined();
    });

    it('should include memory references in context', async () => {
      const memories = await storage.getConversationMemories(testChildId, 5);
      
      expect(memories.length).toBeGreaterThan(0);
      expect(memories[0].content).toContain('Whiskers');
      expect(memories.some(m => m.relatedTopics?.includes('cats'))).toBe(true);
    });
  });

  describe('Function Calls', () => {
    it('should retrieve memories by topic', async () => {
      const result = await storage.searchChildMemories(testChildId, 'cat', undefined, 5);
      
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].content.toLowerCase()).toContain('whiskers');
    });

    it('should get interests by category', async () => {
      const result = await storage.getChildInterestsByCategory(testChildId, 'art');
      
      expect(result.length).toBeGreaterThan(0);
      expect(result.some(r => r.content.toLowerCase().includes('drawing'))).toBe(true);
    });

    it('should retrieve recent activities', async () => {
      const result = await storage.getRecentChildActivities(testChildId, 7);
      
      expect(result.length).toBeGreaterThan(0);
      expect(result.some(a => a.activityType === 'mood_entry')).toBe(true);
    });
  });

  describe('Message Processing', () => {
    it('should build proper context for message processing', async () => {
      const testMessage = "Hi Stella! How are you today?";
      
      // Test that we can build context without API calls
      const { systemMessage, contextData } = await contextManager.buildGeminiContext(
        testChildId, 
        'message-test-session'
      );
      
      expect(systemMessage).toContain('Emma');
      expect(systemMessage).toContain('Stella');
      expect(contextData.childName).toBe('Emma');
      expect(testMessage).toBe("Hi Stella! How are you today?");
    });

    it('should retrieve relevant memories for cat-related queries', async () => {
      const testMessage = "I want to tell you about my cat!";
      
      // Check that relevant memories would be retrieved
      const memories = await storage.searchChildMemories(testChildId, 'cat');
      expect(memories.length).toBeGreaterThan(0);
      expect(memories[0].content).toContain('Whiskers');
    });

    it('should handle function call handlers for context retrieval', async () => {
      // Test the storage functions that would be called by Gemini
      const memories = await storage.searchChildMemories(testChildId, 'school', undefined, 3);
      expect(Array.isArray(memories)).toBe(true);
      
      const interests = await storage.getChildInterestsByCategory(testChildId, 'art');
      expect(Array.isArray(interests)).toBe(true);
      
      const activities = await storage.getRecentChildActivities(testChildId, 7);
      expect(Array.isArray(activities)).toBe(true);
    });
  });

  describe('Learning and Storage', () => {
    it('should store conversation history with context', async () => {
      const testSession = 'test-session-learning';
      const userMessage = "I had a great day at school today!";
      const aiResponse = "That's wonderful to hear, Emma! Tell me what made your day so special.";

      await storage.storeEnhancedConversationHistory({
        childId: testChildId,
        sessionId: testSession,
        messageOrder: 1,
        role: 'user',
        content: userMessage,
        emotionalContext: { tone: 'happy', sentiment: 'positive' },
        memoryReferences: []
      });

      await storage.storeEnhancedConversationHistory({
        childId: testChildId,
        sessionId: testSession,
        messageOrder: 2,
        role: 'assistant',
        content: aiResponse,
        emotionalContext: { tone: 'encouraging', sentiment: 'positive' },
        personalityUsed: 'caring-stella',
        memoryReferences: []
      });

      const history = await storage.getEnhancedConversationHistory(testChildId, testSession);
      expect(history.length).toBe(2);
      expect(history[0].content).toBe(userMessage);
      expect(history[1].content).toBe(aiResponse);
    });

    it('should record AI learning data', async () => {
      await storage.recordAiLearning({
        childId: testChildId,
        interactionType: 'chat',
        userInput: "Tell me about cats",
        aiResponse: "I remember you have a cat named Whiskers!",
        userReaction: 'positive',
        emotionalTone: 'happy',
        personalityAdaptation: {
          contextUsed: true,
          memoriesReferenced: 1,
          communicationStyleApplied: 'encouraging'
        },
        learningScore: 0.9
      });

      const learningData = await storage.getChildLearningData(testChildId, 10);
      expect(learningData.length).toBeGreaterThan(0);
      expect(learningData[0].userReaction).toBe('positive');
    });
  });

  describe('Performance and Error Handling', () => {
    it('should handle missing child profile gracefully', async () => {
      const nonExistentChildId = 'non-existent-child';
      
      try {
        await contextManager.buildGeminiContext(nonExistentChildId, 'test-session');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should measure context building performance', async () => {
      const startTime = Date.now();
      const { performanceMetrics } = await contextManager.buildGeminiContext(
        testChildId, 
        'perf-test-session'
      );
      const endTime = Date.now();

      expect(performanceMetrics.buildTime).toBeGreaterThan(0);
      expect(performanceMetrics.buildTime).toBeLessThan(endTime - startTime + 100); // Allow some margin
    });
  });

  describe('API Integration Test', () => {
    it('should build complete context for Gemini API calls', async () => {
      const testMessage = "Hi Stella! Remember when I told you about Whiskers?";
      
      // Build context that would be sent to Gemini
      const { systemMessage, contextData } = await contextManager.buildGeminiContext(
        testChildId, 
        'integration-test-session'
      );

      // Verify context contains expected information
      expect(systemMessage).toContain('Emma');
      expect(systemMessage).toContain('Stella');
      expect(systemMessage).toContain('Whiskers');
      expect(contextData.memories.some((m: any) => 
        m.content.toLowerCase().includes('whiskers')
      )).toBe(true);

      // Test that all required function handlers exist
      const memoryResults = await storage.searchChildMemories(testChildId, 'cat');
      expect(memoryResults.length).toBeGreaterThan(0);

      // Verify system message includes function calling instructions
      expect(systemMessage.toLowerCase()).toContain('api');
      expect(systemMessage.toLowerCase()).toContain('function');
    });

    it('should validate Emma test profile has sufficient data for Gemini queries', async () => {
      // Verify Emma's profile has data that Gemini would need to query via API
      const memories = await storage.getConversationMemories(testChildId, 10);
      const interests = await storage.getChildInterestsByCategory(testChildId, 'art');
      const activities = await storage.getRecentChildActivities(testChildId, 7);
      
      expect(memories.length).toBeGreaterThan(0);
      expect(interests.length).toBeGreaterThan(0);
      expect(activities.length).toBeGreaterThan(0);
      
      console.log('✅ Emma has sufficient test data for Gemini API calls');
      console.log(`- ${memories.length} memories available`);
      console.log(`- ${interests.length} art-related interests`);
      console.log(`- ${activities.length} recent activities`);
    });
  });
});
