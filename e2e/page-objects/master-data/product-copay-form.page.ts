import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from '../base.page';

/**
 * Product Copay Form Page Object
 * Represents the copay modal overlay in the Copay tab of product-view.
 * Modal: div.fixed.inset-0 > div.w-full.max-w-lg > h3 "Add Copay" / "Edit Copay"
 * Fields:
 *   - copay_type (app-dropdown, required)
 *   - copay_value (app-text-input currency, when not percentage)
 *   - copay_value_percentage (app-text-input decimal, when percentage type)
 *   - applies_to (app-dropdown)
 *   - copay_is_active (app-checkbox)
 * Buttons: "Cancel" and "Create" / "Update"
 */
export class ProductCopayFormPage extends BasePage {
  readonly modalTitle: Locator;
  readonly copayTypeDropdown: Locator;
  readonly copayValueInput: Locator;
  readonly copayValuePercentageInput: Locator;
  readonly appliesToDropdown: Locator;
  readonly isActiveCheckbox: Locator;
  readonly saveButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    super(page);
    this.modalTitle = page.locator('h3').filter({ hasText: /add copay|edit copay/i });
    this.copayTypeDropdown = page.locator('[name="copay_type"]');
    this.copayValueInput = page.locator('input[name="copay_value"]');
    this.copayValuePercentageInput = page.locator('input[name="copay_value_percentage"]');
    this.appliesToDropdown = page.locator('[name="applies_to"]');
    this.isActiveCheckbox = page.getByRole('checkbox', { name: /^active$/i });
    this.saveButton = page.getByRole('button', { name: /^create$|^update$/i });
    this.cancelButton = page.getByRole('button', { name: /^cancel$/i });
  }

  async waitForPageLoad(): Promise<void> {
    await expect(this.modalTitle).toBeVisible({ timeout: 10000 });
  }

  /**
   * Fill currency input for fixed amount copay.
   * Currency input is readonly; digits are accumulated as cents.
   * e.g. amount="50.00" → type digits "5000"
   */
  async fillCurrencyAmount(amount: string): Promise<void> {
    await this.copayValueInput.click();
    for (let i = 0; i < 15; i++) {
      await this.page.keyboard.press('Backspace');
    }
    const digits = amount.replace(/[^0-9]/g, '');
    await this.page.keyboard.type(digits);
  }

  async fillCopayForm(data: {
    copayType?: string;
    copayValue?: string;
    appliesTo?: string;
    isActive?: boolean;
  }): Promise<void> {
    if (data.copayType !== undefined) {
      await this.copayTypeDropdown.click();
      await this.page.getByRole('option', { name: data.copayType }).click();
      await this.page.waitForTimeout(300);
    }
    if (data.copayValue !== undefined) {
      // Check if percentage type is selected (shows percentage input)
      const percentInput = this.copayValuePercentageInput;
      const percentVisible = await percentInput.isVisible().catch(() => false);
      if (percentVisible) {
        await percentInput.fill(data.copayValue);
      } else {
        await this.fillCurrencyAmount(data.copayValue);
      }
    }
    if (data.appliesTo !== undefined) {
      await this.appliesToDropdown.click();
      await this.page.getByRole('option', { name: data.appliesTo }).click();
      await this.page.waitForTimeout(200);
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
}
