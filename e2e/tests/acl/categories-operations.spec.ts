import { test, expect } from '../../fixtures/auth.fixture';

/**
 * ACL Categories - Data Operations E2E Tests
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

test.describe.serial('ACL Categories Operations - CRUD', () => {
  const timestamp = Date.now();
  const testCategoryCode = `TEST_CAT_${timestamp}`;
  const testCategoryName = `Test Category ${timestamp}`;
  
  test('CREATE: should create a new category successfully', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/admin/categories');
    await authenticatedPage.waitForLoadState('networkidle');
    
    await authenticatedPage.locator('button:has-text("Create"), button:has-text("Add")').first().click();
    await authenticatedPage.waitForLoadState('networkidle');
    
    // Fill in category details
    await authenticatedPage.locator('input[formcontrolname*="code"], input[name*="code"]').first().fill(testCategoryCode);
    await authenticatedPage.locator('input[formcontrolname*="name"], input[name*="name"]').first().fill(testCategoryName);
    
    const descInput = authenticatedPage.locator('textarea, input[formcontrolname*="description"]').first();
    if (await descInput.count() > 0) {
      await descInput.fill('Test category for complete CRUD E2E testing');
    }
    
    await authenticatedPage.locator('button[type="submit"]').click();
    await authenticatedPage.waitForLoadState('networkidle');
    
    // Verify creation
    const searchInput = authenticatedPage.locator('input[type="search"], input[placeholder*="Search"]').first();
    await searchInput.fill(testCategoryCode);
    await authenticatedPage.waitForTimeout(1000);
    
    await expect(authenticatedPage.locator(`td:has-text("${testCategoryCode}")`)).toBeVisible({ timeout: 10000 });
    
    console.log(`✅ CREATE: Successfully created category: ${testCategoryCode}`);
  });
  
  test('VALIDATION: should validate required fields', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/admin/categories');
    await authenticatedPage.waitForLoadState('networkidle');
    
    await authenticatedPage.locator('button:has-text("Create"), button:has-text("Add")').first().click();
    await authenticatedPage.waitForLoadState('networkidle');
    
    const submitBtn = authenticatedPage.locator('button[type="submit"]');
    const isDisabled = await submitBtn.isDisabled();
    
    expect(isDisabled).toBe(true);
    
    console.log('✅ VALIDATION: Required fields validation working');
  });
  
  test('READ: should search categories', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/admin/categories');
    await authenticatedPage.waitForLoadState('networkidle');
    
    const searchInput = authenticatedPage.locator('input[type="search"], input[placeholder*="Search"]').first();
    await searchInput.fill(testCategoryCode);
    await authenticatedPage.waitForTimeout(1000);
    
    await expect(authenticatedPage.locator(`td:has-text("${testCategoryCode}")`)).toBeVisible();
    
    console.log('✅ READ: Search working');
  });
  
  test('UPDATE: should update category', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/admin/categories');
    await authenticatedPage.waitForLoadState('networkidle');
    
    const searchInput = authenticatedPage.locator('input[type="search"], input[placeholder*="Search"]').first();
    await searchInput.fill(testCategoryCode);
    await authenticatedPage.waitForTimeout(1000);
    
    // Wait for the row to be visible first
    const row = authenticatedPage.locator(`tr:has-text("${testCategoryCode}")`).first();
    await expect(row).toBeVisible({ timeout: 10000 });
    
    // Now find and click the edit button within that row
    const editButton = row.locator('[data-testid="edit-category-button"]');
    await expect(editButton).toBeVisible({ timeout: 5000 });
    await editButton.click();
    await authenticatedPage.waitForLoadState('networkidle');
    
    const updatedName = `${testCategoryName} UPDATED`;
    const nameInput = authenticatedPage.locator('input[formcontrolname*="name"], input[name*="name"]').first();
    await nameInput.clear();
    await nameInput.fill(updatedName);
    
    await authenticatedPage.locator('button[type="submit"]').click();
    await authenticatedPage.waitForLoadState('networkidle');
    
    await searchInput.fill(testCategoryCode);
    await authenticatedPage.waitForTimeout(1000);
    
    await expect(authenticatedPage.locator(`td:has-text("${updatedName}")`)).toBeVisible({ timeout: 10000 });
    
    console.log('✅ UPDATE: Successfully updated category');
  });
  
  test('DELETE: should delete category', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/admin/categories');
    await authenticatedPage.waitForLoadState('networkidle');
    
    const searchInput = authenticatedPage.locator('input[type="search"], input[placeholder*="Search"]').first();
    await searchInput.fill(testCategoryCode);
    await authenticatedPage.waitForTimeout(1000);
    
    // Verify test data exists before attempting delete (fail fast if CREATE didn't work)
    const row = authenticatedPage.locator(`tr:has-text("${testCategoryCode}")`).first();
    await expect(row).toBeVisible({ timeout: 10000 });
    
    // Click delete button within the test data row (not any random row)
    const deleteButton = row.locator('[data-testid="delete-category-button"]');
    await expect(deleteButton).toBeVisible({ timeout: 5000 });
    await deleteButton.click();
    
    await authenticatedPage.waitForTimeout(500);
    const confirmButton = authenticatedPage.locator('button:has-text("Confirm"), button:has-text("Yes"), button:has-text("Delete")').last();
    await confirmButton.click();
    await authenticatedPage.waitForLoadState('networkidle');
    
    await searchInput.fill(testCategoryCode);
    await authenticatedPage.waitForTimeout(1000);
    
    const isGone = !(await authenticatedPage.locator(`td:has-text("${testCategoryCode}")`).isVisible().catch(() => false));
    expect(isGone).toBe(true);
    
    console.log('✅ DELETE: Successfully deleted category');
  });
});
