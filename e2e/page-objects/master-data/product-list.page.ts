import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from '../base.page';

/**
 * Product List Page Object
 * Represents the Policy Management (Products) list page at /products
 */
export class ProductListPage extends BasePage {
  readonly pageTitle: Locator;
  readonly createButton: Locator;
  readonly searchInput: Locator;

  constructor(page: Page) {
    super(page);
    this.pageTitle = page.locator('h1').filter({ hasText: /policy management/i });
    this.createButton = page.getByRole('button', { name: /create product/i });
    this.searchInput = page.getByPlaceholder('Plan code or name...');
  }

  async goto(): Promise<void> {
    await super.goto('/products');
  }

  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
    await expect(this.pageTitle).toBeVisible({ timeout: 10000 });
  }

  async clickCreateProduct(): Promise<void> {
    await this.createButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  async search(searchTerm: string): Promise<void> {
    await this.searchInput.fill(searchTerm);
    await this.page.waitForTimeout(600);
  }

  async clearSearch(): Promise<void> {
    await this.searchInput.fill('');
    await this.page.waitForTimeout(600);
  }

  getRow(identifier: string): Locator {
    return this.page.locator(`tr:has-text("${identifier}")`);
  }

  async clickView(identifier: string): Promise<void> {
    const row = this.getRow(identifier);
    await expect(row).toBeVisible({ timeout: 10000 });
    await row.locator('button[title*="View"]').first().click();
    await this.page.waitForLoadState('networkidle');
  }

  async clickEdit(identifier: string): Promise<void> {
    const row = this.getRow(identifier);
    await expect(row).toBeVisible({ timeout: 10000 });
    await row.locator('button[title*="Edit"]').first().click();
    await this.page.waitForLoadState('networkidle');
  }

  async clickDelete(identifier: string): Promise<void> {
    const row = this.getRow(identifier);
    await expect(row).toBeVisible({ timeout: 10000 });
    await row.locator('button[title*="Delete"]').first().click();
  }

  async expectProductVisible(identifier: string): Promise<void> {
    await expect(this.getRow(identifier)).toBeVisible({ timeout: 10000 });
  }

  async expectProductNotVisible(identifier: string): Promise<void> {
    await expect(this.getRow(identifier)).not.toBeVisible({ timeout: 5000 });
  }
}
