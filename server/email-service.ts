import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

// Create email transporter
const createTransporter = () => {
  const emailConfig = {
    host: process.env.SMTP_HOST || 'mail.mypocketsister.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER || 'admin@mypocketsister.com',
      pass: process.env.SMTP_PASS || process.env.ADMIN_SECRET || 'admin123',
    },
  };

  return nodemailer.createTransport(emailConfig);
};

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"My Pocket Sister" <${process.env.SMTP_USER || 'admin@mypocketsister.com'}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully:', result.messageId);
    return true;
  } catch (error) {
    console.error('❌ Email sending failed:', error);
    return false;
  }
}

export async function testEmailConfiguration(): Promise<{ success: boolean; message: string }> {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    return { success: true, message: 'Email configuration is valid' };
  } catch (error) {
    console.error('Email configuration test failed:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown email configuration error'
    };
  }
}