import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from '../base.page';

/**
 * Member Dependent Form Page Object
 * Represents the member dependent create/edit modal/form for e2e testing
 */
export class MemberDependentFormPage extends BasePage {
  readonly modalTitle: Locator;
  readonly fullNameInput: Locator;
  readonly icNoInput: Locator;
  readonly relationshipSelect: Locator;
  readonly dateOfBirthInput: Locator;
  readonly genderSelect: Locator;
  readonly isActiveCheckbox: Locator;
  readonly saveButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    super(page);
    this.modalTitle = page.locator('[role="dialog"] h3, .modal-title').filter({ hasText: /dependent/i });
    this.fullNameInput = page.getByLabel(/full name|name/i);
    this.icNoInput = page.getByLabel(/ic.*no|nric|identification/i);
    this.relationshipSelect = page.getByLabel(/relationship/i);
    this.dateOfBirthInput = page.getByLabel(/date of birth|dob|birth date/i);
    this.genderSelect = page.getByLabel(/gender/i);
    this.isActiveCheckbox = page.getByLabel(/active|is active/i);
    this.saveButton = page.getByRole('button', { name: /save|submit/i });
    this.cancelButton = page.getByRole('button', { name: /cancel/i });
  }

  async waitForPageLoad(): Promise<void> {
    await expect(this.modalTitle).toBeVisible({ timeout: 10000 });
  }

  async fillDependentForm(data: {
    fullName?: string;
    icNo?: string;
    relationship?: string;
    dateOfBirth?: string;
    gender?: string;
    isActive?: boolean;
  }): Promise<void> {
    if (data.fullName !== undefined) {
      await this.fullNameInput.fill(data.fullName);
    }
    
    if (data.icNo !== undefined) {
      await this.icNoInput.fill(data.icNo);
    }
    
    if (data.relationship !== undefined) {
      await this.relationshipSelect.selectOption(data.relationship);
    }
    
    if (data.dateOfBirth !== undefined) {
      await this.dateOfBirthInput.fill(data.dateOfBirth);
    }
    
    if (data.gender !== undefined) {
      await this.genderSelect.selectOption(data.gender);
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

  async getFullName(): Promise<string> {
    return await this.fullNameInput.inputValue();
  }

  async getIcNo(): Promise<string> {
    return await this.icNoInput.inputValue();
  }

  async getRelationship(): Promise<string> {
    return await this.relationshipSelect.inputValue();
  }
}
