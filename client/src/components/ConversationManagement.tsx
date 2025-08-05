import React, { useState } from 'react';
import ConversationTabs from './conversation-management/ConversationTabs';
import ConversationLibrary from './conversation-management/ConversationLibrary';

interface ConversationManagementProps {
  childId: string;
  currentMessages: any[];
  currentContext: any;
  onLoadConversation: (conversationData: any) => void;
}

export function ConversationManagement({
  childId,
  currentMessages,
  currentContext,
  onLoadConversation
}: ConversationManagementProps) {
  const [showLibrary, setShowLibrary] = useState(false);

  const handleSaveConversation = (messages: any[], contextData: any) => {
    // The ConversationTabs component handles the actual saving
    console.log('Saving conversation with', messages.length, 'messages');
  };

  const handleLoadConversation = (conversationId: string) => {
    // This will be called when a conversation is loaded from the library
    // The conversation data will be fetched and passed to the parent component
    fetch(`/api/conversations/${childId}/${conversationId}`)
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          onLoadConversation({
            id: data.conversation.id,
            title: data.conversation.title,
            messages: data.messages,
            contextSnapshot: data.contextSnapshot
          });
          setShowLibrary(false);
        }
      })
      .catch(error => {
        console.error('Failed to load conversation:', error);
      });
  };

  return (
    <>
      <ConversationTabs
        childId={childId}
        onSaveConversation={handleSaveConversation}
        onShowConversationLibrary={() => setShowLibrary(true)}
        currentMessages={currentMessages}
        currentContext={currentContext}
      />
      
      <ConversationLibrary
        childId={childId}
        isOpen={showLibrary}
        onClose={() => setShowLibrary(false)}
        onLoadConversation={handleLoadConversation}
      />
    </>
  );
}

export default ConversationManagement;