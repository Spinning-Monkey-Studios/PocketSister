# My Pocket Sister - AI Companion SaaS Platform

## Overview
My Pocket Sister is a comprehensive SaaS platform providing AI-powered virtual companions for young girls aged 10-14. It aims to be a "big sister" figure, offering deep personalization, proactive support, and guidance on relationships and wellness. Key capabilities include user authentication, subscription-based payments, conversational AI with memory, automated daily affirmations, mood tracking, goal setting, proactive companion features, file/image sharing, AI art-generated avatar creation, voice input, optional voice responses, parental monitoring, and admin controls. The project envisions a significant market potential for personalized, safe, and engaging AI companionship for pre-teen girls.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Styling**: Tailwind CSS with a custom design system, Radix UI with shadcn/ui
- **State Management**: TanStack Query
- **Routing**: Wouter
- **Build Tool**: Vite
- **Mobile Development**: Hybrid WebView wrappers for Android and iOS with native GPS tracking, device activation workflow, parent-child messaging, and secure communication bridge.

### Backend Architecture
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js REST API
- **Authentication**: Replit Auth with multi-provider OAuth (Google, Meta, Yahoo, Microsoft, LinkedIn)
- **Payments**: Stripe for subscription billing with a 7-day free trial and token-based usage tracking.
- **Database ORM**: Drizzle ORM
- **Database**: PostgreSQL (configured for Neon Database)
- **Session Management**: Express sessions with PostgreSQL store

### Project Structure
- **Monorepo**: Shared types and schemas in `/shared`.
- **Client**: React frontend in `/client`.
- **Server**: Express API in `/server`.
- **Mobile**: Android and iOS WebView wrappers in `/mobile` with Visual Studio solution files for compilation.

### Core Features & Design Decisions
- **User Authentication & Security**: Multi-provider OAuth, secure session management, admin secret-based auth, COPPA-compliant parental consent.
- **User & Profile Management**: User registration, multiple child profiles per family account, age-appropriate content filtering, parent portal.
- **Advanced AI Companion System**: Context-aware conversations with hybrid PostgreSQL + memory caching, Gemini AI integration, intelligent conversation management (AI-powered naming, tabs, groups), personality adaptation, memory management (conversation history analysis), multiple AI personalities, voice integration, file/image sharing, conversation preservation, intelligent feature discovery.
- **Proactive Companion Features**: Daily affirmations, mood tracking, goal setting, tier-based restrictions, smart scheduling (AI-initiated conversations and check-ins).
- **Subscription & Payment System**: Three-tier pricing (Basic, Premium, Family) with 7-day free trial, Stripe integration, token-based usage tracking.
- **Admin Portal & Management**: Secure admin authentication, comprehensive user/child profile management, system statistics, subscription tier control, beta access, system-wide announcements, API configuration.
- **Avatar Creation System**: Interactive avatar design game with customization, item unlocking based on progression/subscription, saving/export, randomization. AI-powered avatar graphics generation using Gemini for art creation.
- **Notification System**: Push notifications for Android/iOS, configurable preferences, quiet hours, email, notification history.
- **Content & Communication**: Web content request system with parental controls, YouTube/website browsing, blog, testimonials, contact form, motivational messages.
- **Analytics & Monitoring**: Real-time usage tracking, conversation performance, user engagement, system health, error tracking.
- **Parent Portal**: Privacy-preserving controls for age/personality settings, safety monitoring without exposing private conversations, real-time safety alerts.
- **Parent-Child Communication System**: Comprehensive messaging system allowing parents to send messages to children through admin backend, device activation approval workflow, and real-time GPS tracking with privacy controls.
- **Mobile Applications**: Native WebView wrappers for Android and iOS with GPS integration, device activation requests, and secure communication with backend APIs.
- **AI Provider Flexibility**: Abstraction layer supporting multiple AI providers (Gemini, OpenAI, Anthropic, custom microservices) with admin controls and fallback system.
- **UI/UX Decisions**: Custom design system built with Tailwind CSS and Radix UI components, ensuring a cohesive and age-appropriate visual experience.

## Feature Documentation by Subscription Tier

### Basic Tier (Free Trial + $9.99/month)
**Core AI Companion Features:**
- Basic conversational AI with personality adaptation
- Daily affirmations (1 per day)
- Simple avatar creation with basic customization options
- Basic mood tracking
- Limited conversation history (7 days)
- Standard safety monitoring
- Basic parent controls (content filtering, time limits)
- Email notifications only

**Usage Limits:**
- 50 AI interactions per day
- 1 child profile per account
- Basic personality profiles
- Standard response times

### Premium Tier ($19.99/month)
**Enhanced AI Experience:**
- Advanced conversational AI with deep personality learning
- Daily affirmations (3 per day) + proactive check-ins
- Advanced avatar creation with AI-generated graphics
- Comprehensive mood tracking with insights
- Extended conversation history (30 days)
- Enhanced safety monitoring with real-time alerts
- Advanced parent controls with detailed analytics
- Push notifications + email alerts
- Voice input and optional voice responses
- File and image sharing capabilities

**Usage Limits:**
- 200 AI interactions per day
- Up to 3 child profiles per account
- Advanced personality adaptation
- Priority response times
- Background music selection

### Family Tier ($29.99/month)
**Complete Family Solution:**
- All Premium features for unlimited children
- Unlimited AI interactions
- Advanced proactive companion features
- AI-initiated conversations and smart scheduling
- Complete conversation preservation (90 days)
- Real-time GPS tracking and location services
- Parent-child messaging system
- Device activation workflow
- Comprehensive analytics and reporting
- Priority customer support
- Beta feature access

**Family Management:**
- Unlimited child profiles
- Advanced family analytics
- Cross-device synchronization
- Family safety dashboard
- Custom notification preferences per child

## AI Assistant Context & Capabilities

### Core AI Functions by Category

**Conversation Management:**
- Context-aware dialogue with memory retention
- Personality adaptation based on child's age, interests, and behavior
- Intelligent conversation naming and organization
- Multi-turn conversation support with context preservation
- Emotion recognition and appropriate response generation

**Learning & Adaptation:**
- Child interest analysis and categorization
- Conversation history analysis for personality insights
- Behavioral pattern recognition
- Activity-based learning (chat, games, creative activities)
- Memory consolidation for long-term relationship building

**Safety & Monitoring:**
- Real-time content analysis and safety scoring
- Inappropriate content detection and filtering
- Safety alert generation with severity levels (low, medium, high, critical)
- Parent notification system for safety concerns
- Age-appropriate content enforcement

**Proactive Features:**
- Daily affirmation generation based on child's needs and mood
- Mood tracking with personalized responses
- Goal setting and progress monitoring
- Smart scheduling for check-ins and conversations
- Event-triggered interactions (mood changes, achievements)

**Creative & Interactive:**
- Avatar creation assistance and customization guidance
- Background music selection based on mood and activity
- Creative writing and storytelling support
- Educational content delivery
- Interactive games and activities

### Database Operations for AI Context

**Child Profile Data:**
- Personal information, age, interests, personality traits
- Subscription tier and feature access levels
- Avatar customization preferences and current selections
- Safety settings and parental controls

**Conversation & Memory Management:**
- Conversation history with role-based message storage
- Context caching for improved response times
- Memory extraction and topic analysis
- Personality learning data and behavioral insights

**Safety & Monitoring:**
- Safety alert tracking and resolution status
- Content review logs and safety scores
- Parent control settings and restriction management
- Emergency contact information and protocols

## Technical Implementation Notes

### AI Provider Integration
- Primary: Google Gemini with context caching for efficiency
- Fallback: OpenAI GPT models for redundancy
- Custom: Anthropic Claude for specialized safety analysis
- Extensible architecture for future AI provider additions

### Performance Optimizations
- Conversation context caching to reduce API costs
- Intelligent conversation grouping and management
- Background processing for non-critical operations
- Database query optimization for large-scale operations

### Security & Privacy
- COPPA-compliant data handling for children under 13
- End-to-end encryption for sensitive communications
- Privacy-preserving parent monitoring (safety alerts without conversation exposure)
- Secure session management with PostgreSQL storage

## External Dependencies

- **Database**: Neon Database (PostgreSQL).
- **Payment Gateway**: Stripe.
- **Authentication**: Replit Auth, Google, Meta, Yahoo, Microsoft, LinkedIn (OAuth providers).
- **Email Service**: Bluehost SMTP.
- **AI Art Generation**: DALL-E (for avatar creation).
- **Voice Synthesis**: ElevenLabs (optional).
- **AI Models**: Google Gemini (primary).
- **UI Icons**: Lucide React.
- **Date Handling**: date-fns.
- **Image Processing**: sharp (for avatar graphics).
- **Music Metadata**: music-metadata.

## Recent Updates & Context Limitations

### Deployment Readiness (August 2025)
- ✅ Resolved all TypeScript compilation errors
- ✅ Implemented 50+ missing database methods
- ✅ Fixed method signatures across all server components
- ✅ Successfully building client and server without errors
- ✅ Daily affirmations system operational
- ✅ Ready for production deployment

### Replit Agent Capabilities
According to Replit documentation, agents don't have explicit context limitations for app size. The platform uses this `replit.md` file to understand project context and preferences. For complex applications like this one:
- Advanced features like "Extended Thinking" and "High Power mode" available for complex builds
- No strict character limits, but keeping documentation focused improves performance
- Complex projects benefit from well-structured documentation and clear feature organization