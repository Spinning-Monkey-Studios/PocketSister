import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import TrialBanner from "@/components/trial-banner";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Heart, MessageCircle, User, Sparkles, Plus, LogOut, Settings, Crown, Target, TrendingUp, Trophy, Calendar, TestTube } from "lucide-react";
import logoPath from "@assets/logo2_1753946260065.png";

interface ChildProfile {
  id: string;
  name: string;
  age: number;
  companionName: string;
  avatarImageUrl?: string;
}

export default function Home() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'affirmations' | 'mood' | 'goals'>('dashboard');

  // Fetch child profiles
  const { data: profiles = [], isLoading: profilesLoading } = useQuery<ChildProfile[]>({
    queryKey: ["/api/child-profiles"],
    enabled: isAuthenticated,
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please log in to continue.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 1000);
    }
  }, [isAuthenticated, isLoading, toast]);

  if (isLoading || profilesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-gray-600">Please log in to continue.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const hasProfiles = profiles.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <img src={logoPath} alt="My Pocket Sister" className="h-10 w-10 rounded-lg" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Pocket Sister</h1>
              <p className="text-sm text-gray-600">Welcome back, {(user as any)?.firstName || 'there'}!</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {(user as any)?.isAdmin && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.location.href = "/admin"}
                className="text-purple-600 border-purple-200"
              >
                <Crown className="h-4 w-4 mr-2" />
                Admin
              </Button>
            )}
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.location.href = "/api/logout"}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        
        {/* Trial Banner */}
        <TrialBanner />
        
        {!hasProfiles ? (
          /* No profiles - onboarding */
          <div className="max-w-2xl mx-auto text-center">
            <Card className="border-purple-200 shadow-lg">
              <CardHeader className="pb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-3xl text-gray-800">Welcome to My Pocket Sister!</CardTitle>
                <CardDescription className="text-lg text-gray-600">
                  Let's create your first AI companion to start your journey together.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-3 gap-4 text-sm">
                  <div className="flex flex-col items-center p-4 border rounded-lg bg-pink-50">
                    <Heart className="h-8 w-8 text-pink-500 mb-2" />
                    <span className="font-medium">Personalized</span>
                    <span className="text-gray-600 text-center">Customize personality and interests</span>
                  </div>
                  <div className="flex flex-col items-center p-4 border rounded-lg bg-purple-50">
                    <MessageCircle className="h-8 w-8 text-purple-500 mb-2" />
                    <span className="font-medium">Always Available</span>
                    <span className="text-gray-600 text-center">24/7 emotional support and guidance</span>
                  </div>
                  <div className="flex flex-col items-center p-4 border rounded-lg bg-blue-50">
                    <Settings className="h-8 w-8 text-blue-500 mb-2" />
                    <span className="font-medium">Safe & Secure</span>
                    <span className="text-gray-600 text-center">Parent-monitored conversations</span>
                  </div>
                </div>
                
                <Button 
                  size="lg"
                  onClick={() => window.location.href = "/setup"}
                  className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Create My First Companion
                </Button>
                
                <p className="text-xs text-gray-500">
                  This will take about 3 minutes to set up your personalized AI companion.
                </p>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* Has profiles - dashboard */
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-bold text-gray-800">Your Companions</h2>
                <p className="text-gray-600">Choose a companion to chat with or create a new one.</p>
              </div>
              <Button 
                onClick={() => window.location.href = "/setup"}
                className="bg-purple-500 hover:bg-purple-600"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Companion
              </Button>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {profiles.map((profile: ChildProfile) => (
                <Card key={profile.id} className="border-2 border-gray-200 hover:border-purple-300 hover:shadow-lg transition-all cursor-pointer">
                  <CardHeader className="text-center pb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-pink-400 to-purple-400 rounded-full flex items-center justify-center mx-auto mb-3">
                      {profile.avatarImageUrl ? (
                        <img 
                          src={profile.avatarImageUrl} 
                          alt={profile.companionName}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <Heart className="h-8 w-8 text-white" />
                      )}
                    </div>
                    <CardTitle className="text-xl">{profile.companionName}</CardTitle>
                    <CardDescription>
                      Companion for {profile.name} ({profile.age} years old)
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button 
                      className="w-full"
                      onClick={() => window.location.href = `/chat?profile=${profile.id}`}
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Start Chatting
                    </Button>
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => window.location.href = `/avatar?profile=${profile.id}`}
                      >
                        <User className="h-4 w-4 mr-1" />
                        Avatar
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => window.location.href = `/parent-portal?profile=${profile.id}`}
                      >
                        <Settings className="h-4 w-4 mr-1" />
                        Settings
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="border-blue-200 bg-blue-50/50">
                <CardContent className="pt-6">
                  <div className="text-center space-y-3">
                    <User className="h-8 w-8 text-blue-500 mx-auto" />
                    <h3 className="font-semibold">Parent Portal</h3>
                    <p className="text-sm text-gray-600">Monitor conversations and set preferences</p>
                    <Button variant="outline" size="sm" onClick={() => window.location.href = "/parent-portal"}>
                      Open Portal
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-green-200 bg-green-50/50">
                <CardContent className="pt-6">
                  <div className="text-center space-y-3">
                    <Crown className="h-8 w-8 text-green-500 mx-auto" />
                    <h3 className="font-semibold">Subscription</h3>
                    <p className="text-sm text-gray-600">Manage your plan and billing</p>
                    <Button variant="outline" size="sm" onClick={() => window.location.href = "/subscribe"}>
                      View Plans
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-purple-200 bg-purple-50/50">
                <CardContent className="pt-6">
                  <div className="text-center space-y-3">
                    <Sparkles className="h-8 w-8 text-purple-500 mx-auto" />
                    <h3 className="font-semibold">Avatar Creator</h3>
                    <p className="text-sm text-gray-600">Design custom avatars for your companions</p>
                    <Button variant="outline" size="sm" onClick={() => window.location.href = "/avatar"}>
                      Create Avatar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
