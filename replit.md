# My Pocket Sister - AI Companion SaaS Platform

## Overview
My Pocket Sister is a SaaS platform providing AI-powered virtual companions for young girls (10-14), acting as a "big sister" to offer personalized support, guidance, and companionship. It includes features like user authentication, subscription payments, conversational AI with memory, daily affirmations, mood tracking, goal setting, AI-generated avatar creation, parental monitoring, and admin controls. The project aims to tap into the market for safe, engaging, and personalized AI companionship for pre-teen girls.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Styling**: Tailwind CSS with custom design system, Radix UI with shadcn/ui
- **State Management**: TanStack Query
- **Routing**: Wouter
- **Build Tool**: Vite
- **Mobile Development**: Hybrid WebView wrappers for Android and iOS with native GPS tracking, device activation, parent-child messaging, and secure communication.

### Backend Architecture
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js REST API
- **Authentication**: Replit Auth with multi-provider OAuth (Google, Meta, Yahoo, Microsoft, LinkedIn)
- **Payments**: Stripe for subscription billing with 7-day free trial and token-based usage tracking.
- **Database ORM**: Drizzle ORM
- **Database**: PostgreSQL (configured for Neon Database)
- **Session Management**: Express sessions with PostgreSQL store

### Project Structure
- **Monorepo**: `/shared` (types/schemas), `/client` (React frontend), `/server` (Express API), `/mobile` (Android/iOS WebView wrappers).

### Core Features & Design Decisions
- **User Authentication & Security**: Multi-provider OAuth, secure session management, COPPA-compliant parental consent.
- **User & Profile Management**: User registration, multiple child profiles per family account, age-appropriate content filtering, parent portal.
- **Advanced AI Companion System**: Context-aware conversations with hybrid PostgreSQL + memory caching, Gemini AI integration, intelligent conversation management, personality adaptation, memory management, multiple AI personalities, voice integration, file/image sharing, intelligent feature discovery.
- **Proactive Companion Features**: Daily affirmations, mood tracking, goal setting, tier-based restrictions, smart scheduling.
- **Subscription & Payment System**: Three-tier pricing (Basic, Premium, Family) with 7-day free trial, Stripe integration, token-based usage tracking.
- **Comprehensive Admin Dashboard**: Enterprise-grade admin portal with secure authentication (no default credentials), real-time usage metrics tracking, GPS data management with privacy controls, customizable offline message templates with dynamic variables, comprehensive analytics and monitoring.
- **GPS Permission System**: Graceful location permission handling that doesn't break when users deny access, integrated permission UI in chat interface, easy re-permission granting, privacy-first design with parental safety explanations.
- **Avatar Creation System**: Interactive avatar design with customization, item unlocking, saving/export, randomization, AI-powered graphics generation.
- **Notification System**: Push notifications for Android/iOS, configurable preferences, quiet hours, email, history.
- **Content & Communication**: Web content request system with parental controls, YouTube/website browsing, blog, testimonials, contact form, motivational messages.
- **Analytics & Monitoring**: Real-time usage tracking, conversation performance, user engagement, system health, error tracking.
- **Enhanced Parent Portal**: Real-time GPS tracking with geofencing, comprehensive app usage controls with detailed analytics, privacy-preserving safety monitoring with predictive alerts, smart usage limits with break reminders and emergency overrides.
- **Parent-Child Communication System**: Messaging system, device activation approval, real-time GPS tracking.
- **Mobile Applications**: Native WebView wrappers for Android and iOS with GPS integration and secure API communication.
- **AI Provider Flexibility**: Abstraction layer supporting multiple AI providers (Gemini, OpenAI, Anthropic, custom microservices) with admin controls and fallback system.
- **Venture Capital Package**: Complete 13-section pitch deck with $12.3B TAM analysis, $135M revenue projections, competitive positioning, and strategic fundraising roadmap.
- **UI/UX Decisions**: Custom design system with Tailwind CSS and Radix UI components for a cohesive, age-appropriate visual experience.

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