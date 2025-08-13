import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell 
} from 'recharts';
import { 
  Users, Clock, MessageSquare, Zap, TrendingUp, 
  Activity, Calendar, Download 
} from "lucide-react";

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff88'];

export default function AdminUsageMetrics() {
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  // Fetch usage summary
  const { data: usageSummary, isLoading: summaryLoading } = useQuery({
    queryKey: ['/api/admin/metrics/usage-summary', dateRange],
    queryFn: () => fetch(`/api/admin/metrics/usage-summary?days=30`).then(res => res.json())
  });

  // Fetch detailed metrics
  const { data: detailedMetrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['/api/admin/metrics/usage-metrics', dateRange],
    queryFn: () => fetch(`/api/admin/metrics/usage-metrics?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`).then(res => res.json())
  });

  // Fetch top users
  const { data: topUsers, isLoading: topUsersLoading } = useQuery({
    queryKey: ['/api/admin/metrics/top-users'],
    queryFn: () => fetch('/api/admin/metrics/top-users?limit=10').then(res => res.json())
  });

  // Fetch active sessions
  const { data: activeSessions, isLoading: activeSessionsLoading } = useQuery({
    queryKey: ['/api/admin/metrics/active-sessions'],
    refetchInterval: 30000, // Refresh every 30 seconds
    queryFn: () => fetch('/api/admin/metrics/active-sessions').then(res => res.json())
  });

  const exportData = () => {
    if (detailedMetrics) {
      const csv = [
        ['Date', 'Child Name', 'Minutes', 'Tokens', 'Messages', 'Sessions'].join(','),
        ...detailedMetrics.map((row: any) => [
          row.date,
          row.childName || 'Unknown',
          row.minutesSpent,
          row.tokensUsed,
          row.messagesExchanged,
          row.sessionCount
        ].join(','))
      ].join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `usage-metrics-${dateRange.startDate}-${dateRange.endDate}.csv`;
      a.click();
    }
  };

  // Calculate totals for overview cards
  const totals = usageSummary?.reduce((acc: any, day: any) => ({
    totalMinutes: (acc.totalMinutes || 0) + day.totalMinutes,
    totalTokens: (acc.totalTokens || 0) + day.totalTokens,
    totalMessages: (acc.totalMessages || 0) + day.totalMessages,
    uniqueUsers: Math.max(acc.uniqueUsers || 0, day.uniqueUsers)
  }), {}) || {};

  if (summaryLoading || metricsLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6" data-testid="admin-usage-metrics">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Usage Metrics Dashboard</h1>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Label htmlFor="start-date">Start Date:</Label>
            <Input
              id="start-date"
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
              data-testid="input-start-date"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Label htmlFor="end-date">End Date:</Label>
            <Input
              id="end-date"
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
              data-testid="input-end-date"
            />
          </div>
          <Button onClick={exportData} variant="outline" data-testid="button-export-data">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-users">
              {totals.uniqueUsers || 0}
            </div>
            <p className="text-xs text-muted-foreground">Active in selected period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Minutes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-minutes">
              {(totals.totalMinutes || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {Math.round((totals.totalMinutes || 0) / 60)} hours total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tokens</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-tokens">
              {(totals.totalTokens || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">AI processing tokens</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-active-sessions">
              {activeSessions?.activeSessionsCount || 0}
            </div>
            <p className="text-xs text-muted-foreground">Currently online</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Analytics */}
      <Tabs defaultValue="daily-usage" className="space-y-4">
        <TabsList>
          <TabsTrigger value="daily-usage">Daily Usage</TabsTrigger>
          <TabsTrigger value="top-users">Top Users</TabsTrigger>
          <TabsTrigger value="detailed-metrics">Detailed Metrics</TabsTrigger>
        </TabsList>

        <TabsContent value="daily-usage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Daily Usage Trends</CardTitle>
              <CardDescription>
                Minutes spent and tokens used over the selected period
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={usageSummary}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="totalMinutes" 
                    stroke="#8884d8" 
                    strokeWidth={2}
                    name="Minutes"
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="totalTokens" 
                    stroke="#82ca9d" 
                    strokeWidth={2}
                    name="Tokens"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="top-users" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Users by Minutes</CardTitle>
                <CardDescription>Most active users in the system</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={topUsers?.slice(0, 8)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="childName" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="totalMinutes" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Token Distribution</CardTitle>
                <CardDescription>Token usage by top users</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={topUsers?.slice(0, 5)}
                      dataKey="totalTokens"
                      nameKey="childName"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {topUsers?.slice(0, 5).map((_: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="detailed-metrics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Detailed Usage Metrics</CardTitle>
              <CardDescription>
                Per-user daily breakdown of usage statistics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 p-2 text-left">Date</th>
                      <th className="border border-gray-300 p-2 text-left">Child Name</th>
                      <th className="border border-gray-300 p-2 text-right">Minutes</th>
                      <th className="border border-gray-300 p-2 text-right">Tokens</th>
                      <th className="border border-gray-300 p-2 text-right">Messages</th>
                      <th className="border border-gray-300 p-2 text-right">Sessions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detailedMetrics?.map((row: any, index: number) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="border border-gray-300 p-2" data-testid={`text-date-${index}`}>
                          {row.date}
                        </td>
                        <td className="border border-gray-300 p-2" data-testid={`text-child-name-${index}`}>
                          {row.childName || 'Unknown'}
                        </td>
                        <td className="border border-gray-300 p-2 text-right" data-testid={`text-minutes-${index}`}>
                          {row.minutesSpent}
                        </td>
                        <td className="border border-gray-300 p-2 text-right" data-testid={`text-tokens-${index}`}>
                          {row.tokensUsed}
                        </td>
                        <td className="border border-gray-300 p-2 text-right" data-testid={`text-messages-${index}`}>
                          {row.messagesExchanged}
                        </td>
                        <td className="border border-gray-300 p-2 text-right" data-testid={`text-sessions-${index}`}>
                          {row.sessionCount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}