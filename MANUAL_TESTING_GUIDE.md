# Manual Testing Guide - My Pocket Sister

## 🧪 Owner Test Mode Access

### Step 1: Enable Owner Test Session
```bash
# Use curl or any API client to create a test session
curl -X POST "http://localhost:5000/api/test/owner-login" \
  -H "Content-Type: application/json"
```

**Response**: You'll receive a test session that unlocks all features without payment.

### Step 2: Access Test Child Profile
```bash
# View available test child profiles
curl -X GET "http://localhost:5000/api/test/child-profiles" \
  -H "Content-Type: application/json"
```

**Test Child ID**: `test-child-123`
- **Name**: Test Child  
- **Age**: 12
- **Companion**: Stella
- **Token Limit**: 50,000/month
- **Features**: All Stage 2 features unlocked in test mode

### Step 3: Test Feature Access

#### Daily Affirmations
```bash
# View today's affirmations
curl -X GET "http://localhost:5000/api/test/daily-affirmations"

# Generate new affirmation
curl -X POST "http://localhost:5000/api/test/daily-affirmations/generate" \
  -H "Content-Type: application/json" \
  -d '{"personalityType":"playful","category":"confidence"}'
```

#### Mood Tracking (NEW - Feature #4)
```bash
# View mood history
curl -X GET "http://localhost:5000/api/test/mood-entries"

# Create mood entry
curl -X POST "http://localhost:5000/api/test/mood-entries/create" \
  -H "Content-Type: application/json" \
  -d '{"moodRating":4,"emotionTags":["happy","excited"],"notes":"Testing mood tracking!"}'
```

## 🌐 Browser Testing (Child Experience)

### Frontend Access
1. **Open**: `http://localhost:3000` (frontend)
2. **Test Mode**: All premium features automatically unlocked in development
3. **Child Profile**: Use test-child-123 for all interactions

### Available Test Pages:
- **Daily Affirmations**: `/daily-affirmations`
- **Mood Tracker**: `/mood-tracker` 
- **Chat with Stella**: `/chat`
- **Goal Setting**: `/goals` (coming soon)
- **Parent Portal**: `/parent-portal`
- **Admin Dashboard**: `/admin-portal`

### Test User Experience:
1. **No Login Required** in test mode
2. **All Features Unlocked** automatically
3. **Real Database** - your interactions persist
4. **Safe Environment** - separate from production data

## 🎭 Pretend Child Testing Scenarios

### Scenario 1: Daily Routine
1. Check daily affirmations
2. Log current mood (1-5 scale)
3. Chat with Stella about school
4. Set a personal goal

### Scenario 2: Emotional Support
1. Log feeling sad or worried
2. Receive appropriate affirmation
3. Chat about feelings with Stella
4. Track mood improvement over time

### Scenario 3: Achievement Celebration
1. Log feeling proud/happy
2. Share accomplishment with Stella
3. Set new challenge goal
4. Receive encouraging affirmation

## 🔒 Security Notes

- **Test Mode Only**: These endpoints only work in development
- **No Real Payments**: Bypass all subscription checks
- **Isolated Data**: Uses test-child-123 profile
- **Full Feature Access**: Premium features unlocked without payment

## 🚀 Quick Start Commands

```bash
# 1. Start the application
npm run dev

# 2. Create owner test session
curl -X POST "localhost:5000/api/test/owner-login"

# 3. Test daily affirmations
curl -X GET "localhost:5000/api/test/daily-affirmations"

# 4. Test mood tracking
curl -X GET "localhost:5000/api/test/mood-entries"

# 5. Open frontend for child experience
# Navigate to: http://localhost:3000
```

**You now have full access to test the platform as both a child user and admin owner!**