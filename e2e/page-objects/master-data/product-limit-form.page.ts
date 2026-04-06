import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from '../base.page';

/**
 * Product Limit Form Page Object
 * Represents the coverage limit modal overlay in the Limits tab of product-view.
 * Modal: div.fixed.inset-0 > div.w-full.max-w-lg > h3 "Add Limit" / "Edit Limit"
 * Fields: limit_type (app-dropdown), limit_amount (app-text-input currency), is_active (app-checkbox)
 * Buttons: "Cancel" and "Create" / "Update"
 */
export class ProductLimitFormPage extends BasePage {
  readonly modalTitle: Locator;
  readonly limitTypeDropdown: Locator;
  readonly limitAmountInput: Locator;
  readonly isActiveCheckbox: Locator;
  readonly saveButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    super(page);
    this.modalTitle = page.locator('h3').filter({ hasText: /add limit|edit limit/i });
    this.limitTypeDropdown = page.locator('[name="limit_type"]');
    this.limitAmountInput = page.locator('input[name="limit_amount"]');
    this.isActiveCheckbox = page.getByRole('checkbox', { name: /^active$/i });
    this.saveButton = page.getByRole('button', { name: /^create$|^update$/i });
    this.cancelButton = page.getByRole('button', { name: /^cancel$/i });
  }

  async waitForPageLoad(): Promise<void> {
    await expect(this.modalTitle).toBeVisible({ timeout: 10000 });
  }

  /**
   * Fill currency input by pressing digit keys.
   * Currency input is readonly; digis are accumulated as cents.
   * e.g. amount="150.00" → type digits "15000"
   */
  async fillCurrencyAmount(amount: string): Promise<void> {
    await this.limitAmountInput.click();
    // Clear existing value
    for (let i = 0; i < 15; i++) {
      await this.page.keyboard.press('Backspace');
    }
    // Strip non-digits and type
    const digits = amount.replace(/[^0-9]/g, '');
    await this.page.keyboard.type(digits);
  }

  async fillLimitForm(data: {
    limitType?: string;
    limitAmount?: string;
    isActive?: boolean;
  }): Promise<void> {
    if (data.limitType !== undefined) {
      await this.limitTypeDropdown.click();
      await this.page.getByRole('option', { name: data.limitType }).click();
      await this.page.waitForTimeout(200);
    }
    if (data.limitAmount !== undefined) {
      await this.fillCurrencyAmount(data.limitAmount);
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

  async cancel(): Promise<void> {
    await this.cancelButton.click();
  }

  async isSubmitDisabled(): Promise<boolean> {
    return await this.saveButton.isDisabled();
  }

  async getLimitAmount(): Promise<string> {
    return await this.limitAmountInput.inputValue();
  }
}
