import React, { useState, useEffect } from 'react';
import { X, MessageCircle, Save, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface ConversationTab {
  id: string;
  title: string;
  description?: string;
  messageCount: number;
  isActive: boolean;
  messages: Array<{
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
  }>;
  contextSnapshot?: any;
}

interface ConversationTabsProps {
  childId: string;
  onSaveConversation: (messages: any[], contextData: any) => void;
  onShowConversationLibrary: () => void;
  currentMessages: any[];
  currentContext: any;
}

export function ConversationTabs({
  childId,
  onSaveConversation,
  onShowConversationLibrary,
  currentMessages,
  currentContext
}: ConversationTabsProps) {
  const [openTabs, setOpenTabs] = useState<ConversationTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string>('current');
  const queryClient = useQueryClient();

  // Save current conversation mutation
  const saveConversationMutation = useMutation({
    mutationFn: async ({ messages, contextData }: { messages: any[]; contextData: any }) => {
      const response = await fetch('/api/conversations/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childId,
          messages,
          contextData
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save conversation');
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['conversations', childId] });
      console.log('Conversation saved:', data.conversation.title);
    }
  });

  // Load conversation mutation
  const loadConversationMutation = useMutation({
    mutationFn: async (conversationId: string) => {
      const response = await fetch(`/api/conversations/${childId}/${conversationId}`);
      
      if (!response.ok) {
        throw new Error('Failed to load conversation');
      }

      return response.json();
    },
    onSuccess: (data) => {
      const { conversation, messages, contextSnapshot } = data;
      
      // Add conversation as new tab
      const newTab: ConversationTab = {
        id: conversation.id,
        title: conversation.title,
        description: conversation.description,
        messageCount: messages.length,
        isActive: true,
        messages,
        contextSnapshot
      };

      setOpenTabs(prev => {
        const existing = prev.find(tab => tab.id === conversation.id);
        if (existing) {
          return prev; // Tab already open
        }
        return [...prev, newTab];
      });

      setActiveTabId(conversation.id);
    }
  });

  // Close tab mutation
  const closeTabMutation = useMutation({
    mutationFn: async (conversationId: string) => {
      const response = await fetch(`/api/conversations/${conversationId}/close-tab`, {
        method: 'PUT'
      });

      if (!response.ok) {
        throw new Error('Failed to close tab');
      }

      return response.json();
    }
  });

  // Continue conversation mutation
  const continueConversationMutation = useMutation({
    mutationFn: async ({ 
      conversationId, 
      role, 
      content, 
      contextSnapshot 
    }: { 
      conversationId: string; 
      role: string; 
      content: string; 
      contextSnapshot: any 
    }) => {
      const response = await fetch(`/api/conversations/${childId}/${conversationId}/continue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role,
          content,
          contextSnapshot
        })
      });

      if (!response.ok) {
        throw new Error('Failed to continue conversation');
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      // Update the tab with new message
      setOpenTabs(prev => prev.map(tab => {
        if (tab.id === variables.conversationId) {
          return {
            ...tab,
            messages: [...tab.messages, {
              id: data.message.id,
              role: data.message.role,
              content: data.message.content,
              timestamp: data.message.timestamp
            }],
            messageCount: tab.messageCount + 1
          };
        }
        return tab;
      }));
    }
  });

  const handleSaveCurrentConversation = () => {
    if (currentMessages.length > 1) {
      saveConversationMutation.mutate({
        messages: currentMessages,
        contextData: currentContext
      });
    }
  };

  const handleCloseTab = (tabId: string) => {
    setOpenTabs(prev => prev.filter(tab => tab.id !== tabId));
    closeTabMutation.mutate(tabId);
    
    // Switch to current tab if closing active tab
    if (activeTabId === tabId) {
      setActiveTabId('current');
    }
  };

  const handleLoadConversation = (conversationId: string) => {
    loadConversationMutation.mutate(conversationId);
  };

  return (
    <div className="w-full border-b bg-background">
      <Tabs value={activeTabId} onValueChange={setActiveTabId} className="w-full">
        <div className="flex items-center justify-between px-4 py-2 border-b">
          <TabsList className="h-auto p-0 bg-transparent">
            {/* Current Conversation Tab */}
            <TabsTrigger 
              value="current" 
              className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Current Chat
              {currentMessages.length > 1 && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  {currentMessages.length}
                </Badge>
              )}
            </TabsTrigger>

            {/* Open Conversation Tabs */}
            {openTabs.map((tab) => (
              <TabsTrigger 
                key={tab.id}
                value={tab.id}
                className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary relative group"
              >
                <span className="truncate max-w-32">{tab.title}</span>
                <Badge variant="outline" className="ml-2 text-xs">
                  {tab.messageCount}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-2 h-4 w-4 p-0 opacity-0 group-hover:opacity-100 hover:bg-destructive hover:text-destructive-foreground"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCloseTab(tab.id);
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSaveCurrentConversation}
              disabled={currentMessages.length <= 1 || saveConversationMutation.isPending}
            >
              <Save className="w-4 h-4 mr-2" />
              {saveConversationMutation.isPending ? 'Saving...' : 'Save Chat'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onShowConversationLibrary}
            >
              <FolderOpen className="w-4 h-4 mr-2" />
              Library
            </Button>
          </div>
        </div>

        {/* Tab Contents */}
        <TabsContent value="current" className="mt-0">
          <div className="p-4 text-sm text-muted-foreground">
            <p>This is your current conversation. Save it to continue later or organize it into groups.</p>
            {currentMessages.length > 1 && (
              <p className="mt-2">
                <strong>{currentMessages.length} messages</strong> - Click "Save Chat" to preserve this conversation.
              </p>
            )}
          </div>
        </TabsContent>

        {openTabs.map((tab) => (
          <TabsContent key={tab.id} value={tab.id} className="mt-0">
            <div className="p-4">
              <div className="mb-4">
                <h3 className="font-semibold">{tab.title}</h3>
                {tab.description && (
                  <p className="text-sm text-muted-foreground mt-1">{tab.description}</p>
                )}
                <Badge variant="outline" className="mt-2">
                  {tab.messageCount} messages
                </Badge>
              </div>

              <ScrollArea className="h-96">
                <div className="space-y-4">
                  {tab.messages.map((message, index) => (
                    <div
                      key={message.id || index}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] p-3 rounded-lg ${
                          message.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <span className="text-xs opacity-70 mt-1 block">
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                <p className="text-sm font-medium mb-2">Continue this conversation</p>
                <p className="text-xs text-muted-foreground">
                  Switch to this tab to continue chatting where you left off. The AI will have full context of your previous messages.
                </p>
              </div>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

export default ConversationTabs;