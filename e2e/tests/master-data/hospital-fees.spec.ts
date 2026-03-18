import { test, expect } from '../../fixtures/auth.fixture';
import { HospitalListPage } from '../../page-objects/master-data/hospital-list.page';
import { HospitalFormPage } from '../../page-objects/master-data/hospital-form.page';
import { HospitalViewPage } from '../../page-objects/master-data/hospital-view.page';
import { HospitalFeeFormPage } from '../../page-objects/master-data/hospital-fee-form.page';

/**
 * Hospital Fees - Sub-form CRUD Operations E2E Tests
 * 
 * Tests hospital service fee management including:
 * - Creating service fees for a hospital
 * - Updating fee amounts
 * - Deleting fees
 * - Service type categorization
 * - Fee effective date tracking
 */

test.describe.serial('Hospital Fees - CRUD Operations', () => {
  const timestamp = Date.now();
  const testHospitalName = `E2E Hospital Fees ${timestamp}`;
  const testHospitalCode = `HFEE${timestamp}`;
  const testFeeDescription = `E2E Service Fee ${timestamp}`;
  const updatedFeeDescription = `E2E Updated Fee ${timestamp}`;
  
  let hospitalId: string;

  test('SETUP: Create a test hospital', async ({ authenticatedPage }) => {
    const hospitalListPage = new HospitalListPage(authenticatedPage);
    const hospitalFormPage = new HospitalFormPage(authenticatedPage);

    await hospitalListPage.goto();
    await hospitalListPage.waitForPageLoad();

    await hospitalListPage.clickCreateHospital();
    await hospitalFormPage.waitForPageLoad();

    await hospitalFormPage.fillHospitalForm({
      hospitalName: testHospitalName,
      hospitalCode: testHospitalCode,
      hospitalType: 'Private',
      isPanel: true
    });

    await hospitalFormPage.submit();
    await hospitalListPage.waitForPageLoad();

    // Get hospital ID
    await hospitalListPage.search(testHospitalCode);
    await authenticatedPage.waitForTimeout(1000);
    
    const viewButton = authenticatedPage.locator(`tr:has-text("${testHospitalCode}") button:has-text("View")`).first();
    await viewButton.click();
    await authenticatedPage.waitForTimeout(1000);
    
    const url = authenticatedPage.url();
    const match = url.match(/\/hospitals\/view\/(\d+)/);
    if (match) {
      hospitalId = match[1];
    }
    
    expect(hospitalId).toBeDefined();
  });

  test('CREATE: should add a new service fee to hospital', async ({ authenticatedPage }) => {
    const hospitalViewPage = new HospitalViewPage(authenticatedPage);
    const feeFormPage = new HospitalFeeFormPage(authenticatedPage);

    await hospitalViewPage.goto(hospitalId);
    await hospitalViewPage.waitForPageLoad();

    // Navigate to Fees tab
    await hospitalViewPage.clickFeesTab();

    // Click Add Fee
    await hospitalViewPage.clickAddFee();
    await feeFormPage.waitForPageLoad();

    // Fill fee form
    await feeFormPage.fillFeeForm({
      serviceType: 'Consultation',
      description: testFeeDescription,
      feeAmount: '150.00',
      currency: 'MYR',
      effectiveDate: '2024-01-01',
      isActive: true,
      remarks: 'E2E test fee'
    });

    await feeFormPage.submit();
    await authenticatedPage.waitForTimeout(1000);

    // Verify fee appears in the table
    await hospitalViewPage.expectFeeVisible(testFeeDescription);
    await expect(authenticatedPage.locator(`td:has-text("150.00")`)).toBeVisible({ timeout: 10000 });
  });

  test('VALIDATION: should validate required fee fields', async ({ authenticatedPage }) => {
    const hospitalViewPage = new HospitalViewPage(authenticatedPage);
    const feeFormPage = new HospitalFeeFormPage(authenticatedPage);

    await hospitalViewPage.goto(hospitalId);
    await hospitalViewPage.waitForPageLoad();
    await hospitalViewPage.clickFeesTab();

    await hospitalViewPage.clickAddFee();
    await feeFormPage.waitForPageLoad();

    // Try to submit without filling required fields
    const isDisabled = await feeFormPage.isSubmitDisabled();
    expect(isDisabled).toBe(true);
  });

  test('CREATE: should add multiple service fees', async ({ authenticatedPage }) => {
    const hospitalViewPage = new HospitalViewPage(authenticatedPage);
    const feeFormPage = new HospitalFeeFormPage(authenticatedPage);

    await hospitalViewPage.goto(hospitalId);
    await hospitalViewPage.waitForPageLoad();
    await hospitalViewPage.clickFeesTab();

    await hospitalViewPage.clickAddFee();
    await feeFormPage.waitForPageLoad();

    // Add second fee - Lab Test
    const secondFeeDescription = `E2E Lab Fee ${timestamp}`;
    await feeFormPage.fillFeeForm({
      serviceType: 'Laboratory',
      description: secondFeeDescription,
      feeAmount: '80.00',
      currency: 'MYR',
      effectiveDate: '2024-01-01',
      isActive: true
    });

    await feeFormPage.submit();
    await authenticatedPage.waitForTimeout(1000);

    // Verify both fees are visible
    await hospitalViewPage.expectFeeVisible(testFeeDescription);
    await hospitalViewPage.expectFeeVisible(secondFeeDescription);
  });

  test('READ: should display fee details correctly', async ({ authenticatedPage }) => {
    const hospitalViewPage = new HospitalViewPage(authenticatedPage);

    await hospitalViewPage.goto(hospitalId);
    await hospitalViewPage.waitForPageLoad();
    await hospitalViewPage.clickFeesTab();

    // Verify fees are displayed with amounts
    await hospitalViewPage.expectFeeVisible(testFeeDescription);
    await expect(authenticatedPage.locator(`td:has-text("150.00")`)).toBeVisible();
    await expect(authenticatedPage.locator(`td:has-text("80.00")`)).toBeVisible();
  });

  test('UPDATE: should update fee details', async ({ authenticatedPage }) => {
    const hospitalViewPage = new HospitalViewPage(authenticatedPage);
    const feeFormPage = new HospitalFeeFormPage(authenticatedPage);

    await hospitalViewPage.goto(hospitalId);
    await hospitalViewPage.waitForPageLoad();
    await hospitalViewPage.clickFeesTab();

    // Edit the fee
    await hospitalViewPage.editFee(testFeeDescription);
    await feeFormPage.waitForPageLoad();

    // Verify current values
    const currentDescription = await feeFormPage.getDescription();
    const currentAmount = await feeFormPage.getFeeAmount();
    expect(currentDescription).toBe(testFeeDescription);
    expect(currentAmount).toBe('150.00');

    // Update fee
    await feeFormPage.fillFeeForm({
      description: updatedFeeDescription,
      feeAmount: '200.00'
    });

    await feeFormPage.submit();
    await authenticatedPage.waitForTimeout(1000);

    // Verify updated fee appears
    await hospitalViewPage.expectFeeVisible(updatedFeeDescription);
    await expect(authenticatedPage.locator(`td:has-text("200.00")`)).toBeVisible({ timeout: 10000 });
  });

  test('DELETE: should delete fee successfully', async ({ authenticatedPage }) => {
    const hospitalViewPage = new HospitalViewPage(authenticatedPage);

    await hospitalViewPage.goto(hospitalId);
    await hospitalViewPage.waitForPageLoad();
    await hospitalViewPage.clickFeesTab();

    // Verify fee exists before delete
    const row = authenticatedPage.locator(`tr:has-text("${updatedFeeDescription}")`);
    await expect(row).toBeVisible({ timeout: 10000 });

    // Accept confirmation dialog
    authenticatedPage.on('dialog', dialog => dialog.accept());

    // Delete the fee
    await hospitalViewPage.deleteFee(updatedFeeDescription);
    await authenticatedPage.waitForTimeout(1000);

    // Verify fee is removed
    await expect(row).not.toBeVisible({ timeout: 5000 });
  });

  test('CLEANUP: Delete test hospital', async ({ authenticatedPage }) => {
    const hospitalListPage = new HospitalListPage(authenticatedPage);

    await hospitalListPage.goto();
    await hospitalListPage.waitForPageLoad();

    await hospitalListPage.search(testHospitalCode);
    await authenticatedPage.waitForTimeout(500);

    const row = authenticatedPage.locator(`tr:has-text("${testHospitalCode}")`);
    await expect(row).toBeVisible({ timeout: 10000 });

    authenticatedPage.on('dialog', dialog => dialog.accept());

    const deleteButton = row.locator('button:has-text("Delete"), button[title*="Delete"]').first();
    await deleteButton.click();
    await authenticatedPage.waitForTimeout(1000);

    await expect(row).not.toBeVisible({ timeout: 5000 });
  });
});
