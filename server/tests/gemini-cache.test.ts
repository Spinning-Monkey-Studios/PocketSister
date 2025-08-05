import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GeminiContextCache } from '../gemini-context-cache';

// Mock fetch for testing
global.fetch = vi.fn();

describe('GeminiContextCache', () => {
  let cache: GeminiContextCache;
  const mockApiKey = 'test-api-key';

  beforeEach(() => {
    cache = new GeminiContextCache();
    process.env.GEMINI_API_KEY = mockApiKey;
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('uploadContentToCache', () => {
    it('should upload content to Google cache and return cacheId', async () => {
      const mockCacheId = 'cachedContents/test-cache-123';
      const mockResponse = {
        name: mockCacheId,
        displayName: 'context-cache-child-123-1234567890'
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const childId = 'child-123';
      const content = 'Test context content for caching';
      const ttlMinutes = 30;

      const result = await cache.uploadContentToCache(childId, content, ttlMinutes);

      expect(result).toBe(mockCacheId);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://generativelanguage.googleapis.com/v1beta/cachedContents',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'x-goog-api-key': mockApiKey
          }),
          body: expect.stringContaining('"ttl":"1800s"') // 30 minutes = 1800 seconds
        })
      );
    });

    it('should handle upload errors gracefully', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: () => Promise.resolve('Bad Request')
      });

      const childId = 'child-123';
      const content = 'Test content';

      await expect(cache.uploadContentToCache(childId, content))
        .rejects.toThrow('Failed to create cached content: 400 - Bad Request');
    });
  });

  describe('generateWithCache', () => {
    it('should generate content using cached context reference', async () => {
      const mockResponse = {
        candidates: [{
          content: {
            parts: [{
              text: 'Generated response using cached context'
            }]
          }
        }]
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const cacheId = 'cachedContents/test-cache-123';
      const prompt = 'Test prompt';
      const systemInstruction = 'Test system instruction';

      const result = await cache.generateWithCache(cacheId, prompt, systemInstruction);

      expect(result).toBe('Generated response using cached context');
      expect(global.fetch).toHaveBeenCalledWith(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-001:generateContent',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'x-goog-api-key': mockApiKey
          }),
          body: expect.stringContaining(`"cachedContent":"${cacheId}"`)
        })
      );
    });

    it('should handle generation errors', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: () => Promise.resolve('Internal Server Error')
      });

      const cacheId = 'cachedContents/test-cache-123';
      const prompt = 'Test prompt';

      await expect(cache.generateWithCache(cacheId, prompt))
        .rejects.toThrow('Failed to generate with cache: 500 - Internal Server Error');
    });
  });

  describe('getCacheIdForContent', () => {
    it('should reuse existing cache for same content', async () => {
      const childId = 'child-123';
      const content = 'Same content';
      const existingCacheId = 'cachedContents/existing-cache-456';

      // First call - upload new content
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ name: existingCacheId })
      });

      const firstResult = await cache.getCacheIdForContent(childId, content, 60);
      expect(firstResult).toBe(existingCacheId);

      // Second call with same content - should reuse cache
      const secondResult = await cache.getCacheIdForContent(childId, content, 60);
      expect(secondResult).toBe(existingCacheId);

      // Should only have made one API call
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should create new cache for different content', async () => {
      const childId = 'child-123';
      const content1 = 'First content';
      const content2 = 'Second content';
      const cacheId1 = 'cachedContents/cache-1';
      const cacheId2 = 'cachedContents/cache-2';

      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ name: cacheId1 })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ name: cacheId2 })
        });

      const result1 = await cache.getCacheIdForContent(childId, content1);
      const result2 = await cache.getCacheIdForContent(childId, content2);

      expect(result1).toBe(cacheId1);
      expect(result2).toBe(cacheId2);
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('listCachedContents', () => {
    it('should list all cached contents from Google servers', async () => {
      const mockCachedContents = [
        { name: 'cachedContents/cache-1', displayName: 'context-1' },
        { name: 'cachedContents/cache-2', displayName: 'context-2' }
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ cachedContents: mockCachedContents })
      });

      const result = await cache.listCachedContents();

      expect(result).toEqual(mockCachedContents);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://generativelanguage.googleapis.com/v1beta/cachedContents',
        expect.objectContaining({
          headers: expect.objectContaining({
            'x-goog-api-key': mockApiKey
          })
        })
      );
    });
  });

  describe('deleteCachedContent', () => {
    it('should delete cached content from Google servers', async () => {
      const cacheId = 'cachedContents/test-cache-123';

      (global.fetch as any).mockResolvedValueOnce({
        ok: true
      });

      await cache.deleteCachedContent(cacheId);

      expect(global.fetch).toHaveBeenCalledWith(
        `https://generativelanguage.googleapis.com/v1beta/${cacheId}`,
        expect.objectContaining({
          method: 'DELETE',
          headers: expect.objectContaining({
            'x-goog-api-key': mockApiKey
          })
        })
      );
    });
  });

  describe('getCacheStats', () => {
    it('should return accurate cache statistics', async () => {
      const childId1 = 'child-123';
      const childId2 = 'child-456';
      const content1 = 'Content for child 1';
      const content2 = 'Content for child 2';

      // Mock successful cache uploads
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ name: 'cachedContents/cache-1' })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ name: 'cachedContents/cache-2' })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ name: 'cachedContents/cache-3' })
        });

      // Create some caches
      await cache.getCacheIdForContent(childId1, content1);
      await cache.getCacheIdForContent(childId2, content2);
      await cache.getCacheIdForContent(childId1, 'Another content for child 1');

      const stats = cache.getCacheStats();

      expect(stats.totalActiveCaches).toBe(3);
      expect(stats.cachesByChild[childId1]).toBe(2);
      expect(stats.cachesByChild[childId2]).toBe(1);
      expect(stats.oldestCache).toBeInstanceOf(Date);
      expect(stats.newestCache).toBeInstanceOf(Date);
    });
  });

  describe('Token Efficiency Integration Test', () => {
    it('should demonstrate proper Google Gemini caching workflow', async () => {
      const childId = 'integration-test-child';
      const largeContext = 'A'.repeat(5000); // Large context to cache
      const prompt1 = 'First prompt using cached context';
      const prompt2 = 'Second prompt reusing same cache';

      // Mock cache upload
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ name: 'cachedContents/integration-cache' })
      });

      // Mock first generation
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          candidates: [{ content: { parts: [{ text: 'First response' }] } }]
        })
      });

      // Mock second generation
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          candidates: [{ content: { parts: [{ text: 'Second response' }] } }]
        })
      });

      // 1. Upload large context once
      const cacheId = await cache.uploadContentToCache(childId, largeContext, 30);
      expect(cacheId).toBe('cachedContents/integration-cache');

      // 2. Generate with cache reference (not re-sending large context)
      const response1 = await cache.generateWithCache(cacheId, prompt1);
      expect(response1).toBe('First response');

      // 3. Generate again with same cache (token efficient)
      const response2 = await cache.generateWithCache(cacheId, prompt2);
      expect(response2).toBe('Second response');

      // Verify API calls
      expect(global.fetch).toHaveBeenCalledTimes(3);
      
      // First call: cache upload with large content
      const uploadCall = (global.fetch as any).mock.calls[0];
      expect(uploadCall[0]).toBe('https://generativelanguage.googleapis.com/v1beta/cachedContents');
      expect(uploadCall[1].body).toContain(largeContext);

      // Second and third calls: generation using cacheId reference (no large content)
      const genCall1 = (global.fetch as any).mock.calls[1];
      const genCall2 = (global.fetch as any).mock.calls[2];
      
      expect(genCall1[1].body).toContain('cachedContents/integration-cache');
      expect(genCall1[1].body).not.toContain(largeContext);
      
      expect(genCall2[1].body).toContain('cachedContents/integration-cache');
      expect(genCall2[1].body).not.toContain(largeContext);
    });
  });
});