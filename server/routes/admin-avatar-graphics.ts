import { Router } from 'express';
import { avatarGraphicsGenerator, AvatarGraphicsGenerator } from '../avatar-graphics-generator';

const router = Router();

/**
 * Admin middleware - check for admin secret
 */
const requireAdmin = (req: any, res: any, next: any) => {
  const adminSecret = req.headers['x-admin-secret'] || req.query.adminSecret;
  
  if (!adminSecret || adminSecret !== process.env.ADMIN_SECRET) {
    return res.status(403).json({
      error: 'Admin access required',
      message: 'Provide valid admin secret in x-admin-secret header or adminSecret query parameter'
    });
  }
  
  next();
};

/**
 * Get avatar graphics statistics
 * GET /api/admin/avatar-graphics/stats
 */
router.get('/stats', requireAdmin, async (req, res) => {
  try {
    console.log('📊 Admin requesting avatar graphics statistics');
    
    const stats = await avatarGraphicsGenerator.getGraphicsStats();
    
    res.json({
      success: true,
      stats,
      availableFeatures: {
        totalCategories: Object.keys(AvatarGraphicsGenerator.AVATAR_FEATURES).length,
        features: AvatarGraphicsGenerator.AVATAR_FEATURES
      }
    });
    
  } catch (error) {
    console.error('❌ Failed to get avatar graphics stats:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get list of missing graphics that need to be generated
 * GET /api/admin/avatar-graphics/missing
 */
router.get('/missing', requireAdmin, async (req, res) => {
  try {
    console.log('📋 Admin requesting missing avatar graphics list');
    
    const missing = await avatarGraphicsGenerator.getMissingGraphics();
    
    res.json({
      success: true,
      missingCount: missing.length,
      missing: missing.map(item => ({
        category: item.category,
        feature: item.feature,
        expectedPath: item.filePath
      }))
    });
    
  } catch (error) {
    console.error('❌ Failed to get missing graphics:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Generate a specific avatar component
 * POST /api/admin/avatar-graphics/generate
 * Body: { category: string, feature: string }
 */
router.post('/generate', requireAdmin, async (req, res) => {
  try {
    const { category, feature } = req.body;
    
    if (!category || !feature) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: category and feature'
      });
    }
    
    console.log(`🎨 Admin requesting generation of ${category}/${feature}`);
    
    const svgContent = await avatarGraphicsGenerator.generateAvatarComponent(category, feature);
    const filePath = await avatarGraphicsGenerator.saveAvatarGraphic(category, feature, svgContent);
    
    res.json({
      success: true,
      message: `Generated ${category}/${feature}`,
      category,
      feature,
      filePath,
      svgLength: svgContent.length
    });
    
  } catch (error) {
    console.error('❌ Failed to generate avatar component:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Generate all missing avatar graphics
 * POST /api/admin/avatar-graphics/generate-all
 */
router.post('/generate-all', requireAdmin, async (req, res) => {
  try {
    console.log('🚀 Admin requesting generation of ALL missing avatar graphics');
    
    // Start the generation process (this will take a while)
    const startTime = Date.now();
    const results = await avatarGraphicsGenerator.generateAllMissingGraphics();
    const duration = Date.now() - startTime;
    
    res.json({
      success: true,
      message: 'Avatar graphics generation completed',
      duration: `${Math.round(duration / 1000)}s`,
      summary: {
        generated: results.generated,
        failed: results.failed,
        total: results.results.length
      },
      results: results.results,
      stats: await avatarGraphicsGenerator.getGraphicsStats()
    });
    
  } catch (error) {
    console.error('❌ Failed to generate all avatar graphics:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Regenerate a specific avatar component (overwrite existing)
 * POST /api/admin/avatar-graphics/regenerate
 * Body: { category: string, feature: string }
 */
router.post('/regenerate', requireAdmin, async (req, res) => {
  try {
    const { category, feature } = req.body;
    
    if (!category || !feature) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: category and feature'
      });
    }
    
    console.log(`🔄 Admin requesting regeneration of ${category}/${feature}`);
    
    const svgContent = await avatarGraphicsGenerator.generateAvatarComponent(category, feature);
    const filePath = await avatarGraphicsGenerator.saveAvatarGraphic(category, feature, svgContent);
    
    res.json({
      success: true,
      message: `Regenerated ${category}/${feature}`,
      category,
      feature,
      filePath,
      svgLength: svgContent.length
    });
    
  } catch (error) {
    console.error('❌ Failed to regenerate avatar component:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;