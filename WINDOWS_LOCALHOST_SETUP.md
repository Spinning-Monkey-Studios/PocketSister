# Windows 11 Localhost Setup Guide
*Complete setup guide for running My Pocket Sister on Windows 11*

## Prerequisites

### 1. Install Node.js
- Download Node.js 20.x LTS from [nodejs.org](https://nodejs.org/)
- Run the installer with default settings
- Verify installation: Open Command Prompt and run:
  ```cmd
  node --version
  npm --version
  ```

### 2. Install Git
- Download Git from [git-scm.com](https://git-scm.com/download/win)
- Install with default settings
- Verify: `git --version`

### 3. Install PostgreSQL
- Download PostgreSQL 15+ from [postgresql.org](https://www.postgresql.org/download/windows/)
- During installation:
  - Remember your superuser password
  - Default port: 5432
  - Create a database named `pocketsister_dev`

## Project Setup

### 1. Clone and Install Dependencies
```cmd
# Clone the repository
git clone <your-repo-url>
cd my-pocket-sister

# Install dependencies
npm install
```

### 2. Environment Configuration
Create a `.env` file in the root directory:

```env
# Database Configuration
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/pocketsister_dev
PGHOST=localhost
PGPORT=5432
PGUSER=postgres
PGPASSWORD=YOUR_PASSWORD
PGDATABASE=pocketsister_dev

# Stripe Configuration (from your Stripe dashboard)
STRIPE_SECRET_KEY=sk_test_...
VITE_STRIPE_PUBLIC_KEY=pk_test_...

# Stripe Product IDs (you'll set these up)
STRIPE_BASIC_PRICE_ID=price_...
STRIPE_PREMIUM_PRICE_ID=price_...
STRIPE_FAMILY_PRICE_ID=price_...

# Development Settings
NODE_ENV=development
PORT=5000

# Optional: AI Services (if you want full functionality)
GEMINI_API_KEY=your_gemini_key
OPENAI_API_KEY=your_openai_key
```

### 3. Database Setup
```cmd
# Push database schema
npm run db:push

# Optional: Seed test data
npm run db:seed
```

### 4. Start the Application
```cmd
# Start development server
npm run dev
```

The application will be available at:
- **Frontend**: http://localhost:5000
- **API**: http://localhost:5000/api
- **Markdown files**: http://localhost:5000/filename.md (e.g., http://localhost:5000/replit.md)

## Viewing Markdown Files

The application is configured to serve markdown files properly:

### Supported Routes:
- `http://localhost:5000/replit.md` - Project documentation
- `http://localhost:5000/WINDOWS_LOCALHOST_SETUP.md` - This setup guide
- `http://localhost:5000/STRIPE_CONFIGURATION.md` - Stripe setup guide
- `http://localhost:5000/AI_ASSISTANT_GUIDE.md` - AI assistant reference

### Browser Display:
- Files are served with proper `text/plain; charset=utf-8` headers
- Most browsers will display markdown as formatted text
- For better viewing, use browser extensions like "Markdown Viewer"

## Database Management

### Connect to PostgreSQL:
```cmd
# Using psql command line
psql -U postgres -d pocketsister_dev

# Common commands:
\dt              # List tables
\d table_name    # Describe table structure
SELECT * FROM users LIMIT 5;  # View sample data
\q               # Quit
```

### Reset Database (if needed):
```cmd
# Drop all tables and recreate
npm run db:drop
npm run db:push
```

## Troubleshooting

### Port 5000 Already in Use:
```cmd
# Find process using port 5000
netstat -ano | findstr :5000

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F

# Or change port in .env file:
PORT=3000
```

### Database Connection Issues:
1. Verify PostgreSQL is running:
   - Open Services (`services.msc`)
   - Look for "postgresql-x64-15" service
   - Ensure it's "Running"

2. Test connection:
   ```cmd
   psql -U postgres -h localhost -p 5432 -d pocketsister_dev
   ```

3. Check firewall settings (if needed)

### Node.js Module Issues:
```cmd
# Clear npm cache and reinstall
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

## Development Workflow

### Making Changes:
1. Edit files - hot reload is enabled
2. Database changes: Run `npm run db:push`
3. New dependencies: `npm install package-name`

### Testing Features:
- Create test user accounts through the signup flow
- Use Stripe test mode for payment testing
- Check browser console for any JavaScript errors
- Monitor server logs in your terminal

### Building for Production:
```cmd
npm run build
```

## Next Steps

1. Set up Stripe products (see STRIPE_CONFIGURATION.md)
2. Configure AI API keys for full functionality
3. Test all subscription tiers and features
4. Set up email service for notifications (optional)

## Common File Locations

- **Client code**: `./client/`
- **Server code**: `./server/`
- **Database schema**: `./shared/schema.ts`
- **Environment variables**: `./.env`
- **Build output**: `./dist/`

Your My Pocket Sister application should now be running locally on Windows 11!