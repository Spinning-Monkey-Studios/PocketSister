import { db } from "./db";
import { gpsRequests, childProfiles, users } from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";
import type { InsertGpsRequest } from "@shared/schema";

export class GpsService {
  // Request GPS location from a child
  static async requestLocation(
    childId: string,
    parentId: string,
    requestType: 'location_check' | 'emergency' | 'tracking' = 'location_check',
    reason?: string,
    isEmergency: boolean = false
  ): Promise<string> {
    const [request] = await db
      .insert(gpsRequests)
      .values({
        childId,
        parentId,
        requestType,
        reason,
        isEmergency,
        status: 'pending',
      })
      .returning();

    return request.id;
  }

  // Child responds to GPS request with location data
  static async respondToLocationRequest(
    requestId: string,
    locationData: {
      latitude: number;
      longitude: number;
      accuracy?: number;
      timestamp?: number;
    },
    status: 'approved' | 'denied' = 'approved'
  ): Promise<void> {
    await db
      .update(gpsRequests)
      .set({
        status: status === 'approved' ? 'completed' : 'denied',
        locationData,
        respondedAt: new Date(),
      })
      .where(eq(gpsRequests.id, requestId));
  }

  // Get pending location requests for a child
  static async getPendingRequests(childId: string) {
    return await db
      .select({
        id: gpsRequests.id,
        parentId: gpsRequests.parentId,
        requestType: gpsRequests.requestType,
        reason: gpsRequests.reason,
        isEmergency: gpsRequests.isEmergency,
        requestedAt: gpsRequests.requestedAt,
        parentName: users.firstName,
      })
      .from(gpsRequests)
      .leftJoin(users, eq(gpsRequests.parentId, users.id))
      .where(
        and(
          eq(gpsRequests.childId, childId),
          eq(gpsRequests.status, 'pending')
        )
      )
      .orderBy(desc(gpsRequests.requestedAt));
  }

  // Get location history for admin dashboard
  static async getLocationHistory(
    childId?: string,
    startDate?: string,
    endDate?: string,
    limit: number = 100
  ) {
    let query = db
      .select({
        id: gpsRequests.id,
        childId: gpsRequests.childId,
        childName: childProfiles.name,
        parentId: gpsRequests.parentId,
        parentName: users.firstName,
        requestType: gpsRequests.requestType,
        status: gpsRequests.status,
        locationData: gpsRequests.locationData,
        isEmergency: gpsRequests.isEmergency,
        reason: gpsRequests.reason,
        requestedAt: gpsRequests.requestedAt,
        respondedAt: gpsRequests.respondedAt,
      })
      .from(gpsRequests)
      .leftJoin(childProfiles, eq(gpsRequests.childId, childProfiles.id))
      .leftJoin(users, eq(gpsRequests.parentId, users.id));

    // Apply filters
    const conditions = [];
    if (childId) conditions.push(eq(gpsRequests.childId, childId));
    if (startDate) conditions.push(eq(gpsRequests.requestedAt, new Date(startDate)));
    if (endDate) conditions.push(eq(gpsRequests.requestedAt, new Date(endDate)));

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    return await query
      .orderBy(desc(gpsRequests.requestedAt))
      .limit(limit);
  }

  // Get GPS statistics for admin dashboard
  static async getGpsStatistics() {
    const totalRequests = await db
      .select({ count: gpsRequests.id })
      .from(gpsRequests);

    const emergencyRequests = await db
      .select({ count: gpsRequests.id })
      .from(gpsRequests)
      .where(eq(gpsRequests.isEmergency, true));

    const completedRequests = await db
      .select({ count: gpsRequests.id })
      .from(gpsRequests)
      .where(eq(gpsRequests.status, 'completed'));

    return {
      totalRequests: totalRequests.length,
      emergencyRequests: emergencyRequests.length,
      completedRequests: completedRequests.length,
      responseRate: totalRequests.length > 0 
        ? Math.round((completedRequests.length / totalRequests.length) * 100)
        : 0
    };
  }

  // Emergency location request (high priority)
  static async requestEmergencyLocation(childId: string, parentId: string, reason: string) {
    return await this.requestLocation(childId, parentId, 'emergency', reason, true);
  }

  // Check if child has location sharing enabled
  static async isLocationSharingEnabled(childId: string): Promise<boolean> {
    // This would check child's privacy settings
    // For now, return true (implementation depends on your privacy settings structure)
    return true;
  }
}

// GPS permissions and privacy utilities
export class GpsPrivacyService {
  static async updateLocationPermissions(
    childId: string,
    permissions: {
      shareWithParents: boolean;
      emergencyOnly: boolean;
      trackingInterval?: number;
    }
  ) {
    // Implementation depends on your privacy settings structure
    // This is a placeholder for the permission management
    console.log('Updating location permissions for child:', childId, permissions);
  }
}