import { FullConfig } from '@playwright/test';
import { DatabaseHelper } from './helpers/database.helper';
import { ACLIntegrityValidator, ACLIntegritySnapshot } from './helpers/acl-integrity-validator';

/**
 * Global Teardown - Runs once after all tests
 * 
 * Responsibilities:
 * - Validate ACL system integrity (ensure tests didn't corrupt permissions)
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
    // 0. Validate ACL system integrity BEFORE cleanup
    console.log('🔒 Validating ACL system integrity...');
    try {
      const pool = (DatabaseHelper as any).pool;
      
      if (pool) {
        const afterSnapshot = await ACLIntegrityValidator.captureSnapshot(pool);
        ACLIntegrityValidator.printSnapshot('ACL System State (After Tests)', afterSnapshot);
        
        const beforeSnapshot = (global as any).__ACL_BASELINE_SNAPSHOT__ as ACLIntegritySnapshot;
        
        if (beforeSnapshot) {
          const validation = ACLIntegrityValidator.validateSnapshots(beforeSnapshot, afterSnapshot);
          
          if (validation.isValid) {
            console.log('✅ ACL system integrity VERIFIED - No corruption detected');
          } else {
            console.error('\n⚠️  ❌ ACL SYSTEM CORRUPTION DETECTED! ❌\n');
            validation.errors.forEach(error => console.error(`   ${error}`));
            console.error('\n   E2E tests may have accidentally modified ACL system tables!');
            console.error('   Check e2e/helpers/database.helper.ts cleanup methods.\n');
          }
        }
      }
    } catch (error) {
      console.warn('⚠️  Could not validate ACL integrity:', error);
    }
    console.log('');

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
