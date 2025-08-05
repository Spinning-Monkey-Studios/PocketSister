import { Router } from 'express';
import { contextAnalyzer } from '../context-analyzer';
import { isAuthenticated } from '../replitAuth';

const router = Router();

/**
 * Context management endpoints for monitoring and optimizing context usage
 * These endpoints communicate with Gemini as the APPLICATION, not as a child
 */

/**
 * Check context length for a specific child
 * POST /api/context/check-length
 */
router.post('/check-length', isAuthenticated, async (req, res) => {
  try {
    const { childId, contextData } = req.body;
    
    if (!childId || !contextData) {
      return res.status(400).json({
        error: 'childId and contextData are required'
      });
    }

    const lengthCheck = await contextAnalyzer.checkContextLength(contextData);
    
    res.json({
      success: true,
      childId,
      contextStatus: lengthCheck,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Context length check failed:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Analyze conversation and extract salient facts
 * POST /api/context/analyze-conversation
 */
router.post('/analyze-conversation', isAuthenticated, async (req, res) => {
  try {
    const { childId, userMessage, aiResponse, contextData } = req.body;
    
    if (!childId || !userMessage || !aiResponse) {
      return res.status(400).json({
        error: 'childId, userMessage, and aiResponse are required'
      });
    }

    const analysisResult = await contextAnalyzer.analyzeConversation(
      childId,
      userMessage,
      aiResponse,
      contextData || {}
    );
    
    res.json({
      success: true,
      childId,
      analysis: analysisResult,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Conversation analysis failed:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Optimize context for a child
 * POST /api/context/optimize
 */
router.post('/optimize', isAuthenticated, async (req, res) => {
  try {
    const { childId } = req.body;
    
    if (!childId) {
      return res.status(400).json({
        error: 'childId is required'
      });
    }

    const optimizationResult = await contextAnalyzer.optimizeContextForChild(childId);
    
    res.json({
      success: true,
      childId,
      optimization: optimizationResult,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Context optimization failed:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get context status for monitoring dashboard
 * GET /api/context/status/:childId
 */
router.get('/status/:childId', isAuthenticated, async (req, res) => {
  try {
    const { childId } = req.params;
    
    // Get current context data (simplified for now)
    const contextData = {
      childId,
      placeholder: 'Context data would be retrieved from context manager'
    };

    const lengthCheck = await contextAnalyzer.checkContextLength(contextData);
    
    res.json({
      success: true,
      childId,
      status: {
        contextLength: lengthCheck,
        lastChecked: new Date().toISOString(),
        needsOptimization: lengthCheck.shouldOptimize || false,
        needsNewContext: lengthCheck.shouldSpawn || false
      }
    });
    
  } catch (error) {
    console.error('Context status check failed:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;