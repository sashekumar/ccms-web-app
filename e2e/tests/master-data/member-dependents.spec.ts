import { test, expect } from '../../fixtures/auth.fixture';
import { MemberListPage } from '../../page-objects/master-data/member-list.page';
import { MemberFormPage } from '../../page-objects/master-data/member-form.page';
import { MemberViewPage } from '../../page-objects/master-data/member-view.page';
import { MemberDependentFormPage } from '../../page-objects/master-data/member-dependent-form.page';

/**
 * Member Dependents - Sub-form CRUD Operations E2E Tests
 * 
 * Tests member dependent management including:
 * - Creating dependents for a member
 * - Updating dependent details
 * - Deleting dependents
 * - Relationship validation
 * - Age and status management
 */

test.describe.serial('Member Dependents - CRUD Operations', () => {
  const timestamp = Date.now();
  const testMemberName = `E2E Member Dependent ${timestamp}`;
  const testMemberIc = `DEPT${timestamp}`;
  const testDependentName = `E2E Dependent ${timestamp}`;
  const testDependentIc = `D${timestamp}`;
  const updatedDependentName = `E2E Dependent Updated ${timestamp}`;
  
  let memberId: string;

  test('SETUP: Create a test member', async ({ authenticatedPage }) => {
    const memberListPage = new MemberListPage(authenticatedPage);
    const memberFormPage = new MemberFormPage(authenticatedPage);

    await memberListPage.goto();
    await memberListPage.waitForPageLoad();

    await memberListPage.clickCreateMember();
    await memberFormPage.waitForPageLoad();

    await memberFormPage.fillMemberForm({
      fullName: testMemberName,
      icNo: testMemberIc,
      memberType: 'Principal',
      memberStatus: 'Active'
    });

    await memberFormPage.submit();
    await memberListPage.waitForPageLoad();

    // Get member ID
    await memberListPage.search(testMemberIc);
    await authenticatedPage.waitForTimeout(1000);
    
    const viewButton = authenticatedPage.locator(`tr:has-text("${testMemberIc}") button:has-text("View")`).first();
    await viewButton.click();
    await authenticatedPage.waitForTimeout(1000);
    
    const url = authenticatedPage.url();
    const match = url.match(/\/members\/view\/(\d+)/);
    if (match) {
      memberId = match[1];
    }
    
    expect(memberId).toBeDefined();
  });

  test('CREATE: should add a new dependent to member', async ({ authenticatedPage }) => {
    const memberViewPage = new MemberViewPage(authenticatedPage);
    const dependentFormPage = new MemberDependentFormPage(authenticatedPage);

    await memberViewPage.goto(memberId);
    await memberViewPage.waitForPageLoad();

    // Navigate to Dependents tab
    await memberViewPage.clickDependentsTab();

    // Click Add Dependent
    await memberViewPage.clickAddDependent();
    await dependentFormPage.waitForPageLoad();

    // Fill dependent form
    await dependentFormPage.fillDependentForm({
      fullName: testDependentName,
      icNo: testDependentIc,
      relationship: 'Spouse',
      dateOfBirth: '1990-01-15',
      gender: 'Female',
      isActive: true
    });

    await dependentFormPage.submit();
    await authenticatedPage.waitForTimeout(1000);

    // Verify dependent appears in the table
    await memberViewPage.expectDependentVisible(testDependentName);
    await memberViewPage.expectDependentVisible(testDependentIc);
  });

  test('CREATE: should add a child dependent', async ({ authenticatedPage }) => {
    const memberViewPage = new MemberViewPage(authenticatedPage);
    const dependentFormPage = new MemberDependentFormPage(authenticatedPage);

    await memberViewPage.goto(memberId);
    await memberViewPage.waitForPageLoad();
    await memberViewPage.clickDependentsTab();

    await memberViewPage.clickAddDependent();
    await dependentFormPage.waitForPageLoad();

    // Fill child dependent form
    const childName = `E2E Child ${timestamp}`;
    const childIc = `C${timestamp}`;
    
    await dependentFormPage.fillDependentForm({
      fullName: childName,
      icNo: childIc,
      relationship: 'Child',
      dateOfBirth: '2015-05-10',
      gender: 'Male',
      isActive: true
    });

    await dependentFormPage.submit();
    await authenticatedPage.waitForTimeout(1000);

    // Verify child appears
    await memberViewPage.expectDependentVisible(childName);
  });

  test('VALIDATION: should validate required dependent fields', async ({ authenticatedPage }) => {
    const memberViewPage = new MemberViewPage(authenticatedPage);
    const dependentFormPage = new MemberDependentFormPage(authenticatedPage);

    await memberViewPage.goto(memberId);
    await memberViewPage.waitForPageLoad();
    await memberViewPage.clickDependentsTab();

    await memberViewPage.clickAddDependent();
    await dependentFormPage.waitForPageLoad();

    // Try to submit without filling required fields
    const isDisabled = await dependentFormPage.isSubmitDisabled();
    expect(isDisabled).toBe(true);
  });

  test('READ: should display dependent details correctly', async ({ authenticatedPage }) => {
    const memberViewPage = new MemberViewPage(authenticatedPage);

    await memberViewPage.goto(memberId);
    await memberViewPage.waitForPageLoad();
    await memberViewPage.clickDependentsTab();

    // Verify all dependents are visible
    await memberViewPage.expectDependentVisible(testDependentName);
    await memberViewPage.expectDependentVisible(testDependentIc);
    
    // Verify count (should have at least 2 - spouse and child)
    const count = await memberViewPage.getDependentCount();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test('UPDATE: should update dependent details', async ({ authenticatedPage }) => {
    const memberViewPage = new MemberViewPage(authenticatedPage);
    const dependentFormPage = new MemberDependentFormPage(authenticatedPage);

    await memberViewPage.goto(memberId);
    await memberViewPage.waitForPageLoad();
    await memberViewPage.clickDependentsTab();

    // Edit the dependent
    await memberViewPage.editDependent(testDependentName);
    await dependentFormPage.waitForPageLoad();

    // Verify current values
    const currentName = await dependentFormPage.getFullName();
    const currentIc = await dependentFormPage.getIcNo();
    expect(currentName).toBe(testDependentName);
    expect(currentIc).toBe(testDependentIc);

    // Update dependent
    await dependentFormPage.fillDependentForm({
      fullName: updatedDependentName
    });

    await dependentFormPage.submit();
    await authenticatedPage.waitForTimeout(1000);

    // Verify updated dependent appears
    await memberViewPage.expectDependentVisible(updatedDependentName);
  });

  test('DELETE: should delete dependent successfully', async ({ authenticatedPage }) => {
    const memberViewPage = new MemberViewPage(authenticatedPage);

    await memberViewPage.goto(memberId);
    await memberViewPage.waitForPageLoad();
    await memberViewPage.clickDependentsTab();

    // Verify dependent exists before delete
    const row = authenticatedPage.locator(`tr:has-text("${updatedDependentName}")`);
    await expect(row).toBeVisible({ timeout: 10000 });

    // Accept confirmation dialog
    authenticatedPage.on('dialog', dialog => dialog.accept());

    // Delete the dependent
    await memberViewPage.deleteDependent(updatedDependentName);
    await authenticatedPage.waitForTimeout(1000);

    // Verify dependent is removed
    await expect(row).not.toBeVisible({ timeout: 5000 });
  });

  test('CLEANUP: Delete test member', async ({ authenticatedPage }) => {
    const memberListPage = new MemberListPage(authenticatedPage);

    await memberListPage.goto();
    await memberListPage.waitForPageLoad();

    await memberListPage.search(testMemberIc);
    await authenticatedPage.waitForTimeout(500);

    const row = authenticatedPage.locator(`tr:has-text("${testMemberIc}")`);
    await expect(row).toBeVisible({ timeout: 10000 });

    authenticatedPage.on('dialog', dialog => dialog.accept());

    const deleteButton = row.locator('button:has-text("Delete"), button[title*="Delete"]').first();
    await deleteButton.click();
    await authenticatedPage.waitForTimeout(1000);

    await expect(row).not.toBeVisible({ timeout: 5000 });
  });
});
