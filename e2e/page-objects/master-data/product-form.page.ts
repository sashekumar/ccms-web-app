import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from '../base.page';

/**
 * Product Form Page Object
 * Represents the product create/edit modal/form for e2e testing
 */
export class ProductFormPage extends BasePage {
  readonly modalTitle: Locator;
  readonly planCodeInput: Locator;
  readonly planNameInput: Locator;
  readonly insurerNameInput: Locator;
  readonly isActiveCheckbox: Locator;
  readonly saveButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    super(page);
    this.modalTitle = page.locator('[role="dialog"] h3, .modal-title').filter({ hasText: /product|policy/i });
    this.planCodeInput = page.getByLabel(/plan code/i);
    this.planNameInput = page.getByLabel(/plan name/i);
    this.insurerNameInput = page.getByLabel(/insurer/i);
    this.isActiveCheckbox = page.getByLabel(/active/i);
    this.saveButton = page.getByRole('button', { name: /save|submit/i });
    this.cancelButton = page.getByRole('button', { name: /cancel/i });
  }

  async waitForPageLoad(): Promise<void> {
    await expect(this.modalTitle).toBeVisible({ timeout: 10000 });
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
