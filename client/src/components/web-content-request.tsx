import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Globe, Youtube, ExternalLink, AlertTriangle, Crown, MessageCircle, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface WebContentRequestProps {
  childId: string;
  conversationId: string;
  onUpgradePrompt: () => void;
}

export default function WebContentRequest({ childId, conversationId, onUpgradePrompt }: WebContentRequestProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [requestType, setRequestType] = useState<"youtube" | "website" | null>(null);
  const [url, setUrl] = useState("");
  const [context, setContext] = useState("");
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);

  // Check if web browsing is available
  const checkWebBrowsingMutation = useMutation({
    mutationFn: async (data: { childId: string; url: string; type: string }) => {
      const response = await apiRequest("POST", "/api/web-content/check-availability", data);
      return response.json();
    },
    onSuccess: (data) => {
      if (!data.available) {
        setShowUpgradePrompt(true);
      } else {
        // Proceed with web content request
        handleWebContentRequest();
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to check web browsing availability.",
        variant: "destructive",
      });
    },
  });

  // Request web content
  const webContentMutation = useMutation({
    mutationFn: async (data: {
      childId: string;
      conversationId: string;
      url: string;
      type: string;
      context: string;
    }) => {
      await apiRequest("POST", "/api/web-content/request", data);
    },
    onSuccess: () => {
      toast({
        title: "Content Requested",
        description: "I'm checking that content for you!",
      });
      setUrl("");
      setContext("");
      setRequestType(null);
      // Refresh conversation to show the response
      queryClient.invalidateQueries({ queryKey: ["/api/conversations", conversationId] });
    },
    onError: () => {
      toast({
        title: "Request Failed",
        description: "I couldn't access that content right now.",
        variant: "destructive",
      });
    },
  });

  // Request parent notification for upgrade
  const parentNotificationMutation = useMutation({
    mutationFn: async (data: {
      childId: string;
      requestedContent: string;
      requestType: string;
    }) => {
      await apiRequest("POST", "/api/parent/web-browsing-request", data);
    },
    onSuccess: () => {
      toast({
        title: "Request Sent to Parents",
        description: "I've let your parents know you'd like me to check out that content!",
      });
      setShowUpgradePrompt(false);
      setUrl("");
      setContext("");
      setRequestType(null);
    },
    onError: () => {
      toast({
        title: "Notification Failed",
        description: "I couldn't reach your parents right now.",
        variant: "destructive",
      });
    },
  });

  const handleWebContentRequest = () => {
    if (!url.trim() || !requestType) return;

    webContentMutation.mutate({
      childId,
      conversationId,
      url: url.trim(),
      type: requestType,
      context: context.trim(),
    });
  };

  const handleInitialRequest = () => {
    if (!url.trim() || !requestType) {
      toast({
        title: "Missing Information",
        description: "Please provide a URL and tell me what you'd like to know about it.",
        variant: "destructive",
      });
      return;
    }

    checkWebBrowsingMutation.mutate({
      childId,
      url: url.trim(),
      type: requestType,
    });
  };

  const handleParentNotification = () => {
    parentNotificationMutation.mutate({
      childId,
      requestedContent: url.trim(),
      requestType: requestType!,
    });
  };

  const isYouTubeUrl = (url: string) => {
    return url.includes("youtube.com") || url.includes("youtu.be");
  };

  const getRequestTypeFromUrl = (url: string) => {
    return isYouTubeUrl(url) ? "youtube" : "website";
  };

  if (showUpgradePrompt) {
    return (
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            <CardTitle className="text-orange-800">Web Browsing Not Available</CardTitle>
          </div>
          <CardDescription className="text-orange-700">
            I can't browse the web or check YouTube videos right now, but I can ask your parents to help!
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-start gap-3">
              {requestType === "youtube" ? (
                <Youtube className="h-5 w-5 text-red-600 mt-1" />
              ) : (
                <Globe className="h-5 w-5 text-blue-600 mt-1" />
              )}
              <div className="flex-1">
                <p className="font-medium text-gray-900">
                  {requestType === "youtube" ? "YouTube Video" : "Website"}
                </p>
                <p className="text-sm text-gray-600 break-all">{url}</p>
                {context && (
                  <p className="text-sm text-gray-700 mt-1 italic">
                    "{context}"
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Crown className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-800">
                Upgrade Recommendation
              </span>
            </div>
            <p className="text-sm text-gray-700">
              Your parents can upgrade to a plan that includes web browsing and YouTube transcript reading. 
              This would let me help you explore content safely!
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleParentNotification}
              disabled={parentNotificationMutation.isPending}
              className="flex-1"
            >
              {parentNotificationMutation.isPending ? (
                <>
                  <Send className="mr-2 h-4 w-4 animate-pulse" />
                  Notifying Parents...
                </>
              ) : (
                <>
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Ask Parents to Upgrade
                </>
              )}
            </Button>
            
            <Button
              variant="outline"
              onClick={() => setShowUpgradePrompt(false)}
            >
              Maybe Later
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-blue-600" />
          Check Web Content
        </CardTitle>
        <CardDescription>
          Ask me to look at a website or YouTube video for you
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="content-url">URL (Website or YouTube)</Label>
          <Input
            id="content-url"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              if (e.target.value.trim()) {
                setRequestType(getRequestTypeFromUrl(e.target.value));
              }
            }}
            placeholder="https://example.com or https://youtube.com/watch?v=..."
            className="w-full"
          />
          {requestType && (
            <div className="flex items-center gap-2">
              {requestType === "youtube" ? (
                <Youtube className="h-4 w-4 text-red-600" />
              ) : (
                <Globe className="h-4 w-4 text-blue-600" />
              )}
              <Badge variant="outline">
                {requestType === "youtube" ? "YouTube Video" : "Website"}
              </Badge>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="context">What would you like to know?</Label>
          <Textarea
            id="context"
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="What are you curious about? What should I look for?"
            rows={3}
            maxLength={200}
          />
          <p className="text-xs text-gray-500">{context.length}/200 characters</p>
        </div>

        <Separator />

        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <ExternalLink className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">How it works</span>
          </div>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>• I can read website text and YouTube auto-generated captions</li>
            <li>• I'll summarize the content and answer your questions</li>
            <li>• All content is checked for age-appropriateness</li>
            <li>• Your parents can see what content you've requested</li>
          </ul>
        </div>

        <Button
          onClick={handleInitialRequest}
          disabled={!url.trim() || !context.trim() || checkWebBrowsingMutation.isPending}
          className="w-full"
        >
          {checkWebBrowsingMutation.isPending ? (
            <>
              <Globe className="mr-2 h-4 w-4 animate-spin" />
              Checking Content...
            </>
          ) : (
            <>
              <ExternalLink className="mr-2 h-4 w-4" />
              Check This Content
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}