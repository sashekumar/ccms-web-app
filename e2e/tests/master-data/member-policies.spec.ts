import { test, expect } from '../../fixtures/auth.fixture';
import { MemberListPage } from '../../page-objects/master-data/member-list.page';
import { MemberFormPage } from '../../page-objects/master-data/member-form.page';
import { MemberViewPage } from '../../page-objects/master-data/member-view.page';
import { MemberPolicyFormPage } from '../../page-objects/master-data/member-policy-form.page';

/**
 * Member Policies - Sub-form CRUD Operations E2E Tests
 * 
 * Tests member policy assignment management including:
 * - Creating policy assignments for a member
 * - Updating policy details
 * - Deleting policy assignments
 * - Policy status management (Active, Expired, Cancelled)
 * - Coverage and premium tracking
 */

test.describe.serial('Member Policies - CRUD Operations', () => {
  const timestamp = Date.now();
  const testMemberName = `E2E Member Policy ${timestamp}`;
  const testMemberIc = `POL${timestamp}`;
  const testPolicyNumber = `POL-${timestamp}`;
  const updatedPolicyNumber = `POL-UPD-${timestamp}`;
  
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

  test('CREATE: should assign a new policy to member', async ({ authenticatedPage }) => {
    const memberViewPage = new MemberViewPage(authenticatedPage);
    const policyFormPage = new MemberPolicyFormPage(authenticatedPage);

    await memberViewPage.goto(memberId);
    await memberViewPage.waitForPageLoad();

    // Navigate to Policies tab
    await memberViewPage.clickPoliciesTab();

    // Click Add Policy
    await memberViewPage.clickAddPolicy();
    await policyFormPage.waitForPageLoad();

    // Fill policy form
    await policyFormPage.fillPolicyForm({
      product: 'Medical Card',
      policyNumber: testPolicyNumber,
      effectiveDate: '2024-01-01',
      expiryDate: '2024-12-31',
      policyStatus: 'Active',
      premiumAmount: '5000.00',
      coverageAmount: '100000.00',
      remarks: 'E2E Test Policy'
    });

    await policyFormPage.submit();
    await authenticatedPage.waitForTimeout(1000);

    // Verify policy appears in the table
    await expect(authenticatedPage.locator(`td:has-text("${testPolicyNumber}")`)).toBeVisible({ timeout: 10000 });
  });

  test('VALIDATION: should validate required policy fields', async ({ authenticatedPage }) => {
    const memberViewPage = new MemberViewPage(authenticatedPage);
    const policyFormPage = new MemberPolicyFormPage(authenticatedPage);

    await memberViewPage.goto(memberId);
    await memberViewPage.waitForPageLoad();
    await memberViewPage.clickPoliciesTab();

    await memberViewPage.clickAddPolicy();
    await policyFormPage.waitForPageLoad();

    // Try to submit without filling required fields
    const isDisabled = await policyFormPage.isSubmitDisabled();
    expect(isDisabled).toBe(true);
  });

  test('READ: should display policy details correctly', async ({ authenticatedPage }) => {
    const memberViewPage = new MemberViewPage(authenticatedPage);

    await memberViewPage.goto(memberId);
    await memberViewPage.waitForPageLoad();
    await memberViewPage.clickPoliciesTab();

    // Verify created policy is visible
    await expect(authenticatedPage.locator(`td:has-text("${testPolicyNumber}")`)).toBeVisible();
    await expect(authenticatedPage.locator(`td:has-text("5000.00")`)).toBeVisible(); // Premium
    await expect(authenticatedPage.locator(`td:has-text("100000.00")`)).toBeVisible(); // Coverage
  });

  test('UPDATE: should update policy details', async ({ authenticatedPage }) => {
    const memberViewPage = new MemberViewPage(authenticatedPage);
    const policyFormPage = new MemberPolicyFormPage(authenticatedPage);

    await memberViewPage.goto(memberId);
    await memberViewPage.waitForPageLoad();
    await memberViewPage.clickPoliciesTab();

    // Edit the policy
    const row = authenticatedPage.locator(`tr:has-text("${testPolicyNumber}")`);
    await row.locator('button[title*="Edit"], button:has-text("Edit")').click();
    await policyFormPage.waitForPageLoad();

    // Verify current values
    const currentPolicyNumber = await policyFormPage.getPolicyNumber();
    expect(currentPolicyNumber).toBe(testPolicyNumber);

    // Update policy
    await policyFormPage.fillPolicyForm({
      policyNumber: updatedPolicyNumber,
      premiumAmount: '6000.00',
      coverageAmount: '150000.00',
      policyStatus: 'Active'
    });

    await policyFormPage.submit();
    await authenticatedPage.waitForTimeout(1000);

    // Verify updated policy appears
    await expect(authenticatedPage.locator(`td:has-text("${updatedPolicyNumber}")`)).toBeVisible({ timeout: 10000 });
    await expect(authenticatedPage.locator(`td:has-text("6000.00")`)).toBeVisible();
  });

  test('CREATE: should assign multiple policies to member', async ({ authenticatedPage }) => {
    const memberViewPage = new MemberViewPage(authenticatedPage);
    const policyFormPage = new MemberPolicyFormPage(authenticatedPage);

    await memberViewPage.goto(memberId);
    await memberViewPage.waitForPageLoad();
    await memberViewPage.clickPoliciesTab();

    await memberViewPage.clickAddPolicy();
    await policyFormPage.waitForPageLoad();

    // Add second policy
    const secondPolicyNumber = `POL2-${timestamp}`;
    await policyFormPage.fillPolicyForm({
      product: 'Personal Accident',
      policyNumber: secondPolicyNumber,
      effectiveDate: '2024-01-01',
      expiryDate: '2024-12-31',
      policyStatus: 'Active',
      premiumAmount: '1200.00',
      coverageAmount: '50000.00'
    });

    await policyFormPage.submit();
    await authenticatedPage.waitForTimeout(1000);

    // Verify both policies are visible
    await expect(authenticatedPage.locator(`td:has-text("${updatedPolicyNumber}")`)).toBeVisible();
    await expect(authenticatedPage.locator(`td:has-text("${secondPolicyNumber}")`)).toBeVisible();
  });

  test('DELETE: should delete policy assignment successfully', async ({ authenticatedPage }) => {
    const memberViewPage = new MemberViewPage(authenticatedPage);

    await memberViewPage.goto(memberId);
    await memberViewPage.waitForPageLoad();
    await memberViewPage.clickPoliciesTab();

    // Verify policy exists before delete
    const row = authenticatedPage.locator(`tr:has-text("${updatedPolicyNumber}")`);
    await expect(row).toBeVisible({ timeout: 10000 });

    // Accept confirmation dialog
    authenticatedPage.on('dialog', dialog => dialog.accept());

    // Delete the policy
    const deleteButton = row.locator('button:has-text("Delete"), button[title*="Delete"]').first();
    await deleteButton.click();
    await authenticatedPage.waitForTimeout(1000);

    // Verify policy is removed
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
