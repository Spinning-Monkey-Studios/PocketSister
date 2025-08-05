
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./server/tests/setup.ts'],
    include: ['server/tests/**/*.test.ts'],
    exclude: ['node_modules', 'client'],
    testTimeout: 10000
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './server'),
      '@shared': path.resolve(__dirname, './shared')
    }
  }
});
