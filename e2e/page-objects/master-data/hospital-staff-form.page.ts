import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from '../base.page';

/**
 * Hospital Staff Form Page Object
 * Represents the hospital staff create/edit modal/form for e2e testing
 */
export class HospitalStaffFormPage extends BasePage {
  readonly modalTitle: Locator;
  readonly staffNameInput: Locator;
  readonly positionInput: Locator;
  readonly departmentInput: Locator;
  readonly specializationInput: Locator;
  readonly emailInput: Locator;
  readonly phoneInput: Locator;
  readonly licenseNumberInput: Locator;
  readonly isActiveCheckbox: Locator;
  readonly saveButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    super(page);
    this.modalTitle = page.locator('[role="dialog"] h3, .modal-title').filter({ hasText: /staff/i });
    this.staffNameInput = page.getByLabel(/staff name|name/i);
    this.positionInput = page.getByLabel(/position|role/i);
    this.departmentInput = page.getByLabel(/department/i);
    this.specializationInput = page.getByLabel(/specialization|specialty/i);
    this.emailInput = page.getByLabel(/email/i);
    this.phoneInput = page.getByLabel(/phone|contact/i);
    this.licenseNumberInput = page.getByLabel(/license.*number|license/i);
    this.isActiveCheckbox = page.getByLabel(/active|is active/i);
    this.saveButton = page.getByRole('button', { name: /save|submit/i });
    this.cancelButton = page.getByRole('button', { name: /cancel/i });
  }

  async waitForPageLoad(): Promise<void> {
    await expect(this.modalTitle).toBeVisible({ timeout: 10000 });
  }

  async fillStaffForm(data: {
    staffName?: string;
    position?: string;
    department?: string;
    specialization?: string;
    email?: string;
    phone?: string;
    licenseNumber?: string;
    isActive?: boolean;
  }): Promise<void> {
    if (data.staffName !== undefined) {
      await this.staffNameInput.fill(data.staffName);
    }
    
    if (data.position !== undefined) {
      await this.positionInput.fill(data.position);
    }
    
    if (data.department !== undefined) {
      await this.departmentInput.fill(data.department);
    }
    
    if (data.specialization !== undefined) {
      await this.specializationInput.fill(data.specialization);
    }
    
    if (data.email !== undefined) {
      await this.emailInput.fill(data.email);
    }
    
    if (data.phone !== undefined) {
      await this.phoneInput.fill(data.phone);
    }
    
    if (data.licenseNumber !== undefined) {
      await this.licenseNumberInput.fill(data.licenseNumber);
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

  async getStaffName(): Promise<string> {
    return await this.staffNameInput.inputValue();
  }

  async getPosition(): Promise<string> {
    return await this.positionInput.inputValue();
  }
}
