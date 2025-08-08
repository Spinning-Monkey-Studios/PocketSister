import { storage } from "./storage";
import { UsageTracker } from "./usage-tracking";
import { sendEmail } from "./email";

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  freeTrialWarning: boolean;
  billingUpdates: boolean;
  usageReports: boolean;
  safetyAlerts: boolean;
}

export class ParentNotificationSystem {
  // Send free trial expiration notification
  static async notifyFreeTrialExpired(userId: string, reason: string): Promise<void> {
    const user = await storage.getUserById(userId);
    if (!user || !user.email) return;

    const subject = "My Pocket Sister - Free Trial Ended";
    const body = `
Hi ${user.firstName || 'Parent'},

Your child's free trial of My Pocket Sister has ended (${reason}).

**What happens now:**
• Your child can no longer use AI features until you upgrade
• All conversations and progress are safely saved
• You can upgrade anytime to restore full access

**Choose your plan:**
• Basic: $4.99/month + overages
• Premium: $9.99/month + overages  
• Family: $19.99/month (best value)

Ready to continue your child's journey? Log in to upgrade now.

Best regards,
The My Pocket Sister Team
    `.trim();

    await sendEmail({
      to: user.email,
      subject: subject,
      html: body,
      text: body
    });
  }

  // Send monthly billing summary
  static async sendMonthlyBillingSummary(userId: string): Promise<void> {
    const user = await storage.getUserById(userId);
    if (!user || !user.email) return;

    const billingNotification = await UsageTracker.generateBillingNotification(userId);
    
    const subject = `My Pocket Sister - Monthly Usage Summary`;
    const body = `
Hi ${user.firstName || 'Parent'},

Here's your monthly usage summary:

${billingNotification}

**What's Next:**
• Your next billing date is in 5 days
• All features continue as normal
• View detailed reports in your parent portal

Questions? Reply to this email or contact support.

Best regards,
The My Pocket Sister Team
    `.trim();

    await sendEmail({
      to: user.email,
      subject: subject,
      html: body,
      text: body
    });
  }

  // Advanced parent controls notification (Family tier exclusive)
  static async sendAdvancedParentAlert(userId: string, alertType: string, details: any): Promise<void> {
    const user = await storage.getUserById(userId);
    if (!user || user.subscriptionTier !== 'family') return;

    let subject = '';
    let body = '';

    switch (alertType) {
      case 'unusual_activity':
        subject = 'Advanced Alert: Unusual Activity Detected';
        body = `
Hi ${user.firstName || 'Parent'},

Our advanced monitoring (Family plan exclusive) detected unusual activity:

**Child:** ${details.childName}
**Pattern:** ${details.pattern}
**Recommendation:** ${details.recommendation}

This advanced analysis is only available with your Family plan.
        `.trim();
        break;

      case 'emotional_concern':
        subject = 'Advanced Alert: Emotional Support Needed';
        body = `
Hi ${user.firstName || 'Parent'},

Advanced emotional analysis suggests your child may need extra support:

**Child:** ${details.childName}  
**Concern:** ${details.concern}
**Suggested Actions:** ${details.suggestions.join(', ')}

This deep emotional insight is a Family plan exclusive feature.
        `.trim();
        break;
    }

    if (user.email && subject) {
      await sendEmail({
        to: user.email,
        subject: subject,
        html: body,
        text: body
      });
    }
  }

  // Re-send billing information on AI request
  static async resendBillingOnRequest(userId: string, requestingChildId?: string): Promise<string> {
    const user = await storage.getUserById(userId);
    if (!user) throw new Error('User not found');

    // Generate fresh billing notification
    const billingInfo = await UsageTracker.generateBillingNotification(userId);
    
    // Send to parent email
    if (user.email) {
      await this.sendMonthlyBillingSummary(userId);
    }

    // Return message for AI to share with child (if child requested)
    if (requestingChildId) {
      return `I've sent your parent the current billing information. The summary shows your family has used ${await this.getSimpleUsageSummary(userId)} this month.`;
    }

    return billingInfo;
  }

  // Generate activity report on AI request
  static async generateActivityReportOnRequest(userId: string, requestingChildId?: string): Promise<string> {
    const report = await UsageTracker.generateFamilyUsageReport(userId);
    
    // Send detailed report to parents
    const user = await storage.getUserById(userId);
    if (user?.email) {
      const subject = 'My Pocket Sister - Activity Report (Requested)';
      const body = `
Hi ${user.firstName || 'Parent'},

Your child requested an activity report. Here's the detailed breakdown:

${await UsageTracker.generateBillingNotification(userId)}

**Detailed Child Activity:**
${report.childBreakdown.map(child => `
• ${child.childName}: ${child.interactions} interactions
  Top topics: ${child.topTopics.join(', ')}
  Mood trends: ${child.moodTrends.join(', ')}
`).join('')}

This report was generated at your child's request.

Best regards,
The My Pocket Sister Team
      `.trim();

      await sendEmail({
        to: user.email,
        subject: subject,
        html: body,
        text: body
      });
    }

    // Return simplified message for AI to share with child
    if (requestingChildId) {
      const childData = report.childBreakdown.find(c => c.childId === requestingChildId);
      return `I've sent your parent a detailed activity report! This month you've had ${childData?.interactions || 0} conversations with me. Your top topics were ${childData?.topTopics.join(', ') || 'various subjects'}.`;
    }

    return 'Activity report sent successfully';
  }

  private static async getSimpleUsageSummary(userId: string): Promise<string> {
    const report = await UsageTracker.generateFamilyUsageReport(userId);
    return `${report.usage.totalInteractions} interactions out of ${report.usage.interactionsIncluded} included`;
  }
}