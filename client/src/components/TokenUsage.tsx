import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Zap, 
  Crown, 
  ShoppingCart, 
  TrendingUp, 
  Calendar,
  AlertTriangle,
  Sparkles
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface TokenUsageProps {
  childId: string;
  onUpgrade?: () => void;
  onPurchaseTokens?: () => void;
}

interface TokenStatus {
  hasTokens: boolean;
  remainingTokens: number;
  monthlyLimit: number;
  currentUsage: number;
  resetDate: string;
  subscription?: {
    planName: string;
    overageRate: number;
    canPurchaseTokens: boolean;
  };
}

export function TokenUsage({ childId, onUpgrade, onPurchaseTokens }: TokenUsageProps) {
  const { data: tokenStatus, isLoading } = useQuery<TokenStatus>({
    queryKey: ['token-status', childId],
    queryFn: async () => {
      const response = await fetch(`/api/tokens/status/${childId}`);
      if (!response.ok) throw new Error('Failed to fetch token status');
      return response.json();
    },
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  if (isLoading || !tokenStatus) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-full"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const usagePercentage = (tokenStatus.currentUsage / tokenStatus.monthlyLimit) * 100;
  const isLowTokens = usagePercentage > 80;
  const isOutOfTokens = !tokenStatus.hasTokens;
  
  const resetDate = new Date(tokenStatus.resetDate).toLocaleDateString();

  return (
    <Card className={`w-full ${isOutOfTokens ? 'border-red-300 bg-red-50' : isLowTokens ? 'border-yellow-300 bg-yellow-50' : ''}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div>
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className={`h-5 w-5 ${isOutOfTokens ? 'text-red-500' : isLowTokens ? 'text-yellow-500' : 'text-blue-500'}`} />
            Token Usage
          </CardTitle>
          <CardDescription>
            {tokenStatus.subscription ? (
              <span className="flex items-center gap-1">
                <Crown className="h-4 w-4 text-yellow-500" />
                {tokenStatus.subscription.planName} Plan
              </span>
            ) : (
              'Basic Plan'
            )}
          </CardDescription>
        </div>
        
        {isOutOfTokens && (
          <Badge variant="destructive" className="flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            No Tokens
          </Badge>
        )}
        
        {isLowTokens && !isOutOfTokens && (
          <Badge variant="outline" className="border-yellow-500 text-yellow-700">
            Low Tokens
          </Badge>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Used: {tokenStatus.currentUsage.toLocaleString()}</span>
            <span>Limit: {tokenStatus.monthlyLimit.toLocaleString()}</span>
          </div>
          <Progress 
            value={usagePercentage} 
            className={`h-3 ${isOutOfTokens ? 'bg-red-100' : isLowTokens ? 'bg-yellow-100' : ''}`}
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>{tokenStatus.remainingTokens.toLocaleString()} remaining</span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Resets {resetDate}
            </span>
          </div>
        </div>

        {/* Restriction Warning */}
        {isOutOfTokens && (
          <div className="bg-red-100 border border-red-300 rounded-lg p-3">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-red-800">Token Limit Reached</h4>
                <p className="text-sm text-red-700 mt-1">
                  AI chat, image generation, and premium features are temporarily unavailable. 
                  {tokenStatus.subscription?.canPurchaseTokens ? 
                    ' Purchase more tokens or wait until next month.' : 
                    ' Upgrade to premium to buy additional tokens.'
                  }
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Low Token Warning */}
        {isLowTokens && !isOutOfTokens && (
          <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-3">
            <div className="flex items-start gap-3">
              <TrendingUp className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-yellow-800">Running Low on Tokens</h4>
                <p className="text-sm text-yellow-700 mt-1">
                  You're using {Math.round(usagePercentage)}% of your monthly allowance. 
                  Consider purchasing more tokens to avoid interruptions.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          {/* Purchase Tokens Button */}
          {tokenStatus.subscription?.canPurchaseTokens ? (
            <Button 
              onClick={onPurchaseTokens}
              className="flex-1 flex items-center gap-2"
              variant={isOutOfTokens ? "default" : "outline"}
            >
              <ShoppingCart className="h-4 w-4" />
              Buy Tokens
              <span className="text-xs opacity-75">
                ${tokenStatus.subscription.overageRate}/token
              </span>
            </Button>
          ) : (
            <Button 
              onClick={onUpgrade}
              className="flex-1 flex items-center gap-2"
              variant={isOutOfTokens ? "default" : "outline"}
            >
              <Crown className="h-4 w-4" />
              Upgrade Plan
            </Button>
          )}

          {/* View Usage Analytics */}
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => {
              // This would open a detailed usage analytics modal
              console.log('View usage analytics for child:', childId);
            }}
          >
            <TrendingUp className="h-4 w-4" />
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4 pt-2 border-t">
          <div className="text-center">
            <div className="text-lg font-semibold text-blue-600">
              {Math.round(usagePercentage)}%
            </div>
            <div className="text-xs text-gray-500">Used This Month</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-green-600">
              {Math.max(0, Math.floor((tokenStatus.monthlyLimit - tokenStatus.currentUsage) / 100))}
            </div>
            <div className="text-xs text-gray-500">Chats Remaining*</div>
          </div>
        </div>
        
        <p className="text-xs text-gray-400 text-center">
          *Estimated based on average 100 tokens per chat
        </p>
      </CardContent>
    </Card>
  );
}

export function TokenStatusBadge({ childId }: { childId: string }) {
  const { data: tokenStatus } = useQuery<TokenStatus>({
    queryKey: ['token-status', childId],
    queryFn: async () => {
      const response = await fetch(`/api/tokens/status/${childId}`);
      if (!response.ok) throw new Error('Failed to fetch token status');
      return response.json();
    },
    refetchInterval: 60000 // Refresh every minute
  });

  if (!tokenStatus) return null;

  const usagePercentage = (tokenStatus.currentUsage / tokenStatus.monthlyLimit) * 100;
  
  if (!tokenStatus.hasTokens) {
    return (
      <Badge variant="destructive" className="flex items-center gap-1">
        <AlertTriangle className="h-3 w-3" />
        No Tokens
      </Badge>
    );
  }
  
  if (usagePercentage > 80) {
    return (
      <Badge variant="outline" className="border-yellow-500 text-yellow-700">
        <Zap className="h-3 w-3 mr-1" />
        {Math.round(usagePercentage)}% Used
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="text-green-700">
      <Sparkles className="h-3 w-3 mr-1" />
      {tokenStatus.remainingTokens.toLocaleString()} left
    </Badge>
  );
}