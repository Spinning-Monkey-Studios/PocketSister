import { Router } from 'express';
import { FeatureDocumentationService } from '../feature-documentation';

const router = Router();

/**
 * Get complete feature documentation for Gemini context
 * GET /api/features/documentation
 */
router.get('/documentation', (req, res) => {
  try {
    const documentation = FeatureDocumentationService.generateGeminiDocumentation();
    
    res.json({
      success: true,
      documentation,
      generatedAt: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Failed to generate feature documentation:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get all app features with subscription tier information
 * GET /api/features/list
 */
router.get('/list', (req, res) => {
  try {
    const features = FeatureDocumentationService.APP_FEATURES;
    const tiers = FeatureDocumentationService.SUBSCRIPTION_TIERS;
    
    res.json({
      success: true,
      features,
      subscriptionTiers: tiers,
      totalFeatures: features.length
    });
    
  } catch (error) {
    console.error('❌ Failed to get feature list:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get features available to user based on subscription tier
 * GET /api/features/available?tier=premium
 */
router.get('/available', (req, res) => {
  try {
    const tier = req.query.tier as 'basic' | 'premium' | 'family';
    
    if (!tier || !['basic', 'premium', 'family'].includes(tier)) {
      return res.status(400).json({
        success: false,
        error: 'Valid subscription tier required (basic, premium, family)'
      });
    }
    
    const { available, locked } = FeatureDocumentationService.getAvailableFeatures(tier);
    
    res.json({
      success: true,
      userTier: tier,
      availableFeatures: available,
      lockedFeatures: locked,
      counts: {
        available: available.length,
        locked: locked.length,
        total: available.length + locked.length
      }
    });
    
  } catch (error) {
    console.error('❌ Failed to get available features:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Search features by query
 * GET /api/features/search?q=avatar
 */
router.get('/search', (req, res) => {
  try {
    const query = req.query.q as string;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Search query required'
      });
    }
    
    const results = FeatureDocumentationService.searchFeatures(query);
    
    res.json({
      success: true,
      query,
      results,
      count: results.length
    });
    
  } catch (error) {
    console.error('❌ Failed to search features:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get features by category
 * GET /api/features/category/Creativity
 */
router.get('/category/:category', (req, res) => {
  try {
    const category = req.params.category;
    const features = FeatureDocumentationService.getFeaturesByCategory(category);
    
    res.json({
      success: true,
      category,
      features,
      count: features.length
    });
    
  } catch (error) {
    console.error('❌ Failed to get features by category:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get subscription tier details
 * GET /api/features/tiers
 */
router.get('/tiers', (req, res) => {
  try {
    const tiers = FeatureDocumentationService.SUBSCRIPTION_TIERS;
    
    // Add feature counts for each tier
    const tiersWithCounts = Object.entries(tiers).map(([id, tier]) => ({
      ...tier,
      featureCount: FeatureDocumentationService.getFeaturesForTier(id as any).length
    }));
    
    res.json({
      success: true,
      subscriptionTiers: tiersWithCounts
    });
    
  } catch (error) {
    console.error('❌ Failed to get subscription tiers:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get specific feature details
 * GET /api/features/:featureId
 */
router.get('/:featureId', (req, res) => {
  try {
    const featureId = req.params.featureId;
    const feature = FeatureDocumentationService.getFeature(featureId);
    
    if (!feature) {
      return res.status(404).json({
        success: false,
        error: 'Feature not found'
      });
    }
    
    // Get related features if any
    const relatedFeatures = feature.relatedFeatures?.map(id => 
      FeatureDocumentationService.getFeature(id)
    ).filter(Boolean) || [];
    
    res.json({
      success: true,
      feature,
      relatedFeatures
    });
    
  } catch (error) {
    console.error('❌ Failed to get feature details:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;