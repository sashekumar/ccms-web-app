import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from '../base.page';

/**
 * Hospital Fee Form Page Object
 * Represents the hospital service fee create/edit modal/form for e2e testing
 */
export class HospitalFeeFormPage extends BasePage {
  readonly modalTitle: Locator;
  readonly serviceTypeSelect: Locator;
  readonly descriptionInput: Locator;
  readonly feeAmountInput: Locator;
  readonly currencySelect: Locator;
  readonly effectiveDateInput: Locator;
  readonly isActiveCheckbox: Locator;
  readonly remarksInput: Locator;
  readonly saveButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    super(page);
    this.modalTitle = page.locator('[role="dialog"] h3, .modal-title').filter({ hasText: /fee|service/i });
    this.serviceTypeSelect = page.getByLabel(/service.*type|type/i);
    this.descriptionInput = page.getByLabel(/description/i);
    this.feeAmountInput = page.getByLabel(/fee.*amount|amount/i);
    this.currencySelect = page.getByLabel(/currency/i);
    this.effectiveDateInput = page.getByLabel(/effective date|date/i);
    this.isActiveCheckbox = page.getByLabel(/active|is active/i);
    this.remarksInput = page.getByLabel(/remarks|notes/i);
    this.saveButton = page.getByRole('button', { name: /save|submit/i });
    this.cancelButton = page.getByRole('button', { name: /cancel/i });
  }

  async waitForPageLoad(): Promise<void> {
    await expect(this.modalTitle).toBeVisible({ timeout: 10000 });
  }

  async fillFeeForm(data: {
    serviceType?: string;
    description?: string;
    feeAmount?: string;
    currency?: string;
    effectiveDate?: string;
    isActive?: boolean;
    remarks?: string;
  }): Promise<void> {
    if (data.serviceType !== undefined) {
      await this.serviceTypeSelect.selectOption(data.serviceType);
    }
    
    if (data.description !== undefined) {
      await this.descriptionInput.fill(data.description);
    }
    
    if (data.feeAmount !== undefined) {
      await this.feeAmountInput.fill(data.feeAmount);
    }
    
    if (data.currency !== undefined) {
      await this.currencySelect.selectOption(data.currency);
    }
    
    if (data.effectiveDate !== undefined) {
      await this.effectiveDateInput.fill(data.effectiveDate);
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

  async getDescription(): Promise<string> {
    return await this.descriptionInput.inputValue();
  }

  async getFeeAmount(): Promise<string> {
    return await this.feeAmountInput.inputValue();
  }
}
