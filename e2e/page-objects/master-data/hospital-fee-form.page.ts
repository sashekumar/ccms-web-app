import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from '../base.page';

/**
 * Hospital Fee Form Page Object
 * Represents the inline fee form in the Fee Schedules tab of hospital-view.
 * Actual fields: fee_type (dropdown, required), item_code, description (textarea),
 *                amount (required, currency), is_active (checkbox),
 *                effective_date (date-picker), expiry_date (date-picker)
 */
export class HospitalFeeFormPage extends BasePage {
  readonly formHeading: Locator;
  readonly feeTypeDropdown: Locator;
  readonly itemCodeInput: Locator;
  readonly descriptionInput: Locator;
  readonly amountInput: Locator;
  readonly isActiveCheckbox: Locator;
  readonly effectiveDateInput: Locator;
  readonly expiryDateInput: Locator;
  readonly saveButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    super(page);
    this.formHeading = page.locator('h4').filter({ hasText: /add new fee schedule|edit fee schedule/i });
    this.feeTypeDropdown = page.locator('[name="fee_type"]');
    this.itemCodeInput = page.locator('input[name="item_code"]');
    this.descriptionInput = page.locator('textarea[name="description"]');
    this.amountInput = page.locator('input[name="amount"]');
    this.isActiveCheckbox = page.getByRole('checkbox', { name: /active/i });
    this.effectiveDateInput = page.locator('[name="effective_date"]').first();
    this.expiryDateInput = page.locator('[name="expiry_date"]').first();
    this.saveButton = page.getByRole('button', { name: /save fee|update fee/i });
    this.cancelButton = page.getByRole('button', { name: /cancel/i });
  }

  async waitForFormVisible(): Promise<void> {
    await expect(this.formHeading).toBeVisible({ timeout: 10000 });
  }

  async waitForPageLoad(): Promise<void> {
    // Alias for waitForFormVisible for compatibility
    await this.waitForFormVisible();
  }

  async fillFeeForm(data: {
    feeType?: string;
    itemCode?: string;
    description?: string;
    amount?: string;
    isActive?: boolean;
  }): Promise<void> {
    if (data.feeType !== undefined) {
      await this.feeTypeDropdown.click();
      await this.page.getByRole('option', { name: data.feeType }).click();
      await this.page.waitForTimeout(200);
    }

    if (data.itemCode !== undefined) {
      await this.itemCodeInput.clear();
      await this.itemCodeInput.fill(data.itemCode);
    }

    if (data.description !== undefined) {
      await this.descriptionInput.clear();
      await this.descriptionInput.fill(data.description);
    }

    if (data.amount !== undefined) {
      await this.amountInput.clear();
      await this.amountInput.fill(data.amount);
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
    await this.page.waitForTimeout(1200);
  }

  async cancel(): Promise<void> {
    await this.cancelButton.click();
  }

  async getAmount(): Promise<string> {
    return await this.amountInput.inputValue();
  }

  async isSubmitDisabled(): Promise<boolean> {
    return await this.saveButton.isDisabled();
  }

  async getDescription(): Promise<string> {
    return await this.descriptionInput.inputValue();
  }
}
