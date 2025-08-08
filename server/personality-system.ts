import { storage } from "./storage";

// Personality types with tier restrictions
export interface PersonalityType {
  id: string;
  name: string;
  description: string;
  requiredTier: 'free' | 'basic' | 'premium' | 'family';
  traits: string[];
  conversationStyle: string;
  specialFeatures: string[];
}

export const PERSONALITY_TYPES: PersonalityType[] = [
  // Free tier personalities
  {
    id: 'friendly',
    name: '🌟 Friendly & Supportive',
    description: 'A warm, encouraging companion who celebrates your achievements',
    requiredTier: 'free',
    traits: ['supportive', 'encouraging', 'positive'],
    conversationStyle: 'Simple, warm responses with basic emotional support',
    specialFeatures: ['Daily affirmations', 'Basic mood responses']
  },
  
  // Basic tier personalities  
  {
    id: 'basic-mentor',
    name: '📚 Basic Mentor',
    description: 'Helps with homework and gives study tips',
    requiredTier: 'basic',
    traits: ['helpful', 'educational', 'patient'],
    conversationStyle: 'Educational focus with basic personality adaptation',
    specialFeatures: ['Homework help', 'Basic goal tracking']
  },
  {
    id: 'basic-creative',
    name: '🎨 Creative Helper',
    description: 'Encourages creativity and artistic expression',
    requiredTier: 'basic',
    traits: ['creative', 'imaginative', 'artistic'],
    conversationStyle: 'Creative prompts with basic personalization',
    specialFeatures: ['Art ideas', 'Basic story prompts']
  },

  // Premium tier personalities (Advanced AI)
  {
    id: 'advanced-mentor',
    name: '🧠 Advanced Mentor (Premium)',
    description: 'Deep learning companion with advanced personality adaptation',
    requiredTier: 'premium',
    traits: ['intelligent', 'adaptive', 'insightful', 'personalized'],
    conversationStyle: 'Deeply personalized responses that learn and adapt over time',
    specialFeatures: [
      'Advanced personality learning',
      'Deep conversation memory',
      'Proactive check-ins',
      'Emotional intelligence',
      'Complex problem solving'
    ]
  },
  {
    id: 'empathetic-friend',
    name: '💝 Empathetic Best Friend (Premium)',
    description: 'Advanced emotional support with deep relationship building',
    requiredTier: 'premium',
    traits: ['empathetic', 'understanding', 'emotionally intelligent'],
    conversationStyle: 'Advanced emotional recognition with personalized support strategies',
    specialFeatures: [
      'Advanced mood tracking',
      'Emotional pattern recognition',
      'Personalized coping strategies',
      'Relationship advice'
    ]
  },

  // Family tier personalities (Most Advanced)
  {
    id: 'family-coordinator',
    name: '👨‍👩‍👧‍👦 Family Coordinator (Family)',
    description: 'Manages multiple children with personalized approaches for each',
    requiredTier: 'family',
    traits: ['organized', 'fair', 'family-focused', 'coordinating'],
    conversationStyle: 'Personalized for each child while maintaining family harmony',
    specialFeatures: [
      'Multi-child personality management',
      'Family goal coordination',
      'Sibling relationship support',
      'Parent-child communication bridging'
    ]
  }
];

export class PersonalitySystem {
  // Get available personalities for user's tier
  static getAvailablePersonalities(userTier: string): PersonalityType[] {
    const tierHierarchy = ['free', 'basic', 'premium', 'family'];
    const userTierIndex = tierHierarchy.indexOf(userTier);
    
    return PERSONALITY_TYPES.filter(p => {
      const requiredTierIndex = tierHierarchy.indexOf(p.requiredTier);
      return requiredTierIndex <= userTierIndex;
    });
  }

  // Get all personalities with tier restrictions marked
  static getAllPersonalitiesWithRestrictions(userTier: string): (PersonalityType & {available: boolean})[] {
    const tierHierarchy = ['free', 'basic', 'premium', 'family'];
    const userTierIndex = tierHierarchy.indexOf(userTier);
    
    return PERSONALITY_TYPES.map(p => {
      const requiredTierIndex = tierHierarchy.indexOf(p.requiredTier);
      return {
        ...p,
        available: requiredTierIndex <= userTierIndex
      };
    });
  }

  // Apply personality-specific conversation enhancements
  static async enhanceConversation(
    personalityId: string, 
    message: string, 
    childProfile: any,
    userTier: string
  ): Promise<{enhancedPrompt: string, features: string[]}> {
    const personality = PERSONALITY_TYPES.find(p => p.id === personalityId);
    if (!personality) {
      return {enhancedPrompt: message, features: []};
    }

    // Check if user has access to this personality
    const available = this.getAvailablePersonalities(userTier);
    if (!available.find(p => p.id === personalityId)) {
      // Fallback to basic personality
      const basicPersonality = available[0] || PERSONALITY_TYPES[0];
      return this.enhanceConversation(basicPersonality.id, message, childProfile, userTier);
    }

    let enhancedPrompt = message;
    const features: string[] = [];

    // Add personality-specific enhancements based on tier
    if (userTier === 'premium' || userTier === 'family') {
      // Advanced personality AI features
      enhancedPrompt += `\n\nPersonality Context: Act as ${personality.name} with these traits: ${personality.traits.join(', ')}. Use ${personality.conversationStyle}. The child's past interactions show they prefer [analyze past conversations for preferences].`;
      features.push('Advanced personality adaptation', 'Deep learning from past conversations');
      
      if (childProfile.personalityProfile?.emotionalPatterns) {
        enhancedPrompt += `\n\nEmotional Pattern Recognition: The child typically responds well to [${childProfile.personalityProfile.emotionalPatterns.join(', ')}] approaches.`;
        features.push('Emotional pattern recognition');
      }
    } else if (userTier === 'basic') {
      // Basic personality features
      enhancedPrompt += `\n\nBasic Personality: Act as ${personality.name} with a ${personality.conversationStyle} approach.`;
      features.push('Basic personality traits');
    }

    return {enhancedPrompt, features};
  }
}