import { FullConfig } from '@playwright/test';
import { DatabaseHelper } from './helpers/database.helper';

/**
 * Global Teardown - Runs once after all tests
 * 
 * Responsibilities:
 * - Clean up test data
 * - Close database connections
 * - Generate test summary
 * 
 * Following coding-standards.md principles:
 * - COMMONIZATION: Cleanup logic in one place
 * - REUSABILITY: Shared database helper
 */

async function globalTeardown(config: FullConfig): Promise<void> {
  console.log('\n🧹 Starting E2E Test Environment Cleanup...\n');

  try {
    // 1. Clean up test data
    console.log('🗑️  Cleaning up test data...');
    await DatabaseHelper.cleanupAllTestData();
    console.log('✅ Test data cleaned');

    // 2. Close database connection
    console.log('📊 Closing database connections...');
    await DatabaseHelper.close();
    console.log('✅ Database connections closed');

    console.log('\n✅ E2E Test Environment Cleanup Complete!\n');
  } catch (error) {
    console.error('\n❌ Global Teardown Failed:', error);
    // Don't throw - allow tests to complete even if cleanup fails
  }
}

export default globalTeardown;
