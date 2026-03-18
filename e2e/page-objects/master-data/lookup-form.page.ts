import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from '../base.page';

/**
 * Lookup Form Page Object
 * Represents the lookup value create/edit modal/form for e2e testing
 */
export class LookupFormPage extends BasePage {
  readonly modalTitle: Locator;
  readonly lookupCodeInput: Locator;
  readonly lookupValueInput: Locator;
  readonly categorySelect: Locator;
  readonly displayOrderInput: Locator;
  readonly isActiveCheckbox: Locator;
  readonly saveButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    super(page);
    this.modalTitle = page.locator('[role="dialog"] h3, .modal-title').filter({ hasText: /lookup/i });
    this.lookupCodeInput = page.getByLabel(/lookup code/i);
    this.lookupValueInput = page.getByLabel(/lookup value/i);
    this.categorySelect = page.getByLabel(/category/i);
    this.displayOrderInput = page.getByLabel(/order|display order/i);
    this.isActiveCheckbox = page.getByLabel(/active/i);
    this.saveButton = page.getByRole('button', { name: /save|submit/i });
    this.cancelButton = page.getByRole('button', { name: /cancel/i });
  }

  async waitForPageLoad(): Promise<void> {
    await expect(this.modalTitle).toBeVisible({ timeout: 10000 });
  }

  async fillLookupForm(data: {
    lookupCode?: string;
    lookupValue?: string;
    category?: string;
    displayOrder?: string;
    isActive?: boolean;
  }): Promise<void> {
    if (data.lookupCode !== undefined) {
      await this.lookupCodeInput.fill(data.lookupCode);
    }
    
    if (data.lookupValue !== undefined) {
      await this.lookupValueInput.fill(data.lookupValue);
    }
    
    if (data.category !== undefined) {
      await this.categorySelect.selectOption(data.category);
    }
    
    if (data.displayOrder !== undefined) {
      await this.displayOrderInput.fill(data.displayOrder);
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

  async getLookupCode(): Promise<string> {
    return await this.lookupCodeInput.inputValue();
  }

  async getLookupValue(): Promise<string> {
    return await this.lookupValueInput.inputValue();
  }
}
