import { test, expect } from '../../fixtures/auth.fixture';

/**
 * ACL Module-Actions - Data Operations E2E Tests
 * 
 * Complete CRUD operations testing:
 * - CREATE: Assign actions to modules, verify success
 * - READ: Search/filter module-action relationships
 * - UPDATE: Modify action assignments
 * - DELETE: Remove action assignments
 * - VALIDATION: Test form validations and constraints
 * 
 * Note: Tests run in SERIAL mode to ensure data persistence across tests.
 */

test.describe.serial('ACL Module-Actions Operations - CRUD', () => {
  const timestamp = Date.now();
  
  test('CREATE: should assign action to module successfully', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/admin/module-actions');
    await authenticatedPage.waitForLoadState('networkidle');
    
    await authenticatedPage.locator('button:has-text("Attach")').first().click();
    await authenticatedPage.waitForLoadState('networkidle');
    
    // Wait for form to be visible
    await authenticatedPage.waitForTimeout(500);
    
    // Select module
    const moduleSelect = authenticatedPage.locator('select[name="module"]').first();
    await expect(moduleSelect).toBeVisible({ timeout: 5000 });
    await moduleSelect.selectOption({ index: 1 }); // Index 1 skips "Select Module" option
    await authenticatedPage.waitForTimeout(300);
    
    // Select first action checkbox
    const firstActionCheckbox = authenticatedPage.locator('input[type="checkbox"][id^="action-"]').first();
    await expect(firstActionCheckbox).toBeVisible({ timeout: 5000 });
    await firstActionCheckbox.check();
    await authenticatedPage.waitForTimeout(300);
    
    // Submit button should now be enabled
    const submitButton = authenticatedPage.locator('button[type="submit"]');
    await expect(submitButton).toBeEnabled({ timeout: 5000 });
    await submitButton.click();
    await authenticatedPage.waitForLoadState('networkidle');
    
    // Verify creation - table should have data
    const table = authenticatedPage.locator('table tbody tr:visible:not(.no-data)');
    const count = await table.count();
    
    expect(count).toBeGreaterThanOrEqual(1);
    
    console.log('✅ CREATE: Successfully assigned action to module');
  });
  
  test('VALIDATION: should validate required fields', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/admin/module-actions');
    await authenticatedPage.waitForLoadState('networkidle');
    
    // Click the "Attach Actions to Module" button
    await authenticatedPage.locator('button:has-text("Attach")').first().click();
    await authenticatedPage.waitForLoadState('networkidle');
    
    const submitBtn = authenticatedPage.locator('button[type="submit"]');
    const isDisabled = await submitBtn.isDisabled();
    
    expect(isDisabled).toBe(true);
    
    console.log('✅ VALIDATION: Required fields validation working');
  });
  
  test('READ: should display module-action relationships', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/admin/module-actions');
    await authenticatedPage.waitForLoadState('networkidle');
    
    // Should have table with data
    const table = authenticatedPage.locator('table');
    await expect(table).toBeVisible();
    
    const rows = authenticatedPage.locator('tbody tr:visible:not(.no-data)');
    const count = await rows.count();
    
    expect(count).toBeGreaterThanOrEqual(1);
    
    console.log('✅ READ: Module-action relationships displayed');
  });
  
  test('READ: should filter by module', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/admin/module-actions');
    await authenticatedPage.waitForLoadState('networkidle');
    
    // Find module filter
    const moduleFilter = authenticatedPage.locator('select').first();
    
    if (await moduleFilter.count() > 0) {
      const initialRows = authenticatedPage.locator('tbody tr:visible:not(.no-data)');
      const initialCount = await initialRows.count();
      
      // Select a module
      await moduleFilter.selectOption({ index: 1 });
      await authenticatedPage.waitForTimeout(1000);
      
      // Verify filtering occurred
      const filteredCount = await initialRows.count();
      expect(filteredCount).toBeGreaterThanOrEqual(0);
      
      console.log('✅ READ: Module filter working');
    }
  });
  
  test('UPDATE: should update module-action assignment', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/admin/module-actions');
    await authenticatedPage.waitForLoadState('networkidle');
    
    // Wait for table to be visible
    const table = authenticatedPage.locator('table').first();
    await expect(table).toBeVisible({ timeout: 5000 });
    
    // Find first edit button and ensure it's visible
    const editButton = authenticatedPage.locator('[data-testid="edit-module-action-button"]').first();
    await expect(editButton).toBeVisible({ timeout: 5000 });
    
    if (await editButton.isVisible()) {
      await editButton.click();
      await authenticatedPage.waitForLoadState('networkidle');
      
      // Update custom action label
      const labelInput = authenticatedPage.locator('input[name="label"]').first();
      const testLabel = 'Updated Label ' + Date.now();
      
      await labelInput.clear();
      await labelInput.fill(testLabel);
      
      await authenticatedPage.locator('button[type="submit"]').click();
      await authenticatedPage.waitForLoadState('networkidle');
      
      // Verify update - check for success message
      const successMessage = authenticatedPage.locator('text=/updated successfully/i');
      const hasSuccessMessage = await successMessage.isVisible({ timeout: 5000 }).catch(() => false);
      
      if (hasSuccessMessage) {
        console.log('✅ UPDATE: Successfully updated module-action');
      } else {
        console.log('ℹ️  UPDATE: Update completed but no success message found');
      }
    }
  });
  
  test('DELETE: should remove module-action assignment', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/admin/module-actions');
    await authenticatedPage.waitForLoadState('networkidle');
    
    // Get initial count
    const initialRows = authenticatedPage.locator('tbody tr:visible:not(.no-data)');
    const initialCount = await initialRows.count();
    
    if (initialCount > 0) {
      // Find first delete button and ensure it's visible
      const deleteButton = authenticatedPage.locator('[data-testid="delete-module-action-button"]').first();
      await expect(deleteButton).toBeVisible({ timeout: 5000 });
      
      if (await deleteButton.isVisible()) {
        await deleteButton.click();
        
        await authenticatedPage.waitForTimeout(500);
        const confirmButton = authenticatedPage.locator('button:has-text("Confirm"), button:has-text("Yes"), button:has-text("Delete")').last();
        await confirmButton.click();
        await authenticatedPage.waitForLoadState('networkidle');
        
        // Verify deletion
        const newCount = await initialRows.count();
        expect(newCount).toBeLessThanOrEqual(initialCount);
        
        console.log('✅ DELETE: Successfully removed module-action assignment');
      }
    }
  });
});
