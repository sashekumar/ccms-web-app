import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from '../base.page';

/**
 * Member PEC (Pre-Existing Condition) Form Page Object
 * Represents the member pre-existing condition create/edit modal/form for e2e testing
 */
export class MemberPecFormPage extends BasePage {
  readonly modalTitle: Locator;
  readonly conditionNameInput: Locator;
  readonly conditionCodeInput: Locator;
  readonly diagnosisDateInput: Locator;
  readonly severitySelect: Locator;
  readonly statusSelect: Locator;
  readonly descriptionInput: Locator;
  readonly treatmentInput: Locator;
  readonly doctorNameInput: Locator;
  readonly hospitalInput: Locator;
  readonly isExcludedCheckbox: Locator;
  readonly saveButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    super(page);
    this.modalTitle = page.locator('[role="dialog"] h3, .modal-title').filter({ hasText: /pre.*existing|pec|condition/i });
    this.conditionNameInput = page.getByLabel(/condition name|condition/i);
    this.conditionCodeInput = page.getByLabel(/condition code|icd.*code/i);
    this.diagnosisDateInput = page.getByLabel(/diagnosis date|diagnosed date/i);
    this.severitySelect = page.getByLabel(/severity/i);
    this.statusSelect = page.getByLabel(/status/i);
    this.descriptionInput = page.getByLabel(/description/i);
    this.treatmentInput = page.getByLabel(/treatment/i);
    this.doctorNameInput = page.getByLabel(/doctor.*name|physician/i);
    this.hospitalInput = page.getByLabel(/hospital|clinic/i);
    this.isExcludedCheckbox = page.getByLabel(/excluded|is excluded/i);
    this.saveButton = page.getByRole('button', { name: /save|submit/i });
    this.cancelButton = page.getByRole('button', { name: /cancel/i });
  }

  async waitForPageLoad(): Promise<void> {
    await expect(this.modalTitle).toBeVisible({ timeout: 10000 });
  }

  async fillPecForm(data: {
    conditionName?: string;
    conditionCode?: string;
    diagnosisDate?: string;
    severity?: string;
    status?: string;
    description?: string;
    treatment?: string;
    doctorName?: string;
    hospital?: string;
    isExcluded?: boolean;
  }): Promise<void> {
    if (data.conditionName !== undefined) {
      await this.conditionNameInput.fill(data.conditionName);
    }
    
    if (data.conditionCode !== undefined) {
      await this.conditionCodeInput.fill(data.conditionCode);
    }
    
    if (data.diagnosisDate !== undefined) {
      await this.diagnosisDateInput.fill(data.diagnosisDate);
    }
    
    if (data.severity !== undefined) {
      await this.severitySelect.selectOption(data.severity);
    }
    
    if (data.status !== undefined) {
      await this.statusSelect.selectOption(data.status);
    }
    
    if (data.description !== undefined) {
      await this.descriptionInput.fill(data.description);
    }
    
    if (data.treatment !== undefined) {
      await this.treatmentInput.fill(data.treatment);
    }
    
    if (data.doctorName !== undefined) {
      await this.doctorNameInput.fill(data.doctorName);
    }
    
    if (data.hospital !== undefined) {
      await this.hospitalInput.fill(data.hospital);
    }
    
    if (data.isExcluded !== undefined) {
      const isChecked = await this.isExcludedCheckbox.isChecked();
      if (data.isExcluded !== isChecked) {
        await this.isExcludedCheckbox.click();
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

  async getConditionName(): Promise<string> {
    return await this.conditionNameInput.inputValue();
  }

  async getConditionCode(): Promise<string> {
    return await this.conditionCodeInput.inputValue();
  }

  async getDiagnosisDate(): Promise<string> {
    return await this.diagnosisDateInput.inputValue();
  }

  async isExcluded(): Promise<boolean> {
    return await this.isExcludedCheckbox.isChecked();
  }
}
