import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

/**
 * Context Window Manager
 * Handles context window limits and payload size validation for Gemini models
 */
export class ContextWindowManager {
  // Gemini model context window limits (in tokens)
  private static readonly MODEL_LIMITS = {
    'gemini-1.5-flash': 1000000,     // 1M tokens base
    'gemini-1.5-pro': 2000000,      // 2M tokens (Pro tier)
    'gemini-1.0-pro': 32000         // 32K tokens legacy
  };

  // Safety buffer to ensure we don't hit exact limits
  private static readonly SAFETY_BUFFER = 0.9; // Use 90% of available context

  private modelName: string;
  private contextLimit: number;
  private detectedTier: 'base' | 'pro' | 'unknown' = 'unknown';

  constructor(modelName: string = 'gemini-1.5-flash') {
    this.modelName = modelName;
    this.contextLimit = ContextWindowManager.MODEL_LIMITS[modelName as keyof typeof ContextWindowManager.MODEL_LIMITS] || 1000000;
  }

  /**
   * Detect API tier by testing model access
   * Pro tier has access to 2M token models, base tier limited to 1M
   */
  async detectApiTier(): Promise<'base' | 'pro'> {
    if (this.detectedTier !== 'unknown') {
      return this.detectedTier;
    }

    try {
      // Try to access Gemini 1.5 Pro (2M tokens) - only available on Pro tier
      const proModel = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
      
      // Test with minimal request to check access
      const testResponse = await proModel.generateContent('Test');
      
      if (testResponse.response) {
        console.log('✅ Detected Pro tier API access (2M token context window available)');
        this.detectedTier = 'pro';
        return 'pro';
      }
    } catch (error: any) {
      // If we get a 403 or model access error, we're on base tier
      if (error.message?.includes('403') || error.message?.includes('not found')) {
        console.log('📊 Detected Base tier API access (1M token context window)');
        this.detectedTier = 'base';
        return 'base';
      }
    }

    // Default to base tier if detection fails
    this.detectedTier = 'base';
    return 'base';
  }

  /**
   * Get effective context limit based on detected tier and model
   */
  async getEffectiveContextLimit(): Promise<number> {
    const tier = await this.detectApiTier();
    
    if (tier === 'pro' && this.modelName === 'gemini-1.5-pro') {
      return Math.floor(ContextWindowManager.MODEL_LIMITS['gemini-1.5-pro'] * ContextWindowManager.SAFETY_BUFFER);
    }
    
    // For base tier or flash model, use 1M limit
    return Math.floor(ContextWindowManager.MODEL_LIMITS['gemini-1.5-flash'] * ContextWindowManager.SAFETY_BUFFER);
  }

  /**
   * Estimate token count for text content
   * More accurate than simple character counting
   */
  estimateTokenCount(text: string): number {
    // Gemini uses approximately 3.5 characters per token for English
    // This is more accurate than the simple 4:1 ratio
    const basicEstimate = Math.ceil(text.length / 3.5);
    
    // Adjust for content type
    const jsonMatch = text.match(/[{}[\]":,]/g);
    if (jsonMatch && jsonMatch.length > text.length * 0.1) {  
      // JSON content tends to be more token-dense
      return Math.ceil(basicEstimate * 1.2);
    }
    
    return basicEstimate;
  }

  /**
   * Check if payload fits within context window before sending
   */
  async validatePayloadSize(components: {
    systemInstruction?: string;
    cachedContext?: string;
    conversationHistory?: string;
    userPrompt: string;
    maxResponseTokens?: number;
  }): Promise<{
    isValid: boolean;
    estimatedTokens: number;
    contextLimit: number;
    utilizationPercentage: number;
    recommendations: string[];
  }> {
    const contextLimit = await this.getEffectiveContextLimit();
    
    // Estimate tokens for each component
    const systemTokens = components.systemInstruction ? this.estimateTokenCount(components.systemInstruction) : 0;
    const cachedTokens = components.cachedContext ? this.estimateTokenCount(components.cachedContext) : 0;
    const historyTokens = components.conversationHistory ? this.estimateTokenCount(components.conversationHistory) : 0;
    const promptTokens = this.estimateTokenCount(components.userPrompt);
    const responseReserve = components.maxResponseTokens || 4000; // Reserve space for response
    
    const totalInputTokens = systemTokens + cachedTokens + historyTokens + promptTokens;
    const totalEstimatedTokens = totalInputTokens + responseReserve;
    
    const utilizationPercentage = (totalEstimatedTokens / contextLimit) * 100;
    const isValid = totalEstimatedTokens <= contextLimit;
    
    const recommendations: string[] = [];
    
    if (!isValid) {
      recommendations.push('Payload exceeds context window limit');
      
      if (historyTokens > contextLimit * 0.5) {
        recommendations.push('Consider truncating conversation history');
      }
      
      if (cachedTokens > contextLimit * 0.6) {
        recommendations.push('Optimize cached context with fact extraction');
      }
      
      recommendations.push('Consider spawning new conversation context');
    } else if (utilizationPercentage > 85) {
      recommendations.push('Context window nearly full - consider optimization');
    } else if (utilizationPercentage > 75) {
      recommendations.push('Monitor context usage - approaching optimization threshold');
    }

    return {
      isValid,
      estimatedTokens: totalEstimatedTokens,
      contextLimit,
      utilizationPercentage,
      recommendations
    };
  }

  /**
   * Get context window utilization breakdown
   */
  getContextBreakdown(components: {
    systemInstruction?: string;
    cachedContext?: string;
    conversationHistory?: string;
    userPrompt: string;
  }) {
    const systemTokens = components.systemInstruction ? this.estimateTokenCount(components.systemInstruction) : 0;
    const cachedTokens = components.cachedContext ? this.estimateTokenCount(components.cachedContext) : 0;
    const historyTokens = components.conversationHistory ? this.estimateTokenCount(components.conversationHistory) : 0;
    const promptTokens = this.estimateTokenCount(components.userPrompt);
    
    const total = systemTokens + cachedTokens + historyTokens + promptTokens;
    
    return {
      systemInstruction: { tokens: systemTokens, percentage: total > 0 ? (systemTokens / total) * 100 : 0 },
      cachedContext: { tokens: cachedTokens, percentage: total > 0 ? (cachedTokens / total) * 100 : 0 },
      conversationHistory: { tokens: historyTokens, percentage: total > 0 ? (historyTokens / total) * 100 : 0 },
      userPrompt: { tokens: promptTokens, percentage: total > 0 ? (promptTokens / total) * 100 : 0 },
      total: { tokens: total, percentage: 100 }
    };
  }

  /**
   * Check optimal model for current context size
   */
  async recommendOptimalModel(estimatedTokens: number): Promise<{
    recommendedModel: string;
    reason: string;
    costEfficiency: 'optimal' | 'acceptable' | 'expensive';
  }> {
    const tier = await this.detectApiTier();
    
    if (estimatedTokens <= 32000) {
      return {
        recommendedModel: 'gemini-1.0-pro',
        reason: 'Context fits in legacy model, most cost-effective',
        costEfficiency: 'optimal'
      };
    }
    
    if (estimatedTokens <= 1000000) {
      return {
        recommendedModel: 'gemini-1.5-flash',
        reason: 'Fits in 1M context window, good balance of performance and cost',
        costEfficiency: 'optimal'
      };
    }
    
    if (tier === 'pro' && estimatedTokens <= 2000000) {
      return {
        recommendedModel: 'gemini-1.5-pro',
        reason: 'Requires 2M context window, only available on Pro tier',
        costEfficiency: 'expensive'
      };
    }
    
    return {
      recommendedModel: 'none',
      reason: 'Context too large for available models, requires optimization',
      costEfficiency: 'expensive'
    };
  }

  /**
   * Get detailed API tier information
   */
  async getApiTierInfo(): Promise<{
    tier: 'base' | 'pro';
    availableModels: string[];
    maxContextWindow: number;
    features: string[];
  }> {
    const tier = await this.detectApiTier();
    
    if (tier === 'pro') {
      return {
        tier: 'pro',
        availableModels: ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-1.0-pro'],
        maxContextWindow: 2000000,
        features: [
          '2M token context window with Gemini 1.5 Pro',
          'Advanced function calling',
          'Higher rate limits',
          'Priority access to new models'
        ]
      };
    }
    
    return {
      tier: 'base',
      availableModels: ['gemini-1.5-flash', 'gemini-1.0-pro'],
      maxContextWindow: 1000000,
      features: [
        '1M token context window with Gemini 1.5 Flash',
        'Standard function calling',
        'Base rate limits',
        'Access to stable models'
      ]
    };
  }
}

export const contextWindowManager = new ContextWindowManager();