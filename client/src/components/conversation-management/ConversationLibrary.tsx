import React, { useState } from 'react';
import { 
  Search, 
  Plus, 
  Folder, 
  MessageCircle, 
  Calendar, 
  ChevronRight,
  Edit2,
  Trash2,
  GripVertical
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface SavedConversation {
  id: string;
  title: string;
  description?: string;
  groupId?: string;
  lastMessageAt: string;
  messageCount: number;
  isTabOpen: boolean;
}

interface ConversationGroup {
  id: string;
  name: string;
  color: string;
  icon: string;
  conversations?: SavedConversation[];
}

interface ConversationLibraryProps {
  childId: string;
  isOpen: boolean;
  onClose: () => void;
  onLoadConversation: (conversationId: string) => void;
}

export function ConversationLibrary({
  childId,
  isOpen,
  onClose,
  onLoadConversation
}: ConversationLibraryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupIcon, setNewGroupIcon] = useState('💬');
  const [newGroupColor, setNewGroupColor] = useState('#3B82F6');

  const queryClient = useQueryClient();

  // Fetch conversations and groups
  const { data: libraryData, isLoading } = useQuery({
    queryKey: ['conversations', childId],
    queryFn: async () => {
      const response = await fetch(`/api/conversations/${childId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch conversations');
      }
      return response.json();
    },
    enabled: isOpen
  });

  // Create group mutation
  const createGroupMutation = useMutation({
    mutationFn: async (groupData: { name: string; icon: string; color: string }) => {
      const response = await fetch('/api/conversations/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childId,
          ...groupData
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create group');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations', childId] });
      setShowCreateGroup(false);
      setNewGroupName('');
      setNewGroupIcon('💬');
      setNewGroupColor('#3B82F6');
    }
  });

  // Move conversation to group mutation
  const moveToGroupMutation = useMutation({
    mutationFn: async ({ conversationId, groupId }: { conversationId: string; groupId: string | null }) => {
      const response = await fetch(`/api/conversations/${conversationId}/group`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupId })
      });

      if (!response.ok) {
        throw new Error('Failed to move conversation');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations', childId] });
    }
  });

  // Delete conversation mutation
  const deleteConversationMutation = useMutation({
    mutationFn: async (conversationId: string) => {
      const response = await fetch(`/api/conversations/${conversationId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete conversation');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations', childId] });
    }
  });

  if (!isOpen) return null;

  const conversations: SavedConversation[] = libraryData?.conversations || [];
  const groups: ConversationGroup[] = libraryData?.groups || [];

  // Filter conversations by search query
  const filteredConversations = conversations.filter(conv =>
    conv.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group conversations
  const groupedConversations = groups.map(group => ({
    ...group,
    conversations: filteredConversations.filter(conv => conv.groupId === group.id)
  }));

  const ungroupedConversations = filteredConversations.filter(conv => !conv.groupId);

  const handleCreateGroup = () => {
    if (newGroupName.trim()) {
      createGroupMutation.mutate({
        name: newGroupName.trim(),
        icon: newGroupIcon,
        color: newGroupColor
      });
    }
  };

  const handleMoveToGroup = (conversationId: string, groupId: string | null) => {
    moveToGroupMutation.mutate({ conversationId, groupId });
  };

  const handleDeleteConversation = (conversationId: string) => {
    if (confirm('Are you sure you want to delete this conversation?')) {
      deleteConversationMutation.mutate(conversationId);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Conversation Library
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search and Controls */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowCreateGroup(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              New Group
            </Button>
          </div>

          <ScrollArea className="h-96">
            <div className="space-y-6">
              {/* Grouped Conversations */}
              {groupedConversations.map((group) => (
                <div key={group.id} className="space-y-3">
                  <div 
                    className="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-muted/50"
                    style={{ borderLeft: `4px solid ${group.color}` }}
                    onClick={() => setSelectedGroupId(
                      selectedGroupId === group.id ? null : group.id
                    )}
                  >
                    <span className="text-lg">{group.icon}</span>
                    <div className="flex-1">
                      <h3 className="font-medium">{group.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {group.conversations?.length || 0} conversations
                      </p>
                    </div>
                    <ChevronRight 
                      className={`w-4 h-4 transition-transform ${
                        selectedGroupId === group.id ? 'rotate-90' : ''
                      }`} 
                    />
                  </div>

                  {selectedGroupId === group.id && group.conversations && (
                    <div className="ml-6 space-y-2">
                      {group.conversations.map((conversation) => (
                        <ConversationCard
                          key={conversation.id}
                          conversation={conversation}
                          groups={groups}
                          onLoad={() => onLoadConversation(conversation.id)}
                          onMoveToGroup={handleMoveToGroup}
                          onDelete={handleDeleteConversation}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {/* Ungrouped Conversations */}
              {ungroupedConversations.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3">
                    <Folder className="w-5 h-5 text-muted-foreground" />
                    <h3 className="font-medium text-muted-foreground">Ungrouped</h3>
                    <Badge variant="outline">{ungroupedConversations.length}</Badge>
                  </div>

                  <div className="space-y-2">
                    {ungroupedConversations.map((conversation) => (
                      <ConversationCard
                        key={conversation.id}
                        conversation={conversation}
                        groups={groups}
                        onLoad={() => onLoadConversation(conversation.id)}
                        onMoveToGroup={handleMoveToGroup}
                        onDelete={handleDeleteConversation}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Empty State */}
              {filteredConversations.length === 0 && !isLoading && (
                <div className="text-center py-12">
                  <MessageCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-medium mb-2">No conversations found</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {searchQuery ? 'Try a different search term' : 'Start chatting to save your first conversation'}
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Create Group Dialog */}
        <Dialog open={showCreateGroup} onOpenChange={setShowCreateGroup}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Group</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Group Name</label>
                <Input
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="Enter group name..."
                  className="mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Icon</label>
                  <Input
                    value={newGroupIcon}
                    onChange={(e) => setNewGroupIcon(e.target.value)}
                    placeholder="💬"
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Color</label>
                  <Input
                    type="color"
                    value={newGroupColor}
                    onChange={(e) => setNewGroupColor(e.target.value)}
                    className="mt-1 h-10"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowCreateGroup(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateGroup}
                  disabled={!newGroupName.trim() || createGroupMutation.isPending}
                >
                  {createGroupMutation.isPending ? 'Creating...' : 'Create Group'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}

interface ConversationCardProps {
  conversation: SavedConversation;
  groups: ConversationGroup[];
  onLoad: () => void;
  onMoveToGroup: (conversationId: string, groupId: string | null) => void;
  onDelete: (conversationId: string) => void;
}

function ConversationCard({ conversation, groups, onLoad, onMoveToGroup, onDelete }: ConversationCardProps) {
  const [showActions, setShowActions] = useState(false);

  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-shadow relative"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex-1" onClick={onLoad}>
            <CardTitle className="text-base">{conversation.title}</CardTitle>
            {conversation.description && (
              <CardDescription className="mt-1">
                {conversation.description}
              </CardDescription>
            )}
          </div>
          {conversation.isTabOpen && (
            <Badge variant="secondary" className="ml-2">
              Open
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <MessageCircle className="w-3 h-3" />
              {conversation.messageCount}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {new Date(conversation.lastMessageAt).toLocaleDateString()}
            </span>
          </div>
          
          {showActions && (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => onDelete(conversation.id)}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default ConversationLibrary;