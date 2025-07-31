import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import DailyAffirmations from "./daily-affirmations";
import MoodTracker from "./mood-tracker";
import { useToast } from "@/hooks/use-toast";
import { Heart, Sparkles, Star, Trophy, BookOpen } from "lucide-react";

interface DailyAffirmation {
  id: string;
  childId: string;
  message: string;
  category: string;
  sentAt: string;
  wasRead: boolean;
}

const categoryIcons = {
  motivation: Trophy,
  confidence: Star,
  friendship: Heart,
  school: BookOpen,
  general: Sparkles
};

const categoryColors = {
  motivation: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  confidence: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300", 
  friendship: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300",
  school: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  general: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
};

export default function DailyAffirmations({ childId }: { childId: string }) {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: affirmations, isLoading } = useQuery({
    queryKey: ['/api/daily-affirmations', childId],
    enabled: !!childId && isAuthenticated,
    retry: false,
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (affirmationId: string) => {
      await apiRequest('PUT', `/api/daily-affirmations/${affirmationId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/daily-affirmations', childId] });
    },
    onError: (error: any) => {
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        toast({
          title: "Please log in",
          description: "You need to be logged in to access daily affirmations.",
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
          description: "This feature requires a Premium subscription.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Error",
        description: "Failed to mark affirmation as read. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      </div>
    );
  }

  if (!affirmations || affirmations.length === 0) {
    return (
      <div className="text-center py-8">
        <Sparkles className="w-12 h-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">No affirmations today</h3>
        <p className="text-gray-500 dark:text-gray-400">Check back tomorrow for your daily encouragement!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Today's Affirmations</h2>
        <Badge variant="secondary" className="text-sm">
          {affirmations.length} message{affirmations.length !== 1 ? 's' : ''}
        </Badge>
      </div>
      
      <div className="space-y-4">
        {affirmations.map((affirmation: DailyAffirmation) => {
          const IconComponent = categoryIcons[affirmation.category as keyof typeof categoryIcons] || Sparkles;
          const colorClass = categoryColors[affirmation.category as keyof typeof categoryColors] || categoryColors.general;
          
          return (
            <Card 
              key={affirmation.id} 
              className={`transition-all duration-200 hover:shadow-md ${
                !affirmation.wasRead ? 'ring-2 ring-pink-200 dark:ring-pink-800' : ''
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <IconComponent className="w-5 h-5 text-pink-500" />
                    <Badge className={colorClass}>
                      {affirmation.category}
                    </Badge>
                  </div>
                  {!affirmation.wasRead && (
                    <div className="w-2 h-2 bg-pink-500 rounded-full" />
                  )}
                </div>
              </CardHeader>
              
              <CardContent>
                <p className="text-lg text-gray-800 dark:text-gray-200 leading-relaxed mb-4">
                  {affirmation.message}
                </p>
                
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(affirmation.sentAt).toLocaleDateString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true
                    })}
                  </p>
                  
                  {!affirmation.wasRead && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => markAsReadMutation.mutate(affirmation.id)}
                      disabled={markAsReadMutation.isPending}
                      className="text-pink-600 border-pink-300 hover:bg-pink-50 dark:text-pink-400 dark:border-pink-700 dark:hover:bg-pink-950"
                    >
                      {markAsReadMutation.isPending ? 'Marking...' : 'Mark as Read'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      {affirmations.length > 0 && (
        <div className="text-center pt-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Remember: You are amazing, and these messages are just reminders of what you already are! ✨
          </p>
        </div>
      )}
    </div>
  );
}