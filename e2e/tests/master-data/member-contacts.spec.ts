import { test, expect } from '../../fixtures/auth.fixture';
import { MemberListPage } from '../../page-objects/master-data/member-list.page';
import { MemberFormPage } from '../../page-objects/master-data/member-form.page';
import { MemberViewPage } from '../../page-objects/master-data/member-view.page';
import { MemberContactFormPage } from '../../page-objects/master-data/member-contact-form.page';

/**
 * Member Contacts - Sub-form CRUD Operations E2E Tests
 * 
 * Tests member contact management including:
 * - Creating contacts for a member
 * - Updating contact details
 * - Deleting contacts
 * - Contact type validation (Phone, Email, Mobile, etc.)
 * - Primary and emergency contact management
 */

test.describe.serial('Member Contacts - CRUD Operations', () => {
  const timestamp = Date.now();
  const testMemberName = `E2E Member Contact ${timestamp}`;
  const testMemberIc = `CONT${timestamp}`;
  const testPhoneNumber = `+6012${timestamp.toString().slice(-7)}`;
  const testEmailAddress = `member${timestamp}@test.com`;
  const updatedPhoneNumber = `+6019${timestamp.toString().slice(-7)}`;
  
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

  test('CREATE: should add a phone contact to member', async ({ authenticatedPage }) => {
    const memberViewPage = new MemberViewPage(authenticatedPage);
    const contactFormPage = new MemberContactFormPage(authenticatedPage);

    await memberViewPage.goto(memberId);
    await memberViewPage.waitForPageLoad();

    // Navigate to Contacts tab
    await memberViewPage.clickContactsTab();

    // Click Add Contact
    await memberViewPage.clickAddContact();
    await contactFormPage.waitForPageLoad();

    // Fill contact form - Phone
    await contactFormPage.fillContactForm({
      contactType: 'Mobile',
      contactValue: testPhoneNumber,
      contactName: 'John Doe',
      relationship: 'Self',
      isPrimary: true,
      isEmergency: false
    });

    await contactFormPage.submit();
    await authenticatedPage.waitForTimeout(1000);

    // Verify contact appears in the table
    await memberViewPage.expectContactVisible(testPhoneNumber);
  });

  test('CREATE: should add an email contact to member', async ({ authenticatedPage }) => {
    const memberViewPage = new MemberViewPage(authenticatedPage);
    const contactFormPage = new MemberContactFormPage(authenticatedPage);

    await memberViewPage.goto(memberId);
    await memberViewPage.waitForPageLoad();
    await memberViewPage.clickContactsTab();

    await memberViewPage.clickAddContact();
    await contactFormPage.waitForPageLoad();

    // Fill contact form - Email
    await contactFormPage.fillContactForm({
      contactType: 'Email',
      contactValue: testEmailAddress,
      contactName: 'John Doe',
      relationship: 'Self',
      isPrimary: true,
      isEmergency: false
    });

    await contactFormPage.submit();
    await authenticatedPage.waitForTimeout(1000);

    // Verify contact appears
    await memberViewPage.expectContactVisible(testEmailAddress);
  });

  test('VALIDATION: should validate required contact fields', async ({ authenticatedPage }) => {
    const memberViewPage = new MemberViewPage(authenticatedPage);
    const contactFormPage = new MemberContactFormPage(authenticatedPage);

    await memberViewPage.goto(memberId);
    await memberViewPage.waitForPageLoad();
    await memberViewPage.clickContactsTab();

    await memberViewPage.clickAddContact();
    await contactFormPage.waitForPageLoad();

    // Try to submit without filling required fields
    const isDisabled = await contactFormPage.isSubmitDisabled();
    expect(isDisabled).toBe(true);
  });

  test('READ: should display contact details correctly', async ({ authenticatedPage }) => {
    const memberViewPage = new MemberViewPage(authenticatedPage);

    await memberViewPage.goto(memberId);
    await memberViewPage.waitForPageLoad();
    await memberViewPage.clickContactsTab();

    // Verify both contacts are visible
    await memberViewPage.expectContactVisible(testPhoneNumber);
    await memberViewPage.expectContactVisible(testEmailAddress);
    
    // Verify count
    const count = await memberViewPage.getContactCount();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test('UPDATE: should update contact details', async ({ authenticatedPage }) => {
    const memberViewPage = new MemberViewPage(authenticatedPage);
    const contactFormPage = new MemberContactFormPage(authenticatedPage);

    await memberViewPage.goto(memberId);
    await memberViewPage.waitForPageLoad();
    await memberViewPage.clickContactsTab();

    // Edit the phone contact
    await memberViewPage.editContact(testPhoneNumber);
    await contactFormPage.waitForPageLoad();

    // Verify current value
    const currentValue = await contactFormPage.getContactValue();
    expect(currentValue).toContain(testPhoneNumber);

    // Update contact
    await contactFormPage.fillContactForm({
      contactValue: updatedPhoneNumber,
      isEmergency: true
    });

    await contactFormPage.submit();
    await authenticatedPage.waitForTimeout(1000);

    // Verify updated contact appears
    await memberViewPage.expectContactVisible(updatedPhoneNumber);
  });

  test('DELETE: should delete contact successfully', async ({ authenticatedPage }) => {
    const memberViewPage = new MemberViewPage(authenticatedPage);

    await memberViewPage.goto(memberId);
    await memberViewPage.waitForPageLoad();
    await memberViewPage.clickContactsTab();

    // Verify contact exists before delete
    const row = authenticatedPage.locator(`tr:has-text("${updatedPhoneNumber}")`);
    await expect(row).toBeVisible({ timeout: 10000 });

    // Accept confirmation dialog
    authenticatedPage.on('dialog', dialog => dialog.accept());

    // Delete the contact
    await memberViewPage.deleteContact(updatedPhoneNumber);
    await authenticatedPage.waitForTimeout(1000);

    // Verify contact is removed
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
