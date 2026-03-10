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
    // Navigate to roles page directly
    await authenticatedPage.goto('/admin/roles');
    await authenticatedPage.waitForLoadState('networkidle');
    
    // Click create button
    await authenticatedPage.locator('button:has-text("Create Role")').click();
    await authenticatedPage.waitForLoadState('networkidle');
    
    // Fill in role details
    await authenticatedPage.locator('input[formControlName="roleCode"]').fill(testRoleCode);
    await authenticatedPage.locator('input[formControlName="roleName"]').fill(testRoleName);
    await authenticatedPage.locator('textarea[formControlName="description"]').fill('Test role for E2E testing');
    
    // Submit form
    await authenticatedPage.locator('button[type="submit"]').click();
    await authenticatedPage.waitForLoadState('networkidle');
    
    // After creation, app navigates to permissions page - go back to list
    await authenticatedPage.locator('button:has-text("Back to Roles")').click();
    await authenticatedPage.waitForLoadState('networkidle');
    
    // Search for the created role
    const searchInput = authenticatedPage.locator('input[placeholder*="Search"]').first();
    await searchInput.fill(testRoleCode);
    await authenticatedPage.waitForTimeout(1000);
    
    // Verify role appears in table
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
    
    console.log('✅ VALIDATION: Required fields validation working');
  });
  
  test('VALIDATION: should validate role code format', async ({ authenticatedPage }) => {
    // Navigate to roles page
    await authenticatedPage.goto('/admin/roles');
    await authenticatedPage.waitForLoadState('networkidle');
    
    // Click create button
    await authenticatedPage.locator('button:has-text("Create Role")').click();
    await authenticatedPage.waitForLoadState('networkidle');
    
    // Fill with invalid role code (lowercase and special characters)
    await authenticatedPage.locator('input[formControlName="roleCode"]').fill('test-role!@#');
    await authenticatedPage.locator('input[formControlName="roleName"]').fill('Test Role');
    
    // Submit button should remain disabled due to validation
    const submitBtn = authenticatedPage.locator('button[type="submit"]');
    const isDisabled = await submitBtn.isDisabled();
    
    expect(isDisabled).toBe(true);
    
    console.log('✅ VALIDATION: Code format validation working');
  });
  
  test('UPDATE: should update an existing role', async ({ authenticatedPage }) => {
    // Navigate to roles page
    await authenticatedPage.goto('/admin/roles');
    await authenticatedPage.waitForLoadState('networkidle');
    
    // Search for the test role
    const searchInput = authenticatedPage.locator('input[placeholder*="Search"]').first();
    await searchInput.fill(testRoleCode);
    await authenticatedPage.waitForTimeout(1000);
    
    // Wait for the row to be visible first
    const row = authenticatedPage.locator(`tr:has-text("${testRoleCode}")`).first();
    await expect(row).toBeVisible({ timeout: 10000 });
    
    // Click edit button within that row
    const editButton = row.locator('[data-testid="edit-role-button"]');
    await expect(editButton).toBeVisible({ timeout: 5000 });
    await editButton.click();
    await authenticatedPage.waitForLoadState('networkidle');
    
    // Update role name and description
    const updatedName = `${testRoleName} Updated`;
    await authenticatedPage.locator('input[formControlName="roleName"]').fill(updatedName);
    await authenticatedPage.locator('textarea[formControlName="description"]').fill('Updated description for testing');
    
    // Submit changes
    await authenticatedPage.locator('button[type="submit"]').click();
    await authenticatedPage.waitForLoadState('networkidle');
    
    // Verify updated name appears in table
    await searchInput.fill(testRoleCode);
    await authenticatedPage.waitForTimeout(1000);
    await expect(authenticatedPage.locator(`td:has-text("${updatedName}")`)).toBeVisible({ timeout: 10000 });
    
    console.log('✅ UPDATE: Successfully updated role');
  });
  
  test('READ: should search and filter roles', async ({ authenticatedPage }) => {
    // Navigate to roles page
    await authenticatedPage.goto('/admin/roles');
    await authenticatedPage.waitForLoadState('networkidle');
    
    // Search for test role
    const searchInput = authenticatedPage.locator('input[placeholder*="Search"]').first();
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
    
    console.log('✅ READ: Search and filter working');
  });
  
  test('DELETE: should delete a role', async ({ authenticatedPage }) => {
    // Navigate to roles page
    await authenticatedPage.goto('/admin/roles');
    await authenticatedPage.waitForLoadState('networkidle');
    
    // Search for the test role
    const searchInput = authenticatedPage.locator('input[placeholder*="Search"]').first();
    await searchInput.fill(testRoleCode);
    await authenticatedPage.waitForTimeout(1000);
    
    // Wait for the row to be visible first
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
    
    console.log('✅ DELETE: Successfully deleted role');
  });
});

