import { test, expect } from '../../fixtures/auth.fixture';
import { MemberListPage } from '../../page-objects/master-data/member-list.page';
import { MemberFormPage } from '../../page-objects/master-data/member-form.page';
import { MemberViewPage } from '../../page-objects/master-data/member-view.page';
import { MemberPecFormPage } from '../../page-objects/master-data/member-pec-form.page';

/**
 * Member PEC (Pre-Existing Conditions) - Sub-form CRUD Operations E2E Tests
 * 
 * Tests member pre-existing condition management including:
 * - Creating PEC records for a member
 * - Updating PEC details
 * - Deleting PEC records
 * - Condition severity and status tracking
 * - Exclusion flag management
 * - Medical history documentation
 */

test.describe.serial('Member PEC - CRUD Operations', () => {
  const timestamp = Date.now();
  const testMemberName = `E2E Member PEC ${timestamp}`;
  const testMemberIc = `PEC${timestamp}`;
  const testConditionName = `E2E Condition ${timestamp}`;
  const testConditionCode = `E2E-${timestamp}`;
  const updatedConditionName = `E2E Updated Condition ${timestamp}`;
  
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

  test('CREATE: should add a new PEC to member', async ({ authenticatedPage }) => {
    const memberViewPage = new MemberViewPage(authenticatedPage);
    const pecFormPage = new MemberPecFormPage(authenticatedPage);

    await memberViewPage.goto(memberId);
    await memberViewPage.waitForPageLoad();

    // Navigate to PEC tab
    await memberViewPage.clickPecTab();

    // Click Add PEC
    await memberViewPage.clickAddPec();
    await pecFormPage.waitForPageLoad();

    // Fill PEC form
    await pecFormPage.fillPecForm({
      conditionName: testConditionName,
      conditionCode: testConditionCode,
      diagnosisDate: '2023-06-15',
      severity: 'Moderate',
      status: 'Under Treatment',
      description: 'E2E test pre-existing condition',
      treatment: 'Medication and regular checkups',
      doctorName: 'Dr. Test Physician',
      hospital: 'Test General Hospital',
      isExcluded: false
    });

    await pecFormPage.submit();
    await authenticatedPage.waitForTimeout(1000);

    // Verify PEC appears in the table
    await expect(authenticatedPage.locator(`td:has-text("${testConditionName}")`)).toBeVisible({ timeout: 10000 });
    await expect(authenticatedPage.locator(`td:has-text("${testConditionCode}")`)).toBeVisible();
  });

  test('VALIDATION: should validate required PEC fields', async ({ authenticatedPage }) => {
    const memberViewPage = new MemberViewPage(authenticatedPage);
    const pecFormPage = new MemberPecFormPage(authenticatedPage);

    await memberViewPage.goto(memberId);
    await memberViewPage.waitForPageLoad();
    await memberViewPage.clickPecTab();

    await memberViewPage.clickAddPec();
    await pecFormPage.waitForPageLoad();

    // Try to submit without filling required fields
    const isDisabled = await pecFormPage.isSubmitDisabled();
    expect(isDisabled).toBe(true);
  });

  test('CREATE: should add excluded PEC condition', async ({ authenticatedPage }) => {
    const memberViewPage = new MemberViewPage(authenticatedPage);
    const pecFormPage = new MemberPecFormPage(authenticatedPage);

    await memberViewPage.goto(memberId);
    await memberViewPage.waitForPageLoad();
    await memberViewPage.clickPecTab();

    await memberViewPage.clickAddPec();
    await pecFormPage.waitForPageLoad();

    // Add excluded condition
    const excludedConditionName = `E2E Excluded ${timestamp}`;
    const excludedConditionCode = `EXC-${timestamp}`;
    
    await pecFormPage.fillPecForm({
      conditionName: excludedConditionName,
      conditionCode: excludedConditionCode,
      diagnosisDate: '2022-03-10',
      severity: 'Severe',
      status: 'Chronic',
      description: 'Excluded condition - not covered by policy',
      treatment: 'Long-term management',
      doctorName: 'Dr. Specialist',
      hospital: 'Specialist Hospital',
      isExcluded: true
    });

    await pecFormPage.submit();
    await authenticatedPage.waitForTimeout(1000);

    // Verify excluded condition appears
    await expect(authenticatedPage.locator(`td:has-text("${excludedConditionName}")`)).toBeVisible({ timeout: 10000 });
    await expect(authenticatedPage.locator(`td:has-text("${excludedConditionCode}")`)).toBeVisible();
  });

  test('READ: should display PEC details correctly', async ({ authenticatedPage }) => {
    const memberViewPage = new MemberViewPage(authenticatedPage);

    await memberViewPage.goto(memberId);
    await memberViewPage.waitForPageLoad();
    await memberViewPage.clickPecTab();

    // Verify both PEC records are visible
    await expect(authenticatedPage.locator(`td:has-text("${testConditionName}")`)).toBeVisible();
    await expect(authenticatedPage.locator(`td:has-text("${testConditionCode}")`)).toBeVisible();
    
    // Verify excluded condition is marked
    const excludedConditionName = `E2E Excluded ${timestamp}`;
    await expect(authenticatedPage.locator(`td:has-text("${excludedConditionName}")`)).toBeVisible();
  });

  test('UPDATE: should update PEC details', async ({ authenticatedPage }) => {
    const memberViewPage = new MemberViewPage(authenticatedPage);
    const pecFormPage = new MemberPecFormPage(authenticatedPage);

    await memberViewPage.goto(memberId);
    await memberViewPage.waitForPageLoad();
    await memberViewPage.clickPecTab();

    // Edit the PEC
    const row = authenticatedPage.locator(`tr:has-text("${testConditionName}")`);
    await row.locator('button[title*="Edit"], button:has-text("Edit")').click();
    await pecFormPage.waitForPageLoad();

    // Verify current values
    const currentName = await pecFormPage.getConditionName();
    const currentCode = await pecFormPage.getConditionCode();
    expect(currentName).toBe(testConditionName);
    expect(currentCode).toBe(testConditionCode);

    // Update PEC
    await pecFormPage.fillPecForm({
      conditionName: updatedConditionName,
      severity: 'Mild',
      status: 'Recovering',
      treatment: 'Updated treatment plan'
    });

    await pecFormPage.submit();
    await authenticatedPage.waitForTimeout(1000);

    // Verify updated PEC appears
    await expect(authenticatedPage.locator(`td:has-text("${updatedConditionName}")`)).toBeVisible({ timeout: 10000 });
  });

  test('UPDATE: should change exclusion status', async ({ authenticatedPage }) => {
    const memberViewPage = new MemberViewPage(authenticatedPage);
    const pecFormPage = new MemberPecFormPage(authenticatedPage);

    await memberViewPage.goto(memberId);
    await memberViewPage.waitForPageLoad();
    await memberViewPage.clickPecTab();

    // Edit the updated PEC
    const row = authenticatedPage.locator(`tr:has-text("${updatedConditionName}")`);
    await row.locator('button[title*="Edit"], button:has-text("Edit")').click();
    await pecFormPage.waitForPageLoad();

    // Change from not excluded to excluded
    const wasExcluded = await pecFormPage.isExcluded();
    expect(wasExcluded).toBe(false);

    await pecFormPage.fillPecForm({
      isExcluded: true
    });

    await pecFormPage.submit();
    await authenticatedPage.waitForTimeout(1000);

    // Verify the change persisted
    await row.locator('button[title*="Edit"], button:has-text("Edit")').click();
    await pecFormPage.waitForPageLoad();
    
    const isNowExcluded = await pecFormPage.isExcluded();
    expect(isNowExcluded).toBe(true);
    
    await pecFormPage.cancel();
  });

  test('DELETE: should delete PEC successfully', async ({ authenticatedPage }) => {
    const memberViewPage = new MemberViewPage(authenticatedPage);

    await memberViewPage.goto(memberId);
    await memberViewPage.waitForPageLoad();
    await memberViewPage.clickPecTab();

    // Verify PEC exists before delete
    const row = authenticatedPage.locator(`tr:has-text("${updatedConditionName}")`);
    await expect(row).toBeVisible({ timeout: 10000 });

    // Accept confirmation dialog
    authenticatedPage.on('dialog', dialog => dialog.accept());

    // Delete the PEC
    const deleteButton = row.locator('button:has-text("Delete"), button[title*="Delete"]').first();
    await deleteButton.click();
    await authenticatedPage.waitForTimeout(1000);

    // Verify PEC is removed
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
