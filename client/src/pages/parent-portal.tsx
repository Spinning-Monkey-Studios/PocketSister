import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, Bell, MessageCircle, Settings, Shield, Users } from "lucide-react";
import { useState } from "react";
import NotificationCenter from "@/components/notification-center";
import PushNotificationSetup from "@/components/push-notification-setup";

interface TokenStats {
  childId: string;
  childName: string;
  companionName: string;
  tokensUsed: number;
  monthlyLimit: number;
  lastReset: string;
}

interface UsageAlert {
  id: string;
  childId: string;
  alertType: string;
  threshold: number;
  isActive: boolean;
  lastTriggered: string | null;
}

export default function ParentPortal() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedChild, setSelectedChild] = useState<string>("");
  const [alertType, setAlertType] = useState<"warning" | "limit_reached">("warning");
  const [threshold, setThreshold] = useState<number>(80);

  // Fetch token statistics for all children
  const { data: tokenStats = [], isLoading: statsLoading } = useQuery<TokenStats[]>({
    queryKey: ["/api/parent/token-stats"],
  });

  // Create usage alert mutation
  const createAlertMutation = useMutation({
    mutationFn: async (alertData: any) => 
      apiRequest("POST", "/api/parent/usage-alert", alertData),
    onSuccess: () => {
      toast({
        title: "Alert Created",
        description: "Usage alert has been set up successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/parent/usage-alerts"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCreateAlert = () => {
    if (!selectedChild) {
      toast({
        title: "Selection Required",
        description: "Please select a child to set up alerts for.",
        variant: "destructive",
      });
      return;
    }

    createAlertMutation.mutate({
      childId: selectedChild,
      alertType,
      threshold,
      isActive: true,
    });
  };

  if (statsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-48 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="h-8 w-8 text-purple-600" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Parent Portal
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-300">
            Monitor your children's AI companion usage and set up safety alerts
          </p>
        </div>

        {/* Usage Overview Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          {tokenStats.map((stats) => {
            const usagePercentage = (stats.tokensUsed / stats.monthlyLimit) * 100;
            const isApproachingLimit = usagePercentage >= 80;
            const isOverLimit = usagePercentage >= 100;

            return (
              <Card key={stats.childId} className="bg-white dark:bg-gray-800 shadow-lg">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg text-gray-900 dark:text-white">
                      {stats.childName}
                    </CardTitle>
                    {isOverLimit ? (
                      <Badge variant="destructive">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Over Limit
                      </Badge>
                    ) : isApproachingLimit ? (
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                        <Bell className="h-3 w-3 mr-1" />
                        Warning
                      </Badge>
                    ) : (
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        Good
                      </Badge>
                    )}
                  </div>
                  <CardDescription>
                    Companion: {stats.companionName}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Tokens Used</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {stats.tokensUsed.toLocaleString()} / {stats.monthlyLimit.toLocaleString()}
                      </span>
                    </div>
                    
                    <Progress 
                      value={Math.min(usagePercentage, 100)} 
                      className="h-2"
                    />
                    
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{Math.round(usagePercentage)}% used</span>
                      <span>
                        Resets: {new Date(stats.lastReset).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <MessageCircle className="h-4 w-4" />
                      <span>
                        {(stats.monthlyLimit - stats.tokensUsed).toLocaleString()} tokens remaining
                        (≈ {Math.round((stats.monthlyLimit - stats.tokensUsed) / 300)} conversations)
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Usage Overview</TabsTrigger>
            <TabsTrigger value="alerts">Alert Setup</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Active Alerts */}
            {alerts.length > 0 && (
              <Card className="bg-white dark:bg-gray-800 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                    <AlertTriangle className="h-5 w-5" />
                    Active Alerts ({alerts.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {alerts.map((alert) => {
                      const childName = tokenStats.find(s => s.childId === alert.childId)?.childName || 'Unknown Child';
                      return (
                        <div key={alert.id} className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                          <div className="flex items-center gap-3">
                            <Bell className="h-4 w-4 text-yellow-600" />
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {childName} - {alert.alertType === 'warning' ? `${alert.threshold}% usage warning` : `${alert.threshold} message limit`}
                              </p>
                              {alert.lastTriggered && (
                                <p className="text-sm text-gray-600 dark:text-gray-300">
                                  Last triggered: {new Date(alert.lastTriggered).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          </div>
                          <Badge variant={alert.isActive ? "default" : "secondary"}>
                            {alert.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="alerts" className="space-y-6">
            {/* Alert Setup Section */}
            <Card className="bg-white dark:bg-gray-800 shadow-lg">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-purple-600" />
                  <CardTitle>Set Up Usage Alerts</CardTitle>
                </div>
                <CardDescription>
                  Get push notifications when your child approaches their token usage limit
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div className="space-y-2">
                    <Label htmlFor="child-select">Select Child</Label>
                    <Select value={selectedChild} onValueChange={setSelectedChild}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a child" />
                      </SelectTrigger>
                      <SelectContent>
                        {tokenStats.map((stats) => (
                          <SelectItem key={stats.childId} value={stats.childId}>
                            {stats.childName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="alert-type">Alert Type</Label>
                    <Select value={alertType} onValueChange={(value: "warning" | "limit_reached") => setAlertType(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="warning">Warning Alert</SelectItem>
                        <SelectItem value="limit_reached">Limit Reached</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="threshold">
                      {alertType === "warning" ? "Warning at %" : "Limit Messages"}
                    </Label>
                    <Input
                      id="threshold"
                      type="number"
                      value={threshold}
                      onChange={(e) => setThreshold(Number(e.target.value))}
                      min={alertType === "warning" ? 1 : 1}
                      max={alertType === "warning" ? 100 : 1000}
                    />
                  </div>

                  <div className="flex items-end">
                    <Button 
                      onClick={handleCreateAlert}
                      disabled={createAlertMutation.isPending || !selectedChild}
                      className="w-full bg-purple-600 hover:bg-purple-700"
                    >
                      {createAlertMutation.isPending ? "Creating..." : "Create Alert"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <PushNotificationSetup />
            <NotificationCenter />
          </TabsContent>
        </Tabs>

        {/* Safety Tips */}
        <Card className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-blue-900 dark:text-blue-100">
                Parental Guidance Tips
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
              <li>• Set reasonable message limits based on your child's age and needs</li>
              <li>• Regular conversations with your child about their AI companion interactions</li>
              <li>• Monitor usage patterns to understand engagement levels</li>
              <li>• Use alerts to maintain healthy digital boundaries</li>
              <li>• Encourage breaks and offline activities when limits are reached</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}