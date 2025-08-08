import express from 'express';

const app = express();

// Ultra-minimal server for production debugging
app.get('/api/production-debug', (req, res) => {
  console.log('Production debug endpoint hit successfully!');
  res.json({
    status: 'success',
    message: 'Production server is running',
    timestamp: new Date().toISOString(),
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      REPLIT_DEPLOYMENT: process.env.REPLIT_DEPLOYMENT,
      REPL_SLUG: process.env.REPL_SLUG,
      DATABASE_URL_EXISTS: !!process.env.DATABASE_URL,
      SESSION_SECRET_EXISTS: !!process.env.SESSION_SECRET,
    }
  });
});

app.get('/api/simple-health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

const port = parseInt(process.env.PORT || '5000', 10);
app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Simple debug server running on port ${port}`);
});