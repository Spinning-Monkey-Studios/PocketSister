import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useAuth } from "@/hooks/useAuth";
import { 
  MessageSquare, 
  MapPin, 
  Smartphone, 
  Shield, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Send,
  Settings,
  Heart
} from "lucide-react";

interface ParentMessage {
  id: string;
  message: string;
  messageType: string;
  scheduledFor?: string;
  sentAt?: string;
  deliveredAt?: string;
  readAt?: string;
  isRead: boolean;
  isDelivered: boolean;
  priority: string;
  createdAt: string;
  childName: string;
}

interface ChildDevice {
  id: string;
  deviceId: string;
  deviceName?: string;
  platform: string;
  appVersion?: string;
  isActivated: boolean;
  activatedAt?: string;
  lastSeenAt: string;
}

interface ChildLocation {
  id: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: string;
  isEmergency: boolean;
  batteryLevel?: number;
}

interface ActivationRequest {
  id: string;
  childId: string;
  childName: string;
  deviceId: string;
  deviceInfo: any;
  requestedAt: string;
  status: string;
}

interface LocationSettings {
  isLocationEnabled: boolean;
  trackingInterval: number;
  shareLocationWithParent: boolean;
  onlyEmergencyTracking: boolean;
  allowedTimeStart: string;
  allowedTimeEnd: string;
  geofenceEnabled: boolean;
  geofenceRadius: number;
}

export default function ParentDashboard() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [selectedChildId, setSelectedChildId] = useState<string>("");
  const [newMessage, setNewMessage] = useState({
    message: "",
    messageType: "general",
    priority: "normal"
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  // Fetch child profiles
  const { data: children = [], isLoading: childrenLoading } = useQuery<any[]>({
    queryKey: ["/api/child-profiles"],
    retry: false,
  });

  // Fetch sent messages
  const { data: sentMessages = [], isLoading: messagesLoading } = useQuery<ParentMessage[]>({
    queryKey: ["/api/parent-messaging/sent-messages"],
    retry: false,
  });

  // Fetch activation requests
  const { data: activationRequests = [], isLoading: requestsLoading } = useQuery<ActivationRequest[]>({
    queryKey: ["/api/parent-messaging/activation-requests"],
    retry: false,
  });

  // Fetch child locations
  const { data: childLocations = [], isLoading: locationsLoading } = useQuery<ChildLocation[]>({
    queryKey: ["/api/parent-messaging/location", selectedChildId],
    enabled: !!selectedChildId,
    retry: false,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: any) => {
      await apiRequest("/api/parent-messaging/send-message", "POST", messageData);
    },
    onSuccess: () => {
      toast({
        title: "Message Sent",
        description: "Your message has been sent to your child.",
      });
      setNewMessage({ message: "", messageType: "general", priority: "normal" });
      queryClient.invalidateQueries({ queryKey: ["/api/parent-messaging/sent-messages"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Approve/reject activation mutation
  const activationMutation = useMutation({
    mutationFn: async ({ requestId, action }: { requestId: string; action: string }) => {
      await apiRequest(`/api/parent-messaging/activation-request/${requestId}`, "PATCH", { action });
    },
    onSuccess: () => {
      toast({
        title: "Request Processed",
        description: "The activation request has been processed.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/parent-messaging/activation-requests"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to process activation request.",
        variant: "destructive",
      });
    },
  });

  // Update location settings mutation
  const locationSettingsMutation = useMutation({
    mutationFn: async ({ childId, settings }: { childId: string; settings: Partial<LocationSettings> }) => {
      await apiRequest(`/api/parent-messaging/location-settings/${childId}`, "PUT", settings);
    },
    onSuccess: () => {
      toast({
        title: "Settings Updated",
        description: "Location settings have been updated.",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update location settings.",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = () => {
    if (!selectedChildId || !newMessage.message.trim()) {
      toast({
        title: "Error",
        description: "Please select a child and enter a message.",
        variant: "destructive",
      });
      return;
    }

    sendMessageMutation.mutate({
      childId: selectedChildId,
      ...newMessage,
    });
  };

  const handleActivationRequest = (requestId: string, action: "approve" | "reject") => {
    activationMutation.mutate({ requestId, action });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "destructive";
      case "high": return "destructive";
      case "normal": return "default";
      case "low": return "secondary";
      default: return "default";
    }
  };

  const getMessageTypeIcon = (type: string) => {
    switch (type) {
      case "encouragement": return <Heart className="h-4 w-4" />;
      case "reminder": return <Clock className="h-4 w-4" />;
      case "achievement": return <CheckCircle className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  if (isLoading || !isAuthenticated) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Parent Dashboard</h1>
        <Badge variant="outline">
          {children.length} Child{children.length !== 1 ? "ren" : ""} Connected
        </Badge>
      </div>

      <Tabs defaultValue="messages" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="messages">Messages</TabsTrigger>
          <TabsTrigger value="location">Location</TabsTrigger>
          <TabsTrigger value="devices">Devices</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Messages Tab */}
        <TabsContent value="messages" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                Send Message to Child
              </CardTitle>
              <CardDescription>
                Send messages, encouragement, or reminders to your child's app
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="child-select">Select Child</Label>
                  <Select value={selectedChildId} onValueChange={setSelectedChildId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a child..." />
                    </SelectTrigger>
                    <SelectContent>
                      {children.map((child: any) => (
                        <SelectItem key={child.id} value={child.id}>
                          {child.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message-type">Message Type</Label>
                  <Select 
                    value={newMessage.messageType} 
                    onValueChange={(value) => setNewMessage(prev => ({ ...prev, messageType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General Message</SelectItem>
                      <SelectItem value="encouragement">Encouragement</SelectItem>
                      <SelectItem value="reminder">Reminder</SelectItem>
                      <SelectItem value="achievement">Achievement</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  placeholder="Type your message here..."
                  value={newMessage.message}
                  onChange={(e) => setNewMessage(prev => ({ ...prev, message: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="flex items-center justify-between">
                <Select 
                  value={newMessage.priority} 
                  onValueChange={(value) => setNewMessage(prev => ({ ...prev, priority: value }))}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>

                <Button 
                  onClick={handleSendMessage}
                  disabled={sendMessageMutation.isPending || !selectedChildId || !newMessage.message.trim()}
                >
                  {sendMessageMutation.isPending ? "Sending..." : "Send Message"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Sent Messages */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Messages</CardTitle>
              <CardDescription>Messages you've sent to your children</CardDescription>
            </CardHeader>
            <CardContent>
              {messagesLoading ? (
                <div>Loading messages...</div>
              ) : sentMessages.length === 0 ? (
                <div className="text-center text-gray-500 py-4">
                  No messages sent yet
                </div>
              ) : (
                <div className="space-y-3">
                  {sentMessages.map((message: ParentMessage) => (
                    <div key={message.id} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getMessageTypeIcon(message.messageType)}
                          <span className="font-medium">{message.childName}</span>
                          <Badge variant={getPriorityColor(message.priority)}>
                            {message.priority}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          {message.isRead ? (
                            <Badge variant="default">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Read
                            </Badge>
                          ) : message.isDelivered ? (
                            <Badge variant="secondary">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Delivered
                            </Badge>
                          ) : (
                            <Badge variant="outline">
                              <Clock className="h-3 w-3 mr-1" />
                              Pending
                            </Badge>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">{message.message}</p>
                      <p className="text-xs text-gray-400">
                        Sent: {formatDateTime(message.createdAt)}
                        {message.readAt && ` • Read: ${formatDateTime(message.readAt)}`}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Location Tab */}
        <TabsContent value="location" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Child Location Tracking
              </CardTitle>
              <CardDescription>
                Monitor your child's location for safety (requires their permission)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="location-child-select">Select Child</Label>
                <Select value={selectedChildId} onValueChange={setSelectedChildId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a child..." />
                  </SelectTrigger>
                  <SelectContent>
                    {children.map((child: any) => (
                      <SelectItem key={child.id} value={child.id}>
                        {child.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedChildId && (
                <div className="space-y-4">
                  {locationsLoading ? (
                    <div>Loading location data...</div>
                  ) : childLocations.length === 0 ? (
                    <div className="text-center text-gray-500 py-4">
                      No recent location data available
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <h4 className="font-medium">Recent Locations (Last 24 hours)</h4>
                      {childLocations.slice(0, 5).map((location: ChildLocation) => (
                        <div key={location.id} className="border rounded-lg p-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              <span className="font-medium">
                                {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                              </span>
                              {location.isEmergency && (
                                <Badge variant="destructive">
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  Emergency
                                </Badge>
                              )}
                            </div>
                            {location.batteryLevel && (
                              <span className="text-sm text-gray-500">
                                Battery: {location.batteryLevel}%
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-600">
                            Accuracy: ±{location.accuracy}m • {formatDateTime(location.timestamp)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Devices Tab */}
        <TabsContent value="devices" className="space-y-4">
          {/* Activation Requests */}
          {activationRequests.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  Pending Device Activation Requests
                </CardTitle>
                <CardDescription>
                  Your children are requesting to activate their devices
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {activationRequests.map((request: ActivationRequest) => (
                    <div key={request.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{request.childName}</h4>
                          <p className="text-sm text-gray-600">
                            Device: {request.deviceInfo?.deviceName || "Unknown"} 
                            ({request.deviceInfo?.platform || "Unknown"})
                          </p>
                          <p className="text-xs text-gray-400">
                            Requested: {formatDateTime(request.requestedAt)}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleActivationRequest(request.id, "reject")}
                            disabled={activationMutation.isPending}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleActivationRequest(request.id, "approve")}
                            disabled={activationMutation.isPending}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                Activated Devices
              </CardTitle>
              <CardDescription>
                Devices that have been approved and are currently active
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center text-gray-500 py-4">
                Device management features coming soon...
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Privacy & Safety Settings
              </CardTitle>
              <CardDescription>
                Configure location tracking and safety features for your children
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center text-gray-500 py-4">
                Location and safety settings coming soon...
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}