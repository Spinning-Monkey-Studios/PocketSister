# Parent-Child Communication and Monitoring System

## Overview

MyPocketSister now includes a comprehensive parent-child communication and monitoring system that allows parents to send messages to their children through an admin backend, requires parent activation when children install the app, and provides real-time GPS tracking of children's locations through mobile wrappers for Android and iOS.

## Key Features

### 1. Parent-to-Child Messaging
- Parents can send messages, encouragement, reminders, and achievement notifications to their children
- Message types: General, Encouragement, Reminder, Achievement
- Priority levels: Low, Normal, High, Urgent
- Read receipts and delivery confirmations
- Scheduled messaging capability

### 2. Child App Activation System
- Children must request activation when installing the app
- Parents receive activation requests through the parent dashboard
- Parents can approve or reject device activations
- Device management with platform detection (Android/iOS)
- Unique device ID tracking and last seen timestamps

### 3. GPS Location Tracking
- Real-time location tracking with parental consent
- Privacy-compliant location sharing settings
- Emergency location requests
- Location history and battery level monitoring
- Configurable tracking intervals and time restrictions
- Geofencing capabilities (planned)

### 4. Parent Dashboard
- Comprehensive web interface for parents
- Message management and sending
- Device activation approval
- Location monitoring and history
- Privacy and safety settings configuration

## Technical Implementation

### Database Schema
The system includes several new database tables:
- `parent_messages`: Stores messages from parents to children
- `child_devices`: Manages device registrations and activations
- `child_locations`: GPS location data with privacy protection
- `location_settings`: Configurable privacy and tracking settings
- `activation_requests`: Device activation approval workflow

### Mobile Applications

#### Android Implementation
- WebView wrapper with native GPS integration
- Location permissions and battery optimization handling
- JavaScript bridge for communication with web app
- Background location service capability
- Device info collection (platform, version, name)

#### iOS Implementation
- WKWebView with Core Location integration
- Location permission management
- JavaScript message handlers for native bridge
- Battery level monitoring
- Device identifier and info collection

### API Endpoints
- **POST** `/api/parent-messaging/send-message` - Send message to child
- **GET** `/api/parent-messaging/messages/:childId` - Get child messages
- **POST** `/api/parent-messaging/location` - Report child location
- **GET** `/api/parent-messaging/location/:childId` - Get location history
- **POST** `/api/parent-messaging/request-activation` - Request device activation
- **PATCH** `/api/parent-messaging/activation-request/:requestId` - Approve/reject activation

## Security and Privacy

### Privacy Protection
- Location data is encrypted and stored securely
- Parents must explicitly enable location sharing
- Children can see what location data is being shared
- Emergency-only tracking option available
- Time-based restrictions for location tracking

### Authentication
- Parent authentication required for all admin functions
- Device-specific authentication for child apps
- Secure device ID generation and validation
- Session management with proper access controls

### Data Retention
- Location data automatically expires after configurable period
- Message history maintained with proper archival
- Device activations logged for audit purposes

## Deployment Structure

### Mobile App Compilation
The project includes Visual Studio solution files for both platforms:
- `mobile/MyPocketSister.sln` - Main solution file
- `mobile/android/MyPocketSister.Android.csproj` - Android project
- `mobile/ios/MyPocketSister.iOS.csproj` - iOS project

### Platform Requirements
- **Android**: API level 21+ (Android 5.0)
- **iOS**: iOS 11.0+
- **Backend**: Node.js with Express and PostgreSQL
- **Frontend**: React with TypeScript

## Getting Started

### For Parents
1. Log into the parent dashboard at `/parent-dashboard`
2. Set up child profiles and privacy settings
3. Approve device activation requests
4. Configure location sharing preferences
5. Send messages and monitor safety

### For Children
1. Install the mobile app on Android or iOS
2. Request device activation through the app
3. Wait for parent approval
4. Configure privacy settings with parent guidance
5. Use the app safely with parental oversight

### For Developers
1. Run database migrations: `npm run db:push`
2. Start the development server: `npm run dev`
3. Build mobile apps using Visual Studio or appropriate tools
4. Configure API endpoints for production deployment

## Important Notes

### iOS Compilation
- iOS app compilation requires an Apple device with Xcode
- Provisioning profiles and certificates needed for App Store distribution
- Testing on iOS Simulator available for development

### GPS Privacy Compliance
- Location tracking requires explicit user consent
- Parents and children both must agree to location sharing
- Emergency location features respect privacy settings
- Data minimization principles applied throughout

### Production Considerations
- Configure HTTPS for all API endpoints
- Set up proper SSL certificates for mobile communication
- Implement rate limiting for API endpoints
- Monitor location data storage and retention policies

## Future Enhancements

1. **Geofencing**: Automatic notifications when children enter/leave safe areas
2. **Emergency Contacts**: Quick contact system for emergency situations
3. **Location Sharing Groups**: Multiple family members can view locations
4. **Advanced Analytics**: Location patterns and safety insights
5. **Push Notifications**: Real-time alerts for parents
6. **Voice Messages**: Audio message capability between parents and children

This system provides a comprehensive foundation for safe parent-child communication while respecting privacy and maintaining security throughout all interactions.