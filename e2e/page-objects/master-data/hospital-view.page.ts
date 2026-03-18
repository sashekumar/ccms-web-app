import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from '../base.page';

/**
 * Hospital View Page Object
 * Represents the hospital detail view page with tabs for related entities
 */
export class HospitalViewPage extends BasePage {
  // Tab locators
  readonly detailsTab: Locator;
  readonly staffTab: Locator;
  readonly addressesTab: Locator;
  readonly contactsTab: Locator;
  readonly feesTab: Locator;
  readonly codesTab: Locator;

  // Button locators
  readonly addStaffButton: Locator;
  readonly addAddressButton: Locator;
  readonly addContactButton: Locator;
  readonly addFeeButton: Locator;
  readonly addCodeButton: Locator;
  readonly backButton: Locator;
  readonly editButton: Locator;

  constructor(page: Page) {
    super(page);
    
    // Tabs
    this.detailsTab = page.locator('[role="tab"]:has-text("Details"), a:has-text("Details")');
    this.staffTab = page.locator('[role="tab"]:has-text("Staff"), a:has-text("Staff")');
    this.addressesTab = page.locator('[role="tab"]:has-text("Addresses"), a:has-text("Addresses")');
    this.contactsTab = page.locator('[role="tab"]:has-text("Contacts"), a:has-text("Contacts")');
    this.feesTab = page.locator('[role="tab"]:has-text("Fees"), a:has-text("Fees")');
    this.codesTab = page.locator('[role="tab"]:has-text("Codes"), a:has-text("Codes")');
    
    // Buttons
    this.addStaffButton = page.getByRole('button', { name: /add.*staff/i });
    this.addAddressButton = page.getByRole('button', { name: /add.*address/i });
    this.addContactButton = page.getByRole('button', { name: /add.*contact/i });
    this.addFeeButton = page.getByRole('button', { name: /add.*fee/i });
    this.addCodeButton = page.getByRole('button', { name: /add.*code/i });
    this.backButton = page.getByRole('button', { name: /back/i });
    this.editButton = page.getByRole('button', { name: /edit/i });
  }

  async goto(hospitalId: string): Promise<void> {
    await this.page.goto(`/hospitals/view/${hospitalId}`);
  }

  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForTimeout(1000);
  }

  // Tab navigation
  async clickStaffTab(): Promise<void> {
    await this.staffTab.click();
    await this.page.waitForTimeout(500);
  }

  async clickAddressesTab(): Promise<void> {
    await this.addressesTab.click();
    await this.page.waitForTimeout(500);
  }

  async clickContactsTab(): Promise<void> {
    await this.contactsTab.click();
    await this.page.waitForTimeout(500);
  }

  async clickFeesTab(): Promise<void> {
    await this.feesTab.click();
    await this.page.waitForTimeout(500);
  }

  async clickCodesTab(): Promise<void> {
    await this.codesTab.click();
    await this.page.waitForTimeout(500);
  }

  // Add buttons
  async clickAddStaff(): Promise<void> {
    await this.addStaffButton.click();
    await this.page.waitForTimeout(500);
  }

  async clickAddAddress(): Promise<void> {
    await this.addAddressButton.click();
    await this.page.waitForTimeout(500);
  }

  async clickAddContact(): Promise<void> {
    await this.addContactButton.click();
    await this.page.waitForTimeout(500);
  }

  async clickAddFee(): Promise<void> {
    await this.addFeeButton.click();
    await this.page.waitForTimeout(500);
  }

  async clickAddCode(): Promise<void> {
    await this.addCodeButton.click();
    await this.page.waitForTimeout(500);
  }

  // Edit/Delete operations
  async editStaff(staffName: string): Promise<void> {
    const row = this.page.locator(`tr:has-text("${staffName}")`);
    await row.locator('button[title*="Edit"], button:has-text("Edit")').click();
    await this.page.waitForTimeout(500);
  }

  async deleteStaff(staffName: string): Promise<void> {
    const row = this.page.locator(`tr:has-text("${staffName}")`);
    await row.locator('button[title*="Delete"], button:has-text("Delete")').click();
    await this.page.waitForTimeout(500);
  }

  async editFee(feeDescription: string): Promise<void> {
    const row = this.page.locator(`tr:has-text("${feeDescription}")`);
    await row.locator('button[title*="Edit"], button:has-text("Edit")').click();
    await this.page.waitForTimeout(500);
  }

  async deleteFee(feeDescription: string): Promise<void> {
    const row = this.page.locator(`tr:has-text("${feeDescription}")`);
    await row.locator('button[title*="Delete"], button:has-text("Delete")').click();
    await this.page.waitForTimeout(500);
  }

  // Verification methods
  async expectStaffVisible(staffName: string): Promise<void> {
    await expect(this.page.locator(`td:has-text("${staffName}")`)).toBeVisible({ timeout: 10000 });
  }

  async expectFeeVisible(feeDescription: string): Promise<void> {
    await expect(this.page.locator(`td:has-text("${feeDescription}")`)).toBeVisible({ timeout: 10000 });
  }

  async expectCodeVisible(codeValue: string): Promise<void> {
    await expect(this.page.locator(`td:has-text("${codeValue}")`)).toBeVisible({ timeout: 10000 });
  }
}
