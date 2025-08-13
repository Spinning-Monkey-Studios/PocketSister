import { db } from "./db";
import { aiMessageTemplates } from "@shared/schema";
import { eq } from "drizzle-orm";
import type { AiMessageTemplate } from "@shared/schema";

export class OfflineHandlerService {
  // Initialize default offline message templates
  static async initializeDefaultTemplates(): Promise<void> {
    const defaultTemplates = [
      {
        templateKey: 'offline',
        title: 'I\'m Currently Offline',
        message: 'Hi there! It looks like {pocketSisterName} is having trouble connecting to the internet right now. Don\'t worry - I\'ll be back as soon as the connection is restored! In the meantime, you can still browse your saved conversations and check your profile. 💜',
        priority: 1,
      },
      {
        templateKey: 'ai_unreachable',
        title: 'AI Temporarily Unavailable',
        message: 'Hey {pocketSisterName}! I\'m having a little trouble thinking right now - my AI brain is taking a quick break. This usually only lasts a few minutes! Why don\'t you try again in a moment? I can\'t wait to chat with you! 🤗',
        priority: 2,
      },
      {
        templateKey: 'maintenance',
        title: 'Maintenance Mode',
        message: 'Hi {pocketSisterName}! I\'m getting some upgrades to be an even better friend to you! I should be back online very soon. Thanks for your patience! 🛠️✨',
        priority: 3,
      },
      {
        templateKey: 'server_error',
        title: 'Technical Difficulties',
        message: 'Oops! {pocketSisterName} encountered a small hiccup. Don\'t worry, it\'s not your fault! Please try refreshing the page or coming back in a few minutes. I\'ll be here waiting! 💖',
        priority: 4,
      },
      {
        templateKey: 'rate_limit',
        title: 'Taking a Short Break',
        message: 'Wow {pocketSisterName}, you\'re such a great conversationalist! I need to take a tiny break to recharge my thoughts. Give me just a moment and we can continue our amazing chat! ⚡',
        priority: 5,
      }
    ];

    for (const template of defaultTemplates) {
      const existing = await db
        .select()
        .from(aiMessageTemplates)
        .where(eq(aiMessageTemplates.templateKey, template.templateKey))
        .limit(1);

      if (existing.length === 0) {
        await db.insert(aiMessageTemplates).values(template);
      }
    }
  }

  // Get a message template by key
  static async getMessageTemplate(templateKey: string): Promise<AiMessageTemplate | null> {
    const templates = await db
      .select()
      .from(aiMessageTemplates)
      .where(eq(aiMessageTemplates.templateKey, templateKey))
      .where(eq(aiMessageTemplates.isActive, true))
      .limit(1);

    return templates[0] || null;
  }

  // Process template variables (handlebars-style)
  static processTemplate(
    template: string,
    variables: Record<string, any>
  ): string {
    let processed = template;
    
    // Replace handlebars variables like {pocketSisterName}
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`\\{${key}\\}`, 'g');
      processed = processed.replace(regex, String(value || key));
    }

    return processed;
  }

  // Get processed offline message
  static async getProcessedOfflineMessage(
    templateKey: string,
    variables: Record<string, any> = {}
  ): Promise<{ title: string; message: string } | null> {
    const template = await this.getMessageTemplate(templateKey);
    if (!template) return null;

    // Default variables
    const defaultVars = {
      pocketSisterName: 'friend',
      ...variables
    };

    return {
      title: this.processTemplate(template.title, defaultVars),
      message: this.processTemplate(template.message, defaultVars)
    };
  }

  // Update a message template (for admin dashboard)
  static async updateMessageTemplate(
    templateKey: string,
    updates: {
      title?: string;
      message?: string;
      isActive?: boolean;
      priority?: number;
    }
  ): Promise<boolean> {
    const result = await db
      .update(aiMessageTemplates)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(aiMessageTemplates.templateKey, templateKey));

    return result.rowCount > 0;
  }

  // Get all message templates for admin dashboard
  static async getAllTemplates(): Promise<AiMessageTemplate[]> {
    return await db
      .select()
      .from(aiMessageTemplates)
      .orderBy(aiMessageTemplates.priority);
  }

  // Create a new message template
  static async createTemplate(template: {
    templateKey: string;
    title: string;
    message: string;
    priority?: number;
    customVariables?: Record<string, any>;
  }): Promise<string> {
    const [created] = await db
      .insert(aiMessageTemplates)
      .values({
        ...template,
        priority: template.priority || 10
      })
      .returning();

    return created.id;
  }

  // Delete a message template
  static async deleteTemplate(templateKey: string): Promise<boolean> {
    const result = await db
      .delete(aiMessageTemplates)
      .where(eq(aiMessageTemplates.templateKey, templateKey));

    return result.rowCount > 0;
  }
}

// Middleware for handling offline states
export function offlineMiddleware() {
  return async (req: any, res: any, next: any) => {
    try {
      // Check if AI services are reachable
      const aiHealthy = await checkAIHealth();
      
      if (!aiHealthy) {
        const pocketSisterName = req.body?.pocketSisterName || 
                               req.headers['x-pocket-sister-name'] || 
                               'friend';
        
        const offlineMessage = await OfflineHandlerService.getProcessedOfflineMessage(
          'ai_unreachable',
          { pocketSisterName }
        );

        return res.status(503).json({
          error: 'AI_UNREACHABLE',
          message: offlineMessage?.message || 'AI is temporarily unavailable',
          title: offlineMessage?.title || 'AI Unavailable',
          retryAfter: 60 // seconds
        });
      }

      next();
    } catch (error) {
      console.error('Offline middleware error:', error);
      next();
    }
  };
}

// Health check for AI services
async function checkAIHealth(): Promise<boolean> {
  try {
    // Simple health check - could be expanded to ping actual AI services
    return true; // Placeholder implementation
  } catch {
    return false;
  }
}

// Client-side offline detection utilities
export const clientOfflineUtils = {
  // Generate offline page HTML
  generateOfflinePage: (pocketSisterName: string = 'friend') => `
    <div class="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center p-4">
      <div class="max-w-md w-full bg-white rounded-lg shadow-xl p-6 text-center">
        <div class="mb-6">
          <div class="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-10 h-10 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <h2 class="text-xl font-bold text-gray-800 mb-2">Connection Issue</h2>
          <p class="text-gray-600">
            Hi ${pocketSisterName}! I'm having trouble connecting to the internet right now. 
            Don't worry - I'll be back as soon as the connection is restored!
          </p>
        </div>
        <div class="space-y-3">
          <button onclick="window.location.reload()" 
                  class="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors">
            Try Again
          </button>
          <p class="text-sm text-gray-500">
            In the meantime, you can still browse your saved conversations
          </p>
        </div>
      </div>
    </div>
  `
};