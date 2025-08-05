import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Lock, 
  Zap, 
  Crown, 
  AlertTriangle, 
  MessageCircle,
  Mic,
  Image,
  Palette,
  ShoppingCart,
  ArrowRight
} from 'lucide-react';
import { UpgradePrompt } from './UpgradePrompt';
import { PurchaseTokensModal } from './PurchaseTokensModal';

interface FeatureGhostProps {
  featureName: string;
  featureType: 'chat' | 'voice_synthesis' | 'image_generation' | 'avatar_creation' | 'advanced_personality';
  isRestricted: boolean;
  restriction?: {
    reason: string;
    upgradeRequired?: boolean;
  };
  tokenStatus?: {
    remainingTokens: number;
    monthlyLimit: number;
    subscription?: {
      planName: string;
      canPurchaseTokens: boolean;
      overageRate: number;
    };
  };
  childId: string;
  children: React.ReactNode;
  onRestrictionBypass?: () => void; // For demo/testing purposes
}

const FEATURE_ICONS = {
  chat: MessageCircle,
  voice_synthesis: Mic,
  image_generation: Image,
  avatar_creation: Palette,
  advanced_personality: Crown
};

const FEATURE_DESCRIPTIONS = {
  chat: 'AI conversations and personalized responses',
  voice_synthesis: 'Text-to-speech voice responses',
  image_generation: 'AI-generated images and graphics',
  avatar_creation: 'Custom avatar design and creation',
  advanced_personality: 'Advanced AI personality and emotional intelligence'
};

export function FeatureGhost({ 
  featureName, 
  featureType, 
  isRestricted, 
  restriction, 
  tokenStatus,
  childId,
  children, 
  onRestrictionBypass 
}: FeatureGhostProps) {
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);

  const FeatureIcon = FEATURE_ICONS[featureType];
  const featureDescription = FEATURE_DESCRIPTIONS[featureType];

  // If not restricted, show the normal feature
  if (!isRestricted) {
    return <>{children}</>;
  }

  const isTokenLimit = restriction?.reason?.includes('token limit') || restriction?.reason?.includes('Monthly token limit');
  const isUpgradeRequired = restriction?.upgradeRequired || restriction?.reason?.includes('Premium subscription required');

  return (
    <>
      <Card className="relative overflow-hidden bg-gray-50 border-gray-200">
        {/* Ghosted content in background */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          {children}
        </div>
        
        {/* Overlay content */}
        <div className="relative z-10 bg-white/95 backdrop-blur-sm min-h-[200px] flex items-center justify-center p-6">
          <div className="text-center max-w-md">
            {/* Feature icon and title */}
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-3 rounded-full bg-gray-100">
                <FeatureIcon className="h-6 w-6 text-gray-500" />
              </div>
              <Lock className="h-5 w-5 text-gray-400" />
            </div>
            
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {featureName} Unavailable
            </h3>
            
            <p className="text-sm text-gray-600 mb-4">
              {featureDescription}
            </p>

            {/* Restriction reason */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <div className="font-medium text-yellow-800">
                    {isTokenLimit ? 'Token Limit Reached' : 'Premium Feature'}
                  </div>
                  <div className="text-yellow-700 mt-1">
                    {restriction?.reason}
                  </div>
                </div>
              </div>
            </div>

            {/* Token status if applicable */}
            {tokenStatus && isTokenLimit && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <Zap className="h-4 w-4 text-blue-600" />
                  <span className="text-blue-800">
                    {tokenStatus.remainingTokens.toLocaleString()} / {tokenStatus.monthlyLimit.toLocaleString()} tokens remaining
                  </span>
                </div>
                {tokenStatus.subscription && (
                  <div className="mt-2 text-xs text-blue-600">
                    {tokenStatus.subscription.planName} Plan
                  </div>
                )}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-col gap-2">
              {/* Purchase tokens if user can buy them */}
              {isTokenLimit && tokenStatus?.subscription?.canPurchaseTokens && (
                <Button 
                  onClick={() => setShowPurchaseModal(true)}
                  className="flex items-center gap-2"
                >
                  <ShoppingCart className="h-4 w-4" />
                  Buy More Tokens
                  <Badge variant="outline" className="text-xs">
                    ${tokenStatus.subscription.overageRate}/token
                  </Badge>
                </Button>
              )}

              {/* Upgrade plan */}
              {isUpgradeRequired && (
                <Button 
                  onClick={() => setShowUpgradePrompt(true)}
                  variant={isTokenLimit && tokenStatus?.subscription?.canPurchaseTokens ? "outline" : "default"}
                  className="flex items-center gap-2"
                >
                  <Crown className="h-4 w-4" />
                  Upgrade Plan
                  <ArrowRight className="h-4 w-4" />
                </Button>
              )}

              {/* Emergency access (for token limits only) */}
              {isTokenLimit && onRestrictionBypass && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={onRestrictionBypass}
                  className="text-xs"
                >
                  Continue Anyway (Demo Mode)
                </Button>
              )}
            </div>

            {/* Next reset info for token limits */}
            {isTokenLimit && (
              <div className="text-xs text-gray-500 mt-4">
                Token limit resets at the beginning of next month
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Modals */}
      <UpgradePrompt
        isOpen={showUpgradePrompt}
        onClose={() => setShowUpgradePrompt(false)}
        trigger={isTokenLimit ? 'tokens' : 'feature'}
        featureName={featureName}
        currentPlan={tokenStatus?.subscription?.planName || 'Basic'}
      />

      {tokenStatus?.subscription && (
        <PurchaseTokensModal
          isOpen={showPurchaseModal}
          onClose={() => setShowPurchaseModal(false)}
          childId={childId}
          currentRate={tokenStatus.subscription.overageRate}
          planName={tokenStatus.subscription.planName}
        />
      )}
    </>
  );
}

/**
 * Higher-order component for wrapping features with token restriction checks
 */
export function withFeatureRestriction<T extends object>(
  WrappedComponent: React.ComponentType<T>,
  featureType: FeatureGhostProps['featureType'],
  featureName: string
) {
  return function RestrictedFeature(props: T & { childId: string }) {
    const { childId, ...otherProps } = props;
    
    // In a real implementation, you'd fetch the restriction status here
    // For now, we'll assume no restrictions for demo purposes
    const isRestricted = false;
    
    if (isRestricted) {
      return (
        <FeatureGhost
          featureName={featureName}
          featureType={featureType}
          isRestricted={true}
          childId={childId}
          restriction={{
            reason: 'Feature demonstration - not implemented',
            upgradeRequired: true
          }}
        >
          <WrappedComponent {...(otherProps as T)} />
        </FeatureGhost>
      );
    }

    return <WrappedComponent {...(otherProps as T)} />;
  };
}

/**
 * Quick restriction status indicator
 */
export function RestrictionBadge({ 
  isRestricted, 
  reason 
}: { 
  isRestricted: boolean; 
  reason?: string; 
}) {
  if (!isRestricted) return null;

  return (
    <Badge variant="destructive" className="flex items-center gap-1 text-xs">
      <Lock className="h-3 w-3" />
      Restricted
    </Badge>
  );
}