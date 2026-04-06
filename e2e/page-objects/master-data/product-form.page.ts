import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from '../base.page';

/**
 * Product Form Page Object
 * Represents the product create/edit full-page form at /products/create or /products/edit/:id
 * The form uses app-text-input (name attr on inner input) and app-button for submit.
 */
export class ProductFormPage extends BasePage {
  readonly pageTitle: Locator;
  readonly planCodeInput: Locator;
  readonly planNameInput: Locator;
  readonly insurerNameInput: Locator;
  readonly isActiveCheckbox: Locator;
  readonly saveButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    super(page);
    this.pageTitle = page.locator('h1').filter({ hasText: /create product|edit product/i });
    this.planCodeInput = page.locator('input[name="plan_code"]');
    this.planNameInput = page.locator('input[name="plan_name"]');
    this.insurerNameInput = page.locator('input[name="insurer_name"]');
    this.isActiveCheckbox = page.getByRole('checkbox', { name: /active/i });
    this.saveButton = page.getByRole('button', { name: /create product|update product/i });
    this.cancelButton = page.getByRole('button', { name: /^cancel$/i });
  }

  async waitForPageLoad(): Promise<void> {
    await expect(this.pageTitle).toBeVisible({ timeout: 15000 });
  }

  async fillProductForm(data: {
    planCode?: string;
    planName?: string;
    insurerName?: string;
    isActive?: boolean;
  }): Promise<void> {
    if (data.planCode !== undefined) {
      await this.planCodeInput.fill(data.planCode);
    }
    
    if (data.planName !== undefined) {
      await this.planNameInput.fill(data.planName);
    }
    
    if (data.insurerName !== undefined) {
      await this.insurerNameInput.fill(data.insurerName);
    }
    
    if (data.isActive !== undefined) {
      const isChecked = await this.isActiveCheckbox.isChecked();
      if (data.isActive !== isChecked) {
        await this.isActiveCheckbox.click();
      }
    }
  }

  async submit(): Promise<void> {
    await this.saveButton.click();
    await this.page.waitForTimeout(1000);
  }

  async isSubmitDisabled(): Promise<boolean> {
    return await this.saveButton.isDisabled();
  }

  async getPlanCode(): Promise<string> {
    return await this.planCodeInput.inputValue();
  }

  async getPlanName(): Promise<string> {
    return await this.planNameInput.inputValue();
  }
}
