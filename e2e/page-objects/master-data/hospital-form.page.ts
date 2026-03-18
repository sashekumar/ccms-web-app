import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from '../base.page';

/**
 * Hospital Form Page Object
 * Represents the hospital create/edit modal/form for e2e testing
 */
export class HospitalFormPage extends BasePage {
  readonly modalTitle: Locator;
  readonly hospitalNameInput: Locator;
  readonly hospitalCodeInput: Locator;
  readonly hospitalTypeSelect: Locator;
  readonly isPanelCheckbox: Locator;
  readonly saveButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    super(page);
    this.modalTitle = page.locator('[role="dialog"] h3, .modal-title').filter({ hasText: /hospital/i });
    this.hospitalNameInput = page.getByLabel(/hospital name/i);
    this.hospitalCodeInput = page.getByLabel(/hospital code/i);
    this.hospitalTypeSelect = page.getByLabel(/hospital type/i);
    this.isPanelCheckbox = page.getByLabel(/panel/i);
    this.saveButton = page.getByRole('button', { name: /save|submit/i });
    this.cancelButton = page.getByRole('button', { name: /cancel/i });
  }

  async waitForPageLoad(): Promise<void> {
    await expect(this.modalTitle).toBeVisible({ timeout: 10000 });
  }

  async fillHospitalForm(data: {
    hospitalName?: string;
    hospitalCode?: string;
    hospitalType?: string;
    isPanel?: boolean;
  }): Promise<void> {
    if (data.hospitalName !== undefined) {
      await this.hospitalNameInput.fill(data.hospitalName);
    }
    
    if (data.hospitalCode !== undefined) {
      await this.hospitalCodeInput.fill(data.hospitalCode);
    }
    
    if (data.hospitalType !== undefined) {
      await this.hospitalTypeSelect.selectOption(data.hospitalType);
    }
    
    if (data.isPanel !== undefined) {
      const isChecked = await this.isPanelCheckbox.isChecked();
      if (data.isPanel !== isChecked) {
        await this.isPanelCheckbox.click();
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

  async getHospitalName(): Promise<string> {
    return await this.hospitalNameInput.inputValue();
  }
}
