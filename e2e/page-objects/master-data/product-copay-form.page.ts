import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from '../base.page';

/**
 * Product Copay Form Page Object
 * Represents the product co-payment create/edit modal/form for e2e testing
 */
export class ProductCopayFormPage extends BasePage {
  readonly modalTitle: Locator;
  readonly copayTypeSelect: Locator;
  readonly copayDescriptionInput: Locator;
  readonly copayPercentInput: Locator;
  readonly copayFixedAmountInput: Locator;
  readonly minAmountInput: Locator;
  readonly maxAmountInput: Locator;
  readonly currencySelect: Locator;
  readonly isActiveCheckbox: Locator;
  readonly remarksInput: Locator;
  readonly saveButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    super(page);
    this.modalTitle = page.locator('[role="dialog"] h3, .modal-title').filter({ hasText: /copay|co-payment/i });
    this.copayTypeSelect = page.getByLabel(/copay.*type|type/i);
    this.copayDescriptionInput = page.getByLabel(/description/i);
    this.copayPercentInput = page.getByLabel(/percent|percentage/i);
    this.copayFixedAmountInput = page.getByLabel(/fixed.*amount|amount/i);
    this.minAmountInput = page.getByLabel(/min.*amount|minimum/i);
    this.maxAmountInput = page.getByLabel(/max.*amount|maximum/i);
    this.currencySelect = page.getByLabel(/currency/i);
    this.isActiveCheckbox = page.getByLabel(/active|is active/i);
    this.remarksInput = page.getByLabel(/remarks|notes/i);
    this.saveButton = page.getByRole('button', { name: /save|submit/i });
    this.cancelButton = page.getByRole('button', { name: /cancel/i });
  }

  async waitForPageLoad(): Promise<void> {
    await expect(this.modalTitle).toBeVisible({ timeout: 10000 });
  }

  async fillCopayForm(data: {
    copayType?: string;
    description?: string;
    copayPercent?: string;
    copayFixedAmount?: string;
    minAmount?: string;
    maxAmount?: string;
    currency?: string;
    isActive?: boolean;
    remarks?: string;
  }): Promise<void> {
    if (data.copayType !== undefined) {
      await this.copayTypeSelect.selectOption(data.copayType);
    }
    
    if (data.description !== undefined) {
      await this.copayDescriptionInput.fill(data.description);
    }
    
    if (data.copayPercent !== undefined) {
      await this.copayPercentInput.fill(data.copayPercent);
    }
    
    if (data.copayFixedAmount !== undefined) {
      await this.copayFixedAmountInput.fill(data.copayFixedAmount);
    }
    
    if (data.minAmount !== undefined) {
      await this.minAmountInput.fill(data.minAmount);
    }
    
    if (data.maxAmount !== undefined) {
      await this.maxAmountInput.fill(data.maxAmount);
    }
    
    if (data.currency !== undefined) {
      await this.currencySelect.selectOption(data.currency);
    }
    
    if (data.isActive !== undefined) {
      const isChecked = await this.isActiveCheckbox.isChecked();
      if (data.isActive !== isChecked) {
        await this.isActiveCheckbox.click();
      }
    }
    
    if (data.remarks !== undefined) {
      await this.remarksInput.fill(data.remarks);
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

  async getCopayPercent(): Promise<string> {
    return await this.copayPercentInput.inputValue();
  }

  async getDescription(): Promise<string> {
    return await this.copayDescriptionInput.inputValue();
  }
}
