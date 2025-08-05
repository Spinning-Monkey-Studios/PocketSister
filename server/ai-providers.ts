import { storage } from './storage';

// Abstract AI Provider Interface
export interface AIProvider {
  id: string;
  name: string;
  initialize(config: AIProviderConfig): Promise<void>;
  chat(request: ChatRequest): Promise<ChatResponse>;
  analyzeAvatar(request: AvatarAnalysisRequest): Promise<AnalysisResponse>;
  getContextualHelp(request: HelpRequest): Promise<HelpResponse>;
  supportsFunctionCalling(): boolean;
  supportsContextCaching(): boolean;
  getCapabilities(): AIProviderCapabilities;
}

// Configuration Types
export interface AIProviderConfig {
  id: string;
  name: string;
  provider: 'google' | 'openai' | 'anthropic' | 'custom';
  endpoint: string;
  apiKey: string;
  model: string;
  isActive: boolean;
  priority: number;
  costPerToken: number;
  rateLimit: {
    requestsPerMinute: number;
    tokensPerMinute: number;
  };
  capabilities: AIProviderCapabilities;
  configuration: {
    temperature: number;
    maxTokens: number;
    systemInstructions: string;
  };
}

export interface AIProviderCapabilities {
  chat: boolean;
  contextCaching: boolean;
  functionCalling: boolean;
  imageAnalysis: boolean;
  voiceSynthesis: boolean;
  streamingResponse: boolean;
  batchProcessing: boolean;
}

// Request/Response Types
export interface ChatRequest {
  childId: string;
  message: string;
  context?: any;
  sessionId?: string;
  features?: string[];
}

export interface ChatResponse {
  response: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  provider: string;
  processingTime: number;
  cached?: boolean;
}

export interface AvatarAnalysisRequest {
  childId: string;
  avatarId?: string;
}

export interface AnalysisResponse {
  analysis: {
    overall: string;
    personality: string;
    style: string;
    creativity: string;
    suggestions: string[];
  };
  usage: TokenUsage;
}

export interface HelpRequest {
  query: string;
  childId?: string;
}

export interface HelpResponse {
  helpText: string;
  features: any[];
  upgradeOptions: any[];
  usage: TokenUsage;
}

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

// AI Provider Manager
export class AIProviderManager {
  private providers: Map<string, AIProvider> = new Map();
  private activeProviderId: string = 'gemini-default';
  private fallbackProviders: string[] = [];

  async initialize(): Promise<void> {
    // Load provider configurations from database
    const configs = await this.loadProviderConfigs();
    
    for (const config of configs) {
      if (config.isActive) {
        const provider = this.createProvider(config);
        await provider.initialize(config);
        this.providers.set(config.id, provider);
        
        if (config.priority === 1) {
          this.activeProviderId = config.id;
        } else {
          this.fallbackProviders.push(config.id);
        }
      }
    }
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    return this.executeWithFallback('chat', request);
  }

  async analyzeAvatar(request: AvatarAnalysisRequest): Promise<AnalysisResponse> {
    return this.executeWithFallback('analyzeAvatar', request);
  }

  async getContextualHelp(request: HelpRequest): Promise<HelpResponse> {
    return this.executeWithFallback('getContextualHelp', request);
  }

  private async executeWithFallback(method: string, request: any): Promise<any> {
    const primaryProvider = this.providers.get(this.activeProviderId);
    
    if (primaryProvider) {
      try {
        const startTime = Date.now();
        const result = await (primaryProvider as any)[method](request);
        const processingTime = Date.now() - startTime;
        
        // Log successful request
        await this.logProviderUsage(this.activeProviderId, method, true, processingTime, result.usage);
        
        return { ...result, provider: this.activeProviderId, processingTime };
      } catch (error) {
        console.error(`Primary provider ${this.activeProviderId} failed:`, error);
        
        // Try fallback providers
        for (const fallbackId of this.fallbackProviders) {
          const fallbackProvider = this.providers.get(fallbackId);
          if (fallbackProvider) {
            try {
              const startTime = Date.now();
              const result = await (fallbackProvider as any)[method](request);
              const processingTime = Date.now() - startTime;
              
              await this.logProviderUsage(fallbackId, method, true, processingTime, result.usage);
              return { ...result, provider: fallbackId, processingTime };
            } catch (fallbackError) {
              console.error(`Fallback provider ${fallbackId} failed:`, fallbackError);
            }
          }
        }
        
        throw new Error('All AI providers failed');
      }
    }
    
    throw new Error('No active AI provider configured');
  }

  private createProvider(config: AIProviderConfig): AIProvider {
    switch (config.provider) {
      case 'google':
        return new GeminiProvider();
      case 'openai':
        return new OpenAIProvider();
      case 'anthropic':
        return new AnthropicProvider();
      default:
        throw new Error(`Unsupported provider: ${config.provider}`);
    }
  }

  private async loadProviderConfigs(): Promise<AIProviderConfig[]> {
    // For now, return default Gemini configuration
    // TODO: Load from database when admin interface is ready
    return [
      {
        id: 'gemini-default',
        name: 'Google Gemini Pro',
        provider: 'google',
        endpoint: 'https://generativelanguage.googleapis.com',
        apiKey: process.env.GEMINI_API_KEY || '',
        model: 'gemini-1.5-pro-002',
        isActive: true,
        priority: 1,
        costPerToken: 0.000125,
        rateLimit: {
          requestsPerMinute: 60,
          tokensPerMinute: 1000000
        },
        capabilities: {
          chat: true,
          contextCaching: true,
          functionCalling: true,
          imageAnalysis: true,
          voiceSynthesis: false,
          streamingResponse: true,
          batchProcessing: false
        },
        configuration: {
          temperature: 0.7,
          maxTokens: 2048,
          systemInstructions: 'You are Stella, a supportive AI companion for young girls.'
        }
      }
    ];
  }

  private async logProviderUsage(
    providerId: string, 
    method: string, 
    success: boolean, 
    processingTime: number, 
    usage?: TokenUsage
  ): Promise<void> {
    try {
      // TODO: Implement provider usage logging in database
      console.log('Provider usage:', {
        providerId,
        method,
        success,
        processingTime,
        usage
      });
    } catch (error) {
      console.error('Failed to log provider usage:', error);
    }
  }

  // Admin methods for provider management
  async switchProvider(providerId: string): Promise<boolean> {
    if (this.providers.has(providerId)) {
      this.activeProviderId = providerId;
      console.log(`Switched to provider: ${providerId}`);
      return true;
    }
    return false;
  }

  async addProvider(config: AIProviderConfig): Promise<void> {
    const provider = this.createProvider(config);
    await provider.initialize(config);
    this.providers.set(config.id, provider);
    
    if (config.priority === 1) {
      this.activeProviderId = config.id;
    }
  }

  async removeProvider(providerId: string): Promise<boolean> {
    if (this.providers.has(providerId)) {
      this.providers.delete(providerId);
      
      // If we removed the active provider, switch to first available
      if (this.activeProviderId === providerId) {
        const firstProvider = Array.from(this.providers.keys())[0];
        if (firstProvider) {
          this.activeProviderId = firstProvider;
        }
      }
      
      return true;
    }
    return false;
  }

  getProviderStatus(): any {
    return {
      activeProvider: this.activeProviderId,
      availableProviders: Array.from(this.providers.keys()),
      fallbackProviders: this.fallbackProviders
    };
  }
}

// Provider Implementations (Abstracts for now)
class GeminiProvider implements AIProvider {
  id = 'gemini';
  name = 'Google Gemini';
  
  async initialize(config: AIProviderConfig): Promise<void> {
    // Initialize Gemini-specific configuration
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    // For now, create a simplified response that matches our interface
    // TODO: Integrate with actual GeminiChatManager once method names are aligned
    return {
      response: `This is a response from ${this.name} provider for: ${request.message}`,
      usage: {
        inputTokens: request.message.length,
        outputTokens: 50,
        totalTokens: request.message.length + 50
      },
      provider: this.id,
      processingTime: 0,
      cached: false
    };
  }

  async analyzeAvatar(request: AvatarAnalysisRequest): Promise<AnalysisResponse> {
    // Implement avatar analysis
    throw new Error('Avatar analysis not implemented for Gemini provider');
  }

  async getContextualHelp(request: HelpRequest): Promise<HelpResponse> {
    // Implement contextual help
    throw new Error('Contextual help not implemented for Gemini provider');
  }

  supportsFunctionCalling(): boolean {
    return true;
  }

  supportsContextCaching(): boolean {
    return true;
  }

  getCapabilities(): AIProviderCapabilities {
    return {
      chat: true,
      contextCaching: true,
      functionCalling: true,
      imageAnalysis: true,
      voiceSynthesis: false,
      streamingResponse: true,
      batchProcessing: false
    };
  }
}

class OpenAIProvider implements AIProvider {
  id = 'openai';
  name = 'OpenAI GPT';
  
  async initialize(config: AIProviderConfig): Promise<void> {
    // Initialize OpenAI configuration
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    // TODO: Implement OpenAI chat integration
    throw new Error('OpenAI provider not implemented yet');
  }

  async analyzeAvatar(request: AvatarAnalysisRequest): Promise<AnalysisResponse> {
    throw new Error('Avatar analysis not implemented for OpenAI provider');
  }

  async getContextualHelp(request: HelpRequest): Promise<HelpResponse> {
    throw new Error('Contextual help not implemented for OpenAI provider');
  }

  supportsFunctionCalling(): boolean {
    return true;
  }

  supportsContextCaching(): boolean {
    return false;
  }

  getCapabilities(): AIProviderCapabilities {
    return {
      chat: true,
      contextCaching: false,
      functionCalling: true,
      imageAnalysis: true,
      voiceSynthesis: true,
      streamingResponse: true,
      batchProcessing: true
    };
  }
}

class AnthropicProvider implements AIProvider {
  id = 'anthropic';
  name = 'Anthropic Claude';
  
  async initialize(config: AIProviderConfig): Promise<void> {
    // Initialize Anthropic configuration
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    // TODO: Implement Anthropic chat integration
    throw new Error('Anthropic provider not implemented yet');
  }

  async analyzeAvatar(request: AvatarAnalysisRequest): Promise<AnalysisResponse> {
    throw new Error('Avatar analysis not implemented for Anthropic provider');
  }

  async getContextualHelp(request: HelpRequest): Promise<HelpResponse> {
    throw new Error('Contextual help not implemented for Anthropic provider');
  }

  supportsFunctionCalling(): boolean {
    return true;
  }

  supportsContextCaching(): boolean {
    return false;
  }

  getCapabilities(): AIProviderCapabilities {
    return {
      chat: true,
      contextCaching: false,
      functionCalling: true,
      imageAnalysis: true,
      voiceSynthesis: false,
      streamingResponse: true,
      batchProcessing: false
    };
  }
}

// Global provider manager instance
export const aiProviderManager = new AIProviderManager();