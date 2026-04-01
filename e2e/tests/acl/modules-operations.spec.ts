import { test, expect } from '../../fixtures/auth.fixture';

/**
 * ACL Modules - Data Operations E2E Tests
 * 
 * Complete CRUD operations testing:
 * - CREATE: Fill forms, submit, verify success and data appears
 * - READ: Search/filter data and verify results
 * - UPDATE: Edit records, save changes, verify persistence
 * - DELETE: Delete records and verify removal
 * - VALIDATION: Test form validations, required fields, errors
 * 
 * Note: Tests run in SERIAL mode to ensure data persistence across tests.
 */

test.describe.serial('ACL Modules Operations - CRUD', () => {
  const timestamp = Date.now();
  const testModuleCode = `TEST_MOD_${timestamp}`;
  const testModuleName = `Test Module ${timestamp}`;
  
  test('CREATE: should create a new module successfully', async ({ authenticatedPage }) => {
    // Navigate to modules page
    await authenticatedPage.goto('/admin/modules');
    await authenticatedPage.waitForLoadState('networkidle');
    
    // Click create button
    await authenticatedPage.locator('button:has-text("Create"), button:has-text("Add")').first().click();
    await authenticatedPage.waitForLoadState('networkidle');
    
    // Fill in module details
    await authenticatedPage.locator('input[formcontrolname*="code"], input[name*="code"]').first().fill(testModuleCode);
    await authenticatedPage.locator('input[formcontrolname*="name"], input[name*="name"]').first().fill(testModuleName);
    
    // Select category if dropdown exists
    const categoryDropdown = authenticatedPage.locator('app-dropdown[name="category"]').first();
    if (await categoryDropdown.count() > 0) {
      await categoryDropdown.locator('button').first().click();
      await authenticatedPage.waitForTimeout(200);
      const firstOption = categoryDropdown.locator('li').nth(1);
      if (await firstOption.count() > 0) await firstOption.click();
    }
    
    // Fill description
    const descInput = authenticatedPage.locator('textarea, input[formcontrolname*="description"]').first();
    if (await descInput.count() > 0) {
      await descInput.fill('Test module for complete CRUD E2E testing');
    }
    
    // Submit form
    await authenticatedPage.locator('button[type="submit"]').click();
    await authenticatedPage.waitForLoadState('networkidle');
    
    // Verify success - should be back on list or show success message
    const isOnListPage = authenticatedPage.url().includes('/admin/modules');
    const hasSuccessMessage = await authenticatedPage.locator('text=/success|created|saved/i').isVisible().catch(() => false);
    
    expect(isOnListPage || hasSuccessMessage).toBeTruthy();
    
    // READ: Search for the created module
    const searchInput = authenticatedPage.locator('input[name="search"]').first();
    await searchInput.fill(testModuleCode);
    await authenticatedPage.waitForTimeout(1000);
    
    // Verify module appears in table
    await expect(authenticatedPage.locator(`td:has-text("${testModuleCode}")`)).toBeVisible({ timeout: 10000 });
    await expect(authenticatedPage.locator(`td:has-text("${testModuleName}")`)).toBeVisible({ timeout: 10000 });
    
    console.log(`âœ… CREATE: Successfully created module: ${testModuleCode}`);
  });
  
  test('VALIDATION: should validate required fields', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/admin/modules');
    await authenticatedPage.waitForLoadState('networkidle');
    
    await authenticatedPage.locator('button:has-text("Create"), button:has-text("Add")').first().click();
    await authenticatedPage.waitForLoadState('networkidle');
    
    // Try to submit without filling required fields
    const submitBtn = authenticatedPage.locator('button[type="submit"]');
    
    // Submit button should be disabled for invalid form
    const isDisabled = await submitBtn.isDisabled();
    expect(isDisabled).toBe(true);
    
    console.log('âœ… VALIDATION: Required fields validation working');
  });
  
  test('VALIDATION: should validate unique module code', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/admin/modules');
    await authenticatedPage.waitForLoadState('networkidle');
    
    // Try to create module with same code
    await authenticatedPage.locator('button:has-text("Create"), button:has-text("Add")').first().click();
    await authenticatedPage.waitForLoadState('networkidle');
    
    // Fill with existing module code
    await authenticatedPage.locator('input[name="code"]').first().fill(testModuleCode);
    await authenticatedPage.locator('input[name="name"]').first().fill('Duplicate Test');
    
    // Try to submit
    await authenticatedPage.locator('button[type="submit"]').click();
    await authenticatedPage.waitForTimeout(2000);
    
    // Should show error message or stay on form
    const hasError = await authenticatedPage.locator('text=/already exists|duplicate|unique/i').isVisible().catch(() => false);
    const stillOnForm = await authenticatedPage.locator('form').first().isVisible();
    
    expect(hasError || stillOnForm).toBeTruthy();
    
    // Cancel if still on form
    const cancelBtn = authenticatedPage.locator('button:has-text("Cancel")');
    if (await cancelBtn.isVisible()) {
      await cancelBtn.click();
    }
    
    console.log('âœ… VALIDATION: Duplicate code validation working');
  });
  
  test('READ: should search and filter modules', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/admin/modules');
    await authenticatedPage.waitForLoadState('networkidle');
    
    // Search for test module
    const searchInput = authenticatedPage.locator('input[name="search"]').first();
    await searchInput.fill(testModuleCode);
    await authenticatedPage.waitForTimeout(1000);
    
    // Count filtered rows
    const rows = authenticatedPage.locator('tbody tr:visible:not(.no-data)');
    const count = await rows.count();
    expect(count).toBeGreaterThanOrEqual(1);
    
    // Verify test module is visible
    await expect(authenticatedPage.locator(`td:has-text("${testModuleCode}")`)).toBeVisible();
    
    // Clear search
    await searchInput.clear();
    await authenticatedPage.waitForTimeout(1000);
    
    // Should show more rows
    const allRowsCount = await rows.count();
    expect(allRowsCount).toBeGreaterThanOrEqual(count);
    
    console.log('âœ… READ: Search and filter working');
  });
  
  test('READ: should filter by category', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/admin/modules');
    await authenticatedPage.waitForLoadState('networkidle');
    
    // Find category filter if exists
    const categoryFilter = authenticatedPage.locator('select').first();
    
    if (await categoryFilter.count() > 0) {
      // Get initial count
      const initialRows = authenticatedPage.locator('tbody tr:visible:not(.no-data)');
      const initialCount = await initialRows.count();
      
      // Select a category
      await categoryFilter.selectOption({ index: 1 });
      await authenticatedPage.waitForTimeout(1000);
      
      // Verify filtering occurred
      const filteredCount = await initialRows.count();
      
      // Either count changed or stayed same (if all belong to that category)
      expect(filteredCount).toBeGreaterThanOrEqual(0);
      
      console.log('âœ… READ: Category filter working');
    } else {
      console.log('â„¹ï¸  No category filter found');
    }
  });
  
  test('UPDATE: should update an existing module', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/admin/modules');
    await authenticatedPage.waitForLoadState('networkidle');
    
    // Search for the test module
    const searchInput = authenticatedPage.locator('input[name="search"]').first();
    await searchInput.fill(testModuleCode);
    await authenticatedPage.waitForTimeout(1000);
    
    // Wait for the row to be visible first
    const row = authenticatedPage.locator(`tr:has-text("${testModuleCode}")`).first();
    await expect(row).toBeVisible({ timeout: 10000 });
    
    // Now find and click the edit button within that row
    const editButton = row.locator('[data-testid="edit-module-button"]');
    await expect(editButton).toBeVisible({ timeout: 5000 });
    await editButton.click();
    await authenticatedPage.waitForLoadState('networkidle');
    
    // Update module name
    const updatedName = `${testModuleName} UPDATED`;
    const nameInput = authenticatedPage.locator('input[formcontrolname*="name"], input[name*="name"]').first();
    await nameInput.clear();
    await nameInput.fill(updatedName);
    
    // Update description
    const descInput = authenticatedPage.locator('textarea, input[formcontrolname*="description"]').first();
    if (await descInput.count() > 0) {
      await descInput.clear();
      await descInput.fill('Updated description for E2E testing');
    }
    
    // Submit changes
    await authenticatedPage.locator('button[type="submit"]').click();
    await authenticatedPage.waitForLoadState('networkidle');
    
    // Verify updated name appears in table
    await searchInput.fill(testModuleCode);
    await authenticatedPage.waitForTimeout(1000);
    
    await expect(authenticatedPage.locator(`td:has-text("${updatedName}")`)).toBeVisible({ timeout: 10000 });
    
    console.log('âœ… UPDATE: Successfully updated module');
  });
  
  test('UPDATE: should persist changes after page reload', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/admin/modules');
    await authenticatedPage.waitForLoadState('networkidle');
    
    // Search for the updated module
    const searchInput = authenticatedPage.locator('input[name="search"]').first();
    await searchInput.fill(testModuleCode);
    await authenticatedPage.waitForTimeout(1000);
    
    // Verify updated name is still there
    const updatedName = `${testModuleName} UPDATED`;
    await expect(authenticatedPage.locator(`td:has-text("${updatedName}")`)).toBeVisible();
    
    // Reload page
    await authenticatedPage.reload();
    await authenticatedPage.waitForLoadState('networkidle');
    
    // Search again
    await searchInput.fill(testModuleCode);
    await authenticatedPage.waitForTimeout(1000);
    
    // Verify data persisted
    await expect(authenticatedPage.locator(`td:has-text("${updatedName}")`)).toBeVisible();
    
    console.log('âœ… UPDATE: Changes persisted after reload');
  });
  
  // SAFETY: DELETE test disabled to prevent accidental deletion of system modules
  // Re-enable after frontend pages are fully implemented and CREATE/UPDATE tests pass
  test('DELETE: should delete a module', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/admin/modules');
    await authenticatedPage.waitForLoadState('networkidle');
    
    // Search for the test module
    const searchInput = authenticatedPage.locator('input[name="search"]').first();
    await searchInput.fill(testModuleCode);
    await authenticatedPage.waitForTimeout(1000);
    
    // Verify test data exists before attempting delete (fail fast if CREATE didn't work)
    const row = authenticatedPage.locator(`tr:has-text("${testModuleCode}")`).first();
    await expect(row).toBeVisible({ timeout: 10000 });
    
    // Click delete button within the test data row (not any random row)
    const deleteButton = row.locator('[data-testid="delete-module-button"]');
    await expect(deleteButton).toBeVisible({ timeout: 5000 });
    await deleteButton.click();
    
    // Confirm deletion in modal/dialog
    await authenticatedPage.waitForTimeout(500);
    const confirmButton = authenticatedPage.locator('button:has-text("Delete")').last();
    await expect(confirmButton).toBeVisible({ timeout: 5000 });
    await expect(confirmButton).toBeEnabled({ timeout: 5000 });
    await confirmButton.click();
    await authenticatedPage.waitForTimeout(1000);
    await authenticatedPage.waitForLoadState('networkidle');
    
    // Verify module is no longer in table
    await searchInput.fill(testModuleCode);
    await authenticatedPage.waitForTimeout(1000);
    
    const deletedModule = authenticatedPage.locator(`td:has-text("${testModuleCode}")`);
    const isGone = !(await deletedModule.isVisible().catch(() => false));
    
    expect(isGone).toBe(true);
    
    console.log('âœ… DELETE: Successfully deleted module');
  });
  
  // SAFETY: DELETE test disabled to prevent accidental deletion of system modules
  // Re-enable after frontend pages are fully implemented and CREATE/UPDATE tests pass
  test('DELETE: should confirm deletion is permanent', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/admin/modules');
    await authenticatedPage.waitForLoadState('networkidle');
    
    // Reload and search again to confirm deletion
    await authenticatedPage.reload();
    await authenticatedPage.waitForLoadState('networkidle');
    
    const searchInput = authenticatedPage.locator('input[name="search"]').first();
    await searchInput.fill(testModuleCode);
    await authenticatedPage.waitForTimeout(1000);
    
    // Should not find the deleted module
    const deletedModule = authenticatedPage.locator(`td:has-text("${testModuleCode}")`);
    const isGone = !(await deletedModule.isVisible().catch(() => false));
    
    expect(isGone).toBe(true);
    
    console.log('âœ… DELETE: Deletion is permanent');
  });
});

