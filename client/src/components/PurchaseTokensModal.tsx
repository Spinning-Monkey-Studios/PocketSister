import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Zap, 
  CreditCard, 
  Sparkles, 
  Calculator,
  MessageCircle,
  Image,
  Palette,
  Mic
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface PurchaseTokensModalProps {
  isOpen: boolean;
  onClose: () => void;
  childId: string;
  currentRate: number; // Cost per token
  planName: string;
}

const CONVERSATION_PACKAGES = [
  {
    conversations: 25,
    label: '25 Conversations',
    description: 'Quick boost for this month',
    popular: false,
    bonus: 0,
    price: 1.25 // $0.05 per conversation
  },
  {
    conversations: 50,
    label: '50 Conversations',
    description: 'Popular choice for families',
    popular: true,
    bonus: 5, // 10% bonus
    price: 2.25 // Slight discount
  },
  {
    conversations: 100,
    label: '100 Conversations',
    description: 'Great value for heavy users',
    popular: false,
    bonus: 15, // 15% bonus
    price: 4.00 // Better discount
  },
  {
    conversations: 200,
    label: '200 Conversations',
    description: 'Maximum family boost',
    popular: false,
    bonus: 40, // 20% bonus
    price: 7.00 // Best discount
  }
];

const USAGE_EXAMPLES = [
  { icon: MessageCircle, label: 'AI Chat', usage: '1 conversation', color: 'text-blue-500' },
  { icon: Image, label: 'Image Generation', usage: '~1 conversation', color: 'text-purple-500' },
  { icon: Palette, label: 'Avatar Creation', usage: '~1 conversation', color: 'text-pink-500' },
  { icon: Mic, label: 'Voice Synthesis', usage: 'Included in chat', color: 'text-green-500' }
];

export function PurchaseTokensModal({ 
  isOpen, 
  onClose, 
  childId, 
  currentRate, 
  planName 
}: PurchaseTokensModalProps) {
  const [selectedPackage, setSelectedPackage] = useState(CONVERSATION_PACKAGES[1]); // Default to popular option
  const [customAmount, setCustomAmount] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const purchaseConversationsMutation = useMutation({
    mutationFn: async (conversationAmount: number) => {
      const response = await fetch(`/api/conversations/purchase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ childId, conversationAmount })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to purchase conversations');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Conversations Purchased Successfully!",
        description: `Added ${data.conversationsAdded?.toLocaleString()} conversations to your account.`,
        duration: 5000,
      });
      
      // Refresh conversation status
      queryClient.invalidateQueries({ queryKey: ['conversation-status', childId] });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Purchase Failed",
        description: error.message || "Unable to complete purchase. Please try again.",
        variant: "destructive",
      });
    }
  });

  const getTokenAmount = () => {
    if (isCustom) {
      const amount = parseInt(customAmount);
      return isNaN(amount) ? 0 : amount;
    }
    return selectedPackage.tokens + selectedPackage.bonus;
  };

  const getCost = () => {
    const tokens = isCustom ? parseInt(customAmount) || 0 : selectedPackage.tokens;
    return (tokens * currentRate).toFixed(2);
  };

  const getBonusTokens = () => {
    return isCustom ? 0 : selectedPackage.bonus;
  };

  const handlePurchase = () => {
    const tokenAmount = getTokenAmount();
    if (tokenAmount < 1000) {
      toast({
        title: "Minimum Purchase",
        description: "Minimum purchase is 1,000 tokens.",
        variant: "destructive",
      });
      return;
    }
    
    purchaseTokensMutation.mutate(tokenAmount);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Zap className="h-6 w-6 text-yellow-500" />
            Purchase Additional Tokens
          </DialogTitle>
          <DialogDescription>
            Add more tokens to your {planName} plan for uninterrupted AI conversations and features.
          </DialogDescription>
        </DialogHeader>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Package Selection */}
          <div className="lg:col-span-2 space-y-4">
            <div>
              <h3 className="font-semibold mb-3">Token Packages</h3>
              <div className="grid sm:grid-cols-2 gap-3">
                {TOKEN_PACKAGES.map((pkg) => (
                  <Card 
                    key={pkg.tokens}
                    className={`relative cursor-pointer transition-all ${
                      !isCustom && selectedPackage.tokens === pkg.tokens
                        ? 'border-blue-500 bg-blue-50' 
                        : 'hover:border-gray-300'
                    }`}
                    onClick={() => {
                      setSelectedPackage(pkg);
                      setIsCustom(false);
                    }}
                  >
                    {pkg.popular && (
                      <Badge className="absolute -top-2 -right-2 bg-blue-500">
                        <Sparkles className="h-3 w-3 mr-1" />
                        Popular
                      </Badge>
                    )}
                    
                    <CardContent className="p-4">
                      <div className="text-center">
                        <div className="text-lg font-bold">{pkg.label}</div>
                        {pkg.bonus > 0 && (
                          <div className="text-sm text-green-600 font-medium">
                            +{pkg.bonus.toLocaleString()} bonus tokens!
                          </div>
                        )}
                        <div className="text-sm text-gray-600 mt-1">{pkg.description}</div>
                        <div className="text-xl font-bold text-blue-600 mt-2">
                          ${(pkg.tokens * currentRate).toFixed(2)}
                        </div>
                        {pkg.bonus > 0 && (
                          <div className="text-xs text-gray-500">
                            Total: {(pkg.tokens + pkg.bonus).toLocaleString()} tokens
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Custom Amount */}
            <div>
              <h3 className="font-semibold mb-3">Custom Amount</h3>
              <Card 
                className={`cursor-pointer transition-all ${
                  isCustom ? 'border-blue-500 bg-blue-50' : 'hover:border-gray-300'
                }`}
                onClick={() => setIsCustom(true)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <Calculator className="h-5 w-5 text-gray-500" />
                    <div className="flex-1">
                      <Label htmlFor="custom-tokens">Custom Token Amount</Label>
                      <Input
                        id="custom-tokens"
                        type="number"
                        placeholder="Enter amount (min 1,000)"
                        value={customAmount}
                        onChange={(e) => {
                          setCustomAmount(e.target.value);
                          setIsCustom(true);
                        }}
                        min={1000}
                        className="mt-1"
                      />
                    </div>
                    {isCustom && customAmount && (
                      <div className="text-right">
                        <div className="font-semibold">${getCost()}</div>
                        <div className="text-sm text-gray-500">
                          {parseInt(customAmount).toLocaleString()} tokens
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Right Column - Summary & Info */}
          <div className="space-y-4">
            {/* Purchase Summary */}
            <Card className="bg-gray-50">
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3">Purchase Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Base Tokens:</span>
                    <span>{(isCustom ? parseInt(customAmount) || 0 : selectedPackage.tokens).toLocaleString()}</span>
                  </div>
                  {getBonusTokens() > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Bonus Tokens:</span>
                      <span>+{getBonusTokens().toLocaleString()}</span>
                    </div>
                  )}
                  <hr />
                  <div className="flex justify-between font-semibold">
                    <span>Total Tokens:</span>
                    <span>{getTokenAmount().toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total Cost:</span>
                    <span>${getCost()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Usage Guide */}
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3">Token Usage Guide</h3>
                <div className="space-y-2">
                  {USAGE_EXAMPLES.map((example) => (
                    <div key={example.label} className="flex items-center gap-3 text-sm">
                      <example.icon className={`h-4 w-4 ${example.color}`} />
                      <span className="flex-1">{example.label}</span>
                      <span className="text-gray-500">{example.tokens}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Benefits */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <h3 className="font-semibold mb-2 text-blue-800">Premium Benefits</h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Never worry about running out mid-conversation</li>
                  <li>• Access to advanced AI features</li>
                  <li>• Faster response times</li>
                  <li>• Priority customer support</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Purchase Button */}
        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-gray-500">
            Tokens will be added to your account immediately after purchase.
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handlePurchase}
              disabled={purchaseTokensMutation.isPending || getTokenAmount() < 1000}
              className="flex items-center gap-2"
            >
              <CreditCard className="h-4 w-4" />
              {purchaseTokensMutation.isPending ? 'Processing...' : `Purchase for $${getCost()}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}