import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { 
  Clock, 
  Smartphone, 
  BarChart3, 
  Shield, 
  Coffee, 
  Settings,
  AlertTriangle,
  CheckCircle,
  Plus,
  Pause,
  Play,
  Timer
} from 'lucide-react';

interface UsageData {
  totalMinutesToday: number;
  sessionCount: number;
  lastActivity: string;
  activeSession: any;
}

interface UsageLimits {
  dailyLimits: {
    totalScreenTime: number;
    chatTime: number;
    avatarCustomization: number;
    voiceFeatures: number;
    imageSharing: number;
  };
  weeklyLimits: {
    totalScreenTime: number;
    weekendBonus: number;
  };
  timeWindows: {
    allowedHours: { start: string; end: string }[];
    schoolDayRestrictions: { start: string; end: string }[];
    bedtimeRestrictions: { start: string; end: string }[];
  };
  featureRestrictions: {
    voiceChat: boolean;
    imageSharing: boolean;
    webBrowsing: boolean;
    advancedFeatures: boolean;
  };
  breakReminders: {
    enabled: boolean;
    intervalMinutes: number;
    message: string;
  };
  enforcementSettings: {
    gracePeriodMinutes: number;
    allowEmergencyOverride: boolean;
    weekendDifferent: boolean;
  };
}

interface AppUsageControlsProps {
  childId: string;
  childName: string;
}

export function AppUsageControls({ childId, childName }: AppUsageControlsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showOverride, setShowOverride] = useState(false);
  const [overrideData, setOverrideData] = useState({ minutes: '15', reason: '' });
  const [limits, setLimits] = useState<UsageLimits>({
    dailyLimits: {
      totalScreenTime: 120, // 2 hours default
      chatTime: 60,
      avatarCustomization: 30,
      voiceFeatures: 45,
      imageSharing: 15
    },
    weeklyLimits: {
      totalScreenTime: 840, // 14 hours default
      weekendBonus: 60
    },
    timeWindows: {
      allowedHours: [{ start: '07:00', end: '21:00' }],
      schoolDayRestrictions: [{ start: '08:00', end: '15:30' }],
      bedtimeRestrictions: [{ start: '21:00', end: '07:00' }]
    },
    featureRestrictions: {
      voiceChat: false,
      imageSharing: false,
      webBrowsing: true,
      advancedFeatures: false
    },
    breakReminders: {
      enabled: true,
      intervalMinutes: 30,
      message: "Time for a quick break! Look away from the screen and stretch."
    },
    enforcementSettings: {
      gracePeriodMinutes: 5,
      allowEmergencyOverride: true,
      weekendDifferent: true
    }
  });

  // Fetch current usage
  const { data: currentUsage, isLoading: usageLoading } = useQuery<UsageData>({
    queryKey: [`/api/enhanced-parent/child/${childId}/usage/current`],
    refetchInterval: 60000, // Refresh every minute
  });

  // Fetch usage limits
  const { data: savedLimits, isLoading: limitsLoading } = useQuery<UsageLimits>({
    queryKey: [`/api/enhanced-parent/child/${childId}/usage/limits`],
    onSuccess: (data) => {
      if (data) setLimits(data);
    }
  });

  // Fetch usage analytics
  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: [`/api/enhanced-parent/child/${childId}/usage/analytics`],
  });

  // Update usage limits mutation
  const updateLimitsMutation = useMutation({
    mutationFn: async (newLimits: UsageLimits) => {
      await apiRequest('POST', `/api/enhanced-parent/child/${childId}/usage/limits`, newLimits);
    },
    onSuccess: () => {
      toast({
        title: 'Usage Limits Updated',
        description: 'New usage controls are now active.',
      });
      queryClient.invalidateQueries([`/api/enhanced-parent/child/${childId}/usage/limits`]);
    },
    onError: () => {
      toast({
        title: 'Failed to Update',
        description: 'Could not update usage limits. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Emergency override mutation
  const overrideMutation = useMutation({
    mutationFn: async (data: { overrideMinutes: string; reason: string }) => {
      await apiRequest('POST', `/api/enhanced-parent/child/${childId}/usage/override`, {
        overrideMinutes: data.overrideMinutes,
        reason: data.reason
      });
    },
    onSuccess: () => {
      toast({
        title: 'Override Granted',
        description: `Granted ${overrideData.minutes} additional minutes.`,
      });
      setShowOverride(false);
      setOverrideData({ minutes: '15', reason: '' });
      queryClient.invalidateQueries([`/api/enhanced-parent/child/${childId}/usage/current`]);
    },
    onError: () => {
      toast({
        title: 'Override Failed',
        description: 'Could not grant additional time. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const calculateUsagePercentage = (used: number, limit: number) => {
    return Math.min((used / limit) * 100, 100);
  };

  const getUsageStatusColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 75) return 'text-orange-600';
    if (percentage >= 50) return 'text-yellow-600';
    return 'text-green-600';
  };

  const formatMinutes = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  return (
    <div className="space-y-6" data-testid="app-usage-controls">
      {/* Current Usage Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Current Usage - {childName}
            </CardTitle>
            <Dialog open={showOverride} onOpenChange={setShowOverride}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" data-testid="button-emergency-override">
                  <Plus className="h-4 w-4 mr-2" />
                  Emergency Override
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Grant Additional Time</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="override-minutes">Additional Minutes</Label>
                    <Input
                      id="override-minutes"
                      value={overrideData.minutes}
                      onChange={(e) => setOverrideData({ ...overrideData, minutes: e.target.value })}
                      placeholder="15"
                      data-testid="input-override-minutes"
                    />
                  </div>
                  <div>
                    <Label htmlFor="override-reason">Reason</Label>
                    <Input
                      id="override-reason"
                      value={overrideData.reason}
                      onChange={(e) => setOverrideData({ ...overrideData, reason: e.target.value })}
                      placeholder="e.g., Emergency contact, homework help"
                      data-testid="input-override-reason"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setShowOverride(false)}
                      data-testid="button-cancel-override"
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={() => overrideMutation.mutate(overrideData)}
                      disabled={overrideMutation.isPending || !overrideData.reason}
                      data-testid="button-grant-override"
                    >
                      {overrideMutation.isPending ? 'Granting...' : 'Grant Time'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {usageLoading ? (
            <div className="animate-pulse">
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          ) : currentUsage ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {formatMinutes(currentUsage.totalMinutesToday)}
                  </div>
                  <div className="text-sm text-gray-600">Today's Usage</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {formatMinutes(limits.dailyLimits.totalScreenTime - currentUsage.totalMinutesToday)}
                  </div>
                  <div className="text-sm text-gray-600">Time Remaining</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {currentUsage.sessionCount}
                  </div>
                  <div className="text-sm text-gray-600">Sessions Today</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Daily Progress</span>
                  <span className={`text-sm ${getUsageStatusColor(calculateUsagePercentage(currentUsage.totalMinutesToday, limits.dailyLimits.totalScreenTime))}`}>
                    {Math.round(calculateUsagePercentage(currentUsage.totalMinutesToday, limits.dailyLimits.totalScreenTime))}%
                  </span>
                </div>
                <Progress 
                  value={calculateUsagePercentage(currentUsage.totalMinutesToday, limits.dailyLimits.totalScreenTime)}
                  className="h-2"
                />
              </div>

              {currentUsage.activeSession && (
                <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-800">Currently active session</span>
                  <Badge variant="outline" className="ml-auto">Online</Badge>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Smartphone className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No usage data available</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Usage Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Usage Limits & Controls
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="limits" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="limits">Daily Limits</TabsTrigger>
              <TabsTrigger value="schedule">Schedule</TabsTrigger>
              <TabsTrigger value="features">Features</TabsTrigger>
              <TabsTrigger value="breaks">Break Reminders</TabsTrigger>
            </TabsList>

            <TabsContent value="limits" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="total-screen-time">Total Screen Time (minutes)</Label>
                  <Input
                    id="total-screen-time"
                    type="number"
                    value={limits.dailyLimits.totalScreenTime}
                    onChange={(e) => setLimits({
                      ...limits,
                      dailyLimits: { ...limits.dailyLimits, totalScreenTime: parseInt(e.target.value) }
                    })}
                    data-testid="input-total-screen-time"
                  />
                </div>
                <div>
                  <Label htmlFor="chat-time">Chat Time (minutes)</Label>
                  <Input
                    id="chat-time"
                    type="number"
                    value={limits.dailyLimits.chatTime}
                    onChange={(e) => setLimits({
                      ...limits,
                      dailyLimits: { ...limits.dailyLimits, chatTime: parseInt(e.target.value) }
                    })}
                    data-testid="input-chat-time"
                  />
                </div>
                <div>
                  <Label htmlFor="avatar-time">Avatar Customization (minutes)</Label>
                  <Input
                    id="avatar-time"
                    type="number"
                    value={limits.dailyLimits.avatarCustomization}
                    onChange={(e) => setLimits({
                      ...limits,
                      dailyLimits: { ...limits.dailyLimits, avatarCustomization: parseInt(e.target.value) }
                    })}
                    data-testid="input-avatar-time"
                  />
                </div>
                <div>
                  <Label htmlFor="voice-time">Voice Features (minutes)</Label>
                  <Input
                    id="voice-time"
                    type="number"
                    value={limits.dailyLimits.voiceFeatures}
                    onChange={(e) => setLimits({
                      ...limits,
                      dailyLimits: { ...limits.dailyLimits, voiceFeatures: parseInt(e.target.value) }
                    })}
                    data-testid="input-voice-time"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="schedule" className="space-y-4">
              <div>
                <Label>Allowed Hours</Label>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div>
                    <Label htmlFor="allowed-start">Start Time</Label>
                    <Input
                      id="allowed-start"
                      type="time"
                      value={limits.timeWindows.allowedHours[0]?.start || '07:00'}
                      onChange={(e) => {
                        const newWindows = { ...limits.timeWindows };
                        if (newWindows.allowedHours[0]) {
                          newWindows.allowedHours[0].start = e.target.value;
                        } else {
                          newWindows.allowedHours = [{ start: e.target.value, end: '21:00' }];
                        }
                        setLimits({ ...limits, timeWindows: newWindows });
                      }}
                      data-testid="input-allowed-start"
                    />
                  </div>
                  <div>
                    <Label htmlFor="allowed-end">End Time</Label>
                    <Input
                      id="allowed-end"
                      type="time"
                      value={limits.timeWindows.allowedHours[0]?.end || '21:00'}
                      onChange={(e) => {
                        const newWindows = { ...limits.timeWindows };
                        if (newWindows.allowedHours[0]) {
                          newWindows.allowedHours[0].end = e.target.value;
                        } else {
                          newWindows.allowedHours = [{ start: '07:00', end: e.target.value }];
                        }
                        setLimits({ ...limits, timeWindows: newWindows });
                      }}
                      data-testid="input-allowed-end"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="features" className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="voice-chat">Voice Chat</Label>
                    <p className="text-sm text-gray-500">Allow voice conversations with AI</p>
                  </div>
                  <Switch
                    id="voice-chat"
                    checked={!limits.featureRestrictions.voiceChat}
                    onCheckedChange={(checked) => setLimits({
                      ...limits,
                      featureRestrictions: { ...limits.featureRestrictions, voiceChat: !checked }
                    })}
                    data-testid="switch-voice-chat"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="image-sharing">Image Sharing</Label>
                    <p className="text-sm text-gray-500">Allow uploading and sharing images</p>
                  </div>
                  <Switch
                    id="image-sharing"
                    checked={!limits.featureRestrictions.imageSharing}
                    onCheckedChange={(checked) => setLimits({
                      ...limits,
                      featureRestrictions: { ...limits.featureRestrictions, imageSharing: !checked }
                    })}
                    data-testid="switch-image-sharing"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="web-browsing">Web Browsing</Label>
                    <p className="text-sm text-gray-500">Allow web content requests</p>
                  </div>
                  <Switch
                    id="web-browsing"
                    checked={!limits.featureRestrictions.webBrowsing}
                    onCheckedChange={(checked) => setLimits({
                      ...limits,
                      featureRestrictions: { ...limits.featureRestrictions, webBrowsing: !checked }
                    })}
                    data-testid="switch-web-browsing"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="breaks" className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="break-reminders">Enable Break Reminders</Label>
                    <p className="text-sm text-gray-500">Remind child to take regular breaks</p>
                  </div>
                  <Switch
                    id="break-reminders"
                    checked={limits.breakReminders.enabled}
                    onCheckedChange={(checked) => setLimits({
                      ...limits,
                      breakReminders: { ...limits.breakReminders, enabled: checked }
                    })}
                    data-testid="switch-break-reminders"
                  />
                </div>
                {limits.breakReminders.enabled && (
                  <>
                    <div>
                      <Label htmlFor="break-interval">Break Interval (minutes)</Label>
                      <Input
                        id="break-interval"
                        type="number"
                        value={limits.breakReminders.intervalMinutes}
                        onChange={(e) => setLimits({
                          ...limits,
                          breakReminders: { ...limits.breakReminders, intervalMinutes: parseInt(e.target.value) }
                        })}
                        data-testid="input-break-interval"
                      />
                    </div>
                    <div>
                      <Label htmlFor="break-message">Break Message</Label>
                      <Input
                        id="break-message"
                        value={limits.breakReminders.message}
                        onChange={(e) => setLimits({
                          ...limits,
                          breakReminders: { ...limits.breakReminders, message: e.target.value }
                        })}
                        data-testid="input-break-message"
                      />
                    </div>
                  </>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end mt-6">
            <Button 
              onClick={() => updateLimitsMutation.mutate(limits)}
              disabled={updateLimitsMutation.isPending}
              data-testid="button-save-limits"
            >
              {updateLimitsMutation.isPending ? 'Saving...' : 'Save Limits'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Usage Analytics */}
      {analytics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Usage Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-lg font-bold text-blue-600">
                  {formatMinutes(analytics.analytics?.weeklySummary?.total_minutes || 0)}
                </div>
                <div className="text-sm text-gray-600">Weekly Total</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-lg font-bold text-green-600">
                  {analytics.analytics?.weeklySummary?.total_sessions || 0}
                </div>
                <div className="text-sm text-gray-600">Total Sessions</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-lg font-bold text-purple-600">
                  {Math.round((analytics.analytics?.weeklySummary?.avg_quality || 0) * 100)}%
                </div>
                <div className="text-sm text-gray-600">Quality Score</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}