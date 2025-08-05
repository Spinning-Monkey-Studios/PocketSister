import { Router } from 'express';
import { backgroundMusicManager, BackgroundMusicManager } from '../background-music-manager';
import path from 'path';
import fs from 'fs';

const router = Router();

/**
 * Get background music library information
 * GET /api/background-music/library
 */
router.get('/library', async (req, res) => {
  try {
    console.log('🎵 Client requesting background music library');
    
    const libraryData = await backgroundMusicManager.scanMusicLibrary();
    await backgroundMusicManager.saveMusicMetadata(libraryData);
    
    res.json({
      success: true,
      library: libraryData,
      categories: BackgroundMusicManager.MUSIC_CATEGORIES
    });
    
  } catch (error) {
    console.error('❌ Failed to get music library:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get music statistics
 * GET /api/background-music/stats
 */
router.get('/stats', async (req, res) => {
  try {
    console.log('📊 Client requesting music statistics');
    
    const stats = await backgroundMusicManager.getMusicStats();
    
    res.json({
      success: true,
      stats
    });
    
  } catch (error) {
    console.error('❌ Failed to get music stats:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get music recommendations based on avatar creation context
 * GET /api/background-music/recommendations?mood=creative
 */
router.get('/recommendations', async (req, res) => {
  try {
    const mood = req.query.mood as string;
    console.log(`🎯 Client requesting music recommendations for mood: ${mood || 'general'}`);
    
    const recommendations = backgroundMusicManager.getMusicRecommendations(mood);
    const libraryData = await backgroundMusicManager.scanMusicLibrary();
    
    // Populate recommendations with actual tracks
    const populatedRecommendations = recommendations.map(rec => ({
      ...rec,
      tracks: libraryData.categorizedFiles[rec.category] || []
    }));
    
    res.json({
      success: true,
      recommendations: populatedRecommendations,
      availableCategories: Object.keys(BackgroundMusicManager.MUSIC_CATEGORIES)
    });
    
  } catch (error) {
    console.error('❌ Failed to get music recommendations:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Serve music files
 * GET /api/background-music/:category/:filename
 */
router.get('/:category/:filename', (req, res) => {
  try {
    const { category, filename } = req.params;
    
    // Validate category
    if (!Object.keys(BackgroundMusicManager.MUSIC_CATEGORIES).includes(category)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid music category'
      });
    }
    
    // Validate filename
    if (!filename.toLowerCase().endsWith('.mp3')) {
      return res.status(400).json({
        success: false,
        error: 'Only MP3 files are supported'
      });
    }
    
    const musicDir = path.join(process.cwd(), 'client/src/assets/background-music');
    const filePath = path.join(musicDir, category, filename);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: 'Music file not found'
      });
    }
    
    // Set appropriate headers for MP3 streaming
    res.set({
      'Content-Type': 'audio/mpeg',
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'public, max-age=31536000' // Cache for 1 year
    });
    
    // Stream the MP3 file
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
    
    console.log(`🎵 Streaming music: ${category}/${filename}`);
    
  } catch (error) {
    console.error('❌ Failed to serve music file:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Admin endpoint to rescan music library
 * POST /api/background-music/admin/rescan
 */
router.post('/admin/rescan', async (req, res) => {
  try {
    const adminSecret = req.headers['x-admin-secret'] || req.query.adminSecret;
    
    if (!adminSecret || adminSecret !== process.env.ADMIN_SECRET) {
      return res.status(403).json({
        error: 'Admin access required'
      });
    }
    
    console.log('🔄 Admin requested music library rescan');
    
    const libraryData = await backgroundMusicManager.scanMusicLibrary();
    await backgroundMusicManager.saveMusicMetadata(libraryData);
    const stats = await backgroundMusicManager.getMusicStats();
    
    res.json({
      success: true,
      message: 'Music library rescanned successfully',
      library: libraryData,
      stats
    });
    
  } catch (error) {
    console.error('❌ Failed to rescan music library:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Admin endpoint to categorize uncategorized music
 * POST /api/background-music/admin/categorize
 * Body: { filename: string, category: string }
 */
router.post('/admin/categorize', async (req, res) => {
  try {
    const adminSecret = req.headers['x-admin-secret'] || req.query.adminSecret;
    
    if (!adminSecret || adminSecret !== process.env.ADMIN_SECRET) {
      return res.status(403).json({
        error: 'Admin access required'
      });
    }
    
    const { filename, category } = req.body;
    
    if (!filename || !category) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: filename and category'
      });
    }
    
    console.log(`📁 Admin categorizing ${filename} as ${category}`);
    
    await backgroundMusicManager.categorizeMusic(filename, category);
    
    res.json({
      success: true,
      message: `Successfully moved ${filename} to ${category} category`
    });
    
  } catch (error) {
    console.error('❌ Failed to categorize music:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;