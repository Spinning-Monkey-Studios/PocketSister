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
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useAuth } from "@/hooks/useAuth";
import { Users, MessageSquare, CreditCard, Settings, LogOut, BarChart3, AlertTriangle, Bell, BookOpen } from "lucide-react";
import AdminNotificationBroadcast from "@/components/admin-notification-broadcast";

interface User {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  subscriptionStatus: string;
  createdAt: string;
  isAdmin?: boolean;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: string;
  targetAudience: string;
  isActive: boolean;
  createdAt: string;
}

interface UsageOverview {
  userId: string;
  userEmail: string;
  userName: string;
  profiles: {
    childId: string;
    childName: string;
    companionName: string;
    messageCount: number;
    monthlyLimit: number;
    lastReset: string;
  }[];
}

export default function AdminPortal() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    content: '',
    type: 'info',
    targetAudience: 'all',
  });
  const [configStatus, setConfigStatus] = useState({
    gemini: false,
    openai: false,
    elevenlabs: false,
    stripe: false,
    sendgrid: false
  });

  // Check admin access
  useEffect(() => {
    const adminSecret = localStorage.getItem('adminSecret');
    const adminToken = localStorage.getItem('adminToken');
    
    if (!adminSecret || !adminToken) {
      // Redirect to admin login
      window.location.href = '/admin-login';
      return;
    }
    
    // Set the admin secret in API requests
    if (adminSecret) {
      // This will be used by apiRequest for admin endpoints
      (window as any).adminSecret = adminSecret;
    }
  }, []);

  // Redirect if not admin (fallback check)
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !(user as any)?.isAdmin)) {
      const adminSecret = localStorage.getItem('adminSecret');
      if (!adminSecret) {
        toast({
          title: "Access Denied",
          description: "Admin access required. Redirecting...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/";
        }, 1000);
      }
    }
  }, [isAuthenticated, isLoading, user, toast]);

  // Fetch users
  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    enabled: isAuthenticated && (user as any)?.isAdmin,
  });

  // Fetch announcements
  const { data: announcements = [], isLoading: announcementsLoading } = useQuery<Announcement[]>({
    queryKey: ["/api/admin/announcements"],
    enabled: isAuthenticated && (user as any)?.isAdmin,
  });

  // Fetch usage overview
  const { data: usageOverview = [], isLoading: usageLoading } = useQuery<UsageOverview[]>({
    queryKey: ["/api/admin/usage-overview"],
    enabled: isAuthenticated && (user as any)?.isAdmin,
  });

  // Fetch child profiles
  const { data: childProfiles = [], isLoading: childProfilesLoading } = useQuery({
    queryKey: ["/api/admin/child-profiles"],
  });

  // Fetch system stats
  const { data: systemStats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/admin/stats"],
  });

  // Update user subscription mutation
  const updateSubscriptionMutation = useMutation({
    mutationFn: async ({ userId, status }: { userId: string; status: string }) => {
      return apiRequest("POST", `/api/admin/users/${userId}/subscription`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Success",
        description: "User subscription updated successfully",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "Session expired. Please login again.",
          variant: "destructive",
        });
        setTimeout(() => window.location.href = "/api/login", 1000);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update subscription",
        variant: "destructive",
      });
    },
  });

  // Child profile mutations
  const updateChildStatusMutation = useMutation({
    mutationFn: async ({ childId, status }: { childId: string; status: string }) => {
      return apiRequest("PUT", `/api/admin/child-profiles/${childId}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/child-profiles"] });
      toast({
        title: "Success",
        description: "Child profile status updated",
      });
    },
  });

  const upgradeChildTierMutation = useMutation({
    mutationFn: async ({ childId, tier }: { childId: string; tier: string }) => {
      return apiRequest("PUT", `/api/admin/child-profiles/${childId}/tier`, { tier });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/child-profiles"] });
      toast({
        title: "Success",
        description: "Child profile tier upgraded",
      });
    },
  });

  const deleteChildProfileMutation = useMutation({
    mutationFn: async (childId: string) => {
      return apiRequest("DELETE", `/api/admin/child-profiles/${childId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/child-profiles"] });
      toast({
        title: "Success",
        description: "Child profile deleted",
      });
    },
  });

  // Create announcement mutation
  const createAnnouncementMutation = useMutation({
    mutationFn: async (announcement: typeof newAnnouncement) => {
      return apiRequest("POST", "/api/admin/announcements", announcement);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/announcements"] });
      setNewAnnouncement({ title: '', content: '', type: 'info', targetAudience: 'all' });
      toast({
        title: "Success",
        description: "Announcement created successfully",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "Session expired. Please login again.",
          variant: "destructive",
        });
        setTimeout(() => window.location.href = "/api/login", 1000);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to create announcement",
        variant: "destructive",
      });
    },
  });

  const handleCreateAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnnouncement.title || !newAnnouncement.content) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    createAnnouncementMutation.mutate(newAnnouncement);
  };

  const getSubscriptionBadgeColor = (status: string) => {
    switch (status) {
      case 'premium': return 'bg-purple-100 text-purple-800';
      case 'family': return 'bg-blue-100 text-blue-800';
      case 'basic': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAnnouncementBadgeColor = (type: string) => {
    switch (type) {
      case 'error': return 'bg-red-100 text-red-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'success': return 'bg-green-100 text-green-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  useEffect(() => {
    loadConfigStatus();
  }, []);

  const loadConfigStatus = async () => {
    try {
      const response = await fetch('/api/admin/config-status');
      if (response.ok) {
        const status = await response.json();
        setConfigStatus(status);
      }
    } catch (error) {
      console.error('Failed to load config status:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated || !(user as any)?.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-gray-600">Access denied. Admin privileges required.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 overflow-y-auto">
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <Settings className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Admin Portal</h1>
              <p className="text-xs sm:text-sm text-gray-600">My Pocket Sister Management</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4 w-full sm:w-auto">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.open('/documentation.html', '_blank')}
              className="flex-1 sm:flex-none"
            >
              <BookOpen className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="text-xs sm:text-sm">Docs</span>
            </Button>
            <span className="text-xs sm:text-sm text-gray-600 hidden md:inline">Welcome, {(user as any)?.firstName || 'Admin'}</span>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.location.href = "/api/logout"}
              className="flex-1 sm:flex-none"
            >
              <LogOut className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="text-xs sm:text-sm">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-4 sm:py-6 lg:py-8">
        <Tabs defaultValue="users" className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 h-auto">
            <TabsTrigger value="users" className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 text-xs sm:text-sm">
              <Users className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">User Management</span>
              <span className="sm:hidden">Users</span>
            </TabsTrigger>
            <TabsTrigger value="announcements" className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 text-xs sm:text-sm">
              <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Announcements</span>
              <span className="sm:hidden">News</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 text-xs sm:text-sm">
              <Bell className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Push Notifications</span>
              <span className="sm:hidden">Push</span>
            </TabsTrigger>
            <TabsTrigger value="usage" className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 text-xs sm:text-sm">
              <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Message Usage</span>
              <span className="sm:hidden">Usage</span>
            </TabsTrigger>
            <TabsTrigger value="config" className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 text-xs sm:text-sm">
              <Settings className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">API Config</span>
              <span className="sm:hidden">Config</span>
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>Manage user accounts and subscriptions</CardDescription>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full" />
                  </div>
                ) : (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {users.map((user: User) => (
                      <div key={user.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border rounded-lg gap-3 sm:gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-sm sm:text-base truncate">{user.firstName} {user.lastName}</p>
                              <p className="text-xs sm:text-sm text-gray-600 truncate">{user.email}</p>
                              <p className="text-xs text-gray-500">Joined: {new Date(user.createdAt).toLocaleDateString()}</p>
                            </div>
                            <div className="flex flex-wrap gap-2 sm:gap-3">
                              <Badge className={getSubscriptionBadgeColor(user.subscriptionStatus)}>
                                {user.subscriptionStatus}
                              </Badge>
                              {user.isAdmin && (
                                <Badge variant="secondary">Admin</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Select
                            value={user.subscriptionStatus}
                            onValueChange={(status) => 
                              updateSubscriptionMutation.mutate({ userId: user.id, status })
                            }
                          >
                            <SelectTrigger className="w-full sm:w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="free">Free</SelectItem>
                              <SelectItem value="basic">Basic</SelectItem>
                              <SelectItem value="premium">Premium</SelectItem>
                              <SelectItem value="family">Family</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Announcements Tab */}
          <TabsContent value="announcements">
            <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Create Announcement</CardTitle>
                  <CardDescription>Broadcast messages to users</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateAnnouncement} className="space-y-4">
                    <div>
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        value={newAnnouncement.title}
                        onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                        placeholder="Announcement title"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="content">Message</Label>
                      <Textarea
                        id="content"
                        value={newAnnouncement.content}
                        onChange={(e) => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })}
                        placeholder="Your announcement message"
                        rows={4}
                        required
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="type">Type</Label>
                        <Select
                          value={newAnnouncement.type}
                          onValueChange={(type) => setNewAnnouncement({ ...newAnnouncement, type })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="info">Info</SelectItem>
                            <SelectItem value="success">Success</SelectItem>
                            <SelectItem value="warning">Warning</SelectItem>
                            <SelectItem value="error">Error</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="audience">Target Audience</Label>
                        <Select
                          value={newAnnouncement.targetAudience}
                          onValueChange={(targetAudience) => setNewAnnouncement({ ...newAnnouncement, targetAudience })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Users</SelectItem>
                            <SelectItem value="free">Free Users</SelectItem>
                            <SelectItem value="basic">Basic Users</SelectItem>
                            <SelectItem value="premium">Premium Users</SelectItem>
                            <SelectItem value="family">Family Users</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={createAnnouncementMutation.isPending}
                    >
                      {createAnnouncementMutation.isPending ? "Creating..." : "Create Announcement"}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Announcements</CardTitle>
                  <CardDescription>View all announcements</CardDescription>
                </CardHeader>
                <CardContent>
                  {announcementsLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full" />
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {announcements.map((announcement: Announcement) => (
                        <div key={announcement.id} className="p-4 border rounded-lg">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-medium">{announcement.title}</h4>
                            <div className="flex space-x-2">
                              <Badge className={getAnnouncementBadgeColor(announcement.type)}>
                                {announcement.type}
                              </Badge>
                              <Badge variant="outline">{announcement.targetAudience}</Badge>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{announcement.content}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(announcement.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Payment Settings Tab */}
          <TabsContent value="payments">
            <Card>
              <CardHeader>
                <CardTitle>Payment Configuration</CardTitle>
                <CardDescription>Manage Stripe settings and pricing plans</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <h3 className="text-lg font-semibold">Basic Plan</h3>
                          <p className="text-2xl font-bold text-green-600">$4.99/mo</p>
                          <p className="text-sm text-gray-600">Entry level access</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <h3 className="text-lg font-semibold">Premium Plan</h3>
                          <p className="text-2xl font-bold text-purple-600">$9.99/mo</p>
                          <p className="text-sm text-gray-600">Full features</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <h3 className="text-lg font-semibold">Family Plan</h3>
                          <p className="text-2xl font-bold text-blue-600">$19.99/mo</p>
                          <p className="text-sm text-gray-600">Up to 5 children</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">Stripe Configuration</h4>
                    <p className="text-sm text-blue-700">
                      To modify pricing plans, update your Stripe dashboard and corresponding price IDs in the database.
                      Current environment: <code className="bg-blue-100 px-2 py-1 rounded">
                        {process.env.NODE_ENV || 'development'}
                      </code>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Push Notifications */}
          <TabsContent value="notifications" className="space-y-6">
            <AdminNotificationBroadcast />
          </TabsContent>

          {/* Message Usage Tab */}
          <TabsContent value="usage">
            <Card>
              <CardHeader>
                <CardTitle>Message Usage Overview</CardTitle>
                <CardDescription>Monitor AI companion message usage across all users</CardDescription>
              </CardHeader>
              <CardContent>
                {usageLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full" />
                  </div>
                ) : (
                  <div className="space-y-6">
                    {usageOverview.map((userUsage) => (
                      <div key={userUsage.userId} className="border rounded-lg p-6 bg-gray-50">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="font-semibold text-lg">{userUsage.userName || 'Unnamed User'}</h3>
                            <p className="text-sm text-gray-600">{userUsage.userEmail}</p>
                          </div>
                          <Badge variant="outline">
                            {userUsage.profiles.length} {userUsage.profiles.length === 1 ? 'Child' : 'Children'}
                          </Badge>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                          {userUsage.profiles.map((profile) => {
                            const usagePercentage = (profile.messageCount / profile.monthlyLimit) * 100;
                            const isOverLimit = usagePercentage >= 100;
                            const isApproachingLimit = usagePercentage >= 80;

                            return (
                              <div key={profile.childId} className="bg-white p-4 rounded-lg border">
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="font-medium">{profile.childName}</h4>
                                  {isOverLimit ? (
                                    <Badge variant="destructive">
                                      <AlertTriangle className="h-3 w-3 mr-1" />
                                      Over Limit
                                    </Badge>
                                  ) : isApproachingLimit ? (
                                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                                      Warning
                                    </Badge>
                                  ) : (
                                    <Badge variant="default" className="bg-green-100 text-green-800">
                                      Good
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600 mb-3">
                                  Companion: {profile.companionName}
                                </p>
                                <div className="space-y-2">
                                  <div className="flex justify-between text-sm">
                                    <span>Messages Used:</span>
                                    <span className="font-medium">
                                      {profile.messageCount} / {profile.monthlyLimit}
                                    </span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div 
                                      className={`h-2 rounded-full ${
                                        isOverLimit ? 'bg-red-500' : 
                                        isApproachingLimit ? 'bg-yellow-500' : 'bg-green-500'
                                      }`}
                                      style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                                    />
                                  </div>
                                  <div className="flex justify-between text-xs text-gray-500">
                                    <span>{Math.round(usagePercentage)}% used</span>
                                    <span>
                                      Reset: {new Date(profile.lastReset).toLocaleDateString()}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* API Configuration Tab */}
          <TabsContent value="config">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Complete Feature Testing Suite</CardTitle>
                <CardDescription>
                  Test all features of the My Pocket Sister application from this admin portal
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  <Button 
                    variant="outline" 
                    className="flex flex-col items-center p-4 h-auto"
                    onClick={() => window.open('/admin-dashboard', '_blank')}
                    data-testid="button-admin-dashboard"
                  >
                    <Settings className="h-6 w-6 mb-2" />
                    <span className="font-medium">Admin Dashboard</span>
                    <span className="text-xs text-gray-500">System testing & config</span>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="flex flex-col items-center p-4 h-auto"
                    onClick={() => window.open('/', '_blank')}
                    data-testid="button-user-app"
                  >
                    <Users className="h-6 w-6 mb-2" />
                    <span className="font-medium">User App</span>
                    <span className="text-xs text-gray-500">Test user experience</span>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="flex flex-col items-center p-4 h-auto"
                    onClick={() => window.open('/companion', '_blank')}
                    data-testid="button-ai-companion"
                  >
                    <MessageSquare className="h-6 w-6 mb-2" />
                    <span className="font-medium">AI Companion</span>
                    <span className="text-xs text-gray-500">Test conversations</span>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="flex flex-col items-center p-4 h-auto"
                    onClick={() => window.open('/avatar-creator', '_blank')}
                    data-testid="button-avatar-creator"
                  >
                    <Users className="h-6 w-6 mb-2" />
                    <span className="font-medium">Avatar Creator</span>
                    <span className="text-xs text-gray-500">Test avatar system</span>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="flex flex-col items-center p-4 h-auto"
                    onClick={() => window.open('/parent-portal', '_blank')}
                    data-testid="button-parent-portal"
                  >
                    <Shield className="h-6 w-6 mb-2" />
                    <span className="font-medium">Parent Portal</span>
                    <span className="text-xs text-gray-500">Test parent controls</span>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="flex flex-col items-center p-4 h-auto"
                    onClick={() => window.open('/subscription', '_blank')}
                    data-testid="button-subscription"
                  >
                    <Settings className="h-6 w-6 mb-2" />
                    <span className="font-medium">Subscription</span>
                    <span className="text-xs text-gray-500">Test payment flow</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>API Configuration</CardTitle>
                  <CardDescription>Configure external API integrations</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-medium text-blue-900 mb-2">Environment Variables</h4>
                    <p className="text-sm text-blue-700 mb-3">
                      API keys are managed through Replit's Secrets tool for security.
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.open('https://docs.replit.com/programming-ide/workspace-features/storing-sensitive-information-environment-variables', '_blank')}
                    >
                      View Secrets Documentation
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">ElevenLabs Voice API</h4>
                        <Badge variant={configStatus.elevenlabs ? "default" : "secondary"}>
                          {configStatus.elevenlabs ? "Configured" : "Not Set"}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">
                        Required for high-quality voice synthesis. Falls back to browser voice if not configured.
                      </p>
                      <p className="text-xs text-gray-500">
                        Environment Variable: <code>ELEVENLABS_API_KEY</code>
                      </p>
                    </div>

                    <div className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">OpenAI API</h4>
                        <Badge variant={configStatus.openai ? "default" : "secondary"}>
                          {configStatus.openai ? "Configured" : "Not Set"}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">
                        Optional for advanced AI features. Platform uses built-in responses if not configured.
                      </p>
                      <p className="text-xs text-gray-500">
                        Environment Variable: <code>OPENAI_API_KEY</code>
                      </p>
                    </div>

                    <div className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">Google Gemini API</h4>
                        <Badge variant={configStatus.gemini ? "default" : "secondary"}>
                          {configStatus.gemini ? "Configured" : "Not Set"}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">
                        Alternative AI provider for enhanced responses and multimodal features.
                      </p>
                      <p className="text-xs text-gray-500">
                        Environment Variable: <code>GEMINI_API_KEY</code>
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Setup Guide</CardTitle>
                  <CardDescription>How to configure API keys</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <h4 className="font-medium">1. Access Replit Secrets</h4>
                    <p className="text-sm text-gray-600">
                      Click the "Secrets" tab in the left sidebar or use Tools → Secrets
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium">2. Add API Keys</h4>
                    <p className="text-sm text-gray-600">
                      Add these environment variables:
                    </p>
                    <div className="bg-gray-50 p-3 rounded-lg text-sm font-mono">
                      <div>ELEVENLABS_API_KEY</div>
                      <div>OPENAI_API_KEY (optional)</div>
                      <div>GEMINI_API_KEY (optional)</div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium">3. Restart Application</h4>
                    <p className="text-sm text-gray-600">
                      Click the "Stop" button then "Run" to reload environment variables
                    </p>
                  </div>

                  <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                    <p className="text-sm text-amber-800">
                      <strong>Note:</strong> Changes require an application restart to take effect.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}