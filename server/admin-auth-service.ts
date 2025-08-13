import bcrypt from "bcrypt";
import crypto from "crypto";
import speakeasy from "speakeasy";
import type { RequestHandler } from "express";
import { db } from "./db";
import { adminUsers, adminSessions, adminAuditLog } from "@shared/admin-schema";
import { eq, and, gt } from "drizzle-orm";
import { sendEmail } from "./email-service";

export class AdminAuthService {
  // Initialize admin user if none exists
  static async initializeDefaultAdmin() {
    try {
      const existingAdmin = await db.select().from(adminUsers).limit(1);
      
      if (existingAdmin.length === 0) {
        const defaultEmail = "admin@mypocketsister.com";
        const defaultPassword = process.env.ADMIN_SECRET || "admin123";
        const hashedPassword = await bcrypt.hash(defaultPassword, 12);
        
        await db.insert(adminUsers).values({
          email: defaultEmail,
          passwordHash: hashedPassword,
          isActive: true,
        });
        
        console.log(`✅ Default admin user created: ${defaultEmail}`);
        console.log(`🔑 Default password: ${defaultPassword}`);
        console.log("⚠️  Please change the password immediately after first login");
      }
    } catch (error) {
      console.error("❌ Failed to initialize default admin:", error);
    }
  }

  // Authenticate admin user
  static async authenticateAdmin(email: string, password: string, totpCode?: string) {
    try {
      const admin = await db.select().from(adminUsers)
        .where(and(eq(adminUsers.email, email), eq(adminUsers.isActive, true)))
        .limit(1);

      if (!admin.length) {
        await this.logAuditEvent(null, 'login_failed', `Failed login attempt for ${email}`, null, null, false);
        return { success: false, message: 'Invalid credentials' };
      }

      const adminUser = admin[0];
      const validPassword = await bcrypt.compare(password, adminUser.passwordHash);

      if (!validPassword) {
        await this.logAuditEvent(adminUser.id, 'login_failed', 'Invalid password', null, null, false);
        return { success: false, message: 'Invalid credentials' };
      }

      // Check 2FA if enabled
      if (adminUser.isTotpEnabled && adminUser.totpSecret) {
        if (!totpCode) {
          return { success: false, message: '2FA code required', requires2FA: true };
        }

        const validTotp = speakeasy.totp.verify({
          secret: adminUser.totpSecret,
          encoding: 'base32',
          token: totpCode,
          window: 2, // Allow 2 windows of variance
        });

        if (!validTotp) {
          await this.logAuditEvent(adminUser.id, 'login_failed', 'Invalid 2FA code', null, null, false);
          return { success: false, message: 'Invalid 2FA code' };
        }
      }

      // Generate secure session token
      const sessionToken = crypto.randomBytes(64).toString('hex');
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      await db.insert(adminSessions).values({
        id: crypto.randomUUID(),
        adminId: adminUser.id,
        token: sessionToken,
        expiresAt,
      });

      // Update last login
      await db.update(adminUsers)
        .set({ lastLogin: new Date() })
        .where(eq(adminUsers.id, adminUser.id));

      await this.logAuditEvent(adminUser.id, 'login_success', 'Successful login', null, null, true);

      return { 
        success: true, 
        token: sessionToken,
        admin: {
          id: adminUser.id,
          email: adminUser.email,
          isTotpEnabled: adminUser.isTotpEnabled,
        }
      };
    } catch (error) {
      console.error('Admin authentication error:', error);
      return { success: false, message: 'Authentication error' };
    }
  }

  // Validate session token
  static async validateSession(token: string) {
    try {
      const session = await db.select({
        session: adminSessions,
        admin: adminUsers,
      })
      .from(adminSessions)
      .innerJoin(adminUsers, eq(adminSessions.adminId, adminUsers.id))
      .where(and(
        eq(adminSessions.sessionToken, token),
        gt(adminSessions.expiresAt, new Date()),
        eq(adminUsers.isActive, true)
      ))
      .limit(1);

      if (!session.length) {
        return null;
      }

      return session[0].admin;
    } catch (error) {
      console.error('Session validation error:', error);
      return null;
    }
  }

  // Generate password reset token
  static async generatePasswordReset(email: string) {
    try {
      const admin = await db.select().from(adminUsers)
        .where(eq(adminUsers.email, email))
        .limit(1);

      if (!admin.length) {
        // Don't reveal if email exists
        return { success: true, message: 'If that email exists, a reset link has been sent' };
      }

      const adminUser = admin[0];
      const resetToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await db.update(adminUsers).set({
        passwordResetToken: resetToken,
        passwordResetExpires: expiresAt
      }).where(eq(adminUsers.id, adminUser.id));


      // Send reset email
      const resetUrl = `${process.env.FRONTEND_URL || 'https://app.mypocketsister.com'}/admin-reset-password?token=${resetToken}`;
      
      await sendEmail({
        to: email,
        subject: 'Admin Password Reset - My Pocket Sister',
        html: `
          <h2>Password Reset Request</h2>
          <p>You have requested a password reset for your admin account.</p>
          <p><a href="${resetUrl}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Reset Password</a></p>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request this reset, please ignore this email.</p>
        `,
      });

      await this.logAuditEvent(adminUser.id, 'password_reset_requested', 'Password reset token generated', null, null, true);

      return { success: true, message: 'If that email exists, a reset link has been sent' };
    } catch (error) {
      console.error('Password reset generation error:', error);
      return { success: false, message: 'Failed to generate reset token' };
    }
  }

  // Reset password with token
  static async resetPassword(token: string, newPassword: string) {
    try {
      const resetRequest = await db.select()
        .from(adminPasswordResets)
        .where(and(
          eq(adminPasswordResets.token, token),
          eq(adminPasswordResets.used, false),
          gt(adminPasswordResets.expiresAt, new Date())
        ))
        .limit(1);

      if (!resetRequest.length) {
        return { success: false, message: 'Invalid or expired reset token' };
      }

      const reset = resetRequest[0];
      const hashedPassword = await bcrypt.hash(newPassword, 12);

      // Update password
      await db.update(adminUsers)
        .set({ 
          passwordHash: hashedPassword,
          updatedAt: new Date()
        })
        .where(eq(adminUsers.id, reset.adminId));

      // Mark reset as used
      await db.update(adminPasswordResets)
        .set({ used: true })
        .where(eq(adminPasswordResets.id, reset.id));

      // Invalidate all sessions for security
      await db.delete(adminSessions)
        .where(eq(adminSessions.adminId, reset.adminId));

      await this.logAuditEvent(reset.adminId, 'password_reset_completed', 'Password reset successfully', null, null, true);

      return { success: true, message: 'Password reset successfully' };
    } catch (error) {
      console.error('Password reset error:', error);
      return { success: false, message: 'Failed to reset password' };
    }
  }

  // Setup 2FA
  static async setup2FA(adminId: string) {
    try {
      const secret = speakeasy.generateSecret({
        name: 'My Pocket Sister Admin',
        length: 32,
      });

      await db.update(adminUsers)
        .set({ totpSecret: secret.base32 })
        .where(eq(adminUsers.id, adminId));

      return {
        success: true,
        secret: secret.base32,
        qrCode: secret.otpauth_url,
      };
    } catch (error) {
      console.error('2FA setup error:', error);
      return { success: false, message: 'Failed to setup 2FA' };
    }
  }

  // Enable 2FA
  static async enable2FA(adminId: string, totpCode: string) {
    try {
      const admin = await db.select().from(adminUsers)
        .where(eq(adminUsers.id, adminId))
        .limit(1);

      if (!admin.length || !admin[0].totpSecret) {
        return { success: false, message: '2FA not initialized' };
      }

      const validTotp = speakeasy.totp.verify({
        secret: admin[0].totpSecret,
        encoding: 'base32',
        token: totpCode,
        window: 2,
      });

      if (!validTotp) {
        return { success: false, message: 'Invalid TOTP code' };
      }

      await db.update(adminUsers)
        .set({ isTotpEnabled: true })
        .where(eq(adminUsers.id, adminId));

      await this.logAuditEvent(adminId, '2fa_enabled', '2FA enabled successfully', null, null, true);

      return { success: true, message: '2FA enabled successfully' };
    } catch (error) {
      console.error('2FA enable error:', error);
      return { success: false, message: 'Failed to enable 2FA' };
    }
  }

  // Logout (invalidate session)
  static async logout(token: string) {
    try {
      await db.delete(adminSessions)
        .where(eq(adminSessions.token, token));
      
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, message: 'Failed to logout' };
    }
  }

  // Log audit events
  static async logAuditEvent(
    adminId: string | null,
    action: string,
    details: string,
    ipAddress: string | null,
    userAgent: string | null,
    success: boolean
  ) {
    try {
      await db.insert(adminAuditLog).values({
        adminId,
        action,
        details,
        ipAddress,
        userAgent,
        success,
      });
    } catch (error) {
      console.error('Audit log error:', error);
    }
  }
}

// Middleware to protect admin routes
export const requireAdminAuth: RequestHandler = async (req: any, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '') || 
                  req.cookies?.adminToken;

    if (!token) {
      return res.status(401).json({ message: 'Admin authentication required' });
    }

    const admin = await AdminAuthService.validateSession(token);
    if (!admin) {
      return res.status(401).json({ message: 'Invalid or expired session' });
    }

    req.admin = admin;
    next();
  } catch (error) {
    console.error('Admin auth middleware error:', error);
    res.status(500).json({ message: 'Authentication error' });
  }
};