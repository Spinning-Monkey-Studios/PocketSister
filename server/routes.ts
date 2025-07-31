import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, isAdmin } from "./replitAuth";
import { notificationService } from "./notifications";
import { sendTrialWelcomeEmail, sendUpgradeRequestEmail, sendTrialExpirationEmail } from "./email";
import { insertContactMessageSchema, insertChildProfileSchema, insertAnnouncementSchema, insertConversationSchema, insertMessageSchema, insertDailyAffirmationSchema, insertMoodEntrySchema, insertChildGoalSchema, insertChildReminderSchema, type ChildPersonality, type Message } from "@shared/schema";
import Stripe from "stripe";

// Initialize Stripe if we have the secret key
let stripe: Stripe | null = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-07-30.basil",
  });
}

// AI Personality Helper Functions
async function generatePersonalizedResponse(
  message: string, 
  personality: ChildPersonality | undefined, 
  recentContext: Message[],
  hasAdvancedAI: boolean = false
): Promise<string> {
  // Default responses for different topics
  const defaultResponses = {
    school: "School can be challenging sometimes! What's going on that you'd like to talk about?",
    friends: "Friends are so important! Tell me more about what's happening with your friends.",
    family: "Family is special. I'm here to listen if you want to share anything about your family.",
    feelings: "It's totally normal to have lots of different feelings. I'm here to listen and support you.",
    hobbies: "I love hearing about what you enjoy doing! What are your favorite activities?",
    default: "Thanks for sharing that with me! I'm here to listen and help. What would you like to talk about next?"
  };

  // Analyze message content for topics
  const lowerMessage = message.toLowerCase();
  let topic = 'default';
  
  if (lowerMessage.includes('school') || lowerMessage.includes('teacher') || lowerMessage.includes('homework') || lowerMessage.includes('class')) {
    topic = 'school';
  } else if (lowerMessage.includes('friend') || lowerMessage.includes('classmate') || lowerMessage.includes('play')) {
    topic = 'friends';
  } else if (lowerMessage.includes('mom') || lowerMessage.includes('dad') || lowerMessage.includes('parent') || lowerMessage.includes('family') || lowerMessage.includes('sister') || lowerMessage.includes('brother')) {
    topic = 'family';
  } else if (lowerMessage.includes('sad') || lowerMessage.includes('happy') || lowerMessage.includes('angry') || lowerMessage.includes('excited') || lowerMessage.includes('worried') || lowerMessage.includes('scared')) {
    topic = 'feelings';
  } else if (lowerMessage.includes('like') || lowerMessage.includes('love') || lowerMessage.includes('enjoy')) {
    topic = 'hobbies';
  }

  let baseResponse = defaultResponses[topic as keyof typeof defaultResponses] || defaultResponses.default;

  // Only apply advanced personalization for premium users
  if (hasAdvancedAI && personality) {
    // Personalize based on communication style
    if (personality.communicationStyle === 'playful') {
      baseResponse = baseResponse.replace(/!/g, '! 😊').replace(/\?/g, '? ✨');
    } else if (personality.communicationStyle === 'gentle') {
      baseResponse = baseResponse.replace(/!/g, '.').replace(/What's/g, "What's");
    }

    // Add memory context if personality exists
    if (personality.personalMemories) {
      const memories = personality.personalMemories as any;
      if (topic === 'school' && memories.school) {
        baseResponse += ` I remember you mentioned ${memories.school} before.`;
      } else if (topic === 'friends' && memories.friends) {
        baseResponse += ` I remember you talking about ${memories.friends}.`;
      }
    }
  } else {
    // Basic tier gets friendly but generic responses
    baseResponse = baseResponse.replace(/Advanced|complex/gi, 'simple');
  }

  return baseResponse;
}

async function updatePersonalityFromInteraction(
  childId: string, 
  message: string, 
  currentPersonality: ChildPersonality | undefined
): Promise<void> {
  const lowerMessage = message.toLowerCase();
  
  // Extract interests and topics
  const newInterests: string[] = [];
  const newTopics: string[] = [];
  const personalMemories: any = currentPersonality?.personalMemories || {};

  // Detect interests
  if (lowerMessage.includes('love') || lowerMessage.includes('like')) {
    const interests = ['dancing', 'art', 'music', 'reading', 'sports', 'games', 'science', 'animals', 'drawing'];
    interests.forEach(interest => {
      if (lowerMessage.includes(interest)) {
        newInterests.push(interest);
      }
    });
  }

  // Detect communication style
  let communicationStyle = currentPersonality?.communicationStyle || 'friendly';
  if (lowerMessage.includes('lol') || lowerMessage.includes('haha') || lowerMessage.includes('funny')) {
    communicationStyle = 'playful';
  } else if (lowerMessage.includes('please') || lowerMessage.includes('thank you')) {
    communicationStyle = 'gentle';
  }

  // Extract personal memories
  if (lowerMessage.includes('my cat') || lowerMessage.includes('my dog')) {
    const petMatch = lowerMessage.match(/my (cat|dog) (\w+)/);
    if (petMatch) {
      personalMemories.pets = `has a ${petMatch[1]} named ${petMatch[2]}`;
    }
  }

  if (lowerMessage.includes('school') || lowerMessage.includes('teacher')) {
    if (lowerMessage.includes('love') || lowerMessage.includes('like')) {
      personalMemories.school = 'likes school';
    } else if (lowerMessage.includes('hate') || lowerMessage.includes('difficult')) {
      personalMemories.school = 'finds school challenging';
    }
  }

  // Update personality profile
  const existingInterests = currentPersonality?.interestsKeywords || [];
  const existingTopics = currentPersonality?.topicsDiscussed || [];
  
  await storage.createOrUpdateChildPersonality(childId, {
    interestsKeywords: Array.from(new Set([...existingInterests, ...newInterests])),
    communicationStyle,
    topicsDiscussed: Array.from(new Set([...existingTopics, ...newTopics])),
    personalMemories,
    aiPersonalityNotes: `Updated from interaction on ${new Date().toISOString()}`,
  });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);
  
  // Initialize pricing plans with Stage 2 features
  await storage.initializePricingPlans();

  // Test Mode Status Endpoint
  app.get('/api/test-mode', (req, res) => {
    res.json({
      enabled: process.env.NODE_ENV === 'development',
      message: 'Test mode allows full access to Stage 2 proactive features without payment restrictions',
      features: [
        'All subscription tiers accessible',
        'Unlimited daily affirmations',
        'Mood tracking with full history',
        'Goal setting and progress tracking',
        'Advanced AI personality system',
        'Built-in AI responses (no API keys needed)'
      ]
    });
  });

  // Documentation Endpoint
  app.get('/api/documentation', (req, res) => {
    res.json({
      title: 'My Pocket Sister - Platform Documentation',
      version: '2.0',
      lastUpdated: 'January 31, 2025',
      url: '/documentation.html',
      sections: [
        'Platform Overview',
        'Core Features',
        'Technical Architecture', 
        'Stage 2 Implementation',
        'Testing System',
        'API Documentation',
        'Admin Functions',
        'Deployment Guide',
        'Troubleshooting'
      ]
    });
  });

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Pricing plans route
  app.get('/api/pricing-plans', async (req, res) => {
    try {
      const plans = await storage.getPricingPlans();
      res.json(plans);
    } catch (error) {
      console.error('Error fetching pricing plans:', error);
      res.status(500).json({ message: 'Failed to fetch pricing plans' });
    }
  });

  // Stripe payment routes
  app.post("/api/create-payment-intent", isAuthenticated, async (req: any, res) => {
    if (!stripe) {
      return res.status(500).json({ message: "Stripe not configured" });
    }
    
    try {
      const { amount } = req.body;
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: "usd",
      });
      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      res
        .status(500)
        .json({ message: "Error creating payment intent: " + error.message });
    }
  });

  // Subscription management
  app.post('/api/create-subscription', isAuthenticated, async (req: any, res) => {
    if (!stripe) {
      return res.status(500).json({ message: "Stripe not configured" });
    }

    try {
      const userId = (req.user as any).claims.sub;
      const { planId } = req.body;
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Create or get Stripe customer
      let customerId = user.customerId;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email || undefined,
          name: `${user.firstName} ${user.lastName}`.trim(),
        });
        customerId = customer.id;
        
        // Update user with customer ID
        await storage.upsertUser({
          ...user,
          customerId,
        });
      }

      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{
          price: planId, // This should be the Stripe price ID
        }],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
      });

      // Save subscription to database
      await storage.createSubscription({
        userId,
        planId,
        stripeSubscriptionId: subscription.id,
        status: subscription.status,
        currentPeriodStart: new Date((subscription as any).current_period_start * 1000),
        currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
      });

      res.json({
        subscriptionId: subscription.id,
        clientSecret: (subscription.latest_invoice as any)?.payment_intent.client_secret,
      });
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  });

  // Child profile routes
  app.get('/api/child-profiles', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const profiles = await storage.getChildProfiles(userId);
      res.json(profiles);
    } catch (error) {
      console.error('Error fetching child profiles:', error);
      res.status(500).json({ message: 'Failed to fetch child profiles' });
    }
  });

  // Test endpoint for child profiles (development only)
  app.get('/api/test/child-profiles', async (req, res) => {
    if (process.env.NODE_ENV !== 'development') {
      return res.status(403).json({ message: 'Test endpoints only available in development' });
    }
    try {
      // Use a test user ID for development testing
      const testUserId = 'test-user-123';
      const profiles = await storage.getChildProfiles(testUserId);
      res.json({ 
        testMode: true, 
        userId: testUserId, 
        profiles,
        message: 'Test endpoint - returns child profiles for test user'
      });
    } catch (error) {
      console.error('Error fetching test child profiles:', error);
      res.status(500).json({ message: 'Failed to fetch test child profiles' });
    }
  });

  // Test endpoint for daily affirmations (development only)
  app.get('/api/test/daily-affirmations', async (req, res) => {
    if (process.env.NODE_ENV !== 'development') {
      return res.status(403).json({ message: 'Test endpoints only available in development' });
    }
    try {
      const testChildId = 'test-child-123';
      const affirmations = await storage.getTodaysAffirmations(testChildId);
      res.json({ 
        testMode: true, 
        childId: testChildId, 
        affirmations,
        count: affirmations.length,
        message: 'Test endpoint - returns todays affirmations for test child'
      });
    } catch (error) {
      console.error('Error fetching test affirmations:', error);
      res.status(500).json({ message: 'Failed to fetch test affirmations' });
    }
  });

  // Test endpoint to generate affirmations (development only)
  app.post('/api/test/daily-affirmations/generate', async (req, res) => {
    if (process.env.NODE_ENV !== 'development') {
      return res.status(403).json({ message: 'Test endpoints only available in development' });
    }
    try {
      const { childId, personalityType = 'friendly', category = 'motivation' } = req.body;
      const testChildId = childId || 'test-child-123';
      
      // Get affirmation template based on category and personality
      const affirmationTemplates = {
        motivation: {
          friendly: ["You're capable of amazing things! Believe in yourself today.", "Your efforts matter more than you know. Keep going!"],
          playful: ["You're absolutely amazing at tackling challenges! 🌟 Keep being awesome!", "Every step you take today is a step toward your dreams! ✨"],
          gentle: ["You have such strength within you, even when things feel difficult.", "Each day brings new possibilities, and you're ready to embrace them."]
        }
      };
      
      const templates = affirmationTemplates[category]?.[personalityType] || affirmationTemplates.motivation.friendly;
      const selectedMessage = templates[Math.floor(Math.random() * templates.length)];
      
      // Create test affirmation
      const affirmation = await storage.createDailyAffirmation({
        childId: testChildId,
        message: selectedMessage,
        category
      });
      
      res.json({ 
        testMode: true, 
        affirmation,
        personalityType,
        category,
        message: 'Test affirmation generated successfully'
      });
    } catch (error) {
      console.error('Error generating test affirmation:', error);
      res.status(500).json({ message: 'Failed to generate test affirmation' });
    }
  });

  // Special OWNER LOGIN endpoint (development only) - for manual testing
  app.post('/api/test/owner-login', async (req, res) => {
    if (process.env.NODE_ENV !== 'development') {
      return res.status(403).json({ message: 'Owner login only available in development' });
    }
    try {
      // Create a mock session for owner testing
      const mockUser = {
        claims: {
          sub: 'owner-test-user-123',
          email: 'owner@test.com',
          first_name: 'Test',
          last_name: 'Owner'
        }
      };
      
      // Set session (simplified for testing)
      req.session.passport = { user: mockUser };
      
      res.json({ 
        testMode: true,
        message: 'Owner test session created',
        userId: mockUser.claims.sub,
        instructions: {
          access: 'You now have access to all protected endpoints',
          profiles: 'Use /api/test/child-profiles to see test child profiles',
          features: 'All Stage 2 features unlocked in test mode'
        }
      });
    } catch (error) {
      console.error('Error creating owner test session:', error);
      res.status(500).json({ message: 'Failed to create owner test session' });
    }
  });

  // Test endpoint for mood tracking (development only)
  app.get('/api/test/mood-entries', async (req, res) => {
    if (process.env.NODE_ENV !== 'development') {
      return res.status(403).json({ message: 'Test endpoints only available in development' });
    }
    try {
      const testChildId = 'test-child-123';
      const entries = await storage.getMoodHistory(testChildId, 30);
      res.json({ 
        testMode: true, 
        childId: testChildId, 
        entries,
        count: entries.length,
        message: 'Test endpoint - returns mood history for test child'
      });
    } catch (error) {
      console.error('Error fetching test mood entries:', error);
      res.status(500).json({ message: 'Failed to fetch test mood entries' });
    }
  });

  // Test endpoint to create mood entry (development only)
  app.post('/api/test/mood-entries/create', async (req, res) => {
    if (process.env.NODE_ENV !== 'development') {
      return res.status(403).json({ message: 'Test endpoints only available in development' });
    }
    try {
      const { childId, moodRating, emotionTags, notes } = req.body;
      const testChildId = childId || 'test-child-123';
      
      // Create test mood entry
      const entry = await storage.createMoodEntry({
        childId: testChildId,
        moodRating: moodRating || Math.floor(Math.random() * 5) + 1,
        emotionTags: emotionTags || ['happy', 'excited'],
        notes: notes || 'Test mood entry created automatically',
        entryDate: new Date().toISOString().split('T')[0]
      });
      
      res.json({ 
        testMode: true, 
        entry,
        message: 'Test mood entry created successfully'
      });
    } catch (error) {
      console.error('Error creating test mood entry:', error);
      res.status(500).json({ message: 'Failed to create test mood entry' });
    }
  });

  app.post('/api/child-profiles', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const profileData = { ...req.body, userId };
      
      const result = insertChildProfileSchema.safeParse(profileData);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid profile data", errors: result.error.errors });
      }

      const profile = await storage.createChildProfile(result.data);
      res.json(profile);
    } catch (error) {
      console.error('Error creating child profile:', error);
      res.status(500).json({ message: 'Failed to create child profile' });
    }
  });

  // Test endpoint for creating child profiles (development only)
  app.post('/api/test/child-profiles', async (req, res) => {
    if (process.env.NODE_ENV !== 'development') {
      return res.status(403).json({ message: 'Test endpoints only available in development' });
    }
    try {
      const testUserId = 'test-user-123';
      const profileData = { ...req.body, userId: testUserId };
      
      const result = insertChildProfileSchema.safeParse(profileData);
      if (!result.success) {
        return res.status(400).json({ 
          message: "Invalid profile data", 
          errors: result.error.errors,
          testMode: true 
        });
      }

      const profile = await storage.createChildProfile(result.data);
      res.json({ 
        testMode: true, 
        profile,
        message: 'Test profile created successfully'
      });
    } catch (error) {
      console.error('Error creating test child profile:', error);
      res.status(500).json({ message: 'Failed to create test child profile' });
    }
  });

  // Chat routes
  app.get('/api/conversations/:childId', isAuthenticated, async (req, res) => {
    try {
      const { childId } = req.params;
      const conversations = await storage.getConversations(childId);
      res.json(conversations);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      res.status(500).json({ message: 'Failed to fetch conversations' });
    }
  });

  app.get('/api/messages/:conversationId', isAuthenticated, async (req, res) => {
    try {
      const { conversationId } = req.params;
      const messages = await storage.getMessages(conversationId);
      res.json(messages);
    } catch (error) {
      console.error('Error fetching messages:', error);
      res.status(500).json({ message: 'Failed to fetch messages' });
    }
  });

  // Chat API with AI integration and personality context
  // Stage 2 Proactive Features - Daily Affirmations API
  app.get('/api/daily-affirmations/:childId', isAuthenticated, async (req: any, res) => {
    try {
      const { childId } = req.params;
      const userId = (req.user as any).claims.sub;
      
      // Check if child belongs to user
      const child = await storage.getChildProfile(childId);
      if (!child || child.userId !== userId) {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      const affirmations = await storage.getTodaysAffirmations(childId);
      res.json(affirmations);
    } catch (error) {
      console.error('Error fetching daily affirmations:', error);
      res.status(500).json({ message: 'Failed to fetch daily affirmations' });
    }
  });

  app.put('/api/daily-affirmations/:affirmationId/read', isAuthenticated, async (req: any, res) => {
    try {
      const { affirmationId } = req.params;
      await storage.markAffirmationAsRead(affirmationId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error marking affirmation as read:', error);
      res.status(500).json({ message: 'Failed to mark affirmation as read' });
    }
  });

  app.post('/api/daily-affirmations', isAuthenticated, async (req: any, res) => {
    try {
      const { childId, message, category } = req.body;
      const userId = (req.user as any).claims.sub;
      
      // Check daily affirmation limit based on subscription tier
      const limit = await storage.getDailyAffirmationLimit(userId);
      const todaysCount = await storage.getTodaysAffirmations(childId);
      
      if (todaysCount.length >= limit) {
        return res.status(429).json({ 
          message: `Daily affirmation limit reached (${limit} per day). Upgrade for more!`,
          upgradeRequired: true 
        });
      }
      
      const affirmation = await storage.createDailyAffirmation({
        childId,
        message,
        category
      });
      
      res.json(affirmation);
    } catch (error) {
      console.error('Error creating daily affirmation:', error);
      res.status(500).json({ message: 'Failed to create daily affirmation' });
    }
  });

  // Stage 2 Proactive Features - Mood Tracking API  
  app.get('/api/mood-tracking/:childId', isAuthenticated, async (req: any, res) => {
    try {
      const { childId } = req.params;
      const userId = (req.user as any).claims.sub;
      
      // Check feature access
      const hasMoodTracking = await storage.checkFeatureAccess(userId, 'moodTracking');
      if (!hasMoodTracking) {
        return res.status(403).json({ 
          message: 'Mood tracking requires Premium subscription',
          upgradeRequired: true 
        });
      }
      
      const days = parseInt(req.query.days as string) || 30;
      const moodHistory = await storage.getMoodHistory(childId, days);
      res.json(moodHistory);
    } catch (error) {
      console.error('Error fetching mood history:', error);
      res.status(500).json({ message: 'Failed to fetch mood history' });
    }
  });

  app.post('/api/mood-entry', isAuthenticated, async (req: any, res) => {
    try {
      const { childId, mood, moodScore, notes } = req.body;
      const userId = (req.user as any).claims.sub;
      
      // Check feature access
      const hasMoodTracking = await storage.checkFeatureAccess(userId, 'moodTracking');
      if (!hasMoodTracking) {
        return res.status(403).json({ 
          message: 'Mood tracking requires Premium subscription',
          upgradeRequired: true 
        });
      }
      
      const today = new Date().toISOString().split('T')[0];
      const moodEntry = await storage.createMoodEntry({
        childId,
        mood,
        moodScore,
        notes,
        entryDate: today
      });
      
      res.json(moodEntry);
    } catch (error) {
      console.error('Error creating mood entry:', error);
      res.status(500).json({ message: 'Failed to create mood entry' });
    }
  });

  // Stage 2 Proactive Features - Goals API
  app.get('/api/goals/:childId', isAuthenticated, async (req: any, res) => {
    try {
      const { childId } = req.params;
      const userId = (req.user as any).claims.sub;
      
      // Check feature access
      const hasGoalTracking = await storage.checkFeatureAccess(userId, 'goalTracking');
      if (!hasGoalTracking) {
        return res.status(403).json({ 
          message: 'Goal tracking requires Premium subscription',
          upgradeRequired: true 
        });
      }
      
      const includeCompleted = req.query.completed === 'true';
      const goals = await storage.getChildGoals(childId, includeCompleted);
      res.json(goals);
    } catch (error) {
      console.error('Error fetching goals:', error);
      res.status(500).json({ message: 'Failed to fetch goals' });
    }
  });

  app.post('/api/goals', isAuthenticated, async (req: any, res) => {
    try {
      const { childId, title, description, category, targetDate } = req.body;
      const userId = (req.user as any).claims.sub;
      
      // Check feature access
      const hasGoalTracking = await storage.checkFeatureAccess(userId, 'goalTracking');
      if (!hasGoalTracking) {
        return res.status(403).json({ 
          message: 'Goal tracking requires Premium subscription',
          upgradeRequired: true 
        });
      }
      
      const goal = await storage.createChildGoal({
        childId,
        title,
        description,
        category,
        targetDate
      });
      
      res.json(goal);
    } catch (error) {
      console.error('Error creating goal:', error);
      res.status(500).json({ message: 'Failed to create goal' });
    }
  });

  app.put('/api/goals/:goalId/progress', isAuthenticated, async (req: any, res) => {
    try {
      const { goalId } = req.params;
      const { progress } = req.body;
      const userId = (req.user as any).claims.sub;
      
      // Check feature access
      const hasGoalTracking = await storage.checkFeatureAccess(userId, 'goalTracking');
      if (!hasGoalTracking) {
        return res.status(403).json({ 
          message: 'Goal tracking requires Premium subscription',
          upgradeRequired: true 
        });
      }
      
      const goal = await storage.updateGoalProgress(goalId, progress);
      res.json(goal);
    } catch (error) {
      console.error('Error updating goal progress:', error);
      res.status(500).json({ message: 'Failed to update goal progress' });
    }
  });

  app.post('/api/chat', isAuthenticated, async (req: any, res) => {
    try {
      const { message, conversationId, childId } = req.body;
      const userId = (req.user as any).claims.sub;

      // Get child's personality profile for context
      const personality = await storage.getChildPersonality(childId);
      const recentContext = await storage.getRecentConversationContext(childId, 5);
      
      // Default response for web browsing requests
      if (message.toLowerCase().includes('website') || 
          message.toLowerCase().includes('youtube') || 
          message.toLowerCase().includes('browse') ||
          message.toLowerCase().includes('look up') ||
          message.toLowerCase().includes('search for')) {
        
        // Extract what they want to look up
        const contentRequest = message.toLowerCase();
        let requestType = 'website';
        if (contentRequest.includes('youtube')) requestType = 'YouTube video';
        if (contentRequest.includes('game')) requestType = 'game';
        
        // Personalized response based on personality
        let aiResponse = "I can't browse the internet right now, but I can ask your parents to upgrade so I can help you explore websites and videos safely! Would you like me to send them a message about this?";
        
        if (personality?.communicationStyle === 'playful') {
          aiResponse = "Oh, I wish I could help you explore the web right now! 🌐 But I need to ask your parents to upgrade first so we can browse safely together. Should I send them a message about what you want to check out?";
        } else if (personality?.communicationStyle === 'gentle') {
          aiResponse = "I understand you'd like to look something up. I'm not able to browse websites just yet, but I can reach out to your parents about upgrading so we can explore together safely. Would that be okay with you?";
        }
        
        // Save user message
        await storage.createMessage({
          conversationId,
          role: 'user',
          content: message,
          tokensUsed: 0
        });

        // Save AI response
        await storage.createMessage({
          conversationId,
          role: 'assistant', 
          content: aiResponse,
          tokensUsed: 25 // Estimated tokens for this response
        });

        res.json({
          response: aiResponse,
          showUpgradePrompt: true,
          requestedContent: message,
          requestType
        });
        return;
      }

      // Check if advanced personality AI is enabled for this user's tier
      const hasAdvancedAI = await storage.checkFeatureAccess(userId, 'advancedPersonalityAI');
      
      // Generate personalized AI response based on context and personality
      let aiResponse = await generatePersonalizedResponse(message, personality, recentContext, hasAdvancedAI);
      
      // In development mode, enhance responses with test mode indicators
      if (process.env.NODE_ENV === 'development') {
        aiResponse += "\n\n💡 *Test Mode Active: All premium features unlocked for testing*";
      }
      
      // Update personality profile only for premium users with advanced AI
      if (hasAdvancedAI) {
        await updatePersonalityFromInteraction(childId, message, personality);
      }
      
      // Save user message
      await storage.createMessage({
        conversationId,
        role: 'user',
        content: message,
        tokensUsed: message.length / 4 // Rough token estimation
      });

      // Save AI response
      await storage.createMessage({
        conversationId,
        role: 'assistant',
        content: aiResponse,
        tokensUsed: aiResponse.length / 4
      });

      res.json({ response: aiResponse });
    } catch (error) {
      console.error('Chat error:', error);
      res.status(500).json({ message: 'Failed to process chat message' });
    }
  });

  // Admin routes
  app.get('/api/admin/users', isAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ message: 'Failed to fetch users' });
    }
  });

  app.post('/api/admin/users/:userId/subscription', isAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      const { status } = req.body;
      
      await storage.updateUserSubscription(userId, status);
      res.json({ message: 'User subscription updated successfully' });
    } catch (error) {
      console.error('Error updating user subscription:', error);
      res.status(500).json({ message: 'Failed to update user subscription' });
    }
  });

  app.get('/api/admin/announcements', isAdmin, async (req, res) => {
    try {
      const announcements = await storage.getAnnouncements();
      res.json(announcements);
    } catch (error) {
      console.error('Error fetching announcements:', error);
      res.status(500).json({ message: 'Failed to fetch announcements' });
    }
  });

  app.post('/api/admin/announcements', isAdmin, async (req: any, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const announcementData = { ...req.body, createdBy: userId };
      
      const result = insertAnnouncementSchema.safeParse(announcementData);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid announcement data", errors: result.error.errors });
      }

      const announcement = await storage.createAnnouncement(result.data);
      res.json(announcement);
    } catch (error) {
      console.error('Error creating announcement:', error);
      res.status(500).json({ message: 'Failed to create announcement' });
    }
  });

  // Announcements for users
  app.get('/api/announcements', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const user = await storage.getUser(userId);
      const targetAudience = user?.subscriptionStatus || 'free';
      
      const announcements = await storage.getAnnouncements(targetAudience);
      res.json(announcements);
    } catch (error) {
      console.error('Error fetching announcements:', error);
      res.status(500).json({ message: 'Failed to fetch announcements' });
    }
  });

  // Existing routes for blog, testimonials, etc.
  app.get("/api/blog-posts", async (req, res) => {
    try {
      const posts = await storage.getBlogPosts();
      res.json(posts);
    } catch (error) {
      console.error("Error fetching blog posts:", error);
      res.status(500).json({ message: "Failed to fetch blog posts" });
    }
  });

  app.get("/api/testimonials", async (req, res) => {
    try {
      const testimonials = await storage.getTestimonials();
      res.json(testimonials);
    } catch (error) {
      console.error("Error fetching testimonials:", error);
      res.status(500).json({ message: "Failed to fetch testimonials" });
    }
  });

  app.post("/api/contact", async (req, res) => {
    try {
      const result = insertContactMessageSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ 
          message: "Invalid contact data", 
          errors: result.error.errors 
        });
      }

      const message = await storage.createContactMessage(result.data);
      res.json(message);
    } catch (error) {
      console.error("Error creating contact message:", error);
      res.status(500).json({ message: "Failed to create contact message" });
    }
  });

  app.get("/api/motivational-messages/random", async (req, res) => {
    try {
      const category = req.query.category as string;
      const message = await storage.getRandomMotivationalMessage(category);
      
      if (!message) {
        return res.status(404).json({ message: "No motivational messages found" });
      }
      
      res.json(message);
    } catch (error) {
      console.error("Error fetching motivational message:", error);
      res.status(500).json({ message: "Failed to fetch motivational message" });
    }
  });

  // Parent portal routes for usage monitoring
  app.get('/api/parent/token-stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const stats = await storage.getUserTokenStats(userId);
      res.json(stats);
    } catch (error) {
      console.error('Error fetching token stats:', error);
      res.status(500).json({ message: 'Failed to fetch token statistics' });
    }
  });

  app.post('/api/parent/usage-alert', isAuthenticated, async (req: any, res) => {
    try {
      const alertData = req.body;
      const alert = await storage.createUsageAlert(alertData);
      res.json(alert);
    } catch (error) {
      console.error('Error creating usage alert:', error);
      res.status(500).json({ message: 'Failed to create usage alert' });
    }
  });

  app.get('/api/parent/usage-alerts/:childId', isAuthenticated, async (req: any, res) => {
    try {
      const { childId } = req.params;
      const alerts = await storage.getUsageAlerts(childId);
      res.json(alerts);
    } catch (error) {
      console.error('Error fetching usage alerts:', error);
      res.status(500).json({ message: 'Failed to fetch usage alerts' });
    }
  });

  // Admin message usage tracking routes
  app.get('/api/admin/usage-overview', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const users = await storage.getAllUsers();
      const usageData = [];
      
      for (const user of users) {
        const stats = await storage.getUserTokenStats(user.id);
        usageData.push({
          userId: user.id,
          userEmail: user.email,
          userName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
          profiles: stats
        });
      }
      
      res.json(usageData);
    } catch (error) {
      console.error('Error fetching usage overview:', error);
      res.status(500).json({ message: 'Failed to fetch usage overview' });
    }
  });

  app.get('/api/admin/users/:userId/token-stats', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const stats = await storage.getUserTokenStats(userId);
      res.json(stats);
    } catch (error) {
      console.error('Error fetching token stats:', error);
      res.status(500).json({ message: 'Failed to fetch token statistics' });
    }
  });

  // Push notification routes
  app.post('/api/notifications/register-device', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const { token, platform } = req.body;
      
      if (!token || !platform) {
        return res.status(400).json({ message: 'Token and platform are required' });
      }

      await notificationService.registerDeviceToken(userId, token, platform);
      res.json({ success: true, message: 'Device token registered successfully' });
    } catch (error) {
      console.error('Error registering device token:', error);
      res.status(500).json({ message: 'Failed to register device token' });
    }
  });

  app.get('/api/notifications/history', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const limit = parseInt(req.query.limit as string) || 50;
      
      const history = await notificationService.getNotificationHistory(userId, limit);
      res.json(history);
    } catch (error) {
      console.error('Error fetching notification history:', error);
      res.status(500).json({ message: 'Failed to fetch notification history' });
    }
  });

  app.put('/api/notifications/preferences', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const preferences = req.body;
      
      await notificationService.updateNotificationPreferences(userId, preferences);
      res.json({ success: true, message: 'Notification preferences updated' });
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      res.status(500).json({ message: 'Failed to update notification preferences' });
    }
  });

  app.post('/api/notifications/mark-read/:notificationId', isAuthenticated, async (req: any, res) => {
    try {
      const { notificationId } = req.params;
      
      // Mark notification as read
      await storage.markNotificationAsRead(notificationId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({ message: 'Failed to mark notification as read' });
    }
  });

  // Admin notification routes
  app.post('/api/admin/notifications/broadcast', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { title, message, targetAudience, priority } = req.body;
      
      await notificationService.sendSystemAnnouncement({
        title,
        message,
        targetAudience,
        priority: priority || 'normal'
      });
      
      res.json({ success: true, message: 'Announcement broadcast successfully' });
    } catch (error) {
      console.error('Error broadcasting announcement:', error);
      res.status(500).json({ message: 'Failed to broadcast announcement' });
    }
  });

  app.post('/api/admin/notifications/emergency', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { userId, title, message, childId, actionRequired } = req.body;
      
      await notificationService.sendEmergencyAlert(userId, {
        title,
        message,
        childId,
        actionRequired
      });
      
      res.json({ success: true, message: 'Emergency alert sent successfully' });
    } catch (error) {
      console.error('Error sending emergency alert:', error);
      res.status(500).json({ message: 'Failed to send emergency alert' });
    }
  });

  // Test notification route (development only)
  if (process.env.NODE_ENV === 'development') {
    app.post('/api/notifications/test', isAuthenticated, async (req: any, res) => {
      try {
        const userId = (req.user as any).claims.sub;
        const { type, childId } = req.body;
        
        switch (type) {
          case 'usage_alert':
            await notificationService.sendUsageAlert(childId || 'test-child-id', 85, 42500, 50000);
            break;
          case 'emergency_alert':
            await notificationService.sendEmergencyAlert(userId, {
              title: 'Test Emergency Alert',
              message: 'This is a test emergency alert to verify the notification system.',
              actionRequired: false
            });
            break;
          default:
            return res.status(400).json({ message: 'Invalid test type' });
        }
        
        res.json({ success: true, message: `Test ${type} sent successfully` });
      } catch (error) {
        console.error('Error sending test notification:', error);
        res.status(500).json({ message: 'Failed to send test notification' });
      }
    });
  }

  // Web content browsing endpoints
  app.post("/api/web-content/check-availability", isAuthenticated, async (req, res) => {
    try {
      const { childId, url, type } = req.body;
      const userId = (req.user as any)?.claims?.sub;
      
      // Check if user has web browsing capability (basic plan doesn't include web browsing)
      const subscription = await storage.getUserSubscription(userId);
      const hasWebBrowsing = subscription?.planId !== 'trial-7day' && subscription?.planId !== 'plus-monthly';
      
      res.json({
        available: hasWebBrowsing,
        requiresUpgrade: !hasWebBrowsing,
        recommendedPlan: hasWebBrowsing ? null : 'premium'
      });
    } catch (error) {
      console.error("Error checking web browsing availability:", error);
      res.status(500).json({ message: "Failed to check availability" });
    }
  });

  app.post("/api/web-content/request", isAuthenticated, async (req, res) => {
    try {
      const { childId, conversationId, url, type, context } = req.body;
      
      // This would integrate with web scraping service or YouTube transcript API
      const response = "I can't browse the web or check YouTube videos right now, but I can ask your parents to help me get that ability! Would you like me to send them a message about upgrading to a plan that includes web browsing?";
      
      // Store the response as a message in the conversation
      await storage.addMessage({
        conversationId,
        role: 'assistant',
        content: response,
        tokensUsed: 20
      });
      
      res.json({ success: true, response });
    } catch (error) {
      console.error("Error processing web content request:", error);
      res.status(500).json({ message: "Failed to process request" });
    }
  });

  app.post("/api/parent/web-browsing-request", isAuthenticated, async (req, res) => {
    try {
      const { childId, requestedContent, requestType } = req.body;
      const userId = (req.user as any)?.claims?.sub;
      
      // Send notification to parent about upgrade request
      await storage.createNotification({
        userId,
        childId,
        type: 'upgrade_request',
        title: 'Web Browsing Upgrade Request',
        body: `Your child would like me to check out some ${requestType} content: ${requestedContent}. Consider upgrading to enable web browsing features!`,
        priority: 'normal'
      });

      // Send email notification to parent
      try {
        const user = await storage.getUser(userId);
        if (user?.email) {
          await sendUpgradeRequestEmail(user.email, "your child", requestedContent, requestType);
        }
      } catch (emailError) {
        console.error("Failed to send upgrade request email:", emailError);
      }
      
      res.json({ success: true, message: "Parent notification sent" });
    } catch (error) {
      console.error("Error sending parent notification:", error);
      res.status(500).json({ message: "Failed to send notification" });
    }
  });

  // Free trial management
  app.post("/api/subscription/start-trial", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      
      // Check if user already has a subscription
      const existingSubscription = await storage.getUserSubscription(userId);
      if (existingSubscription) {
        return res.status(400).json({ message: "User already has a subscription" });
      }
      
      // Create trial subscription
      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + 7);
      
      const subscription = await storage.createSubscription({
        userId,
        planId: 'trial-7day',
        status: 'trialing',
        currentPeriodStart: new Date(),
        currentPeriodEnd: trialEndDate
      });

      // Send welcome email to parent
      try {
        const user = await storage.getUser(userId);
        if (user?.email) {
          await sendTrialWelcomeEmail(user.email, "your child");
        }
      } catch (emailError) {
        console.error("Failed to send welcome email:", emailError);
        // Don't fail the subscription creation if email fails
      }
      
      res.json({ 
        success: true, 
        subscription,
        message: "7-day free trial started!" 
      });
    } catch (error) {
      console.error("Error starting trial:", error);
      res.status(500).json({ message: "Failed to start trial" });
    }
  });

  app.get("/api/subscription/trial-status", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const subscription = await storage.getUserSubscription(userId);
      
      if (!subscription) {
        return res.json({
          hasSubscription: false,
          canStartTrial: true,
          trialEligible: true
        });
      }
      
      const isTrialing = subscription.status === 'trialing';
      const trialExpired = subscription.currentPeriodEnd && new Date() > new Date(subscription.currentPeriodEnd);
      
      res.json({
        hasSubscription: true,
        isTrialing,
        trialExpired,
        canStartTrial: false,
        subscription
      });
    } catch (error) {
      console.error("Error checking trial status:", error);
      res.status(500).json({ message: "Failed to check trial status" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}