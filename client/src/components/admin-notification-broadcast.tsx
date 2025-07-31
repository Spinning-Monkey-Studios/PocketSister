import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Megaphone, Send, AlertTriangle, Users, Crown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminNotificationBroadcast() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [targetAudience, setTargetAudience] = useState<"all" | "parents" | "premium">("all");
  const [priority, setPriority] = useState<"low" | "normal" | "high">("normal");
  
  // Emergency alert state
  const [emergencyUserId, setEmergencyUserId] = useState("");
  const [emergencyTitle, setEmergencyTitle] = useState("");
  const [emergencyMessage, setEmergencyMessage] = useState("");
  const [emergencyChildId, setEmergencyChildId] = useState("");

  // Broadcast announcement mutation
  const broadcastMutation = useMutation({
    mutationFn: async (data: {
      title: string;
      message: string;
      targetAudience: string;
      priority: string;
    }) => {
      await apiRequest("POST", "/api/admin/notifications/broadcast", data);
    },
    onSuccess: () => {
      toast({
        title: "Announcement Sent",
        description: "Your announcement has been broadcast to the selected audience.",
      });
      setTitle("");
      setMessage("");
      setTargetAudience("all");
      setPriority("normal");
    },
    onError: () => {
      toast({
        title: "Broadcast Failed",
        description: "Failed to send announcement. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Emergency alert mutation
  const emergencyMutation = useMutation({
    mutationFn: async (data: {
      userId: string;
      title: string;
      message: string;
      childId?: string;
      actionRequired: boolean;
    }) => {
      await apiRequest("POST", "/api/admin/notifications/emergency", data);
    },
    onSuccess: () => {
      toast({
        title: "Emergency Alert Sent",
        description: "Emergency alert has been sent to the specified user.",
      });
      setEmergencyUserId("");
      setEmergencyTitle("");
      setEmergencyMessage("");
      setEmergencyChildId("");
    },
    onError: () => {
      toast({
        title: "Emergency Alert Failed",
        description: "Failed to send emergency alert. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleBroadcast = () => {
    if (!title.trim() || !message.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide both title and message for the announcement.",
        variant: "destructive",
      });
      return;
    }

    broadcastMutation.mutate({
      title: title.trim(),
      message: message.trim(),
      targetAudience,
      priority,
    });
  };

  const handleEmergencyAlert = () => {
    if (!emergencyUserId.trim() || !emergencyTitle.trim() || !emergencyMessage.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide user ID, title, and message for the emergency alert.",
        variant: "destructive",
      });
      return;
    }

    emergencyMutation.mutate({
      userId: emergencyUserId.trim(),
      title: emergencyTitle.trim(),
      message: emergencyMessage.trim(),
      childId: emergencyChildId.trim() || undefined,
      actionRequired: true,
    });
  };

  const getAudienceIcon = (audience: string) => {
    switch (audience) {
      case "parents":
        return <Users className="h-4 w-4" />;
      case "premium":
        return <Crown className="h-4 w-4" />;
      default:
        return <Megaphone className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "destructive";
      case "low":
        return "secondary";
      default:
        return "default";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Megaphone className="h-6 w-6 text-purple-600" />
        <h2 className="text-2xl font-bold">Notification Broadcast</h2>
      </div>

      {/* System Announcement */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5" />
            System Announcement
          </CardTitle>
          <CardDescription>
            Send announcements to all users or specific groups
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Announcement Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter announcement title"
                maxLength={100}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority Level</Label>
              <Select value={priority} onValueChange={(value: "low" | "normal" | "high") => setPriority(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low Priority</SelectItem>
                  <SelectItem value="normal">Normal Priority</SelectItem>
                  <SelectItem value="high">High Priority</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="target-audience">Target Audience</Label>
            <Select value={targetAudience} onValueChange={(value: "all" | "parents" | "premium") => setTargetAudience(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="parents">Parents Only</SelectItem>
                <SelectItem value="premium">Premium Users</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter your announcement message..."
              rows={4}
              maxLength={500}
            />
            <p className="text-sm text-gray-500">{message.length}/500 characters</p>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Preview:</span>
              {getAudienceIcon(targetAudience)}
              <Badge variant={getPriorityColor(priority)}>
                {priority.toUpperCase()}
              </Badge>
              <Badge variant="outline">
                {targetAudience === "all" ? "All Users" : 
                 targetAudience === "parents" ? "Parents" : "Premium"}
              </Badge>
            </div>
          </div>

          <Button 
            onClick={handleBroadcast}
            disabled={broadcastMutation.isPending || !title.trim() || !message.trim()}
            className="w-full"
          >
            {broadcastMutation.isPending ? (
              <>
                <Send className="mr-2 h-4 w-4 animate-pulse" />
                Sending Announcement...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Send Announcement
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Separator />

      {/* Emergency Alert */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-700">
            <AlertTriangle className="h-5 w-5" />
            Emergency Alert
          </CardTitle>
          <CardDescription className="text-red-600">
            Send critical alerts to specific users requiring immediate attention
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="emergency-user-id">User ID</Label>
              <Input
                id="emergency-user-id"
                value={emergencyUserId}
                onChange={(e) => setEmergencyUserId(e.target.value)}
                placeholder="Enter user ID"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="emergency-child-id">Child ID (Optional)</Label>
              <Input
                id="emergency-child-id"
                value={emergencyChildId}
                onChange={(e) => setEmergencyChildId(e.target.value)}
                placeholder="Enter child ID if specific to a child"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="emergency-title">Emergency Title</Label>
            <Input
              id="emergency-title"
              value={emergencyTitle}
              onChange={(e) => setEmergencyTitle(e.target.value)}
              placeholder="Enter emergency alert title"
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="emergency-message">Emergency Message</Label>
            <Textarea
              id="emergency-message"
              value={emergencyMessage}
              onChange={(e) => setEmergencyMessage(e.target.value)}
              placeholder="Enter detailed emergency message..."
              rows={3}
              maxLength={300}
            />
            <p className="text-sm text-gray-500">{emergencyMessage.length}/300 characters</p>
          </div>

          <div className="bg-red-50 p-3 rounded-lg">
            <p className="text-sm text-red-700 font-medium mb-2">⚠️ Emergency Alert Guidelines:</p>
            <ul className="text-sm text-red-600 space-y-1">
              <li>• Only use for genuine safety or security concerns</li>
              <li>• Provide clear, actionable information</li>
              <li>• Include contact information if immediate response needed</li>
              <li>• These alerts bypass notification preferences</li>
            </ul>
          </div>

          <Button 
            onClick={handleEmergencyAlert}
            disabled={emergencyMutation.isPending || !emergencyUserId.trim() || !emergencyTitle.trim() || !emergencyMessage.trim()}
            variant="destructive"
            className="w-full"
          >
            {emergencyMutation.isPending ? (
              <>
                <AlertTriangle className="mr-2 h-4 w-4 animate-pulse" />
                Sending Emergency Alert...
              </>
            ) : (
              <>
                <AlertTriangle className="mr-2 h-4 w-4" />
                Send Emergency Alert
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}