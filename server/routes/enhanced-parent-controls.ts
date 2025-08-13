import { Router } from 'express';
import { db } from '../db';
import { isAuthenticated } from '../replitAuth';
import { eq, and, desc, gte, sql } from 'drizzle-orm';

const router = Router();

// Enhanced GPS tracking endpoints
router.get('/child/:childId/location/current', isAuthenticated, async (req: any, res) => {
  try {
    const { childId } = req.params;
    const userId = req.user.claims.sub;

    // Verify parent owns child
    const result = await db.execute(sql`
      SELECT cp.id FROM child_profiles cp 
      WHERE cp.id = ${childId} AND cp.user_id = ${userId}
    `);

    if (result.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get latest location
    const location = await db.execute(sql`
      SELECT * FROM enhanced_gps_data 
      WHERE child_id = ${childId} 
      ORDER BY timestamp DESC 
      LIMIT 1
    `);

    res.json({
      success: true,
      location: location[0] || null,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to get current location:', error);
    res.status(500).json({ error: 'Failed to get location' });
  }
});

router.get('/child/:childId/location/history', isAuthenticated, async (req: any, res) => {
  try {
    const { childId } = req.params;
    const { hours = 24 } = req.query;
    const userId = req.user.claims.sub;

    // Verify parent owns child
    const result = await db.execute(sql`
      SELECT cp.id FROM child_profiles cp 
      WHERE cp.id = ${childId} AND cp.user_id = ${userId}
    `);

    if (result.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const hoursAgo = new Date(Date.now() - parseInt(hours as string) * 60 * 60 * 1000);

    // Get location history
    const locations = await db.execute(sql`
      SELECT * FROM enhanced_gps_data 
      WHERE child_id = ${childId} 
      AND timestamp >= ${hoursAgo}
      ORDER BY timestamp DESC 
      LIMIT 100
    `);

    res.json({
      success: true,
      locations,
      period: `${hours} hours`,
      count: locations.length
    });
  } catch (error) {
    console.error('Failed to get location history:', error);
    res.status(500).json({ error: 'Failed to get location history' });
  }
});

// Geofence management
router.post('/child/:childId/geofence', isAuthenticated, async (req: any, res) => {
  try {
    const { childId } = req.params;
    const userId = req.user.claims.sub;
    const { zoneName, zoneType, centerLatitude, centerLongitude, radiusMeters, timeRestrictions, alertSettings } = req.body;

    // Verify parent owns child
    const result = await db.execute(sql`
      SELECT cp.id FROM child_profiles cp 
      WHERE cp.id = ${childId} AND cp.user_id = ${userId}
    `);

    if (result.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Create geofence zone
    const zone = await db.execute(sql`
      INSERT INTO geofence_zones (
        child_id, parent_id, zone_name, zone_type, 
        center_latitude, center_longitude, radius_meters,
        time_restrictions, alert_settings
      ) VALUES (
        ${childId}, ${userId}, ${zoneName}, ${zoneType},
        ${centerLatitude}, ${centerLongitude}, ${radiusMeters},
        ${JSON.stringify(timeRestrictions || {})}, ${JSON.stringify(alertSettings || {})}
      ) RETURNING *
    `);

    res.json({
      success: true,
      zone: zone[0],
      message: 'Geofence zone created successfully'
    });
  } catch (error) {
    console.error('Failed to create geofence:', error);
    res.status(500).json({ error: 'Failed to create geofence' });
  }
});

// Usage controls endpoints
router.get('/child/:childId/usage/current', isAuthenticated, async (req: any, res) => {
  try {
    const { childId } = req.params;
    const userId = req.user.claims.sub;

    // Verify parent owns child
    const result = await db.execute(sql`
      SELECT cp.id FROM child_profiles cp 
      WHERE cp.id = ${childId} AND cp.user_id = ${userId}
    `);

    if (result.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get today's usage
    const todayUsage = await db.execute(sql`
      SELECT 
        SUM(total_duration) as total_minutes,
        COUNT(*) as session_count,
        MAX(timestamp) as last_activity
      FROM app_usage_sessions 
      WHERE child_id = ${childId} 
      AND session_start >= ${today}
    `);

    // Get current session if active
    const activeSession = await db.execute(sql`
      SELECT * FROM app_usage_sessions 
      WHERE child_id = ${childId} 
      AND session_end IS NULL 
      ORDER BY session_start DESC 
      LIMIT 1
    `);

    // Get usage limits
    const limits = await db.execute(sql`
      SELECT * FROM usage_control_settings 
      WHERE child_id = ${childId} 
      ORDER BY updated_at DESC 
      LIMIT 1
    `);

    res.json({
      success: true,
      currentUsage: {
        totalMinutesToday: parseInt(todayUsage[0]?.total_minutes) || 0,
        sessionCount: parseInt(todayUsage[0]?.session_count) || 0,
        lastActivity: todayUsage[0]?.last_activity,
        activeSession: activeSession[0] || null
      },
      limits: limits[0] || null,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to get current usage:', error);
    res.status(500).json({ error: 'Failed to get usage data' });
  }
});

router.post('/child/:childId/usage/limits', isAuthenticated, async (req: any, res) => {
  try {
    const { childId } = req.params;
    const userId = req.user.claims.sub;
    const { dailyLimits, weeklyLimits, timeWindows, featureRestrictions, breakReminders, enforcementSettings } = req.body;

    // Verify parent owns child
    const result = await db.execute(sql`
      SELECT cp.id FROM child_profiles cp 
      WHERE cp.id = ${childId} AND cp.user_id = ${userId}
    `);

    if (result.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Upsert usage control settings
    const settings = await db.execute(sql`
      INSERT INTO usage_control_settings (
        child_id, parent_id, daily_limits, weekly_limits, 
        time_windows, feature_restrictions, break_reminders, enforcement_settings
      ) VALUES (
        ${childId}, ${userId}, 
        ${JSON.stringify(dailyLimits)}, ${JSON.stringify(weeklyLimits)},
        ${JSON.stringify(timeWindows)}, ${JSON.stringify(featureRestrictions)},
        ${JSON.stringify(breakReminders)}, ${JSON.stringify(enforcementSettings)}
      ) ON CONFLICT (child_id, parent_id) DO UPDATE SET
        daily_limits = ${JSON.stringify(dailyLimits)},
        weekly_limits = ${JSON.stringify(weeklyLimits)},
        time_windows = ${JSON.stringify(timeWindows)},
        feature_restrictions = ${JSON.stringify(featureRestrictions)},
        break_reminders = ${JSON.stringify(breakReminders)},
        enforcement_settings = ${JSON.stringify(enforcementSettings)},
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `);

    res.json({
      success: true,
      settings: settings[0],
      message: 'Usage limits updated successfully'
    });
  } catch (error) {
    console.error('Failed to update usage limits:', error);
    res.status(500).json({ error: 'Failed to update usage limits' });
  }
});

// Usage analytics
router.get('/child/:childId/usage/analytics', isAuthenticated, async (req: any, res) => {
  try {
    const { childId } = req.params;
    const { days = 7 } = req.query;
    const userId = req.user.claims.sub;

    // Verify parent owns child
    const result = await db.execute(sql`
      SELECT cp.id FROM child_profiles cp 
      WHERE cp.id = ${childId} AND cp.user_id = ${userId}
    `);

    if (result.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const daysAgo = new Date(Date.now() - parseInt(days as string) * 24 * 60 * 60 * 1000);

    // Get usage analytics
    const analytics = await db.execute(sql`
      SELECT 
        DATE(session_start) as date,
        SUM(total_duration) as total_minutes,
        COUNT(*) as session_count,
        AVG(usage_quality_score) as avg_quality_score,
        features_used,
        screen_time_breakdown
      FROM app_usage_sessions 
      WHERE child_id = ${childId} 
      AND session_start >= ${daysAgo}
      GROUP BY DATE(session_start), features_used, screen_time_breakdown
      ORDER BY date DESC
    `);

    // Calculate weekly summary
    const weeklyTotals = await db.execute(sql`
      SELECT 
        SUM(total_duration) as total_minutes,
        COUNT(*) as total_sessions,
        AVG(usage_quality_score) as avg_quality
      FROM app_usage_sessions 
      WHERE child_id = ${childId} 
      AND session_start >= ${daysAgo}
    `);

    res.json({
      success: true,
      analytics: {
        dailyBreakdown: analytics,
        weeklySummary: weeklyTotals[0] || { total_minutes: 0, total_sessions: 0, avg_quality: 0 },
        period: `${days} days`
      }
    });
  } catch (error) {
    console.error('Failed to get usage analytics:', error);
    res.status(500).json({ error: 'Failed to get usage analytics' });
  }
});

// Emergency usage override
router.post('/child/:childId/usage/override', isAuthenticated, async (req: any, res) => {
  try {
    const { childId } = req.params;
    const { overrideMinutes, reason } = req.body;
    const userId = req.user.claims.sub;

    // Verify parent owns child
    const result = await db.execute(sql`
      SELECT cp.id FROM child_profiles cp 
      WHERE cp.id = ${childId} AND cp.user_id = ${userId}
    `);

    if (result.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Log the override (could be stored in a separate table)
    const override = {
      childId,
      parentId: userId,
      overrideMinutes: parseInt(overrideMinutes),
      reason,
      timestamp: new Date().toISOString()
    };

    // In a real implementation, this would grant temporary additional usage time
    // For now, we'll just log it
    console.log('Usage override granted:', override);

    res.json({
      success: true,
      override,
      message: `Granted ${overrideMinutes} additional minutes for: ${reason}`
    });
  } catch (error) {
    console.error('Failed to create usage override:', error);
    res.status(500).json({ error: 'Failed to create override' });
  }
});

export default router;