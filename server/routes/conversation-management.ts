import { Router } from 'express';
import { storage } from '../storage';
import { conversationNamingService } from '../conversation-naming';
import { contextAnalyzer } from '../context-analyzer';
import { isAuthenticated } from '../replitAuth';
import { insertSavedConversationSchema, insertConversationGroupSchema, insertConversationMessageSchema, savedConversations, conversationGroups, conversationMessages } from '@shared/schema';
import { eq, and, desc } from 'drizzle-orm';

const router = Router();

// Simple ID generation function
function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

/**
 * Save current conversation with AI-generated name
 * POST /api/conversations/save
 */
router.post('/save', isAuthenticated, async (req, res) => {
  try {
    const { childId, messages, contextData } = req.body;
    
    if (!childId || !messages || !Array.isArray(messages)) {
      return res.status(400).json({
        error: 'childId and messages array are required'
      });
    }

    // Create conversation text for naming
    const conversationText = messages
      .map((msg: any) => `${msg.role === 'user' ? 'Child' : 'AI'}: ${msg.content}`)
      .join('\n');

    // Generate intelligent name using Gemini
    const nameResult = await conversationNamingService.generateConversationName(conversationText);
    
    // Create saved conversation
    const conversationId = generateId();
    const savedConversation = {
      id: conversationId,
      childId,
      title: nameResult.title,
      description: nameResult.description,
      lastMessageAt: new Date(),
      messageCount: messages.length,
      contextSnapshot: JSON.stringify(contextData || {})
    };

    await (storage as any).db.insert(savedConversations).values(savedConversation);

    // Save all messages
    for (let i = 0; i < messages.length; i++) {
      const message = messages[i];
      const conversationMessage = {
        id: generateId(),
        conversationId,
        childId,
        role: message.role,
        content: message.content,
        timestamp: new Date(Date.now() - (messages.length - i) * 1000), // Spread timestamps
        contextSnapshot: JSON.stringify(message.contextSnapshot || {})
      };

      await (storage as any).db.insert(conversationMessages).values(conversationMessage);
    }

    res.json({
      success: true,
      conversation: {
        id: conversationId,
        title: nameResult.title,
        description: nameResult.description,
        messageCount: messages.length
      }
    });
    
  } catch (error) {
    console.error('Error saving conversation:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get all saved conversations for a child
 * GET /api/conversations/:childId
 */
router.get('/:childId', isAuthenticated, async (req, res) => {
  try {
    const { childId } = req.params;
    
    const conversations = await (storage as any).db
      .select()
      .from(savedConversations)
      .where(and(
        eq(savedConversations.childId, childId),
        eq(savedConversations.isActive, true)
      ))
      .orderBy(desc(savedConversations.lastMessageAt));

    const groups = await (storage as any).db
      .select()
      .from(conversationGroups)
      .where(eq(conversationGroups.childId, childId))
      .orderBy(conversationGroups.position);

    res.json({
      success: true,
      conversations,
      groups
    });
    
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Load a specific conversation with messages
 * GET /api/conversations/:childId/:conversationId
 */
router.get('/:childId/:conversationId', isAuthenticated, async (req, res) => {
  try {
    const { childId, conversationId } = req.params;
    
    // Get conversation details
    const conversation = await (storage as any).db
      .select()
      .from(savedConversations)
      .where(and(
        eq(savedConversations.id, conversationId),
        eq(savedConversations.childId, childId)
      ))
      .then((results: any[]) => results[0]);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found'
      });
    }

    // Get all messages for this conversation
    const messages = await (storage as any).db
      .select()
      .from(conversationMessages)
      .where(eq(conversationMessages.conversationId, conversationId))
      .orderBy(conversationMessages.timestamp);

    // Mark conversation tab as open
    await (storage as any).db
      .update(savedConversations)
      .set({ isTabOpen: true, updatedAt: new Date() })
      .where(eq(savedConversations.id, conversationId));

    res.json({
      success: true,
      conversation,
      messages,
      contextSnapshot: conversation.contextSnapshot ? JSON.parse(conversation.contextSnapshot) : {}
    });
    
  } catch (error) {
    console.error('Error loading conversation:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Continue conversation - add new message
 * POST /api/conversations/:childId/:conversationId/continue
 */
router.post('/:childId/:conversationId/continue', isAuthenticated, async (req, res) => {
  try {
    const { childId, conversationId } = req.params;
    const { role, content, contextSnapshot } = req.body;
    
    if (!role || !content) {
      return res.status(400).json({
        error: 'role and content are required'
      });
    }

    // Add new message to conversation
    const messageId = generateId();
    const message = {
      id: messageId,
      conversationId,
      childId,
      role,
      content,
      contextSnapshot: JSON.stringify(contextSnapshot || {})
    };

    await (storage as any).db.insert(conversationMessages).values(message);

    // Update conversation metadata
    await (storage as any).db
      .update(savedConversations)
      .set({ 
        lastMessageAt: new Date(),
        updatedAt: new Date(),
        messageCount: (storage as any).sql`message_count + 1`
      })
      .where(eq(savedConversations.id, conversationId));

    res.json({
      success: true,
      message: {
        id: messageId,
        role,
        content,
        timestamp: new Date()
      }
    });
    
  } catch (error) {
    console.error('Error continuing conversation:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Create conversation group
 * POST /api/conversations/groups
 */
router.post('/groups', isAuthenticated, async (req, res) => {
  try {
    const { childId, name, color, icon } = req.body;
    
    if (!childId || !name) {
      return res.status(400).json({
        error: 'childId and name are required'
      });
    }

    const groupId = generateId();
    const group = {
      id: groupId,
      childId,
      name,
      color: color || '#3B82F6',
      icon: icon || '💬',
      position: 0
    };

    await (storage as any).db.insert(conversationGroups).values(group);

    res.json({
      success: true,
      group
    });
    
  } catch (error) {
    console.error('Error creating group:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Move conversation to group
 * PUT /api/conversations/:conversationId/group
 */
router.put('/:conversationId/group', isAuthenticated, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { groupId } = req.body;
    
    await (storage as any).db
      .update(savedConversations)
      .set({ 
        groupId: groupId || null,
        updatedAt: new Date()
      })
      .where(eq(savedConversations.id, conversationId));

    res.json({
      success: true,
      message: 'Conversation moved to group'
    });
    
  } catch (error) {
    console.error('Error moving conversation to group:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Close conversation tab
 * PUT /api/conversations/:conversationId/close-tab
 */
router.put('/:conversationId/close-tab', isAuthenticated, async (req, res) => {
  try {
    const { conversationId } = req.params;
    
    await (storage as any).db
      .update(savedConversations)
      .set({ 
        isTabOpen: false,
        updatedAt: new Date()
      })
      .where(eq(savedConversations.id, conversationId));

    res.json({
      success: true,
      message: 'Conversation tab closed'
    });
    
  } catch (error) {
    console.error('Error closing conversation tab:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Delete conversation
 * DELETE /api/conversations/:conversationId
 */
router.delete('/:conversationId', isAuthenticated, async (req, res) => {
  try {
    const { conversationId } = req.params;
    
    // Soft delete - mark as inactive
    await (storage as any).db
      .update(savedConversations)
      .set({ 
        isActive: false,
        updatedAt: new Date()
      })
      .where(eq(savedConversations.id, conversationId));

    res.json({
      success: true,
      message: 'Conversation deleted'
    });
    
  } catch (error) {
    console.error('Error deleting conversation:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get group suggestions based on existing conversations
 * GET /api/conversations/:childId/group-suggestions
 */
router.get('/:childId/group-suggestions', isAuthenticated, async (req, res) => {
  try {
    const { childId } = req.params;
    
    const conversations = await (storage as any).db
      .select(['title'])
      .from(savedConversations)
      .where(and(
        eq(savedConversations.childId, childId),
        eq(savedConversations.isActive, true)
      ));

    const titles = conversations.map((conv: any) => conv.title);
    const suggestions = await conversationNamingService.generateGroupSuggestions(childId, titles);

    res.json({
      success: true,
      suggestions: suggestions.suggestedGroups
    });
    
  } catch (error) {
    console.error('Error generating group suggestions:', error);
    res.status(500).json({
      success: false,
      suggestions: []
    });
  }
});

export default router;