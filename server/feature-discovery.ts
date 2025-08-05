import { storage } from './storage';

/**
 * Feature Discovery Service for AI Assistant
 * Enables Gemini to intelligently respond to user questions about features, 
 * upgrades, and app capabilities
 */

export interface FeatureInfo {
  name: string;
  description: string;
  availability: 'free' | 'basic' | 'premium' | 'family';
  requiredPlan?: string;
  tokenCost?: number;
  category: 'core' | 'communication' | 'creative' | 'analytics' | 'premium';
  benefits: string[];
  upgradePrompt?: string;
}

export interface PlanComparison {
  planId: string;
  name: string;
  price: string;
  description: string;
  features: string[];
  highlighted?: boolean;
  upgradeFrom?: string[];
}

export class FeatureDiscoveryService {
  
  // Comprehensive feature catalog that Gemini can reference
  private static readonly FEATURES: Record<string, FeatureInfo> = {
    // Core Communication Features
    'ai_chat': {
      name: 'AI Chat with Stella',
      description: 'Personalized conversations with your AI companion',
      availability: 'free',
      tokenCost: 10,
      category: 'communication',
      benefits: [
        'Context-aware responses that remember your preferences',
        'Emotional support and guidance',
        'Help with school, friends, and daily challenges',
        'Available 24/7 whenever you need someone to talk to'
      ]
    },
    
    'conversation_memory': {
      name: 'Conversation Memory',
      description: 'Stella remembers your past conversations and preferences',
      availability: 'free',
      category: 'core',
      benefits: [
        'Personalized responses based on your history',
        'Stella remembers your interests and goals',
        'Continues conversations naturally from where you left off'
      ]
    },
    
    'voice_synthesis': {
      name: 'Voice Responses',
      description: 'Hear Stella speak with natural voice synthesis',
      availability: 'premium',
      requiredPlan: 'Premium',
      tokenCost: 5,
      category: 'premium',
      benefits: [
        'Natural-sounding voice responses',
        'Better accessibility and engagement',
        'Choose from different voice personalities'
      ],
      upgradePrompt: 'Upgrade to Premium to hear Stella speak with a natural voice!'
    },
    
    'voice_input': {
      name: 'Voice Input',
      description: 'Talk to Stella using your voice instead of typing',
      availability: 'basic',
      requiredPlan: 'Basic',
      category: 'communication',
      benefits: [
        'Hands-free communication',
        'Natural conversation flow',
        'Perfect for when typing is difficult'
      ],
      upgradePrompt: 'Upgrade to Basic plan to talk to Stella with your voice!'
    },
    
    // Creative Features
    'avatar_creation': {
      name: 'Avatar Creation Game',
      description: 'Design and customize your unique avatar',
      availability: 'free',
      category: 'creative',
      benefits: [
        'Express your personality through avatar design',
        'Unlock new items as you progress',
        'Save and share your creations'
      ]
    },
    
    'advanced_avatars': {
      name: 'Premium Avatar Features',
      description: 'Advanced avatar customization and exclusive items',
      availability: 'premium',
      requiredPlan: 'Premium',
      category: 'creative',
      benefits: [
        'Access to exclusive avatar items',
        'Advanced customization options',
        'AI-generated custom graphics',
        'Export high-quality avatar images'
      ],
      upgradePrompt: 'Upgrade to Premium for exclusive avatar items and advanced customization!'
    },
    
    'ai_art_generation': {
      name: 'AI Art Generation',
      description: 'Create custom artwork and graphics with AI',
      availability: 'premium',
      requiredPlan: 'Premium',
      tokenCost: 25,
      category: 'creative',
      benefits: [
        'Generate unique artwork on demand',
        'Custom graphics for avatars and profiles',
        'Creative inspiration and art projects'
      ],
      upgradePrompt: 'Upgrade to Premium to create amazing AI-generated artwork!'
    },
    
    // Wellness & Growth Features
    'daily_affirmations': {
      name: 'Daily Affirmations',
      description: 'Personalized daily motivation and encouragement',
      availability: 'free',
      category: 'core',
      benefits: [
        'Start each day with positive reinforcement',
        'Personalized messages based on your needs',
        'Build confidence and self-esteem'
      ]
    },
    
    'mood_tracking': {
      name: 'Mood Tracking',
      description: 'Track your emotions and get personalized support',
      availability: 'premium',
      requiredPlan: 'Premium',
      category: 'analytics',
      benefits: [
        'Understand your emotional patterns',
        'Get targeted support during tough times',
        'Track progress over time'
      ],
      upgradePrompt: 'Upgrade to Premium to track your mood and get personalized emotional support!'
    },
    
    'goal_setting': {
      name: 'Goal Setting & Tracking',
      description: 'Set personal goals and track your progress',
      availability: 'premium',
      requiredPlan: 'Premium',
      category: 'analytics',
      benefits: [
        'Break down big goals into manageable steps',
        'Track progress with visual indicators',
        'Get encouragement and accountability from Stella'
      ],
      upgradePrompt: 'Upgrade to Premium to set goals and track your achievements!'
    },
    
    // Family Features
    'multiple_profiles': {
      name: 'Multiple Child Profiles',
      description: 'Create profiles for multiple children in your family',
      availability: 'family',
      requiredPlan: 'Family',
      category: 'core',
      benefits: [
        'Individual profiles for each child',
        'Age-appropriate content for each child',
        'Separate conversation histories and preferences'
      ],
      upgradePrompt: 'Upgrade to Family plan to create profiles for all your children!'
    },
    
    'parent_insights': {
      name: 'Parent Dashboard',
      description: 'Insights into your child\'s emotional wellbeing and growth',
      availability: 'family',
      requiredPlan: 'Family',
      category: 'analytics',
      benefits: [
        'Weekly reports on your child\'s interactions',
        'Insights into emotional patterns and growth',
        'Conversation summaries and highlights',
        'Privacy-first approach with no personal details shared'
      ],
      upgradePrompt: 'Upgrade to Family plan to get insights into your child\'s wellbeing!'
    },

    // Settings and Configuration Features
    'settings_management': {
      name: 'Settings & Preferences',
      description: 'Customize your experience with personalized settings',
      availability: 'free',
      category: 'core',
      benefits: [
        'Personalize communication style and preferences',
        'Set notification preferences and quiet hours',
        'Customize avatar and visual preferences',
        'Control privacy and data sharing settings'
      ]
    },

    'avatar_analysis': {
      name: 'Avatar Analysis & Feedback',
      description: 'Get personalized feedback on your avatar creations',
      availability: 'basic',
      requiredPlan: 'Basic',
      category: 'creative',
      benefits: [
        'AI analysis of your avatar designs',
        'Creative feedback and suggestions',
        'Style recommendations based on your preferences',
        'Encouragement and positive reinforcement'
      ],
      upgradePrompt: 'Upgrade to Basic plan to get AI feedback on your avatar creations!'
    },

    'advanced_settings': {
      name: 'Advanced Settings & Customization',
      description: 'Deep customization of your AI companion experience',
      availability: 'premium',
      requiredPlan: 'Premium',
      category: 'premium',
      benefits: [
        'Advanced personality customization',
        'Detailed communication style preferences',
        'Custom conversation topics and interests',
        'Advanced privacy and parental controls'
      ],
      upgradePrompt: 'Upgrade to Premium for advanced customization options!'
    }
  };

  // Plan comparison information
  private static readonly PLANS: Record<string, PlanComparison> = {
    'free': {
      planId: 'free',
      name: 'Free',
      price: '$0/month',
      description: 'Get started with basic AI companionship',
      features: [
        'AI Chat with Stella (100 messages/month)',
        'Daily Affirmations (1 per day)',
        'Basic Avatar Creation',
        'Conversation Memory',
        'Community Support'
      ]
    },
    
    'basic': {
      planId: 'basic',
      name: 'Basic',
      price: '$4.99/month',
      description: 'Enhanced features for regular users',
      features: [
        'Unlimited AI Chat',
        'Voice Input',
        'Daily Affirmations (2 per day)',
        'Enhanced Avatar Customization',
        'Priority Support',
        'Ad-free Experience'
      ],
      upgradeFrom: ['free']
    },
    
    'premium': {
      planId: 'premium',
      name: 'Premium',
      price: '$9.99/month',
      description: 'Full access to all features',
      features: [
        'Everything in Basic',
        'Voice Responses from Stella',
        'AI Art Generation',
        'Mood Tracking',
        'Goal Setting & Progress Tracking',
        'Premium Avatar Items',
        'Advanced Personality AI',
        'Unlimited Daily Affirmations'
      ],
      highlighted: true,
      upgradeFrom: ['free', 'basic']
    },
    
    'family': {
      planId: 'family',
      name: 'Family',
      price: '$14.99/month',
      description: 'Perfect for families with multiple children',
      features: [
        'Everything in Premium',
        'Up to 5 Child Profiles',
        'Parent Dashboard & Insights',
        'Family Goal Setting',
        'Parental Controls',
        'Priority Family Support'
      ],
      upgradeFrom: ['free', 'basic', 'premium']
    }
  };

  /**
   * Get information about a specific feature
   */
  static getFeatureInfo(featureName: string): FeatureInfo | null {
    return this.FEATURES[featureName] || null;
  }

  /**
   * Get all features in a specific category
   */
  static getFeaturesByCategory(category: string): FeatureInfo[] {
    return Object.values(this.FEATURES).filter(feature => feature.category === category);
  }

  /**
   * Get features available for a specific plan
   */
  static getFeaturesForPlan(planId: string): FeatureInfo[] {
    return Object.values(this.FEATURES).filter(feature => {
      if (planId === 'free') return feature.availability === 'free';
      if (planId === 'basic') return ['free', 'basic'].includes(feature.availability);
      if (planId === 'premium') return ['free', 'basic', 'premium'].includes(feature.availability);
      if (planId === 'family') return true; // Family gets everything
      return false;
    });
  }

  /**
   * Get plan comparison data
   */
  static getPlanComparison(): PlanComparison[] {
    return Object.values(this.PLANS);
  }

  /**
   * Get specific plan information
   */
  static getPlanInfo(planId: string): PlanComparison | null {
    return this.PLANS[planId] || null;
  }

  /**
   * Generate upgrade recommendations based on user's current plan
   */
  static async getUpgradeRecommendations(userId: string): Promise<{
    currentPlan: string;
    recommendations: Array<{
      feature: FeatureInfo;
      requiredPlan: PlanComparison;
      benefit: string;
    }>;
  }> {
    try {
      // Get user's current subscription
      const subscription = await storage.getUserSubscription(userId);
      const currentPlan = subscription?.planId || 'free';
      
      // Find features they don't have access to
      const availableFeatures = this.getFeaturesForPlan(currentPlan);
      const allFeatures = Object.values(this.FEATURES);
      const missingFeatures = allFeatures.filter(feature => 
        !availableFeatures.includes(feature) && feature.requiredPlan
      );

      // Generate recommendations
      const recommendations = missingFeatures.map(feature => ({
        feature,
        requiredPlan: this.PLANS[feature.requiredPlan!],
        benefit: feature.upgradePrompt || `Upgrade to access ${feature.name}`
      }));

      return {
        currentPlan,
        recommendations: recommendations.slice(0, 3) // Top 3 recommendations
      };
    } catch (error) {
      console.error('Error generating upgrade recommendations:', error);
      return {
        currentPlan: 'free',
        recommendations: []
      };
    }
  }

  /**
   * Generate contextual help based on user query
   */
  static generateContextualHelp(query: string): {
    features: FeatureInfo[];
    upgradeOptions: PlanComparison[];
    helpText: string;
  } {
    const queryLower = query.toLowerCase();
    let relevantFeatures: FeatureInfo[] = [];
    let upgradeOptions: PlanComparison[] = [];
    let helpText = '';

    // Voice-related queries
    if (queryLower.includes('voice') || queryLower.includes('speak') || queryLower.includes('talk')) {
      relevantFeatures = [
        this.FEATURES.voice_input,
        this.FEATURES.voice_synthesis
      ].filter(Boolean);
      upgradeOptions = [this.PLANS.basic, this.PLANS.premium];
      helpText = 'Voice features let you have more natural conversations with Stella. Voice input is available with Basic plan, and voice responses require Premium.';
    }
    
    // Avatar/customization queries
    else if (queryLower.includes('avatar') || queryLower.includes('customize') || queryLower.includes('appearance')) {
      relevantFeatures = [
        this.FEATURES.avatar_creation,
        this.FEATURES.advanced_avatars,
        this.FEATURES.ai_art_generation
      ].filter(Boolean);
      upgradeOptions = [this.PLANS.premium];
      helpText = 'Avatar creation is free, but Premium unlocks exclusive items, advanced customization, and AI-generated graphics.';
    }
    
    // Mood/emotional support queries
    else if (queryLower.includes('mood') || queryLower.includes('feeling') || queryLower.includes('emotion')) {
      relevantFeatures = [
        this.FEATURES.mood_tracking,
        this.FEATURES.daily_affirmations,
        this.FEATURES.goal_setting
      ].filter(Boolean);
      upgradeOptions = [this.PLANS.premium];
      helpText = 'Stella provides emotional support through daily affirmations (free) and advanced mood tracking with Premium.';
    }
    
    // Family/parent queries
    else if (queryLower.includes('family') || queryLower.includes('parent') || queryLower.includes('children')) {
      relevantFeatures = [
        this.FEATURES.multiple_profiles,
        this.FEATURES.parent_insights
      ].filter(Boolean);
      upgradeOptions = [this.PLANS.family];
      helpText = 'Family plan supports multiple children with individual profiles and provides parents with wellness insights.';
    }
    
    // General upgrade/plan queries
    else if (queryLower.includes('upgrade') || queryLower.includes('plan') || queryLower.includes('premium')) {
      relevantFeatures = Object.values(this.FEATURES).filter(f => f.availability === 'premium').slice(0, 4);
      upgradeOptions = Object.values(this.PLANS).filter(p => p.planId !== 'free');
      helpText = 'We offer Basic ($4.99), Premium ($9.99), and Family ($14.99) plans with increasing features and capabilities.';
    }
    
    // Feature discovery queries
    else if (queryLower.includes('feature') || queryLower.includes('can') || queryLower.includes('what')) {
      relevantFeatures = Object.values(this.FEATURES).slice(0, 5);
      upgradeOptions = [this.PLANS.premium];
      helpText = 'I can help with conversations, provide daily affirmations, create avatars, and much more! Premium unlocks advanced features like voice responses and mood tracking.';
    }

    return {
      features: relevantFeatures,
      upgradeOptions,
      helpText
    };
  }
}

/**
 * Gemini Function Tool for Feature Discovery
 * This allows Gemini to intelligently respond to user questions about features
 */
export const featureDiscoveryFunctions = {
  getFeatureInfo: {
    name: 'getFeatureInfo',
    description: 'Get detailed information about a specific app feature',
    parameters: {
      type: 'object',
      properties: {
        featureName: {
          type: 'string',
          description: 'Name of the feature to get information about'
        }
      },
      required: ['featureName']
    }
  },
  
  getUpgradeRecommendations: {
    name: 'getUpgradeRecommendations',
    description: 'Get personalized upgrade recommendations for the user',
    parameters: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: 'User ID to get recommendations for'
        }
      },
      required: ['userId']
    }
  },
  
  getContextualHelp: {
    name: 'getContextualHelp',
    description: 'Get contextual help and feature information based on user query',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'User query or question about features'
        }
      },
      required: ['query']
    }
  },
  
  getPlanComparison: {
    name: 'getPlanComparison',
    description: 'Get comparison of all available subscription plans',
    parameters: {
      type: 'object',
      properties: {},
      required: []
    }
  }
};