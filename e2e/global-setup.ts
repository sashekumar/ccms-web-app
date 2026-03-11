import { FullConfig } from '@playwright/test';
import { DatabaseHelper } from './helpers/database.helper';
import { ACLIntegrityValidator } from './helpers/acl-integrity-validator';

/**
 * Global Setup - Runs once before all tests
 * 
 * Responsibilities:
 * - Initialize test database
 * - Seed initial data
 * - Verify backend/frontend are running
 * - Capture ACL system baseline (to verify tests don't corrupt permissions)
 * 
 * Following coding-standards.md principles:
 * - COMMONIZATION: Setup logic in one place
 * - REUSABILITY: Shared database helper
 */

async function globalSetup(config: FullConfig): Promise<void> {
  console.log('\n🚀 Starting E2E Test Environment Setup...\n');

  try {
    // 1. Initialize database connection
    console.log('📊 Connecting to test database...');
    await DatabaseHelper.initialize();
    console.log('✅ Database connection established');

    // 1.5. Capture ACL system baseline BEFORE tests
    console.log('🔒 Capturing ACL system baseline...');
    try {
      const pool = (DatabaseHelper as any).pool;
      const aclSnapshot = await ACLIntegrityValidator.captureSnapshot(pool);
      ACLIntegrityValidator.printSnapshot('ACL System Baseline (Before Tests)', aclSnapshot);
      
      // Store snapshot globally for teardown validation
      (global as any).__ACL_BASELINE_SNAPSHOT__ = aclSnapshot;
      console.log('✅ ACL baseline captured');
    } catch (error) {
      console.warn('⚠️  Could not capture ACL baseline (tests will continue):', error);
    }

    // 2. Clean existing test data
    console.log('🧹 Cleaning existing test data...');
    await DatabaseHelper.cleanupAllTestData();
    console.log('✅ Test data cleaned');

    // 3. Seed initial data (users, roles, permissions)
    console.log('🌱 Seeding initial test data...');
    await DatabaseHelper.seedInitialData();
    console.log('✅ Initial data seeded');

    // 4. Verify backend is running
    console.log('🔍 Verifying backend API...');
    const apiUrl = process.env.API_URL || 'http://localhost:3000';
    const healthCheck = await fetch(`${apiUrl}/api/health`).catch(() => null);
    
    if (!healthCheck || !healthCheck.ok) {
      console.warn('⚠️  Backend API not responding. Waiting for webServer to start...');
    } else {
      console.log('✅ Backend API is running');
    }

    // 5. Verify frontend is running
    console.log('🔍 Verifying frontend...');
    const baseUrl = process.env.BASE_URL || 'http://localhost:4200';
    const frontendCheck = await fetch(baseUrl).catch(() => null);
    
    if (!frontendCheck || !frontendCheck.ok) {
      console.warn('⚠️  Frontend not responding. Waiting for webServer to start...');
    } else {
      console.log('✅ Frontend is running');
    }

    console.log('\n✅ E2E Test Environment Ready!\n');
  } catch (error) {
    console.error('\n❌ Global Setup Failed:', error);
    throw error;
  }
}

export default globalSetup;
