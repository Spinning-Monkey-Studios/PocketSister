import { db } from "./db";
import { users, childProfiles } from "@shared/schema";
import { eq, sql, and, or, like, desc, asc } from "drizzle-orm";

export interface ChildForAdmin {
  id: string;
  name: string;
  age: number;
  parentEmail: string;
  parentName: string;
  subscriptionTier: string;
  subscriptionStatus: string;
  tokensUsedThisMonth: number;
  freeTrialTokensUsed: number;
  avatarImageUrl?: string;
  companionName: string;
  createdAt: Date;
}

export interface AgeGroupSummary {
  ageGroup: string;
  count: number;
  children: ChildForAdmin[];
}

export class AdminChildrenManager {
  // Get all children grouped by age ranges
  static async getChildrenByAgeGroups(): Promise<AgeGroupSummary[]> {
    const allChildren = await db
      .select({
        childId: childProfiles.id,
        childName: childProfiles.name,
        age: childProfiles.age,
        parentId: users.id,
        parentEmail: users.email,
        parentFirstName: users.firstName,
        parentLastName: users.lastName,
        subscriptionTier: users.subscriptionTier,
        subscriptionStatus: users.subscriptionStatus,
        tokenUsageThisMonth: users.tokenUsageThisMonth,
        freeTrialTokensUsed: users.freeTrialTokensUsed,
        avatarImageUrl: childProfiles.avatarImageUrl,
        companionName: childProfiles.companionName,
        createdAt: childProfiles.createdAt
      })
      .from(childProfiles)
      .innerJoin(users, eq(childProfiles.userId, users.id))
      .orderBy(childProfiles.age, childProfiles.name);

    // Group children by age ranges
    const ageGroups = new Map<string, ChildForAdmin[]>();
    
    allChildren.forEach((child: any) => {
      const age = child.age;
      let ageGroup: string;
      
      if (age <= 8) {
        ageGroup = "Early Elementary (5-8)";
      } else if (age <= 11) {
        ageGroup = "Late Elementary (9-11)";
      } else if (age <= 14) {
        ageGroup = "Middle School (12-14)";
      } else {
        ageGroup = "High School (15+)";
      }

      if (!ageGroups.has(ageGroup)) {
        ageGroups.set(ageGroup, []);
      }

      ageGroups.get(ageGroup)!.push({
        id: child.childId,
        name: child.childName,
        age: child.age,
        parentEmail: child.parentEmail || 'No email',
        parentName: `${child.parentFirstName || ''} ${child.parentLastName || ''}`.trim() || 'No name',
        subscriptionTier: child.subscriptionTier || 'free',
        subscriptionStatus: child.subscriptionStatus || 'free',
        tokensUsedThisMonth: child.tokenUsageThisMonth || 0,
        freeTrialTokensUsed: child.freeTrialTokensUsed || 0,
        avatarImageUrl: child.avatarImageUrl || undefined,
        companionName: child.companionName || 'Stella',
        createdAt: child.createdAt || new Date()
      });
    });

    // Convert to array format
    return Array.from(ageGroups.entries()).map(([ageGroup, children]) => ({
      ageGroup,
      count: children.length,
      children: children.sort((a, b) => a.name.localeCompare(b.name))
    }));
  }

  // Update child name
  static async updateChildName(childId: string, newName: string): Promise<boolean> {
    try {
      const result = await db
        .update(childProfiles)
        .set({ name: newName })
        .where(eq(childProfiles.id, childId));
      
      return true;
    } catch (error) {
      console.error('Error updating child name:', error);
      return false;
    }
  }

  // Update parent subscription tier
  static async updateParentSubscription(childId: string, newTier: 'free' | 'basic' | 'premium' | 'family'): Promise<boolean> {
    try {
      // Get the parent ID from the child
      const child = await db
        .select({ userId: childProfiles.userId })
        .from(childProfiles)
        .where(eq(childProfiles.id, childId))
        .limit(1);

      if (child.length === 0) {
        return false;
      }

      const parentId = child[0].userId;

      // Update parent's subscription
      await db
        .update(users)
        .set({ 
          subscriptionTier: newTier,
          subscriptionStatus: newTier === 'free' ? 'free' : 'active'
        })
        .where(eq(users.id, parentId));

      return true;
    } catch (error) {
      console.error('Error updating parent subscription:', error);
      return false;
    }
  }

  // Create test children with different ages and personalities
  static async createTestChildren(parentEmail: string): Promise<ChildForAdmin[]> {
    try {
      // Find or create parent user
      let parent = await db
        .select()
        .from(users)
        .where(eq(users.email, parentEmail))
        .limit(1);

      if (parent.length === 0) {
        // Create parent user
        const [newParent] = await db
          .insert(users)
          .values({
            email: parentEmail,
            firstName: 'Test',
            lastName: 'Parent',
            subscriptionTier: 'family',
            subscriptionStatus: 'active'
          })
          .returning();
        parent = [newParent];
      }

      const parentId = parent[0].id;

      // Test children data with different ages and personalities
      const testChildrenData = [
        {
          name: 'Emma',
          age: 7,
          companionName: 'Sparkle',
          personality: 'Creative and imaginative, loves art and stories'
        },
        {
          name: 'Sophia',
          age: 10,
          companionName: 'Luna',
          personality: 'Curious and studious, asks lots of questions'
        },
        {
          name: 'Ava',
          age: 12,
          companionName: 'Nova',
          personality: 'Social butterfly, interested in friendships'
        },
        {
          name: 'Isabella',
          age: 14,
          companionName: 'Sage',
          personality: 'Thoughtful and introspective, planning for high school'
        },
        {
          name: 'Mia',
          age: 9,
          companionName: 'Sunny',
          personality: 'Athletic and energetic, loves sports and outdoor activities'
        }
      ];

      // Create children profiles
      const createdChildren: ChildForAdmin[] = [];

      for (const childData of testChildrenData) {
        const [child] = await db
          .insert(childProfiles)
          .values({
            userId: parentId,
            name: childData.name,
            age: childData.age,
            companionName: childData.companionName,
            personalityProfile: {
              description: childData.personality,
              traits: ['friendly', 'curious'],
              preferences: ['learning', 'creativity']
            }
          })
          .returning();

        createdChildren.push({
          id: child.id,
          name: child.name,
          age: child.age,
          parentEmail: parentEmail,
          parentName: 'Test Parent',
          subscriptionTier: 'family',
          subscriptionStatus: 'active',
          tokensUsedThisMonth: Math.floor(Math.random() * 50), // Random usage for demo
          freeTrialTokensUsed: 0,
          avatarImageUrl: child.avatarImageUrl || undefined,
          companionName: child.companionName || 'Stella',
          createdAt: child.createdAt || new Date()
        });
      }

      return createdChildren;
    } catch (error) {
      console.error('Error creating test children:', error);
      return [];
    }
  }

  // Get detailed stats for admin dashboard
  static async getSystemStats(): Promise<{
    totalChildren: number;
    totalParents: number;
    subscriptionTiers: Record<string, number>;
    ageDistribution: Record<string, number>;
    monthlyUsage: {
      totalInteractions: number;
      averagePerChild: number;
    };
  }> {
    try {
      // Total children and parents
      const totalChildren = await db
        .select({ count: sql<number>`count(*)` })
        .from(childProfiles);
      
      const totalParents = await db
        .select({ count: sql<number>`count(*)` })
        .from(users);

      // Subscription tier distribution
      const tierStats = await db
        .select({
          tier: users.subscriptionTier,
          count: sql<number>`count(*)`
        })
        .from(users)
        .groupBy(users.subscriptionTier);

      const subscriptionTiers: Record<string, number> = {};
      tierStats.forEach((stat: any) => {
        subscriptionTiers[stat.tier || 'free'] = Number(stat.count);
      });

      // Age distribution
      const ageStats = await db
        .select({
          age: childProfiles.age,
          count: sql<number>`count(*)`
        })
        .from(childProfiles)
        .groupBy(childProfiles.age);

      const ageDistribution: Record<string, number> = {};
      ageStats.forEach((stat: any) => {
        const age = stat.age;
        let ageGroup: string;
        
        if (age <= 8) {
          ageGroup = "5-8";
        } else if (age <= 11) {
          ageGroup = "9-11";
        } else if (age <= 14) {
          ageGroup = "12-14";
        } else {
          ageGroup = "15+";
        }

        ageDistribution[ageGroup] = (ageDistribution[ageGroup] || 0) + Number(stat.count);
      });

      // Monthly usage stats
      const usageStats = await db
        .select({
          totalUsage: sql<number>`sum(${users.tokenUsageThisMonth})`
        })
        .from(users);

      const totalInteractions = Number(usageStats[0]?.totalUsage || 0);
      const averagePerChild = totalChildren[0].count > 0 ? totalInteractions / Number(totalChildren[0].count) : 0;

      return {
        totalChildren: Number(totalChildren[0].count),
        totalParents: Number(totalParents[0].count),
        subscriptionTiers,
        ageDistribution,
        monthlyUsage: {
          totalInteractions,
          averagePerChild: Math.round(averagePerChild)
        }
      };
    } catch (error) {
      console.error('Error getting system stats:', error);
      return {
        totalChildren: 0,
        totalParents: 0,
        subscriptionTiers: {},
        ageDistribution: {},
        monthlyUsage: { totalInteractions: 0, averagePerChild: 0 }
      };
    }
  }
}