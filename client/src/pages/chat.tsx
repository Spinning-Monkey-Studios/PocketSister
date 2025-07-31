import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Send, MessageCircle, Plus, Settings, Paperclip, Image, X, File } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileUpload } from "@/components/ui/file-upload";
import { VoiceInput, VoicePlayback } from "@/components/ui/voice-input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Conversation, Message } from "@shared/schema";

export default function ChatPage() {
  const userId = "demo-user"; // In a real app, this would come from authentication
  const [currentMessage, setCurrentMessage] = useState("");
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch conversations
  const { data: conversations = [], isLoading: loadingConversations } = useQuery({
    queryKey: ['/api/chat/conversations'],
    meta: { headers: { 'x-user-id': userId } }
  });

  // Fetch messages for selected conversation
  const { data: messages = [], isLoading: loadingMessages } = useQuery({
    queryKey: ['/api/chat/conversations', selectedConversation, 'messages'],
    enabled: !!selectedConversation,
    meta: { headers: { 'x-user-id': userId } }
  });

  // File upload mutation
  const uploadFileMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'x-user-id': userId },
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload file');
      }
      
      return response.json();
    }
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: (data: { 
      message: string; 
      conversationId?: string; 
      fileUrl?: string; 
      fileName?: string; 
      fileMimeType?: string;
    }) =>
      apiRequest("POST", "/api/chat/send", data, { 'x-user-id': userId }),
    onSuccess: (response) => {
      setCurrentMessage("");
      
      // Update conversations list
      queryClient.invalidateQueries({ queryKey: ['/api/chat/conversations'] });
      
      // Update messages if we have a conversation
      if (response.conversation) {
        setSelectedConversation(response.conversation.id);
        queryClient.invalidateQueries({ 
          queryKey: ['/api/chat/conversations', response.conversation.id, 'messages'] 
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    },
  });

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMessage.trim() && !selectedFile) return;

    let fileData = {};
    
    // Upload file if selected
    if (selectedFile) {
      setIsUploading(true);
      try {
        const uploadResult = await uploadFileMutation.mutateAsync(selectedFile);
        fileData = {
          fileUrl: uploadResult.fileUrl,
          fileName: uploadResult.originalName,
          fileMimeType: uploadResult.mimeType
        };
      } catch (error) {
        toast({
          title: "Upload Failed",
          description: "Failed to upload file. Please try again.",
          variant: "destructive"
        });
        setIsUploading(false);
        return;
      }
      setIsUploading(false);
    }

    sendMessageMutation.mutate({
      message: currentMessage,
      conversationId: selectedConversation || undefined,
      ...fileData
    });
    
    setSelectedFile(null);
    setShowFileUpload(false);
  };

  const startNewConversation = () => {
    setSelectedConversation(null);
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="h-screen bg-gradient-to-br from-pastel-blue to-pastel-lavender flex">
      {/* Sidebar - Conversations */}
      <div className="w-80 bg-white shadow-lg border-r">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-nunito font-bold text-xl text-gray-800">Chat with Stella</h2>
            <Button
              onClick={startNewConversation}
              size="sm"
              className="bg-primary-pink hover:bg-opacity-80"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          <ScrollArea className="h-[calc(100vh-120px)]">
            {loadingConversations ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-16 bg-gray-200 rounded-lg"></div>
                  </div>
                ))}
              </div>
            ) : conversations.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No conversations yet!</p>
                <p className="text-sm">Start chatting with Stella</p>
              </div>
            ) : (
              <div className="space-y-2">
                {conversations.map((conversation: Conversation) => (
                  <Card
                    key={conversation.id}
                    className={`cursor-pointer transition-colors hover:bg-pastel-rose ${
                      selectedConversation === conversation.id ? 'bg-pastel-lavender border-primary-pink' : ''
                    }`}
                    onClick={() => setSelectedConversation(conversation.id)}
                  >
                    <CardContent className="p-3">
                      <h4 className="font-medium text-sm text-gray-800 truncate">
                        {conversation.title || "New conversation"}
                      </h4>
                      <p className="text-xs text-gray-500 mt-1 truncate">
                        {conversation.summary || "Start chatting..."}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-400">
                          {formatTime(conversation.updatedAt)}
                        </span>
                        {conversation.mood && (
                          <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                            {conversation.mood}
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="bg-white border-b p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 gradient-pink-purple rounded-full flex items-center justify-center">
                <span className="text-white text-lg">👩‍🚀</span>
              </div>
              <div>
                <h3 className="font-nunito font-bold text-lg text-gray-800">Stella</h3>
                <p className="text-sm text-gray-500">Your AI Pocket Sister</p>
              </div>
            </div>
            <Button variant="ghost" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Messages Area */}
        <ScrollArea className="flex-1 p-4">
          {!selectedConversation && conversations.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 gradient-pink-purple rounded-full mx-auto mb-6 flex items-center justify-center">
                <span className="text-white text-3xl">👩‍🚀</span>
              </div>
              <h3 className="font-nunito font-bold text-2xl text-gray-800 mb-2">
                Hi there! I'm Stella ✨
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                I'm your AI companion here to chat, help, and support you through anything! 
                What would you like to talk about today?
              </p>
              <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto">
                {[
                  { emoji: "🌟", text: "Daily motivation" },
                  { emoji: "💭", text: "Friend advice" },
                  { emoji: "🎨", text: "Creative ideas" },
                  { emoji: "💪", text: "Confidence boost" }
                ].map((suggestion, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="border-primary-pink text-primary-pink hover:bg-primary-pink hover:text-white"
                    onClick={() => setCurrentMessage(suggestion.text)}
                  >
                    <span className="mr-2">{suggestion.emoji}</span>
                    {suggestion.text}
                  </Button>
                ))}
              </div>
            </div>
          ) : loadingMessages ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                    <div className="h-12 bg-gray-200 rounded-2xl w-2/3"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message: Message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                      message.role === 'user'
                        ? 'bg-primary-pink text-white'
                        : 'bg-white border border-gray-200 text-gray-800'
                    }`}
                  >
                    {/* File attachment display */}
                    {message.metadata?.fileUrl && (
                      <div className="mb-2">
                        {message.metadata.fileMimeType?.startsWith('image/') ? (
                          <img 
                            src={message.metadata.fileUrl} 
                            alt={message.metadata.fileName || 'Shared image'}
                            className="max-w-48 rounded-lg border"
                          />
                        ) : (
                          <div className="flex items-center gap-2 p-2 bg-gray-100 rounded-lg">
                            <File className="w-4 h-4" />
                            <span className="text-sm">{message.metadata.fileName}</span>
                          </div>
                        )}
                      </div>
                    )}
                    <div className="flex items-start justify-between gap-2">
                      <p className="whitespace-pre-wrap flex-1">{message.content}</p>
                      {message.role === 'assistant' && (
                        <VoicePlayback 
                          text={message.content}
                          className="mt-1"
                        />
                      )}
                    </div>
                    <p className={`text-xs mt-1 ${
                      message.role === 'user' ? 'text-pink-100' : 'text-gray-500'
                    }`}>
                      {formatTime(message.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>

        {/* Message Input */}
        <div className="bg-white border-t p-4">
          {/* File Upload Area */}
          {showFileUpload && (
            <div className="mb-4 p-4 border rounded-lg bg-gray-50">
              <FileUpload
                onFileSelect={setSelectedFile}
                onFileRemove={() => setSelectedFile(null)}
                selectedFile={selectedFile}
                disabled={isUploading || sendMessageMutation.isPending}
                className="mb-2"
              />
            </div>
          )}

          <form onSubmit={handleSendMessage} className="flex space-x-2">
            <div className="flex-1 flex space-x-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowFileUpload(!showFileUpload)}
                className="rounded-full"
                disabled={sendMessageMutation.isPending}
              >
                <Paperclip className="h-4 w-4" />
              </Button>
              <div className="flex-1 flex items-center space-x-2">
                <Input
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  placeholder={selectedFile ? "Add a message (optional)..." : "Type a message to Stella..."}
                  className="flex-1 rounded-full border-2 border-gray-200 focus:border-primary-pink"
                  disabled={sendMessageMutation.isPending || isUploading}
                />
                <VoiceInput
                  onTranscript={(text) => setCurrentMessage(prev => prev + (prev ? ' ' : '') + text)}
                  disabled={sendMessageMutation.isPending || isUploading}
                />
              </div>
            </div>
            <Button
              type="submit"
              disabled={sendMessageMutation.isPending || isUploading || (!currentMessage.trim() && !selectedFile)}
              className="gradient-pink-purple rounded-full px-6"
            >
              {sendMessageMutation.isPending || isUploading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}