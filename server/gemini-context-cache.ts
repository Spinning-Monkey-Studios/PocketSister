import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

/**
 * Google Gemini Context Cache Manager
 * Implements proper cachedContents.create/get workflow for token optimization
 */
export class GeminiContextCache {
  private cacheMap = new Map<string, {
    cacheId: string;
    childId: string;
    contentHash: string;
    createdAt: Date;
    expiresAt: Date;
    ttlMinutes: number;
  }>();

  /**
   * Upload content to Google's cache via cachedContents.create
   * Returns cacheId that can be referenced in subsequent calls
   */
  async uploadContentToCache(
    childId: string,
    contentToCache: string,
    ttlMinutes: number = 60
  ): Promise<string> {
    try {
      console.log(`🔄 Uploading context to Google Gemini cache for child ${childId}`);
      
      // Create cache entry via Google's cachedContents.create endpoint
      const cacheResponse = await fetch('https://generativelanguage.googleapis.com/v1beta/cachedContents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAccessToken()}`,
          'x-goog-api-key': process.env.GEMINI_API_KEY!
        },
        body: JSON.stringify({
          model: 'models/gemini-1.5-flash-001',
          contents: [{
            role: 'user',
            parts: [{
              text: contentToCache
            }]
          }],
          ttl: `${ttlMinutes * 60}s`, // Convert minutes to seconds
          displayName: `context-cache-${childId}-${Date.now()}`
        })
      });

      if (!cacheResponse.ok) {
        const errorText = await cacheResponse.text();
        throw new Error(`Failed to create cached content: ${cacheResponse.status} - ${errorText}`);
      }

      const cacheData = await cacheResponse.json();
      const cacheId = cacheData.name; // This is the cacheId we'll reference

      // Store cache metadata locally for management
      const contentHash = this.hashContent(contentToCache);
      const cacheEntry = {
        cacheId,
        childId,
        contentHash,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + ttlMinutes * 60 * 1000),
        ttlMinutes
      };

      this.cacheMap.set(`${childId}-${contentHash}`, cacheEntry);
      
      console.log(`✅ Context cached with ID: ${cacheId} (TTL: ${ttlMinutes}m)`);
      return cacheId;

    } catch (error) {
      console.error('❌ Failed to upload content to Gemini cache:', error);
      throw error;
    }
  }

  /**
   * Generate content using cached context via cacheId reference
   * This avoids re-sending the large context blob
   */
  async generateWithCache(
    cacheId: string,
    prompt: string,
    systemInstruction?: string
  ): Promise<string> {
    try {
      console.log(`🔄 Generating content with cached context: ${cacheId}`);

      const requestBody: any = {
        cachedContent: cacheId, // Reference the cached content by ID
        contents: [{
          role: 'user',
          parts: [{
            text: prompt
          }]
        }]
      };

      if (systemInstruction) {
        requestBody.systemInstruction = {
          parts: [{
            text: systemInstruction
          }]
        };
      }

      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-001:generateContent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAccessToken()}`,
          'x-goog-api-key': process.env.GEMINI_API_KEY!
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to generate with cache: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      const generatedText = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      console.log(`✅ Generated response using cached context (${generatedText.length} chars)`);
      return generatedText;

    } catch (error) {
      console.error('❌ Failed to generate with cached context:', error);
      throw error;
    }
  }

  /**
   * Get existing cache ID for content or create new one
   */
  async getCacheIdForContent(
    childId: string,
    content: string,
    ttlMinutes: number = 60
  ): Promise<string> {
    const contentHash = this.hashContent(content);
    const cacheKey = `${childId}-${contentHash}`;
    
    // Check if we have a valid cached entry
    const existingEntry = this.cacheMap.get(cacheKey);
    if (existingEntry && existingEntry.expiresAt > new Date()) {
      console.log(`♻️ Reusing existing cache: ${existingEntry.cacheId}`);
      return existingEntry.cacheId;
    }

    // Create new cache entry
    return await this.uploadContentToCache(childId, content, ttlMinutes);
  }

  /**
   * Clean up expired cache entries from Google's servers
   */
  async cleanupExpiredCaches(): Promise<void> {
    const now = new Date();
    const expiredEntries: string[] = [];

    for (const [key, entry] of Array.from(this.cacheMap.entries())) {
      if (entry.expiresAt <= now) {
        try {
          // Delete from Google's cache
          await this.deleteCachedContent(entry.cacheId);
          expiredEntries.push(key);
        } catch (error) {
          console.error(`Failed to delete expired cache ${entry.cacheId}:`, error);
        }
      }
    }

    // Remove from local tracking
    expiredEntries.forEach(key => this.cacheMap.delete(key));
    console.log(`🧹 Cleaned up ${expiredEntries.length} expired caches`);
  }

  /**
   * Delete specific cached content from Google's servers
   */
  async deleteCachedContent(cacheId: string): Promise<void> {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/${cacheId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${await this.getAccessToken()}`,
          'x-goog-api-key': process.env.GEMINI_API_KEY!
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to delete cache: ${response.status}`);
      }

      console.log(`🗑️ Deleted cached content: ${cacheId}`);
    } catch (error) {
      console.error(`Failed to delete cached content ${cacheId}:`, error);
      throw error;
    }
  }

  /**
   * List all cached content entries
   */
  async listCachedContents(): Promise<any[]> {
    try {
      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/cachedContents', {
        headers: {
          'Authorization': `Bearer ${await this.getAccessToken()}`,
          'x-goog-api-key': process.env.GEMINI_API_KEY!
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to list cached contents: ${response.status}`);
      }

      const result = await response.json();
      return result.cachedContents || [];
    } catch (error) {
      console.error('Failed to list cached contents:', error);
      throw error;
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    totalActiveCaches: number;
    cachesByChild: Record<string, number>;
    oldestCache?: Date;
    newestCache?: Date;
  } {
    const entries = Array.from(this.cacheMap.values());
    const now = new Date();
    const activeCaches = entries.filter(entry => entry.expiresAt > now);

    const cachesByChild: Record<string, number> = {};
    activeCaches.forEach(entry => {
      cachesByChild[entry.childId] = (cachesByChild[entry.childId] || 0) + 1;
    });

    return {
      totalActiveCaches: activeCaches.length,
      cachesByChild,
      oldestCache: activeCaches.length > 0 ? 
        new Date(Math.min(...activeCaches.map(e => e.createdAt.getTime()))) : undefined,
      newestCache: activeCaches.length > 0 ? 
        new Date(Math.max(...activeCaches.map(e => e.createdAt.getTime()))) : undefined
    };
  }

  private hashContent(content: string): string {
    // Simple hash for content deduplication
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  private async getAccessToken(): Promise<string> {
    // For now, we'll use the API key directly
    // In production, this would implement proper OAuth2 flow
    return process.env.GEMINI_API_KEY!;
  }
}

export const geminiContextCache = new GeminiContextCache();