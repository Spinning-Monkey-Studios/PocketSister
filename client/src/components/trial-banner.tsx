import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Clock, Gift, CreditCard, Star, Zap, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function TrialBanner() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Get trial status
  const { data: trialStatus, isLoading } = useQuery({
    queryKey: ["/api/subscription/trial-status"],
    refetchInterval: 5000, // Check every 5 seconds for real-time updates
  });

  // Start trial mutation
  const startTrialMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/subscription/start-trial");
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Free Trial Started!",
        description: data.message || "Your 7-day free trial is now active.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/subscription/trial-status"] });
    },
    onError: (error: any) => {
      toast({
        title: "Trial Start Failed",
        description: error.message || "Failed to start trial. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return null; // Don't show banner while loading
  }

  // Don't show banner if user has a paid subscription
  if (trialStatus?.hasSubscription && !trialStatus?.isTrialing) {
    return null;
  }

  // Show trial CTA if user can start trial
  if (trialStatus?.canStartTrial && trialStatus?.trialEligible) {
    return (
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Gift className="h-6 w-6 text-purple-600" />
              <div>
                <CardTitle className="text-purple-800">Start Your Free Trial</CardTitle>
                <CardDescription className="text-purple-600">
                  Try My Pocket Sister free for 7 days!
                </CardDescription>
              </div>
            </div>
            <Badge variant="secondary" className="bg-purple-100 text-purple-800">
              <Star className="h-3 w-3 mr-1" />
              Free
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-purple-600" />
              <span className="text-sm text-purple-700">500 free tokens</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-purple-600" />
              <span className="text-sm text-purple-700">7 days access</span>
            </div>
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-purple-600" />
              <span className="text-sm text-purple-700">No credit card required</span>
            </div>
          </div>
          
          <Button
            onClick={() => startTrialMutation.mutate()}
            disabled={startTrialMutation.isPending}
            className="w-full bg-purple-600 hover:bg-purple-700"
            size="lg"
          >
            {startTrialMutation.isPending ? (
              <>
                <Gift className="mr-2 h-4 w-4 animate-pulse" />
                Starting Trial...
              </>
            ) : (
              <>
                <Gift className="mr-2 h-4 w-4" />
                Start Free Trial
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Show trial status if user is trialing
  if (trialStatus?.isTrialing && trialStatus?.subscription) {
    const subscription = trialStatus.subscription;
    const startDate = new Date(subscription.currentPeriodStart);
    const endDate = new Date(subscription.currentPeriodEnd);
    const now = new Date();
    
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysElapsed = Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysRemaining = Math.max(0, totalDays - daysElapsed);
    const progressPercentage = Math.min(100, (daysElapsed / totalDays) * 100);
    
    const isExpiringSoon = daysRemaining <= 2;
    
    return (
      <Card className={`border-2 ${isExpiringSoon ? 'bg-orange-50 border-orange-200' : 'bg-green-50 border-green-200'}`}>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock className={`h-6 w-6 ${isExpiringSoon ? 'text-orange-600' : 'text-green-600'}`} />
              <div>
                <CardTitle className={isExpiringSoon ? 'text-orange-800' : 'text-green-800'}>
                  Free Trial Active
                </CardTitle>
                <CardDescription className={isExpiringSoon ? 'text-orange-600' : 'text-green-600'}>
                  {daysRemaining === 0 ? 'Expires today' : 
                   daysRemaining === 1 ? 'Expires tomorrow' :
                   `${daysRemaining} days remaining`}
                </CardDescription>
              </div>
            </div>
            <Badge 
              variant={isExpiringSoon ? "destructive" : "default"}
              className={isExpiringSoon ? '' : 'bg-green-100 text-green-800'}
            >
              {isExpiringSoon ? 'Expiring Soon' : 'Active'}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className={isExpiringSoon ? 'text-orange-700' : 'text-green-700'}>
                Trial Progress
              </span>
              <span className={isExpiringSoon ? 'text-orange-700' : 'text-green-700'}>
                Day {daysElapsed} of {totalDays}
              </span>
            </div>
            <Progress 
              value={progressPercentage} 
              className={`h-2 ${isExpiringSoon ? 'bg-orange-100' : 'bg-green-100'}`}
            />
          </div>
          
          {isExpiringSoon && (
            <div className="bg-white p-3 rounded-lg border border-orange-200">
              <p className="text-sm text-orange-800 mb-2 font-medium">
                Don't lose access to your AI companion!
              </p>
              <Button
                onClick={() => window.location.href = '/subscribe'}
                className="w-full bg-orange-600 hover:bg-orange-700"
                size="sm"
              >
                <CreditCard className="mr-2 h-4 w-4" />
                Upgrade to Continue
              </Button>
            </div>
          )}
          
          {!isExpiringSoon && daysRemaining <= 5 && (
            <div className="bg-white p-3 rounded-lg border border-green-200">
              <p className="text-sm text-green-800 mb-2">
                Enjoying your trial? Upgrade anytime to continue your journey.
              </p>
              <Button
                variant="outline"
                onClick={() => window.location.href = '/subscribe'}
                className="w-full border-green-300 text-green-700 hover:bg-green-50"
                size="sm"
              >
                <Star className="mr-2 h-4 w-4" />
                View Plans
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Show trial expired message
  if (trialStatus?.trialExpired) {
    return (
      <Card className="bg-red-50 border-red-200">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Clock className="h-6 w-6 text-red-600" />
            <div>
              <CardTitle className="text-red-800">Trial Expired</CardTitle>
              <CardDescription className="text-red-600">
                Your free trial has ended. Upgrade to continue using My Pocket Sister.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <Button
            onClick={() => window.location.href = '/subscribe'}
            className="w-full bg-red-600 hover:bg-red-700"
            size="lg"
          >
            <CreditCard className="mr-2 h-4 w-4" />
            Choose Your Plan
          </Button>
        </CardContent>
      </Card>
    );
  }

  return null;
}