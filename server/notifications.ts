import { storage } from "./storage";

export interface PushNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
  icon?: string;
  badge?: string;
  sound?: string;
}

export interface NotificationRecipient {
  userId: string;
  deviceTokens: string[];
  preferences: {
    usageAlerts: boolean;
    systemAnnouncements: boolean;
    emergencyAlerts: boolean;
  };
}

export class NotificationService {
  private fcmServerKey: string;
  private apnsKeyId: string;
  private apnsTeamId: string;
  private apnsPrivateKey: string;

  constructor() {
    this.fcmServerKey = process.env.FCM_SERVER_KEY || "";
    this.apnsKeyId = process.env.APNS_KEY_ID || "";
    this.apnsTeamId = process.env.APNS_TEAM_ID || "";
    this.apnsPrivateKey = process.env.APNS_PRIVATE_KEY || "";
  }

  // Send usage alert to parents when child approaches token limit
  async sendUsageAlert(childId: string, percentage: number, tokensUsed: number, monthlyLimit: number) {
    try {
      // Get child profile and parent info
      const child = await storage.getChildProfile(childId);
      if (!child) return;

      const parent = await storage.getUser(child.userId);
      if (!parent) return;

      // Get parent's device tokens
      const deviceTokens = await storage.getUserDeviceTokens(child.userId);
      if (deviceTokens.length === 0) return;

      const alertType = percentage >= 100 ? "limit_exceeded" : percentage >= 90 ? "approaching_limit" : "warning";
      
      const payload: PushNotificationPayload = {
        title: `${child.name} - Usage Alert`,
        body: this.generateUsageAlertMessage(child.name, percentage, alertType),
        data: {
          type: "usage_alert",
          childId: childId,
          childName: child.name,
          percentage: percentage.toString(),
          tokensUsed: tokensUsed.toString(),
          monthlyLimit: monthlyLimit.toString(),
          alertType: alertType
        },
        icon: "ic_notification_usage",
        sound: "default"
      };

      // Send to all user's devices
      await this.sendToDevices(deviceTokens, payload);

      // Record notification in database
      await storage.recordNotification({
        userId: child.userId,
        childId: childId,
        type: "usage_alert",
        title: payload.title,
        body: payload.body,
        data: payload.data,
        sentAt: new Date()
      });

    } catch (error) {
      console.error("Error sending usage alert:", error);
    }
  }

  // Send system announcement to all users or specific audience
  async sendSystemAnnouncement(announcement: {
    title: string;
    message: string;
    targetAudience?: "all" | "parents" | "premium";
    priority: "low" | "normal" | "high";
  }) {
    try {
      const users = await storage.getAllUsersWithNotificationPreferences();
      
      const payload: PushNotificationPayload = {
        title: announcement.title,
        body: announcement.message,
        data: {
          type: "announcement",
          priority: announcement.priority,
          targetAudience: announcement.targetAudience || "all"
        },
        icon: "ic_notification_announcement",
        sound: announcement.priority === "high" ? "alert" : "default"
      };

      // Filter users based on target audience and preferences
      const targetUsers = users.filter(user => {
        if (!user.notificationPreferences?.systemAnnouncements) return false;
        
        switch (announcement.targetAudience) {
          case "parents":
            return user.hasChildren;
          case "premium":
            return user.subscriptionStatus === "active" && user.subscriptionTier !== "basic";
          default:
            return true;
        }
      });

      // Send to all target users
      for (const user of targetUsers) {
        const deviceTokens = await storage.getUserDeviceTokens(user.id);
        if (deviceTokens.length > 0) {
          await this.sendToDevices(deviceTokens, payload);
        }
      }

      // Record announcement broadcast
      await storage.recordAnnouncementBroadcast({
        announcementId: announcement.title,
        targetAudience: announcement.targetAudience || "all",
        recipientCount: targetUsers.length,
        sentAt: new Date()
      });

    } catch (error) {
      console.error("Error sending system announcement:", error);
    }
  }

  // Send emergency alert (security, safety concerns)
  async sendEmergencyAlert(userId: string, alert: {
    title: string;
    message: string;
    childId?: string;
    actionRequired?: boolean;
  }) {
    try {
      const deviceTokens = await storage.getUserDeviceTokens(userId);
      if (deviceTokens.length === 0) return;

      const payload: PushNotificationPayload = {
        title: `🚨 ${alert.title}`,
        body: alert.message,
        data: {
          type: "emergency_alert",
          childId: alert.childId,
          actionRequired: alert.actionRequired?.toString() || "false",
          timestamp: new Date().toISOString()
        },
        icon: "ic_notification_emergency",
        sound: "alert",
        badge: "1"
      };

      await this.sendToDevices(deviceTokens, payload);

      // Record emergency alert
      await storage.recordNotification({
        userId: userId,
        childId: alert.childId,
        type: "emergency_alert",
        title: payload.title,
        body: payload.body,
        data: payload.data,
        sentAt: new Date(),
        priority: "high"
      });

    } catch (error) {
      console.error("Error sending emergency alert:", error);
    }
  }

  // Send to multiple devices (both Android and iOS)
  private async sendToDevices(deviceTokens: string[], payload: PushNotificationPayload) {
    const androidTokens = deviceTokens.filter(token => token.startsWith("f") || token.startsWith("c")); // FCM tokens
    const iosTokens = deviceTokens.filter(token => token.length === 64); // APNS tokens

    // Send to Android devices via FCM
    if (androidTokens.length > 0 && this.fcmServerKey) {
      await this.sendToAndroid(androidTokens, payload);
    }

    // Send to iOS devices via APNS
    if (iosTokens.length > 0 && this.apnsPrivateKey) {
      await this.sendToIOS(iosTokens, payload);
    }
  }

  // Send notification to Android devices via Firebase Cloud Messaging
  private async sendToAndroid(tokens: string[], payload: PushNotificationPayload) {
    try {
      const fcmPayload = {
        registration_ids: tokens,
        notification: {
          title: payload.title,
          body: payload.body,
          icon: payload.icon || "ic_notification",
          sound: payload.sound || "default",
          click_action: "FLUTTER_NOTIFICATION_CLICK"
        },
        data: payload.data || {},
        priority: "high",
        time_to_live: 86400 // 24 hours
      };

      const response = await fetch("https://fcm.googleapis.com/fcm/send", {
        method: "POST",
        headers: {
          "Authorization": `key=${this.fcmServerKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(fcmPayload)
      });

      const result = await response.json();
      console.log("FCM Response:", result);

      // Handle failed tokens
      if (result.failure > 0) {
        await this.handleFailedTokens(tokens, result.results, "android");
      }

    } catch (error) {
      console.error("Error sending to Android devices:", error);
    }
  }

  // Send notification to iOS devices via Apple Push Notification Service
  private async sendToIOS(tokens: string[], payload: PushNotificationPayload) {
    try {
      // For production, you would use a proper APNS library like node-apn
      // This is a simplified implementation
      const apnsPayload = {
        aps: {
          alert: {
            title: payload.title,
            body: payload.body
          },
          sound: payload.sound || "default",
          badge: payload.badge ? parseInt(payload.badge) : undefined
        },
        data: payload.data || {}
      };

      // In a real implementation, you would send to APNS servers
      console.log("Would send to iOS devices:", {
        tokens: tokens.length,
        payload: apnsPayload
      });

      // For now, just log the attempt
      // TODO: Implement actual APNS sending with proper certificates

    } catch (error) {
      console.error("Error sending to iOS devices:", error);
    }
  }

  // Handle failed device tokens (remove invalid tokens)
  private async handleFailedTokens(tokens: string[], results: any[], platform: "android" | "ios") {
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      if (result.error) {
        const token = tokens[i];
        console.log(`Removing invalid ${platform} token:`, token, result.error);
        await storage.removeDeviceToken(token);
      }
    }
  }

  // Generate appropriate message for usage alerts
  private generateUsageAlertMessage(childName: string, percentage: number, alertType: string): string {
    switch (alertType) {
      case "limit_exceeded":
        return `${childName} has exceeded their monthly token limit. Consider upgrading your plan or waiting for next month's reset.`;
      case "approaching_limit":
        return `${childName} has used ${Math.round(percentage)}% of their monthly tokens. They're approaching their limit.`;
      case "warning":
        return `${childName} has used ${Math.round(percentage)}% of their monthly tokens. Consider monitoring their usage.`;
      default:
        return `${childName} has used ${Math.round(percentage)}% of their monthly tokens.`;
    }
  }

  // Register device token for push notifications
  async registerDeviceToken(userId: string, token: string, platform: "android" | "ios") {
    try {
      await storage.saveDeviceToken({
        userId: userId,
        token: token,
        platform: platform,
        registeredAt: new Date(),
        isActive: true
      });
      console.log(`Registered ${platform} device token for user ${userId}`);
    } catch (error) {
      console.error("Error registering device token:", error);
    }
  }

  // Update notification preferences
  async updateNotificationPreferences(userId: string, preferences: {
    usageAlerts?: boolean;
    systemAnnouncements?: boolean;
    emergencyAlerts?: boolean;
  }) {
    try {
      await storage.updateUserNotificationPreferences(userId, preferences);
      console.log(`Updated notification preferences for user ${userId}`);
    } catch (error) {
      console.error("Error updating notification preferences:", error);
    }
  }

  // Get notification history for user
  async getNotificationHistory(userId: string, limit: number = 50) {
    try {
      return await storage.getUserNotificationHistory(userId, limit);
    } catch (error) {
      console.error("Error getting notification history:", error);
      return [];
    }
  }
}

export const notificationService = new NotificationService();