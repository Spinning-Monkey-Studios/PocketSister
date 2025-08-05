#!/usr/bin/env node
import { execSync } from 'child_process';
import { build as esbuild } from 'esbuild';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 Starting full application build...\n');

// Ensure dist directory exists
const distDir = resolve(__dirname, 'dist');
if (fs.existsSync(distDir)) {
  console.log('🧹 Cleaning existing dist directory...');
  fs.rmSync(distDir, { recursive: true, force: true });
}
fs.mkdirSync(distDir, { recursive: true });

try {
  // Build client first
  console.log('📦 Building client application...');
  execSync('cd client && npm run build', { stdio: 'inherit' });
  console.log('✅ Client build completed!\n');

  // Build server
  console.log('🔧 Building server application...');
  await esbuild({
    entryPoints: [resolve(__dirname, 'server/index.ts')],
    bundle: true,
    platform: 'node',
    target: 'node18',
    format: 'esm',
    outfile: resolve(__dirname, 'dist/index.js'),
    external: [
      // Core Node.js modules and native dependencies
      '@neondatabase/serverless',
      'sharp',
      'ws',
      'bufferutil',
      'utf-8-validate',
      'bcrypt',
      'pg-native',
      
      // Database ORM
      'drizzle-orm',
      'drizzle-kit',
      
      // Build tools and dev dependencies (should not be in server bundle)
      'vite',
      '@vitejs/plugin-react',
      '@replit/vite-plugin-cartographer',
      '@replit/vite-plugin-runtime-error-modal',
      'lightningcss',
      'autoprefixer',
      'postcss',
      'tailwindcss',
      '@tailwindcss/vite',
      '@tailwindcss/typography',
      
      // Babel and TypeScript
      '@babel/preset-typescript',
      '@babel/core',
      'typescript',
      'tsx',
      
      // Testing
      'vitest',
      '@vitest/ui',
      
      // Esbuild
      'esbuild'
    ],
    // No banner needed for CommonJS
    banner: undefined,
    loader: {
      '.node': 'file'
    },
    define: {
      'process.env.NODE_ENV': '"production"'
    },
    // Enable minification for production builds
    minify: true,
    sourcemap: true,
    metafile: true,
    resolveExtensions: ['.ts', '.js', '.json'],
    tsconfig: resolve(__dirname, 'tsconfig.server.json'),
    // Tree shaking for smaller bundle
    treeShaking: true,
    // Ensure proper module handling
    keepNames: true,
    // Properly handle Node.js built-ins and avoid require() issues
    packages: 'external',
    // Inject shims for Node.js globals in ESM
    inject: [],
    // Maintain ES modules compatibility
    mainFields: ['module', 'main'],
    conditions: ['import', 'module', 'default']
  });
  
  console.log('✅ Server build completed!\n');
  
  // Verify build outputs
  console.log('🔍 Verifying build outputs...');
  const serverExists = fs.existsSync(resolve(__dirname, 'dist/index.js'));
  const clientExists = fs.existsSync(resolve(__dirname, 'dist/public/index.html'));
  
  if (serverExists && clientExists) {
    console.log('✅ Build verification successful!');
    console.log('📁 Server output: dist/index.js');
    console.log('📁 Client output: dist/public/');
    console.log('\n🎉 Full application build completed successfully!');
    console.log('\n💡 To start the production server, run: npm start');
  } else {
    throw new Error('Build verification failed - missing expected output files');
  }
  
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}