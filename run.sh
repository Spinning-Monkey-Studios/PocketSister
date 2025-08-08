#!/bin/bash

echo "🚀 Production Deployment Script"
echo "🚀 Building application..."

# Build the application
npm run build

echo "🚀 Starting production server..."

# Start the production server
NODE_ENV=production REPLIT_DEPLOYMENT=1 node dist/index.js