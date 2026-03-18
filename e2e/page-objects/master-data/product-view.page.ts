import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from '../base.page';

/**
 * Product View Page Object
 * Represents the product detail view page with tabs for related entities
 */
export class ProductViewPage extends BasePage {
  // Tab locators
  readonly detailsTab: Locator;
  readonly limitsTab: Locator;
  readonly copayTab: Locator;

  // Button locators
  readonly addLimitButton: Locator;
  readonly addCopayButton: Locator;
  readonly backButton: Locator;
  readonly editButton: Locator;

  constructor(page: Page) {
    super(page);
    
    // Tabs
    this.detailsTab = page.locator('[role="tab"]:has-text("Details"), a:has-text("Details")');
    this.limitsTab = page.locator('[role="tab"]:has-text("Limits"), a:has-text("Coverage Limits")');
    this.copayTab = page.locator('[role="tab"]:has-text("Copay"), a:has-text("Co-payment")');
    
    // Buttons
    this.addLimitButton = page.getByRole('button', { name: /add.*limit/i });
    this.addCopayButton = page.getByRole('button', { name: /add.*copay|add.*co-payment/i });
    this.backButton = page.getByRole('button', { name: /back/i });
    this.editButton = page.getByRole('button', { name: /edit/i });
  }

  async goto(productId: string): Promise<void> {
    await this.page.goto(`/products/view/${productId}`);
  }

  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForTimeout(1000);
  }

  // Tab navigation
  async clickLimitsTab(): Promise<void> {
    await this.limitsTab.click();
    await this.page.waitForTimeout(500);
  }

  async clickCopayTab(): Promise<void> {
    await this.copayTab.click();
    await this.page.waitForTimeout(500);
  }

  // Add buttons
  async clickAddLimit(): Promise<void> {
    await this.addLimitButton.click();
    await this.page.waitForTimeout(500);
  }

  async clickAddCopay(): Promise<void> {
    await this.addCopayButton.click();
    await this.page.waitForTimeout(500);
  }

  // Edit/Delete operations
  async editLimit(limitType: string): Promise<void> {
    const row = this.page.locator(`tr:has-text("${limitType}")`);
    await row.locator('button[title*="Edit"], button:has-text("Edit")').click();
    await this.page.waitForTimeout(500);
  }

  async deleteLimit(limitType: string): Promise<void> {
    const row = this.page.locator(`tr:has-text("${limitType}")`);
    await row.locator('button[title*="Delete"], button:has-text("Delete")').click();
    await this.page.waitForTimeout(500);
  }

  async editCopay(copayType: string): Promise<void> {
    const row = this.page.locator(`tr:has-text("${copayType}")`);
    await row.locator('button[title*="Edit"], button:has-text("Edit")').click();
    await this.page.waitForTimeout(500);
  }

  async deleteCopay(copayType: string): Promise<void> {
    const row = this.page.locator(`tr:has-text("${copayType}")`);
    await row.locator('button[title*="Delete"], button:has-text("Delete")').click();
    await this.page.waitForTimeout(500);
  }

  // Verification methods
  async expectLimitVisible(limitType: string): Promise<void> {
    await expect(this.page.locator(`td:has-text("${limitType}")`)).toBeVisible({ timeout: 10000 });
  }

  async expectCopayVisible(copayType: string): Promise<void> {
    await expect(this.page.locator(`td:has-text("${copayType}")`)).toBeVisible({ timeout: 10000 });
  }
}
