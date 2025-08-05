import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, Users, Star, Zap } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface UpgradePageProps {
  currentTier?: 'basic' | 'premium' | 'family';
  targetTier?: 'premium' | 'family';
  featureName?: string;
}

export function UpgradePage({ currentTier = 'basic', targetTier, featureName }: UpgradePageProps) {
  const [selectedTier, setSelectedTier] = useState(targetTier || 'premium');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  // Get subscription tiers and features
  const { data: tiersData } = useQuery({
    queryKey: ['/api/features/tiers'],
    queryFn: async () => {
      const response = await fetch('/api/features/tiers');
      return response.json();
    }
  });

  const { data: featuresData } = useQuery({
    queryKey: ['/api/features/list'],
    queryFn: async () => {
      const response = await fetch('/api/features/list');
      return response.json();
    }
  });

  useEffect(() => {
    // Parse URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const fromTier = urlParams.get('from');
    const toTier = urlParams.get('to');
    const feature = urlParams.get('feature');
    
    if (toTier && ['premium', 'family'].includes(toTier)) {
      setSelectedTier(toTier as 'premium' | 'family');
    }
  }, []);

  if (!tiersData?.success || !featuresData?.success) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading upgrade options...</div>
      </div>
    );
  }

  const tiers = tiersData.subscriptionTiers;
  const features = featuresData.features;

  const handleUpgrade = async (tier: string) => {
    // Integrate with Stripe or payment processor
    console.log(`Upgrading to ${tier} with ${billingCycle} billing`);
    
    // In a real app, this would redirect to Stripe Checkout
    const checkoutUrl = `/api/stripe/create-checkout-session`;
    const response = await fetch(checkoutUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tier: tier,
        billingCycle: billingCycle,
        successUrl: `${window.location.origin}/upgrade-success`,
        cancelUrl: window.location.href
      })
    });
    
    if (response.ok) {
      const { url } = await response.json();
      window.location.href = url;
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'premium': return <Crown className="w-6 h-6" />;
      case 'family': return <Users className="w-6 h-6" />;
      default: return <Star className="w-6 h-6" />;
    }
  };

  const getTierGradient = (tier: string) => {
    switch (tier) {
      case 'premium': return 'from-purple-500 to-pink-500';
      case 'family': return 'from-blue-500 to-green-500';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const getFeaturesByTier = (tier: string) => {
    return features.filter((f: any) => f.subscriptionTier === tier);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">
          Unlock Your Full Potential
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-6">
          Choose the perfect plan for your AI companion experience
        </p>
        
        {featureName && (
          <Badge variant="outline" className="text-lg px-4 py-2">
            Unlock "{featureName}" feature
          </Badge>
        )}
      </div>

      {/* Billing Toggle */}
      <div className="flex justify-center mb-8">
        <div className="bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-4 py-2 rounded-md transition-colors ${
              billingCycle === 'monthly' 
                ? 'bg-white dark:bg-gray-700 shadow-sm' 
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle('yearly')}
            className={`px-4 py-2 rounded-md transition-colors ${
              billingCycle === 'yearly' 
                ? 'bg-white dark:bg-gray-700 shadow-sm' 
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            Yearly
            <Badge variant="secondary" className="ml-2 bg-green-100 text-green-800">
              Save 15%
            </Badge>
          </button>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid md:grid-cols-3 gap-6 mb-12">
        {Object.entries(tiers).map(([tierId, tier]: [string, any]) => {
          const tierFeatures = getFeaturesByTier(tierId);
          const isCurrentTier = tierId === currentTier;
          const isRecommended = tierId === 'premium';
          const price = billingCycle === 'yearly' ? tier.price.yearly : tier.price.monthly;
          const monthlyPrice = billingCycle === 'yearly' ? tier.price.yearly / 12 : tier.price.monthly;

          return (
            <Card 
              key={tierId}
              className={`relative ${
                isRecommended ? 'border-2 border-purple-500 shadow-lg scale-105' : ''
              } ${isCurrentTier ? 'opacity-60' : ''}`}
            >
              {isRecommended && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                    Most Popular
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center">
                <div className={`w-16 h-16 mx-auto rounded-full bg-gradient-to-r ${getTierGradient(tierId)} flex items-center justify-center text-white mb-4`}>
                  {getTierIcon(tierId)}
                </div>
                
                <CardTitle className="text-2xl">{tier.name}</CardTitle>
                <CardDescription className="text-lg">
                  {tier.description}
                </CardDescription>
                
                <div className="pt-4">
                  <div className="text-4xl font-bold">
                    ${monthlyPrice.toFixed(2)}
                    <span className="text-lg font-normal text-gray-600">/month</span>
                  </div>
                  {billingCycle === 'yearly' && tier.price.yearly > 0 && (
                    <div className="text-sm text-gray-500">
                      Billed yearly (${tier.price.yearly}/year)
                    </div>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Feature List */}
                <div className="space-y-2">
                  {tierFeatures.slice(0, 5).map((feature: any) => (
                    <div key={feature.id} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
                      <span className="text-sm">{feature.name}</span>
                    </div>
                  ))}
                  {tierFeatures.length > 5 && (
                    <div className="text-sm text-gray-500">
                      +{tierFeatures.length - 5} more features
                    </div>
                  )}
                </div>
                
                {/* Action Button */}
                {isCurrentTier ? (
                  <Button disabled className="w-full">
                    Current Plan
                  </Button>
                ) : tierId === 'basic' ? (
                  <Button variant="outline" className="w-full" disabled>
                    Free Forever
                  </Button>
                ) : (
                  <Button 
                    onClick={() => handleUpgrade(tierId)}
                    className={`w-full bg-gradient-to-r ${getTierGradient(tierId)} hover:opacity-90 border-0`}
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    Upgrade to {tier.name}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Feature Comparison */}
      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-center mb-6">
          Compare All Features
        </h2>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4">Feature</th>
                <th className="text-center py-3 px-4">Basic</th>
                <th className="text-center py-3 px-4">Premium</th>
                <th className="text-center py-3 px-4">Family</th>
              </tr>
            </thead>
            <tbody>
              {features.map((feature: any) => (
                <tr key={feature.id} className="border-b">
                  <td className="py-3 px-4">
                    <div>
                      <div className="font-medium">{feature.name}</div>
                      <div className="text-sm text-gray-600">{feature.description}</div>
                    </div>
                  </td>
                  <td className="text-center py-3 px-4">
                    {feature.subscriptionTier === 'basic' ? 
                      <Check className="w-5 h-5 text-green-500 mx-auto" /> : 
                      <span className="text-gray-400">—</span>
                    }
                  </td>
                  <td className="text-center py-3 px-4">
                    {['basic', 'premium'].includes(feature.subscriptionTier) ? 
                      <Check className="w-5 h-5 text-green-500 mx-auto" /> : 
                      <span className="text-gray-400">—</span>
                    }
                  </td>
                  <td className="text-center py-3 px-4">
                    <Check className="w-5 h-5 text-green-500 mx-auto" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* FAQ or Additional Info */}
      <div className="text-center mt-8 text-gray-600 dark:text-gray-400">
        <p>All plans include 7-day free trial • Cancel anytime • Safe & secure</p>
      </div>
    </div>
  );
}