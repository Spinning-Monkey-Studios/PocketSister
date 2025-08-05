// Quick fix for the recursive build issue
const fs = require('fs');
const path = require('path');

// Fix App.tsx imports to use relative paths instead of @ aliases for build
const appPath = path.join(__dirname, 'client/src/App.tsx');
let appContent = fs.readFileSync(appPath, 'utf8');

// Replace @ imports with relative imports
appContent = appContent.replace(/import\s+{[^}]+}\s+from\s+"@\/hooks\/useAuth";/, 'import { useAuth } from "./hooks/useAuth";');
appContent = appContent.replace(/import\s+[^;]+\s+from\s+"@\/pages\/([^"]+)";/g, 'import $1 from "./pages/$1";');

fs.writeFileSync(appPath, appContent);
console.log('Fixed App.tsx imports for build');