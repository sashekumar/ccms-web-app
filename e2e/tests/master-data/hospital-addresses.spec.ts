import { test, expect } from '../../fixtures/auth.fixture';
import { HospitalListPage } from '../../page-objects/master-data/hospital-list.page';
import { HospitalFormPage } from '../../page-objects/master-data/hospital-form.page';
import { HospitalViewPage } from '../../page-objects/master-data/hospital-view.page';
import { HospitalAddressFormPage } from '../../page-objects/master-data/hospital-address-form.page';

/**
 * Hospital Addresses - Sub-form CRUD Operations E2E Tests
 *
 * Tests hospital address management including:
 * - Adding hospital addresses (multiple address types)
 * - Setting primary address
 * - Updating address details
 * - Deleting addresses
 * - Address type categorization
 *
 * Card-based UI Pattern: Addresses render as div.rounded-lg cards in grid layout
 * Form Pattern: Inline forms toggled via *ngIf visibility
 * Dialog Pattern: Angular ConfirmDialogComponent with confirmLabel binding
 */

test.describe.serial('Hospital Addresses - CRUD Operations', () => {
  const timestamp = Date.now();
  const tsShort = timestamp.toString().slice(-12);
  const testHospitalName = `E2E Hospital Addresses ${tsShort}`;
  const testHospitalCode = `HADDR${tsShort}`;
  const testStreet1 = `123 Medical Lane ${tsShort}`;
  const updatedStreet1 = `456 Healthcare Ave ${tsShort}`;

  let hospitalId: string;

  // -----------------------------------------------------------------------
  // SETUP
  // -----------------------------------------------------------------------
  test('SETUP: Create a test hospital', async ({ authenticatedPage }) => {
    const listPage = new HospitalListPage(authenticatedPage);
    const formPage = new HospitalFormPage(authenticatedPage);

    await listPage.goto();
    await listPage.waitForPageLoad();

    await listPage.clickCreateHospital();
    await formPage.waitForPageLoad();

    await formPage.fillHospitalForm({
      hospitalName: testHospitalName,
      hospitalCode: testHospitalCode,
    });

    await formPage.submit();
    await listPage.waitForPageLoad();

    // Search for the hospital and navigate to view page to get ID
    await listPage.search(testHospitalCode);
    await authenticatedPage.waitForTimeout(600);
    await listPage.clickView(testHospitalCode);
    await authenticatedPage.waitForTimeout(800);

    // Extract hospital ID from URL
    const url = authenticatedPage.url();
    const match = url.match(/\/hospitals\/view\/(\d+)/);
    hospitalId = match ? match[1] : '';
    expect(hospitalId).toBeTruthy();
  });

  // -----------------------------------------------------------------------
  // VALIDATION
  // -----------------------------------------------------------------------
  test('VALIDATION: should not allow submit without required fields', async ({ authenticatedPage }) => {
    const viewPage = new HospitalViewPage(authenticatedPage);
    const addrFormPage = new HospitalAddressFormPage(authenticatedPage);

    await viewPage.goto(hospitalId);
    await viewPage.waitForPageLoad();
    await viewPage.clickAddressesTab();
    await viewPage.clickAddAddress();
    await addrFormPage.waitForFormVisible();

    // Try to submit without filling required fields
    const isDisabled = await addrFormPage.isSubmitDisabled();
    expect(isDisabled).toBe(true);
  });

  // -----------------------------------------------------------------------
  // ADD ADDRESS
  // -----------------------------------------------------------------------
  test('ADD_ADDRESS: should add a new address successfully', async ({ authenticatedPage }) => {
    const viewPage = new HospitalViewPage(authenticatedPage);
    const addrFormPage = new HospitalAddressFormPage(authenticatedPage);

    await viewPage.goto(hospitalId);
    await viewPage.waitForPageLoad();
    await viewPage.clickAddressesTab();
    await viewPage.clickAddAddress();
    await addrFormPage.waitForFormVisible();

    await addrFormPage.fillAddressForm({
      addressType: 'Official',
      streetLine1: testStreet1,
      city: 'Kuala Lumpur',
      state: 'Federal Territory',
      country: 'Malaysia',
      isPrimary: true,
    });

    await addrFormPage.submit();
    await authenticatedPage.waitForTimeout(600);

    // Verify address card is visible
    await viewPage.expectAddressVisible(testStreet1);
  });

  // -----------------------------------------------------------------------
  // READ
  // -----------------------------------------------------------------------
  test('READ: should display address details correctly', async ({ authenticatedPage }) => {
    const viewPage = new HospitalViewPage(authenticatedPage);

    await viewPage.goto(hospitalId);
    await viewPage.waitForPageLoad();
    await viewPage.clickAddressesTab();

    // Verify address is visible
    await viewPage.expectAddressVisible(testStreet1);
  });

  // -----------------------------------------------------------------------
  // PRIMARY TOGGLE
  // -----------------------------------------------------------------------
  test('PRIMARY_TOGGLE: should toggle primary address status via confirm dialog', async ({ authenticatedPage }) => {
    const viewPage = new HospitalViewPage(authenticatedPage);

    await viewPage.goto(hospitalId);
    await viewPage.waitForPageLoad();
    await viewPage.clickAddressesTab();

    // Toggle primary status
    await viewPage.toggleAddressPrimary(testStreet1);
    // Confirm via Angular ConfirmDialogComponent (confirmLabel="Confirm")
    await viewPage.confirmDialog();

    await authenticatedPage.waitForTimeout(600);

    // Verify the toggle was successful (address still visible)
    await viewPage.expectAddressVisible(testStreet1);
  });

  // -----------------------------------------------------------------------
  // ADD SECOND ADDRESS
  // -----------------------------------------------------------------------
  test('ADD_SECOND: should add a second address for edit/delete', async ({ authenticatedPage }) => {
    const viewPage = new HospitalViewPage(authenticatedPage);
    const addrFormPage = new HospitalAddressFormPage(authenticatedPage);

    await viewPage.goto(hospitalId);
    await viewPage.waitForPageLoad();
    await viewPage.clickAddressesTab();
    await viewPage.clickAddAddress();
    await addrFormPage.waitForFormVisible();

    const secondStreet = `999 Alternative Street ${tsShort}`;
    await addrFormPage.fillAddressForm({
      addressType: 'Billing',
      streetLine1: secondStreet,
      city: 'Petaling Jaya',
      state: 'Selangor',
      country: 'Malaysia',
      isPrimary: false,
    });

    await addrFormPage.submit();
    await authenticatedPage.waitForTimeout(600);

    await viewPage.expectAddressVisible(secondStreet);
  });

  // -----------------------------------------------------------------------
  // EDIT
  // -----------------------------------------------------------------------
  test('EDIT: should update address details successfully', async ({ authenticatedPage }) => {
    const viewPage = new HospitalViewPage(authenticatedPage);
    const addrFormPage = new HospitalAddressFormPage(authenticatedPage);

    await viewPage.goto(hospitalId);
    await viewPage.waitForPageLoad();
    await viewPage.clickAddressesTab();

    // Edit first address
    await viewPage.editAddress(testStreet1);
    await addrFormPage.waitForFormVisible();

    // Verify pre-filled value
    const currentStreet = await addrFormPage.getStreetLine1();
    expect(currentStreet).toContain(testStreet1.substr(0, 5));

    // Update address
    await addrFormPage.fillAddressForm({
      streetLine1: updatedStreet1,
    });

    await addrFormPage.submit();
    await authenticatedPage.waitForTimeout(600);

    // Verify old address is no longer visible
    await viewPage.expectAddressNotVisible(testStreet1);

    // Verify updated address is visible
    await viewPage.expectAddressVisible(updatedStreet1);
  });

  // -----------------------------------------------------------------------
  // DELETE
  // -----------------------------------------------------------------------
  test('DELETE: should delete an address via confirm dialog', async ({ authenticatedPage }) => {
    const viewPage = new HospitalViewPage(authenticatedPage);

    await viewPage.goto(hospitalId);
    await viewPage.waitForPageLoad();
    await viewPage.clickAddressesTab();

    const secondStreet = `999 Alternative Street ${tsShort}`;

    // Delete second address
    await viewPage.deleteAddress(secondStreet);
    // Confirm via Angular ConfirmDialogComponent (confirmLabel="Delete")
    await viewPage.confirmDialog();

    await authenticatedPage.waitForTimeout(600);

    // Verify address is no longer visible
    await viewPage.expectAddressNotVisible(secondStreet);
  });

  // -----------------------------------------------------------------------
  // CLEANUP
  // -----------------------------------------------------------------------
  test('CLEANUP: Delete test hospital', async ({ authenticatedPage }) => {
    const listPage = new HospitalListPage(authenticatedPage);

    await listPage.goto();
    await listPage.waitForPageLoad();

    // Search for the test hospital
    const hospitalRow = authenticatedPage.locator(`tr:has-text("${testHospitalCode}")`);
    await expect(hospitalRow).toBeVisible({ timeout: 10000 });

    // Delete via the tr row button
    const deleteButton = hospitalRow.locator('button:has-text("Delete"), button[title*="Delete"]').first();
    await deleteButton.click();

    // Confirm deletion via ConfirmDialog
    await authenticatedPage.getByRole('button', { name: /^Delete$/i }).click();
    await authenticatedPage.waitForTimeout(1000);

    // Verify hospital is deleted
    await expect(hospitalRow).not.toBeVisible({ timeout: 5000 });
  });
});
