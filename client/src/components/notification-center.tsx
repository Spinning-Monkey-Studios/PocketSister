import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Bell, Settings, History, AlertTriangle, Info, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface Notification {
  id: string;
  type: "usage_alert" | "announcement" | "emergency_alert";
  title: string;
  body: string;
  data?: Record<string, any>;
  sentAt: string;
  readAt?: string;
  priority: "low" | "normal" | "high";
}

interface NotificationPreferences {
  usageAlerts: boolean;
  systemAnnouncements: boolean;
  emergencyAlerts: boolean;
}

export default function NotificationCenter() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("notifications");

  // Fetch notification history
  const { data: notifications = [], isLoading: notificationsLoading } = useQuery<Notification[]>({
    queryKey: ["/api/notifications/history"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch notification preferences
  const { data: preferences = {} as NotificationPreferences, isLoading: preferencesLoading } = useQuery<NotificationPreferences>({
    queryKey: ["/api/notifications/preferences"],
  });

  // Mark notification as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      await apiRequest("POST", `/api/notifications/mark-read/${notificationId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/history"] });
    },
  });

  // Update preferences mutation
  const updatePreferencesMutation = useMutation({
    mutationFn: async (newPreferences: Partial<NotificationPreferences>) => {
      await apiRequest("PUT", "/api/notifications/preferences", newPreferences);
    },
    onSuccess: () => {
      toast({
        title: "Preferences Updated",
        description: "Your notification preferences have been saved.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/preferences"] });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update notification preferences.",
        variant: "destructive",
      });
    },
  });

  // Test notification mutation (development only)
  const testNotificationMutation = useMutation({
    mutationFn: async (type: "usage_alert" | "emergency_alert") => {
      await apiRequest("POST", "/api/notifications/test", { type });
    },
    onSuccess: () => {
      toast({
        title: "Test Sent",
        description: "Test notification has been sent.",
      });
    },
  });

  const handleMarkAsRead = (notificationId: string) => {
    markAsReadMutation.mutate(notificationId);
  };

  const handlePreferenceChange = (key: keyof NotificationPreferences, value: boolean) => {
    updatePreferencesMutation.mutate({ [key]: value });
  };

  const getNotificationIcon = (type: string, priority: string) => {
    if (priority === "high") return <AlertTriangle className="h-4 w-4 text-red-500" />;
    
    switch (type) {
      case "usage_alert":
        return <Bell className="h-4 w-4 text-yellow-500" />;
      case "emergency_alert":
        return <Shield className="h-4 w-4 text-red-500" />;
      case "announcement":
        return <Info className="h-4 w-4 text-blue-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "destructive";
      case "normal":
        return "default";
      case "low":
        return "secondary";
      default:
        return "default";
    }
  };

  const unreadCount = notifications.filter((n) => !n.readAt).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Bell className="h-6 w-6" />
          <h2 className="text-2xl font-bold">Notification Center</h2>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="ml-2">
              {unreadCount} unread
            </Badge>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="notifications" className="flex items-center space-x-2">
            <History className="h-4 w-4" />
            <span>Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <span>Settings</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Notifications</CardTitle>
              <CardDescription>
                Your latest alerts and system announcements
              </CardDescription>
            </CardHeader>
            <CardContent>
              {notificationsLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-8">
                  <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No notifications yet</p>
                  <p className="text-sm text-gray-400">
                    You'll see usage alerts and announcements here
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-96">
                  <div className="space-y-4">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 border rounded-lg ${
                          notification.readAt ? "bg-gray-50" : "bg-white border-blue-200"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3">
                            {getNotificationIcon(notification.type, notification.priority)}
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <h4 className="font-medium">{notification.title}</h4>
                                <Badge variant={getPriorityColor(notification.priority)}>
                                  {notification.priority}
                                </Badge>
                                {!notification.readAt && (
                                  <Badge variant="outline">New</Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 mb-2">
                                {notification.body}
                              </p>
                              <p className="text-xs text-gray-400">
                                {formatDistanceToNow(new Date(notification.sentAt), {
                                  addSuffix: true,
                                })}
                              </p>
                            </div>
                          </div>
                          {!notification.readAt && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleMarkAsRead(notification.id)}
                              disabled={markAsReadMutation.isPending}
                            >
                              Mark as Read
                            </Button>
                          )}
                        </div>
                        
                        {notification.data && (
                          <div className="mt-3 pt-3 border-t">
                            <details className="text-xs text-gray-500">
                              <summary className="cursor-pointer font-medium mb-2">
                                Additional Details
                              </summary>
                              <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
                                {JSON.stringify(notification.data, null, 2)}
                              </pre>
                            </details>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Choose which notifications you want to receive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {preferencesLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
                        <div className="h-3 bg-gray-200 rounded w-48 animate-pulse"></div>
                      </div>
                      <div className="h-6 w-11 bg-gray-200 rounded-full animate-pulse"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="usage-alerts">Usage Alerts</Label>
                      <p className="text-sm text-gray-500">
                        Get notified when children approach their token limits
                      </p>
                    </div>
                    <Switch
                      id="usage-alerts"
                      checked={preferences?.usageAlerts ?? true}
                      onCheckedChange={(checked) =>
                        handlePreferenceChange("usageAlerts", checked)
                      }
                      disabled={updatePreferencesMutation.isPending}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="announcements">System Announcements</Label>
                      <p className="text-sm text-gray-500">
                        Receive updates about new features and important changes
                      </p>
                    </div>
                    <Switch
                      id="announcements"
                      checked={preferences?.systemAnnouncements ?? true}
                      onCheckedChange={(checked) =>
                        handlePreferenceChange("systemAnnouncements", checked)
                      }
                      disabled={updatePreferencesMutation.isPending}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="emergency-alerts">Emergency Alerts</Label>
                      <p className="text-sm text-gray-500">
                        Critical security and safety notifications (recommended)
                      </p>
                    </div>
                    <Switch
                      id="emergency-alerts"
                      checked={preferences?.emergencyAlerts ?? true}
                      onCheckedChange={(checked) =>
                        handlePreferenceChange("emergencyAlerts", checked)
                      }
                      disabled={updatePreferencesMutation.isPending}
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {process.env.NODE_ENV === "development" && (
            <Card>
              <CardHeader>
                <CardTitle>Test Notifications</CardTitle>
                <CardDescription>
                  Send test notifications to verify the system is working
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => testNotificationMutation.mutate("usage_alert")}
                    disabled={testNotificationMutation.isPending}
                  >
                    Test Usage Alert
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => testNotificationMutation.mutate("emergency_alert")}
                    disabled={testNotificationMutation.isPending}
                  >
                    Test Emergency Alert
                  </Button>
                </div>
                <p className="text-sm text-gray-500">
                  Note: Test notifications are only available in development mode
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}