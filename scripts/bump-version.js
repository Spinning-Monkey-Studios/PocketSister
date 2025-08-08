#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const versionPath = path.join(__dirname, '../version.json');

try {
  let versionData = {
    version: '1.0.0',
    build: 1,
    timestamp: new Date().toISOString(),
    description: 'Initial version'
  };

  if (fs.existsSync(versionPath)) {
    versionData = JSON.parse(fs.readFileSync(versionPath, 'utf8'));
  }

  // Increment build number
  versionData.build += 1;
  versionData.timestamp = new Date().toISOString();
  versionData.description = process.argv[2] || `Build ${versionData.build}`;

  fs.writeFileSync(versionPath, JSON.stringify(versionData, null, 2));
  
  console.log(`Version bumped to build ${versionData.build}`);
  console.log(`Description: ${versionData.description}`);
  
} catch (error) {
  console.error('Error bumping version:', error);
  process.exit(1);
}