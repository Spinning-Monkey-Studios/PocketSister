import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CheckCircle, 
  XCircle, 
  Mail, 
  Settings, 
  TestTube, 
  CreditCard,
  Users,
  Activity
} from 'lucide-react';

interface AdminConfig {
  adminSecret: string;
  currentAdminEmail: string | null;
  stripeConfigured: boolean;
  emailConfigured: boolean;
  availableTests: string[];
}

interface TestResult {
  passed: boolean;
  message: string;
  [key: string]: any;
}

interface FeatureTestResults {
  timestamp: string;
  tests: Record<string, TestResult>;
  summary: {
    total: number;
    passed: number;
    failed: number;
  };
}

export default function AdminDashboard() {
  const [config, setConfig] = useState<AdminConfig | null>(null);
  const [adminEmail, setAdminEmail] = useState('');
  const [testResults, setTestResults] = useState<FeatureTestResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [version, setVersion] = useState<any>(null);

  const adminSecret = 'admin123'; // In production, this would be from environment

  useEffect(() => {
    fetchConfig();
    fetchVersion();
  }, []);

  const fetchVersion = async () => {
    try {
      const response = await fetch('/api/version');
      if (response.ok) {
        const versionData = await response.json();
        setVersion(versionData);
      }
    } catch (error) {
      console.error('Failed to fetch version:', error);
    }
  };

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/admin/testing/config', {
        method: 'GET',
        headers: { 
          'x-admin-secret': adminSecret,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setConfig(data.config);
        setAdminEmail(data.config.currentAdminEmail || '');
        setMessage(''); // Clear any previous error messages
      } else {
        setMessage('Failed to load admin configuration: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Failed to fetch config:', error);
      setMessage('Error loading admin dashboard: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const setAdminEmailHandler = async () => {
    if (!adminEmail.includes('@')) {
      setMessage('Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/admin/testing/set-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-secret': adminSecret
        },
        body: JSON.stringify({ adminEmail })
      });

      const data = await response.json();
      if (data.success) {
        setMessage('Admin email updated successfully');
        fetchConfig();
      } else {
        setMessage(data.error || 'Failed to update admin email');
      }
    } catch (error) {
      setMessage('Error updating admin email');
    }
    setLoading(false);
  };

  const sendTestEmail = async (testType: string = 'basic') => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/testing/send-test-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-secret': adminSecret
        },
        body: JSON.stringify({ testType })
      });

      const data = await response.json();
      if (data.success) {
        setMessage(`Test email sent successfully to ${adminEmail}`);
      } else {
        setMessage(data.error || 'Failed to send test email');
      }
    } catch (error) {
      setMessage('Error sending test email');
    }
    setLoading(false);
  };

  const runFeatureTests = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/testing/run-feature-tests', {
        method: 'POST',
        headers: { 'x-admin-secret': adminSecret }
      });

      const data = await response.json();
      if (data.success) {
        setTestResults(data.results);
        setMessage('Feature tests completed');
      } else {
        setMessage(data.error || 'Failed to run feature tests');
      }
    } catch (error) {
      setMessage('Error running feature tests');
    }
    setLoading(false);
  };

  const testStripeProducts = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/testing/stripe-products', {
        headers: { 'x-admin-secret': adminSecret }
      });

      const data = await response.json();
      if (data.success) {
        setMessage('Stripe products test completed - check console for details');
        console.log('Stripe Products:', data.productTest);
      } else {
        setMessage(data.error || 'Failed to test Stripe products');
      }
    } catch (error) {
      setMessage('Error testing Stripe products');
    }
    setLoading(false);
  };

  if (!config) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Admin Dashboard</h1>
            {message ? (
              <Alert className="mb-4">
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            ) : (
              <p className="text-gray-600">Loading admin dashboard...</p>
            )}
            <Button onClick={fetchConfig} className="mt-4">
              Retry Loading
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            My Pocket Sister - Admin Dashboard
          </h1>
          <p className="text-gray-600">
            System administration and testing tools
          </p>
        </div>

        {message && (
          <Alert className="mb-6">
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="config" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="config" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Configuration
            </TabsTrigger>
            <TabsTrigger value="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email Testing
            </TabsTrigger>
            <TabsTrigger value="tests" className="flex items-center gap-2">
              <TestTube className="h-4 w-4" />
              Feature Tests
            </TabsTrigger>
            <TabsTrigger value="products" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Stripe Products
            </TabsTrigger>
          </TabsList>

          <TabsContent value="config">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>System Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Email Configuration</span>
                    <Badge variant={config.emailConfigured ? "default" : "destructive"}>
                      {config.emailConfigured ? 'Configured' : 'Not Configured'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Stripe Configuration</span>
                    <Badge variant={config.stripeConfigured ? "default" : "destructive"}>
                      {config.stripeConfigured ? 'Configured' : 'Not Configured'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Admin Email</span>
                    <Badge variant={config.currentAdminEmail ? "default" : "secondary"}>
                      {config.currentAdminEmail ? 'Set' : 'Not Set'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Admin Email Setup</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Admin Email Address
                    </label>
                    <Input
                      type="email"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      placeholder="admin@yourcompany.com"
                    />
                  </div>
                  <Button 
                    onClick={setAdminEmailHandler}
                    disabled={loading || !adminEmail}
                    className="w-full"
                  >
                    {loading ? 'Updating...' : 'Set Admin Email'}
                  </Button>
                  {config.currentAdminEmail && (
                    <p className="text-sm text-gray-600">
                      Current: {config.currentAdminEmail}
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="email">
            <Card>
              <CardHeader>
                <CardTitle>Email Testing</CardTitle>
              </CardHeader>
              <CardContent>
                {!config.currentAdminEmail ? (
                  <Alert>
                    <AlertDescription>
                      Please set an admin email address first in the Configuration tab.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600 mb-4">
                      Send test emails to: {config.currentAdminEmail}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Button 
                        onClick={() => sendTestEmail('basic')}
                        disabled={loading}
                        variant="outline"
                      >
                        Basic Test Email
                      </Button>
                      <Button 
                        onClick={() => sendTestEmail('billing')}
                        disabled={loading}
                        variant="outline"
                      >
                        Billing Test Email
                      </Button>
                      <Button 
                        onClick={() => sendTestEmail('safety')}
                        disabled={loading}
                        variant="outline"
                      >
                        Safety Alert Test
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tests">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Feature Tests
                  <Button onClick={runFeatureTests} disabled={loading}>
                    {loading ? 'Running...' : 'Run All Tests'}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {testResults ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 mb-4">
                      <Badge variant="outline">
                        Total: {testResults.summary.total}
                      </Badge>
                      <Badge variant="default">
                        Passed: {testResults.summary.passed}
                      </Badge>
                      <Badge variant="destructive">
                        Failed: {testResults.summary.failed}
                      </Badge>
                    </div>
                    
                    <div className="space-y-3">
                      {Object.entries(testResults.tests).map(([testName, result]) => (
                        <div 
                          key={testName}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            {result.passed ? (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : (
                              <XCircle className="h-5 w-5 text-red-500" />
                            )}
                            <div>
                              <div className="font-medium capitalize">
                                {testName.replace(/([A-Z])/g, ' $1')}
                              </div>
                              <div className="text-sm text-gray-600">
                                {result.message}
                              </div>
                            </div>
                          </div>
                          <Badge variant={result.passed ? "default" : "destructive"}>
                            {result.passed ? 'PASS' : 'FAIL'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                    
                    <p className="text-xs text-gray-500 mt-4">
                      Last run: {new Date(testResults.timestamp).toLocaleString()}
                    </p>
                  </div>
                ) : (
                  <p className="text-gray-600">
                    Click "Run All Tests" to test system functionality.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="products">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Stripe Products
                  <Button onClick={testStripeProducts} disabled={loading}>
                    {loading ? 'Testing...' : 'Test Stripe Config'}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Alert>
                    <AlertDescription>
                      Updated Stripe Product IDs have been configured:
                    </AlertDescription>
                  </Alert>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 border rounded-lg">
                      <h3 className="font-medium text-green-600">Pocket Sister Plus</h3>
                      <p className="text-sm text-gray-600">$4.99/month</p>
                      <p className="text-xs font-mono">prod_SmNx6Aj3maRO2j</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h3 className="font-medium text-blue-600">Pocket Sister Premium</h3>
                      <p className="text-sm text-gray-600">$9.99/month</p>
                      <p className="text-xs font-mono">prod_SoUyOrGeEMxOMt</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h3 className="font-medium text-purple-600">Pocket Sister Family</h3>
                      <p className="text-sm text-gray-600">$19.99/month</p>
                      <p className="text-xs font-mono">prod_SoV01u3869uf9V</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Quick Links
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button variant="outline" size="sm" asChild>
                  <a href="/api/admin/stats" target="_blank">System Stats</a>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a href="/api/admin/child-profiles" target="_blank">Child Profiles</a>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a href="/api/admin/avatar-graphics/stats" target="_blank">Avatar Stats</a>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a href="/api/background-music/admin/rescan" target="_blank">Music Library</a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}