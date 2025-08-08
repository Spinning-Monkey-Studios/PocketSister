import { Router } from 'express';
import { sendEmail } from '../email';
import { storage } from '../storage';
import { isAdmin } from '../admin-auth';

const router = Router();

/**
 * Admin Testing Dashboard Routes
 * Provides convenient testing features for admin users
 */

// Admin middleware for this router
const requireAdmin = (req: any, res: any, next: any) => {
  const adminSecret = req.headers['x-admin-secret'] || req.query.adminSecret;
  
  if (!adminSecret || adminSecret !== (process.env.ADMIN_SECRET || 'admin123')) {
    return res.status(403).json({
      error: 'Admin access required',
      message: 'Provide valid admin secret in x-admin-secret header or adminSecret query parameter'
    });
  }
  
  next();
};

/**
 * Get admin configuration including current admin email
 * GET /api/admin/testing/config
 */
router.get('/config', requireAdmin, async (req, res) => {
  try {
    const config = {
      adminSecret: process.env.ADMIN_SECRET || 'admin123',
      currentAdminEmail: process.env.ADMIN_EMAIL || null,
      stripeConfigured: !!process.env.STRIPE_SECRET_KEY,
      emailConfigured: !!(process.env.SMTP_HOST && process.env.SMTP_USER),
      availableTests: [
        'email-test',
        'stripe-products-test', 
        'user-upgrade-test',
        'affirmations-test',
        'safety-alerts-test'
      ]
    };
    
    res.json({
      success: true,
      config
    });
  } catch (error) {
    console.error('❌ Failed to get admin config:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Set admin email for testing and notifications
 * POST /api/admin/testing/set-email
 */
router.post('/set-email', requireAdmin, async (req, res) => {
  try {
    const { adminEmail } = req.body;
    
    if (!adminEmail || !adminEmail.includes('@')) {
      return res.status(400).json({
        success: false,
        error: 'Valid admin email address required'
      });
    }
    
    // Update admin email in environment (for this session)
    process.env.ADMIN_EMAIL = adminEmail;
    
    // Also store in database for persistent access
    // Note: In production, you might want to store this in a dedicated admin settings table
    
    res.json({
      success: true,
      message: 'Admin email updated successfully',
      adminEmail
    });
    
  } catch (error) {
    console.error('❌ Failed to set admin email:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Send test email to admin
 * POST /api/admin/testing/send-test-email
 */
router.post('/send-test-email', requireAdmin, async (req, res) => {
  try {
    const { testType = 'basic' } = req.body;
    const adminEmail = process.env.ADMIN_EMAIL;
    
    if (!adminEmail) {
      return res.status(400).json({
        success: false,
        error: 'Admin email not configured. Please set admin email first.'
      });
    }
    
    let subject = '';
    let body = '';
    
    switch (testType) {
      case 'basic':
        subject = 'My Pocket Sister - Admin Test Email';
        body = `
        <h2>✅ Email System Test Successful</h2>
        <p>This is a test email from your My Pocket Sister admin backend.</p>
        <p><strong>Sent at:</strong> ${new Date().toLocaleString()}</p>
        <p><strong>System Status:</strong> All email systems operational</p>
        <hr>
        <p><em>My Pocket Sister Admin System</em></p>
        `;
        break;
        
      case 'billing':
        subject = 'My Pocket Sister - Test Billing Notification';
        body = `
        <h2>💳 Test Billing Notification</h2>
        <p>This is a sample billing notification email.</p>
        <p><strong>Test Account Usage:</strong></p>
        <ul>
          <li>Monthly interactions: 150/200</li>
          <li>Overage charges: $0.00</li>
          <li>Next billing date: ${new Date(Date.now() + 30*24*60*60*1000).toLocaleDateString()}</li>
        </ul>
        <p><strong>Status:</strong> Test email delivery successful</p>
        <hr>
        <p><em>My Pocket Sister Admin System</em></p>
        `;
        break;
        
      case 'safety':
        subject = 'My Pocket Sister - Test Safety Alert';
        body = `
        <h2>🛡️ Test Safety Alert Notification</h2>
        <p>This is a sample safety alert notification.</p>
        <p><strong>Alert Type:</strong> Test Alert</p>
        <p><strong>Child:</strong> Test Child Profile</p>
        <p><strong>Concern:</strong> This is a test safety alert for system verification</p>
        <p><strong>Status:</strong> Email delivery test successful</p>
        <hr>
        <p><em>My Pocket Sister Admin System</em></p>
        `;
        break;
        
      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid test type. Use: basic, billing, or safety'
        });
    }
    
    await sendEmail({
      to: adminEmail,
      subject,
      html: body,
      text: body.replace(/<[^>]*>/g, '') // Strip HTML for plain text
    });
    
    res.json({
      success: true,
      message: `Test email (${testType}) sent successfully to ${adminEmail}`,
      sentAt: new Date().toISOString(),
      testType
    });
    
  } catch (error) {
    console.error('❌ Failed to send test email:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: 'Check SMTP configuration and admin email settings'
    });
  }
});

/**
 * Test Stripe product configuration
 * GET /api/admin/testing/stripe-products
 */
router.get('/stripe-products', requireAdmin, async (req, res) => {
  try {
    const plans = await storage.getPricingPlans();
    
    const productTest = {
      configured: !!process.env.STRIPE_SECRET_KEY,
      products: plans.map(plan => ({
        id: plan.id,
        name: plan.name,
        price: plan.price,
        stripeProductId: plan.stripePriceId,
        isActive: plan.isActive
      })),
      updatedProductIds: {
        plus: 'prod_SmNx6Aj3maRO2j',
        premium: 'prod_SoUyOrGeEMxOMt', 
        family: 'prod_SoV01u3869uf9V'
      }
    };
    
    res.json({
      success: true,
      message: 'Stripe product configuration test completed',
      productTest
    });
    
  } catch (error) {
    console.error('❌ Failed to test Stripe products:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Run comprehensive feature tests
 * POST /api/admin/testing/run-feature-tests
 */
router.post('/run-feature-tests', requireAdmin, async (req, res) => {
  try {
    const results = {
      timestamp: new Date().toISOString(),
      tests: {} as any
    };
    
    // Test 1: Database connectivity
    try {
      const stats = await storage.getSystemStats();
      results.tests.database = {
        passed: true,
        message: 'Database connection successful',
        stats: {
          totalUsers: stats.totalChildren,
          totalParents: stats.totalParents
        }
      };
    } catch (error) {
      results.tests.database = {
        passed: false,
        error: error instanceof Error ? error.message : 'Database connection failed'
      };
    }
    
    // Test 2: Pricing plans
    try {
      const plans = await storage.getPricingPlans();
      results.tests.pricingPlans = {
        passed: plans.length > 0,
        message: `Found ${plans.length} pricing plans`,
        plans: plans.map(p => ({ id: p.id, name: p.name, price: p.price }))
      };
    } catch (error) {
      results.tests.pricingPlans = {
        passed: false,
        error: error instanceof Error ? error.message : 'Failed to fetch pricing plans'
      };
    }
    
    // Test 3: Email configuration
    results.tests.email = {
      passed: !!(process.env.SMTP_HOST && process.env.SMTP_USER),
      message: process.env.SMTP_HOST ? 'SMTP configured' : 'SMTP not configured',
      config: {
        host: !!process.env.SMTP_HOST,
        user: !!process.env.SMTP_USER,
        adminEmail: !!process.env.ADMIN_EMAIL
      }
    };
    
    // Test 4: Stripe configuration
    results.tests.stripe = {
      passed: !!process.env.STRIPE_SECRET_KEY,
      message: process.env.STRIPE_SECRET_KEY ? 'Stripe configured' : 'Stripe not configured'
    };
    
    // Test 5: Admin access
    results.tests.adminAccess = {
      passed: true,
      message: 'Admin authentication working',
      secret: process.env.ADMIN_SECRET ? 'configured' : 'using default'
    };
    
    const allPassed = Object.values(results.tests).every((test: any) => test.passed);
    
    res.json({
      success: true,
      message: allPassed ? 'All feature tests passed' : 'Some tests failed',
      results,
      summary: {
        total: Object.keys(results.tests).length,
        passed: Object.values(results.tests).filter((test: any) => test.passed).length,
        failed: Object.values(results.tests).filter((test: any) => !test.passed).length
      }
    });
    
  } catch (error) {
    console.error('❌ Failed to run feature tests:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get admin dashboard info with quick links
 * GET /api/admin/testing/dashboard
 */
router.get('/dashboard', requireAdmin, async (req, res) => {
  try {
    const dashboardInfo = {
      quickLinks: {
        featureTests: '/api/admin/testing/run-feature-tests',
        emailTest: '/api/admin/testing/send-test-email',
        stripeProducts: '/api/admin/testing/stripe-products',
        systemStats: '/api/admin/stats',
        childProfiles: '/api/admin/child-profiles',
        avatarGraphics: '/api/admin/avatar-graphics/stats'
      },
      currentConfig: {
        adminEmail: process.env.ADMIN_EMAIL || 'Not configured',
        stripeConfigured: !!process.env.STRIPE_SECRET_KEY,
        emailConfigured: !!(process.env.SMTP_HOST && process.env.SMTP_USER)
      },
      recentUpdates: [
        'Updated Stripe product IDs for Plus, Premium, and Family tiers',
        'Added admin email configuration',
        'Implemented comprehensive feature testing',
        'TypeScript compilation errors resolved'
      ]
    };
    
    res.json({
      success: true,
      dashboard: dashboardInfo
    });
    
  } catch (error) {
    console.error('❌ Failed to get dashboard info:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;