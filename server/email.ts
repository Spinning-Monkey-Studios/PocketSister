import nodemailer from 'nodemailer';

// Create SMTP transporter for Bluehost
const createTransporter = () => {
  return nodemailer.createTransport({
    host: 'mail.mypocketsister.com', // Your Bluehost domain
    port: 587, // Standard SMTP port
    secure: false, // Use STARTTLS
    auth: {
      user: process.env.EMAIL_USERNAME || 'admin@mypocketsister.com',
      pass: process.env.EMAIL_PASSWORD || '', // Will need this from user
    },
    tls: {
      ciphers: 'SSLv3'
    }
  });
};

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail({ to, subject, html, text }: EmailOptions): Promise<boolean> {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: '"My Pocket Sister" <admin@mypocketsister.com>',
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', result.messageId);
    return true;
  } catch (error) {
    console.error('Email sending failed:', error);
    return false;
  }
}

// Template functions for different email types
export async function sendTrialWelcomeEmail(parentEmail: string, childName: string): Promise<boolean> {
  const subject = "🎉 Welcome to My Pocket Sister - Your Free Trial Has Started!";
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Welcome to My Pocket Sister</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #ec4899, #8b5cf6); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
        .highlight { background: #dbeafe; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        .button { background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 15px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to My Pocket Sister!</h1>
          <p>Your free trial has started successfully</p>
        </div>
        
        <div class="content">
          <p>Dear Parent,</p>
          
          <p>Thank you for choosing My Pocket Sister for ${childName}! Your 7-day free trial is now active and includes:</p>
          
          <div class="highlight">
            <h3>✨ What's Included in Your Free Trial:</h3>
            <ul>
              <li><strong>500 AI tokens</strong> - About 15-20 meaningful conversations</li>
              <li><strong>Full feature access</strong> - Complete AI companion experience</li>
              <li><strong>Parent monitoring</strong> - Real-time conversation oversight</li>
              <li><strong>Safe environment</strong> - Age-appropriate interactions only</li>
            </ul>
          </div>
          
          <h3>🔄 What Happens After Your Trial:</h3>
          <p>After 7 days, your account will automatically convert to our <strong>Basic Plan ($4.99/month)</strong> with 500 tokens plus affordable overage at $0.01 per token. You can upgrade to Premium or Family plans anytime for more features like web browsing.</p>
          
          <div class="highlight">
            <p><strong>Important:</strong> You'll receive email notifications before any billing begins, and you can cancel anytime during the trial with no charges.</p>
          </div>
          
          <h3>📧 Stay Connected:</h3>
          <p>We'll send you important updates about:</p>
          <ul>
            <li>Your child's usage and progress</li>
            <li>When they request new features (like web browsing)</li>
            <li>Trial expiration reminders</li>
            <li>Billing notifications</li>
          </ul>
          
          <p>Questions? Reply to this email or contact us at admin@mypocketsister.com</p>
          
          <p>Welcome to the family!</p>
          <p><strong>The My Pocket Sister Team</strong></p>
        </div>
        
        <div class="footer">
          <p>© 2025 My Pocket Sister - Empowering young girls through AI companionship</p>
          <p>This is an automated message. Please do not reply to this email address.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({ to: parentEmail, subject, html });
}

export async function sendUpgradeRequestEmail(parentEmail: string, childName: string, requestedContent: string, requestType: string): Promise<boolean> {
  const subject = `${childName} wants to explore ${requestType} content - Upgrade Available`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Upgrade Request from ${childName}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #f59e0b, #d97706); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
        .highlight { background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .button { background: #8b5cf6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 15px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🌐 ${childName} Wants to Explore the Web!</h1>
        </div>
        
        <div class="content">
          <p>Dear Parent,</p>
          
          <p>${childName} asked their AI companion to help with some ${requestType} content:</p>
          
          <div class="highlight">
            <p><strong>Requested:</strong> "${requestedContent}"</p>
          </div>
          
          <p>Currently, web browsing and ${requestType} access requires an upgrade to <strong>Premium</strong> or <strong>Family</strong> plans for safety and content filtering.</p>
          
          <h3>🔧 Available Options:</h3>
          <ul>
            <li><strong>Premium Plan ($9.99/month):</strong> Includes filtered web browsing, YouTube transcript access, and enhanced AI capabilities</li>
            <li><strong>Family Plan ($19.99/month):</strong> All Premium features for up to 5 children with shared token pool</li>
          </ul>
          
          <p>These upgrades include advanced content filtering to ensure ${childName} only accesses age-appropriate information.</p>
          
          <p>You can upgrade anytime from your parent portal, or simply reply "Not now" and we'll let ${childName} know.</p>
          
          <p><strong>The My Pocket Sister Team</strong></p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({ to: parentEmail, subject, html });
}

export async function sendTrialExpirationEmail(parentEmail: string, childName: string, daysLeft: number): Promise<boolean> {
  const subject = `Your free trial expires in ${daysLeft} day${daysLeft === 1 ? '' : 's'} - Continue with ${childName}?`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Trial Expiration Reminder</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #ef4444, #dc2626); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
        .highlight { background: #fee2e2; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .button { background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 15px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>⏰ Your Free Trial is Ending Soon</h1>
        </div>
        
        <div class="content">
          <p>Dear Parent,</p>
          
          <p>Your 7-day free trial with My Pocket Sister expires in <strong>${daysLeft} day${daysLeft === 1 ? '' : 's'}</strong>.</p>
          
          <div class="highlight">
            <p><strong>What happens next:</strong> Your account will automatically convert to our Basic Plan ($4.99/month) so ${childName} can continue their AI companion journey without interruption.</p>
          </div>
          
          <h3>💡 Your Options:</h3>
          <ul>
            <li><strong>Continue with Basic:</strong> No action needed - automatic conversion to $4.99/month with 500 tokens</li>
            <li><strong>Upgrade to Premium:</strong> $9.99/month with web browsing and enhanced features</li>
            <li><strong>Choose Family Plan:</strong> $19.99/month for up to 5 children</li>
            <li><strong>Cancel:</strong> Contact us before expiration to avoid any charges</li>
          </ul>
          
          <p>Questions about billing or features? Reply to this email or contact admin@mypocketsister.com</p>
          
          <p>Thank you for letting us be part of ${childName}'s growth!</p>
          <p><strong>The My Pocket Sister Team</strong></p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({ to: parentEmail, subject, html });
}