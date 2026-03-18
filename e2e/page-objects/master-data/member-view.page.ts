import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from '../base.page';

/**
 * Member View Page Object
 * Represents the member detail view page with tabs for related entities
 */
export class MemberViewPage extends BasePage {
  // Tab locators
  readonly detailsTab: Locator;
  readonly addressesTab: Locator;
  readonly contactsTab: Locator;
  readonly dependentsTab: Locator;
  readonly policiesTab: Locator;
  readonly pecTab: Locator;

  // Button locators
  readonly addAddressButton: Locator;
  readonly addContactButton: Locator;
  readonly addDependentButton: Locator;
  readonly addPolicyButton: Locator;
  readonly addPecButton: Locator;
  readonly backButton: Locator;
  readonly editButton: Locator;

  constructor(page: Page) {
    super(page);
    
    // Tabs
    this.detailsTab = page.locator('[role="tab"]:has-text("Details"), a:has-text("Details")');
    this.addressesTab = page.locator('[role="tab"]:has-text("Addresses"), a:has-text("Addresses")');
    this.contactsTab = page.locator('[role="tab"]:has-text("Contacts"), a:has-text("Contacts")');
    this.dependentsTab = page.locator('[role="tab"]:has-text("Dependents"), a:has-text("Dependents")');
    this.policiesTab = page.locator('[role="tab"]:has-text("Policies"), a:has-text("Policies")');
    this.pecTab = page.locator('[role="tab"]:has-text("PEC"), a:has-text("Pre-Existing")');
    
    // Buttons
    this.addAddressButton = page.getByRole('button', { name: /add.*address/i });
    this.addContactButton = page.getByRole('button', { name: /add.*contact/i });
    this.addDependentButton = page.getByRole('button', { name: /add.*dependent/i });
    this.addPolicyButton = page.getByRole('button', { name: /add.*policy/i });
    this.addPecButton = page.getByRole('button', { name: /add.*pec|add.*condition/i });
    this.backButton = page.getByRole('button', { name: /back/i });
    this.editButton = page.getByRole('button', { name: /edit/i });
  }

  async goto(memberId: string): Promise<void> {
    await this.page.goto(`/members/view/${memberId}`);
  }

  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForTimeout(1000);
  }

  // Tab navigation
  async clickAddressesTab(): Promise<void> {
    await this.addressesTab.click();
    await this.page.waitForTimeout(500);
  }

  async clickContactsTab(): Promise<void> {
    await this.contactsTab.click();
    await this.page.waitForTimeout(500);
  }

  async clickDependentsTab(): Promise<void> {
    await this.dependentsTab.click();
    await this.page.waitForTimeout(500);
  }

  async clickPoliciesTab(): Promise<void> {
    await this.policiesTab.click();
    await this.page.waitForTimeout(500);
  }

  async clickPecTab(): Promise<void> {
    await this.pecTab.click();
    await this.page.waitForTimeout(500);
  }

  // Add buttons
  async clickAddAddress(): Promise<void> {
    await this.addAddressButton.click();
    await this.page.waitForTimeout(500);
  }

  async clickAddContact(): Promise<void> {
    await this.addContactButton.click();
    await this.page.waitForTimeout(500);
  }

  async clickAddDependent(): Promise<void> {
    await this.addDependentButton.click();
    await this.page.waitForTimeout(500);
  }

  async clickAddPolicy(): Promise<void> {
    await this.addPolicyButton.click();
    await this.page.waitForTimeout(500);
  }

  async clickAddPec(): Promise<void> {
    await this.addPecButton.click();
    await this.page.waitForTimeout(500);
  }

  // Edit/Delete operations for related entities
  async editAddress(addressText: string): Promise<void> {
    const row = this.page.locator(`tr:has-text("${addressText}")`);
    await row.locator('button[title*="Edit"], button:has-text("Edit")').click();
    await this.page.waitForTimeout(500);
  }

  async deleteAddress(addressText: string): Promise<void> {
    const row = this.page.locator(`tr:has-text("${addressText}")`);
    await row.locator('button[title*="Delete"], button:has-text("Delete")').click();
    await this.page.waitForTimeout(500);
  }

  async editContact(contactValue: string): Promise<void> {
    const row = this.page.locator(`tr:has-text("${contactValue}")`);
    await row.locator('button[title*="Edit"], button:has-text("Edit")').click();
    await this.page.waitForTimeout(500);
  }

  async deleteContact(contactValue: string): Promise<void> {
    const row = this.page.locator(`tr:has-text("${contactValue}")`);
    await row.locator('button[title*="Delete"], button:has-text("Delete")').click();
    await this.page.waitForTimeout(500);
  }

  async editDependent(dependentName: string): Promise<void> {
    const row = this.page.locator(`tr:has-text("${dependentName}")`);
    await row.locator('button[title*="Edit"], button:has-text("Edit")').click();
    await this.page.waitForTimeout(500);
  }

  async deleteDependent(dependentName: string): Promise<void> {
    const row = this.page.locator(`tr:has-text("${dependentName}")`);
    await row.locator('button[title*="Delete"], button:has-text("Delete")').click();
    await this.page.waitForTimeout(500);
  }

  // Verification methods
  async expectAddressVisible(addressText: string): Promise<void> {
    await expect(this.page.locator(`td:has-text("${addressText}")`)).toBeVisible({ timeout: 10000 });
  }

  async expectContactVisible(contactValue: string): Promise<void> {
    await expect(this.page.locator(`td:has-text("${contactValue}")`)).toBeVisible({ timeout: 10000 });
  }

  async expectDependentVisible(dependentName: string): Promise<void> {
    await expect(this.page.locator(`td:has-text("${dependentName}")`)).toBeVisible({ timeout: 10000 });
  }

  async getAddressCount(): Promise<number> {
    return await this.page.locator('table tbody tr').count();
  }

  async getContactCount(): Promise<number> {
    return await this.page.locator('table tbody tr').count();
  }

  async getDependentCount(): Promise<number> {
    return await this.page.locator('table tbody tr').count();
  }
}
