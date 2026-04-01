import { test, expect } from '../../fixtures/auth.fixture';
import { RoleListPage } from '../../page-objects/role-list.page';
import { RoleFormPage } from '../../page-objects/role-form.page';

/**
 * Role Management - Data Operations E2E Tests
 * 
 * Tests actual CRUD operations for roles including:
 * - Creating roles
 * - Updating role details
 * - Deleting roles
 * - Validation and error handling
 * 
 * Following coding-standards.md principles:
 * - Page Object Model for maintainability
 * - Proper test data management with timestamps
 * - Comprehensive validation testing
 * - Serial execution to ensure data persistence between tests
 */

test.describe.serial('Role Operations - CRUD', () => {
  const timestamp = Date.now();
  const testRoleCode = `TEST_ROLE_${timestamp}`;
  const testRoleName = `Test Role ${timestamp}`;
  
  test('CREATE: should create a new role successfully', async ({ authenticatedPage }) => {
    const roleListPage = new RoleListPage(authenticatedPage);
    const roleFormPage = new RoleFormPage(authenticatedPage);
    
    // Navigate to roles page and create
    await roleListPage.goto();
    await roleListPage.clickCreateRole();
    await roleFormPage.waitForPageLoad();
    
    // Fill in role details using page object
    await roleFormPage.fillRoleCode(testRoleCode);
    await roleFormPage.fillRoleName(testRoleName);
    await roleFormPage.fillDescription('Test role for E2E testing');
    await roleFormPage.setActive(true);
    await roleFormPage.submitForm();
    await authenticatedPage.waitForLoadState('networkidle');
    
    // Back to roles list
    await authenticatedPage.locator('button:has-text("Back to Roles")').click();
    await authenticatedPage.waitForURL('**/admin/roles', { timeout: 10000 });
    await authenticatedPage.waitForLoadState('networkidle');
    // Extra pause to allow loadRoles() async response to populate the table
    await authenticatedPage.waitForTimeout(500);

    // Verify role appears in table
    await roleListPage.search(testRoleCode);
    await expect(authenticatedPage.locator(`td:has-text("${testRoleCode}")`)).toBeVisible({ timeout: 10000 });
    
    console.log(`✅ CREATE: Successfully created role: ${testRoleCode}`);
  });
  
  test('VALIDATION: should validate required fields on role creation', async ({ authenticatedPage }) => {
    // Navigate to roles page
    await authenticatedPage.goto('/admin/roles');
    await authenticatedPage.waitForLoadState('networkidle');
    
    // Click create button
    await authenticatedPage.locator('button:has-text("Create Role")').click();
    await authenticatedPage.waitForLoadState('networkidle');
    
    // Try to submit without filling required fields
    const submitBtn = authenticatedPage.locator('button[type="submit"]');
    const isDisabled = await submitBtn.isDisabled();
    
    expect(isDisabled).toBe(true);
    
    console.log('âœ… VALIDATION: Required fields validation working');
  });
  
  test('VALIDATION: should validate role code format', async ({ authenticatedPage }) => {
    // Navigate to roles page
    await authenticatedPage.goto('/admin/roles');
    await authenticatedPage.waitForLoadState('networkidle');
    
    // Click create button
    await authenticatedPage.locator('button:has-text("Create Role")').click();
    await authenticatedPage.waitForLoadState('networkidle');
    
    // Fill with invalid role code (lowercase and special characters)
    await authenticatedPage.locator('input[name="roleCode"]').fill('test-role!@#');
    await authenticatedPage.locator('input[name="roleName"]').fill('Test Role');
    
    // Submit button should remain disabled due to validation
    const submitBtn = authenticatedPage.locator('button[type="submit"]');
    const isDisabled = await submitBtn.isDisabled();
    
    expect(isDisabled).toBe(true);
    
    console.log('âœ… VALIDATION: Code format validation working');
  });
  
  test('UPDATE: should update an existing role', async ({ authenticatedPage }) => {
    // Navigate to roles page
    await authenticatedPage.goto('/admin/roles');
    await authenticatedPage.waitForLoadState('networkidle');
    
    // Search for the test role
    const searchInput = authenticatedPage.locator('input[name="searchTerm"]').first();
    await searchInput.fill(testRoleCode);
    await authenticatedPage.waitForTimeout(1000);
    
    // Wait for the row to be visible first
    const row = authenticatedPage.locator(`tr:has-text("${testRoleCode}")`).first();
    await expect(row).toBeVisible({ timeout: 10000 });
    
    // Click edit button within that row
    const editButton = row.locator('[data-testid="edit-role-button"]');
    await expect(editButton).toBeVisible({ timeout: 5000 });
    await editButton.click();
    // Wait for edit form to load AND for getRoleById to populate the form
    await authenticatedPage.waitForLoadState('networkidle');
    await expect(authenticatedPage.locator('input[name="roleName"]')).not.toHaveValue('', { timeout: 10000 });
    
    // Update role name and description
    const updatedName = `${testRoleName} Updated`;
    await authenticatedPage.locator('input[name="roleName"]').fill(updatedName);
    await authenticatedPage.locator('textarea[placeholder*="description"]').fill('Updated description for testing');
    
    // Submit changes
    await authenticatedPage.locator('button[type="submit"]').click();
    await authenticatedPage.waitForURL('**/admin/roles', { timeout: 10000 });
    await authenticatedPage.waitForLoadState('networkidle');
    // Extra pause to allow loadRoles() async response to populate the table
    await authenticatedPage.waitForTimeout(500);

    // Verify updated name appears in table
    await searchInput.fill(testRoleCode);
    await authenticatedPage.waitForTimeout(800);
    await expect(authenticatedPage.locator(`td:has-text("${updatedName}")`)).toBeVisible({ timeout: 10000 });
    
    console.log('âœ… UPDATE: Successfully updated role');
  });
  
  test('READ: should search and filter roles', async ({ authenticatedPage }) => {
    // Navigate to roles page
    await authenticatedPage.goto('/admin/roles');
    await authenticatedPage.waitForLoadState('networkidle');
    
    // Search for test role
    const searchInput = authenticatedPage.locator('input[name="searchTerm"]').first();
    await searchInput.fill(testRoleCode);
    await authenticatedPage.waitForTimeout(1000);
    
    // Verify test role is visible
    const isVisible = await authenticatedPage.locator(`td:has-text("${testRoleCode}")`).isVisible();
    expect(isVisible).toBe(true);
    
    // Clear search
    await searchInput.fill('');
    await authenticatedPage.waitForTimeout(1000);
    
    // Should show more rows
    const rows = authenticatedPage.locator('tbody tr');
    const count = await rows.count();
    expect(count).toBeGreaterThanOrEqual(1);
    
    console.log('âœ… READ: Search and filter working');
  });
  
  // SAFETY: DELETE test disabled to prevent accidental deletion of system roles
  // Re-enable after frontend pages are fully implemented and CREATE/UPDATE tests pass
  test('DELETE: should delete a role', async ({ authenticatedPage }) => {
    // Navigate to roles page
    await authenticatedPage.goto('/admin/roles');
    await authenticatedPage.waitForLoadState('networkidle');
    
    // Search for the test role
    const searchInput = authenticatedPage.locator('input[name="searchTerm"]').first();
    await searchInput.fill(testRoleCode);
    await authenticatedPage.waitForTimeout(1000);
    
    // Verify test data exists before attempting delete (fail fast if CREATE didn't work)
    const row = authenticatedPage.locator(`tr:has-text("${testRoleCode}")`).first();
    await expect(row).toBeVisible({ timeout: 10000 });
    
    // Click delete button within that row
    const deleteButton = row.locator('[data-testid="delete-role-button"]');
    await expect(deleteButton).toBeVisible({ timeout: 5000 });
    await deleteButton.click();
    await authenticatedPage.waitForTimeout(500);
    
    // Confirm deletion
    const confirmButton = authenticatedPage.locator('button:has-text("Delete")').last();
    await expect(confirmButton).toBeVisible({ timeout: 5000 });
    await expect(confirmButton).toBeEnabled({ timeout: 5000 });
    await confirmButton.click();
    await authenticatedPage.waitForTimeout(1000);
    await authenticatedPage.waitForLoadState('networkidle');
    
    // Verify role is no longer visible
    await searchInput.fill(testRoleCode);
    await authenticatedPage.waitForTimeout(1000);
    
    const deletedRole = authenticatedPage.locator(`td:has-text("${testRoleCode}")`);
    const isGone = !(await deletedRole.isVisible().catch(() => false));
    
    expect(isGone).toBe(true);
    
    console.log('âœ… DELETE: Successfully deleted role');
  });
});


