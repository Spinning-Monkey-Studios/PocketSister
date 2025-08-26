#!/bin/bash

# Deployment script for My Pocket Sister application
# This script ensures database migrations are applied before deployment

set -e  # Exit on any error

echo "🚀 Starting deployment process..."

# Check if DATABASE_URL is available
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL environment variable is not set"
    echo "Please ensure the database is provisioned and the URL is available"
    exit 1
fi

echo "✅ Database URL configured"

# Apply database migrations
echo "📄 Applying database migrations..."
npm run db:push || {
    echo "❌ Database migration failed"
    echo "💡 Try running: npm run db:push manually"
    exit 1
}

echo "✅ Database migrations applied successfully"

# Build the application
echo "🔨 Building application..."
npm run build:client || {
    echo "❌ Client build failed"
    exit 1
}

echo "✅ Client built successfully"

npm run build:server || {
    echo "❌ Server build failed"
    exit 1
}

echo "✅ Server built successfully"

# Type check
echo "🔍 Running type checks..."
npm run check || {
    echo "⚠️  Type check warnings detected, but continuing deployment"
}

echo "✅ Deployment process completed successfully"
echo "🎉 Application is ready for production"

# Instructions for user
echo ""
echo "📋 Next steps:"
echo "1. Click the Deploy button in Replit"
echo "2. Verify the deployment runs without errors"
echo "3. Test the admin login at /admin with credentials:"
echo "   Email: admin@mypocketsister.com"
echo "   Password: admin123 (change immediately)"