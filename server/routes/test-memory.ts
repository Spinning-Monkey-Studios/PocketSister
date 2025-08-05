import { Router } from 'express';
import { runMemoryRetrievalTest } from '../test-memory-retrieval';

const router = Router();

/**
 * Test endpoint to verify Gemini's dynamic memory retrieval system
 * GET /api/test/memory-retrieval
 */
router.get('/memory-retrieval', async (req, res) => {
  try {
    console.log('🧪 Starting memory retrieval test via API...');
    
    const results = await runMemoryRetrievalTest();
    
    res.json({
      success: true,
      message: 'Memory retrieval test completed',
      results,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Memory retrieval test failed:', error);
    
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Simple test endpoint to verify function call system
 * GET /api/test/function-calls
 */
router.get('/function-calls', async (req, res) => {
  try {
    const { geminiChat } = await import('../gemini-integration');
    
    // Test the function call system directly
    const testResult = await geminiChat.testIntegration('test-function-calls');
    
    res.json({
      success: true,
      message: 'Function call test completed',
      result: testResult,
      systemWorking: testResult.success,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Function call test failed:', error);
    
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;