/**
 * Feature Documentation System for AI-Guided User Assistance
 * Provides comprehensive information about all app features for Gemini to guide children
 */

export interface AppFeature {
  id: string;
  name: string;
  description: string;
  location: {
    route: string;
    section?: string;
    element?: string;
  };
  instructions: string[];
  subscriptionTier: 'basic' | 'premium' | 'family';
  category: string;
  keywords: string[];
  prerequisites?: string[];
  relatedFeatures?: string[];
  ageGroup: string;
  difficulty: 'easy' | 'medium' | 'advanced';
}

export interface SubscriptionTier {
  id: 'basic' | 'premium' | 'family';
  name: string;
  price: {
    monthly: number;
    yearly: number;
  };
  features: string[];
  description: string;
  popularFeatures: string[];
  upgradePrompt: string;
}

export class FeatureDocumentationService {
  
  // Subscription tier definitions
  static readonly SUBSCRIPTION_TIERS: Record<string, SubscriptionTier> = {
    basic: {
      id: 'basic',
      name: 'Basic',
      price: { monthly: 0, yearly: 0 },
      features: [
        'basic-chat',
        'daily-affirmations',
        'mood-tracking-basic',
        'avatar-creation-basic',
        'basic-goals'
      ],
      description: 'Perfect for getting started with your AI companion',
      popularFeatures: ['Chat with AI companion', 'Daily affirmations', 'Basic avatar creation'],
      upgradePrompt: 'Unlock more avatar options and advanced features with Premium!'
    },
    premium: {
      id: 'premium',
      name: 'Premium',
      price: { monthly: 9.99, yearly: 99.99 },
      features: [
        'advanced-chat',
        'voice-chat',
        'avatar-creation-full',
        'background-music',
        'conversation-management',
        'mood-tracking-advanced',
        'goal-setting-advanced',
        'memory-system',
        'multiple-personalities'
      ],
      description: 'Enhanced experience with voice chat and full avatar customization',
      popularFeatures: ['Voice conversations', 'Full avatar customization', 'Background music'],
      upgradePrompt: 'Get the complete experience with voice chat and unlimited avatar options!'
    },
    family: {
      id: 'family',
      name: 'Family',
      price: { monthly: 19.99, yearly: 199.99 },
      features: [
        'multiple-children',
        'parental-controls',
        'family-dashboard',
        'usage-reports',
        'safety-monitoring',
        'custom-restrictions',
        'priority-support'
      ],
      description: 'Complete family solution with parental controls and multiple child profiles',
      popularFeatures: ['Multiple child profiles', 'Parental dashboard', 'Safety monitoring'],
      upgradePrompt: 'Manage your entire family with advanced parental controls and multiple profiles!'
    }
  };

  // Complete feature documentation
  static readonly APP_FEATURES: AppFeature[] = [
    // Chat & Conversation Features
    {
      id: 'basic-chat',
      name: 'Chat with AI Companion',
      description: 'Have conversations with your AI big sister about anything on your mind',
      location: { route: '/chat', section: 'main-chat' },
      instructions: [
        'Navigate to the Chat page',
        'Type your message in the text box at the bottom',
        'Press Enter or click the send button',
        'Your AI companion will respond with helpful advice and support'
      ],
      subscriptionTier: 'basic',
      category: 'Communication',
      keywords: ['chat', 'talk', 'conversation', 'message', 'speak'],
      ageGroup: '10-14',
      difficulty: 'easy'
    },
    {
      id: 'voice-chat',
      name: 'Voice Conversations',
      description: 'Talk to your AI companion using your voice and hear her responses',
      location: { route: '/chat', section: 'voice-controls' },
      instructions: [
        'Go to the Chat page',
        'Click the microphone button',
        'Speak your message clearly',
        'Wait for the AI to respond with voice',
        'Adjust volume using the speaker controls'
      ],
      subscriptionTier: 'premium',
      category: 'Communication',
      keywords: ['voice', 'speak', 'microphone', 'audio', 'talk'],
      prerequisites: ['basic-chat'],
      ageGroup: '10-14',
      difficulty: 'medium'
    },
    {
      id: 'conversation-management',
      name: 'Save & Organize Conversations',
      description: 'Save important conversations and organize them into groups',
      location: { route: '/chat', section: 'conversation-tabs' },
      instructions: [
        'Start a conversation in the Chat page',
        'Click the save button to save important chats',
        'Use conversation tabs to switch between different topics',
        'Create conversation groups to organize by theme',
        'Drag and drop conversations to reorganize them'
      ],
      subscriptionTier: 'premium',
      category: 'Organization',
      keywords: ['save', 'organize', 'conversations', 'tabs', 'groups'],
      prerequisites: ['basic-chat'],
      ageGroup: '10-14',
      difficulty: 'medium'
    },

    // Avatar Creation Features
    {
      id: 'avatar-creation-basic',
      name: 'Basic Avatar Creation',
      description: 'Create a simple avatar with limited customization options',
      location: { route: '/avatar-game', section: 'avatar-creator' },
      instructions: [
        'Go to the Avatar Game page',
        'Choose from available face options',
        'Select basic hair styles',
        'Pick simple outfits',
        'Save your avatar when finished'
      ],
      subscriptionTier: 'basic',
      category: 'Creativity',
      keywords: ['avatar', 'create', 'design', 'character', 'appearance'],
      ageGroup: '10-14',
      difficulty: 'easy'
    },
    {
      id: 'avatar-creation-full',
      name: 'Full Avatar Customization',
      description: 'Create detailed avatars with access to all features and accessories',
      location: { route: '/avatar-game', section: 'avatar-creator' },
      instructions: [
        'Navigate to the Avatar Game page',
        'Explore all 6 categories: faces, eyes, hair, outfits, accessories, backgrounds',
        'Mix and match from 109 different features',
        'Use the randomize button for inspiration',
        'Unlock new items by using the app regularly',
        'Save multiple avatar variations'
      ],
      subscriptionTier: 'premium',
      category: 'Creativity',
      keywords: ['avatar', 'customize', 'accessories', 'full', 'advanced'],
      prerequisites: ['avatar-creation-basic'],
      ageGroup: '10-14',
      difficulty: 'medium'
    },
    {
      id: 'background-music',
      name: 'Background Music',
      description: 'Play mood-based background music while creating your avatar',
      location: { route: '/avatar-game', section: 'music-player' },
      instructions: [
        'Open the Avatar Game page',
        'Find the Background Music player on the side',
        'Choose from 5 music categories: Creative, Playful, Peaceful, Confident, Dreamy',
        'Click play to start the music',
        'Adjust volume with the slider',
        'Skip tracks using the forward/back buttons'
      ],
      subscriptionTier: 'premium',
      category: 'Entertainment',
      keywords: ['music', 'background', 'mood', 'sound', 'audio'],
      relatedFeatures: ['avatar-creation-full'],
      ageGroup: '10-14',
      difficulty: 'easy'
    },

    // Wellness & Personal Development
    {
      id: 'daily-affirmations',
      name: 'Daily Affirmations',
      description: 'Receive personalized positive messages every day',
      location: { route: '/dashboard', section: 'affirmations' },
      instructions: [
        'Check your dashboard daily',
        'Read your personalized affirmation',
        'Reflect on the positive message',
        'Share how it made you feel with your AI companion'
      ],
      subscriptionTier: 'basic',
      category: 'Wellness',
      keywords: ['affirmations', 'positive', 'daily', 'motivation', 'encouragement'],
      ageGroup: '10-14',
      difficulty: 'easy'
    },
    {
      id: 'mood-tracking-basic',
      name: 'Basic Mood Tracking',
      description: 'Track your daily mood with simple emoji selections',
      location: { route: '/wellness', section: 'mood-tracker' },
      instructions: [
        'Visit the Wellness page',
        'Click on the mood tracking section',
        'Select an emoji that matches how you feel',
        'Add a brief note about your day',
        'Submit your mood entry'
      ],
      subscriptionTier: 'basic',
      category: 'Wellness',
      keywords: ['mood', 'feelings', 'emotions', 'track', 'daily'],
      ageGroup: '10-14',
      difficulty: 'easy'
    },
    {
      id: 'mood-tracking-advanced',
      name: 'Advanced Mood Analytics',
      description: 'See detailed mood patterns and insights over time',
      location: { route: '/wellness', section: 'mood-analytics' },
      instructions: [
        'Go to the Wellness page',
        'Navigate to the advanced mood section',
        'View your mood patterns over weeks and months',
        'Read AI insights about your emotional trends',
        'Get personalized suggestions for mood improvement'
      ],
      subscriptionTier: 'premium',
      category: 'Wellness',
      keywords: ['mood', 'analytics', 'patterns', 'insights', 'trends'],
      prerequisites: ['mood-tracking-basic'],
      ageGroup: '10-14',
      difficulty: 'medium'
    },
    {
      id: 'basic-goals',
      name: 'Basic Goal Setting',
      description: 'Set simple personal goals and track progress',
      location: { route: '/goals', section: 'goal-creator' },
      instructions: [
        'Navigate to the Goals page',
        'Click "Create New Goal"',
        'Write what you want to achieve',
        'Set a simple deadline',
        'Check off progress regularly'
      ],
      subscriptionTier: 'basic',
      category: 'Personal Development',
      keywords: ['goals', 'targets', 'achievements', 'progress', 'planning'],
      ageGroup: '10-14',
      difficulty: 'easy'
    },
    {
      id: 'goal-setting-advanced',
      name: 'Advanced Goal Management',
      description: 'Create detailed goals with milestones and AI coaching',
      location: { route: '/goals', section: 'advanced-goals' },
      instructions: [
        'Go to the Goals page',
        'Use the advanced goal creator',
        'Break big goals into smaller milestones',
        'Set reminders and deadlines',
        'Get AI coaching and motivation',
        'Track detailed progress metrics'
      ],
      subscriptionTier: 'premium',
      category: 'Personal Development',
      keywords: ['goals', 'advanced', 'milestones', 'coaching', 'detailed'],
      prerequisites: ['basic-goals'],
      ageGroup: '10-14',
      difficulty: 'advanced'
    },

    // AI Features
    {
      id: 'memory-system',
      name: 'AI Memory & Context',
      description: 'Your AI companion remembers your conversations and preferences',
      location: { route: '/chat', section: 'memory-indicator' },
      instructions: [
        'Talk regularly with your AI companion',
        'Notice how she remembers things you told her before',
        'See the memory indicator showing what she recalls',
        'Ask her to remember important things about you',
        'Review what she knows about you in your profile'
      ],
      subscriptionTier: 'premium',
      category: 'AI Features',
      keywords: ['memory', 'remember', 'context', 'personal', 'history'],
      prerequisites: ['basic-chat'],
      ageGroup: '10-14',
      difficulty: 'medium'
    },
    {
      id: 'multiple-personalities',
      name: 'AI Personality Options',
      description: 'Choose from different AI companion personalities',
      location: { route: '/chat', section: 'personality-selector' },
      instructions: [
        'Open the Chat page',
        'Click the personality selector',
        'Choose from different companion styles',
        'Experience how each personality responds differently',
        'Switch personalities based on your mood or needs'
      ],
      subscriptionTier: 'premium',
      category: 'AI Features',
      keywords: ['personality', 'character', 'different', 'styles', 'companions'],
      prerequisites: ['basic-chat'],
      ageGroup: '10-14',
      difficulty: 'medium'
    },

    // Family & Parental Features
    {
      id: 'multiple-children',
      name: 'Multiple Child Profiles',
      description: 'Create separate profiles for each child in the family',
      location: { route: '/family', section: 'child-profiles' },
      instructions: [
        'Go to the Family page',
        'Click "Add New Child"',
        'Fill in child information and age',
        'Set individual preferences and restrictions',
        'Switch between child profiles easily'
      ],
      subscriptionTier: 'family',
      category: 'Family Management',
      keywords: ['children', 'profiles', 'family', 'multiple', 'siblings'],
      ageGroup: 'Parent',
      difficulty: 'medium'
    },
    {
      id: 'parental-controls',
      name: 'Parental Controls',
      description: 'Monitor and control your child\'s app usage and interactions',
      location: { route: '/parent-portal', section: 'controls' },
      instructions: [
        'Access the Parent Portal',
        'Set time limits for app usage',
        'Review conversation summaries',
        'Configure content restrictions',
        'Set quiet hours and break times'
      ],
      subscriptionTier: 'family',
      category: 'Safety & Control',
      keywords: ['parental', 'controls', 'monitoring', 'restrictions', 'safety'],
      ageGroup: 'Parent',
      difficulty: 'advanced'
    }
  ];

  /**
   * Get all features for a specific subscription tier
   */
  static getFeaturesForTier(tier: 'basic' | 'premium' | 'family'): AppFeature[] {
    return this.APP_FEATURES.filter(feature => feature.subscriptionTier === tier);
  }

  /**
   * Get features by category
   */
  static getFeaturesByCategory(category: string): AppFeature[] {
    return this.APP_FEATURES.filter(feature => feature.category === category);
  }

  /**
   * Search features by keywords
   */
  static searchFeatures(query: string): AppFeature[] {
    const lowerQuery = query.toLowerCase();
    return this.APP_FEATURES.filter(feature => 
      feature.keywords.some(keyword => keyword.includes(lowerQuery)) ||
      feature.name.toLowerCase().includes(lowerQuery) ||
      feature.description.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Get feature by ID
   */
  static getFeature(id: string): AppFeature | undefined {
    return this.APP_FEATURES.find(feature => feature.id === id);
  }

  /**
   * Get features available to user based on their subscription
   */
  static getAvailableFeatures(userTier: 'basic' | 'premium' | 'family'): {
    available: AppFeature[];
    locked: AppFeature[];
  } {
    const tierHierarchy = ['basic', 'premium', 'family'];
    const userTierIndex = tierHierarchy.indexOf(userTier);
    
    const available = this.APP_FEATURES.filter(feature => {
      const featureTierIndex = tierHierarchy.indexOf(feature.subscriptionTier);
      return featureTierIndex <= userTierIndex;
    });
    
    const locked = this.APP_FEATURES.filter(feature => {
      const featureTierIndex = tierHierarchy.indexOf(feature.subscriptionTier);
      return featureTierIndex > userTierIndex;
    });
    
    return { available, locked };
  }

  /**
   * Generate feature documentation for Gemini context cache
   */
  static generateGeminiDocumentation(): string {
    const categories = Array.from(new Set(this.APP_FEATURES.map(f => f.category)));
    
    let documentation = `# My Pocket Sister App Feature Guide

## How to Help Children Navigate the App

When a child asks about app features or how to do something, use this comprehensive guide to direct them step-by-step.

## Subscription Tiers

### Basic (Free)
${this.SUBSCRIPTION_TIERS.basic.description}
Features: ${this.getFeaturesForTier('basic').map(f => f.name).join(', ')}

### Premium ($9.99/month)
${this.SUBSCRIPTION_TIERS.premium.description}
Features: ${this.getFeaturesForTier('premium').map(f => f.name).join(', ')}

### Family ($19.99/month)  
${this.SUBSCRIPTION_TIERS.family.description}
Features: ${this.getFeaturesForTier('family').map(f => f.name).join(', ')}

## Feature Categories

`;

    categories.forEach(category => {
      documentation += `### ${category}\n`;
      const categoryFeatures = this.getFeaturesByCategory(category);
      
      categoryFeatures.forEach(feature => {
        documentation += `
**${feature.name}** (${feature.subscriptionTier.charAt(0).toUpperCase() + feature.subscriptionTier.slice(1)})
- Location: ${feature.location.route}${feature.location.section ? ` > ${feature.location.section}` : ''}
- Description: ${feature.description}
- Instructions:
${feature.instructions.map(instruction => `  ${instruction}`).join('\n')}
- Keywords: ${feature.keywords.join(', ')}
${feature.prerequisites ? `- Prerequisites: ${feature.prerequisites.join(', ')}` : ''}

`;
      });
    });

    documentation += `
## Guiding Principles for Child Assistance

1. **Age-Appropriate Language**: Use simple, encouraging language suitable for ages 10-14
2. **Step-by-Step Instructions**: Break down complex tasks into simple steps
3. **Positive Reinforcement**: Celebrate their progress and efforts
4. **Safety First**: Always prioritize safe, appropriate interactions
5. **Subscription Awareness**: Gently mention premium features and their benefits
6. **Encourage Exploration**: Help them discover features they might enjoy

## Common Questions and Responses

**"How do I create an avatar?"**
Direct them to the Avatar Game page and walk through the basic creation process.

**"Can I talk to you with my voice?"**
Explain voice chat feature (Premium) and how to access it.

**"How do I save my conversations?"**
Guide them through the conversation management feature (Premium).

**"What music can I listen to?"**
Show them the background music options in the avatar game (Premium).

**"How do I track my mood?"**
Guide them to the Wellness page for mood tracking.

**"Can I set goals?"**
Direct them to the Goals page for personal development features.

Remember: Always be encouraging, patient, and helpful. If they don't have access to a premium feature, gently explain the benefits and suggest they ask a parent about upgrading.
`;

    return documentation;
  }
}

export const featureDocumentationService = new FeatureDocumentationService();