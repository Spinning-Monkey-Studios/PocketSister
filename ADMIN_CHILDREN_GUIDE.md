# Admin Children Management Guide
*Complete system for managing multiple children with different ages and subscription tiers*

## Token Pricing Clarification

**$0.01 = 1 Complete AI Conversation Exchange**

This includes:
- Child sends message to AI companion
- AI processes with personality features, safety monitoring, context analysis
- AI responds with personalized, age-appropriate content
- Approximately 100-500 actual tokens depending on conversation complexity

**Example Usage:**
- Child: "I'm nervous about my math test tomorrow"
- AI: "I understand feeling nervous about tests! That shows you care about doing well. Here are some strategies that might help you feel more confident..." (full personalized response)
- **Cost: $0.01**

## Setting Up Your 5 Test Children

### Create Test Family
```bash
# Create 5 children with different ages and personalities
curl -X POST http://localhost:5000/api/admin/children/create-test-family \
  -H "Content-Type: application/json" \
  -d '{"parentEmail": "your-email@example.com"}'

# Response:
{
  "success": true,
  "message": "Created 5 test children for your-email@example.com",
  "children": [
    {
      "id": "child-1",
      "name": "Emma",
      "age": 7,
      "parentEmail": "your-email@example.com",
      "subscriptionTier": "family",
      "companionName": "Sparkle",
      "personality": "Creative and imaginative, loves art and stories"
    },
    {
      "id": "child-2", 
      "name": "Sophia",
      "age": 10,
      "parentEmail": "your-email@example.com",
      "subscriptionTier": "family",
      "companionName": "Luna",
      "personality": "Curious and studious, asks lots of questions"
    },
    {
      "id": "child-3",
      "name": "Ava", 
      "age": 12,
      "parentEmail": "your-email@example.com",
      "subscriptionTier": "family",
      "companionName": "Nova",
      "personality": "Social butterfly, interested in friendships"
    },
    {
      "id": "child-4",
      "name": "Isabella",
      "age": 14,
      "parentEmail": "your-email@example.com", 
      "subscriptionTier": "family",
      "companionName": "Sage",
      "personality": "Thoughtful and introspective, planning for high school"
    },
    {
      "id": "child-5",
      "name": "Mia",
      "age": 9,
      "parentEmail": "your-email@example.com",
      "subscriptionTier": "family", 
      "companionName": "Sunny",
      "personality": "Athletic and energetic, loves sports and outdoor activities"
    }
  ]
}
```

## Admin Backend - View All Children by Age Groups

### Get Children Grouped by Age
```bash
curl http://localhost:5000/api/admin/children

# Response:
{
  "success": true,
  "totalChildren": 5,
  "ageGroups": [
    {
      "ageGroup": "Early Elementary (5-8)",
      "count": 1,
      "children": [
        {
          "id": "child-1",
          "name": "Emma",
          "age": 7,
          "parentEmail": "your-email@example.com",
          "parentName": "Test Parent",
          "subscriptionTier": "family",
          "subscriptionStatus": "active",
          "tokensUsedThisMonth": 25,
          "companionName": "Sparkle"
        }
      ]
    },
    {
      "ageGroup": "Late Elementary (9-11)",
      "count": 2,
      "children": [
        {
          "id": "child-5",
          "name": "Mia",
          "age": 9,
          "subscriptionTier": "family",
          "tokensUsedThisMonth": 42
        },
        {
          "id": "child-2",
          "name": "Sophia", 
          "age": 10,
          "subscriptionTier": "family",
          "tokensUsedThisMonth": 38
        }
      ]
    },
    {
      "ageGroup": "Middle School (12-14)",
      "count": 2,
      "children": [
        {
          "id": "child-3",
          "name": "Ava",
          "age": 12,
          "subscriptionTier": "family",
          "tokensUsedThisMonth": 31
        },
        {
          "id": "child-4",
          "name": "Isabella",
          "age": 14, 
          "subscriptionTier": "family",
          "tokensUsedThisMonth": 18
        }
      ]
    }
  ]
}
```

## Admin Functions - Update Names and Subscriptions

### Update Child Name
```bash
curl -X PUT http://localhost:5000/api/admin/children/child-1/name \
  -H "Content-Type: application/json" \
  -d '{"name": "Emily"}'

# Response:
{
  "success": true,
  "message": "Child name updated to Emily"
}
```

### Update Parent Subscription Level
```bash
# Change Emma's parent from Family to Premium tier
curl -X PUT http://localhost:5000/api/admin/children/child-1/subscription \
  -H "Content-Type: application/json" \
  -d '{"tier": "premium"}'

# Response:
{
  "success": true, 
  "message": "Parent subscription updated to premium"
}
```

### Available Subscription Tiers
- **free**: 500 tokens total during trial, then blocked
- **basic**: $4.99/month + 50 interactions included + $0.01 per overage
- **premium**: $9.99/month + 200 interactions included + $0.01 per overage  
- **family**: $19.99/month + 300 interactions shared + $0.01 per overage

## Admin Dashboard Stats

### Get System Overview
```bash
curl http://localhost:5000/api/admin/stats

# Response:
{
  "success": true,
  "stats": {
    "totalChildren": 5,
    "totalParents": 1,
    "subscriptionTiers": {
      "family": 1,
      "premium": 0,
      "basic": 0,
      "free": 0
    },
    "ageDistribution": {
      "5-8": 1,
      "9-11": 2, 
      "12-14": 2,
      "15+": 0
    },
    "monthlyUsage": {
      "totalInteractions": 154,
      "averagePerChild": 31
    }
  }
}
```

## Age-Appropriate Personality Differences

### Early Elementary (5-8): Emma
- **Companion**: Sparkle
- **Personality**: Creative, imaginative, loves art and stories
- **AI Approach**: Simple language, lots of encouragement, creative activities
- **Topics**: Art, simple stories, basic emotions, family

### Late Elementary (9-11): Sophia & Mia
- **Sophia** - Luna: Curious, studious, asks questions
  - AI focuses on learning, exploration, "why" questions
- **Mia** - Sunny: Athletic, energetic, sports-focused
  - AI discusses physical activities, teamwork, healthy habits

### Middle School (12-14): Ava & Isabella  
- **Ava** - Nova: Social butterfly, friendship-focused
  - AI helps with social dynamics, peer relationships, confidence
- **Isabella** - Sage: Thoughtful, planning for high school
  - AI discusses future goals, academic planning, deeper conversations

## Testing Different Subscription Behaviors

### Test Tier Restrictions
```bash
# Set Emma's family to Basic tier (limits her to basic personalities)
curl -X PUT http://localhost:5000/api/admin/children/child-1/subscription \
  -d '{"tier": "basic"}'

# Check Emma's available personalities
curl http://localhost:5000/api/personalities/child-1
# Should show premium personalities as "ghosted/unavailable"

# Set Sophia's family to Premium tier
curl -X PUT http://localhost:5000/api/admin/children/child-2/subscription \
  -d '{"tier": "premium"}'

# Check Sophia's available personalities  
curl http://localhost:5000/api/personalities/child-2
# Should show advanced AI personalities available
```

### Test Usage Limits
```bash
# Simulate Premium tier hitting 200 interaction limit
for i in {1..201}; do
  curl -X POST http://localhost:5000/api/track-interaction \
    -d '{"childId": "child-2", "tokensUsed": 1}'
done

# 201st interaction should return:
{
  "success": true,
  "usage": 201,
  "limit": 200, 
  "overageCharge": 0.01,
  "message": "Overage: 1 interaction × $0.01 = $0.01"
}
```

## Quick Admin Setup Commands

```bash
# 1. Login as admin
curl -X POST http://localhost:5000/api/admin/login -d '{"secret": "admin123"}'

# 2. Create your test family
curl -X POST http://localhost:5000/api/admin/children/create-test-family \
  -d '{"parentEmail": "your-email@example.com"}'

# 3. View all children by age groups
curl http://localhost:5000/api/admin/children

# 4. Get system stats
curl http://localhost:5000/api/admin/stats

# 5. Test different subscription tiers on different children
curl -X PUT http://localhost:5000/api/admin/children/[child-id]/subscription \
  -d '{"tier": "premium"}'
```

Your admin system is now ready to manage multiple children with different ages, personalities, and subscription levels!