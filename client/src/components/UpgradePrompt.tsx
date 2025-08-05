import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Crown, 
  Zap, 
  MessageCircle,
  Image,
  Mic,
  Palette,
  Heart,
  TrendingUp,
  Shield,
  Star,
  ArrowRight,
  X
} from 'lucide-react';
import { useLocation } from 'wouter';

interface UpgradePromptProps {
  isOpen: boolean;
  onClose: () => void;
  trigger: 'tokens' | 'feature' | 'limit';
  featureName?: string;
  currentPlan?: string;
}

const PLAN_FEATURES = {
  Basic: {
    name: 'Basic',
    price: '$0',
    tokens: '50K tokens/month',
    features: [
      'Basic AI chat',
      'Simple avatar creation',
      'Daily affirmations',
      'Basic mood tracking'
    ],
    limitations: [
      'No image generation',
      'No voice synthesis',
      'Limited personality AI',
      'No token top-ups'
    ]
  },
  Premium: {
    name: 'Premium',
    price: '$9.99',
    tokens: '200K tokens/month',
    features: [
      'Advanced AI conversations',
      'AI image generation',
      'Voice synthesis',
      'Advanced avatar creation',
      'Smart personality adaptation',
      'Mood insights & tracking',
      'Goal setting & reminders',
      'Priority support',
      'Token top-ups available'
    ],
    limitations: []
  },
  Family: {
    name: 'Family',
    price: '$19.99',
    tokens: '500K tokens/month',
    features: [
      'Everything in Premium',
      'Up to 4 child profiles',
      'Parental insights dashboard',
      'Family activity reports',
      'Advanced safety controls',
      'Custom conversation themes',
      'Educational content library',
      'Video calls with AI companion'
    ],
    limitations: []
  }
};

const TRIGGER_MESSAGES = {
  tokens: {
    title: "You've reached your token limit",
    description: "Upgrade to continue chatting with unlimited conversations and unlock premium AI features.",
    urgency: "high"
  },
  feature: {
    title: "Unlock Premium Features",
    description: "This feature requires a premium subscription to access advanced AI capabilities.",
    urgency: "medium"
  },
  limit: {
    title: "Feature Limit Reached",
    description: "You've reached the limit for this feature on your current plan. Upgrade for unlimited access.",
    urgency: "medium"
  }
};

export function UpgradePrompt({ 
  isOpen, 
  onClose, 
  trigger, 
  featureName, 
  currentPlan = 'Basic' 
}: UpgradePromptProps) {
  const [, setLocation] = useLocation();
  const triggerMsg = TRIGGER_MESSAGES[trigger];
  const isHighUrgency = triggerMsg.urgency === 'high';

  const handleUpgrade = (planName: string) => {
    onClose();
    setLocation(`/subscribe?plan=${planName.toLowerCase()}&source=upgrade-prompt`);
  };

  const getRecommendedPlan = () => {
    if (trigger === 'tokens' || (trigger === 'feature' && ['image_generation', 'voice_synthesis'].includes(featureName || ''))) {
      return 'Premium';
    }
    return 'Premium';
  };

  const recommendedPlan = getRecommendedPlan();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${isHighUrgency ? 'bg-red-100' : 'bg-blue-100'}`}>
                <Crown className={`h-6 w-6 ${isHighUrgency ? 'text-red-600' : 'text-blue-600'}`} />
              </div>
              <div>
                <DialogTitle className="text-xl">
                  {triggerMsg.title}
                  {featureName && `: ${featureName}`}
                </DialogTitle>
                <DialogDescription className="text-base mt-1">
                  {triggerMsg.description}
                </DialogDescription>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Current Plan Status */}
        <div className={`p-4 rounded-lg border ${isHighUrgency ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'}`}>
          <div className="flex items-center gap-3">
            <Shield className={`h-5 w-5 ${isHighUrgency ? 'text-red-600' : 'text-yellow-600'}`} />
            <div>
              <div className="font-medium">
                Current Plan: {currentPlan}
                {currentPlan === 'Basic' && (
                  <Badge variant="outline" className="ml-2">Free</Badge>
                )}
              </div>
              <div className={`text-sm ${isHighUrgency ? 'text-red-700' : 'text-yellow-700'}`}>
                {trigger === 'tokens' && "Monthly token limit reached - AI features temporarily unavailable"}
                {trigger === 'feature' && `${featureName} requires premium subscription`}
                {trigger === 'limit' && "Feature usage limit reached for this month"}
              </div>
            </div>
          </div>
        </div>

        {/* Feature Comparison */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Unlock More with Premium</h3>
          
          <div className="grid gap-4">
            {/* Premium Plan (Recommended) */}
            <Card className={`relative ${recommendedPlan === 'Premium' ? 'border-blue-500 bg-blue-50' : ''}`}>
              {recommendedPlan === 'Premium' && (
                <Badge className="absolute -top-2 -right-2 bg-blue-500">
                  <Star className="h-3 w-3 mr-1" />
                  Recommended
                </Badge>
              )}
              
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Crown className="h-5 w-5 text-yellow-500" />
                      Premium Plan
                    </CardTitle>
                    <CardDescription>Perfect for active young users</CardDescription>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">$9.99</div>
                    <div className="text-sm text-gray-500">/month</div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-green-600 font-medium">
                    <Zap className="h-4 w-4" />
                    200K tokens/month (4x more than Basic)
                  </div>
                  
                  <div className="grid sm:grid-cols-2 gap-3">
                    {[
                      { icon: MessageCircle, label: 'Unlimited AI conversations', color: 'text-blue-500' },
                      { icon: Image, label: 'AI image generation', color: 'text-purple-500' },
                      { icon: Mic, label: 'Voice synthesis', color: 'text-green-500' },
                      { icon: Palette, label: 'Advanced avatar creation', color: 'text-pink-500' },
                      { icon: Heart, label: 'Smart personality AI', color: 'text-red-500' },
                      { icon: TrendingUp, label: 'Mood insights & goals', color: 'text-indigo-500' }
                    ].map((feature) => (
                      <div key={feature.label} className="flex items-center gap-2 text-sm">
                        <feature.icon className={`h-4 w-4 ${feature.color}`} />
                        <span>{feature.label}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="bg-white p-3 rounded border">
                    <div className="text-sm font-medium text-green-700 mb-1">
                      ✨ Immediate Benefits:
                    </div>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Purchase additional tokens when needed</li>
                      <li>• Never get locked out of AI features</li>
                      <li>• Advanced personality that learns and adapts</li>
                      <li>• Priority customer support</li>
                    </ul>
                  </div>
                </div>
                
                <Button 
                  className="w-full mt-4 flex items-center gap-2"
                  onClick={() => handleUpgrade('Premium')}
                >
                  Upgrade to Premium
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>

            {/* Family Plan */}
            <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Crown className="h-5 w-5 text-purple-500" />
                      Family Plan
                    </CardTitle>
                    <CardDescription>Best value for families</CardDescription>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">$19.99</div>
                    <div className="text-sm text-gray-500">/month</div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-purple-600 font-medium">
                    <Zap className="h-4 w-4" />
                    500K tokens/month + Everything in Premium
                  </div>
                  
                  <div className="grid sm:grid-cols-2 gap-2 text-sm">
                    <div>• Up to 4 child profiles</div>
                    <div>• Parental insights dashboard</div>
                    <div>• Family activity reports</div>
                    <div>• Advanced safety controls</div>
                    <div>• Educational content library</div>
                    <div>• Video calls with AI</div>
                  </div>
                  
                  <div className="bg-white bg-opacity-70 p-3 rounded border">
                    <div className="text-sm font-medium text-purple-700">
                      👨‍👩‍👧‍👦 Perfect for families with multiple children
                    </div>
                  </div>
                </div>
                
                <Button 
                  variant="outline" 
                  className="w-full mt-4 border-purple-300 hover:bg-purple-50"
                  onClick={() => handleUpgrade('Family')}
                >
                  Choose Family Plan
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-gray-500">
            {isHighUrgency ? 
              "⚡ Upgrade now to resume your AI conversations immediately" :
              "💫 Unlock the full potential of your AI companion"
            }
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={onClose}>
              Maybe Later
            </Button>
            <Button 
              onClick={() => handleUpgrade(recommendedPlan)}
              className="flex items-center gap-2"
            >
              <Crown className="h-4 w-4" />
              Upgrade Now
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}