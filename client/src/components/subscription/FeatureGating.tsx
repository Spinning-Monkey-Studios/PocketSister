import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lock, Crown, Users, Zap, Star } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface FeatureGatingProps {
  featureId: string;
  userTier: 'basic' | 'premium' | 'family';
  children: ReactNode;
  className?: string;
  showUpgradePrompt?: boolean;
}

interface SubscriptionTier {
  id: string;
  name: string;
  price: { monthly: number; yearly: number };
  description: string;
  upgradePrompt: string;
}

const getTierIcon = (tier: string) => {
  switch (tier) {
    case 'premium': return <Crown className="w-4 h-4" />;
    case 'family': return <Users className="w-4 h-4" />;
    default: return <Star className="w-4 h-4" />;
  }
};

const getTierColor = (tier: string) => {
  switch (tier) {
    case 'premium': return 'bg-gradient-to-r from-purple-500 to-pink-500';
    case 'family': return 'bg-gradient-to-r from-blue-500 to-green-500';
    default: return 'bg-gradient-to-r from-gray-500 to-gray-600';
  }
};

export function FeatureGating({ 
  featureId, 
  userTier, 
  children, 
  className = '',
  showUpgradePrompt = true 
}: FeatureGatingProps) {
  
  // Get feature information
  const { data: featureData } = useQuery({
    queryKey: ['/api/features', featureId],
    queryFn: async () => {
      const response = await fetch(`/api/features/${featureId}`);
      return response.json();
    }
  });

  // Get available features for user tier
  const { data: availabilityData } = useQuery({
    queryKey: ['/api/features/available', userTier],
    queryFn: async () => {
      const response = await fetch(`/api/features/available?tier=${userTier}`);
      return response.json();
    }
  });

  if (!featureData?.success || !availabilityData?.success) {
    return <div className={className}>{children}</div>;
  }

  const feature = featureData.feature;
  const isLocked = availabilityData.lockedFeatures.some((f: any) => f.id === featureId);
  
  // If feature is available to user, render normally
  if (!isLocked) {
    return <div className={className}>{children}</div>;
  }

  // Feature is locked - show ghosted version with upgrade prompt
  const requiredTier = feature.subscriptionTier;
  const tierInfo = availabilityData.lockedFeatures.find((f: any) => f.id === featureId);

  return (
    <div className={`relative ${className}`}>
      {/* Ghosted content */}
      <div className="opacity-40 pointer-events-none grayscale">
        {children}
      </div>
      
      {/* Lock overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-black/80 backdrop-blur-sm rounded-lg">
        <Card className="max-w-sm mx-auto">
          <CardHeader className="text-center">
            <div className={`w-16 h-16 mx-auto rounded-full ${getTierColor(requiredTier)} flex items-center justify-center text-white mb-4`}>
              <Lock className="w-8 h-8" />
            </div>
            <CardTitle className="flex items-center justify-center gap-2">
              {getTierIcon(requiredTier)}
              {feature.name}
            </CardTitle>
            <CardDescription>
              {feature.description}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="text-center space-y-4">
            <Badge 
              variant="secondary" 
              className={`${getTierColor(requiredTier)} text-white border-0`}
            >
              {requiredTier.charAt(0).toUpperCase() + requiredTier.slice(1)} Feature
            </Badge>
            
            {showUpgradePrompt && (
              <div className="space-y-3">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Unlock this feature by upgrading to {requiredTier.charAt(0).toUpperCase() + requiredTier.slice(1)}
                </p>
                
                <UpgradeButton 
                  currentTier={userTier}
                  targetTier={requiredTier as 'premium' | 'family'}
                  featureName={feature.name}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

interface UpgradeButtonProps {
  currentTier: string;
  targetTier: 'premium' | 'family';
  featureName: string;
}

function UpgradeButton({ currentTier, targetTier, featureName }: UpgradeButtonProps) {
  const { data: tiersData } = useQuery({
    queryKey: ['/api/features/tiers'],
    queryFn: async () => {
      const response = await fetch('/api/features/tiers');
      return response.json();
    }
  });

  const handleUpgrade = () => {
    // Navigate to upgrade flow
    window.location.href = `/upgrade?from=${currentTier}&to=${targetTier}&feature=${featureName}`;
  };

  if (!tiersData?.success) {
    return (
      <Button onClick={handleUpgrade} className="w-full">
        <Zap className="w-4 h-4 mr-2" />
        Upgrade Now
      </Button>
    );
  }

  const tier = tiersData.subscriptionTiers.find((t: SubscriptionTier) => t.id === targetTier);
  
  return (
    <div className="space-y-2">
      <Button 
        onClick={handleUpgrade} 
        className={`w-full ${getTierColor(targetTier)} border-0 hover:opacity-90`}
      >
        <Zap className="w-4 h-4 mr-2" />
        Upgrade to {tier?.name}
      </Button>
      
      {tier && (
        <p className="text-xs text-gray-500">
          Starting at ${tier.price.monthly}/month
        </p>
      )}
    </div>
  );
}

// Hook for checking feature availability
export function useFeatureAccess(featureId: string, userTier: 'basic' | 'premium' | 'family') {
  const { data } = useQuery({
    queryKey: ['/api/features/available', userTier],
    queryFn: async () => {
      const response = await fetch(`/api/features/available?tier=${userTier}`);
      return response.json();
    }
  });

  if (!data?.success) {
    return { hasAccess: true, isLoading: true };
  }

  const hasAccess = data.availableFeatures.some((f: any) => f.id === featureId);
  
  return { 
    hasAccess, 
    isLoading: false,
    requiredTier: data.lockedFeatures.find((f: any) => f.id === featureId)?.subscriptionTier
  };
}

// Component for showing tier badges
export function TierBadge({ tier }: { tier: 'basic' | 'premium' | 'family' }) {
  return (
    <Badge 
      variant="secondary" 
      className={`${getTierColor(tier)} text-white border-0 text-xs`}
    >
      {getTierIcon(tier)}
      <span className="ml-1">{tier.charAt(0).toUpperCase() + tier.slice(1)}</span>
    </Badge>
  );
}