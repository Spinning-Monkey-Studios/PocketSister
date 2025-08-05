import { db } from './db.js';
import { users, childProfiles } from '../shared/schema.js';
import { eq } from 'drizzle-orm';

interface PushNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
  badge?: number;
  icon?: string;
  image?: string;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

interface EmailNotificationPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class NotificationService {
  private webPushEndpoints: Map<string, any> = new Map();
  private emailService: any;

  constructor() {
    this.initializeEmailService();
  }

  private async initializeEmailService() {
    try {
      // Initialize email service (using existing email setup)
      const { sendEmail } = await import('./email.js');
      this.emailService = { sendEmail };
    } catch (error) {
      console.warn('Email service not available:', error);
    }
  }

  async sendPushNotification(userId: string, payload: PushNotificationPayload): Promise<void> {
    try {
      // Get user's push subscription endpoints
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId));

      if (!user) {
        throw new Error('User not found');
      }

      // For now, store notification for when push service is implemented
      console.log(`Push notification for ${userId}:`, payload);
      
      // In a real implementation, you would:
      // 1. Send to web push service (Firebase, OneSignal, etc.)
      // 2. Send to mobile app notification service
      // 3. Store notification in database for retrieval

      // Fallback to email notification for critical alerts
      if (payload.data?.priority === 'critical' || payload.data?.priority === 'high') {
        await this.sendEmailNotification({
          to: user.email || '',
          subject: payload.title,
          html: this.createEmailTemplate(payload),
          text: payload.body
        });
      }
    } catch (error) {
      console.error('Push notification failed:', error);
      throw error;
    }
  }

  async sendEmailNotification(payload: EmailNotificationPayload): Promise<void> {
    try {
      if (!this.emailService) {
        console.warn('Email service not available');
        return;
      }

      await this.emailService.sendEmail({
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
        text: payload.text
      });

      console.log(`Email notification sent to ${payload.to}`);
    } catch (error) {
      console.error('Email notification failed:', error);
      throw error;
    }
  }

  private createEmailTemplate(payload: PushNotificationPayload): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${payload.title}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { background: #ff6b6b; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 14px; color: #666; }
          .alert-high { border-left: 4px solid #ff6b6b; }
          .alert-critical { border-left: 4px solid #dc3545; background: #fff5f5; }
          .button { display: inline-block; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 4px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${payload.title}</h1>
          </div>
          <div class="content ${payload.data?.priority === 'critical' ? 'alert-critical' : payload.data?.priority === 'high' ? 'alert-high' : ''}">
            <h2>Safety Alert Notification</h2>
            <p>${payload.body}</p>
            
            ${payload.data?.alertType ? `<p><strong>Alert Type:</strong> ${payload.data.alertType.replace('_', ' ').toUpperCase()}</p>` : ''}
            ${payload.data?.priority ? `<p><strong>Priority:</strong> ${payload.data.priority.toUpperCase()}</p>` : ''}
            
            <p>Please log into your parent portal to review this alert and take any necessary actions.</p>
            
            <a href="${process.env.REPL_SLUG ? `https://${process.env.REPL_SLUG}.replit.app/test-parent-portal` : 'http://localhost:5000/test-parent-portal'}" class="button">
              View Parent Portal
            </a>
          </div>
          <div class="footer">
            <p>My Pocket Sister - AI Companion Safety System</p>
            <p>This is an automated safety notification. If you have concerns, please contact our support team.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  async registerPushSubscription(userId: string, subscription: any): Promise<void> {
    try {
      // Store push subscription for user
      this.webPushEndpoints.set(userId, subscription);
      console.log(`Push subscription registered for user ${userId}`);
    } catch (error) {
      console.error('Failed to register push subscription:', error);
    }
  }

  async unregisterPushSubscription(userId: string): Promise<void> {
    try {
      this.webPushEndpoints.delete(userId);
      console.log(`Push subscription removed for user ${userId}`);
    } catch (error) {
      console.error('Failed to unregister push subscription:', error);
    }
  }

  async sendBulkNotification(userIds: string[], payload: PushNotificationPayload): Promise<void> {
    const promises = userIds.map(userId => this.sendPushNotification(userId, payload));
    await Promise.allSettled(promises);
  }

  async getNotificationHistory(userId: string, limit: number = 50): Promise<any[]> {
    // In a real implementation, you would fetch from a notifications table
    // For now, return empty array
    return [];
  }
}

// Export the class
export { NotificationService };

export const notificationService = new NotificationService();

// Export convenience functions
export const sendPushNotification = (userId: string, payload: PushNotificationPayload) => 
  notificationService.sendPushNotification(userId, payload);

export const sendEmailNotification = (payload: EmailNotificationPayload) => 
  notificationService.sendEmailNotification(payload);

export const registerPushSubscription = (userId: string, subscription: any) => 
  notificationService.registerPushSubscription(userId, subscription);