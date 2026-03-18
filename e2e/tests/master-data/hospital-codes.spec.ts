import { test, expect } from '../../fixtures/auth.fixture';
import { HospitalListPage } from '../../page-objects/master-data/hospital-list.page';
import { HospitalFormPage } from '../../page-objects/master-data/hospital-form.page';
import { HospitalViewPage } from '../../page-objects/master-data/hospital-view.page';
import { HospitalCodeFormPage } from '../../page-objects/master-data/hospital-code-form.page';

/**
 * Hospital Codes - Sub-form CRUD Operations E2E Tests
 * 
 * Tests hospital coding system management including:
 * - Creating hospital codes (ICD-10, CPT, etc.)
 * - Updating code details
 * - Deleting codes
 * - Code system categorization
 * - Code type classification
 */

test.describe.serial('Hospital Codes - CRUD Operations', () => {
  const timestamp = Date.now();
  const testHospitalName = `E2E Hospital Codes ${timestamp}`;
  const testHospitalCode = `HCOD${timestamp}`;
  const testCodeValue = `E2E-${timestamp}`;
  const updatedCodeValue = `E2E-UPD-${timestamp}`;
  
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

  test('CREATE: should add a new code to hospital', async ({ authenticatedPage }) => {
    const hospitalViewPage = new HospitalViewPage(authenticatedPage);
    const codeFormPage = new HospitalCodeFormPage(authenticatedPage);

    await hospitalViewPage.goto(hospitalId);
    await hospitalViewPage.waitForPageLoad();

    // Navigate to Codes tab
    await hospitalViewPage.clickCodesTab();

    // Click Add Code
    await hospitalViewPage.clickAddCode();
    await codeFormPage.waitForPageLoad();

    // Fill code form - ICD-10
    await codeFormPage.fillCodeForm({
      codeSystem: 'ICD-10',
      codeValue: testCodeValue,
      description: 'E2E Test Diagnosis Code',
      codeType: 'Diagnosis',
      isActive: true,
      remarks: 'E2E test code'
    });

    await codeFormPage.submit();
    await authenticatedPage.waitForTimeout(1000);

    // Verify code appears in the table
    await hospitalViewPage.expectCodeVisible(testCodeValue);
  });

  test('CREATE: should add CPT procedure code', async ({ authenticatedPage }) => {
    const hospitalViewPage = new HospitalViewPage(authenticatedPage);
    const codeFormPage = new HospitalCodeFormPage(authenticatedPage);

    await hospitalViewPage.goto(hospitalId);
    await hospitalViewPage.waitForPageLoad();
    await hospitalViewPage.clickCodesTab();

    await hospitalViewPage.clickAddCode();
    await codeFormPage.waitForPageLoad();

    // Add CPT code
    const cptCodeValue = `CPT-${timestamp}`;
    await codeFormPage.fillCodeForm({
      codeSystem: 'CPT',
      codeValue: cptCodeValue,
      description: 'E2E Test Procedure Code',
      codeType: 'Procedure',
      isActive: true
    });

    await codeFormPage.submit();
    await authenticatedPage.waitForTimeout(1000);

    // Verify CPT code appears
    await hospitalViewPage.expectCodeVisible(cptCodeValue);
  });

  test('VALIDATION: should validate required code fields', async ({ authenticatedPage }) => {
    const hospitalViewPage = new HospitalViewPage(authenticatedPage);
    const codeFormPage = new HospitalCodeFormPage(authenticatedPage);

    await hospitalViewPage.goto(hospitalId);
    await hospitalViewPage.waitForPageLoad();
    await hospitalViewPage.clickCodesTab();

    await hospitalViewPage.clickAddCode();
    await codeFormPage.waitForPageLoad();

    // Try to submit without filling required fields
    const isDisabled = await codeFormPage.isSubmitDisabled();
    expect(isDisabled).toBe(true);
  });

  test('READ: should display code details correctly', async ({ authenticatedPage }) => {
    const hospitalViewPage = new HospitalViewPage(authenticatedPage);

    await hospitalViewPage.goto(hospitalId);
    await hospitalViewPage.waitForPageLoad();
    await hospitalViewPage.clickCodesTab();

    // Verify both codes are visible
    await hospitalViewPage.expectCodeVisible(testCodeValue);
    await expect(authenticatedPage.locator(`td:has-text("ICD-10")`)).toBeVisible();
    await expect(authenticatedPage.locator(`td:has-text("CPT")`)).toBeVisible();
  });

  test('UPDATE: should update code details', async ({ authenticatedPage }) => {
    const hospitalViewPage = new HospitalViewPage(authenticatedPage);
    const codeFormPage = new HospitalCodeFormPage(authenticatedPage);

    await hospitalViewPage.goto(hospitalId);
    await hospitalViewPage.waitForPageLoad();
    await hospitalViewPage.clickCodesTab();

    // Edit the code
    const row = authenticatedPage.locator(`tr:has-text("${testCodeValue}")`);
    await row.locator('button[title*="Edit"], button:has-text("Edit")').click();
    await codeFormPage.waitForPageLoad();

    // Verify current value
    const currentValue = await codeFormPage.getCodeValue();
    expect(currentValue).toBe(testCodeValue);

    // Update code
    await codeFormPage.fillCodeForm({
      codeValue: updatedCodeValue,
      description: 'E2E Updated Diagnosis Code'
    });

    await codeFormPage.submit();
    await authenticatedPage.waitForTimeout(1000);

    // Verify updated code appears
    await hospitalViewPage.expectCodeVisible(updatedCodeValue);
  });

  test('DELETE: should delete code successfully', async ({ authenticatedPage }) => {
    const hospitalViewPage = new HospitalViewPage(authenticatedPage);

    await hospitalViewPage.goto(hospitalId);
    await hospitalViewPage.waitForPageLoad();
    await hospitalViewPage.clickCodesTab();

    // Verify code exists before delete
    const row = authenticatedPage.locator(`tr:has-text("${updatedCodeValue}")`);
    await expect(row).toBeVisible({ timeout: 10000 });

    // Accept confirmation dialog
    authenticatedPage.on('dialog', dialog => dialog.accept());

    // Delete the code
    const deleteButton = row.locator('button:has-text("Delete"), button[title*="Delete"]').first();
    await deleteButton.click();
    await authenticatedPage.waitForTimeout(1000);

    // Verify code is removed
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
