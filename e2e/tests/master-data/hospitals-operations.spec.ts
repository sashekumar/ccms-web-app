import { test, expect } from '../../fixtures/auth.fixture';
import { HospitalListPage } from '../../page-objects/master-data/hospital-list.page';
import { HospitalFormPage } from '../../page-objects/master-data/hospital-form.page';

/**
 * Hospital Management - CRUD Operations E2E Tests
 * 
 * Tests hospital management including:
 * - Creating hospitals
 * - Updating hospital details
 * - Deleting hospitals
 * - Validation and search functionality
 */

test.describe.serial('Hospital Management - CRUD Operations', () => {
  const timestamp = Date.now();
  const testHospitalCode = `E2E_HSP_${timestamp}`;
  const testHospitalName = `E2E Hospital ${timestamp}`;
  const updatedHospitalName = `E2E Hospital Updated ${timestamp}`;

  test('CREATE: should create a new hospital successfully', async ({ authenticatedPage }) => {
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

    await hospitalListPage.search(testHospitalCode);
    await authenticatedPage.waitForTimeout(500);

    await hospitalListPage.expectHospitalVisible(testHospitalCode);
    await hospitalListPage.expectHospitalVisible(testHospitalName);
  });

  test('VALIDATION: should validate required fields', async ({ authenticatedPage }) => {
    const hospitalListPage = new HospitalListPage(authenticatedPage);
    const hospitalFormPage = new HospitalFormPage(authenticatedPage);

    await hospitalListPage.goto();
    await hospitalListPage.waitForPageLoad();

    await hospitalListPage.clickCreateHospital();
    await hospitalFormPage.waitForPageLoad();

    const isDisabled = await hospitalFormPage.isSubmitDisabled();
    expect(isDisabled).toBe(true);
  });

  test('READ: should display hospital details correctly', async ({ authenticatedPage }) => {
    const hospitalListPage = new HospitalListPage(authenticatedPage);

    await hospitalListPage.goto();
    await hospitalListPage.waitForPageLoad();

    await hospitalListPage.search(testHospitalCode);
    await authenticatedPage.waitForTimeout(500);

    await hospitalListPage.expectHospitalVisible(testHospitalCode);
    await hospitalListPage.expectHospitalVisible(testHospitalName);
  });

  test('UPDATE: should update hospital details successfully', async ({ authenticatedPage }) => {
    const hospitalListPage = new HospitalListPage(authenticatedPage);
    const hospitalFormPage = new HospitalFormPage(authenticatedPage);

    await hospitalListPage.goto();
    await hospitalListPage.waitForPageLoad();

    await hospitalListPage.search(testHospitalCode);
    await authenticatedPage.waitForTimeout(500);

    await hospitalListPage.clickEdit(testHospitalCode);
    await hospitalFormPage.waitForPageLoad();

    const currentName = await hospitalFormPage.getHospitalName();
    expect(currentName).toBe(testHospitalName);

    await hospitalFormPage.fillHospitalForm({
      hospitalName: updatedHospitalName
    });

    await hospitalFormPage.submit();
    await hospitalListPage.waitForPageLoad();

    await hospitalListPage.search(testHospitalCode);
    await authenticatedPage.waitForTimeout(500);

    await hospitalListPage.expectHospitalVisible(updatedHospitalName);
  });

  test('DELETE: should delete hospital successfully', async ({ authenticatedPage }) => {
    const hospitalListPage = new HospitalListPage(authenticatedPage);

    await hospitalListPage.goto();
    await hospitalListPage.waitForPageLoad();

    await hospitalListPage.search(testHospitalCode);
    await authenticatedPage.waitForTimeout(500);

    // Verify test data exists before delete
    const row = authenticatedPage.locator(`tr:has-text("${testHospitalCode}")`);
    await expect(row).toBeVisible({ timeout: 10000 });

    authenticatedPage.on('dialog', dialog => dialog.accept());

    const deleteButton = row.locator('button:has-text("Delete"), button[title*="Delete"]').first();
    await deleteButton.click();

    await authenticatedPage.waitForTimeout(1000);

    await hospitalListPage.expectHospitalNotVisible(testHospitalCode);
  });
});
