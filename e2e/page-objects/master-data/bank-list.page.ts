import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from '../base.page';

/**
 * Bank List Page Object
 * Represents the Banks management page for e2e testing
 */
export class BankListPage extends BasePage {
  // Locators
  readonly pageTitle: Locator;
  readonly createButton: Locator;
  readonly searchInput: Locator;
  readonly dataTable: Locator;
  readonly noDataMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.pageTitle = page.locator('h1, h2').filter({ hasText: /bank/i });
    this.createButton = page.getByRole('button', { name: /create|add.*bank/i });
    this.searchInput = page.getByPlaceholder(/search/i);
    this.dataTable = page.locator('table').first();
    this.noDataMessage = page.getByText(/no.*bank.*found/i);
  }

  /**
   * Navigate to banks page
   */
  async goto(): Promise<void> {
    await super.goto('/master/banks');
  }

  /**
   * Wait for page to load
   */
  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
    await expect(this.pageTitle).toBeVisible({ timeout: 10000 });
  }

  /**
   * Click create bank button
   */
  async clickCreateBank(): Promise<void> {
    await this.createButton.click();
  }

  /**
   * Search for banks
   * @param searchTerm - Search term
   */
  async search(searchTerm: string): Promise<void> {
    await this.searchInput.fill(searchTerm);
    await this.page.waitForTimeout(500); // Wait for debounce
  }

  /**
   * Get bank row by code or name
   * @param identifier - Bank code or name
   */
  getRow(identifier: string): Locator {
    return this.page.locator(`tr:has-text("${identifier}")`);
  }

  /**
   * Click edit button for specific bank
   * @param identifier - Bank code or name
   */
  async clickEdit(identifier: string): Promise<void> {
    const row = this.getRow(identifier);
    await expect(row).toBeVisible({ timeout: 10000 });
    const editButton = row.locator('button:has-text("Edit"), button[title*="Edit"]').first();
    await editButton.click();
  }

  /**
   * Click delete button for specific bank
   * @param identifier - Bank code or name
   */
  async clickDelete(identifier: string): Promise<void> {
    const row = this.getRow(identifier);
    await expect(row).toBeVisible({ timeout: 10000 });
    const deleteButton = row.locator('button:has-text("Delete"), button[title*="Delete"]').first();
    await deleteButton.click();
  }

  /**
   * Confirm delete action
   */
  async confirmDelete(): Promise<void> {
    // Handle browser confirm dialog
    this.page.on('dialog', dialog => dialog.accept());
  }

  /**
   * Expect bank to be visible in table
   * @param identifier - Bank code or name
   */
  async expectBankVisible(identifier: string): Promise<void> {
    const row = this.getRow(identifier);
    await expect(row).toBeVisible({ timeout: 10000 });
  }

  /**
   * Expect bank to not be visible in table
   * @param identifier - Bank code or name
   */
  async expectBankNotVisible(identifier: string): Promise<void> {
    const row = this.getRow(identifier);
    await expect(row).not.toBeVisible({ timeout: 5000 });
  }

  /**
   * Get total count of banks
   */
  async getBankCount(): Promise<number> {
    const rows = await this.dataTable.locator('tbody tr').count();
    return rows;
  }

  /**
   * Check if no data message is visible
   */
  async isNoDataVisible(): Promise<boolean> {
    return await this.noDataMessage.isVisible();
  }
}
