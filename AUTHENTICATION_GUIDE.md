# Authentication System Guide

## Current Implementation: Replit Auth

The application currently uses **Replit Auth**, which provides enterprise-grade authentication with minimal setup. This system is tightly coupled to the Replit platform but offers excellent security and user experience.

### Replit Auth Features:
- Enterprise-grade infrastructure (Firebase, Google Cloud Identity Platform)
- Built-in security features (reCAPTCHA, Stytch, Clearout)
- Automatic user management and database integration
- Single-click authentication setup
- Multi-provider OAuth support (Google, GitHub, Discord, etc.)

### Current Implementation Location:
- File: `server/replitAuth.ts`
- Uses OpenID Connect with Replit's OIDC provider
- Session management with PostgreSQL store
- Automatic user profile creation

## Deployment Flexibility Options

### Option 1: Keep Replit Auth (Recommended for Replit hosting)
**When to use:** Hosting exclusively on Replit platform
**Pros:** Zero configuration, enterprise security, seamless integration
**Cons:** Vendor lock-in to Replit platform

### Option 2: Generic OAuth + Email/Password Authentication
**When to use:** Hosting on external platforms (AWS, Vercel, etc.)
**Pros:** Platform independence, multiple provider support, familiar user experience
**Cons:** Requires additional configuration and security considerations

### Option 3: Hybrid Approach (Recommended for maximum flexibility)
**When to use:** Want deployment flexibility with minimal code changes
**Pros:** Works on Replit AND external platforms, gradual migration path
**Cons:** Slightly more complex configuration

## Implementation Guide for External Hosting

### 1. Environment-Based Authentication Selection

Add to your environment variables:
```env
# Authentication Configuration
AUTH_PROVIDER=generic  # 'replit' or 'generic'
SESSION_SECRET=your-secure-session-secret

# OAuth Providers (optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# App Configuration
APP_URL=https://yourdomain.com
```

### 2. Modified Authentication Setup

Update `server/index.ts`:
```typescript
// Dynamic authentication based on environment
if (process.env.AUTH_PROVIDER === 'generic') {
  const { createGenericAuth } = await import('./auth/generic-auth');
  const genericAuth = createGenericAuth();
  genericAuth.initialize(app);
  
  // Use generic auth middleware
  app.use('/api/protected', genericAuth.requireAuth.bind(genericAuth));
} else {
  // Use Replit Auth (default)
  await setupAuth(app);
  app.use('/api/protected', isAuthenticated);
}
```

### 3. Database Schema Flexibility

The user schema already supports both authentication methods:
```sql
-- Replit Auth fields
id, email, firstName, lastName, profileImageUrl

-- Generic Auth fields  
username, name, avatarUrl, provider, providerId, hashedPassword, emailVerified
```

### 4. Frontend Authentication Handling

Create a unified authentication hook:
```typescript
// client/src/hooks/useAuth.ts
export function useAuth() {
  const { data: user, isLoading } = useQuery({
    queryKey: ['auth-user'],
    queryFn: async () => {
      const response = await fetch('/api/auth/user');
      if (!response.ok) throw new Error('Not authenticated');
      return response.json();
    }
  });

  const login = (provider?: string) => {
    if (provider) {
      window.location.href = `/auth/${provider}`;
    } else {
      // Redirect to login page
      window.location.href = '/login';
    }
  };

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/';
  };

  return { user, isLoading, login, logout };
}
```

## Migration Strategy

### Phase 1: Implement Hybrid Support
1. Add environment-based authentication switching
2. Ensure database schema supports both methods
3. Test on Replit with existing Replit Auth

### Phase 2: Add Generic Auth Routes
1. Implement OAuth providers (Google, GitHub)
2. Add email/password registration/login
3. Test authentication flows

### Phase 3: Frontend Abstraction
1. Create unified authentication hooks
2. Update UI components to work with both systems
3. Add provider selection UI

### Phase 4: External Deployment
1. Deploy to target platform
2. Configure OAuth applications
3. Set environment variables
4. Test complete authentication flow

## Security Considerations

### For External Hosting:
1. **Session Security:** Use secure session secrets and HTTPS
2. **OAuth Configuration:** Properly configure redirect URIs
3. **Password Security:** Use bcrypt with appropriate salt rounds
4. **Rate Limiting:** Implement login attempt rate limiting
5. **CSRF Protection:** Add CSRF tokens for sensitive operations

### For Replit Hosting:
1. **Minimal Configuration:** Replit Auth handles most security automatically
2. **Session Management:** Uses enterprise-grade session infrastructure
3. **OAuth Security:** Managed by Replit's security team

## Recommended Implementation

For maximum deployment flexibility, implement the **Hybrid Approach**:

1. **Default to Replit Auth** when `AUTH_PROVIDER` is not set or equals 'replit'
2. **Switch to Generic Auth** when `AUTH_PROVIDER=generic`
3. **Unified User Interface** that works with both systems
4. **Database Schema** that supports both authentication methods

This approach allows you to:
- ✅ Continue using Replit Auth on Replit
- ✅ Switch to generic auth for external hosting
- ✅ Maintain the same user experience
- ✅ Keep existing user data
- ✅ Deploy anywhere without vendor lock-in

## Example Environment Configurations

### For Replit Deployment:
```env
# Uses Replit Auth automatically
REPLIT_DOMAINS=your-app.replit.app
DATABASE_URL=postgresql://...
```

### For External Deployment:
```env
AUTH_PROVIDER=generic
SESSION_SECRET=secure-random-string
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
APP_URL=https://yourdomain.com
DATABASE_URL=postgresql://...
```

This guide ensures your AI companion application can be deployed flexibly while maintaining security and user experience standards.