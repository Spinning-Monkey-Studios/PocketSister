# Stripe Configuration Guide
*Complete setup for My Pocket Sister subscription billing with usage-based overages*

## Current Stripe Product Analysis

Based on your screenshot, you have:
- **Product**: "Pocket Sister Plus - Monthly" 
- **Product ID**: `prod_SmNx6Aj3maRO2j`
- **Current pricing**: $0.01 CAD per chat + $4.99 CAD base fee

### Your Setup is Actually CORRECT! 
You're using Stripe's **"recurring + usage-based billing"** feature properly:
1. **Base subscription** covers included interactions per tier
2. **Usage metering** charges $0.01 per interaction after limits exceeded
3. **Family tier** has unlimited (no overage charges)

## Recommended Stripe Product Structure (Usage-Based Model)

### 1. Basic Tier Product
**Create New Product:**
- **Name**: "My Pocket Sister - Basic"
- **Description**: "Basic AI companion with 50 interactions/month included, 1 child profile, and essential features"
- **Base Price**: $4.99/month USD (recurring)
- **Usage Price**: $0.01 USD per interaction over 50/month
- **Usage Metering**: Track AI interactions, bill overages

### 2. Premium Tier Product (Modify Your Existing One)
**Update "Pocket Sister Plus - Monthly":**
- **Name**: "My Pocket Sister - Premium" 
- **Description**: "Enhanced AI companion with 200 interactions/month included, up to 3 child profiles, voice features"
- **Base Price**: $9.99/month USD (change from CAD)
- **Usage Price**: $0.01 USD per interaction over 200/month
- **Usage Metering**: Track AI interactions, bill overages

### 3. Family Tier Product
**Create New Product:**
- **Name**: "My Pocket Sister - Family"
- **Description**: "Complete family solution with UNLIMITED interactions, unlimited child profiles, GPS tracking"
- **Base Price**: $19.99/month USD (recurring only)
- **Usage Price**: None (unlimited interactions)
- **No Usage Metering**: Family tier users never get overage charges

## Step-by-Step Stripe Setup

### Phase 1: Create Products with Usage-Based Pricing

1. **Go to Stripe Dashboard** → Products

2. **Create Basic Product**:
   ```
   Name: My Pocket Sister - Basic
   Description: Basic AI companion with 50 interactions/month included, 1 child profile, daily affirmations, basic avatar creation, and standard safety monitoring.
   
   Pricing Model: Recurring + Usage-based
   
   Price 1 (Base Subscription):
   - Price: $4.99 USD
   - Billing period: Monthly
   - Usage type: Licensed
   
   Price 2 (Usage Overage):
   - Price: $0.01 USD
   - Usage type: Metered
   - Usage aggregation: Sum
   - Unit label: "AI interaction"
   ```

3. **Update Your Existing Premium Product**:
   ```
   Name: My Pocket Sister - Premium (rename from "Pocket Sister Plus")
   Description: Enhanced AI companion with 200 interactions/month included, up to 3 child profiles, voice features, image sharing, and enhanced safety monitoring.
   
   Pricing Model: Recurring + Usage-based
   
   Price 1 (Base Subscription):
   - Price: $9.99 USD (change from CAD)
   - Billing period: Monthly
   - Usage type: Licensed
   
   Price 2 (Usage Overage):
   - Price: $0.01 USD
   - Usage type: Metered
   - Usage aggregation: Sum
   - Unit label: "AI interaction"
   ```

4. **Create Family Product**:
   ```
   Name: My Pocket Sister - Family
   Description: Complete family solution with UNLIMITED AI interactions, unlimited child profiles, GPS tracking, parent-child messaging, and comprehensive family analytics.
   
   Pricing Model: Recurring only (no usage metering)
   
   Price 1 (Base Subscription):
   - Price: $19.99 USD
   - Billing period: Monthly
   - Usage type: Licensed
   
   No Price 2: Family tier has unlimited interactions
   ```

### Phase 2: Configure Free Trial

For each product, add:
- **Free trial period**: 7 days
- **Trial behavior**: Start subscription after trial ends
- **No payment method required** during trial signup

### Phase 3: Get Price IDs

After creating each product, copy BOTH price IDs (subscription + usage):

```env
# Add these to your .env file

# Basic Tier (includes overages)
STRIPE_BASIC_SUBSCRIPTION_PRICE_ID=price_1234567890abcdef  # $4.99/month
STRIPE_BASIC_USAGE_PRICE_ID=price_abcdef1234567890        # $0.01/interaction

# Premium Tier (includes overages) 
STRIPE_PREMIUM_SUBSCRIPTION_PRICE_ID=price_0987654321fedcba  # $9.99/month
STRIPE_PREMIUM_USAGE_PRICE_ID=price_fedcba0987654321        # $0.01/interaction

# Family Tier (unlimited, no usage pricing)
STRIPE_FAMILY_SUBSCRIPTION_PRICE_ID=price_xyz123456789      # $19.99/month
# No usage price ID needed for Family tier

# Your existing Premium product ID
STRIPE_PREMIUM_PRODUCT_ID=prod_SmNx6Aj3maRO2j
```

## Token-Based Usage Tracking (Optional Enhancement)

If you want to add usage metering for overages:

### For Basic/Premium Tiers Only:
1. **Create Usage-Based Price** (in addition to base subscription):
   ```
   Name: Extra AI Interactions
   Price: $0.01 USD per interaction
   Billing: Usage-based
   Usage aggregation: Sum
   ```

2. **Implementation**:
   - Base subscription covers included interactions
   - Track usage in database
   - Bill overages using Stripe usage records
   - Family tier has unlimited (no usage tracking needed)

## Environment Variables Setup

Add to your `.env` file:

```env
# Stripe API Keys (from your Stripe Dashboard → API Keys)
STRIPE_SECRET_KEY=sk_test_51ABC...
VITE_STRIPE_PUBLIC_KEY=pk_test_51ABC...

# Product Price IDs (from Products → Select Product → Copy Price ID)
STRIPE_BASIC_PRICE_ID=price_1ABC...
STRIPE_PREMIUM_PRICE_ID=price_1DEF...
STRIPE_FAMILY_PRICE_ID=price_1GHI...

# Optional: Usage-based pricing for overages
STRIPE_USAGE_PRICE_ID=price_1JKL...
```

## Code Integration Points

### 1. Subscription Creation with Usage Metering (server/routes.ts)
```typescript
// Update the subscription creation endpoint
app.post('/api/get-or-create-subscription', async (req, res) => {
  const { tier } = req.body; // 'basic', 'premium', or 'family'
  
  let subscriptionItems;
  
  if (tier === 'basic') {
    subscriptionItems = [
      { price: process.env.STRIPE_BASIC_SUBSCRIPTION_PRICE_ID }, // Base subscription
      { price: process.env.STRIPE_BASIC_USAGE_PRICE_ID }         // Usage metering
    ];
  } else if (tier === 'premium') {
    subscriptionItems = [
      { price: process.env.STRIPE_PREMIUM_SUBSCRIPTION_PRICE_ID }, // Base subscription  
      { price: process.env.STRIPE_PREMIUM_USAGE_PRICE_ID }         // Usage metering
    ];
  } else if (tier === 'family') {
    subscriptionItems = [
      { price: process.env.STRIPE_FAMILY_SUBSCRIPTION_PRICE_ID }   // Only base subscription, no usage
    ];
  }
  
  const subscription = await stripe.subscriptions.create({
    customer: customer.id,
    items: subscriptionItems,
    trial_period_days: 7, // 7-day free trial
    payment_behavior: 'default_incomplete',
    expand: ['latest_invoice.payment_intent'],
  });
});
```

### 2. Usage Tracking and Billing
```typescript
// Track AI interactions and bill overages
async function trackAIInteraction(userId: string, childId: string) {
  const user = await storage.getUserById(userId);
  const subscription = await storage.getUserSubscription(userId);
  
  if (!subscription || subscription.status !== 'active') {
    throw new Error('No active subscription');
  }
  
  const tier = getTierFromSubscription(subscription);
  const currentMonth = new Date().getMonth();
  const usage = await storage.getMonthlyUsage(userId, currentMonth);
  
  // Check if user exceeded their included interactions
  const limits = { basic: 50, premium: 200, family: Infinity };
  const monthlyLimit = limits[tier];
  
  if (usage.interactions >= monthlyLimit && tier !== 'family') {
    // Bill usage overage via Stripe
    await stripe.subscriptionItems.createUsageRecord(
      subscription.usagePriceItemId, // The usage price subscription item ID
      {
        quantity: 1, // 1 interaction
        timestamp: Math.floor(Date.now() / 1000),
        action: 'increment'
      }
    );
  }
  
  // Always track usage in our database
  await storage.incrementUsage(userId, childId, 'interaction');
}

// Detect tier from subscription items
function getTierFromSubscription(subscription: any): 'basic' | 'premium' | 'family' {
  const items = subscription.items.data;
  
  for (const item of items) {
    if (item.price.id === process.env.STRIPE_BASIC_SUBSCRIPTION_PRICE_ID) return 'basic';
    if (item.price.id === process.env.STRIPE_PREMIUM_SUBSCRIPTION_PRICE_ID) return 'premium';
    if (item.price.id === process.env.STRIPE_FAMILY_SUBSCRIPTION_PRICE_ID) return 'family';
  }
  
  return 'basic'; // default
}
```

### 3. Feature Access Control with Usage Limits
```typescript
// Check user's subscription tier and enforce limits
async function checkFeatureAccess(userId: string, feature: string): Promise<{allowed: boolean, reason?: string}> {
  const user = await storage.getUserById(userId);
  const subscription = await storage.getUserSubscription(userId);
  
  if (!subscription || subscription.status !== 'active') {
    return {allowed: false, reason: 'No active subscription'};
  }
  
  const tier = getTierFromSubscription(subscription);
  const currentMonth = new Date().getMonth();
  const usage = await storage.getMonthlyUsage(userId, currentMonth);
  
  // Check interaction limits (only for Basic and Premium)
  if (feature === 'ai_interaction') {
    const limits = { basic: 50, premium: 200, family: Infinity };
    const monthlyLimit = limits[tier];
    
    if (usage.interactions >= monthlyLimit && tier !== 'family') {
      return {
        allowed: true, // Still allowed, but will be charged overage
        reason: `Overage charge of $0.01 will apply (${usage.interactions}/${monthlyLimit} used)`
      };
    }
    
    return {allowed: true};
  }
  
  // Check other features
  switch (feature) {
    case 'voice_features':
      return {allowed: tier === 'premium' || tier === 'family'};
    case 'unlimited_interactions':
      return {allowed: tier === 'family'};
    case 'gps_tracking':
      return {allowed: tier === 'family'};
    case 'multiple_children':
      const childLimits = { basic: 1, premium: 3, family: Infinity };
      const childCount = await storage.getChildProfileCount(userId);
      return {
        allowed: childCount < childLimits[tier],
        reason: childCount >= childLimits[tier] ? `Upgrade to add more children (${childCount}/${childLimits[tier]} used)` : undefined
      };
    default:
      return {allowed: true}; // Basic features available to all
  }
}
```

## Testing Your Setup

### 1. Use Stripe Test Mode
- All the above should be done in **Test Mode**
- Use test credit cards: `4242 4242 4242 4242`
- Test different scenarios: successful payments, failed payments, cancellations

### 2. Test Each Tier
```javascript
// Test subscription creation for each tier
const testTiers = [
  { name: 'Basic', priceId: process.env.STRIPE_BASIC_PRICE_ID },
  { name: 'Premium', priceId: process.env.STRIPE_PREMIUM_PRICE_ID },
  { name: 'Family', priceId: process.env.STRIPE_FAMILY_PRICE_ID }
];
```

### 3. Verify Webhooks (Important!)
Set up webhook endpoints for:
- `invoice.payment_succeeded` - Activate subscription
- `invoice.payment_failed` - Handle failed payments  
- `customer.subscription.deleted` - Handle cancellations

## Production Checklist

Before going live:
- [ ] Switch to Live Mode in Stripe Dashboard
- [ ] Update environment variables with live API keys
- [ ] Test with real payment methods (small amounts)
- [ ] Set up webhook endpoints with proper SSL
- [ ] Configure proper error handling and logging
- [ ] Set up monitoring for failed payments

## Your Next Steps

1. **Fix Current Product**: Either delete the existing "Pocket Sister Plus" product or modify it to be the Premium tier with correct pricing
2. **Create Missing Products**: Set up Basic and Family tiers as described above
3. **Update Environment Variables**: Add all the price IDs to your `.env` file
4. **Test Integration**: Use the test credit card to verify each subscription tier works
5. **Configure Webhooks**: Set up proper event handling for subscription lifecycle

This structure will give you clean, predictable billing that matches your three-tier pricing strategy!