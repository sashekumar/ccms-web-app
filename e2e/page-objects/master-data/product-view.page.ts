import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from '../base.page';

/**
 * Product View Page Object
 * Represents the product detail view page at /products/view/:id
 * Tabs: Product Details | Limits | Copay | LOS Alert Thresholds
 * Limits and Copay are modal forms (h3 heading inside fixed overlay div)
 */
export class ProductViewPage extends BasePage {
  readonly pageTitle: Locator;
  readonly editButton: Locator;
  readonly backButton: Locator;

  // Tabs - nav button elements
  readonly detailsTab: Locator;
  readonly limitsTab: Locator;
  readonly copayTab: Locator;
  readonly thresholdsTab: Locator;

  // Limits tab buttons
  readonly addLimitButton: Locator;

  // Copay tab buttons
  readonly addCopayButton: Locator;

  // Thresholds tab
  readonly addThresholdButton: Locator;

  constructor(page: Page) {
    super(page);
    this.pageTitle = page.locator('h1').first();
    this.editButton = page.getByRole('button', { name: /^edit$/i });
    this.backButton = page.getByRole('button', { name: /back to list/i });

    // Tabs in nav element
    this.detailsTab = page.locator('nav button', { hasText: 'Product Details' });
    this.limitsTab = page.locator('nav button', { hasText: 'Limits' });
    this.copayTab = page.locator('nav button', { hasText: 'Copay' });
    this.thresholdsTab = page.locator('nav button', { hasText: 'LOS Alert Thresholds' });

    // Add buttons (inside tab content, not nav)
    this.addLimitButton = page.getByRole('button', { name: /add limit/i });
    this.addCopayButton = page.getByRole('button', { name: /add copay/i });
    this.addThresholdButton = page.getByRole('button', { name: /add threshold/i });
  }

  async goto(productId: string): Promise<void> {
    await super.goto(`/products/view/${productId}`);
  }

  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
    await expect(this.pageTitle).toBeVisible({ timeout: 15000 });
  }

  async clickDetailsTab(): Promise<void> {
    await this.detailsTab.click();
    await this.page.waitForTimeout(500);
  }

  async clickLimitsTab(): Promise<void> {
    await this.limitsTab.click();
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForTimeout(500);
  }

  async clickCopayTab(): Promise<void> {
    await this.copayTab.click();
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForTimeout(500);
  }

  async clickAddLimit(): Promise<void> {
    await this.addLimitButton.click();
    await this.page.waitForTimeout(500);
  }

  async clickAddCopay(): Promise<void> {
    await this.addCopayButton.click();
    await this.page.waitForTimeout(500);
  }

  async editLimit(limitType: string): Promise<void> {
    const row = this.page.locator(`tr:has-text("${limitType}")`);
    await expect(row).toBeVisible({ timeout: 10000 });
    await row.locator('button[title="Edit"]').click();
    await this.page.waitForTimeout(500);
  }

  async deleteLimit(limitType: string): Promise<void> {
    const row = this.page.locator(`tr:has-text("${limitType}")`);
    await expect(row).toBeVisible({ timeout: 10000 });
    await row.locator('button[title="Delete"]').click();
    await this.page.waitForTimeout(500);
  }

  async editCopay(copayType: string): Promise<void> {
    const row = this.page.locator(`tr:has-text("${copayType}")`);
    await expect(row).toBeVisible({ timeout: 10000 });
    await row.locator('button[title="Edit"]').click();
    await this.page.waitForTimeout(500);
  }

  async deleteCopay(copayType: string): Promise<void> {
    const row = this.page.locator(`tr:has-text("${copayType}")`);
    await expect(row).toBeVisible({ timeout: 10000 });
    await row.locator('button[title="Delete"]').click();
    await this.page.waitForTimeout(500);
  }

  async expectLimitVisible(limitType: string): Promise<void> {
    await expect(this.page.locator(`td:has-text("${limitType}")`)).toBeVisible({ timeout: 10000 });
  }

  async expectCopayVisible(copayType: string): Promise<void> {
    await expect(this.page.locator(`td:has-text("${copayType}")`)).toBeVisible({ timeout: 10000 });
  }

  async clickThresholdsTab(): Promise<void> {
    await this.thresholdsTab.click();
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForTimeout(500);
  }

  async clickAddThreshold(): Promise<void> {
    await this.addThresholdButton.click();
    await this.page.waitForTimeout(500);
  }

  async editThreshold(diagnosisCategory: string): Promise<void> {
    const row = this.page.locator(`tr:has-text("${diagnosisCategory}")`);
    await expect(row).toBeVisible({ timeout: 10000 });
    await row.locator('button[title="Edit"]').click();
    await this.page.waitForTimeout(500);
  }

  async deleteThreshold(diagnosisCategory: string): Promise<void> {
    const row = this.page.locator(`tr:has-text("${diagnosisCategory}")`);
    await expect(row).toBeVisible({ timeout: 10000 });
    await row.locator('button[title="Delete"]').click();
    await this.page.waitForTimeout(500);
  }

  async expectThresholdVisible(diagnosisCategory: string): Promise<void> {
    await expect(this.page.locator(`td:has-text("${diagnosisCategory}")`)).toBeVisible({ timeout: 10000 });
  }
}
