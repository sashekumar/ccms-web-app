import { test, expect } from '../../fixtures/auth.fixture';
import { MemberListPage } from '../../page-objects/master-data/member-list.page';
import { MemberFormPage } from '../../page-objects/master-data/member-form.page';

/**
 * Member Management - CRUD Operations E2E Tests
 * 
 * Tests policy holder (member) management including:
 * - Creating members
 * - Updating member details
 * - Deleting members
 * - Validation and search functionality
 */

test.describe.serial('Member Management - CRUD Operations', () => {
  const timestamp = Date.now();
  const testFullName = `E2E Test Member ${timestamp}`;
  const testIcNo = `E2E${timestamp}`;
  const updatedFullName = `E2E Updated Member ${timestamp}`;

  test('CREATE: should create a new member successfully', async ({ authenticatedPage }) => {
    const memberListPage = new MemberListPage(authenticatedPage);
    const memberFormPage = new MemberFormPage(authenticatedPage);

    await memberListPage.goto();
    await memberListPage.waitForPageLoad();

    await memberListPage.clickCreateMember();
    await memberFormPage.waitForPageLoad();

    await memberFormPage.fillMemberForm({
      fullName: testFullName,
      icNo: testIcNo,
      memberType: 'Principal',
      memberStatus: 'Active'
    });

    await memberFormPage.submit();
    await memberListPage.waitForPageLoad();

    await memberListPage.search(testIcNo);
    await authenticatedPage.waitForTimeout(500);

    await memberListPage.expectMemberVisible(testIcNo);
    await memberListPage.expectMemberVisible(testFullName);
  });

  test('VALIDATION: should validate required fields', async ({ authenticatedPage }) => {
    const memberListPage = new MemberListPage(authenticatedPage);
    const memberFormPage = new MemberFormPage(authenticatedPage);

    await memberListPage.goto();
    await memberListPage.waitForPageLoad();

    await memberListPage.clickCreateMember();
    await memberFormPage.waitForPageLoad();

    const isDisabled = await memberFormPage.isSubmitDisabled();
    expect(isDisabled).toBe(true);
  });

  test('READ: should display member details correctly', async ({ authenticatedPage }) => {
    const memberListPage = new MemberListPage(authenticatedPage);

    await memberListPage.goto();
    await memberListPage.waitForPageLoad();

    await memberListPage.search(testIcNo);
    await authenticatedPage.waitForTimeout(500);

    await memberListPage.expectMemberVisible(testIcNo);
    await memberListPage.expectMemberVisible(testFullName);
  });

  test('UPDATE: should update member details successfully', async ({ authenticatedPage }) => {
    const memberListPage = new MemberListPage(authenticatedPage);
    const memberFormPage = new MemberFormPage(authenticatedPage);

    await memberListPage.goto();
    await memberListPage.waitForPageLoad();

    await memberListPage.search(testIcNo);
    await authenticatedPage.waitForTimeout(500);

    await memberListPage.clickEdit(testIcNo);
    await memberFormPage.waitForPageLoad();

    const currentName = await memberFormPage.getFullName();
    const currentIcNo = await memberFormPage.getIcNo();
    expect(currentName).toBe(testFullName);
    expect(currentIcNo).toBe(testIcNo);

    await memberFormPage.fillMemberForm({
      fullName: updatedFullName
    });

    await memberFormPage.submit();
    await memberListPage.waitForPageLoad();

    await memberListPage.search(testIcNo);
    await authenticatedPage.waitForTimeout(500);

    await memberListPage.expectMemberVisible(updatedFullName);
  });

  test('DELETE: should delete member successfully', async ({ authenticatedPage }) => {
    const memberListPage = new MemberListPage(authenticatedPage);

    await memberListPage.goto();
    await memberListPage.waitForPageLoad();

    await memberListPage.search(testIcNo);
    await authenticatedPage.waitForTimeout(500);

    // Verify test data exists before delete
    const row = authenticatedPage.locator(`tr:has-text("${testIcNo}")`);
    await expect(row).toBeVisible({ timeout: 10000 });

    authenticatedPage.on('dialog', dialog => dialog.accept());

    const deleteButton = row.locator('button:has-text("Delete"), button[title*="Delete"]').first();
    await deleteButton.click();

    await authenticatedPage.waitForTimeout(1000);

    await memberListPage.expectMemberNotVisible(testIcNo);
  });
});
