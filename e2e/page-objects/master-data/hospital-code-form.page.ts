import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from '../base.page';

/**
 * Hospital Code Form Page Object
 * Represents the hospital coding system create/edit modal/form for e2e testing
 */
export class HospitalCodeFormPage extends BasePage {
  readonly modalTitle: Locator;
  readonly codeSystemSelect: Locator;
  readonly codeValueInput: Locator;
  readonly descriptionInput: Locator;
  readonly codeTypeSelect: Locator;
  readonly isActiveCheckbox: Locator;
  readonly remarksInput: Locator;
  readonly saveButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    super(page);
    this.modalTitle = page.locator('[role="dialog"] h3, .modal-title').filter({ hasText: /code|coding/i });
    this.codeSystemSelect = page.getByLabel(/code.*system|system/i);
    this.codeValueInput = page.getByLabel(/code.*value|code/i);
    this.descriptionInput = page.getByLabel(/description/i);
    this.codeTypeSelect = page.getByLabel(/code.*type|type/i);
    this.isActiveCheckbox = page.getByLabel(/active|is active/i);
    this.remarksInput = page.getByLabel(/remarks|notes/i);
    this.saveButton = page.getByRole('button', { name: /save|submit/i });
    this.cancelButton = page.getByRole('button', { name: /cancel/i });
  }

  async waitForPageLoad(): Promise<void> {
    await expect(this.modalTitle).toBeVisible({ timeout: 10000 });
  }

  async fillCodeForm(data: {
    codeSystem?: string;
    codeValue?: string;
    description?: string;
    codeType?: string;
    isActive?: boolean;
    remarks?: string;
  }): Promise<void> {
    if (data.codeSystem !== undefined) {
      await this.codeSystemSelect.selectOption(data.codeSystem);
    }
    
    if (data.codeValue !== undefined) {
      await this.codeValueInput.fill(data.codeValue);
    }
    
    if (data.description !== undefined) {
      await this.descriptionInput.fill(data.description);
    }
    
    if (data.codeType !== undefined) {
      await this.codeTypeSelect.selectOption(data.codeType);
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

  async getCodeValue(): Promise<string> {
    return await this.codeValueInput.inputValue();
  }

  async getDescription(): Promise<string> {
    return await this.descriptionInput.inputValue();
  }
}
