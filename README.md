# My Pocket Sister - AI Companion SaaS Platform

## Overview
My Pocket Sister is a comprehensive SaaS platform providing AI-powered virtual companions for young girls aged 10-14. The platform aims to be a "big sister" figure, offering deep personalization, proactive support, and guidance on relationships and wellness. 

**Stage 2 Implementation Complete (July 2025):** Successfully implemented proactive AI companion features including automated daily affirmations system, mood tracking, goal setting with progress visualization, and tier-based feature restrictions. The AI now initiates conversations, provides personalized daily encouragement, and adapts communication style based on subscription tiers.

Key capabilities include user authentication, subscription-based payments, conversational AI with memory, automated daily affirmations, mood tracking, goal setting, tier-based feature restrictions, proactive companion features, file/image sharing, AI art-generated avatar creation, voice-to-text input, optional ElevenLabs voice responses, parental monitoring, and admin controls.

## User Preferences
Preferred communication style: Simple, everyday language.

## Recent Changes (January 31, 2025)
- **ROBUSTNESS FOR LIVE USE COMPLETED**: Removed all fallback systems and mock data
- **DATABASE SCHEMA FIXES**: Added missing columns (tokens_used, monthly_token_limit, daily_affirmations_limit, etc.)
- **REAL DATA PERSISTENCE**: Child profiles and pricing plans now fully database-driven with real UUIDs
- **AUTHENTICATION HARDENED**: Fixed TypeScript issues and strengthened session-based protection
- **STAGE 2 FEATURES READY**: All proactive companion features database-ready with tier restrictions
- Created comprehensive HTML documentation guide covering entire platform
- Added documentation access link in admin portal header
- Enhanced test dashboard with full platform testing capabilities
- Integrated documentation endpoint API for programmatic access

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Styling**: Tailwind CSS with a custom design system
- **UI Components**: Radix UI with shadcn/ui component library
- **State Management**: TanStack Query for server state
- **Routing**: Wouter for client-side routing
- **Build Tool**: Vite with React plugin
- **Mobile Development**: Hybrid WebView wrappers for Android and iOS, supporting biometric authentication, push notifications, and deep linking.

### Backend Architecture
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js REST API
- **Authentication**: Replit Auth with multi-provider OAuth (Google, Meta, Yahoo, Microsoft, LinkedIn)
- **Payments**: Stripe integration for subscription billing with a 7-day free trial, token-based usage tracking, and a comprehensive admin portal.
- **Database ORM**: Drizzle ORM
- **Database**: PostgreSQL (configured for Neon Database)
- **Session Management**: Express sessions with PostgreSQL store

### Project Structure
- **Monorepo Layout**: Shared types and schemas between client and server.
- **Client**: React frontend in `/client` directory.
- **Server**: Express API in `/server` directory.
- **Shared**: Common schemas and types in `/shared` directory.

### Key Features and Specifications
- **Authentication System**: Secure user login and management.
- **Subscription Management**: Three-tier pricing (Basic, Premium, Family) with tier-based feature restrictions for proactive companion features.
- **Proactive AI Companion Features (Stage 2)**: 
  - Automated daily affirmations system with personality-based messaging
  - Mood tracking with 30-day history and trend analysis
  - Goal setting with progress tracking and completion celebrations
  - Advanced personality AI for premium users with memory-based conversations
  - Tier-based feature restrictions (Basic: 1 affirmation, Premium: 3 affirmations + mood/goal tracking, Family: 5 affirmations + all features)
- **Admin Portal**: Comprehensive control for user management, payment configuration, and system-wide announcements.
- **AI Avatar Component**: Interactive "Stella" AI companion with category-based responses, personalized responses based on interaction history, and communication style adaptation.
- **Child Profile Management**: Support for multiple child profiles per family account.
- **Content Systems**: Blog, Testimonial, Contact, and Motivational Messages systems.
- **Legal Compliance**: Integrated Terms of Service, Privacy Policy, Parental Consent Agreement, and Community Guidelines.
- **Notifications**: Push notification system for mobile apps and parent portal, including real-time usage alerts and email notifications via Bluehost SMTP.
- **Web Content Request System**: Allows YouTube/website browsing with parent upgrade prompts.

### Data Models
- **Users**: Authentication data, subscription status, admin privileges.
- **Child Profiles**: Individual profiles linked to user accounts with age and preferences.
- **Pricing Plans**: Subscription tiers with features and Stripe integration.
- **Subscriptions**: User subscription tracking with Stripe data.
- **Announcements**: Admin-created broadcasts.
- **Sessions**: Secure session storage.
- **Blog Posts**: Title, content, category, images, read time, likes.
- **Testimonials**: User feedback with ratings.
- **Contact Messages**: User inquiries.
- **Motivational Messages**: Categorized inspirational content.

## External Dependencies

- **React ecosystem**: React, React DOM, React Query.
- **UI Library**: Radix UI components, Lucide React icons.
- **Styling**: Tailwind CSS, class-variance-authority, clsx.
- **Forms**: React Hook Form with Hookform resolvers.
- **Date handling**: date-fns.
- **Build tools**: Vite, esbuild.
- **TypeScript**: For full type safety.
- **Database ORM**: Drizzle ORM with PostgreSQL dialect.
- **Database Connection**: Neon Database (PostgreSQL).
- **Payment Gateway**: Stripe.
- **Authentication**: Replit Auth, Google, Meta, Yahoo, Microsoft, LinkedIn (OAuth providers).
- **Email Service**: Bluehost SMTP.
- **AI Art Generation**: DALL-E (for avatar creation).
- **Voice Synthesis**: ElevenLabs (optional).
