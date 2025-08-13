import { Router } from "express";
import { UsageTrackingService } from "./usage-tracking";
import { GpsService } from "./gps-service";
import { OfflineHandlerService } from "./offline-handler";
// Use middleware instead of named import for now
const isAdminAuthenticated = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized - No token provided' });
  }
  // For now, basic validation - can be enhanced later
  next();
};

const router = Router();

// Middleware to protect all admin routes
router.use(isAdminAuthenticated);

// Usage metrics endpoints
router.get('/usage-metrics', async (req, res) => {
  try {
    const { startDate, endDate, childId } = req.query;
    const metrics = await UsageTrackingService.getUsageMetrics(
      startDate as string,
      endDate as string,
      childId as string
    );
    res.json(metrics);
  } catch (error) {
    console.error('Error fetching usage metrics:', error);
    res.status(500).json({ error: 'Failed to fetch usage metrics' });
  }
});

router.get('/usage-summary', async (req, res) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const summary = await UsageTrackingService.getDailyUsageSummary(days);
    res.json(summary);
  } catch (error) {
    console.error('Error fetching usage summary:', error);
    res.status(500).json({ error: 'Failed to fetch usage summary' });
  }
});

router.get('/top-users', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const topUsers = await UsageTrackingService.getTopUsersByUsage(limit);
    res.json(topUsers);
  } catch (error) {
    console.error('Error fetching top users:', error);
    res.status(500).json({ error: 'Failed to fetch top users' });
  }
});

router.get('/active-sessions', async (req, res) => {
  try {
    const count = await UsageTrackingService.getActiveSessionsCount();
    res.json({ activeSessionsCount: count });
  } catch (error) {
    console.error('Error fetching active sessions:', error);
    res.status(500).json({ error: 'Failed to fetch active sessions' });
  }
});

// GPS tracking endpoints
router.post('/gps-request', async (req, res) => {
  try {
    const { childId, parentId, requestType, reason, isEmergency } = req.body;
    const requestId = await GpsService.requestLocation(
      childId,
      parentId,
      requestType,
      reason,
      isEmergency
    );
    res.json({ requestId, message: 'GPS request sent successfully' });
  } catch (error) {
    console.error('Error sending GPS request:', error);
    res.status(500).json({ error: 'Failed to send GPS request' });
  }
});

router.get('/gps-history', async (req, res) => {
  try {
    const { childId, startDate, endDate, limit } = req.query;
    const history = await GpsService.getLocationHistory(
      childId as string,
      startDate as string,
      endDate as string,
      limit ? parseInt(limit as string) : undefined
    );
    res.json(history);
  } catch (error) {
    console.error('Error fetching GPS history:', error);
    res.status(500).json({ error: 'Failed to fetch GPS history' });
  }
});

router.get('/gps-statistics', async (req, res) => {
  try {
    const stats = await GpsService.getGpsStatistics();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching GPS statistics:', error);
    res.status(500).json({ error: 'Failed to fetch GPS statistics' });
  }
});

// AI Message Templates endpoints
router.get('/message-templates', async (req, res) => {
  try {
    const templates = await OfflineHandlerService.getAllTemplates();
    res.json(templates);
  } catch (error) {
    console.error('Error fetching message templates:', error);
    res.status(500).json({ error: 'Failed to fetch message templates' });
  }
});

router.put('/message-templates/:templateKey', async (req, res) => {
  try {
    const { templateKey } = req.params;
    const updates = req.body;
    const success = await OfflineHandlerService.updateMessageTemplate(templateKey, updates);
    
    if (success) {
      res.json({ message: 'Template updated successfully' });
    } else {
      res.status(404).json({ error: 'Template not found' });
    }
  } catch (error) {
    console.error('Error updating message template:', error);
    res.status(500).json({ error: 'Failed to update message template' });
  }
});

router.post('/message-templates', async (req, res) => {
  try {
    const template = req.body;
    const templateId = await OfflineHandlerService.createTemplate(template);
    res.json({ templateId, message: 'Template created successfully' });
  } catch (error) {
    console.error('Error creating message template:', error);
    res.status(500).json({ error: 'Failed to create message template' });
  }
});

router.delete('/message-templates/:templateKey', async (req, res) => {
  try {
    const { templateKey } = req.params;
    const success = await OfflineHandlerService.deleteTemplate(templateKey);
    
    if (success) {
      res.json({ message: 'Template deleted successfully' });
    } else {
      res.status(404).json({ error: 'Template not found' });
    }
  } catch (error) {
    console.error('Error deleting message template:', error);
    res.status(500).json({ error: 'Failed to delete message template' });
  }
});

// Test offline message processing
router.post('/test-offline-message', async (req, res) => {
  try {
    const { templateKey, pocketSisterName } = req.body;
    const message = await OfflineHandlerService.getProcessedOfflineMessage(
      templateKey,
      { pocketSisterName }
    );
    res.json(message);
  } catch (error) {
    console.error('Error processing offline message:', error);
    res.status(500).json({ error: 'Failed to process offline message' });
  }
});

export default router;