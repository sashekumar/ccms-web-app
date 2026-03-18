import { test, expect } from '../../fixtures/auth.fixture';
import { MemberListPage } from '../../page-objects/master-data/member-list.page';
import { MemberFormPage } from '../../page-objects/master-data/member-form.page';
import { MemberViewPage } from '../../page-objects/master-data/member-view.page';
import { MemberAddressFormPage } from '../../page-objects/master-data/member-address-form.page';

/**
 * Member Addresses - Sub-form CRUD Operations E2E Tests
 * 
 * Tests member address management including:
 * - Creating addresses for a member
 * - Updating address details
 * - Deleting addresses
 * - Address type validation (Residential, Mailing, etc.)
 * - Primary address management
 */

test.describe.serial('Member Addresses - CRUD Operations', () => {
  const timestamp = Date.now();
  const testMemberName = `E2E Member Addr ${timestamp}`;
  const testMemberIc = `ADDR${timestamp}`;
  const testAddressLine1 = `${timestamp} Test Street`;
  const testCity = `Test City ${timestamp}`;
  const updatedAddressLine1 = `${timestamp} Updated Street`;
  
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

    // Get member ID from URL or search result
    await memberListPage.search(testMemberIc);
    await authenticatedPage.waitForTimeout(1000);
    
    // Click view to get member ID from URL
    const viewButton = authenticatedPage.locator(`tr:has-text("${testMemberIc}") button:has-text("View")`).first();
    await viewButton.click();
    await authenticatedPage.waitForTimeout(1000);
    
    // Extract member ID from URL
    const url = authenticatedPage.url();
    const match = url.match(/\/members\/view\/(\d+)/);
    if (match) {
      memberId = match[1];
    }
    
    expect(memberId).toBeDefined();
  });

  test('CREATE: should add a new address to member', async ({ authenticatedPage }) => {
    const memberViewPage = new MemberViewPage(authenticatedPage);
    const addressFormPage = new MemberAddressFormPage(authenticatedPage);

    await memberViewPage.goto(memberId);
    await memberViewPage.waitForPageLoad();

    // Navigate to Addresses tab
    await memberViewPage.clickAddressesTab();

    // Click Add Address
    await memberViewPage.clickAddAddress();
    await addressFormPage.waitForPageLoad();

    // Fill address form
    await addressFormPage.fillAddressForm({
      addressType: 'Residential',
      addressLine1: testAddressLine1,
      addressLine2: 'Unit 123',
      city: testCity,
      state: 'Selangor',
      postcode: '47000',
      country: 'Malaysia',
      isPrimary: true
    });

    await addressFormPage.submit();
    await authenticatedPage.waitForTimeout(1000);

    // Verify address appears in the table
    await memberViewPage.expectAddressVisible(testAddressLine1);
    await memberViewPage.expectAddressVisible(testCity);
  });

  test('VALIDATION: should validate required address fields', async ({ authenticatedPage }) => {
    const memberViewPage = new MemberViewPage(authenticatedPage);
    const addressFormPage = new MemberAddressFormPage(authenticatedPage);

    await memberViewPage.goto(memberId);
    await memberViewPage.waitForPageLoad();
    await memberViewPage.clickAddressesTab();

    await memberViewPage.clickAddAddress();
    await addressFormPage.waitForPageLoad();

    // Try to submit without filling required fields
    const isDisabled = await addressFormPage.isSubmitDisabled();
    expect(isDisabled).toBe(true);
  });

  test('READ: should display address details correctly', async ({ authenticatedPage }) => {
    const memberViewPage = new MemberViewPage(authenticatedPage);

    await memberViewPage.goto(memberId);
    await memberViewPage.waitForPageLoad();
    await memberViewPage.clickAddressesTab();

    // Verify created address is visible
    await memberViewPage.expectAddressVisible(testAddressLine1);
    await memberViewPage.expectAddressVisible(testCity);
    await memberViewPage.expectAddressVisible('47000'); // Postcode
  });

  test('UPDATE: should update address details', async ({ authenticatedPage }) => {
    const memberViewPage = new MemberViewPage(authenticatedPage);
    const addressFormPage = new MemberAddressFormPage(authenticatedPage);

    await memberViewPage.goto(memberId);
    await memberViewPage.waitForPageLoad();
    await memberViewPage.clickAddressesTab();

    // Edit the address
    await memberViewPage.editAddress(testAddressLine1);
    await addressFormPage.waitForPageLoad();

    // Verify current values
    const currentAddressLine1 = await addressFormPage.getAddressLine1();
    expect(currentAddressLine1).toContain(String(timestamp));

    // Update address
    await addressFormPage.fillAddressForm({
      addressLine1: updatedAddressLine1,
      city: `${testCity} Updated`
    });

    await addressFormPage.submit();
    await authenticatedPage.waitForTimeout(1000);

    // Verify updated address appears
    await memberViewPage.expectAddressVisible(updatedAddressLine1);
  });

  test('DELETE: should delete address successfully', async ({ authenticatedPage }) => {
    const memberViewPage = new MemberViewPage(authenticatedPage);

    await memberViewPage.goto(memberId);
    await memberViewPage.waitForPageLoad();
    await memberViewPage.clickAddressesTab();

    // Verify address exists before delete
    const row = authenticatedPage.locator(`tr:has-text("${updatedAddressLine1}")`);
    await expect(row).toBeVisible({ timeout: 10000 });

    // Accept confirmation dialog
    authenticatedPage.on('dialog', dialog => dialog.accept());

    // Delete the address
    await memberViewPage.deleteAddress(updatedAddressLine1);
    await authenticatedPage.waitForTimeout(1000);

    // Verify address is removed
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
