import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from '../base.page';

/**
 * Clause Form Page Object
 * Represents the clause create/edit modal/form for e2e testing
 */
export class ClauseFormPage extends BasePage {
  readonly modalTitle: Locator;
  readonly clauseCodeInput: Locator;
  readonly clauseTextInput: Locator;
  readonly isActiveCheckbox: Locator;
  readonly saveButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    super(page);
    this.modalTitle = page.locator('h3').filter({ hasText: /clause/i });
    this.clauseCodeInput = page.getByLabel(/clause code/i);
    this.clauseTextInput = page.getByLabel(/clause text/i);
    this.isActiveCheckbox = page.locator('.fixed app-checkbox input[type="checkbox"]');
    this.saveButton = page.getByRole('button', { name: /save|submit/i });
    this.cancelButton = page.getByRole('button', { name: /cancel/i });
  }

  async waitForPageLoad(): Promise<void> {
    await expect(this.modalTitle).toBeVisible({ timeout: 10000 });
  }

  async fillClauseForm(data: {
    clauseCode?: string;
    clauseText?: string;
    clauseCategory?: string;  // Ignored — clause form has no category field
    isActive?: boolean;
  }): Promise<void> {
    if (data.clauseCode !== undefined) {
      await this.clauseCodeInput.fill(data.clauseCode);
    }
    
    if (data.clauseText !== undefined) {
      await this.clauseTextInput.fill(data.clauseText);
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

  async getClauseCode(): Promise<string> {
    return await this.clauseCodeInput.inputValue();
  }

  async getClauseText(): Promise<string> {
    return await this.clauseTextInput.inputValue();
  }
}
