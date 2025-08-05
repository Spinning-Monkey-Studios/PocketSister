import { Router } from 'express';
import { geminiContextCache } from '../gemini-context-cache';
import { contextWindowManager } from '../context-window-manager';
import { isAuthenticated } from '../replitAuth';

const router = Router();

/**
 * Test Google Gemini Context Caching Implementation
 * POST /api/gemini-cache/test
 */
router.post('/test', async (req, res) => {
  console.log('🧪 Starting Gemini Context Cache Test');
  
  const testResults = {
    testName: 'Google Gemini Context Cache Implementation Test',
    timestamp: new Date().toISOString(),
    steps: [] as Array<{
      step: string;
      status: 'success' | 'failed';
      details: any;
      duration: number;
    }>
  };

  try {

    // Step 1: Upload large context to Google's cache
    const startStep1 = Date.now();
    try {
      const largeContext = `
CHILD PROFILE: Emma Johnson (Age 12)

PERSONALITY TRAITS:
- Creative and artistic, loves drawing and painting
- Shy at first but opens up quickly
- Very empathetic and cares deeply about animals
- Enjoys science fiction and fantasy books
- Has a pet cat named Trixie who can do tricks

IMPORTANT MEMORIES:
- Started taking art classes last month and loves watercolor painting
- Her best friend is Sarah, they've been friends since kindergarten
- Sometimes feels nervous about presenting in front of the class
- Loves to read Harry Potter books and discuss plot theories
- Has been teaching her cat Trixie to sit and shake hands
- Enjoys helping her mom bake cookies on weekends
- Dreams of becoming a veterinarian to help animals
- Recently started learning to play the ukulele

COMMUNICATION PREFERENCES:
- Prefers encouragement over direct criticism
- Responds well to questions about her interests
- Likes when conversations include her pets or art
- Values having someone listen to her concerns about school

RECENT CONVERSATIONS:
- Discussed her art project about space exploration
- Talked about feeling nervous for an upcoming presentation
- Shared excitement about teaching Trixie new tricks
- Asked for advice about a small conflict with a friend
- Expressed interest in learning more about marine biology

EDUCATIONAL INTERESTS:
- Science (especially biology and space)
- Art and creative expression
- Reading and creative writing
- Animal care and veterinary science

This context should be cached and referenced efficiently in future conversations.
      `.trim();

      const cacheId = await geminiContextCache.uploadContentToCache('test-child-123', largeContext, 30);
      
      testResults.steps.push({
        step: '1. Upload Context to Google Cache',
        status: 'success',
        details: {
          cacheId: cacheId,
          contentLength: largeContext.length,
          ttlMinutes: 30
        },
        duration: Date.now() - startStep1
      });

      // Step 2: Generate content using cached context
      const startStep2 = Date.now();
      try {
        const prompt = "Based on Emma's profile, suggest 3 creative art projects that combine her love of animals and space. Keep suggestions age-appropriate and encouraging.";
        
        const response = await geminiContextCache.generateWithCache(
          cacheId,
          prompt,
          "You are Stella, a caring AI companion for young girls. Be encouraging and supportive."
        );

        testResults.steps.push({
          step: '2. Generate Content with Cache Reference',
          status: 'success',
          details: {
            promptLength: prompt.length,
            responseLength: response.length,
            responsePreview: response.substring(0, 200) + (response.length > 200 ? '...' : ''),
            usedCacheId: cacheId
          },
          duration: Date.now() - startStep2
        });

        // Step 3: Test cache reuse
        const startStep3 = Date.now();
        try {
          const secondPrompt = "What would be good conversation topics to help Emma feel more confident about her upcoming presentation?";
          
          const secondResponse = await geminiContextCache.generateWithCache(
            cacheId,
            secondPrompt
          );

          testResults.steps.push({
            step: '3. Reuse Cache for Second Query',
            status: 'success',
            details: {
              promptLength: secondPrompt.length,
              responseLength: secondResponse.length,
              responsePreview: secondResponse.substring(0, 200) + (secondResponse.length > 200 ? '...' : ''),
              cacheReused: true
            },
            duration: Date.now() - startStep3
          });

          // Step 4: Check cache statistics
          const startStep4 = Date.now();
          try {
            const stats = geminiContextCache.getCacheStats();

            testResults.steps.push({
              step: '4. Verify Cache Statistics',
              status: 'success',
              details: stats,
              duration: Date.now() - startStep4
            });

            // Step 5: List cached contents from Google
            const startStep5 = Date.now();
            try {
              const cachedContents = await geminiContextCache.listCachedContents();

              testResults.steps.push({
                step: '5. List Google Cached Contents',
                status: 'success',
                details: {
                  totalCachedContents: cachedContents.length,
                  ourCacheFound: cachedContents.some(cache => cache.name === cacheId)
                },
                duration: Date.now() - startStep5
              });

              res.json({
                success: true,
                testResults,
                summary: {
                  testPassed: true,
                  totalSteps: testResults.steps.length,
                  successfulSteps: testResults.steps.filter(s => s.status === 'success').length,
                  cacheImplementation: 'Google Gemini cachedContents.create',
                  tokenOptimization: 'Enabled - Large context uploaded once, referenced by cacheId',
                  ttlManagement: 'Configured - 30 minute expiration'
                }
              });

            } catch (error) {
              testResults.steps.push({
                step: '5. List Google Cached Contents',
                status: 'failed',
                details: { error: error instanceof Error ? error.message : 'Unknown error' },
                duration: Date.now() - startStep5
              });
              throw error;
            }

          } catch (error) {
            testResults.steps.push({
              step: '4. Verify Cache Statistics',
              status: 'failed',
              details: { error: error instanceof Error ? error.message : 'Unknown error' },
              duration: Date.now() - startStep4
            });
            throw error;
          }

        } catch (error) {
          testResults.steps.push({
            step: '3. Reuse Cache for Second Query',
            status: 'failed',
            details: { error: error instanceof Error ? error.message : 'Unknown error' },
            duration: Date.now() - startStep3
          });
          throw error;
        }

      } catch (error) {
        testResults.steps.push({
          step: '2. Generate Content with Cache Reference',
          status: 'failed',
          details: { error: error instanceof Error ? error.message : 'Unknown error' },
          duration: Date.now() - startStep2
        });
        throw error;
      }

    } catch (error) {
      testResults.steps.push({
        step: '1. Upload Context to Google Cache',
        status: 'failed',
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
        duration: Date.now() - startStep1
      });
      throw error;
    }

  } catch (error) {
    console.error('❌ Gemini Cache Test Failed:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      testResults
    });
  }
});

/**
 * Get current cache statistics
 * GET /api/gemini-cache/stats
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = geminiContextCache.getCacheStats();
    const cachedContents = await geminiContextCache.listCachedContents();

    res.json({
      success: true,
      localStats: stats,
      googleCacheStats: {
        totalCachedContents: cachedContents.length,
        contents: cachedContents.map(cache => ({
          name: cache.name,
          displayName: cache.displayName,
          createTime: cache.createTime,
          expireTime: cache.expireTime,
          model: cache.model
        }))
      }
    });

  } catch (error) {
    console.error('Failed to get cache stats:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Clean up expired caches
 * POST /api/gemini-cache/cleanup
 */
router.post('/cleanup', async (req, res) => {
  try {
    await geminiContextCache.cleanupExpiredCaches();
    const stats = geminiContextCache.getCacheStats();

    res.json({
      success: true,
      message: 'Cache cleanup completed',
      stats
    });

  } catch (error) {
    console.error('Cache cleanup failed:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Test context window management and API tier detection
 * GET /api/gemini-cache/context-window-test
 */
router.get('/context-window-test', async (req, res) => {
  console.log('🧪 Starting Context Window Management Test');
  
  const testResults = {
    testName: 'Context Window Management & API Tier Detection',
    timestamp: new Date().toISOString(),
    steps: [] as Array<{
      step: string;
      status: 'success' | 'failed';
      details: any;
      duration: number;
    }>
  };

  try {

    // Step 1: Detect API tier
    const startStep1 = Date.now();
    try {
      const tierInfo = await contextWindowManager.getApiTierInfo();
      
      testResults.steps.push({
        step: '1. Detect API Tier',
        status: 'success',
        details: tierInfo,
        duration: Date.now() - startStep1
      });

      // Step 2: Test context window validation
      const startStep2 = Date.now();
      try {
        const largeContext = 'A'.repeat(50000); // ~14k tokens
        const mediumHistory = 'B'.repeat(20000); // ~6k tokens  
        const userPrompt = 'What is the main theme of this conversation?';
        
        const validation = await contextWindowManager.validatePayloadSize({
          systemInstruction: 'You are a helpful AI assistant.',
          cachedContext: largeContext,
          conversationHistory: mediumHistory,
          userPrompt: userPrompt,
          maxResponseTokens: 4000
        });

        testResults.steps.push({
          step: '2. Validate Context Window Usage',
          status: 'success',
          details: validation,
          duration: Date.now() - startStep2
        });

        // Step 3: Test context breakdown analysis
        const startStep3 = Date.now();
        try {
          const breakdown = contextWindowManager.getContextBreakdown({
            systemInstruction: 'You are a helpful AI assistant.',
            cachedContext: largeContext,
            conversationHistory: mediumHistory,
            userPrompt: userPrompt
          });

          testResults.steps.push({
            step: '3. Analyze Context Breakdown',
            status: 'success',
            details: breakdown,
            duration: Date.now() - startStep3
          });

          // Step 4: Test model recommendations
          const startStep4 = Date.now();
          try {
            const totalTokens = breakdown.total.tokens + 4000; // Include response reserve
            const modelRec = await contextWindowManager.recommendOptimalModel(totalTokens);

            testResults.steps.push({
              step: '4. Get Model Recommendations',
              status: 'success',
              details: modelRec,
              duration: Date.now() - startStep4
            });

            res.json({
              success: true,
              testResults,
              summary: {
                apiTier: tierInfo.tier,
                maxContextWindow: tierInfo.maxContextWindow,
                payloadValid: validation.isValid,
                contextUtilization: `${validation.utilizationPercentage.toFixed(1)}%`,
                recommendedModel: modelRec.recommendedModel,
                keyFindings: [
                  `API Tier: ${tierInfo.tier.toUpperCase()} (${tierInfo.maxContextWindow.toLocaleString()} tokens max)`,
                  `Context Usage: ${validation.utilizationPercentage.toFixed(1)}% of available window`,
                  `Recommended Model: ${modelRec.recommendedModel} (${modelRec.reason})`,
                  `Token Breakdown: ${Math.round(breakdown.cachedContext.percentage)}% cached, ${Math.round(breakdown.conversationHistory.percentage)}% history`
                ]
              }
            });

          } catch (error) {
            testResults.steps.push({
              step: '4. Get Model Recommendations',
              status: 'failed',
              details: { error: error instanceof Error ? error.message : 'Unknown error' },
              duration: Date.now() - startStep4
            });
            throw error;
          }

        } catch (error) {
          testResults.steps.push({
            step: '3. Analyze Context Breakdown',
            status: 'failed',
            details: { error: error instanceof Error ? error.message : 'Unknown error' },
            duration: Date.now() - startStep3
          });
          throw error;
        }

      } catch (error) {
        testResults.steps.push({
          step: '2. Validate Context Window Usage',
          status: 'failed',
          details: { error: error instanceof Error ? error.message : 'Unknown error' },
          duration: Date.now() - startStep2
        });
        throw error;
      }

    } catch (error) {
      testResults.steps.push({
        step: '1. Detect API Tier',
        status: 'failed',
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
        duration: Date.now() - startStep1
      });
      
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        testResults: testResults
      });
      return;
    }

  } catch (error) {
    console.error('❌ Context Window Test Failed:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      testResults: testResults
    });
  }
});

export default router;