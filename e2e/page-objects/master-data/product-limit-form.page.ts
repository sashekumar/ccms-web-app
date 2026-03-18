import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from '../base.page';

/**
 * Product Limit Form Page Object
 * Represents the product coverage limit create/edit modal/form for e2e testing
 */
export class ProductLimitFormPage extends BasePage {
  readonly modalTitle: Locator;
  readonly limitTypeSelect: Locator;
  readonly limitDescriptionInput: Locator;
  readonly limitAmountInput: Locator;
  readonly currencySelect: Locator;
  readonly periodTypeSelect: Locator;
  readonly isUnlimitedCheckbox: Locator;
  readonly remarksInput: Locator;
  readonly saveButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    super(page);
    this.modalTitle = page.locator('[role="dialog"] h3, .modal-title').filter({ hasText: /limit/i });
    this.limitTypeSelect = page.getByLabel(/limit.*type|type/i);
    this.limitDescriptionInput = page.getByLabel(/description/i);
    this.limitAmountInput = page.getByLabel(/limit.*amount|amount/i);
    this.currencySelect = page.getByLabel(/currency/i);
    this.periodTypeSelect = page.getByLabel(/period.*type|period/i);
    this.isUnlimitedCheckbox = page.getByLabel(/unlimited/i);
    this.remarksInput = page.getByLabel(/remarks|notes/i);
    this.saveButton = page.getByRole('button', { name: /save|submit/i });
    this.cancelButton = page.getByRole('button', { name: /cancel/i });
  }

  async waitForPageLoad(): Promise<void> {
    await expect(this.modalTitle).toBeVisible({ timeout: 10000 });
  }

  async fillLimitForm(data: {
    limitType?: string;
    description?: string;
    limitAmount?: string;
    currency?: string;
    periodType?: string;
    isUnlimited?: boolean;
    remarks?: string;
  }): Promise<void> {
    if (data.limitType !== undefined) {
      await this.limitTypeSelect.selectOption(data.limitType);
    }
    
    if (data.description !== undefined) {
      await this.limitDescriptionInput.fill(data.description);
    }
    
    if (data.limitAmount !== undefined) {
      await this.limitAmountInput.fill(data.limitAmount);
    }
    
    if (data.currency !== undefined) {
      await this.currencySelect.selectOption(data.currency);
    }
    
    if (data.periodType !== undefined) {
      await this.periodTypeSelect.selectOption(data.periodType);
    }
    
    if (data.isUnlimited !== undefined) {
      const isChecked = await this.isUnlimitedCheckbox.isChecked();
      if (data.isUnlimited !== isChecked) {
        await this.isUnlimitedCheckbox.click();
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

  async getLimitAmount(): Promise<string> {
    return await this.limitAmountInput.inputValue();
  }

  async getDescription(): Promise<string> {
    return await this.limitDescriptionInput.inputValue();
  }
}
