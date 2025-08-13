import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { adminAuth, adminLogin, isAdmin } from "./admin-auth";
import { storage } from "./storage";
import { insertContactMessageSchema, insertChildProfileSchema, insertAnnouncementSchema, insertConversationSchema, insertMessageSchema, insertDailyAffirmationSchema, insertMoodEntrySchema, insertChildGoalSchema, insertChildReminderSchema, type ChildPersonality, type Message } from "@shared/schema";
import Stripe from "stripe";
import testMemoryRoutes from "./routes/test-memory";
import contextManagementRoutes from "./routes/context-management";
import conversationManagementRoutes from "./routes/conversation-management";
import geminiCacheTestRoutes from "./routes/gemini-cache-test";
import adminAvatarGraphicsRoutes from "./routes/admin-avatar-graphics";
import backgroundMusicRoutes from "./routes/background-music";
import featureDocumentationRoutes from "./routes/feature-documentation";
import adminTestingRoutes from "./routes/admin-testing";
import { registerAdminRoutes } from "./admin-routes";
import parentMessagingRoutes from "./routes/parent-messaging";
import { tokenManager } from "./token-management";
import { db } from './db.js';
import { 
  users, childProfiles, subscriptions, pricingPlans, announcements, conversations, messages, 
  conversationMemory, childPersonalities, usageAlerts, parentControls, safetyAlerts,
  savedConversations, conversationGroups, conversationMessages, avatarConfigurations,
  contextSessions, safetyMonitoringAddons
} from '../shared/schema.js';
import { eq, sql } from 'drizzle-orm';
import { fileURLToPath } from 'url';
import path from 'path';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Stripe if we have the secret key
let stripe: Stripe | null = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-07-30.basil",
  });
}

// Admin middleware
function requireAdmin(req: any, res: any, next: any) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  // PRODUCTION FIX: Re-enable authentication now that static file issue is resolved
  try {
    await setupAuth(app);
    console.log('✅ Authentication setup completed successfully');
  } catch (error) {
    console.error('❌ Authentication setup failed:', error);
    console.log('⚠️  Server will continue without authentication middleware');
    // Add a warning endpoint to indicate auth is disabled
    app.get('/api/auth-status', (req, res) => {
      res.status(503).json({
        status: 'disabled',
        message: 'Authentication middleware failed to initialize',
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      });
    });
  }

  // Initialize pricing plans - also wrap in try-catch
  try {
    await storage.initializePricingPlans();
    console.log('✅ Pricing plans initialized successfully');
  } catch (error) {
    console.error('❌ Pricing plans initialization failed:', error);
    console.log('⚠️  Server will continue without pricing plans');
  }

  // Test routes (development only)
  if (process.env.NODE_ENV === 'development') {
    app.use('/api/test', testMemoryRoutes);
  }

  // Context management routes
  app.use('/api/context', contextManagementRoutes);

  // Conversation management routes
  app.use('/api/conversations', conversationManagementRoutes);

  // Gemini cache testing routes (development only)
  if (process.env.NODE_ENV === 'development') {
    app.use('/api/gemini-cache', geminiCacheTestRoutes);
  }

  // Admin avatar graphics management routes
  app.use('/api/admin/avatar-graphics', adminAvatarGraphicsRoutes);

  // Register secure admin authentication routes
  try {
    registerAdminRoutes(app);
    console.log('✅ Secure admin authentication routes registered');
  } catch (error) {
    console.error('❌ Admin routes registration failed:', error);
  }

  // Admin metrics routes
  const adminMetricsRoutes = await import('./admin-metrics-routes');
  app.use('/api/admin/metrics', adminMetricsRoutes.default);
  console.log('✅ Admin metrics routes registered');

  // Admin testing routes - use direct import to fix bundling issues
  app.use('/api/admin/testing', adminTestingRoutes);
  console.log('Admin testing routes registered at /api/admin/testing');

  // Background music routes
  app.use('/api/background-music', backgroundMusicRoutes);

  // Feature documentation routes
  app.use('/api/features', featureDocumentationRoutes);

  // Parent messaging and device management routes
  app.use('/api/parent-messaging', parentMessagingRoutes);

  // Enhanced parent control routes
  const enhancedParentControlsRoutes = await import('./routes/enhanced-parent-controls');
  app.use('/api/enhanced-parent', enhancedParentControlsRoutes.default);
  console.log('✅ Enhanced parent control routes registered');

  // Test Mode Status Endpoint
  app.get('/api/test-mode', (req, res) => {
    try {
      console.log('Test mode endpoint hit');
      res.json({
        enabled: process.env.NODE_ENV === 'development',
        message: 'Test mode allows full access to features without payment restrictions',
        features: ['All subscription tiers accessible'],
        environment: process.env.NODE_ENV || 'unknown'
      });
    } catch (error) {
      console.error('Error in test-mode endpoint:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Simple debug endpoint to test API routing in production
  app.get('/api/debug/status', (req, res) => {
    try {
      console.log('Debug status endpoint hit in production');
      res.json({
        success: true,
        message: 'API routing is working',
        environment: process.env.NODE_ENV || 'unknown',
        timestamp: new Date().toISOString(),
        nodeVersion: process.version,
        platform: process.platform
      });
    } catch (error) {
      console.error('Error in debug status endpoint:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      });
    }
  });

  // Version endpoint to track deployments
  app.get('/api/version', async (req, res) => {
    try {
      const fs = await import('fs');
      const path = await import('path');
      
      // Try multiple possible paths for version.json
      const possiblePaths = [
        path.default.join(__dirname, '../version.json'),  // Development
        path.default.join(process.cwd(), 'version.json'), // Production root
        path.default.join(__dirname, '../../version.json') // Compiled dist folder
      ];
      
      let versionData = null;
      let foundPath = null;
      
      for (const versionPath of possiblePaths) {
        if (fs.default.existsSync(versionPath)) {
          versionData = JSON.parse(fs.default.readFileSync(versionPath, 'utf8'));
          foundPath = versionPath;
          break;
        }
      }
      
      if (versionData) {
        res.json({
          ...versionData,
          foundAt: foundPath,
          __dirname: __dirname,
          cwd: process.cwd()
        });
      } else {
        res.json({
          version: 'unknown',
          build: 0,
          timestamp: new Date().toISOString(),
          description: 'Version file not found in any expected location',
          searchedPaths: possiblePaths,
          __dirname: __dirname,
          cwd: process.cwd()
        });
      }
    } catch (error) {
      res.status(500).json({
        version: 'error',
        build: 0,
        timestamp: new Date().toISOString(),
        description: 'Error reading version file',
        error: error instanceof Error ? error.message : String(error),
        __dirname: __dirname,
        cwd: process.cwd()
      });
    }
  });

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Admin routes
  app.post('/api/admin/login', adminLogin);

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
      
      res.json({
        success: true,
        message: 'User subscription updated successfully'
      });
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

  app.post('/api/admin/announcements', isAdmin, async (req, res) => {
    try {
      const announcementData = insertAnnouncementSchema.parse(req.body);
      const announcement = await storage.createAnnouncement(announcementData);
      
      res.json({
        success: true,
        message: 'Announcement created successfully',
        announcement
      });
    } catch (error) {
      console.error('Error creating announcement:', error);
      res.status(500).json({ message: 'Failed to create announcement' });
    }
  });

  app.get('/api/admin/stats', isAdmin, async (req, res) => {
    try {
      const stats = await storage.getSystemStats();
      res.json(stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
      res.status(500).json({ message: 'Failed to fetch stats' });
    }
  });

  // Child Profile Management Routes
  app.get('/api/admin/child-profiles', isAdmin, async (req, res) => {
    try {
      const profiles = await storage.getAllChildProfiles();
      res.json(profiles);
    } catch (error) {
      console.error('Error fetching child profiles:', error);
      res.status(500).json({ message: 'Failed to fetch child profiles' });
    }
  });

  app.post('/api/admin/child-profiles', isAdmin, async (req, res) => {
    try {
      const profileData = req.body;
      const profile = await storage.createChildProfileAdmin(profileData);
      res.json({
        success: true,
        message: 'Child profile created successfully',
        profile
      });
    } catch (error) {
      console.error('Error creating child profile:', error);
      res.status(500).json({ message: 'Failed to create child profile' });
    }
  });

  app.put('/api/admin/child-profiles/:childId/status', isAdmin, async (req, res) => {
    try {
      const { childId } = req.params;
      const { status } = req.body;
      
      const profile = await storage.updateChildProfileStatus(childId, status);
      
      res.json({
        success: true,
        message: `Child profile ${status}`,
        profile
      });
    } catch (error) {
      console.error('Error updating child profile status:', error);
      res.status(500).json({ message: 'Failed to update child profile status' });
    }
  });

  app.put('/api/admin/child-profiles/:childId/tier', isAdmin, async (req, res) => {
    try {
      const { childId } = req.params;
      const { tier } = req.body;
      
      const profile = await storage.upgradeChildProfile(childId, tier);
      
      res.json({
        success: true,
        message: `Child profile upgraded to ${tier}`,
        profile
      });
    } catch (error) {
      console.error('Error upgrading child profile:', error);
      res.status(500).json({ message: 'Failed to upgrade child profile' });
    }
  });

  app.delete('/api/admin/child-profiles/:childId', isAdmin, async (req, res) => {
    try {
      const { childId } = req.params;
      
      const deleted = await storage.deleteChildProfile(childId);
      
      if (deleted) {
        res.json({
          success: true,
          message: 'Child profile deleted successfully'
        });
      } else {
        res.status(500).json({ message: 'Failed to delete child profile' });
      }
    } catch (error) {
      console.error('Error deleting child profile:', error);
      res.status(500).json({ message: 'Failed to delete child profile' });
    }
  });

  // Basic API routes
  app.get('/api/pricing-plans', async (req, res) => {
    try {
      const plans = await storage.getPricingPlans();
      res.json(plans);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Token Management API Routes
  app.get('/api/tokens/status/:childId', async (req, res) => {
    try {
      const { childId } = req.params;
      const tokenStatus = await tokenManager.checkTokenAvailability(childId);
      res.json(tokenStatus);
    } catch (error: any) {
      console.error('Error checking token status:', error);
      res.status(500).json({ message: error.message });
    }
  });

  app.get('/api/tokens/restrictions/:childId', async (req, res) => {
    try {
      const { childId } = req.params;
      const restrictions = await tokenManager.getFeatureRestrictions(childId);
      res.json(restrictions);
    } catch (error: any) {
      console.error('Error getting feature restrictions:', error);
      res.status(500).json({ message: error.message });
    }
  });

  app.post('/api/tokens/purchase', async (req, res) => {
    try {
      const { childId, tokenAmount } = req.body;
      
      if (!childId || !tokenAmount || tokenAmount < 1000) {
        return res.status(400).json({ 
          message: 'Invalid request. Child ID and token amount (minimum 1000) required.' 
        });
      }

      const result = await tokenManager.purchaseTokens(childId, tokenAmount);
      
      if (!result.success) {
        return res.status(400).json({ message: result.error });
      }

      res.json({
        success: true,
        message: 'Tokens purchased successfully',
        tokensAdded: tokenAmount,
        newLimit: result.newLimit,
        cost: result.cost
      });
    } catch (error: any) {
      console.error('Error purchasing tokens:', error);
      res.status(500).json({ message: error.message });
    }
  });

  app.get('/api/tokens/analytics/:childId', async (req, res) => {
    try {
      const { childId } = req.params;
      const days = parseInt(req.query.days as string) || 30;
      const analytics = await tokenManager.getUsageAnalytics(childId, days);
      res.json(analytics);
    } catch (error: any) {
      console.error('Error getting usage analytics:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Chat API with token validation
  app.post('/api/chat/send', async (req, res) => {
    try {
      const { message, childId, conversationId, fileUrl, fileName, fileMimeType } = req.body;
      
      if (!childId || !message) {
        return res.status(400).json({ message: 'Child ID and message are required' });
      }

      // Check token availability first
      const tokenStatus = await tokenManager.checkTokenAvailability(childId, 100);
      if (!tokenStatus.hasTokens) {
        return res.status(402).json({ 
          message: 'Monthly token limit reached',
          tokenStatus,
          upgradeRequired: true
        });
      }

      // Import and use GeminiChatManager
      const { geminiChat } = await import('./gemini-integration');
      const response = await geminiChat.processChildMessage(childId, message);

      res.json({
        success: true,
        response: response.response,
        metrics: response.performanceMetrics,
        conversation: { id: conversationId || 'new' }
      });
    } catch (error: any) {
      console.error('Chat API error:', error);
      
      if (error.message.includes('Insufficient tokens')) {
        return res.status(402).json({ 
          message: error.message,
          upgradeRequired: true
        });
      }
      
      res.status(500).json({ message: error.message });
    }
  });

  // Voice synthesis API with token validation
  app.post('/api/voice/synthesize', async (req, res) => {
    try {
      const { text, childId } = req.body;
      
      if (!childId || !text) {
        return res.status(400).json({ message: 'Child ID and text are required' });
      }

      // Check token availability (voice synthesis requires premium)
      const restrictions = await tokenManager.getFeatureRestrictions(childId);
      if (restrictions.voiceSynthesis.restricted) {
        return res.status(402).json({
          message: restrictions.voiceSynthesis.reason,
          upgradeRequired: restrictions.voiceSynthesis.upgradeRequired
        });
      }

      // Record token usage
      const estimatedTokens = Math.ceil(text.length / 2); // Voice synthesis token estimation
      await tokenManager.recordTokenUsage(childId, estimatedTokens, 'voice_synthesis');

      // For now, return success to enable browser fallback
      // TODO: Integrate with ElevenLabs API when ready
      res.json({
        success: false, // Triggers browser fallback
        message: 'ElevenLabs integration pending - using browser synthesis'
      });
      
    } catch (error: any) {
      console.error('Voice synthesis error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Feature Discovery API Routes
  app.get('/api/features/:featureName', async (req, res) => {
    try {
      const { featureName } = req.params;
      const { FeatureDiscoveryService } = await import('./feature-discovery');
      
      const featureInfo = FeatureDiscoveryService.getFeatureInfo(featureName);
      if (!featureInfo) {
        return res.status(404).json({ 
          message: 'Feature not found',
          availableFeatures: ['ai_chat', 'voice_synthesis', 'avatar_creation', 'mood_tracking', 'goal_setting']
        });
      }
      
      res.json(featureInfo);
    } catch (error: any) {
      console.error('Feature info error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  app.get('/api/features', async (req, res) => {
    try {
      const { category, plan } = req.query;
      const { FeatureDiscoveryService } = await import('./feature-discovery');
      
      let features;
      if (category) {
        features = FeatureDiscoveryService.getFeaturesByCategory(category as string);
      } else if (plan) {
        features = FeatureDiscoveryService.getFeaturesForPlan(plan as string);
      } else {
        // Return all features organized by category
        features = {
          core: FeatureDiscoveryService.getFeaturesByCategory('core'),
          communication: FeatureDiscoveryService.getFeaturesByCategory('communication'),
          creative: FeatureDiscoveryService.getFeaturesByCategory('creative'),
          analytics: FeatureDiscoveryService.getFeaturesByCategory('analytics'),
          premium: FeatureDiscoveryService.getFeaturesByCategory('premium')
        };
      }
      
      res.json(features);
    } catch (error: any) {
      console.error('Features list error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  app.get('/api/plans', async (req, res) => {
    try {
      const { FeatureDiscoveryService } = await import('./feature-discovery');
      const plans = FeatureDiscoveryService.getPlanComparison();
      res.json(plans);
    } catch (error: any) {
      console.error('Plans comparison error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  app.get('/api/upgrade-recommendations/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      const { FeatureDiscoveryService } = await import('./feature-discovery');
      
      const recommendations = await FeatureDiscoveryService.getUpgradeRecommendations(userId);
      res.json(recommendations);
    } catch (error: any) {
      console.error('Upgrade recommendations error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  app.post('/api/contextual-help', async (req, res) => {
    try {
      const { query } = req.body;
      if (!query) {
        return res.status(400).json({ message: 'Query is required' });
      }
      
      const { FeatureDiscoveryService } = await import('./feature-discovery');
      const helpInfo = FeatureDiscoveryService.generateContextualHelp(query);
      res.json(helpInfo);
    } catch (error: any) {
      console.error('Contextual help error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Avatar Analysis API Routes
  app.get('/api/avatar/analyze/:childId', async (req, res) => {
    try {
      const { childId } = req.params;
      
      // Get child's current active avatar
      const avatars = await storage.getChildAvatars(childId);
      if (!avatars || avatars.length === 0) {
        return res.status(404).json({ 
          message: 'No avatar found',
          suggestion: 'Create an avatar first in the Avatar Creator!'
        });
      }

      const activeAvatar = avatars.find((avatar) => avatar.isActive);
      if (!activeAvatar) {
        return res.status(404).json({ 
          message: 'No active avatar found',
          suggestion: 'Create or activate an avatar in the Avatar Creator!'
        });
      }

      // Generate analysis
      const analysis = generateAvatarAnalysis(activeAvatar.configData as any, activeAvatar.name);
      
      res.json({
        avatar: {
          name: activeAvatar.name,
          createdAt: activeAvatar.createdAt,
          unlockLevel: activeAvatar.unlockLevel
        },
        analysis
      });
    } catch (error: any) {
      console.error('Avatar analysis error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Settings Management API Routes
  app.get('/api/settings/:childId', async (req, res) => {
    try {
      const { childId } = req.params;
      const { category } = req.query;
      
      const child = await storage.getChildProfile?.(childId);
      if (!child) {
        return res.status(404).json({ message: 'Child profile not found' });
      }

      const settings = buildChildSettings(child, category as string);
      res.json({
        settings,
        currentPlan: 'free' // TODO: Add subscriptionTier to child profile schema
      });
    } catch (error: any) {
      console.error('Settings retrieval error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  app.post('/api/settings/:childId/update', async (req, res) => {
    try {
      const { childId } = req.params;
      const { settingType, newValue } = req.body;
      
      if (!settingType || !newValue) {
        return res.status(400).json({ message: 'Setting type and new value are required' });
      }

      // For now, return guidance on how to update settings
      // TODO: Implement actual settings update logic
      const settingGuidance = getSettingUpdateGuidance(settingType, newValue);
      
      res.json({
        success: true,
        guidance: settingGuidance,
        message: `Here's how to update your ${settingType} setting`
      });
    } catch (error: any) {
      console.error('Settings update error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // AI Provider Management API Routes (Admin)
  app.get('/api/admin/ai-providers', async (req, res) => {
    try {
      const { aiProviderManager } = await import('./ai-providers');
      const status = aiProviderManager.getProviderStatus();
      
      res.json({
        success: true,
        providers: status,
        message: 'AI provider status retrieved successfully'
      });
    } catch (error: any) {
      console.error('AI providers status error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  app.post('/api/admin/ai-providers/switch', async (req, res) => {
    try {
      const { providerId } = req.body;
      
      if (!providerId) {
        return res.status(400).json({ message: 'Provider ID is required' });
      }

      const { aiProviderManager } = await import('./ai-providers');
      const success = await aiProviderManager.switchProvider(providerId);
      
      if (success) {
        res.json({
          success: true,
          message: `Successfully switched to provider: ${providerId}`,
          activeProvider: providerId
        });
      } else {
        res.status(404).json({
          success: false,
          message: `Provider not found: ${providerId}`
        });
      }
    } catch (error: any) {
      console.error('AI provider switch error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  app.post('/api/admin/ai-providers/add', async (req, res) => {
    try {
      const config = req.body;
      
      if (!config.id || !config.provider || !config.apiKey) {
        return res.status(400).json({ 
          message: 'Provider ID, provider type, and API key are required' 
        });
      }

      const { aiProviderManager } = await import('./ai-providers');
      await aiProviderManager.addProvider(config);
      
      res.json({
        success: true,
        message: `Successfully added provider: ${config.id}`,
        providerId: config.id
      });
    } catch (error: any) {
      console.error('AI provider add error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  app.delete('/api/admin/ai-providers/:providerId', async (req, res) => {
    try {
      const { providerId } = req.params;
      
      const { aiProviderManager } = await import('./ai-providers');
      const success = await aiProviderManager.removeProvider(providerId);
      
      if (success) {
        res.json({
          success: true,
          message: `Successfully removed provider: ${providerId}`
        });
      } else {
        res.status(404).json({
          success: false,
          message: `Provider not found: ${providerId}`
        });
      }
    } catch (error: any) {
      console.error('AI provider remove error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  app.post('/api/admin/ai-providers/test', async (req, res) => {
    try {
      const { providerId, testMessage } = req.body;
      
      if (!providerId || !testMessage) {
        return res.status(400).json({ 
          message: 'Provider ID and test message are required' 
        });
      }

      const { aiProviderManager } = await import('./ai-providers');
      
      // Test the provider with a simple chat request
      const testRequest = {
        childId: 'test-child',
        message: testMessage
      };
      
      const startTime = Date.now();
      const response = await aiProviderManager.chat(testRequest);
      const responseTime = Date.now() - startTime;
      
      res.json({
        success: true,
        message: 'Provider test completed successfully',
        testResult: {
          provider: response.provider,
          responseTime,
          tokenUsage: response.usage,
          response: response.response.substring(0, 200) + '...' // Truncate for security
        }
      });
    } catch (error: any) {
      console.error('AI provider test error:', error);
      res.status(500).json({ 
        success: false,
        message: error.message,
        testResult: null
      });
    }
  });

  // Stripe payment route for one-time payments
  if (stripe) {
    app.post("/api/create-payment-intent", async (req, res) => {
      try {
        const { amount } = req.body;
        const paymentIntent = await stripe!.paymentIntents.create({
          amount: Math.round(amount * 100), // Convert to cents
          currency: "usd",
        });
        res.json({ clientSecret: paymentIntent.client_secret });
      } catch (error: any) {
        res.status(500).json({ message: "Error creating payment intent: " + error.message });
      }
    });
  }

  // AI Safety Monitoring API
  app.post('/api/ai/safety-monitor', async (req, res) => {
    try {
      const { childId, content, conversationId, messageId, metadata } = req.body;
      
      if (!childId || !content) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const { aiSafetyMonitor } = await import('./ai-safety-monitor.js');
      
      const assessment = await aiSafetyMonitor.analyzeContent({
        childId,
        content,
        conversationId,
        messageId,
        timestamp: new Date(),
        metadata
      });

      res.json({
        success: true,
        assessment,
        alertCreated: assessment.requiresParentAlert
      });
    } catch (error: any) {
      console.error('Safety monitoring error:', error);
      res.status(500).json({ error: 'Safety monitoring failed' });
    }
  });

  // Parent Controls API Routes
  app.get('/api/parent/controls/:childId', async (req, res) => {
    try {
      const { childId } = req.params;
      const userId = (req as any).user?.id;
      
      if (!userId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const { ParentControlsService } = await import('./parent-controls');
      const parentControlsService = new ParentControlsService(storage);
      
      const controls = await parentControlsService.getParentControls(childId, userId);
      res.json(controls || {});
    } catch (error: any) {
      console.error('Parent controls retrieval error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  app.put('/api/parent/controls/:childId', async (req, res) => {
    try {
      const { childId } = req.params;
      const userId = (req as any).user?.id;
      const updates = req.body;
      
      if (!userId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const { ParentControlsService } = await import('./parent-controls');
      const parentControlsService = new ParentControlsService(storage);
      
      const updatedControls = await parentControlsService.updateParentControls(childId, userId, updates);
      res.json(updatedControls);
    } catch (error: any) {
      console.error('Parent controls update error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  app.put('/api/parent/child/:childId/age', async (req, res) => {
    try {
      const { childId } = req.params;
      const { age } = req.body;
      const userId = (req as any).user?.id;
      
      if (!userId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      if (!age || age < 8 || age > 16) {
        return res.status(400).json({ message: 'Age must be between 8 and 16' });
      }

      const { ParentControlsService } = await import('./parent-controls');
      const parentControlsService = new ParentControlsService(storage);
      
      const success = await parentControlsService.updateChildAge(childId, userId, age);
      if (success) {
        res.json({ message: 'Age updated successfully', age });
      } else {
        res.status(500).json({ message: 'Failed to update age' });
      }
    } catch (error: any) {
      console.error('Age update error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  app.put('/api/parent/child/:childId/personality', async (req, res) => {
    try {
      const { childId } = req.params;
      const { personalitySettings } = req.body;
      const userId = (req as any).user?.id;
      
      if (!userId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const { ParentControlsService } = await import('./parent-controls');
      const parentControlsService = new ParentControlsService(storage);
      
      const success = await parentControlsService.updateChildPersonality(childId, userId, personalitySettings);
      if (success) {
        res.json({ message: 'Personality updated successfully', personalitySettings });
      } else {
        res.status(500).json({ message: 'Failed to update personality' });
      }
    } catch (error: any) {
      console.error('Personality update error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  app.get('/api/parent/safety-alerts', async (req, res) => {
    try {
      const userId = (req as any).user?.id;
      const { childId } = req.query;
      
      if (!userId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const { ParentControlsService } = await import('./parent-controls');
      const parentControlsService = new ParentControlsService(storage);
      
      const alerts = await parentControlsService.getSafetyAlerts(userId, childId as string);
      res.json(alerts);
    } catch (error: any) {
      console.error('Safety alerts retrieval error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Safety Monitoring Add-on Purchase
  app.post('/api/safety-monitoring/purchase', async (req, res) => {
    try {
      const { childId } = req.body;
      const userId = (req as any).user?.id;
      
      if (!userId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      // Check if user already has safety monitoring for this child
      const existingAddon = await db
        .select()
        .from(safetyMonitoringAddons)
        .where(
          sql`${safetyMonitoringAddons.userId} = ${userId} AND ${safetyMonitoringAddons.childId} = ${childId} AND ${safetyMonitoringAddons.isActive} = true`
        );

      if (existingAddon.length > 0) {
        return res.status(400).json({ message: 'Safety monitoring already active for this child' });
      }

      // Create new safety monitoring add-on subscription
      const [addon] = await db.insert(safetyMonitoringAddons).values({
        userId,
        childId,
        isActive: true,
        price: '9.99',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      }).returning();

      // Enable safety monitoring in parent controls
      await db
        .update(parentControls)
        .set({ safetyMonitoringEnabled: true })
        .where(sql`${parentControls.childId} = ${childId}`);

      res.json({ 
        message: 'Safety monitoring add-on purchased successfully',
        addon,
        expiresAt: addon.expiresAt
      });
    } catch (error: any) {
      console.error('Safety monitoring purchase error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Check Safety Monitoring Status
  app.get('/api/safety-monitoring/status/:childId', async (req, res) => {
    try {
      const { childId } = req.params;
      const userId = (req as any).user?.id;
      
      if (!userId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      // Check user's subscription tier
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId));

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Check if user has Family tier (includes safety monitoring)
      const [subscription] = await db
        .select()
        .from(subscriptions)
        .innerJoin(pricingPlans, eq(subscriptions.planId, pricingPlans.id))
        .where(eq(subscriptions.userId, userId));

      let hasAccess = false;
      let source = 'none';
      let expiresAt = null;

      // Check if Family tier
      if (subscription && subscription.pricing_plans.name === 'Family') {
        hasAccess = true;
        source = 'subscription';
        expiresAt = subscription.subscriptions.currentPeriodEnd;
      } else {
        // Check for active add-on
        const [addon] = await db
          .select()
          .from(safetyMonitoringAddons)
          .where(
            sql`${safetyMonitoringAddons.userId} = ${userId} AND ${safetyMonitoringAddons.childId} = ${childId} AND ${safetyMonitoringAddons.isActive} = true`
          );

        if (addon && (!addon.expiresAt || addon.expiresAt > new Date())) {
          hasAccess = true;
          source = 'addon';
          expiresAt = addon.expiresAt;
        }
      }

      res.json({
        hasAccess,
        source,
        expiresAt,
        tierName: subscription?.pricing_plans.name || 'None',
        canPurchaseAddon: !hasAccess && subscription?.pricing_plans.name !== 'Family'
      });
    } catch (error: any) {
      console.error('Safety monitoring status error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Disable Safety Monitoring
  app.post('/api/safety-monitoring/disable/:childId', async (req, res) => {
    try {
      const { childId } = req.params;
      const userId = (req as any).user?.id;
      
      if (!userId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      // Disable safety monitoring in parent controls
      await db
        .update(parentControls)
        .set({ safetyMonitoringEnabled: false })
        .where(sql`${parentControls.childId} = ${childId}`);

      // Deactivate add-on if exists
      await db
        .update(safetyMonitoringAddons)
        .set({ isActive: false })
        .where(
          sql`${safetyMonitoringAddons.userId} = ${userId} AND ${safetyMonitoringAddons.childId} = ${childId}`
        );

      res.json({ message: 'Safety monitoring disabled successfully' });
    } catch (error: any) {
      console.error('Safety monitoring disable error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Push notification registration
  app.post('/api/notifications/register-push', async (req, res) => {
    try {
      const { subscription } = req.body;
      const userId = (req as any).user?.id;
      
      if (!userId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const { registerPushSubscription } = await import('./notifications.js');
      await registerPushSubscription(userId, subscription);
      
      res.json({ message: 'Push subscription registered successfully' });
    } catch (error: any) {
      console.error('Push registration error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Get notification history
  app.get('/api/notifications/history', async (req, res) => {
    try {
      const userId = (req as any).user?.id;
      const limit = parseInt(req.query.limit as string) || 50;
      
      if (!userId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const { notificationService } = await import('./notifications.js');
      const history = await notificationService.getNotificationHistory(userId, limit);
      
      res.json(history);
    } catch (error: any) {
      console.error('Notification history error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  app.put('/api/parent/safety-alert/:alertId/resolve', async (req, res) => {
    try {
      const { alertId } = req.params;
      const { reviewNotes } = req.body;
      const userId = (req as any).user?.id;
      
      if (!userId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const { ParentControlsService } = await import('./parent-controls');
      const parentControlsService = new ParentControlsService(storage);
      
      const success = await parentControlsService.resolveSafetyAlert(alertId, reviewNotes);
      if (success) {
        res.json({ message: 'Alert resolved successfully' });
      } else {
        res.status(500).json({ message: 'Failed to resolve alert' });
      }
    } catch (error: any) {
      console.error('Alert resolution error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Stripe subscription endpoints for usage-based billing
  app.post('/api/get-or-create-subscription', async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }

    const { tier } = req.body; // 'basic', 'premium', or 'family'
    const user = req.user as any;

    // Check if user already has active subscription
    if (user.stripeSubscriptionId && user.subscriptionStatus === 'active') {
      return res.json({
        subscriptionId: user.stripeSubscriptionId,
        tier: user.subscriptionTier,
        status: 'active',
        message: 'Subscription already active'
      });
    }

    // Mock subscription for development (allows testing without payment)
    if (!process.env.STRIPE_SECRET_KEY) {
      // Simulate successful subscription creation
      await storage.upgradeToPaidTier(user.id, tier);
      
      return res.json({
        subscriptionId: `sub_mock_${tier}_${Date.now()}`,
        clientSecret: null, // No payment needed in test mode
        tier: tier,
        mockMode: true,
        testMode: true,
        message: `✅ Test Mode: Upgraded to ${tier} tier without payment - Full features unlocked`
      });
    }

    try {
      // Real Stripe integration would go here when keys are configured
      await storage.upgradeToPaidTier(user.id, tier);
      
      res.json({
        subscriptionId: `sub_mock_${tier}`,
        clientSecret: `pi_mock_${tier}_client_secret`,
        tier: tier,
        message: 'Stripe integration configured - see STRIPE_CONFIGURATION.md for setup'
      });

    } catch (error: any) {
      console.error('Subscription creation error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Check subscription status and handle free trial limits
  app.get('/api/subscription/status', async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }

    try {
      const user = req.user as any;
      const upgradeCheck = await storage.checkAndUpgradeFreeUser(user.id);
      
      res.json({
        userId: user.id,
        currentTier: user.subscriptionTier || 'free',
        subscriptionStatus: user.subscriptionStatus || 'free',
        freeTrialTokensUsed: user.freeTrialTokensUsed || 0,
        freeTrialDaysElapsed: user.freeTrialStarted ? 
          Math.floor((Date.now() - new Date(user.freeTrialStarted).getTime()) / (1000 * 60 * 60 * 24)) : 0,
        shouldUpgrade: upgradeCheck.shouldUpgrade,
        upgradeReason: upgradeCheck.reason,
        hasActiveSubscription: user.subscriptionStatus === 'active'
      });
    } catch (error: any) {
      console.error('Subscription status error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Cancel subscription
  app.post('/api/subscription/cancel', async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }

    try {
      const user = req.user as any;
      
      if (!user.stripeSubscriptionId) {
        return res.status(400).json({ error: 'No active subscription to cancel' });
      }

      // Cancel in Stripe (when configured)
      if (process.env.STRIPE_SECRET_KEY && stripe) {
        await stripe.subscriptions.cancel(user.stripeSubscriptionId);
      }

      // Update local database
      const cancelledUser = await storage.cancelUserSubscription(user.id);
      
      res.json({
        success: true,
        message: 'Subscription cancelled successfully',
        newTier: 'free',
        status: 'cancelled'
      });
    } catch (error: any) {
      console.error('Subscription cancellation error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Track AI interaction and handle usage billing
  app.post('/api/track-interaction', async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }

    const { childId, interactionType, tokensUsed } = req.body;
    const user = req.user as any;
    const userId = user.id;

    try {
      // Check if user is on free tier and needs upgrade
      if (user.subscriptionTier === 'free') {
        const upgradeCheck = await storage.checkAndUpgradeFreeUser(userId);
        
        if (upgradeCheck.shouldUpgrade) {
          return res.status(402).json({
            error: 'Free trial limit reached',
            reason: upgradeCheck.reason,
            requiresUpgrade: true,
            message: 'Please upgrade to continue using the service'
          });
        }

        // Increment free trial usage
        await storage.incrementFreeTrialUsage(userId, tokensUsed || 1);
      }

      // Get current usage for paid users
      const currentMonth = new Date().getMonth();
      const usage = await storage.getMonthlyUsage(userId, currentMonth);

      // Determine user's actual tier
      const tier = user.subscriptionTier || 'free';
      const limits = { free: 500, basic: 50, premium: 200, family: 300 }; // Family: 300k shared
      const monthlyLimit = limits[tier as keyof typeof limits] || 0;
      
      let willChargeOverage = false;
      let canProceed = true;

      if (tier === 'free') {
        // Free users: check against total trial limit
        const totalUsed = (user.freeTrialTokensUsed || 0) + (tokensUsed || 1);
        canProceed = totalUsed <= 500;
      } else if (tier === 'basic' || tier === 'premium') {
        // Paid users: allow overage with billing
        willChargeOverage = usage.interactions >= monthlyLimit;
      }
      // Family tier: unlimited

      if (!canProceed) {
        return res.status(402).json({
          error: 'Usage limit exceeded',
          requiresUpgrade: true,
          tier: tier,
          usage: usage.interactions,
          limit: monthlyLimit
        });
      }

      // Track usage in our database
      await storage.incrementUsage(userId, childId, interactionType);

      res.json({
        success: true,
        usage: tier === 'free' ? (user.freeTrialTokensUsed || 0) + 1 : usage.interactions + 1,
        limit: monthlyLimit,
        overageCharged: willChargeOverage,
        tier: tier,
        message: willChargeOverage ? `Overage charge of $0.01 will apply` : 
                tier === 'free' ? `Free trial: ${500 - ((user.freeTrialTokensUsed || 0) + 1)} tokens remaining` :
                'Within included limit'
      });

    } catch (error: any) {
      console.error('Error tracking interaction:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Personality system endpoints
  app.get('/api/personalities/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      const user = await storage.getUserById(userId);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const { PersonalitySystem } = await import('./personality-system');
      const personalities = PersonalitySystem.getAllPersonalitiesWithRestrictions(user.subscriptionTier || 'free');
      
      res.json({
        userTier: user.subscriptionTier || 'free',
        personalities: personalities
      });
    } catch (error: any) {
      console.error('Personality fetch error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Free trial expiration notification
  app.post('/api/notify-trial-expired', async (req, res) => {
    try {
      const { userId, reason } = req.body;
      const { ParentNotificationSystem } = await import('./parent-notifications');
      
      await ParentNotificationSystem.notifyFreeTrialExpired(userId, reason);
      res.json({ success: true, message: 'Parent notified of trial expiration' });
    } catch (error: any) {
      console.error('Trial expiration notification error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Monthly usage report (Family tier)
  app.get('/api/usage-report/:userId', async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }

    try {
      const { userId } = req.params;
      const user = await storage.getUserById(userId);
      
      if (!user || user.subscriptionTier !== 'family') {
        return res.status(403).json({ 
          error: 'Family tier required for detailed usage reports',
          currentTier: user?.subscriptionTier || 'free'
        });
      }

      const { UsageTracker } = await import('./usage-tracking');
      const report = await UsageTracker.generateFamilyUsageReport(userId);
      
      res.json(report);
    } catch (error: any) {
      console.error('Usage report error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // AI-initiated billing notification resend
  app.post('/api/resend-billing', async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }

    try {
      const { childId } = req.body;
      const user = req.user as any;
      
      const { ParentNotificationSystem } = await import('./parent-notifications');
      const response = await ParentNotificationSystem.resendBillingOnRequest(user.id, childId);
      
      res.json({ 
        success: true, 
        message: 'Billing information sent to parent',
        childResponse: response
      });
    } catch (error: any) {
      console.error('Billing resend error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // AI-initiated activity report generation
  app.post('/api/generate-activity-report', async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }

    try {
      const { childId } = req.body;
      const user = req.user as any;
      
      const { ParentNotificationSystem } = await import('./parent-notifications');
      const response = await ParentNotificationSystem.generateActivityReportOnRequest(user.id, childId);
      
      res.json({ 
        success: true, 
        message: 'Activity report sent to parent',
        childResponse: response
      });
    } catch (error: any) {
      console.error('Activity report error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Admin testing endpoints
  app.post('/api/admin/test-upgrade', async (req, res) => {
    // This endpoint allows testing subscription upgrades without payment
    const { userId, tier } = req.body;
    
    try {
      const user = await storage.upgradeToPaidTier(userId, tier);
      res.json({
        success: true,
        message: `✅ TEST MODE: User upgraded to ${tier} tier`,
        user: {
          id: user.id,
          subscriptionTier: user.subscriptionTier,
          subscriptionStatus: user.subscriptionStatus
        }
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin children management endpoints
  app.get('/api/admin/children', async (req, res) => {
    try {
      const { AdminChildrenManager } = await import('./admin-children');
      const ageGroups = await AdminChildrenManager.getChildrenByAgeGroups();
      
      res.json({
        success: true,
        ageGroups: ageGroups,
        totalChildren: ageGroups.reduce((sum, group) => sum + group.count, 0)
      });
    } catch (error: any) {
      console.error('Admin children fetch error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/admin/children/create-test-family', async (req, res) => {
    try {
      const { parentEmail } = req.body;
      
      if (!parentEmail) {
        return res.status(400).json({ error: 'Parent email required' });
      }

      const { AdminChildrenManager } = await import('./admin-children');
      const children = await AdminChildrenManager.createTestChildren(parentEmail);
      
      res.json({
        success: true,
        message: `Created ${children.length} test children for ${parentEmail}`,
        children: children
      });
    } catch (error: any) {
      console.error('Test family creation error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.put('/api/admin/children/:childId/name', async (req, res) => {
    try {
      const { childId } = req.params;
      const { name } = req.body;
      
      if (!name) {
        return res.status(400).json({ error: 'Name required' });
      }

      const { AdminChildrenManager } = await import('./admin-children');
      const success = await AdminChildrenManager.updateChildName(childId, name);
      
      if (success) {
        res.json({ success: true, message: `Child name updated to ${name}` });
      } else {
        res.status(404).json({ error: 'Child not found' });
      }
    } catch (error: any) {
      console.error('Child name update error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.put('/api/admin/children/:childId/subscription', async (req, res) => {
    try {
      const { childId } = req.params;
      const { tier } = req.body;
      
      if (!['free', 'basic', 'premium', 'family'].includes(tier)) {
        return res.status(400).json({ error: 'Invalid subscription tier' });
      }

      const { AdminChildrenManager } = await import('./admin-children');
      const success = await AdminChildrenManager.updateParentSubscription(childId, tier);
      
      if (success) {
        res.json({ success: true, message: `Parent subscription updated to ${tier}` });
      } else {
        res.status(404).json({ error: 'Child not found' });
      }
    } catch (error: any) {
      console.error('Subscription update error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/admin/stats', async (req, res) => {
    try {
      const { AdminChildrenManager } = await import('./admin-children');
      const stats = await AdminChildrenManager.getSystemStats();
      
      res.json({
        success: true,
        stats: stats
      });
    } catch (error: any) {
      console.error('Admin stats error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Helper functions for avatar analysis and settings
function generateAvatarAnalysis(config: any, avatarName: string): any {
  const analysis = {
    overall: '',
    personality: '',
    style: '',
    creativity: '',
    suggestions: [] as string[]
  };

  // Analyze personality
  if (config.personality) {
    const personalityMap: Record<string, string> = {
      caring: "Your avatar radiates warmth and kindness! The caring personality shows you value helping others.",
      energetic: "Your avatar has vibrant energy! The energetic personality shows you love being active.",
      wise: "Your avatar has a thoughtful presence! The wise personality shows you enjoy learning.",
      playful: "Your avatar looks fun and playful! This shows your creative and joyful spirit!"
    };
    analysis.personality = personalityMap[config.personality.type] || "Your avatar has a wonderful personality!";
  }

  // Analyze style choices
  const styleElements = [];
  if (config.hair) {
    styleElements.push(`${config.hair.color} ${config.hair.style} hair`);
  }
  if (config.clothing?.top) {
    styleElements.push(`${config.clothing.top.color} ${config.clothing.top.style}`);
  }

  if (styleElements.length > 0) {
    analysis.style = `I love your style choices! ${styleElements.join(', ')} work so well together.`;
  }

  // Overall assessment
  const positiveWords = ['amazing', 'wonderful', 'creative', 'beautiful', 'unique', 'fantastic'];
  const randomPositive = positiveWords[Math.floor(Math.random() * positiveWords.length)];
  
  analysis.overall = `${avatarName} is absolutely ${randomPositive}! You've created an avatar that's uniquely you!`;

  return analysis;
}

function buildChildSettings(child: any, category?: string): any {
  const allSettings = {
    communication: {
      name: 'Communication Preferences',
      settings: {
        style: child.communicationStyle || 'friendly',
        tone: child.communicationTone || 'encouraging'
      }
    },
    notifications: {
      name: 'Notification Settings', 
      settings: {
        dailyAffirmations: child.enableDailyAffirmations !== false,
        quietHours: child.quietHours || { start: '21:00', end: '07:00' }
      }
    }
  };

  if (category && allSettings[category as keyof typeof allSettings]) {
    return { [category]: allSettings[category as keyof typeof allSettings] };
  }

  return allSettings;
}

function getSettingUpdateGuidance(settingType: string, newValue: string): any {
  const settingMap: Record<string, any> = {
    'communication_style': {
      description: 'How Stella talks with you',
      instructions: 'You can change this in your profile settings under "Communication Preferences"'
    },
    'notification_preferences': {
      description: 'When you receive notifications', 
      instructions: 'Update this in Settings > Notifications'
    },
    'privacy_level': {
      description: 'How much information is shared',
      instructions: 'Adjust this in Settings > Privacy & Safety'
    }
  };

  const setting = settingMap[settingType];
  if (!setting) {
    return {
      error: `Unknown setting type: ${settingType}`,
      availableSettings: Object.keys(settingMap)
    };
  }

  return {
    setting: setting,
    newValue: newValue,
    instructions: setting.instructions
  };
}