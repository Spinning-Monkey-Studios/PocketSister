# My Pocket Sister - Mobile App Deployment

This directory contains the mobile app wrappers for Android and iOS platforms.

## Project Structure

```
mobile/
├── android/               # Android Studio project
├── ios/                  # Xcode project
├── shared/               # Shared resources and configurations
└── deployment/          # Store deployment assets
```

## Overview

The mobile apps are hybrid webview wrappers that display the responsive web application at https://my-pocket-sister.replit.app/. The apps include:

- **Native webview integration** for seamless performance
- **Push notifications** for usage alerts and announcements
- **Biometric authentication** support (fingerprint/face recognition)
- **App store optimized** icons, screenshots, and metadata
- **Offline fallback** messaging when network is unavailable

## Deployment Requirements

### Google Play Store
- **Target SDK**: Android 14 (API level 34)
- **Minimum SDK**: Android 7.0 (API level 24)
- **App Bundle**: Required for new apps
- **Privacy Policy**: Required for apps handling user data
- **Content Rating**: ESRB Everyone 10+ (ages 10-14)

### Apple App Store
- **iOS Version**: iOS 13.0 or later
- **Device Support**: iPhone, iPad
- **App Store Connect**: Required for submission
- **Privacy Nutrition Labels**: Required
- **Age Rating**: 9+ (designed for ages 10-14)

## Getting Started

1. **Android Development**:
   - Install Android Studio
   - Open `mobile/android` project
   - Update package name and signing configuration
   - Build and test on device/emulator

2. **iOS Development**:
   - Install Xcode (macOS required)
   - Open `mobile/ios/MyPocketSister.xcodeproj`
   - Update bundle identifier and team settings
   - Build and test on device/simulator

## Store Submission Checklist

See individual platform directories for detailed submission guides.