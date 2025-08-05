import { GoogleGenerativeAI } from '@google/generative-ai';
import { db } from './db.js';
import { safetyAlerts, contentReviews, parentControls } from '../shared/schema.js';
import { eq, and } from 'drizzle-orm';
import { sendPushNotification } from './notifications.js';

interface MonitoringContext {
  childId: string;
  conversationId?: string;
  messageId?: string;
  content: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

interface SafetyAssessment {
  riskLevel: 'none' | 'low' | 'medium' | 'high' | 'critical';
  concerns: string[];
  confidence: number;
  requiresParentAlert: boolean;
  alertType?: string;
  contextSummary?: string;
  recommendedAction?: string;
}

const SAFETY_MONITORING_PROMPT = `
You are an AI safety monitor designed to protect children using AI companions. Your role is to analyze conversations and identify potential safety concerns while respecting privacy.

## ASSESSMENT CRITERIA

### CRITICAL (Immediate parent notification required)
- Self-harm or suicide ideation
- Mentions of abuse (physical, emotional, sexual)
- Dangerous activities or challenges
- Sharing personal information (address, school, phone)
- Contact with unknown adults
- Cyberbullying (giving or receiving)

### HIGH (Parent notification within 1 hour)
- Persistent sadness or depression indicators
- Eating disorder behaviors
- Substance use mentions
- Inappropriate romantic/sexual content
- Aggressive behavior patterns
- Social isolation concerns

### MEDIUM (Daily summary notification)
- Academic stress or pressure
- Friendship conflicts
- Body image concerns
- Mild anxiety symptoms
- Sleep pattern issues
- Family relationship tensions

### LOW (Weekly summary)
- Normal developmental concerns
- Age-appropriate questions about growing up
- Typical peer interactions
- Mild emotional fluctuations

## RESPONSE FORMAT
Respond with a JSON object containing:
{
  "riskLevel": "none|low|medium|high|critical",
  "concerns": ["specific concern 1", "specific concern 2"],
  "confidence": 0.0-1.0,
  "requiresParentAlert": boolean,
  "alertType": "safety_concern|emotional_distress|behavioral_change|inappropriate_content|privacy_risk",
  "contextSummary": "Brief summary without revealing private details",
  "recommendedAction": "Suggested next steps for parents"
}

## PRIVACY PROTECTION
- Never include direct quotes from conversations
- Summarize patterns, not specific incidents
- Focus on behavioral changes and safety indicators
- Maintain child's dignity while ensuring safety

Analyze this conversation content and provide your assessment:
`;

export class AISafetyMonitor {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
  }

  async analyzeContent(context: MonitoringContext): Promise<SafetyAssessment> {
    try {
      // Get parent controls to understand monitoring level
      const [parentControl] = await db
        .select()
        .from(parentControls)
        .where(eq(parentControls.childId, context.childId));

      if (!parentControl || !(await this.shouldMonitor(parentControl, context))) {
        return {
          riskLevel: 'none',
          concerns: [],
          confidence: 0,
          requiresParentAlert: false
        };
      }

      const prompt = `${SAFETY_MONITORING_PROMPT}

Content to analyze: "${context.content}"
Child age: ${parentControl.ageOverride || 'unknown'}
Monitoring level: ${parentControl.safetyLevel}
Context: ${JSON.stringify(context.metadata || {})}`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Parse AI response
      const assessment = this.parseAIResponse(text);
      
      // Store content review
      await this.storeContentReview(context, assessment);

      // Create safety alert if needed and meets threshold
      if (assessment.requiresParentAlert && this.meetsAlertThreshold(assessment, parentControl)) {
        await this.createSafetyAlert(context, assessment, parentControl.parentId);
      }

      return assessment;
    } catch (error) {
      console.error('AI Safety Monitor error:', error);
      // Fallback to keyword-based monitoring
      return this.fallbackKeywordAnalysis(context);
    }
  }

  private async shouldMonitor(parentControl: any, context: MonitoringContext): Promise<boolean> {
    // Check if safety monitoring is enabled for this child
    if (!parentControl.safetyMonitoringEnabled) {
      return false;
    }

    const settings = parentControl.personalitySettings || {};
    const level = parentControl.safetyLevel || 'standard';

    // Always monitor for critical safety issues regardless of level
    if (level === 'minimal') {
      return this.containsCriticalKeywords(context.content);
    }

    return true; // Monitor for standard, enhanced, comprehensive levels
  }

  private containsCriticalKeywords(content: string): boolean {
    const criticalKeywords = [
      'hurt myself', 'kill myself', 'want to die', 'suicide',
      'abuse', 'inappropriate touch', 'secret', 'don\'t tell',
      'stranger', 'meet up', 'address', 'phone number',
      'cutting', 'self harm', 'bullying'
    ];

    const lowerContent = content.toLowerCase();
    return criticalKeywords.some(keyword => lowerContent.includes(keyword));
  }

  private parseAIResponse(text: string): SafetyAssessment {
    try {
      // Extract JSON from AI response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error('Failed to parse AI response:', error);
    }

    // Fallback assessment
    return {
      riskLevel: 'low',
      concerns: ['Unable to parse AI assessment'],
      confidence: 0.1,
      requiresParentAlert: false
    };
  }

  private async storeContentReview(context: MonitoringContext, assessment: SafetyAssessment) {
    // Note: contentReviews table needs to be defined in schema.ts
    // For now, we'll log the review instead of storing in DB
    console.log('Content Review:', {
      childId: context.childId,
      messageId: context.messageId,
      contentType: 'conversation',
      riskLevel: assessment.riskLevel,
      flaggedReasons: assessment.concerns,
      aiConfidence: assessment.confidence.toString(),
      requireHumanReview: assessment.riskLevel === 'critical',
      reviewStatus: 'pending'
    });
  }

  private async createSafetyAlert(
    context: MonitoringContext, 
    assessment: SafetyAssessment, 
    parentId: string
  ) {
    const severity = this.mapRiskToPriority(assessment.riskLevel);
    
    const [alert] = await db.insert(safetyAlerts).values({
      childId: context.childId,
      userId: parentId,
      alertType: assessment.alertType || 'safety_concern',
      severity,
      contextSummary: assessment.contextSummary || 'Safety concern detected',
      parentNotified: false,
      isResolved: false,
      adminReviewed: false
    }).returning();

    // Send push notification for high/critical alerts
    if (severity === 'high' || severity === 'critical') {
      await this.sendParentNotification(parentId, alert, assessment);
    }

    return alert;
  }

  private meetsAlertThreshold(assessment: SafetyAssessment, parentControl: any): boolean {
    const thresholds = parentControl.alertThresholds || {
      critical: true,
      high: true,
      medium: false,
      low: false,
      confidenceMinimum: 0.7
    };

    // Check confidence threshold
    if (assessment.confidence < thresholds.confidenceMinimum) {
      return false;
    }

    // Check severity threshold
    switch (assessment.riskLevel) {
      case 'critical':
        return thresholds.critical;
      case 'high':
        return thresholds.high;
      case 'medium':
        return thresholds.medium;
      case 'low':
        return thresholds.low;
      default:
        return false;
    }
  }

  private mapRiskToPriority(riskLevel: string): string {
    switch (riskLevel) {
      case 'critical': return 'critical';
      case 'high': return 'high';
      case 'medium': return 'medium';
      case 'low': return 'low';
      default: return 'low';
    }
  }

  private async sendParentNotification(parentId: string, alert: any, assessment: SafetyAssessment) {
    try {
      await sendPushNotification(parentId, {
        title: 'Safety Alert',
        body: assessment.contextSummary || 'A safety concern has been detected',
        data: {
          alertId: alert.id,
          alertType: alert.alertType,
          priority: alert.severity,
          action: 'view_alert'
        }
      });

      // Mark as notified
      await db.update(safetyAlerts)
        .set({ parentNotified: true })
        .where(eq(safetyAlerts.id, alert.id));
    } catch (error) {
      console.error('Failed to send push notification:', error);
    }
  }

  private fallbackKeywordAnalysis(context: MonitoringContext): SafetyAssessment {
    const content = context.content.toLowerCase();
    
    const criticalKeywords = ['hurt myself', 'kill myself', 'suicide', 'abuse'];
    const highKeywords = ['depressed', 'sad', 'lonely', 'scared'];
    const mediumKeywords = ['stressed', 'worried', 'anxious'];

    if (criticalKeywords.some(k => content.includes(k))) {
      return {
        riskLevel: 'critical',
        concerns: ['Critical safety keyword detected'],
        confidence: 0.8,
        requiresParentAlert: true,
        alertType: 'safety_concern',
        contextSummary: 'Critical safety concern detected through keyword analysis'
      };
    }

    if (highKeywords.some(k => content.includes(k))) {
      return {
        riskLevel: 'high',
        concerns: ['Emotional distress indicators'],
        confidence: 0.6,
        requiresParentAlert: true,
        alertType: 'emotional_distress',
        contextSummary: 'Emotional distress indicators detected'
      };
    }

    if (mediumKeywords.some(k => content.includes(k))) {
      return {
        riskLevel: 'medium',
        concerns: ['Mild stress indicators'],
        confidence: 0.4,
        requiresParentAlert: false
      };
    }

    return {
      riskLevel: 'none',
      concerns: [],
      confidence: 0.9,
      requiresParentAlert: false
    };
  }
}

export const aiSafetyMonitor = new AISafetyMonitor();