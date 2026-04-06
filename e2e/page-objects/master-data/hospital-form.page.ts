import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from '../base.page';

/**
 * Hospital Form Page Object
 * Represents the hospital create/edit FULL-PAGE form at /hospitals/create and /hospitals/edit/:id
 * This is NOT a modal — it's a dedicated page route.
 */
export class HospitalFormPage extends BasePage {
  // Page title determines create vs edit
  readonly pageTitle: Locator;
  // Required fields
  readonly hospitalNameInput: Locator;
  // Optional fields
  readonly hospitalCodeInput: Locator;
  readonly hospitalTypeDropdown: Locator;
  readonly regNoInput: Locator;
  readonly panelStatusDropdown: Locator;
  readonly panelStatusDetailsInput: Locator;
  readonly bankDropdown: Locator;
  readonly bankAccNoInput: Locator;
  readonly accreditationStatusDropdown: Locator;
  // Actions
  readonly saveButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    super(page);
    this.pageTitle = page.locator('h1').filter({ hasText: /create hospital|edit hospital/i });
    this.hospitalNameInput = page.getByLabel(/hospital name/i);
    this.hospitalCodeInput = page.getByLabel(/hospital code/i);
    this.hospitalTypeDropdown = page.locator('[name="hospital_type"]');
    this.regNoInput = page.getByLabel(/registration number/i);
    this.panelStatusDropdown = page.locator('[name="is_panel"]');
    this.panelStatusDetailsInput = page.getByLabel(/panel status details/i);
    this.bankDropdown = page.locator('[name="bank_id"]');
    this.bankAccNoInput = page.getByLabel(/bank account number/i);
    this.accreditationStatusDropdown = page.locator('[name="accreditation_status"]');
    this.saveButton = page.getByRole('button', { name: /create hospital|update hospital/i });
    this.cancelButton = page.getByRole('button', { name: /cancel/i });
  }

  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
    await expect(this.pageTitle).toBeVisible({ timeout: 10000 });
  }

  async fillHospitalForm(data: {
    hospitalName?: string;
    hospitalCode?: string;
    hospitalType?: string;
    regNo?: string;
    panelStatus?: string;
    panelStatusDetails?: string;
    bankAccNo?: string;
    accreditationStatus?: string;
  }): Promise<void> {
    if (data.hospitalName !== undefined) {
      await this.hospitalNameInput.clear();
      await this.hospitalNameInput.fill(data.hospitalName);
    }
    if (data.hospitalCode !== undefined) {
      await this.hospitalCodeInput.clear();
      await this.hospitalCodeInput.fill(data.hospitalCode);
    }
    if (data.hospitalType !== undefined) {
      await this.hospitalTypeDropdown.click();
      await this.page.getByRole('option', { name: data.hospitalType }).click();
      await this.page.waitForTimeout(200);
    }
    if (data.regNo !== undefined) {
      await this.regNoInput.clear();
      await this.regNoInput.fill(data.regNo);
    }
    if (data.panelStatus !== undefined) {
      await this.panelStatusDropdown.click();
      await this.page.getByRole('option', { name: data.panelStatus }).click();
      await this.page.waitForTimeout(200);
    }
    if (data.panelStatusDetails !== undefined) {
      await this.panelStatusDetailsInput.clear();
      await this.panelStatusDetailsInput.fill(data.panelStatusDetails);
    }
    if (data.bankAccNo !== undefined) {
      await this.bankAccNoInput.clear();
      await this.bankAccNoInput.fill(data.bankAccNo);
    }
    if (data.accreditationStatus !== undefined) {
      await this.accreditationStatusDropdown.click();
      await this.page.getByRole('option', { name: data.accreditationStatus }).click();
      await this.page.waitForTimeout(200);
    }
  }

  async submit(): Promise<void> {
    await this.saveButton.click();
    await this.page.waitForTimeout(1500);
  }

  async isSubmitDisabled(): Promise<boolean> {
    return await this.saveButton.isDisabled();
  }

  async getHospitalName(): Promise<string> {
    return await this.hospitalNameInput.inputValue();
  }

  async getHospitalCode(): Promise<string> {
    return await this.hospitalCodeInput.inputValue();
  }
}
