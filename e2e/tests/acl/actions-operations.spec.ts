import { test, expect } from '../../fixtures/auth.fixture';

/**
 * ACL Actions - Data Operations E2E Tests
 * 
 * Complete CRUD operations testing:
 * - CREATE: Fill forms, submit, verify success and data appears
 * - READ: Search/filter data and verify results
 * - UPDATE: Edit records, save changes, verify persistence
 * - DELETE: Delete records and verify removal
 * - VALIDATION: Test form validations, required fields, errors
 * 
 * Note: Tests run in SERIAL mode to ensure data created in CREATE test
 * is available for READ/UPDATE/DELETE tests.
 */

test.describe.serial('ACL Actions Operations - CRUD', () => {
  const timestamp = Date.now();
  const testActionCode = `TEST_ACT_${timestamp}`;
  const testActionName = `Test Action ${timestamp}`;
  
  test('CREATE: should create a new action successfully', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/admin/actions');
    await authenticatedPage.waitForLoadState('networkidle');
    
    await authenticatedPage.locator('button:has-text("Create"), button:has-text("Add")').first().click();
    await authenticatedPage.waitForTimeout(500);
    
    // Fill in action details (Template-Driven Forms with ngModel)
    await authenticatedPage.locator('input[name="code"]').fill(testActionCode);
    await authenticatedPage.locator('input[name="name"]').fill(testActionName);
    
    const descInput = authenticatedPage.locator('textarea[name="description"]');
    if (await descInput.count() > 0) {
      await descInput.fill('Test action for complete CRUD E2E testing');
    }
    
    await authenticatedPage.locator('button[type="submit"]').click();
    await authenticatedPage.waitForLoadState('networkidle');
    
    // Verify creation (modal closes, action appears in list)
    const searchInput = authenticatedPage.locator('input[placeholder*="action name or code"]').first();
    await searchInput.fill(testActionCode);
    await authenticatedPage.waitForTimeout(1000);
    
    await expect(authenticatedPage.locator(`td:has-text("${testActionCode}")`)).toBeVisible({ timeout: 10000 });
    
    console.log(`✅ CREATE: Successfully created action: ${testActionCode}`);
  });
  
  test('VALIDATION: should validate required fields', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/admin/actions');
    await authenticatedPage.waitForLoadState('networkidle');
    
    await authenticatedPage.locator('button:has-text("Create"), button:has-text("Add")').first().click();
    await authenticatedPage.waitForLoadState('networkidle');
    
    const submitBtn = authenticatedPage.locator('button[type="submit"]');
    const isDisabled = await submitBtn.isDisabled();
    
    expect(isDisabled).toBe(true);
    
    console.log('✅ VALIDATION: Required fields validation working');
  });
  
  test('READ: should search actions', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/admin/actions');
    await authenticatedPage.waitForLoadState('networkidle');
    
    const searchInput = authenticatedPage.locator('input[type="search"], input[placeholder*="Search"]').first();
    await searchInput.fill(testActionCode);
    await authenticatedPage.waitForTimeout(1000);
    
    await expect(authenticatedPage.locator(`td:has-text("${testActionCode}")`)).toBeVisible();
    
    console.log('✅ READ: Search working');
  });
  
  test('UPDATE: should update action', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/admin/actions');
    await authenticatedPage.waitForLoadState('networkidle');
    
    const searchInput = authenticatedPage.locator('input[type="search"], input[placeholder*="Search"]').first();
    await searchInput.fill(testActionCode);
    await authenticatedPage.waitForTimeout(1000);
    
    // Wait for the row to be visible first
    const row = authenticatedPage.locator(`tr:has-text("${testActionCode}")`).first();
    await expect(row).toBeVisible({ timeout: 10000 });
    
    // Now find and click the edit button within that row
    const editButton = row.locator('[data-testid="edit-action-button"]');
    await expect(editButton).toBeVisible({ timeout: 5000 });
    await editButton.click();
    await authenticatedPage.waitForLoadState('networkidle');
    
    const updatedName = `${testActionName} UPDATED`;
    const nameInput = authenticatedPage.locator('input[formcontrolname*="name"], input[name*="name"]').first();
    await nameInput.clear();
    await nameInput.fill(updatedName);
    
    await authenticatedPage.locator('button[type="submit"]').click();
    await authenticatedPage.waitForLoadState('networkidle');
    
    await searchInput.fill(testActionCode);
    await authenticatedPage.waitForTimeout(1000);
    
    await expect(authenticatedPage.locator(`td:has-text("${updatedName}")`)).toBeVisible({ timeout: 10000 });
    
    console.log('✅ UPDATE: Successfully updated action');
  });
  
  test('DELETE: should delete action', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/admin/actions');
    await authenticatedPage.waitForLoadState('networkidle');
    
    const searchInput = authenticatedPage.locator('input[type="search"], input[placeholder*="Search"]').first();
    await searchInput.fill(testActionCode);
    await authenticatedPage.waitForTimeout(1000);
    
    // Wait for the row to be visible first
    const row = authenticatedPage.locator(`tr:has-text("${testActionCode}")`).first();
    await expect(row).toBeVisible({ timeout: 10000 });
    
    // Now find and click the delete button within that row
    const deleteButton = row.locator('[data-testid="delete-action-button"]');
    await expect(deleteButton).toBeVisible({ timeout: 5000 });
    await deleteButton.click();
    
    await authenticatedPage.waitForTimeout(500);
    const confirmButton = authenticatedPage.locator('button:has-text("Confirm"), button:has-text("Yes"), button:has-text("Delete")').last();
    await confirmButton.click();
    await authenticatedPage.waitForLoadState('networkidle');
    
    await searchInput.fill(testActionCode);
    await authenticatedPage.waitForTimeout(1000);
    
    const isGone = !(await authenticatedPage.locator(`td:has-text("${testActionCode}")`).isVisible().catch(() => false));
    expect(isGone).toBe(true);
    
    console.log('✅ DELETE: Successfully deleted action');
  });
});
