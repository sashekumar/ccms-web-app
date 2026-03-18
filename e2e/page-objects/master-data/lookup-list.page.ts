import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from '../base.page';

/**
 * Lookup List Page Object
 * Represents the Lookup Values management page for e2e testing
 */
export class LookupListPage extends BasePage {
  readonly pageTitle: Locator;
  readonly createButton: Locator;
  readonly searchInput: Locator;
  readonly dataTable: Locator;
  readonly noDataMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.pageTitle = page.locator('h1, h2').filter({ hasText: /lookup/i });
    this.createButton = page.getByRole('button', { name: /create|add.*lookup/i });
    this.searchInput = page.getByPlaceholder(/search/i);
    this.dataTable = page.locator('table').first();
    this.noDataMessage = page.getByText(/no.*lookup.*found/i);
  }

  async goto(): Promise<void> {
    await super.goto('/lookups/values');
  }

  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
    await expect(this.pageTitle).toBeVisible({ timeout: 10000 });
  }

  async clickCreateLookup(): Promise<void> {
    await this.createButton.click();
  }

  async search(searchTerm: string): Promise<void> {
    await this.searchInput.fill(searchTerm);
    await this.page.waitForTimeout(500);
  }

  getRow(identifier: string): Locator {
    return this.page.locator(`tr:has-text("${identifier}")`);
  }

  async clickEdit(identifier: string): Promise<void> {
    const row = this.getRow(identifier);
    await expect(row).toBeVisible({ timeout: 10000 });
    const editButton = row.locator('button:has-text("Edit"), button[title*="Edit"]').first();
    await editButton.click();
  }

  async clickDelete(identifier: string): Promise<void> {
    const row = this.getRow(identifier);
    await expect(row).toBeVisible({ timeout: 10000 });
    const deleteButton = row.locator('button:has-text("Delete"), button[title*="Delete"]').first();
    await deleteButton.click();
  }

  async expectLookupVisible(identifier: string): Promise<void> {
    const row = this.getRow(identifier);
    await expect(row).toBeVisible({ timeout: 10000 });
  }

  async expectLookupNotVisible(identifier: string): Promise<void> {
    const row = this.getRow(identifier);
    await expect(row).not.toBeVisible({ timeout: 5000 });
  }

  async isNoDataVisible(): Promise<boolean> {
    return await this.noDataMessage.isVisible();
  }
}
