import { DatabaseStorage } from './storage';
import { 
  SafetyAlert, 
  InsertSafetyAlert, 
  ParentControl, 
  InsertParentControl,
  ContentReview,
  InsertContentReview 
} from '@shared/schema';

export class ParentControlsService {
  constructor(private storage: DatabaseStorage) {}

  // Get parent controls for a child
  async getParentControls(childId: string, parentId: string): Promise<ParentControl | null> {
    try {
      return await this.storage.getParentControls(childId, parentId);
    } catch (error) {
      console.error('Error getting parent controls:', error);
      return null;
    }
  }

  // Update parent controls for a child
  async updateParentControls(
    childId: string, 
    parentId: string, 
    updates: Partial<ParentControl>
  ): Promise<ParentControl | null> {
    try {
      const existing = await this.storage.getParentControls(childId, parentId);
      
      if (existing) {
        return await this.storage.updateParentControls(existing.id, updates);
      } else {
        // Create new parent controls
        const newControls: InsertParentControl = {
          childId,
          parentId,
          ...updates,
        };
        return await this.storage.createParentControls(newControls);
      }
    } catch (error) {
      console.error('Error updating parent controls:', error);
      return null;
    }
  }

  // Update child age (parent-controlled)
  async updateChildAge(childId: string, parentId: string, newAge: number): Promise<boolean> {
    try {
      // Validate age range
      if (newAge < 8 || newAge > 16) {
        throw new Error('Age must be between 8 and 16');
      }

      // Update in parent controls
      await this.updateParentControls(childId, parentId, { ageOverride: newAge });
      
      // Update in child profile
      await this.storage.updateChildProfile(childId, { age: newAge });
      
      return true;
    } catch (error) {
      console.error('Error updating child age:', error);
      return false;
    }
  }

  // Update child personality (parent-controlled)
  async updateChildPersonality(
    childId: string, 
    parentId: string, 
    personalitySettings: any
  ): Promise<boolean> {
    try {
      // Update parent controls with personality settings
      await this.updateParentControls(childId, parentId, { personalitySettings });
      
      // Update child profile with new personality
      await this.storage.updateChildProfile(childId, { 
        personalityProfile: personalitySettings 
      });
      
      return true;
    } catch (error) {
      console.error('Error updating child personality:', error);
      return false;
    }
  }

  // Get safety alerts for parent
  async getSafetyAlerts(parentId: string, childId?: string): Promise<SafetyAlert[]> {
    try {
      return await this.storage.getSafetyAlerts(parentId, childId);
    } catch (error) {
      console.error('Error getting safety alerts:', error);
      return [];
    }
  }

  // Create safety alert
  async createSafetyAlert(alert: InsertSafetyAlert): Promise<SafetyAlert | null> {
    try {
      const newAlert = await this.storage.createSafetyAlert(alert);
      
      // Send notification to parent
      if (newAlert && alert.severity === 'high' || alert.severity === 'critical') {
        await this.notifyParentOfAlert(newAlert);
      }
      
      return newAlert;
    } catch (error) {
      console.error('Error creating safety alert:', error);
      return null;
    }
  }

  // Mark safety alert as resolved
  async resolveSafetyAlert(alertId: string, reviewNotes?: string): Promise<boolean> {
    try {
      await this.storage.updateSafetyAlert(alertId, {
        isResolved: true,
        resolvedAt: new Date(),
        reviewNotes,
      });
      return true;
    } catch (error) {
      console.error('Error resolving safety alert:', error);
      return false;
    }
  }

  // Monitor message content for safety concerns
  async analyzeMessageSafety(
    childId: string, 
    messageId: string, 
    content: string
  ): Promise<ContentReview | null> {
    try {
      const analysis = await this.performSafetyAnalysis(content);
      
      const review: InsertContentReview = {
        childId,
        messageId,
        contentType: 'message',
        riskLevel: analysis.riskLevel,
        flaggedReasons: analysis.flaggedReasons,
        aiConfidence: analysis.confidence.toString(),
        requiresHumanReview: analysis.riskLevel === 'alert' || analysis.confidence < 0.8,
      };

      const contentReview = await this.storage.createContentReview(review);

      // Create safety alert for concerning content
      if (analysis.riskLevel === 'alert' || analysis.riskLevel === 'concern') {
        const child = await this.storage.getChildProfile(childId);
        if (child) {
          await this.createSafetyAlert({
            childId,
            userId: child.userId,
            alertType: this.mapRiskToAlertType(analysis.riskLevel, analysis.flaggedReasons),
            severity: analysis.riskLevel === 'alert' ? 'high' : 'medium',
            triggerKeywords: analysis.keywords,
            contextSummary: this.generateContextSummary(content, analysis),
            messageId,
          });
        }
      }

      return contentReview;
    } catch (error) {
      console.error('Error analyzing message safety:', error);
      return null;
    }
  }

  // Private helper methods
  private async performSafetyAnalysis(content: string): Promise<{
    riskLevel: 'safe' | 'monitor' | 'concern' | 'alert';
    flaggedReasons: string[];
    confidence: number;
    keywords: string[];
  }> {
    // AI-based safety analysis
    const concerningPatterns = [
      { pattern: /\b(hurt|harm|kill|die|death)\s+(myself|me)\b/i, reason: 'self_harm', severity: 'alert' },
      { pattern: /\b(suicide|suicidal|end\s+my\s+life)\b/i, reason: 'self_harm', severity: 'alert' },
      { pattern: /\b(drugs|alcohol|drinking|smoking|high|stoned)\b/i, reason: 'substance_reference', severity: 'concern' },
      { pattern: /\b(bullying|bullied|mean\s+to\s+me|hurt\s+my\s+feelings)\b/i, reason: 'bullying_concern', severity: 'concern' },
      { pattern: /\b(stranger|meet\s+up|come\s+over|my\s+address)\b/i, reason: 'stranger_safety', severity: 'alert' },
      { pattern: /\b(password|credit\s+card|social\s+security|personal\s+info)\b/i, reason: 'privacy_concern', severity: 'monitor' },
      { pattern: /\b(scared|afraid|threatening|dangerous)\b/i, reason: 'safety_concern', severity: 'concern' },
    ];

    let riskLevel: 'safe' | 'monitor' | 'concern' | 'alert' = 'safe';
    let flaggedReasons: string[] = [];
    let keywords: string[] = [];
    let maxSeverity = 0;

    const severityMap = { safe: 0, monitor: 1, concern: 2, alert: 3 };

    for (const { pattern, reason, severity } of concerningPatterns) {
      const match = content.match(pattern);
      if (match) {
        flaggedReasons.push(reason);
        keywords.push(...match[0].split(/\s+/));
        
        const severityLevel = severityMap[severity as keyof typeof severityMap];
        if (severityLevel > maxSeverity) {
          maxSeverity = severityLevel;
          riskLevel = severity as 'safe' | 'monitor' | 'concern' | 'alert';
        }
      }
    }

    // Calculate confidence based on number of matches and clarity
    const confidence = Math.min(0.95, 0.6 + (flaggedReasons.length * 0.1));

    return {
      riskLevel,
      flaggedReasons,
      confidence,
      keywords: [...new Set(keywords)], // Remove duplicates
    };
  }

  private mapRiskToAlertType(riskLevel: string, flaggedReasons: string[]): string {
    if (flaggedReasons.includes('self_harm')) return 'self_harm_concern';
    if (flaggedReasons.includes('bullying_concern')) return 'bullying_detected';
    if (flaggedReasons.includes('stranger_safety')) return 'safety_concern';
    if (flaggedReasons.includes('substance_reference')) return 'inappropriate_content';
    return 'safety_concern';
  }

  private generateContextSummary(content: string, analysis: any): string {
    // Generate a privacy-preserving summary for parents
    const reasons = analysis.flaggedReasons.join(', ');
    return `Alert triggered due to: ${reasons}. The conversation contained concerning language patterns that require attention.`;
  }

  private async notifyParentOfAlert(alert: SafetyAlert): Promise<void> {
    try {
      // Import notification service dynamically to avoid circular dependencies
      const { NotificationService } = await import('./notifications');
      const notificationService = new NotificationService();

      // Send emergency alert via push notification or email
      await notificationService.sendPushNotification(alert.userId, {
        title: 'Safety Alert',
        body: `${alert.alertType.replace('_', ' ')}: ${alert.contextSummary}`,
        data: {
          childId: alert.childId,
          alertId: alert.id,
          priority: alert.severity,
          actionRequired: true,
        }
      });

      // Mark alert as parent notified
      await this.storage.updateSafetyAlert(alert.id, { parentNotified: true });
    } catch (error) {
      console.error('Error notifying parent of alert:', error);
    }
  }






}