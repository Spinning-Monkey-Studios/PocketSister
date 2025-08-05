import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Shield, AlertTriangle, Settings, User, Clock, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface ChildProfile {
  id: string;
  name: string;
  age: number;
  status: string;
  subscriptionTier: string;
}

interface SafetyAlert {
  id: string;
  childId: string;
  alertType: string;
  priority: string;
  status: string;
  contextSummary: string;
  parentNotified: boolean;
  createdAt: string;
  resolvedAt?: string;
  reviewNotes?: string;
}

interface ParentControls {
  id?: string;
  childId: string;
  parentId: string;
  ageOverride?: number;
  personalitySettings: Record<string, any>;
  monitoringLevel: string;
  alertSettings: Record<string, boolean>;
  privacyMode: boolean;
  aiPrompts?: {
    systemPrompt?: string;
    behaviorGuidelines?: string;
    responseStyle?: string;
    topicRestrictions?: string[];
  };
  monitoringSettings?: {
    level: string;
    keywordMonitoring: boolean;
    sentimentAnalysis: boolean;
    contextualAnalysis: boolean;
    realTimeAlerts: boolean;
  };
  alertThresholds?: {
    critical: boolean;
    high: boolean;
    medium: boolean;
    low: boolean;
    confidenceMinimum: number;
  };
  safetyMonitoringEnabled?: boolean;
}

export default function ParentPortal() {
  const [selectedChild, setSelectedChild] = useState<string>('');
  const [activeTab, setActiveTab] = useState('overview');
  const [parentControls, setParentControls] = useState<ParentControls | null>(null);
  const [safetyMonitoringStatus, setSafetyMonitoringStatus] = useState<any>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch child profiles
  const { data: children = [], isLoading: childrenLoading } = useQuery<ChildProfile[]>({
    queryKey: ['/api/child-profiles'],
  });

  // Fetch parent controls for selected child
  const { data: parentControlsData, isLoading: controlsLoading } = useQuery<ParentControls>({
    queryKey: ['/api/parent/controls', selectedChild],
    enabled: !!selectedChild,
  });

  // Update local state when remote data changes
  useEffect(() => {
    if (parentControlsData) {
      setParentControls(parentControlsData);
    }
  }, [parentControlsData]);

  // Fetch safety alerts
  const { data: safetyAlerts = [], isLoading: alertsLoading } = useQuery<SafetyAlert[]>({
    queryKey: ['/api/parent/safety-alerts'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch safety monitoring status for selected child
  const { data: safetyStatus, isLoading: statusLoading } = useQuery({
    queryKey: ['/api/safety-monitoring/status', selectedChild],
    enabled: !!selectedChild,
  });

  // Update safety monitoring status
  useEffect(() => {
    if (safetyStatus) {
      setSafetyMonitoringStatus(safetyStatus);
    }
  }, [safetyStatus]);

  // Update child age mutation
  const updateAgeMutation = useMutation({
    mutationFn: (data: { childId: string; age: number }) =>
      apiRequest(`/api/parent/child/${data.childId}/age`, 'PUT', { age: data.age }),
    onSuccess: () => {
      toast({
        title: 'Age Updated',
        description: 'Child age has been successfully updated.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/child-profiles'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Update Failed',
        description: error.message || 'Failed to update age.',
        variant: 'destructive',
      });
    },
  });

  // Update personality mutation
  const updatePersonalityMutation = useMutation({
    mutationFn: (data: any) =>
      apiRequest(`/api/parent/child/${data.childId}/personality`, 'PUT', data),
    onSuccess: () => {
      toast({
        title: 'Personality Updated',
        description: 'AI companion personality has been successfully updated.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/parent/controls', selectedChild] });
    },
    onError: (error: any) => {
      toast({
        title: 'Update Failed',
        description: error.message || 'Failed to update personality.',
        variant: 'destructive',
      });
    },
  });

  // Resolve safety alert mutation
  const resolveAlertMutation = useMutation({
    mutationFn: (data: { alertId: string; reviewNotes: string }) =>
      apiRequest(`/api/parent/safety-alert/${data.alertId}/resolve`, 'PUT', { reviewNotes: data.reviewNotes }),
    onSuccess: () => {
      toast({
        title: 'Alert Resolved',
        description: 'Safety alert has been successfully resolved.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/parent/safety-alerts'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Resolution Failed',
        description: error.message || 'Failed to resolve alert.',
        variant: 'destructive',
      });
    },
  });

  // Purchase safety monitoring add-on mutation
  const purchaseSafetyMonitoringMutation = useMutation({
    mutationFn: (childId: string) =>
      apiRequest(`/api/safety-monitoring/purchase`, 'POST', { childId }),
    onSuccess: () => {
      toast({
        title: "Safety Monitoring Purchased",
        description: "AI safety monitoring is now active for your child.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/safety-monitoring/status', selectedChild] });
      queryClient.invalidateQueries({ queryKey: ['/api/parent/controls', selectedChild] });
    },
    onError: (error: any) => {
      toast({
        title: "Purchase Failed",
        description: error.message || "Failed to purchase safety monitoring. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Disable safety monitoring mutation
  const disableSafetyMonitoringMutation = useMutation({
    mutationFn: (childId: string) =>
      apiRequest(`/api/safety-monitoring/disable/${childId}`, 'POST'),
    onSuccess: () => {
      toast({
        title: "Safety Monitoring Disabled",
        description: "AI safety monitoring has been disabled for your child.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/safety-monitoring/status', selectedChild] });
      queryClient.invalidateQueries({ queryKey: ['/api/parent/controls', selectedChild] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to disable safety monitoring. Please try again.",
        variant: "destructive",
      });
    },
  });

  const selectedChildData = children.find(child => child.id === selectedChild);
  const activeAlerts = safetyAlerts.filter(alert => alert.status === 'active');
  const resolvedAlerts = safetyAlerts.filter(alert => alert.status === 'resolved');

  const handleAgeUpdate = (newAge: number) => {
    if (selectedChild && newAge >= 8 && newAge <= 16) {
      updateAgeMutation.mutate({ childId: selectedChild, age: newAge });
    }
  };

  const handlePersonalityUpdate = (settings: Record<string, any>) => {
    if (selectedChild) {
      updatePersonalityMutation.mutate({ childId: selectedChild, personalitySettings: settings });
    }
  };

  const handleResolveAlert = (alertId: string, reviewNotes: string) => {
    resolveAlertMutation.mutate({ alertId, reviewNotes });
  };

  // Purchase safety monitoring handler
  const handlePurchaseSafetyMonitoring = async () => {
    if (!selectedChild) return;
    
    setIsPurchasing(true);
    try {
      await purchaseSafetyMonitoringMutation.mutateAsync(selectedChild);
    } finally {
      setIsPurchasing(false);
    }
  };

  // Disable safety monitoring handler
  const handleDisableSafetyMonitoring = async () => {
    if (!selectedChild) return;
    
    await disableSafetyMonitoringMutation.mutateAsync(selectedChild);
  };

  const handlePromptUpdate = (field: string, value: any) => {
    setParentControls(prev => prev ? {
      ...prev,
      aiPrompts: {
        ...prev.aiPrompts,
        [field]: value
      }
    } : null);
  };

  const handleMonitoringUpdate = (field: string, value: any) => {
    setParentControls(prev => prev ? {
      ...prev,
      monitoringSettings: {
        level: 'standard',
        keywordMonitoring: false,
        sentimentAnalysis: false,
        contextualAnalysis: false,
        realTimeAlerts: false,
        ...prev.monitoringSettings,
        [field]: value
      }
    } : null);
  };

  const handleAlertThresholdUpdate = (field: string, value: any) => {
    setParentControls(prev => prev ? {
      ...prev,
      alertThresholds: {
        critical: false,
        high: false,
        medium: false,
        low: false,
        confidenceMinimum: 0.8,
        ...prev.alertThresholds,
        [field]: value
      }
    } : null);
  };

  const getMonitoringDescription = (level: string) => {
    switch (level) {
      case 'minimal':
        return 'Only monitors for immediate safety risks and emergency situations.';
      case 'standard':
        return 'Balanced monitoring with privacy protection - analyzes patterns without exposing content.';
      case 'enhanced':
        return 'Detailed behavioral analysis while maintaining conversation privacy.';
      case 'comprehensive':
        return 'Full conversation analysis for maximum safety with transparent reporting.';
      default:
        return 'Balanced monitoring with privacy protection.';
    }
  };

  const saveAIPrompts = async () => {
    if (!selectedChild || !parentControls) return;
    
    try {
      await updatePersonalityMutation.mutateAsync({
        childId: selectedChild,
        personalitySettings: parentControls.personalitySettings,
        aiPrompts: parentControls.aiPrompts,
        monitoringLevel: parentControls.monitoringLevel,
        alertSettings: parentControls.alertSettings,
        privacyMode: parentControls.privacyMode,
        ageOverride: parentControls.ageOverride
      });
      
      toast({
        title: "AI Prompts Updated",
        description: "The AI companion will use these new guidelines for all interactions.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save AI prompt settings. Please try again.",
        variant: "destructive",
      });
    }
  };

  const saveMonitoringSettings = async () => {
    if (!selectedChild || !parentControls) return;
    
    try {
      await updatePersonalityMutation.mutateAsync({
        childId: selectedChild,
        personalitySettings: parentControls.personalitySettings,
        aiPrompts: parentControls.aiPrompts,
        monitoringSettings: parentControls.monitoringSettings,
        monitoringLevel: parentControls.monitoringSettings?.level || 'standard',
        alertSettings: parentControls.alertSettings,
        privacyMode: parentControls.privacyMode,
        ageOverride: parentControls.ageOverride
      });
      
      toast({
        title: "Monitoring Settings Updated",
        description: "Your monitoring preferences have been saved and will take effect immediately.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save monitoring settings. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  const getAlertTypeIcon = (alertType: string) => {
    switch (alertType) {
      case 'self_harm_concern':
      case 'safety_concern':
        return <AlertTriangle className="h-4 w-4" />;
      case 'bullying_detected':
        return <Shield className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  if (childrenLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading your children's profiles...</p>
        </div>
      </div>
    );
  }

  if (children.length === 0) {
    return (
      <div className="text-center py-12">
        <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Child Profiles Found</h3>
        <p className="text-gray-600 mb-4">Create a child profile to access parental controls.</p>
        <Button>Create Child Profile</Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Parent Portal</h1>
          <p className="text-gray-600 mt-1">Manage your child's AI companion experience safely and privately</p>
        </div>
        <div className="flex items-center space-x-2">
          <Shield className="h-5 w-5 text-green-600" />
          <span className="text-sm text-green-600 font-medium">Privacy Protected</span>
        </div>
      </div>

      {/* Child Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>Select Child</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedChild} onValueChange={setSelectedChild}>
            <SelectTrigger className="w-full max-w-md">
              <SelectValue placeholder="Choose a child to manage" />
            </SelectTrigger>
            <SelectContent>
              {children.map((child) => (
                <SelectItem key={child.id} value={child.id}>
                  {child.name} (Age {child.age}) - {child.subscriptionTier}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Safety Alerts Overview */}
      {activeAlerts.length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            You have {activeAlerts.length} active safety alert{activeAlerts.length !== 1 ? 's' : ''} requiring attention.
          </AlertDescription>
        </Alert>
      )}

      {selectedChild && (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="controls">Age & Personality</TabsTrigger>
            <TabsTrigger value="ai-prompts">AI Prompts</TabsTrigger>
            <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
            <TabsTrigger value="safety">Safety Alerts</TabsTrigger>
            <TabsTrigger value="privacy">Privacy Settings</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Current Age</CardTitle>
                  <User className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{selectedChildData?.age} years</div>
                  <p className="text-xs text-muted-foreground">
                    AI companion adapts content to age
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Safety Status</CardTitle>
                  <Shield className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">Protected</div>
                  <p className="text-xs text-muted-foreground">
                    Active monitoring enabled
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {activeAlerts.filter(alert => alert.childId === selectedChild).length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Require your attention
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <Eye className="h-8 w-8 mx-auto mb-2" />
                  <p className="font-medium">Privacy-Preserving Monitoring</p>
                  <p className="text-sm mt-1">Only safety-critical information is shown here.</p>
                  <p className="text-sm">Your child's conversations remain private unless there's a safety concern.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Prompts Tab */}
          <TabsContent value="ai-prompts" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>AI System Prompts</CardTitle>
                <p className="text-sm text-gray-600">
                  Customize how the AI companion interacts with your child through detailed prompts and guidelines
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="system-prompt">System Prompt</Label>
                  <p className="text-sm text-gray-500 mb-2">
                    Define the AI's core personality and approach to conversations
                  </p>
                  <Textarea
                    id="system-prompt"
                    value={parentControls?.aiPrompts?.systemPrompt || ''}
                    onChange={(e) => handlePromptUpdate('systemPrompt', e.target.value)}
                    placeholder="You are a caring, supportive AI companion for a young person. Always be encouraging, age-appropriate, and focus on building confidence and healthy relationships..."
                    rows={4}
                    className="w-full"
                  />
                </div>

                <div>
                  <Label htmlFor="behavior-guidelines">Behavior Guidelines</Label>
                  <p className="text-sm text-gray-500 mb-2">
                    Specific behavioral instructions for the AI companion
                  </p>
                  <Textarea
                    id="behavior-guidelines"
                    value={parentControls?.aiPrompts?.behaviorGuidelines || ''}
                    onChange={(e) => handlePromptUpdate('behaviorGuidelines', e.target.value)}
                    placeholder="Always validate feelings, encourage open communication, suggest healthy coping strategies, redirect negative thoughts positively..."
                    rows={4}
                    className="w-full"
                  />
                </div>

                <div>
                  <Label htmlFor="response-style">Response Style</Label>
                  <p className="text-sm text-gray-500 mb-2">
                    How the AI should communicate and respond
                  </p>
                  <Textarea
                    id="response-style"
                    value={parentControls?.aiPrompts?.responseStyle || ''}
                    onChange={(e) => handlePromptUpdate('responseStyle', e.target.value)}
                    placeholder="Use warm, encouraging language. Ask thoughtful follow-up questions. Celebrate achievements. Provide gentle guidance without being preachy..."
                    rows={3}
                    className="w-full"
                  />
                </div>

                <div>
                  <Label htmlFor="topic-restrictions">Topic Restrictions</Label>
                  <p className="text-sm text-gray-500 mb-2">
                    Topics the AI should avoid or handle with special care (comma-separated)
                  </p>
                  <input
                    id="topic-restrictions"
                    type="text"
                    value={parentControls?.aiPrompts?.topicRestrictions?.join(', ') || ''}
                    onChange={(e) => handlePromptUpdate('topicRestrictions', e.target.value.split(',').map(t => t.trim()).filter(t => t))}
                    placeholder="romantic relationships, adult content, financial advice, medical diagnosis"
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">How AI Prompts Work</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• These prompts govern every interaction your child has with the AI</li>
                    <li>• The AI will follow these guidelines while maintaining natural conversation</li>
                    <li>• Changes apply immediately to new conversations</li>
                    <li>• All prompts are designed to prioritize your child's safety and well-being</li>
                  </ul>
                </div>

                <Button onClick={saveAIPrompts} disabled={updatePersonalityMutation.isPending}>
                  {updatePersonalityMutation.isPending ? 'Saving...' : 'Save AI Prompts'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Monitoring Levels Tab */}
          <TabsContent value="monitoring" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Monitoring Levels</CardTitle>
                <p className="text-sm text-gray-600">
                  Configure how closely the AI monitors your child's conversations while preserving privacy
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="monitoring-level">Monitoring Intensity</Label>
                  <Select 
                    value={parentControls?.monitoringSettings?.level || 'standard'}
                    onValueChange={(value) => handleMonitoringUpdate('level', value)}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="minimal">Minimal - Only critical safety issues</SelectItem>
                      <SelectItem value="standard">Standard - Balanced monitoring</SelectItem>
                      <SelectItem value="enhanced">Enhanced - Detailed behavior analysis</SelectItem>
                      <SelectItem value="comprehensive">Comprehensive - Full conversation analysis</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-gray-500 mt-2">
                    {getMonitoringDescription(parentControls?.monitoringSettings?.level || 'standard')}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="keyword-monitoring">Keyword Monitoring</Label>
                        <p className="text-sm text-gray-500">Monitor for concerning words and phrases</p>
                      </div>
                      <Switch 
                        id="keyword-monitoring"
                        checked={parentControls?.monitoringSettings?.keywordMonitoring ?? true}
                        onCheckedChange={(checked) => handleMonitoringUpdate('keywordMonitoring', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="sentiment-analysis">Sentiment Analysis</Label>
                        <p className="text-sm text-gray-500">Analyze emotional tone of conversations</p>
                      </div>
                      <Switch 
                        id="sentiment-analysis"
                        checked={parentControls?.monitoringSettings?.sentimentAnalysis ?? true}
                        onCheckedChange={(checked) => handleMonitoringUpdate('sentimentAnalysis', checked)}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="contextual-analysis">Contextual Analysis</Label>
                        <p className="text-sm text-gray-500">Understand conversation context and meaning</p>
                      </div>
                      <Switch 
                        id="contextual-analysis"
                        checked={parentControls?.monitoringSettings?.contextualAnalysis ?? true}
                        onCheckedChange={(checked) => handleMonitoringUpdate('contextualAnalysis', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="real-time-alerts">Real-time Alerts</Label>
                        <p className="text-sm text-gray-500">Immediate notifications for urgent concerns</p>
                      </div>
                      <Switch 
                        id="real-time-alerts"
                        checked={parentControls?.monitoringSettings?.realTimeAlerts ?? true}
                        onCheckedChange={(checked) => handleMonitoringUpdate('realTimeAlerts', checked)}
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <h4 className="font-medium text-amber-900 mb-2">Privacy Balance</h4>
                  <p className="text-sm text-amber-800">
                    Higher monitoring levels provide better safety protection but may reduce your child's sense of privacy. 
                    We recommend starting with "Standard" and adjusting based on your child's age and needs.
                  </p>
                </div>

                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                  <h4 className="font-medium text-indigo-900 mb-3">Alert Threshold Configuration</h4>
                  <p className="text-sm text-indigo-800 mb-4">
                    Choose which types of alerts you want to receive. Higher thresholds mean fewer notifications.
                  </p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="critical-alerts">Critical</Label>
                        <p className="text-xs text-gray-500">Self-harm, abuse</p>
                      </div>
                      <Switch 
                        id="critical-alerts"
                        checked={parentControls?.alertThresholds?.critical ?? true}
                        onCheckedChange={(checked) => handleAlertThresholdUpdate('critical', checked)}
                        disabled={true} // Critical alerts cannot be disabled
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="high-alerts">High Priority</Label>
                        <p className="text-xs text-gray-500">Depression, bullying</p>
                      </div>
                      <Switch 
                        id="high-alerts"
                        checked={parentControls?.alertThresholds?.high ?? true}
                        onCheckedChange={(checked) => handleAlertThresholdUpdate('high', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="medium-alerts">Medium Priority</Label>
                        <p className="text-xs text-gray-500">Stress, conflicts</p>
                      </div>
                      <Switch 
                        id="medium-alerts"
                        checked={parentControls?.alertThresholds?.medium ?? false}
                        onCheckedChange={(checked) => handleAlertThresholdUpdate('medium', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="low-alerts">Low Priority</Label>
                        <p className="text-xs text-gray-500">Mild concerns</p>
                      </div>
                      <Switch 
                        id="low-alerts"
                        checked={parentControls?.alertThresholds?.low ?? false}
                        onCheckedChange={(checked) => handleAlertThresholdUpdate('low', checked)}
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <Label htmlFor="confidence-minimum">AI Confidence Threshold: {Math.round((parentControls?.alertThresholds?.confidenceMinimum ?? 0.7) * 100)}%</Label>
                    <input
                      type="range"
                      id="confidence-minimum"
                      min="0.5"
                      max="0.95"
                      step="0.05"
                      value={parentControls?.alertThresholds?.confidenceMinimum ?? 0.7}
                      onChange={(e) => handleAlertThresholdUpdate('confidenceMinimum', parseFloat(e.target.value))}
                      className="w-full mt-2"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Higher values = fewer false positives, but may miss some concerns
                    </p>
                  </div>
                </div>

                <Button onClick={saveMonitoringSettings} disabled={updatePersonalityMutation.isPending}>
                  {updatePersonalityMutation.isPending ? 'Saving...' : 'Save Monitoring Settings'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Enhanced Age & Personality Controls Tab */}
          <TabsContent value="controls" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Age Settings</CardTitle>
                <p className="text-sm text-gray-600">
                  Adjust your child's age to ensure age-appropriate AI responses
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="age-select">Current Age: {selectedChildData?.age} years</Label>
                  <Select 
                    value={selectedChildData?.age?.toString() || ''} 
                    onValueChange={(value) => handleAgeUpdate(parseInt(value))}
                  >
                    <SelectTrigger className="w-full max-w-xs mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[...Array(9)].map((_, i) => {
                        const age = i + 8;
                        return (
                          <SelectItem key={age} value={age.toString()}>
                            {age} years old
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>AI Personality Settings</CardTitle>
                <p className="text-sm text-gray-600">
                  Customize how the AI companion interacts with your child
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="communication-style">Communication Style</Label>
                    <Select 
                      value={parentControls?.personalitySettings?.communicationStyle || 'supportive'}
                      onValueChange={(value) => handlePersonalityUpdate({
                        ...parentControls?.personalitySettings,
                        communicationStyle: value
                      })}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="supportive">Supportive & Encouraging</SelectItem>
                        <SelectItem value="educational">Educational & Informative</SelectItem>
                        <SelectItem value="playful">Playful & Fun</SelectItem>
                        <SelectItem value="gentle">Gentle & Calm</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="emotional-support">Emotional Support Level</Label>
                    <Select 
                      value={parentControls?.personalitySettings?.emotionalSupport || 'balanced'}
                      onValueChange={(value) => handlePersonalityUpdate({
                        ...parentControls?.personalitySettings,
                        emotionalSupport: value
                      })}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high">High - Very nurturing</SelectItem>
                        <SelectItem value="balanced">Balanced - Supportive when needed</SelectItem>
                        <SelectItem value="encouraging">Encouraging - Focus on growth</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="learning-focus">Learning Focus</Label>
                    <Select 
                      value={parentControls?.personalitySettings?.learningFocus || 'social_skills'}
                      onValueChange={(value) => handlePersonalityUpdate({
                        ...parentControls?.personalitySettings,
                        learningFocus: value
                      })}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="social_skills">Social Skills & Relationships</SelectItem>
                        <SelectItem value="emotional_intelligence">Emotional Intelligence</SelectItem>
                        <SelectItem value="confidence_building">Confidence Building</SelectItem>
                        <SelectItem value="academic_support">Academic Support</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="activity-suggestions">Activity Suggestions</Label>
                    <Select 
                      value={parentControls?.personalitySettings?.activityLevel || 'moderate'}
                      onValueChange={(value) => handlePersonalityUpdate({
                        ...parentControls?.personalitySettings,
                        activityLevel: value
                      })}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high">High - Lots of activity ideas</SelectItem>
                        <SelectItem value="moderate">Moderate - Balanced suggestions</SelectItem>
                        <SelectItem value="low">Low - Minimal suggestions</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium text-gray-900 mb-4">Advanced Personality Settings</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="maturity-level">Maturity Level</Label>
                      <Select 
                        value={parentControls?.personalitySettings?.maturityLevel || 'age_appropriate'}
                        onValueChange={(value) => handlePersonalityUpdate({
                          ...parentControls?.personalitySettings,
                          maturityLevel: value
                        })}
                      >
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="young">Young - Simple, concrete concepts</SelectItem>
                          <SelectItem value="age_appropriate">Age Appropriate - Balanced complexity</SelectItem>
                          <SelectItem value="mature">Mature - More sophisticated discussions</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="independence-level">Independence Encouragement</Label>
                      <Select 
                        value={parentControls?.personalitySettings?.independenceLevel || 'balanced'}
                        onValueChange={(value) => handlePersonalityUpdate({
                          ...parentControls?.personalitySettings,
                          independenceLevel: value
                        })}
                      >
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="supportive">Supportive - More guidance and support</SelectItem>
                          <SelectItem value="balanced">Balanced - Mix of support and independence</SelectItem>
                          <SelectItem value="encouraging">Encouraging - Promote self-reliance</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="social-focus">Social Skills Focus</Label>
                      <Select 
                        value={parentControls?.personalitySettings?.socialFocus || 'general'}
                        onValueChange={(value) => handlePersonalityUpdate({
                          ...parentControls?.personalitySettings,
                          socialFocus: value
                        })}
                      >
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="friendship">Friendship Building</SelectItem>
                          <SelectItem value="family">Family Relationships</SelectItem>
                          <SelectItem value="general">General Social Skills</SelectItem>
                          <SelectItem value="leadership">Leadership Development</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="challenge-level">Challenge Level</Label>
                      <Select 
                        value={parentControls?.personalitySettings?.challengeLevel || 'moderate'}
                        onValueChange={(value) => handlePersonalityUpdate({
                          ...parentControls?.personalitySettings,
                          challengeLevel: value
                        })}
                      >
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="gentle">Gentle - Minimal challenges</SelectItem>
                          <SelectItem value="moderate">Moderate - Balanced growth</SelectItem>
                          <SelectItem value="growth_focused">Growth Focused - Encourage stretch goals</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-medium text-green-900 mb-2">Personality Impact</h4>
                  <p className="text-sm text-green-800">
                    These settings directly influence how the AI companion responds to your child, the topics it suggests, 
                    and the way it provides support. Changes take effect immediately for new conversations.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Safety Alerts Tab */}
          <TabsContent value="safety" className="space-y-6">
            {/* Safety Monitoring Configuration */}
            <Card>
              <CardHeader>
                <CardTitle>🛡️ AI Safety Monitoring</CardTitle>
                <div className="text-sm text-muted-foreground">
                  Intelligent conversation analysis to ensure your child's safety and well-being
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">How AI Safety Monitoring Works</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• AI analyzes conversation patterns for safety concerns</li>
                    <li>• Instant alerts for critical issues (self-harm, bullying, inappropriate contact)</li>
                    <li>• Privacy-preserving summaries without exposing private details</li>
                    <li>• Customizable alert thresholds to match your family's needs</li>
                    <li>• Email and push notifications for immediate awareness</li>
                  </ul>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <h4 className="font-medium text-amber-900 mb-2">💰 Pricing & Availability</h4>
                  <div className="text-sm text-amber-800 space-y-2">
                    <div className="flex justify-between items-center">
                      <span><strong>Basic & Premium Tiers:</strong> $9.99/month add-on</span>
                      {safetyMonitoringStatus?.canPurchaseAddon && (
                        <Button 
                          size="sm" 
                          className="bg-blue-600 text-white hover:bg-blue-700"
                          onClick={handlePurchaseSafetyMonitoring}
                          disabled={isPurchasing}
                        >
                          {isPurchasing ? 'Processing...' : 'Purchase Add-on'}
                        </Button>
                      )}
                    </div>
                    <div className="flex justify-between items-center">
                      <span><strong>Family Tier:</strong> Included at no extra cost</span>
                      <span className="text-green-600 font-medium">✓ Included</span>
                    </div>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-medium">Safety Monitoring Status</h4>
                      <p className="text-sm text-gray-600">Current status for {selectedChild ? children.find(c => c.id === selectedChild)?.name : 'this child'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${safetyMonitoringStatus?.hasAccess ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <span className="text-sm font-medium">
                        {safetyMonitoringStatus?.hasAccess ? 'Active' : 'Disabled'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Subscription Tier:</span>
                        <div className="font-medium">{safetyMonitoringStatus?.tierName || 'Unknown'}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Access Source:</span>
                        <div className="font-medium">
                          {safetyMonitoringStatus?.source === 'subscription' ? 'Included in plan' :
                           safetyMonitoringStatus?.source === 'addon' ? 'Add-on purchased' :
                           'Add-on required'}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-600">Monthly Cost:</span>
                        <div className="font-medium">
                          {safetyMonitoringStatus?.source === 'subscription' ? 'Included' : '$9.99'}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      {safetyMonitoringStatus?.canPurchaseAddon && (
                        <Button 
                          className="bg-green-600 hover:bg-green-700"
                          onClick={handlePurchaseSafetyMonitoring}
                          disabled={isPurchasing}
                        >
                          {isPurchasing ? 'Processing Purchase...' : 'Purchase Safety Monitoring'}
                        </Button>
                      )}
                      {safetyMonitoringStatus?.hasAccess && (
                        <Button 
                          variant="outline"
                          onClick={handleDisableSafetyMonitoring}
                          className="border-red-200 text-red-600 hover:bg-red-50"
                        >
                          Disable Monitoring
                        </Button>
                      )}
                      <Button variant="outline">
                        Learn More
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Alert Threshold Configuration (only shown if monitoring is active) */}
                <div className={`border border-gray-200 rounded-lg p-4 ${!safetyMonitoringStatus?.hasAccess ? 'bg-gray-50 opacity-50' : 'bg-white'}`}>
                  <h4 className={`font-medium mb-3 ${!safetyMonitoringStatus?.hasAccess ? 'text-gray-700' : 'text-gray-900'}`}>⚙️ Alert Configuration</h4>
                  {!safetyMonitoringStatus?.hasAccess ? (
                    <p className="text-sm text-gray-600 mb-4">
                      <em>Available after purchasing safety monitoring</em>
                    </p>
                  ) : (
                    <p className="text-sm text-gray-600 mb-4">
                      Configure which types of alerts you want to receive
                    </p>
                  )}
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-gray-500">Critical</Label>
                        <p className="text-xs text-gray-400">Self-harm, abuse</p>
                      </div>
                      <Switch disabled checked />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-gray-500">High Priority</Label>
                        <p className="text-xs text-gray-400">Depression, bullying</p>
                      </div>
                      <Switch disabled checked />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-gray-500">Medium Priority</Label>
                        <p className="text-xs text-gray-400">Stress, conflicts</p>
                      </div>
                      <Switch disabled />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-gray-500">Low Priority</Label>
                        <p className="text-xs text-gray-400">Mild concerns</p>
                      </div>
                      <Switch disabled />
                    </div>
                  </div>

                  <div className="mt-4">
                    <Label className="text-gray-500">AI Confidence Threshold: 70%</Label>
                    <input
                      type="range"
                      disabled
                      min="50"
                      max="95"
                      value="70"
                      className="w-full mt-2 opacity-50"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Higher values = fewer false positives, but may miss some concerns
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Active Safety Alerts</h3>
                <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-200">
                  {activeAlerts.filter(alert => alert.childId === selectedChild).length} Active
                </Badge>
              </div>

              {activeAlerts.filter(alert => alert.childId === selectedChild).length === 0 ? (
                <Card>
                  <CardContent className="text-center py-8">
                    <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <p className="font-medium text-green-800">No Active Safety Alerts</p>
                    <p className="text-sm text-green-600">Your child's interactions are proceeding normally.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {activeAlerts
                    .filter(alert => alert.childId === selectedChild)
                    .map((alert) => (
                      <SafetyAlertCard 
                        key={alert.id} 
                        alert={alert} 
                        onResolve={handleResolveAlert}
                      />
                    ))}
                </div>
              )}

              <Separator />

              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Resolved Alerts</h3>
                <Badge variant="outline" className="bg-green-50 text-green-800 border-green-200">
                  {resolvedAlerts.filter(alert => alert.childId === selectedChild).length} Resolved
                </Badge>
              </div>

              {resolvedAlerts.filter(alert => alert.childId === selectedChild).slice(0, 5).map((alert) => (
                <Card key={alert.id} className="opacity-75">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <CheckCircle className="h-5 w-5 text-green-600 mt-1" />
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-green-800">
                              {alert.alertType.replace('_', ' ').toUpperCase()}
                            </span>
                            <Badge variant="outline" className="text-xs">Resolved</Badge>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{alert.contextSummary}</p>
                          {alert.reviewNotes && (
                            <p className="text-sm text-gray-500 mt-2 italic">
                              Your notes: {alert.reviewNotes}
                            </p>
                          )}
                          <p className="text-xs text-gray-400 mt-2">
                            Resolved on {new Date(alert.resolvedAt!).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Privacy Settings Tab */}
          <TabsContent value="privacy" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <EyeOff className="h-5 w-5" />
                  <span>Privacy Protection</span>
                </CardTitle>
                <p className="text-sm text-gray-600">
                  Our privacy-first approach ensures your child's conversations remain confidential
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">How Privacy Protection Works</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Conversations are analyzed for safety, not content</li>
                    <li>• Only concerning patterns trigger alerts</li>
                    <li>• Personal conversations remain private</li>
                    <li>• You see summaries, not full conversations</li>
                    <li>• Data is encrypted and secure</li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="safety-monitoring">Safety Monitoring</Label>
                      <p className="text-sm text-gray-600">Monitor for concerning behavior patterns</p>
                    </div>
                    <Switch id="safety-monitoring" checked={true} disabled />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="emergency-alerts">Emergency Alerts</Label>
                      <p className="text-sm text-gray-600">Immediate notification for serious concerns</p>
                    </div>
                    <Switch id="emergency-alerts" checked={true} disabled />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="privacy-mode">Enhanced Privacy Mode</Label>
                      <p className="text-sm text-gray-600">Even stricter privacy with minimal monitoring</p>
                    </div>
                    <Switch 
                      id="privacy-mode" 
                      checked={parentControls?.privacyMode || false}
                      disabled
                    />
                  </div>
                </div>

                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    Safety monitoring cannot be disabled as it's essential for child protection. 
                    We only alert you to genuinely concerning situations that require parental attention.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

interface SafetyAlertCardProps {
  alert: SafetyAlert;
  onResolve: (alertId: string, reviewNotes: string) => void;
}

function SafetyAlertCard({ alert, onResolve }: SafetyAlertCardProps) {
  const [isResolving, setIsResolving] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');

  const handleResolve = () => {
    if (reviewNotes.trim()) {
      onResolve(alert.id, reviewNotes);
      setIsResolving(false);
      setReviewNotes('');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  const getAlertTypeIcon = (alertType: string) => {
    switch (alertType) {
      case 'self_harm_concern':
      case 'safety_concern':
        return <AlertTriangle className="h-4 w-4" />;
      case 'bullying_detected':
        return <Shield className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardContent className="p-4">
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <div className="text-orange-600 mt-1">
                {getAlertTypeIcon(alert.alertType)}
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-orange-900">
                    {alert.alertType.replace('_', ' ').toUpperCase()}
                  </span>
                  <Badge variant={getPriorityColor(alert.priority)} className="text-xs">
                    {alert.priority} priority
                  </Badge>
                </div>
                <p className="text-sm text-orange-800 mt-1">{alert.contextSummary}</p>
                <div className="flex items-center space-x-4 mt-2 text-xs text-orange-600">
                  <span className="flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>{new Date(alert.createdAt).toLocaleString()}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {!isResolving ? (
            <div className="flex space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsResolving(true)}
                className="text-orange-700 border-orange-300 hover:bg-orange-100"
              >
                Review & Resolve
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <Label htmlFor="review-notes" className="text-sm font-medium text-orange-900">
                  Resolution Notes (for your records)
                </Label>
                <Textarea
                  id="review-notes"
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Record how you addressed this concern..."
                  className="mt-1 border-orange-300 focus:border-orange-500"
                  rows={3}
                />
              </div>
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  onClick={handleResolve}
                  disabled={!reviewNotes.trim()}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Mark Resolved
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setIsResolving(false);
                    setReviewNotes('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}