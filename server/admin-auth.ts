import type { RequestHandler } from "express";
import bcrypt from "bcrypt";

// Admin Authentication Middleware
export const adminAuth: RequestHandler = async (req, res, next) => {
  const adminSecret = req.headers['x-admin-secret'] as string;
  
  if (!adminSecret) {
    return res.status(401).json({ message: 'Admin secret required' });
  }
  
  // Check against environment variable
  const expectedSecret = process.env.ADMIN_SECRET || 'admin123';
  
  if (adminSecret !== expectedSecret) {
    return res.status(403).json({ message: 'Invalid admin secret' });
  }
  
  next();
};

// Simple admin login endpoint
export const adminLogin: RequestHandler = async (req, res) => {
  try {
    const { secret } = req.body;
    
    console.log('Admin login attempt:', { secretProvided: !!secret, bodyReceived: !!req.body });
    
    if (!secret) {
      return res.status(400).json({ message: 'Admin secret required' });
    }
    
    const expectedSecret = process.env.ADMIN_SECRET || 'admin123';
    console.log('Comparing secrets:', { provided: secret, expected: expectedSecret });
    
    if (secret === expectedSecret) {
      // Generate a simple session token (in production, use JWT or proper session management)
      const sessionToken = Buffer.from(`admin-${Date.now()}`).toString('base64');
      
      res.json({
        success: true,
        token: sessionToken,
        message: 'Admin authenticated successfully'
      });
    } else {
      res.status(403).json({ message: 'Invalid admin secret' });
    }
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ message: 'Login error occurred' });
  }
};

// Check if user has admin privileges
export const isAdmin: RequestHandler = async (req: any, res, next) => {
  try {
    // First check if they have admin secret in headers
    const adminSecret = req.headers['x-admin-secret'] as string;
    const expectedSecret = process.env.ADMIN_SECRET || 'admin123';
    
    if (adminSecret === expectedSecret) {
      req.isAdmin = true;
      return next();
    }
    
    // Fallback: check if authenticated user is admin
    if (req.isAuthenticated && req.isAuthenticated()) {
      const user = req.user as any;
      if (user?.claims?.email && user.claims.email.includes('admin')) {
        req.isAdmin = true;
        return next();
      }
    }
    
    return res.status(403).json({ message: 'Admin access required' });
  } catch (error) {
    console.error('Admin check error:', error);
    res.status(500).json({ message: 'Admin authentication error' });
  }
};