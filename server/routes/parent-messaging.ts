import { Router } from 'express';
import { db } from '../db';
import { 
  parentMessages, 
  childDevices, 
  childLocations, 
  locationSettings, 
  activationRequests,
  childProfiles,
  users,
  type InsertParentMessage,
  type InsertChildLocation,
  type InsertLocationSetting,
  type InsertActivationRequest
} from '@shared/schema';
import { eq, desc, and, gte, lte } from 'drizzle-orm';
import { isAuthenticated } from '../replitAuth';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

const router = Router();

// Zod schemas for validation
const insertParentMessageSchema = createInsertSchema(parentMessages).omit({ 
  id: true, 
  createdAt: true,
  sentAt: true,
  deliveredAt: true,
  readAt: true 
});

const insertLocationSchema = createInsertSchema(childLocations).omit({ 
  id: true, 
  createdAt: true 
});

const insertLocationSettingsSchema = createInsertSchema(locationSettings).omit({ 
  id: true, 
  createdAt: true,
  updatedAt: true 
});

const insertActivationRequestSchema = createInsertSchema(activationRequests).omit({ 
  id: true, 
  createdAt: true,
  requestedAt: true,
  parentNotified: true 
});

// Parent sends message to child
router.post('/send-message', isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.claims.sub;
    const messageData = insertParentMessageSchema.parse({
      ...req.body,
      parentId: userId
    });

    // Verify parent owns the child profile
    const child = await db.select().from(childProfiles)
      .where(and(
        eq(childProfiles.id, messageData.childId),
        eq(childProfiles.userId, userId)
      ));

    if (!child.length) {
      return res.status(403).json({ error: 'Access denied to child profile' });
    }

    const [message] = await db.insert(parentMessages)
      .values({
        ...messageData,
        sentAt: new Date()
      })
      .returning();

    // TODO: Send push notification to child's device
    
    res.json({ success: true, message });
  } catch (error) {
    console.error('Failed to send parent message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Get messages for a child (child app endpoint)
router.get('/messages/:childId', async (req, res) => {
  try {
    const { childId } = req.params;
    const deviceId = req.headers['x-device-id'] as string;

    if (!deviceId) {
      return res.status(400).json({ error: 'Device ID required' });
    }

    // Verify device is activated for this child
    const device = await db.select().from(childDevices)
      .where(and(
        eq(childDevices.childId, childId),
        eq(childDevices.deviceId, deviceId),
        eq(childDevices.isActivated, true)
      ));

    if (!device.length) {
      return res.status(403).json({ error: 'Device not activated' });
    }

    const messages = await db.select().from(parentMessages)
      .where(eq(parentMessages.childId, childId))
      .orderBy(desc(parentMessages.createdAt));

    res.json({ messages });
  } catch (error) {
    console.error('Failed to get child messages:', error);
    res.status(500).json({ error: 'Failed to get messages' });
  }
});

// Mark message as read (child app endpoint)
router.patch('/messages/:messageId/read', async (req, res) => {
  try {
    const { messageId } = req.params;
    const deviceId = req.headers['x-device-id'] as string;

    if (!deviceId) {
      return res.status(400).json({ error: 'Device ID required' });
    }

    await db.update(parentMessages)
      .set({ 
        isRead: true, 
        readAt: new Date() 
      })
      .where(eq(parentMessages.id, messageId));

    res.json({ success: true });
  } catch (error) {
    console.error('Failed to mark message as read:', error);
    res.status(500).json({ error: 'Failed to mark message as read' });
  }
});

// Get parent's sent messages
router.get('/sent-messages', isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.claims.sub;
    
    const messages = await db.select({
      id: parentMessages.id,
      message: parentMessages.message,
      messageType: parentMessages.messageType,
      scheduledFor: parentMessages.scheduledFor,
      sentAt: parentMessages.sentAt,
      deliveredAt: parentMessages.deliveredAt,
      readAt: parentMessages.readAt,
      isRead: parentMessages.isRead,
      isDelivered: parentMessages.isDelivered,
      priority: parentMessages.priority,
      createdAt: parentMessages.createdAt,
      childName: childProfiles.name
    })
    .from(parentMessages)
    .innerJoin(childProfiles, eq(parentMessages.childId, childProfiles.id))
    .where(eq(parentMessages.parentId, userId))
    .orderBy(desc(parentMessages.createdAt));

    res.json({ messages });
  } catch (error) {
    console.error('Failed to get sent messages:', error);
    res.status(500).json({ error: 'Failed to get sent messages' });
  }
});

// Child app reports location (GPS tracking)
router.post('/location', async (req, res) => {
  try {
    const deviceId = req.headers['x-device-id'] as string;
    
    if (!deviceId) {
      return res.status(400).json({ error: 'Device ID required' });
    }

    const locationData = insertLocationSchema.parse({
      ...req.body,
      deviceId
    });

    // Verify device is activated
    const device = await db.select().from(childDevices)
      .where(and(
        eq(childDevices.deviceId, deviceId),
        eq(childDevices.isActivated, true)
      ));

    if (!device.length) {
      return res.status(403).json({ error: 'Device not activated' });
    }

    // Check if location tracking is enabled for this child
    const settings = await db.select().from(locationSettings)
      .where(eq(locationSettings.childId, device[0].childId));

    if (!settings.length || !settings[0].isLocationEnabled) {
      return res.status(403).json({ error: 'Location tracking not enabled' });
    }

    // Store location
    const [location] = await db.insert(childLocations)
      .values(locationData)
      .returning();

    // Update device last seen
    await db.update(childDevices)
      .set({ lastSeenAt: new Date() })
      .where(eq(childDevices.deviceId, deviceId));

    res.json({ success: true, location });
  } catch (error) {
    console.error('Failed to store location:', error);
    res.status(500).json({ error: 'Failed to store location' });
  }
});

// Parent gets child's location history
router.get('/location/:childId', isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.claims.sub;
    const { childId } = req.params;
    const { hours = 24 } = req.query;

    // Verify parent owns the child profile
    const child = await db.select().from(childProfiles)
      .where(and(
        eq(childProfiles.id, childId),
        eq(childProfiles.userId, userId)
      ));

    if (!child.length) {
      return res.status(403).json({ error: 'Access denied to child profile' });
    }

    // Check location settings
    const settings = await db.select().from(locationSettings)
      .where(eq(locationSettings.childId, childId));

    if (!settings.length || !settings[0].shareLocationWithParent) {
      return res.status(403).json({ error: 'Location sharing not enabled' });
    }

    const hoursAgo = new Date(Date.now() - (parseInt(hours as string) * 60 * 60 * 1000));

    const locations = await db.select()
      .from(childLocations)
      .where(and(
        eq(childLocations.childId, childId),
        gte(childLocations.timestamp, hoursAgo)
      ))
      .orderBy(desc(childLocations.timestamp));

    res.json({ locations });
  } catch (error) {
    console.error('Failed to get location history:', error);
    res.status(500).json({ error: 'Failed to get location history' });
  }
});

// Parent updates location settings
router.put('/location-settings/:childId', isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.claims.sub;
    const { childId } = req.params;

    // Verify parent owns the child profile
    const child = await db.select().from(childProfiles)
      .where(and(
        eq(childProfiles.id, childId),
        eq(childProfiles.userId, userId)
      ));

    if (!child.length) {
      return res.status(403).json({ error: 'Access denied to child profile' });
    }

    const settingsData = insertLocationSettingsSchema.parse({
      ...req.body,
      childId,
      parentId: userId
    });

    // Upsert location settings
    const [settings] = await db.insert(locationSettings)
      .values(settingsData)
      .onConflictDoUpdate({
        target: locationSettings.childId,
        set: {
          ...settingsData,
          updatedAt: new Date()
        }
      })
      .returning();

    res.json({ success: true, settings });
  } catch (error) {
    console.error('Failed to update location settings:', error);
    res.status(500).json({ error: 'Failed to update location settings' });
  }
});

// Child app requests activation
router.post('/request-activation', async (req, res) => {
  try {
    const requestData = insertActivationRequestSchema.parse(req.body);

    // Check if device already exists
    const existingDevice = await db.select().from(childDevices)
      .where(eq(childDevices.deviceId, requestData.deviceId));

    if (existingDevice.length && existingDevice[0].isActivated) {
      return res.status(400).json({ error: 'Device already activated' });
    }

    // Create activation request
    const [request] = await db.insert(activationRequests)
      .values(requestData)
      .returning();

    // TODO: Send notification to parent

    res.json({ 
      success: true, 
      message: 'Activation request sent to parent. Please wait for approval.',
      requestId: request.id 
    });
  } catch (error) {
    console.error('Failed to request activation:', error);
    res.status(500).json({ error: 'Failed to request activation' });
  }
});

// Parent approves/rejects activation request
router.patch('/activation-request/:requestId', isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.claims.sub;
    const { requestId } = req.params;
    const { action } = req.body; // 'approve' or 'reject'

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action' });
    }

    // Get activation request and verify ownership
    const [request] = await db.select()
      .from(activationRequests)
      .innerJoin(childProfiles, eq(activationRequests.childId, childProfiles.id))
      .where(and(
        eq(activationRequests.id, requestId),
        eq(childProfiles.userId, userId)
      ));

    if (!request) {
      return res.status(404).json({ error: 'Activation request not found' });
    }

    if (action === 'approve') {
      // Create or update device
      const deviceInfo = request.activation_requests.deviceInfo as any || {};
      await db.insert(childDevices)
        .values({
          childId: request.activation_requests.childId,
          deviceId: request.activation_requests.deviceId,
          platform: deviceInfo.platform || 'unknown',
          appVersion: deviceInfo.appVersion,
          deviceName: deviceInfo.deviceName,
          isActivated: true,
          activatedAt: new Date(),
          activatedBy: userId
        })
        .onConflictDoUpdate({
          target: childDevices.deviceId,
          set: {
            isActivated: true,
            activatedAt: new Date(),
            activatedBy: userId
          }
        });

      // Update request
      await db.update(activationRequests)
        .set({
          status: 'approved',
          approvedAt: new Date(),
          approvedBy: userId
        })
        .where(eq(activationRequests.id, requestId));
    } else {
      // Reject request
      await db.update(activationRequests)
        .set({
          status: 'rejected',
          rejectedAt: new Date(),
          approvedBy: userId
        })
        .where(eq(activationRequests.id, requestId));
    }

    res.json({ success: true, action });
  } catch (error) {
    console.error('Failed to process activation request:', error);
    res.status(500).json({ error: 'Failed to process activation request' });
  }
});

// Parent gets pending activation requests
router.get('/activation-requests', isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.claims.sub;

    const requests = await db.select({
      id: activationRequests.id,
      childId: activationRequests.childId,
      childName: childProfiles.name,
      deviceId: activationRequests.deviceId,
      deviceInfo: activationRequests.deviceInfo,
      requestedAt: activationRequests.requestedAt,
      status: activationRequests.status
    })
    .from(activationRequests)
    .innerJoin(childProfiles, eq(activationRequests.childId, childProfiles.id))
    .where(and(
      eq(childProfiles.userId, userId),
      eq(activationRequests.status, 'pending')
    ))
    .orderBy(desc(activationRequests.requestedAt));

    res.json({ requests });
  } catch (error) {
    console.error('Failed to get activation requests:', error);
    res.status(500).json({ error: 'Failed to get activation requests' });
  }
});

// Check device activation status (for child app)
router.get('/activation-status/:deviceId', async (req, res) => {
  try {
    const { deviceId } = req.params;

    const device = await db.select().from(childDevices)
      .where(eq(childDevices.deviceId, deviceId));

    if (!device.length) {
      return res.json({ isActivated: false, status: 'not_found' });
    }

    res.json({ 
      isActivated: device[0].isActivated,
      status: device[0].isActivated ? 'activated' : 'pending',
      activatedAt: device[0].activatedAt
    });
  } catch (error) {
    console.error('Failed to check activation status:', error);
    res.status(500).json({ error: 'Failed to check activation status' });
  }
});

export default router;