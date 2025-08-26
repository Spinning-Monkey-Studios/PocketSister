# My Pocket Sister - AI Companion SaaS Platform

## Overview
My Pocket Sister is a SaaS platform providing AI-powered virtual companions for young girls (10-14), acting as a "big sister" to offer personalized support, guidance, and companionship. It includes features like user authentication, subscription payments, conversational AI with memory, daily affirmations, mood tracking, goal setting, AI-generated avatar creation, parental monitoring, and admin controls. The project aims to tap into the market for safe, engaging, and personalized AI companionship for pre-teen girls.

## User Preferences
Preferred communication style: Simple, everyday language.

## Recent Changes
- **Database Migration Fix (August 13, 2025)**: Fixed deployment failures due to database schema mismatch in admin_users table. Applied proper database migration to create missing columns (first_name, last_name, role, is_active, etc.). Added comprehensive error handling to prevent initialization failures. Created deploy.sh script for automated database migration during deployment.
- **Enhanced Error Handling**: Added robust database error handling with specific error codes and helpful guidance messages.
- **Deployment Process**: Improved deployment reliability with pre-deployment database schema validation.

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
- **Content & Communication**: Web content request system with parental controls, YouTube/website browsing, blog, testimonials, contact form, motivational messages, comprehensive support system with ticketing and admin-configurable contact information.
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

## Deployment Guide

### Database Migration
The application requires proper database schema setup before deployment. The admin_users table must have the correct columns (first_name, last_name, role, is_active, two_factor_secret, etc.).

### Deployment Process
1. **Automatic Migration**: Run `npm run db:push` to apply database schema changes
2. **Use Deploy Script**: Execute `./deploy.sh` for comprehensive deployment with error handling
3. **Manual Deployment**: Use Replit's Deploy button after ensuring database is migrated

### Deployment Checklist
- [ ] Database URL configured (DATABASE_URL environment variable)
- [ ] Database schema migrated (`npm run db:push`)
- [ ] Admin user initialized (automatic on first run)
- [ ] Frontend builds successfully (`npm run build:client`)
- [ ] Server builds successfully (`npm run build:server`)
- [ ] Type checking passes (`npm run check`)

### Admin Access
- **Default Admin Email**: admin@mypocketsister.com
- **Default Password**: admin123 (change immediately after first login)
- **Admin Routes**: `/admin` for login, dashboard access requires authentication

### Common Deployment Issues
- **Database column errors**: Run `npm run db:push` to migrate schema
- **Admin initialization fails**: Check database connection and schema
- **Build failures**: Verify all dependencies are installed and TypeScript errors resolved