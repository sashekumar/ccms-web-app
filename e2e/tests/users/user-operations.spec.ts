import { test, expect } from '../../fixtures/auth.fixture';
import { UserListPage } from '../../page-objects/user-list.page';
import { UserFormPage } from '../../page-objects/user-form.page';

/**
 * User Management - Data Operations E2E Tests
 * 
 * Tests actual CRUD operations for users including:
 * - Creating users
 * - Updating user details
 * - Deleting users
 * - Validation and error handling
 * 
 * Following coding-standards.md principles:
 * - Page Object Model for maintainability
 * - Proper test data management with timestamps
 * - Comprehensive validation testing
 */

test.describe.serial('User Operations - CRUD', () => {
  const timestamp = Date.now();
  const testUsername = `e2euser_${timestamp}`;  // Changed from 'testuser' to avoid cleanup pattern
  const testFullName = `Test User ${timestamp}`;
  const testPassword = 'Test@123456';
  
  test('CREATE: should create a new user successfully', async ({ authenticatedPage }) => {
    const userListPage = new UserListPage(authenticatedPage);
    const userFormPage = new UserFormPage(authenticatedPage);
    
    // Navigate to users page
    await userListPage.goto();
    await userListPage.waitForPageLoad();
    
    // Click create button
    await userListPage.clickCreateUser();
    await userFormPage.waitForPageLoad();
    
    // Fill in user details
    await userFormPage.fillUserForm({
      username: testUsername,
      fullName: testFullName,
      password: testPassword,
      confirmPassword: testPassword,
      isActive: true
    });
    
    // Submit form
    await userFormPage.submit();
    await userListPage.waitForPageLoad();
    
    // Search for the created user
    await userListPage.search(testUsername);
    await authenticatedPage.waitForTimeout(500); // Wait for search results
    
    // Verify user appears in table
    await userListPage.expectUserVisible(testUsername);
  });
  
  test('VALIDATION: should validate required fields on user creation', async ({ authenticatedPage }) => {
    const userListPage = new UserListPage(authenticatedPage);
    const userFormPage = new UserFormPage(authenticatedPage);
    
    await userListPage.goto();
    await userListPage.waitForPageLoad();
    
    await userListPage.clickCreateUser();
    await userFormPage.waitForPageLoad();
    
    // Try to submit without filling required fields
    const isDisabled = await userFormPage.isSubmitDisabled();
    expect(isDisabled).toBe(true);
  });
  
  test('VALIDATION: should validate username format', async ({ authenticatedPage }) => {
    const userListPage = new UserListPage(authenticatedPage);
    const userFormPage = new UserFormPage(authenticatedPage);
    
    await userListPage.goto();
    await userListPage.waitForPageLoad();
    
    await userListPage.clickCreateUser();
    await userFormPage.waitForPageLoad();
    
    // Fill with invalid username (special characters)
    await userFormPage.fillUsername('test-user!@#');
    await userFormPage.fillFullName('Test User');
    await userFormPage.fillPassword(testPassword);
    await userFormPage.fillConfirmPassword(testPassword);
    
    // Should show pattern validation error
    await userFormPage.expectUsernamePatternError();
  });
  
  test('UPDATE: should update an existing user', async ({ authenticatedPage }) => {
    const userListPage = new UserListPage(authenticatedPage);
    const userFormPage = new UserFormPage(authenticatedPage);
    
    await userListPage.goto();
    await userListPage.waitForPageLoad();
    await authenticatedPage.waitForLoadState('networkidle');
    
    // Search for the test user
    await userListPage.search(testUsername);
    await authenticatedPage.waitForTimeout(500);
    
    // Click edit button for the user
    await userListPage.editUser(testUsername);
    await userFormPage.waitForPageLoad();
    
    // Update full name
    const updatedFullName = `Updated ${testFullName}`;
    await userFormPage.fillFullName(updatedFullName);
    
    // Submit changes
    await userFormPage.submit();
    await userListPage.waitForPageLoad();
    
    // Verify updated name appears in table
    await userListPage.search(testUsername);
    await authenticatedPage.waitForTimeout(500);
    await expect(authenticatedPage.locator(`td:has-text("${updatedFullName}")`)).toBeVisible({ timeout: 10000 });
  });
  
  test('READ: should search and filter users', async ({ authenticatedPage }) => {
    const userListPage = new UserListPage(authenticatedPage);
    
    await userListPage.goto();
    await userListPage.waitForPageLoad();
    
    // Search for test user
    await userListPage.search(testUsername);
    await authenticatedPage.waitForTimeout(500);
    
    // Verify test user is visible
    const isVisible = await userListPage.isUserVisible(testUsername);
    expect(isVisible).toBe(true);
    
    // Clear search
    await userListPage.search('');
    await authenticatedPage.waitForTimeout(500);
    
    // Should show more rows
    const count = await userListPage.getUserCount();
    expect(count).toBeGreaterThanOrEqual(1);
  });
  
  test('READ: should filter users by status', async ({ authenticatedPage }) => {
    const userListPage = new UserListPage(authenticatedPage);
    
    await userListPage.goto();
    await userListPage.waitForPageLoad();
    
    // Filter by Active status
    await userListPage.filterByStatus('active');
    await authenticatedPage.waitForTimeout(500);
    
    // Verify results are filtered
    const count = await userListPage.getUserCount();
    expect(count).toBeGreaterThanOrEqual(1);
  });
  
  test('DELETE: should delete a user', async ({ authenticatedPage }) => {
    const userListPage = new UserListPage(authenticatedPage);
    
    await userListPage.goto();
    await userListPage.waitForPageLoad();
    
    // Search for the test user
    await userListPage.search(testUsername);
    await authenticatedPage.waitForTimeout(500);
    
    // Set up dialog handler for delete confirmation
    authenticatedPage.on('dialog', dialog => dialog.accept());
    
    // Click delete button
    await userListPage.deleteUser(testUsername);
    await authenticatedPage.waitForLoadState('networkidle');
    await authenticatedPage.waitForTimeout(1000);
    
    // Refresh the page and filter to show only active users
    await userListPage.goto();
    await userListPage.waitForPageLoad();
    await userListPage.filterByStatus('active');
    await authenticatedPage.waitForTimeout(500);
    
    // Verify user is no longer visible in active users list
    await userListPage.search(testUsername);
    await authenticatedPage.waitForTimeout(500);
    
    const isVisible = await userListPage.isUserVisible(testUsername);
    expect(isVisible).toBe(false);
  });
});
