# Subscription Management Guide
*Complete free trial and paid tier management for My Pocket Sister*

## Overview

Your subscription system now properly handles:
1. **Free Tier**: 500 tokens OR 7 days (whichever comes first)
2. **Automatic Upgrade Prompts**: When free limits are reached
3. **Paid Tier Unlocking**: Users get full access after payment
4. **Easy Cancellation**: Self-service subscription management

## Free Tier Management

### Free Trial Limits
- **Token Limit**: 500 AI interactions total
- **Time Limit**: 7 days from signup
- **Enforcement**: Whichever limit is reached first triggers upgrade prompt

### Free User Flow
1. User signs up → automatically gets "free" tier
2. Each AI interaction increments `freeTrialTokensUsed`
3. System checks limits on every interaction
4. When limit reached → API returns 402 status with upgrade prompt
5. User must upgrade to continue using the service

## Paid Tier Management

### Subscription Tiers
- **Basic**: $4.99/month + $0.01 per interaction over 50/month
- **Premium**: $9.99/month + $0.01 per interaction over 200/month  
- **Family**: $19.99/month with unlimited interactions

### Paid User Benefits
1. **Immediate Access**: Payment automatically unlocks full features
2. **Usage Tracking**: Monthly interaction limits with overage billing
3. **No Time Limits**: Subscriptions continue until cancelled

## API Endpoints

### Check Subscription Status
```javascript
GET /api/subscription/status

Response:
{
  "currentTier": "free",
  "subscriptionStatus": "free", 
  "freeTrialTokensUsed": 245,
  "freeTrialDaysElapsed": 3,
  "shouldUpgrade": false,
  "upgradeReason": "3/7 days, 245/500 tokens used",
  "hasActiveSubscription": false
}
```

### Create/Upgrade Subscription
```javascript
POST /api/get-or-create-subscription
Body: { "tier": "premium" }

Response:
{
  "subscriptionId": "sub_mock_premium",
  "tier": "premium",
  "mockMode": true,
  "message": "Upgraded to premium tier (mock mode)"
}
```

### Track Usage (with Limit Enforcement)
```javascript
POST /api/track-interaction
Body: { 
  "childId": "child-123", 
  "interactionType": "chat",
  "tokensUsed": 1 
}

Response (Free User - Limit Reached):
{
  "error": "Free trial limit reached",
  "reason": "500 token limit reached",
  "requiresUpgrade": true,
  "message": "Please upgrade to continue using the service"
}

Response (Success):
{
  "success": true,
  "usage": 246,
  "limit": 500,
  "tier": "free",
  "message": "Free trial: 254 tokens remaining"
}
```

### Cancel Subscription
```javascript
POST /api/subscription/cancel

Response:
{
  "success": true,
  "message": "Subscription cancelled successfully",
  "newTier": "free",
  "status": "cancelled"
}
```

## Database Schema Changes

### New User Fields
```sql
-- Added to users table:
stripeCustomerId VARCHAR,           -- Stripe customer ID
stripeSubscriptionId VARCHAR,       -- Stripe subscription ID  
subscriptionTier VARCHAR DEFAULT 'free',     -- free, basic, premium, family
freeTrialStarted TIMESTAMP DEFAULT NOW(),    -- When free trial began
freeTrialTokensUsed INTEGER DEFAULT 0,       -- Tokens used during trial
freeTrialEnded BOOLEAN DEFAULT false,        -- Whether trial has ended
tokenUsageThisMonth INTEGER DEFAULT 0,       -- Current month usage
lastTokenReset TIMESTAMP DEFAULT NOW()       -- Last monthly reset
```

## Integration Points

### Frontend Integration
```javascript
// Check if user can make AI request
const response = await fetch('/api/track-interaction', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    childId: selectedChildId,
    interactionType: 'chat',
    tokensUsed: estimatedTokens
  })
});

if (response.status === 402) {
  const error = await response.json();
  if (error.requiresUpgrade) {
    // Show upgrade modal
    showUpgradeModal(error.reason);
    return;
  }
}

// Process successful interaction
const result = await response.json();
updateUsageDisplay(result.usage, result.limit);
```

### Stripe Webhook Integration
```javascript
// Handle successful payment
app.post('/webhooks/stripe', (req, res) => {
  const event = req.body;
  
  if (event.type === 'invoice.payment_succeeded') {
    const subscription = event.data.object.subscription;
    const customerId = event.data.object.customer;
    
    // Upgrade user to paid tier
    await storage.upgradeToPaidTier(userId, determineTier(subscription));
  }
  
  if (event.type === 'customer.subscription.deleted') {
    // Handle cancellation
    await storage.cancelUserSubscription(userId);
  }
});
```

## Testing the System

### Test Free Trial Limits
```bash
# Test token limit
for i in {1..501}; do
  curl -X POST http://localhost:5000/api/track-interaction \
    -H "Content-Type: application/json" \
    -d '{"childId": "test", "interactionType": "chat"}'
done
# Should return 402 error on 501st request

# Test time limit (simulate 8 days later)
# Modify user's freeTrialStarted timestamp in database
# Then make request - should return 402 error
```

### Test Subscription Flow
```bash
# 1. Check free user status
curl http://localhost:5000/api/subscription/status

# 2. Upgrade to premium
curl -X POST http://localhost:5000/api/get-or-create-subscription \
  -H "Content-Type: application/json" \
  -d '{"tier": "premium"}'

# 3. Verify upgrade worked
curl http://localhost:5000/api/subscription/status
# Should show "currentTier": "premium"

# 4. Test cancellation
curl -X POST http://localhost:5000/api/subscription/cancel
# Should revert to free tier
```

## User Experience

### Free User Journey
1. **Signup** → Gets 500 tokens / 7 days free
2. **Usage Tracking** → Clear progress indicators
3. **Upgrade Prompt** → When limits approached (e.g., at 450 tokens)
4. **Hard Limit** → Service stops, must upgrade to continue

### Paid User Journey  
1. **Payment** → Instant tier upgrade
2. **Full Access** → All features unlocked immediately
3. **Usage Monitoring** → Monthly limits with overage billing
4. **Easy Cancellation** → Self-service downgrade to free

### Cancellation Handling
- User keeps access until end of billing period
- Then reverts to free tier with 500 tokens
- No data loss - all conversations preserved
- Can re-subscribe anytime

## Common Questions

**Q: What happens when free trial ends?**
A: User gets upgrade prompt, cannot use AI features until they subscribe

**Q: Do paid users get locked out after payment?**
A: No - payment immediately unlocks their tier with proper limits

**Q: Can users easily cancel?**
A: Yes - single API call cancels and reverts to free tier

**Q: Is usage properly tracked?**
A: Yes - free trial tokens and monthly usage are tracked separately

**Q: What about overage billing?**
A: Basic/Premium users can exceed limits and get charged $0.01 per interaction