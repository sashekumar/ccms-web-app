import { test, expect } from '../../fixtures/auth.fixture';
import { HospitalListPage } from '../../page-objects/master-data/hospital-list.page';
import { HospitalFormPage } from '../../page-objects/master-data/hospital-form.page';
import { HospitalViewPage } from '../../page-objects/master-data/hospital-view.page';
import { HospitalStaffFormPage } from '../../page-objects/master-data/hospital-staff-form.page';

/**
 * Hospital Staff - Sub-form CRUD Operations E2E Tests
 * 
 * Tests hospital staff management including:
 * - Creating staff members for a hospital
 * - Updating staff details
 * - Deleting staff members
 * - Position and department tracking
 * - License number validation
 */

test.describe.serial('Hospital Staff - CRUD Operations', () => {
  const timestamp = Date.now();
  const testHospitalName = `E2E Hospital Staff ${timestamp}`;
  const testHospitalCode = `HSTF${timestamp}`;
  const testStaffName = `Dr. E2E Test ${timestamp}`;
  const updatedStaffName = `Dr. E2E Updated ${timestamp}`;
  
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

  test('CREATE: should add a new staff member to hospital', async ({ authenticatedPage }) => {
    const hospitalViewPage = new HospitalViewPage(authenticatedPage);
    const staffFormPage = new HospitalStaffFormPage(authenticatedPage);

    await hospitalViewPage.goto(hospitalId);
    await hospitalViewPage.waitForPageLoad();

    // Navigate to Staff tab
    await hospitalViewPage.clickStaffTab();

    // Click Add Staff
    await hospitalViewPage.clickAddStaff();
    await staffFormPage.waitForPageLoad();

    // Fill staff form
    await staffFormPage.fillStaffForm({
      staffName: testStaffName,
      position: 'Cardiologist',
      department: 'Cardiology',
      specialization: 'Interventional Cardiology',
      email: `staff${timestamp}@hospital.com`,
      phone: `+6012${timestamp.toString().slice(-7)}`,
      licenseNumber: `MED-${timestamp}`,
      isActive: true
    });

    await staffFormPage.submit();
    await authenticatedPage.waitForTimeout(1000);

    // Verify staff appears in the table
    await hospitalViewPage.expectStaffVisible(testStaffName);
  });

  test('VALIDATION: should validate required staff fields', async ({ authenticatedPage }) => {
    const hospitalViewPage = new HospitalViewPage(authenticatedPage);
    const staffFormPage = new HospitalStaffFormPage(authenticatedPage);

    await hospitalViewPage.goto(hospitalId);
    await hospitalViewPage.waitForPageLoad();
    await hospitalViewPage.clickStaffTab();

    await hospitalViewPage.clickAddStaff();
    await staffFormPage.waitForPageLoad();

    // Try to submit without filling required fields
    const isDisabled = await staffFormPage.isSubmitDisabled();
    expect(isDisabled).toBe(true);
  });

  test('READ: should display staff details correctly', async ({ authenticatedPage }) => {
    const hospitalViewPage = new HospitalViewPage(authenticatedPage);

    await hospitalViewPage.goto(hospitalId);
    await hospitalViewPage.waitForPageLoad();
    await hospitalViewPage.clickStaffTab();

    // Verify created staff is visible
    await hospitalViewPage.expectStaffVisible(testStaffName);
    await expect(authenticatedPage.locator(`td:has-text("Cardiologist")`)).toBeVisible();
    await expect(authenticatedPage.locator(`td:has-text("Cardiology")`)).toBeVisible();
  });

  test('UPDATE: should update staff details', async ({ authenticatedPage }) => {
    const hospitalViewPage = new HospitalViewPage(authenticatedPage);
    const staffFormPage = new HospitalStaffFormPage(authenticatedPage);

    await hospitalViewPage.goto(hospitalId);
    await hospitalViewPage.waitForPageLoad();
    await hospitalViewPage.clickStaffTab();

    // Edit the staff
    await hospitalViewPage.editStaff(testStaffName);
    await staffFormPage.waitForPageLoad();

    // Verify current values
    const currentName = await staffFormPage.getStaffName();
    expect(currentName).toBe(testStaffName);

    // Update staff
    await staffFormPage.fillStaffForm({
      staffName: updatedStaffName,
      position: 'Senior Cardiologist',
      department: 'Cardiology - ICU'
    });

    await staffFormPage.submit();
    await authenticatedPage.waitForTimeout(1000);

    // Verify updated staff appears
    await hospitalViewPage.expectStaffVisible(updatedStaffName);
    await expect(authenticatedPage.locator(`td:has-text("Senior Cardiologist")`)).toBeVisible();
  });

  test('DELETE: should delete staff member successfully', async ({ authenticatedPage }) => {
    const hospitalViewPage = new HospitalViewPage(authenticatedPage);

    await hospitalViewPage.goto(hospitalId);
    await hospitalViewPage.waitForPageLoad();
    await hospitalViewPage.clickStaffTab();

    // Verify staff exists before delete
    const row = authenticatedPage.locator(`tr:has-text("${updatedStaffName}")`);
    await expect(row).toBeVisible({ timeout: 10000 });

    // Accept confirmation dialog
    authenticatedPage.on('dialog', dialog => dialog.accept());

    // Delete the staff
    await hospitalViewPage.deleteStaff(updatedStaffName);
    await authenticatedPage.waitForTimeout(1000);

    // Verify staff is removed
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
