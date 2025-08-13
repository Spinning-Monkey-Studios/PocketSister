# MyPocketSister WordPress Theme & Plugin Deployment Guide

This guide will help you deploy the MyPocketSister WordPress theme and integration plugin on your Bluehost hosting environment.

## 📋 Pre-Deployment Checklist

### Requirements
- ✅ WordPress 5.0+ installed on Bluehost
- ✅ PHP 7.4+ (Bluehost default)
- ✅ MySQL 5.6+ (Bluehost default)
- ✅ FTP/SFTP access to your hosting account
- ✅ WordPress admin access
- ✅ MyPocketSister app hosted at `app.mypocketsister.com`

### Files Included
- 📁 `wordpress-theme/mypocketsister/` - Complete WordPress theme
- 📁 `wordpress-plugin/mypocketsister-integration/` - Integration plugin
- 📄 `DEPLOYMENT_GUIDE.md` - This deployment guide

## 🚀 Step 1: Upload Theme Files

### Method A: Using Bluehost File Manager
1. Log into your Bluehost control panel
2. Navigate to **File Manager**
3. Go to `public_html/wp-content/themes/`
4. Upload the entire `mypocketsister` folder
5. Extract if uploaded as ZIP

### Method B: Using FTP/SFTP
1. Connect to your Bluehost server via FTP
2. Navigate to `/public_html/wp-content/themes/`
3. Upload the `mypocketsister` folder
4. Ensure permissions are set to 755 for folders, 644 for files

## 🎨 Step 2: Activate the Theme

1. Log into your WordPress admin dashboard
2. Go to **Appearance > Themes**
3. Find "MyPocketSister" theme
4. Click **Activate**

## 🔌 Step 3: Install the Integration Plugin

### Upload Plugin
1. In WordPress admin, go to **Plugins > Add New**
2. Click **Upload Plugin**
3. Choose the `mypocketsister-integration.zip` file
4. Click **Install Now**
5. Click **Activate Plugin**

### Alternative: Manual Upload
1. Upload plugin folder to `/wp-content/plugins/`
2. Activate in WordPress admin under **Plugins**

## 🖼️ Step 4: Configure Logo and Assets

### Upload Your Logo
1. In WordPress admin, go to **Media > Add New**
2. Upload the provided logo file (`logo_1754872634475.png`)
3. Copy the uploaded file URL
4. Go to **Appearance > Customize**
5. Find **MyPocketSister Settings**
6. Update **Custom Logo URL** with your uploaded logo URL

### Example Logo URL Format:
```
https://mypocketsister.com/wp-content/uploads/2025/01/logo.png
```

## ⚙️ Step 5: Theme Customization

### Navigate to Customizer
**Appearance > Customize > MyPocketSister Settings**

### Required Settings
- **App URL**: `https://app.mypocketsister.com`
- **Custom Logo URL**: Your uploaded logo URL
- **Social Media URLs**: Add your social media links

### Optional Settings
- **Facebook URL**: Your Facebook page
- **Twitter URL**: Your Twitter handle
- **Instagram URL**: Your Instagram account
- **YouTube URL**: Your YouTube channel

## 🔗 Step 6: Configure Plugin Integration

### Plugin Settings
1. Go to **Settings > MyPocketSister**
2. Configure the following:

#### Required Settings
- **App URL**: `https://app.mypocketsister.com`
- **API Key**: Contact MyPocketSister support for your API key

#### Optional Features
- ☐ **Enable User Sync**: Sync WordPress users with app
- ☐ **Enable Content Sharing**: Allow app to access blog content
- ☐ **Enable Safety Alerts**: Receive safety notifications

### Test Connection
1. Click **Test Connection** in plugin settings
2. Verify "Connected successfully" status
3. If connection fails, verify App URL and API key

## 📄 Step 7: Create Essential Pages

### Required Pages to Create

#### 1. Signup Page
- Create new page with slug: `/signup`
- Select **Template**: "Signup Page"
- Publish the page

#### 2. Privacy Policy
- Create new page with slug: `/privacy`
- Select **Template**: "Privacy Policy"
- Publish the page

#### 3. Terms of Service
- Create new page with slug: `/terms`
- Select **Template**: "Terms of Service"
- Publish the page

#### 4. Additional Recommended Pages
- `/about` - About Us page
- `/contact` - Contact information
- `/help` - Help and support
- `/faq` - Frequently asked questions
- `/parent-guide` - Parent guidance
- `/safety` - Safety information

## 🎯 Step 8: Navigation Menu Setup

### Create Primary Menu
1. Go to **Appearance > Menus**
2. Create new menu named "Primary Menu"
3. Add the following pages:
   - Home
   - Blog
   - About
   - Privacy Policy
   - Terms of Service
   - Contact
4. Assign to "Primary Menu" location
5. Save menu

## 📝 Step 9: Homepage Configuration

### Set Static Homepage (Optional)
1. Go to **Settings > Reading**
2. Select "A static page"
3. Choose your homepage for "Homepage"
4. Choose a blog page for "Posts page"

### Homepage Content
The theme automatically displays:
- Hero section with app description
- Feature highlights
- Subscription plans
- Latest blog posts
- Newsletter signup

## 🔒 Step 10: SSL and Security

### Enable SSL (if not already enabled)
1. In Bluehost control panel
2. Go to **SSL/TLS**
3. Enable SSL for your domain
4. Update WordPress URL to use `https://`

### WordPress Security
1. Install security plugin (recommended: Wordfence)
2. Enable automatic updates
3. Use strong passwords
4. Regular backups

## 📱 Step 11: Mobile Optimization

### Test Mobile Responsiveness
- Test on various devices
- Check loading speed
- Verify touch targets are adequate
- Ensure all features work on mobile

### Performance Optimization
1. Install caching plugin (Bluehost includes caching)
2. Optimize images
3. Minify CSS/JS if needed
4. Enable GZIP compression

## 🧪 Step 12: Testing and Validation

### Functionality Testing
- [ ] Theme displays correctly
- [ ] All pages load properly
- [ ] Signup form redirects to app
- [ ] Logo displays correctly
- [ ] Mobile responsiveness works
- [ ] Plugin integration functions
- [ ] Contact forms work
- [ ] Newsletter signup works

### SEO Testing
- [ ] Page titles are correct
- [ ] Meta descriptions are set
- [ ] Open Graph tags work
- [ ] Sitemap is generated
- [ ] Google Analytics is connected (if desired)

## 🚨 Troubleshooting Common Issues

### Theme Not Appearing
- Check file permissions (755 for folders, 644 for files)
- Verify complete upload of all theme files
- Clear any caching

### Logo Not Displaying
- Verify logo URL is correct
- Check if logo file uploaded properly
- Ensure logo file is publicly accessible

### Plugin Connection Failed
- Verify App URL is correct
- Check API key is valid
- Ensure app is running at specified URL
- Contact support for API key if needed

### Styling Issues
- Clear browser cache
- Clear any WordPress caching
- Check for theme conflicts
- Verify all CSS files uploaded

### Mobile Issues
- Test on actual devices
- Check viewport meta tag
- Verify responsive images
- Test touch interactions

## 📞 Support and Maintenance

### Regular Maintenance
- Update WordPress core regularly
- Update theme and plugins when available
- Monitor site performance
- Regular security scans
- Backup site regularly

### Getting Help
- **Theme Issues**: Check WordPress support forums
- **Plugin Issues**: Contact MyPocketSister support
- **App Integration**: Contact technical support
- **Bluehost Issues**: Contact Bluehost support

### Contact Information
- **Technical Support**: support@mypocketsister.com
- **General Inquiries**: hello@mypocketsister.com
- **Emergency Support**: 1-800-POCKET-1

## 🎉 Go Live Checklist

Before announcing your new blog:

- [ ] All pages created and published
- [ ] Navigation menu configured
- [ ] Logo and branding updated
- [ ] SSL certificate active
- [ ] App integration tested
- [ ] Contact forms tested
- [ ] Mobile experience verified
- [ ] SEO basics configured
- [ ] Analytics connected
- [ ] Backup system active
- [ ] Performance optimized
- [ ] Content proofread
- [ ] Legal pages complete
- [ ] Social media linked

## 🔄 Post-Launch Tasks

### Week 1
- Monitor site performance
- Check for any errors
- Gather user feedback
- Monitor app integration

### Month 1
- Analyze traffic patterns
- Review user engagement
- Optimize based on data
- Plan content calendar

### Ongoing
- Regular content updates
- Security monitoring
- Performance optimization
- Feature enhancements

---

## 📋 Quick Reference

### Important URLs
- **WordPress Admin**: `https://mypocketsister.com/wp-admin`
- **MyPocketSister App**: `https://app.mypocketsister.com`
- **Theme Customizer**: `https://mypocketsister.com/wp-admin/customize.php`
- **Plugin Settings**: `https://mypocketsister.com/wp-admin/options-general.php?page=mypocketsister-settings`

### File Locations
- **Theme**: `/wp-content/themes/mypocketsister/`
- **Plugin**: `/wp-content/plugins/mypocketsister-integration/`
- **Uploads**: `/wp-content/uploads/`

### Default Credentials
- Update immediately after deployment
- Use strong, unique passwords
- Enable two-factor authentication where possible

---

**Deployment Date**: ___________  
**Deployed By**: ___________  
**Version**: 1.0.0  
**Next Review**: ___________  

This completes your MyPocketSister WordPress deployment. Your blog is now ready to complement your app and provide a beautiful, integrated experience for your users!