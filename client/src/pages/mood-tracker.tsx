import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Smile, Meh, Frown, TrendingUp, Calendar, Heart } from "lucide-react";

interface MoodEntry {
  id: string;
  childId: string;
  mood: string;
  moodScore: number;
  notes?: string;
  entryDate: string;
  createdAt: string;
}

const moodOptions = [
  { mood: "amazing", score: 5, icon: "😍", color: "bg-green-500", label: "Amazing!" },
  { mood: "happy", score: 4, icon: "😊", color: "bg-green-400", label: "Happy" },
  { mood: "okay", score: 3, icon: "😐", color: "bg-yellow-400", label: "Okay" },
  { mood: "sad", score: 2, icon: "😔", color: "bg-orange-400", label: "Sad" },
  { mood: "terrible", score: 1, icon: "😢", color: "bg-red-400", label: "Terrible" }
];

export default function MoodTracker({ childId }: { childId: string }) {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedMood, setSelectedMood] = useState<{ mood: string; score: number } | null>(null);
  const [notes, setNotes] = useState("");

  const { data: moodHistory, isLoading } = useQuery({
    queryKey: ['/api/mood-tracking', childId],
    enabled: !!childId && isAuthenticated,
    retry: false,
  });

  const { data: todaysMood } = useQuery({
    queryKey: ['/api/mood-entry/today', childId],
    enabled: !!childId && isAuthenticated,
    retry: false,
  });

  const createMoodMutation = useMutation({
    mutationFn: async (moodData: { childId: string; mood: string; moodScore: number; notes?: string }) => {
      return await apiRequest('POST', '/api/mood-entry', moodData);
    },
    onSuccess: () => {
      toast({
        title: "Mood logged!",
        description: "Thanks for sharing how you're feeling today.",
      });
      setSelectedMood(null);
      setNotes("");
      queryClient.invalidateQueries({ queryKey: ['/api/mood-tracking', childId] });
      queryClient.invalidateQueries({ queryKey: ['/api/mood-entry/today', childId] });
    },
    onError: (error: any) => {
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        toast({
          title: "Please log in",
          description: "You need to be logged in to track your mood.",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      
      if (error.message.includes('upgradeRequired')) {
        toast({
          title: "Upgrade Required", 
          description: "Mood tracking requires a Premium subscription.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Error",
        description: "Failed to log your mood. Please try again.",
        variant: "destructive",
      });
    },
  });

  const getMoodStats = () => {
    if (!moodHistory || moodHistory.length === 0) return null;
    
    const totalEntries = moodHistory.length;
    const averageScore = moodHistory.reduce((sum: number, entry: MoodEntry) => sum + entry.moodScore, 0) / totalEntries;
    const recentTrend = moodHistory.slice(-7); // Last 7 days
    
    return {
      totalEntries,
      averageScore: Math.round(averageScore * 10) / 10,
      recentAverage: recentTrend.length > 0 
        ? Math.round((recentTrend.reduce((sum: number, entry: MoodEntry) => sum + entry.moodScore, 0) / recentTrend.length) * 10) / 10
        : 0
    };
  };

  const stats = getMoodStats();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Mood Tracker</h2>
        <Badge variant="secondary" className="text-sm">
          <Heart className="w-4 h-4 mr-1" />
          Premium Feature
        </Badge>
      </div>

      {/* Today's Mood Entry */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="w-5 h-5 mr-2 text-blue-500" />
            How are you feeling today?
          </CardTitle>
          <CardDescription>
            Track your emotions to help me understand you better
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {todaysMood ? (
            <div className="text-center py-4">
              <div className="text-4xl mb-2">
                {moodOptions.find(opt => opt.mood === todaysMood.mood)?.icon}
              </div>
              <p className="text-lg font-medium text-gray-800 dark:text-gray-200">
                You're feeling {todaysMood.mood} today
              </p>
              {todaysMood.notes && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  "{todaysMood.notes}"
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-5 gap-2">
                {moodOptions.map((option) => (
                  <button
                    key={option.mood}
                    onClick={() => setSelectedMood({ mood: option.mood, score: option.score })}
                    className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                      selectedMood?.mood === option.mood
                        ? 'border-pink-500 bg-pink-50 dark:bg-pink-950'
                        : 'border-gray-200 dark:border-gray-700 hover:border-pink-300'
                    }`}
                  >
                    <div className="text-3xl mb-2">{option.icon}</div>
                    <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      {option.label}
                    </div>
                  </button>
                ))}
              </div>
              
              {selectedMood && (
                <div className="space-y-4">
                  <Textarea
                    placeholder="Want to tell me more about how you're feeling? (optional)"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="resize-none"
                    rows={3}
                  />
                  
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedMood(null);
                        setNotes("");
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => createMoodMutation.mutate({
                        childId,
                        mood: selectedMood.mood,
                        moodScore: selectedMood.score,
                        notes: notes.trim() || undefined
                      })}
                      disabled={createMoodMutation.isPending}
                    >
                      {createMoodMutation.isPending ? 'Saving...' : 'Log Mood'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mood Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <TrendingUp className="w-8 h-8 text-blue-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Average Mood</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {stats.averageScore}/5
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Calendar className="w-8 h-8 text-green-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Days Tracked</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {stats.totalEntries}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Smile className="w-8 h-8 text-purple-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Recent Trend</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {stats.recentAverage}/5
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Mood History */}
      {moodHistory && moodHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Moods</CardTitle>
            <CardDescription>Your mood history over the past 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {moodHistory.slice(0, 7).map((entry: MoodEntry) => {
                const moodOption = moodOptions.find(opt => opt.mood === entry.mood);
                return (
                  <div key={entry.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">{moodOption?.icon}</div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {moodOption?.label}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(entry.entryDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    {entry.notes && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">
                        "{entry.notes}"
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}