# Code Signing and Certificates Guide

## Android App Signing

### Creating a Release Keystore

1. **Generate Release Keystore**:
```bash
keytool -genkey -v -keystore my-pocket-sister-release-key.keystore -alias my-pocket-sister -keyalg RSA -keysize 2048 -validity 10000
```

2. **Keystore Information**:
   - **Alias**: my-pocket-sister
   - **Validity**: 10000 days (~27 years)
   - **Key Size**: 2048 bits RSA
   - **Store Password**: [Use strong password - store securely]
   - **Key Password**: [Use strong password - store securely]

3. **Keystore Details to Fill**:
   - **First and Last Name**: My Pocket Sister LLC
   - **Organization Unit**: Mobile Development
   - **Organization**: My Pocket Sister
   - **City**: [Your City]
   - **State**: [Your State]
   - **Country Code**: US

### App Signing Configuration

4. **Update gradle.properties**:
```properties
KEYSTORE_FILE=../my-pocket-sister-release-key.keystore
KEYSTORE_PASSWORD=your_secure_password
KEY_ALIAS=my-pocket-sister
KEY_PASSWORD=your_secure_key_password
```

5. **Google Play App Signing**:
   - Enable Google Play App Signing in Play Console
   - Upload your signing key to Google Play
   - Google will manage the final app signing
   - Keep your upload key secure for future updates

## iOS Certificates and Provisioning

### Apple Developer Account Setup

1. **Developer Account Requirements**:
   - Apple Developer Program membership ($99/year)
   - Verified Apple ID with payment method
   - Legal entity information for business account

### Certificates

2. **Development Certificate**:
   - **Type**: iOS Development
   - **Usage**: Testing on devices during development
   - **Validity**: 1 year
   - **Installation**: Download and install in Keychain

3. **Distribution Certificate**:
   - **Type**: iOS Distribution
   - **Usage**: App Store submission
   - **Validity**: 1 year
   - **Installation**: Download and install in Keychain

### App IDs

4. **App ID Configuration**:
   - **Bundle ID**: com.mypocketsister.app
   - **Description**: My Pocket Sister - AI Companion
   - **Capabilities**:
     - Associated Domains
     - Background Modes
     - Push Notifications
     - In-App Purchase

### Provisioning Profiles

5. **Development Provisioning Profile**:
   - **Type**: iOS App Development
   - **App ID**: com.mypocketsister.app
   - **Certificates**: Development certificate
   - **Devices**: Registered test devices

6. **Distribution Provisioning Profile**:
   - **Type**: App Store
   - **App ID**: com.mypocketsister.app
   - **Certificates**: Distribution certificate
   - **Distribution**: App Store

## Security Best Practices

### Keystore Security (Android)

- **Never commit keystores** to version control
- **Use environment variables** for sensitive data
- **Create backup copies** of keystores (store securely)
- **Document keystore details** in secure location
- **Rotate keys** according to security policy

### Certificate Management (iOS)

- **Keep private keys secure** in Keychain
- **Export certificates** for team distribution
- **Monitor certificate expiration** dates
- **Renew certificates** before expiration
- **Use separate certificates** for development/production

## CI/CD Integration

### GitHub Actions (Android)

```yaml
- name: Sign APK
  uses: r0adkll/sign-android-release@v1
  with:
    releaseDirectory: app/build/outputs/apk/release
    signingKeyBase64: ${{ secrets.SIGNING_KEY_BASE64 }}
    alias: ${{ secrets.ALIAS }}
    keyStorePassword: ${{ secrets.KEY_STORE_PASSWORD }}
    keyPassword: ${{ secrets.KEY_PASSWORD }}
```

### GitHub Actions (iOS)

```yaml
- name: Import Certificate
  uses: apple-actions/import-codesign-certs@v1
  with:
    p12-file-base64: ${{ secrets.CERTIFICATES_P12 }}
    p12-password: ${{ secrets.CERTIFICATES_PASSWORD }}

- name: Download Provisioning Profile
  uses: apple-actions/download-provisioning-profiles@v1
  with:
    bundle-id: com.mypocketsister.app
    issuer-id: ${{ secrets.APPSTORE_ISSUER_ID }}
    api-key-id: ${{ secrets.APPSTORE_KEY_ID }}
    api-private-key: ${{ secrets.APPSTORE_PRIVATE_KEY }}
```

## Troubleshooting

### Common Android Issues

1. **"keystore was tampered with"**:
   - Verify keystore password is correct
   - Check for file corruption
   - Restore from backup if necessary

2. **"certificate not valid"**:
   - Check certificate expiration
   - Verify key passwords match
   - Regenerate if necessary

### Common iOS Issues

1. **"No matching provisioning profile"**:
   - Verify bundle ID matches exactly
   - Check provisioning profile expiration
   - Ensure certificate is in Keychain

2. **"Code signing identity not found"**:
   - Install distribution certificate
   - Check certificate trust settings
   - Verify Xcode account configuration

## Store-Specific Requirements

### Google Play Console

- **App Bundle**: Required for new apps
- **Target API Level**: Must target latest API (currently 34)
- **64-bit Support**: Required for all native code
- **App Signing**: Managed by Google Play

### App Store Connect

- **Xcode Version**: Use latest stable version
- **iOS Version**: Support latest iOS version
- **Binary Format**: IPA archive upload
- **Code Signing**: Automatic or manual

## Compliance and Legal

### Data Protection

- **GDPR Compliance**: For EU users
- **COPPA Compliance**: For users under 13
- **Privacy Policy**: Required by both stores
- **Data Processing**: Document data flows

### Regional Requirements

- **Export Compliance**: Encryption usage declaration
- **Age Ratings**: Consistent across platforms
- **Localization**: Consider target markets
- **Legal Terms**: Terms of service, privacy policy

## Backup and Recovery

### Essential Backups

1. **Android Keystores**: Multiple secure locations
2. **iOS Certificates**: P12 exports with passwords
3. **Provisioning Profiles**: Download and archive
4. **Account Credentials**: Secure password manager
5. **App Store Assets**: Version-controlled graphics

### Recovery Procedures

1. **Lost Keystore (Android)**:
   - Contact Google Play support
   - May require new package name
   - Prepare migration strategy

2. **Expired Certificates (iOS)**:
   - Renew certificates in Apple Developer
   - Update provisioning profiles
   - Rebuild and resubmit apps

This comprehensive guide ensures secure and reliable app signing for both Android and iOS platforms, meeting all store requirements and security best practices.