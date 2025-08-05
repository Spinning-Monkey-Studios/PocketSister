import { 
  ConversationMemory, 
  InsertConversationMemory,
  AiLearningData, 
  InsertAiLearningData,
  EmotionalProfile, 
  InsertEmotionalProfile,
  EnhancedConversationHistory,
  InsertEnhancedConversationHistory
} from "@shared/schema";

export interface IAiPersonalizationEngine {
  // Memory Management
  storeMemory(memory: InsertConversationMemory): Promise<ConversationMemory>;
  getMemoriesByChild(childId: string, limit?: number): Promise<ConversationMemory[]>; 
  getMemoriesByType(childId: string, memoryType: string): Promise<ConversationMemory[]>;
  updateMemoryImportance(memoryId: string, importance: number): Promise<void>;
  
  // Learning & Adaptation
  recordInteraction(interaction: InsertAiLearningData): Promise<AiLearningData>;
  analyzeUserReaction(childId: string, interactionId: string, reaction: string): Promise<void>;
  getPersonalityAdaptations(childId: string): Promise<any>;
  
  // Emotional Intelligence
  updateEmotionalProfile(childId: string, profileData: Partial<InsertEmotionalProfile>): Promise<EmotionalProfile>;
  getEmotionalProfile(childId: string): Promise<EmotionalProfile | undefined>;
  analyzeEmotionalPatterns(childId: string): Promise<any>;
  
  // Enhanced Conversation
  storeEnhancedMessage(message: InsertEnhancedConversationHistory): Promise<EnhancedConversationHistory>;
  getConversationContext(childId: string, sessionId: string): Promise<EnhancedConversationHistory[]>;
  findRelevantMemories(childId: string, currentInput: string): Promise<ConversationMemory[]>;
  
  // AI Intelligence
  generatePersonalizedResponse(childId: string, userInput: string, sessionId: string): Promise<{
    response: string;
    emotionalTone: string;
    personalityUsed: string;
    memoriesReferenced: string[];
    adaptationApplied: any;
  }>;
}

export class AiPersonalizationEngine implements IAiPersonalizationEngine {
  constructor(private storage: any) {}

  async storeMemory(memory: InsertConversationMemory): Promise<ConversationMemory> {
    return await this.storage.createConversationMemory(memory);
  }

  async getMemoriesByChild(childId: string, limit: number = 20): Promise<ConversationMemory[]> {
    return await this.storage.getConversationMemories(childId, limit);
  }

  async getMemoriesByType(childId: string, memoryType: string): Promise<ConversationMemory[]> {
    return await this.storage.getConversationMemoriesByType(childId, memoryType);
  }

  async updateMemoryImportance(memoryId: string, importance: number): Promise<void> {
    await this.storage.updateConversationMemoryImportance(memoryId, importance);
  }

  async recordInteraction(interaction: InsertAiLearningData): Promise<AiLearningData> {
    return await this.storage.createAiLearningData(interaction);
  }

  async analyzeUserReaction(childId: string, interactionId: string, reaction: string): Promise<void> {
    // Update learning data with user reaction
    await this.storage.updateAiLearningReaction(interactionId, reaction);
    
    // Adjust personality based on reaction
    const adaptations = await this.getPersonalityAdaptations(childId);
    if (reaction === 'positive') {
      (adaptations as any).reinforcement_score = ((adaptations as any).reinforcement_score || 0) + 0.1;
    } else if (reaction === 'negative') {
      (adaptations as any).adjustment_needed = true;
      (adaptations as any).avoid_patterns = (adaptations as any).avoid_patterns || [];
    }
    
    await this.storage.updatePersonalityAdaptations(childId, adaptations);
  }

  async getPersonalityAdaptations(childId: string): Promise<any> {
    return await this.storage.getPersonalityAdaptations(childId);
  }

  async updateEmotionalProfile(childId: string, profileData: Partial<InsertEmotionalProfile>): Promise<EmotionalProfile> {
    return await this.storage.upsertEmotionalProfile(childId, profileData);
  }

  async getEmotionalProfile(childId: string): Promise<EmotionalProfile | undefined> {
    return await this.storage.getEmotionalProfile(childId);
  }

  async analyzeEmotionalPatterns(childId: string): Promise<any> {
    const recentMoods = await this.storage.getRecentMoodEntries(childId, 30);
    const conversations = await this.storage.getRecentConversations(childId, 20);
    
    // Analyze patterns
    const patterns = {
      dominant_emotions: this.extractDominantEmotions(recentMoods),
      communication_style: this.analyzeCommunicationStyle(conversations),
      trigger_patterns: this.identifyTriggers(recentMoods, conversations),
      coping_effectiveness: this.assessCopingStrategies(recentMoods)
    };

    // Update emotional profile with findings
    await this.updateEmotionalProfile(childId, {
      currentMoodPattern: patterns.dominant_emotions,
      emotionalTriggers: patterns.trigger_patterns,
      communicationStyle: patterns.communication_style,
      lastAnalysis: new Date(),
      updatedAt: new Date()
    });

    return patterns;
  }

  async storeEnhancedMessage(message: InsertEnhancedConversationHistory): Promise<EnhancedConversationHistory> {
    return await this.storage.createEnhancedConversationHistory(message);
  }

  async getConversationContext(childId: string, sessionId: string): Promise<EnhancedConversationHistory[]> {
    return await this.storage.getEnhancedConversationHistory(childId, sessionId);
  }

  async findRelevantMemories(childId: string, currentInput: string): Promise<ConversationMemory[]> {
    // Simple keyword matching for now - could be enhanced with semantic search
    const keywords = this.extractKeywords(currentInput);
    return await this.storage.findMemoriesByKeywords(childId, keywords);
  }

  async generatePersonalizedResponse(childId: string, userInput: string, sessionId: string): Promise<{
    response: string;
    emotionalTone: string;
    personalityUsed: string;
    memoriesReferenced: string[];
    adaptationApplied: any;
  }> {
    // Get conversation context
    const context = await this.getConversationContext(childId, sessionId);
    const memories = await this.findRelevantMemories(childId, userInput);
    const emotionalProfile = await this.getEmotionalProfile(childId);
    const adaptations = await this.getPersonalityAdaptations(childId);

    // Analyze emotional tone of input
    const detectedTone = this.detectEmotionalTone(userInput);
    
    // Select appropriate avatar personality
    const personality = this.selectPersonality(emotionalProfile, detectedTone, adaptations);
    
    // Generate contextual response
    const response = this.generateContextualResponse(
      userInput, 
      context, 
      memories, 
      personality, 
      emotionalProfile
    );

    // Store the memory from this interaction
    await this.storeMemory({
      childId,
      memoryType: 'conversation',
      content: `User said: ${userInput}. I responded with ${personality} personality.`,
      importance: this.calculateImportance(userInput, detectedTone),
      emotionalContext: { tone: detectedTone, personality },
      relatedTopics: this.extractTopics(userInput)
    });

    return {
      response,
      emotionalTone: detectedTone,
      personalityUsed: personality,
      memoriesReferenced: memories.map(m => m.id),
      adaptationApplied: adaptations
    };
  }

  // Helper methods
  private extractDominantEmotions(moods: any[]): any {
    const emotionCounts: Record<string, number> = {};
    moods.forEach(mood => {
      const emotion = mood.emotion;
      emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
    });
    return emotionCounts;
  }

  private analyzeCommunicationStyle(conversations: any[]): any {
    return {
      preferred_length: 'medium', // Could analyze actual message lengths
      formality: 'casual',
      response_time_preference: 'immediate'
    };
  }

  private identifyTriggers(moods: any[], conversations: any[]): any {
    return {
      stress_triggers: ['school', 'friends', 'family'],
      positive_triggers: ['achievements', 'creativity', 'support']
    };
  }

  private assessCopingStrategies(moods: any[]): any {
    return {
      effective_strategies: ['deep_breathing', 'journaling', 'talking'],
      needs_improvement: ['conflict_resolution', 'stress_management']
    };
  }

  private extractKeywords(text: string): string[] {
    // Simple keyword extraction - could use NLP libraries
    return text.toLowerCase()
      .split(' ')
      .filter(word => word.length > 3)
      .slice(0, 5);
  }

  private detectEmotionalTone(input: string): string {
    const lowerInput = input.toLowerCase();
    
    if (lowerInput.includes('sad') || lowerInput.includes('upset') || lowerInput.includes('crying')) {
      return 'sad';
    } else if (lowerInput.includes('angry') || lowerInput.includes('mad') || lowerInput.includes('frustrated')) {
      return 'angry';
    } else if (lowerInput.includes('happy') || lowerInput.includes('excited') || lowerInput.includes('great')) {
      return 'happy';
    } else if (lowerInput.includes('worried') || lowerInput.includes('anxious') || lowerInput.includes('nervous')) {
      return 'anxious';
    }
    
    return 'neutral';
  }

  private selectPersonality(emotionalProfile: any, detectedTone: string, adaptations: any): string {
    // Logic to select most appropriate avatar personality
    if (detectedTone === 'sad' || detectedTone === 'anxious') {
      return 'caring-stella'; // Use Stella's caring personality
    } else if (detectedTone === 'happy' || detectedTone === 'excited') {
      return 'energetic-maya'; // Use Maya's energetic personality  
    } else {
      return 'thoughtful-luna'; // Use Luna's thoughtful personality
    }
  }

  private generateContextualResponse(
    input: string, 
    context: any[], 
    memories: ConversationMemory[], 
    personality: string, 
    emotionalProfile: any
  ): string {
    // This would integrate with your AI provider (OpenAI, Anthropic, etc.)
    // For now, return a contextual response based on personality
    
    const baseResponses = {
      'caring-stella': `I hear you, and I want you to know that your feelings are completely valid. `,
      'energetic-maya': `That sounds really interesting! I love how you're thinking about this. `,
      'thoughtful-luna': `That's a really thoughtful question. Let me share some ideas with you. `
    };

    let response = (baseResponses as any)[personality] || baseResponses['caring-stella'];
    
    // Reference relevant memories
    if (memories.length > 0) {
      const relevantMemory = memories[0];
      response += `I remember when we talked about ${relevantMemory.content.substring(0, 50)}... `;
    }

    // Add contextual advice based on input
    response += this.generateAdvice(input, personality);

    return response;
  }

  private generateAdvice(input: string, personality: string): string {
    const lowerInput = input.toLowerCase();
    
    if (lowerInput.includes('school') || lowerInput.includes('homework')) {
      return `Remember, learning is a journey and it's okay to ask for help when you need it. You're capable of amazing things!`;
    } else if (lowerInput.includes('friend') || lowerInput.includes('social')) {
      return `Friendships can be complicated sometimes, but being yourself is always the best approach. True friends will appreciate the real you.`;
    } else if (lowerInput.includes('family')) {
      return `Family relationships can have ups and downs. Communication and understanding go a long way in building stronger connections.`;
    }
    
    return `You're doing great by talking about this. Keep being open about your thoughts and feelings.`;
  }

  private calculateImportance(input: string, emotionalTone: string): number {
    let importance = 5; // Base importance
    
    // Increase importance for emotional content
    if (emotionalTone !== 'neutral') importance += 2;
    
    // Increase for personal topics
    if (input.toLowerCase().includes('family') || input.toLowerCase().includes('friend')) {
      importance += 1;
    }
    
    return Math.min(importance, 10);
  }

  private extractTopics(text: string): string[] {
    const topics = [];
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('school')) topics.push('education');
    if (lowerText.includes('friend')) topics.push('relationships');  
    if (lowerText.includes('family')) topics.push('family');
    if (lowerText.includes('feel')) topics.push('emotions');
    
    return topics;
  }
}