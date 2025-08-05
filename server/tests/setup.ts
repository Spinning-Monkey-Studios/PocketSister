
import { beforeAll, afterAll } from 'vitest';
import { storage } from '../storage';

beforeAll(async () => {
  // Initialize test database/storage
  console.log('Setting up test environment...');
  
  // Ensure test mode is enabled
  process.env.NODE_ENV = 'test';
  process.env.ENABLE_TEST_MODE = 'true';
  
  // Initialize any required tables/schemas for testing
  try {
    await storage.initializePricingPlans();
  } catch (error) {
    console.log('Test setup note:', (error as Error).message);
  }
});

afterAll(async () => {
  console.log('Cleaning up test environment...');
  // Any global cleanup
});
