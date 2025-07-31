// Test Mode - Bypasses payment restrictions for development and testing
export const TEST_MODE = process.env.NODE_ENV === 'development' || process.env.ENABLE_TEST_MODE === 'true';

export interface TestUser {
  userId: string;
  subscriptionTier: 'basic' | 'premium' | 'family';
  unlimitedAccess: boolean;
}

// Test users with elevated permissions
const TEST_USERS: TestUser[] = [
  {
    userId: 'test-user-1',
    subscriptionTier: 'family',
    unlimitedAccess: true
  }
];

// Override feature access for testing
export function getTestModeAccess(userId: string, feature: string): boolean | null {
  if (!TEST_MODE) return null; // Not in test mode
  
  const testUser = TEST_USERS.find(u => u.userId === userId);
  if (testUser?.unlimitedAccess) {
    return true; // Grant all features in test mode
  }
  
  // Default test access - grant most features for testing
  const testFeatures = [
    'advancedPersonalityAI',
    'moodTrackingEnabled', 
    'goalTrackingEnabled',
    'reminderSystemEnabled',
    'parentInsightsEnabled'
  ];
  
  return testFeatures.includes(feature);
}

// Get test mode subscription tier
export function getTestModeSubscription(userId: string): 'basic' | 'premium' | 'family' | null {
  if (!TEST_MODE) return null;
  
  const testUser = TEST_USERS.find(u => u.userId === userId);
  return testUser?.subscriptionTier || 'premium'; // Default to premium for testing
}

// Override daily affirmations limit for testing
export function getTestModeAffirmationsLimit(userId: string): number | null {
  if (!TEST_MODE) return null;
  
  const testUser = TEST_USERS.find(u => u.userId === userId);
  if (testUser?.unlimitedAccess) return 10; // Generous limit for testing
  
  return 5; // Default test limit
}

export function isTestModeEnabled(): boolean {
  return TEST_MODE;
}

export function getTestModeStatus() {
  return {
    enabled: TEST_MODE,
    environment: process.env.NODE_ENV,
    testUsersCount: TEST_USERS.length,
    features: [
      'Unlimited feature access',
      'No payment restrictions', 
      'Enhanced daily affirmations',
      'All subscription tiers available',
      'Built-in AI responses (no API keys needed)'
    ]
  };
}