import { geminiChat } from './gemini-integration';
import { storage } from './storage';
import { conversationMemory, enhancedConversationHistory, childProfiles } from '@shared/schema';

// Simple ID generation function
function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}
import { eq } from 'drizzle-orm';

/**
 * Test script to demonstrate Gemini's dynamic memory retrieval system
 * This shows how Gemini can request additional context when a child mentions
 * something they told it before (e.g., "Remember I told you about my cat Trixie?")
 */

export class MemoryRetrievalTest {
  private testChildId: string;

  constructor() {
    this.testChildId = 'test-child-memory-' + generateId();
  }

  async setupTestData(): Promise<void> {
    console.log('Setting up test data for memory retrieval...');

    // Create test child profile
    const testChild = await storage.createChildProfile({
      userId: 'test-user-memory',
      name: 'Emma',
      age: 12,
      personalityProfile: {
        openness: 0.8,
        conscientiousness: 0.7,
        extraversion: 0.6,
        agreeableness: 0.9,
        neuroticism: 0.3,
        communicationStyle: {
          formality: 'casual',
          energyLevel: 'medium'
        },
        learningData: {
          totalInteractions: 15,
          averageSessionLength: 8.5,
          preferredPersonality: 'caring'
        }
      }
    });

    this.testChildId = testChild.id;

    // Create conversation memories that Gemini can search for
    const memories = [
      {
        id: generateId(),
        childId: this.testChildId,
        content: "Emma told me about her cat named Trixie who loves to play with yarn balls and sits by the window watching birds. Trixie is a tabby cat with green eyes.",
        memoryType: 'pet',
        importance: 0.9,
        relatedTopics: JSON.stringify(['cat', 'Trixie', 'pets', 'animals', 'yarn', 'birds']),
        lastReferenced: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
      },
      {
        id: generateId(),
        childId: this.testChildId,
        content: "Emma mentioned she's learning piano and practicing a song called 'Für Elise'. She finds the middle part challenging but loves the beginning melody.",
        memoryType: 'hobby',
        importance: 0.8,
        relatedTopics: JSON.stringify(['piano', 'music', 'Für Elise', 'practice', 'melody']),
        lastReferenced: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // 5 days ago
      },
      {
        id: generateId(),
        childId: this.testChildId,
        content: "Emma shared that her best friend Sarah moved to another state last month. She misses playing together after school and their weekly sleepovers.",
        memoryType: 'relationship',
        importance: 0.85,
        relatedTopics: JSON.stringify(['friend', 'Sarah', 'moving', 'school', 'sleepovers', 'miss']),
        lastReferenced: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
        createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) // 4 days ago
      },
      {
        id: generateId(),
        childId: this.testChildId,
        content: "Emma loves drawing and recently started experimenting with watercolors. She's particularly interested in painting landscapes and flowers.",
        memoryType: 'interest',
        importance: 0.7,
        relatedTopics: JSON.stringify(['drawing', 'art', 'watercolors', 'painting', 'landscapes', 'flowers']),
        lastReferenced: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
      }
    ];

    // Insert memories directly into the database
    for (const memory of memories) {
      await (storage as any).db.insert(conversationMemory).values(memory);
    }

    // Create some enhanced conversation history
    const conversations = [
      {
        id: generateId(),
        childId: this.testChildId,
        role: 'user',
        content: "I taught Trixie a new trick today! She can now high-five with her paw.",
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
        personalityUsed: 'caring',
        memoryReferences: JSON.stringify(['cat', 'Trixie', 'tricks'])
      },
      {
        id: generateId(),
        childId: this.testChildId,
        role: 'assistant',
        content: "That's amazing, Emma! Trixie sounds so smart. I remember you telling me how she loves to play - now she's learning tricks too! How did you teach her to high-five?",
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000 + 30000), // 6 hours ago + 30 seconds
        personalityUsed: 'caring',
        memoryReferences: JSON.stringify(['cat', 'Trixie', 'play'])
      }
    ];

    for (const conv of conversations) {
      await (storage as any).db.insert(enhancedConversationHistory).values(conv);
    }

    console.log(`✅ Test data created for child: ${this.testChildId}`);
  }

  async testScenario1_CatReference(): Promise<any> {
    console.log('\n🧪 Test Scenario 1: Child mentions cat Trixie');
    console.log('User message: "Remember I told you last week about Trixie?"');
    
    const response = await geminiChat.processChildMessage(
      this.testChildId,
      "Remember I told you last week about Trixie?"
    );
    
    return {
      scenario: 'Cat Reference',
      userMessage: "Remember I told you last week about Trixie?",
      aiResponse: response.response,
      memoryReferences: response.memoryReferences,
      performanceMetrics: response.performanceMetrics
    };
  }

  async testScenario2_FriendReference(): Promise<any> {
    console.log('\n🧪 Test Scenario 2: Child mentions friend Sarah');
    console.log('User message: "I\'m still sad about Sarah moving away. What should I do?"');
    
    const response = await geminiChat.processChildMessage(
      this.testChildId,
      "I'm still sad about Sarah moving away. What should I do?"
    );
    
    return {
      scenario: 'Friend Reference',
      userMessage: "I'm still sad about Sarah moving away. What should I do?",
      aiResponse: response.response,
      memoryReferences: response.memoryReferences,
      performanceMetrics: response.performanceMetrics
    };
  }

  async testScenario3_HobbyReference(): Promise<any> {
    console.log('\n🧪 Test Scenario 3: Child mentions piano practice');
    console.log('User message: "I finally mastered the hard part of that piano song!"');
    
    const response = await geminiChat.processChildMessage(
      this.testChildId,
      "I finally mastered the hard part of that piano song!"
    );
    
    return {
      scenario: 'Hobby Reference',
      userMessage: "I finally mastered the hard part of that piano song!",
      aiResponse: response.response,
      memoryReferences: response.memoryReferences,
      performanceMetrics: response.performanceMetrics
    };
  }

  async runFullTest(): Promise<any> {
    console.log('🚀 Starting Memory Retrieval System Test\n');
    
    try {
      // Setup test data
      await this.setupTestData();
      
      // Run test scenarios
      const results = {
        testId: `memory-test-${Date.now()}`,
        childId: this.testChildId,
        testResults: {
          scenario1: await this.testScenario1_CatReference(),
          scenario2: await this.testScenario2_FriendReference(),
          scenario3: await this.testScenario3_HobbyReference()
        },
        summary: {
          totalScenarios: 3,
          successfulScenarios: 0,
          functionCallsWorking: false,
          memoryRetrievalWorking: false
        }
      };

      // Analyze results
      results.summary.successfulScenarios = Object.values(results.testResults)
        .filter(test => test.aiResponse && test.aiResponse.length > 50).length;
      
      results.summary.functionCallsWorking = Object.values(results.testResults)
        .some(test => test.memoryReferences && test.memoryReferences.length > 0);
      
      results.summary.memoryRetrievalWorking = results.summary.functionCallsWorking;

      console.log('\n📊 Test Results Summary:');
      console.log(`- Successful scenarios: ${results.summary.successfulScenarios}/3`);
      console.log(`- Function calls working: ${results.summary.functionCallsWorking ? '✅' : '❌'}`);
      console.log(`- Memory retrieval working: ${results.summary.memoryRetrievalWorking ? '✅' : '❌'}`);

      return results;
      
    } catch (error) {
      console.error('❌ Test failed:', error);
      return {
        error: error instanceof Error ? error.message : 'Unknown error',
        testId: `memory-test-failed-${Date.now()}`
      };
    }
  }

  async cleanup(): Promise<void> {
    // Clean up test data
    console.log('🧹 Cleaning up test data...');
    try {
      await (storage as any).db.delete(conversationMemory)
        .where(eq(conversationMemory.childId, this.testChildId));
      await (storage as any).db.delete(enhancedConversationHistory)
        .where(eq(enhancedConversationHistory.childId, this.testChildId));
      await (storage as any).db.delete(childProfiles)
        .where(eq(childProfiles.id, this.testChildId));
      console.log('✅ Test data cleaned up');
    } catch (error) {
      console.warn('⚠️ Cleanup warning:', error);
    }
  }
}

// Export function to run the test
export async function runMemoryRetrievalTest(): Promise<any> {
  const test = new MemoryRetrievalTest();
  try {
    const results = await test.runFullTest();
    await test.cleanup();
    return results;
  } catch (error) {
    await test.cleanup();
    throw error;
  }
}