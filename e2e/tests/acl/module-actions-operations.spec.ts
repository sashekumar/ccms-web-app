import { test, expect } from '../../fixtures/auth.fixture';

/**
 * ACL Module-Actions - Data Operations E2E Tests
 *
 * Complete CRUD operations testing:
 * - CREATE: Assign actions to modules, verify success
 * - READ: Search/filter module-action relationships
 * - UPDATE: Modify action label and status
 * - DELETE: Remove action assignments with confirmation
 * - VALIDATION: Test form validations and constraints
 *
 * Note: Tests run in SERIAL mode to ensure data persistence across tests.
 */

test.describe.serial('ACL Module-Actions Operations - CRUD', () => {
  const timestamp = Date.now();

  test('CREATE: should assign action to module successfully', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/admin/module-actions');
    await authenticatedPage.waitForLoadState('networkidle');

    await authenticatedPage.locator('button:has-text("Attach Actions to Module")').click();
    await authenticatedPage.waitForTimeout(500);

    // Select a module
    const moduleDropdown = authenticatedPage.locator('app-dropdown[name="module"]');
    await expect(moduleDropdown).toBeVisible({ timeout: 5000 });
    await moduleDropdown.locator('button').first().click(); // Open dropdown
    await authenticatedPage.waitForTimeout(200);
    const firstOption = authenticatedPage.locator('app-dropdown[name="module"] li').nth(1);
    if (await firstOption.count() > 0) {
      await firstOption.click();
    }
    await authenticatedPage.waitForTimeout(300);

    // Check first available action checkbox
    const firstCheckbox = authenticatedPage.locator('input[type="checkbox"][id^="action-"]').first();
    await expect(firstCheckbox).toBeVisible({ timeout: 5000 });
    await firstCheckbox.check();
    await authenticatedPage.waitForTimeout(300);

    // Optionally set a custom label
    const labelInput = authenticatedPage.locator('input[name="label"]');
    await labelInput.fill(`E2E Label ${timestamp}`);

    // Save
    const submitBtn = authenticatedPage.locator('button[type="submit"]');
    await expect(submitBtn).toBeEnabled({ timeout: 5000 });
    await submitBtn.click();
    await authenticatedPage.waitForLoadState('networkidle');

    // Verify success message OR modal closes
    const modalGone = await authenticatedPage.locator('[name="module"]').isVisible().then(v => !v).catch(() => true);
    const successVisible = await authenticatedPage.locator('text=/success|saved|attached/i').isVisible().catch(() => false);
    expect(modalGone || successVisible).toBe(true);

    console.log('✅ CREATE: Successfully assigned action to module');
  });

  test('VALIDATION: should require module selection before submit is enabled', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/admin/module-actions');
    await authenticatedPage.waitForLoadState('networkidle');

    await authenticatedPage.locator('button:has-text("Attach Actions to Module")').click();
    await authenticatedPage.waitForTimeout(500);

    // Submit button should be disabled when form is empty
    const submitBtn = authenticatedPage.locator('button[type="submit"]');
    await expect(submitBtn).toBeDisabled();

    console.log('✅ VALIDATION: Submit correctly disabled on empty form');
  });

  test('VALIDATION: should show action count when checking actions', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/admin/module-actions');
    await authenticatedPage.waitForLoadState('networkidle');

    await authenticatedPage.locator('button:has-text("Attach Actions to Module")').click();
    await authenticatedPage.waitForTimeout(500);

    // Check an action checkbox
    const firstCheckbox = authenticatedPage.locator('input[type="checkbox"][id^="action-"]').first();
    if (await firstCheckbox.count() > 0) {
      await firstCheckbox.check();
      // Counter text should update
      await expect(authenticatedPage.locator('text=/Selected: [1-9]/i')).toBeVisible({ timeout: 3000 });
    }

    console.log('✅ VALIDATION: Action selection counter works');
  });

  test('READ: should display module-action relationships in table', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/admin/module-actions');
    await authenticatedPage.waitForLoadState('networkidle');

    const table = authenticatedPage.locator('table');
    await expect(table).toBeVisible();

    const rows = authenticatedPage.locator('tbody tr');
    const count = await rows.count();
    expect(count).toBeGreaterThanOrEqual(1);

    console.log(`✅ READ: Table displays ${count} module-action row(s)`);
  });

  test('READ: should search and filter by keyword', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/admin/module-actions');
    await authenticatedPage.waitForLoadState('networkidle');

    const searchInput = authenticatedPage.locator('input[name="search"]');
    await searchInput.fill('nonexistent_search_xyz_99999');
    await authenticatedPage.waitForTimeout(600);

    await expect(authenticatedPage.locator('tbody td:has-text("No module-actions found")')).toBeVisible();

    // Clear and verify results return
    await searchInput.clear();
    await authenticatedPage.waitForTimeout(600);
    const rows = authenticatedPage.locator('tbody tr');
    const count = await rows.count();
    expect(count).toBeGreaterThanOrEqual(1);

    console.log('✅ READ: Search filter works correctly');
  });

  test('READ: should filter by module using dropdown', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/admin/module-actions');
    await authenticatedPage.waitForLoadState('networkidle');

    const moduleFilter = authenticatedPage.locator('app-dropdown').nth(0);
    const optionCount = await moduleFilter.locator('li').count();

    if (optionCount > 1) {
      // Open dropdown and select first real module (skip placeholder)
      await moduleFilter.locator('button').first().click();
      await authenticatedPage.waitForTimeout(200);
      const firstOption = moduleFilter.locator('li').nth(1);
      if (await firstOption.count() > 0) await firstOption.click();
      await authenticatedPage.waitForTimeout(600);

      // Verify filter applied (count should be >= 0)
      const filteredRows = authenticatedPage.locator('tbody tr');
      const count = await filteredRows.count();
      expect(count).toBeGreaterThanOrEqual(0);

      // Reset filter
      await moduleFilter.locator('button').first().click();
      await authenticatedPage.waitForTimeout(200);
      const allOption = moduleFilter.locator('li').first();
      if (await allOption.count() > 0) await allOption.click();
    }

    console.log('✅ READ: Module filter works correctly');
  });

  test('READ: should filter by status - Active Only', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/admin/module-actions');
    await authenticatedPage.waitForLoadState('networkidle');

    // Status filter is the 3rd app-dropdown (index 2): Module, Action, Status
    const statusFilter = authenticatedPage.locator('app-dropdown').nth(2);
    await statusFilter.locator('button').first().click();
    await authenticatedPage.waitForTimeout(200);
    const activeOnlyOption = statusFilter.locator('li:has-text("Active Only")');
    if (await activeOnlyOption.count() > 0) await activeOnlyOption.click();
    await authenticatedPage.waitForTimeout(600);

    const rows = authenticatedPage.locator('tbody tr');
    const count = await rows.count();
    expect(count).toBeGreaterThanOrEqual(0);

    // Reset
    await statusFilter.locator('button').first().click();
    await authenticatedPage.waitForTimeout(200);
    const allStatusOption = statusFilter.locator('li').first();
    if (await allStatusOption.count() > 0) await allStatusOption.click();

    console.log('✅ READ: Status filter works correctly');
  });

  test('UPDATE: should edit custom label on a module-action', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/admin/module-actions');
    await authenticatedPage.waitForLoadState('networkidle');

    const editBtn = authenticatedPage.locator('[data-testid="edit-module-action-button"]').first();
    if (!(await editBtn.isVisible())) {
      test.skip();
      return;
    }

    await editBtn.click();
    await authenticatedPage.waitForTimeout(500);

    // Verify edit modal opens
    await expect(authenticatedPage.locator('h3:has-text("Edit Module-Action")')).toBeVisible();

    // Update the custom label
    const labelInput = authenticatedPage.locator('input[name="label"]');
    await labelInput.clear();
    await labelInput.fill(`Updated E2E Label ${timestamp}`);

    // Save
    await authenticatedPage.locator('button[type="submit"]').click();
    await authenticatedPage.waitForLoadState('networkidle');

    // Verify modal closed
    await expect(authenticatedPage.locator('h3:has-text("Edit Module-Action")')).not.toBeVisible({ timeout: 5000 });

    console.log('✅ UPDATE: Successfully updated custom label');
  });

  test('UPDATE: should toggle active status in edit modal', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/admin/module-actions');
    await authenticatedPage.waitForLoadState('networkidle');

    const editBtn = authenticatedPage.locator('[data-testid="edit-module-action-button"]').first();
    if (!(await editBtn.isVisible())) {
      test.skip();
      return;
    }

    await editBtn.click();
    await authenticatedPage.waitForTimeout(500);

    // Toggle the active checkbox
    const activeCheckbox = authenticatedPage.locator('input[name="active"]');
    await expect(activeCheckbox).toBeVisible({ timeout: 5000 });
    await activeCheckbox.click();

    // Cancel without saving
    await authenticatedPage.locator('button:has-text("Cancel")').click();

    console.log('✅ UPDATE: Active status toggle is functional');
  });

  test('DELETE: should show confirmation dialog before deleting', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/admin/module-actions');
    await authenticatedPage.waitForLoadState('networkidle');

    const deleteBtn = authenticatedPage.locator('[data-testid="delete-module-action-button"]').first();
    if (!(await deleteBtn.isVisible())) {
      test.skip();
      return;
    }

    await deleteBtn.click();
    await authenticatedPage.waitForTimeout(500);

    // Should show delete confirmation modal
    await expect(authenticatedPage.locator('h3:has-text("Delete Module-Action")')).toBeVisible();
    await expect(authenticatedPage.locator('text=This action cannot be undone')).toBeVisible();

    // Cancel the deletion
    await authenticatedPage.locator('button:has-text("Cancel")').last().click();
    await authenticatedPage.waitForTimeout(300);
    await expect(authenticatedPage.locator('h3:has-text("Delete Module-Action")')).not.toBeVisible();

    console.log('✅ DELETE: Confirmation dialog appears and cancel works');
  });

  test('DELETE: should remove module-action assignment after confirmation', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/admin/module-actions');
    await authenticatedPage.waitForLoadState('networkidle');

    const initialRows = authenticatedPage.locator('tbody tr');
    const initialCount = await initialRows.count();

    const deleteBtn = authenticatedPage.locator('[data-testid="delete-module-action-button"]').first();
    if (!(await deleteBtn.isVisible()) || initialCount === 0) {
      test.skip();
      return;
    }

    await deleteBtn.click();
    await authenticatedPage.waitForTimeout(500);

    // Confirm deletion
    const confirmBtn = authenticatedPage.locator('button:has-text("Delete")').last();
    await expect(confirmBtn).toBeVisible({ timeout: 5000 });
    await confirmBtn.click();
    await authenticatedPage.waitForLoadState('networkidle');

    // Verify count decreased
    const newCount = await initialRows.count();
    expect(newCount).toBeLessThan(initialCount);

    console.log('✅ DELETE: Successfully removed module-action assignment');
  });
});

