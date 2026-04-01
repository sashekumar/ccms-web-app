import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from '../base.page';

/**
 * Bank Form Page Object
 * Represents the bank create/edit modal/form for e2e testing
 */
export class BankFormPage extends BasePage {
  // Locators
  readonly modalTitle: Locator;
  readonly bankCodeInput: Locator;
  readonly bankNameInput: Locator;
  readonly isActiveCheckbox: Locator;
  readonly saveButton: Locator;
  readonly cancelButton: Locator;
  readonly closeButton: Locator;

  constructor(page: Page) {
    super(page);
    this.modalTitle = page.locator('h3').filter({ hasText: /bank/i });
    this.bankCodeInput = page.getByLabel(/bank code/i);
    this.bankNameInput = page.getByLabel(/bank name/i);
    this.isActiveCheckbox = page.locator('.fixed app-checkbox input[type="checkbox"]');
    this.saveButton = page.getByRole('button', { name: /save|submit/i });
    this.cancelButton = page.getByRole('button', { name: /cancel/i });
    this.closeButton = page.locator('[role="dialog"] button[aria-label="Close"], .modal-header button.close');
  }

  /**
   * Wait for form/modal to load
   */
  async waitForPageLoad(): Promise<void> {
    await expect(this.modalTitle).toBeVisible({ timeout: 10000 });
  }

  /**
   * Fill bank form
   * @param data - Bank form data
   */
  async fillBankForm(data: {
    bankCode?: string;
    bankName?: string;
    isActive?: boolean;
  }): Promise<void> {
    if (data.bankCode !== undefined) {
      await this.bankCodeInput.fill(data.bankCode);
    }
    
    if (data.bankName !== undefined) {
      await this.bankNameInput.fill(data.bankName);
    }
    
    if (data.isActive !== undefined) {
      const isChecked = await this.isActiveCheckbox.isChecked();
      if (data.isActive !== isChecked) {
        await this.isActiveCheckbox.click();
      }
    }
  }

  /**
   * Submit the form
   */
  async submit(): Promise<void> {
    await this.saveButton.click();
    await this.page.waitForTimeout(1000); // Wait for submission
  }

  /**
   * Cancel the form
   */
  async cancel(): Promise<void> {
    await this.cancelButton.click();
  }

  /**
   * Close the modal
   */
  async close(): Promise<void> {
    await this.closeButton.click();
  }

  /**
   * Check if submit button is disabled
   */
  async isSubmitDisabled(): Promise<boolean> {
    return await this.saveButton.isDisabled();
  }

  /**
   * Get validation error for a field
   * @param fieldName - Field name
   */
  async getFieldError(fieldName: string): Promise<string | null> {
    const errorLocator = this.page.locator(`[name="${fieldName}"] ~ .error-message, [name="${fieldName}"] ~ .invalid-feedback`);
    const isVisible = await errorLocator.isVisible();
    return isVisible ? await errorLocator.textContent() : null;
  }

  /**
   * Get bank code value
   */
  async getBankCode(): Promise<string> {
    return await this.bankCodeInput.inputValue();
  }

  /**
   * Get bank name value
   */
  async getBankName(): Promise<string> {
    return await this.bankNameInput.inputValue();
  }

  /**
   * Get is active status
   */
  async getIsActive(): Promise<boolean> {
    return await this.isActiveCheckbox.isChecked();
  }
}
