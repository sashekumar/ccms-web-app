import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from '../base.page';

/**
 * Hospital View Page Object
 * Represents the hospital detail view page at /hospitals/view/:id
 *
 * All sub-entity data is displayed as CARDS (div.rounded-lg), NOT table rows.
 * Inline forms are shown when adding/editing sub-entities (no modals).
 * Confirmation uses Angular ConfirmDialogComponent (not browser native dialogs).
 *
 * Tabs: Overview | Addresses | Codes | Staff | Fee Schedules
 */
export class HospitalViewPage extends BasePage {
  // Page header
  readonly pageTitle: Locator;
  readonly editButton: Locator;
  readonly backButton: Locator;

  // Tabs — actual button labels from the Angular template
  readonly overviewTab: Locator;
  readonly addressesTab: Locator;
  readonly codesTab: Locator;
  readonly staffTab: Locator;
  readonly feeSchedulesTab: Locator;

  // ------------------------------------------------------------------
  // Overview: panel toggle
  // ------------------------------------------------------------------
  readonly panelToggle: Locator;

  // ------------------------------------------------------------------
  // Addresses tab buttons
  // ------------------------------------------------------------------
  readonly addAddressButton: Locator;
  readonly saveAddressButton: Locator;
  readonly cancelAddressButton: Locator;

  // ------------------------------------------------------------------
  // Codes tab buttons
  // ------------------------------------------------------------------
  readonly addCodeButton: Locator;
  readonly saveCodeButton: Locator;
  readonly cancelCodeButton: Locator;

  // ------------------------------------------------------------------
  // Staff tab buttons
  // ------------------------------------------------------------------
  readonly addStaffButton: Locator;
  readonly saveStaffButton: Locator;
  readonly cancelStaffButton: Locator;

  // ------------------------------------------------------------------
  // Fee Schedules tab buttons
  // ------------------------------------------------------------------
  readonly addFeeButton: Locator;
  readonly saveFeeButton: Locator;
  readonly cancelFeeButton: Locator;

  constructor(page: Page) {
    super(page);

    // Header
    this.pageTitle = page.locator('h1').first();
    this.editButton = page.getByRole('button', { name: /^edit$/i });
    this.backButton = page.getByRole('button', { name: /back to list/i });

    // Tabs — use text matching on the nav buttons (without strict anchors)
    this.overviewTab = page.locator('nav button', { hasText: 'Overview' });
    this.addressesTab = page.locator('nav button', { hasText: 'Addresses' });
    this.codesTab = page.locator('nav button', { hasText: 'Codes' });
    this.staffTab = page.locator('nav button', { hasText: 'Staff' });
    this.feeSchedulesTab = page.locator('nav button', { hasText: 'Fee Schedules' });

    // Overview
    this.panelToggle = page.locator('app-toggle').first();

    // Addresses
    this.addAddressButton = page.getByRole('button', { name: /add address/i });
    this.saveAddressButton = page.getByRole('button', { name: /save address|update address/i });
    this.cancelAddressButton = page.getByRole('button', { name: /cancel/i }).first();

    // Codes
    this.addCodeButton = page.getByRole('button', { name: /add code/i });
    this.saveCodeButton = page.getByRole('button', { name: /save code|update code/i });
    this.cancelCodeButton = page.getByRole('button', { name: /cancel/i }).first();

    // Staff
    this.addStaffButton = page.getByRole('button', { name: /add staff/i });
    this.saveStaffButton = page.getByRole('button', { name: /save staff|update staff/i });
    this.cancelStaffButton = page.getByRole('button', { name: /cancel/i }).first();

    // Fee Schedules
    this.addFeeButton = page.getByRole('button', { name: /add fee schedule/i });
    this.saveFeeButton = page.getByRole('button', { name: /save fee|update fee/i });
    this.cancelFeeButton = page.getByRole('button', { name: /cancel/i }).first();
  }

  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
    await expect(this.pageTitle).toBeVisible({ timeout: 15000 });
  }

  async goto(hospitalId: string): Promise<void> {
    await super.goto(`/hospitals/view/${hospitalId}`);
  }

  // ------------------------------------------------------------------
  // Tab Navigation
  // ------------------------------------------------------------------
  async clickOverviewTab(): Promise<void> {
    await this.overviewTab.click();
    await this.page.waitForTimeout(500);
  }

  async clickAddressesTab(): Promise<void> {
    await this.addressesTab.click();
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForTimeout(500);
  }

  async clickCodesTab(): Promise<void> {
    await this.codesTab.click();
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForTimeout(500);
  }

  async clickStaffTab(): Promise<void> {
    await this.staffTab.click();
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForTimeout(500);
  }

  async clickFeeSchedulesTab(): Promise<void> {
    await this.feeSchedulesTab.click();
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForTimeout(500);
  }

  // ------------------------------------------------------------------
  // Confirm Dialog
  // ------------------------------------------------------------------
  async confirmDialog(): Promise<void> {
    await this.page.getByRole('button', { name: /^(Confirm|Delete)$/ }).click();
    await this.page.waitForTimeout(800);
  }

  async cancelDialog(): Promise<void> {
    await this.page.getByRole('button', { name: /^Cancel$/ }).last().click();
    await this.page.waitForTimeout(300);
  }

  // ------------------------------------------------------------------
  // Generic Card helpers (shared for addresses/codes/staff/fees)
  // Cards are rendered as div.rounded-lg elements in a CSS grid.
  // ------------------------------------------------------------------
  getCard(identifier: string): Locator {
    return this.page.locator('.rounded-lg').filter({ hasText: identifier }).first();
  }

  async clickCardEdit(identifier: string): Promise<void> {
    const card = this.getCard(identifier);
    await card.locator('button[title="Edit"]').click();
    await this.page.waitForTimeout(400);
  }

  async clickCardDelete(identifier: string): Promise<void> {
    const card = this.getCard(identifier);
    await card.locator('button[title="Delete"]').click();
    await this.page.waitForTimeout(400);
  }

  // ------------------------------------------------------------------
  // Overview Tab
  // ------------------------------------------------------------------
  async getHospitalName(): Promise<string> {
    return await this.pageTitle.innerText();
  }

  async togglePanelStatus(): Promise<void> {
    await this.panelToggle.locator('button, [role="switch"]').click();
    await this.page.waitForTimeout(400);
  }

  // ------------------------------------------------------------------
  // Addresses Tab
  // ------------------------------------------------------------------
  async clickAddAddress(): Promise<void> {
    await this.addAddressButton.click();
    await this.page.waitForTimeout(400);
  }

  async editAddress(streetLine1: string): Promise<void> {
    await this.clickCardEdit(streetLine1);
  }

  async deleteAddress(streetLine1: string): Promise<void> {
    await this.clickCardDelete(streetLine1);
  }

  async toggleAddressPrimary(streetLine1: string): Promise<void> {
    const card = this.getCard(streetLine1);
    await card.locator('app-toggle button, app-toggle [role="switch"]').first().click();
    await this.page.waitForTimeout(400);
  }

  async expectAddressVisible(streetLine1: string): Promise<void> {
    await expect(this.page.locator('.rounded-lg').filter({ hasText: streetLine1 })).toBeVisible({ timeout: 10000 });
  }

  async expectAddressNotVisible(streetLine1: string): Promise<void> {
    await expect(this.page.locator('.rounded-lg').filter({ hasText: streetLine1 })).not.toBeVisible({ timeout: 10000 });
  }

  // ------------------------------------------------------------------
  // Codes Tab
  // ------------------------------------------------------------------
  async clickAddCode(): Promise<void> {
    await this.addCodeButton.click();
    await this.page.waitForTimeout(400);
  }

  async editCode(codeValue: string): Promise<void> {
    await this.clickCardEdit(codeValue);
  }

  async deleteCode(codeValue: string): Promise<void> {
    await this.clickCardDelete(codeValue);
  }

  async toggleCodeActive(codeValue: string): Promise<void> {
    const card = this.getCard(codeValue);
    await card.locator('app-toggle button, app-toggle [role="switch"]').first().click();
    await this.page.waitForTimeout(400);
  }

  async expectCodeVisible(codeValue: string): Promise<void> {
    await expect(this.page.locator('.rounded-lg').filter({ hasText: codeValue })).toBeVisible({ timeout: 10000 });
  }

  async expectCodeNotVisible(codeValue: string): Promise<void> {
    await expect(this.page.locator('.rounded-lg').filter({ hasText: codeValue })).not.toBeVisible({ timeout: 10000 });
  }

  // ------------------------------------------------------------------
  // Staff Tab
  // ------------------------------------------------------------------
  async clickAddStaff(): Promise<void> {
    await this.addStaffButton.click();
    await this.page.waitForTimeout(400);
  }

  async editStaff(staffName: string): Promise<void> {
    await this.clickCardEdit(staffName);
  }

  async deleteStaff(staffName: string): Promise<void> {
    await this.clickCardDelete(staffName);
  }

  async toggleStaffActive(staffName: string): Promise<void> {
    const card = this.getCard(staffName);
    await card.locator('app-toggle button, app-toggle [role="switch"]').first().click();
    await this.page.waitForTimeout(400);
  }

  async expectStaffVisible(staffName: string): Promise<void> {
    await expect(this.page.locator('.rounded-lg').filter({ hasText: staffName })).toBeVisible({ timeout: 10000 });
  }

  async expectStaffNotVisible(staffName: string): Promise<void> {
    await expect(this.page.locator('.rounded-lg').filter({ hasText: staffName })).not.toBeVisible({ timeout: 10000 });
  }

  // Expand the Contacts section within a staff card
  async expandStaffContacts(staffName: string): Promise<void> {
    const card = this.getCard(staffName);
    await card.locator('button:has-text("Contacts"), button[title="Manage Contacts"]').click();
    await this.page.waitForTimeout(600);
  }

  // Add Contact button appears in the expanded contacts panel
  async clickAddContact(staffName: string): Promise<void> {
    const card = this.getCard(staffName);
    await card.locator('button:has-text("Add Contact")').click();
    await this.page.waitForTimeout(400);
  }

  async editContact(staffName: string, contactValue: string): Promise<void> {
    const card = this.getCard(staffName);
    const contactRow = card.locator('.rounded, .border').filter({ hasText: contactValue });
    await contactRow.locator('button[title="Edit"]').click();
    await this.page.waitForTimeout(400);
  }

  async deleteContact(staffName: string, contactValue: string): Promise<void> {
    const card = this.getCard(staffName);
    const contactRow = card.locator('.rounded, .border').filter({ hasText: contactValue });
    await contactRow.locator('button[title="Delete"]').click();
    await this.page.waitForTimeout(400);
  }

  async toggleContactPrimary(staffName: string, contactValue: string): Promise<void> {
    const card = this.getCard(staffName);
    const contactRow = card.locator('.rounded, .border').filter({ hasText: contactValue });
    await contactRow.locator('app-toggle button, app-toggle [role="switch"]').first().click();
    await this.page.waitForTimeout(400);
  }

  async expectContactVisible(staffName: string, contactValue: string): Promise<void> {
    const card = this.getCard(staffName);
    await expect(card.locator(`text=${contactValue}`)).toBeVisible({ timeout: 10000 });
  }

  // ------------------------------------------------------------------
  // Fee Schedules Tab
  // ------------------------------------------------------------------
  async clickAddFee(): Promise<void> {
    await this.addFeeButton.click();
    await this.page.waitForTimeout(400);
  }

  async editFee(identifier: string): Promise<void> {
    await this.clickCardEdit(identifier);
  }

  async deleteFee(identifier: string): Promise<void> {
    await this.clickCardDelete(identifier);
  }

  async toggleFeeActive(identifier: string): Promise<void> {
    const card = this.getCard(identifier);
    await card.locator('app-toggle button, app-toggle [role="switch"]').first().click();
    await this.page.waitForTimeout(400);
  }

  async expectFeeVisible(identifier: string): Promise<void> {
    await expect(this.page.locator('.rounded-lg').filter({ hasText: identifier })).toBeVisible({ timeout: 10000 });
  }

  async expectFeeNotVisible(identifier: string): Promise<void> {
    await expect(this.page.locator('.rounded-lg').filter({ hasText: identifier })).not.toBeVisible({ timeout: 10000 });
  }
}
