import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/hooks/useAuth";
import { TestTube, CheckCircle, Sparkles, Heart, TrendingUp, Target, Settings, Crown } from "lucide-react";

export default function TestDashboard() {
  const { isAuthenticated } = useAuth();
  const [testResults, setTestResults] = useState<{ [key: string]: 'pass' | 'fail' | 'pending' }>({});

  const { data: testModeStatus } = useQuery({
    queryKey: ['/api/test-mode'],
    enabled: true,
    retry: false,
  });

  const testFeatures = [
    {
      id: 'auth',
      name: 'Authentication System',
      description: 'Replit Auth integration with user profiles',
      endpoint: '/api/auth/user',
      icon: Settings
    },
    {
      id: 'affirmations',
      name: 'Daily Affirmations',
      description: 'Personalized daily encouragement messages',
      endpoint: '/api/daily-affirmations',
      icon: Sparkles
    },
    {
      id: 'mood',
      name: 'Mood Tracking',
      description: '30-day emotional analytics and trends',
      endpoint: '/api/mood-tracking',
      icon: TrendingUp
    },
    {
      id: 'goals',
      name: 'Goal Setting',
      description: 'Progress tracking with visual charts',
      endpoint: '/api/child-goals',
      icon: Target
    },
    {
      id: 'chat',
      name: 'AI Companion Chat',
      description: 'Proactive AI with personality adaptation',
      endpoint: '/api/chat',
      icon: Heart
    },
    {
      id: 'subscription',
      name: 'Subscription Tiers',
      description: 'Feature restrictions based on plan',
      endpoint: '/api/pricing-plans',
      icon: Crown
    }
  ];

  const runFeatureTest = async (feature: typeof testFeatures[0]) => {
    setTestResults(prev => ({ ...prev, [feature.id]: 'pending' }));
    
    try {
      const response = await fetch(feature.endpoint, {
        credentials: 'include'
      });
      
      if (response.ok || response.status === 401) {
        // 401 is expected for some endpoints when not authenticated
        setTestResults(prev => ({ ...prev, [feature.id]: 'pass' }));
      } else {
        setTestResults(prev => ({ ...prev, [feature.id]: 'fail' }));
      }
    } catch (error) {
      setTestResults(prev => ({ ...prev, [feature.id]: 'fail' }));
    }
  };

  const runAllTests = async () => {
    for (const feature of testFeatures) {
      await runFeatureTest(feature);
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <TestTube className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Stage 2 Testing Dashboard
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-300">
            Test all proactive AI companion features without payment restrictions
          </p>
        </div>

        {/* Test Mode Status */}
        {testModeStatus && (
          <Alert className="mb-6 border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800 dark:text-green-300">
              <strong>Test Mode Active:</strong> {testModeStatus.message}
            </AlertDescription>
          </Alert>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Button onClick={runAllTests} className="h-12" size="lg">
            <TestTube className="w-4 h-4 mr-2" />
            Run All Tests
          </Button>
          
          <Button variant="outline" asChild className="h-12">
            <a href="/companion-setup">
              <Sparkles className="w-4 h-4 mr-2" />
              Create Test Profile
            </a>
          </Button>
          
          <Button variant="outline" asChild className="h-12">
            <a href="/" target="_blank">
              <Heart className="w-4 h-4 mr-2" />
              Go to Dashboard
            </a>
          </Button>

          <Button variant="outline" asChild className="h-12">
            <a href="/documentation.html" target="_blank">
              <CheckCircle className="w-4 h-4 mr-2" />
              Full Documentation
            </a>
          </Button>
        </div>

        {/* Feature Test Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testFeatures.map((feature) => {
            const IconComponent = feature.icon;
            const status = testResults[feature.id];
            
            return (
              <Card key={feature.id} className="relative">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <IconComponent className="w-5 h-5 text-blue-600" />
                      <CardTitle className="text-lg">{feature.name}</CardTitle>
                    </div>
                    
                    {status && (
                      <Badge 
                        variant={status === 'pass' ? 'default' : status === 'fail' ? 'destructive' : 'secondary'}
                        className={status === 'pending' ? 'animate-pulse' : ''}
                      >
                        {status === 'pass' && <CheckCircle className="w-3 h-3 mr-1" />}
                        {status.toUpperCase()}
                      </Badge>
                    )}
                  </div>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-3">
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                      {feature.endpoint}
                    </p>
                    
                    <Button 
                      variant="outline" 
                      onClick={() => runFeatureTest(feature)}
                      className="w-full"
                      disabled={status === 'pending'}
                    >
                      {status === 'pending' ? 'Testing...' : 'Test Feature'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Test Mode Features List */}
        {testModeStatus?.features && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Available Test Features</CardTitle>
              <CardDescription>
                All these features are unlocked in development mode
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {testModeStatus.features.map((feature: string, index: number) => (
                  <div key={index} className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>How to Test Stage 2 Features</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">1. Authentication & Setup</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Sign in with Replit Auth and create a child profile to get started.
              </p>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">2. Daily Affirmations</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Test the automated daily encouragement system that sends personalized messages at 8 AM.
              </p>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">3. Mood Tracking</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Log daily emotions and view 30-day trends with visual analytics.
              </p>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">4. AI Companion Chat</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Experience proactive AI that adapts its personality and initiates supportive conversations.
              </p>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">5. No API Keys Needed</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                The built-in AI system provides caring responses without requiring external API keys.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}