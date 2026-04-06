import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from '../base.page';

/**
 * Hospital List Page Object
 * Represents the Hospitals management page for e2e testing
 */
export class HospitalListPage extends BasePage {
  readonly pageTitle: Locator;
  readonly createButton: Locator;
  readonly searchInput: Locator;
  readonly dataTable: Locator;
  readonly noDataMessage: Locator;

  // Stats cards
  readonly totalHospitalsCard: Locator;
  readonly panelHospitalsCard: Locator;

  constructor(page: Page) {
    super(page);
    this.pageTitle = page.locator('h1').filter({ hasText: /Hospital Management/i });
    this.createButton = page.getByRole('button', { name: /create hospital/i });
    // DataTable uses placeholder "Hospital name or code..."
    this.searchInput = page.getByPlaceholder('Hospital name or code...');
    this.dataTable = page.locator('app-data-table');
    this.noDataMessage = page.getByText(/no.*hospital.*found|no records/i);

    // Stats cards
    this.totalHospitalsCard = page.locator('.rounded-lg').filter({ hasText: 'Total Hospitals' });
    this.panelHospitalsCard = page.locator('.rounded-lg').filter({ hasText: 'Panel Hospitals' });
  }

  async goto(): Promise<void> {
    await super.goto('/hospitals');
  }

  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
    await expect(this.pageTitle).toBeVisible({ timeout: 10000 });
  }

  async waitForStatsLoad(): Promise<void> {
    await expect(this.totalHospitalsCard).toBeVisible({ timeout: 10000 });
  }

  async clickCreateHospital(): Promise<void> {
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
    await row.locator('button[title*="View"], a[title*="View"]').first().click();
    await this.page.waitForLoadState('networkidle');
  }

  async clickEdit(identifier: string): Promise<void> {
    const row = this.getRow(identifier);
    await expect(row).toBeVisible({ timeout: 10000 });
    await row.locator('button[title*="Edit"], a[title*="Edit"]').first().click();
    await this.page.waitForLoadState('networkidle');
  }

  async clickDelete(identifier: string): Promise<void> {
    const row = this.getRow(identifier);
    await expect(row).toBeVisible({ timeout: 10000 });
    await row.locator('button[title*="Delete"]').first().click();
  }

  async expectHospitalVisible(identifier: string): Promise<void> {
    await expect(this.getRow(identifier)).toBeVisible({ timeout: 10000 });
  }

  async expectHospitalNotVisible(identifier: string): Promise<void> {
    await expect(this.getRow(identifier)).not.toBeVisible({ timeout: 5000 });
  }

  async getTotalHospitalsCount(): Promise<string> {
    return (await this.totalHospitalsCard.locator('p.text-3xl').textContent()) || '0';
  }
}
