import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from '../base.page';

/**
 * Hospital Staff Form Page Object
 * Represents the inline staff form rendered within the Staff tab of hospital-view.
 * Actual fields: staff_name (required), staff_type (dropdown), specialty, is_active (checkbox)
 */
export class HospitalStaffFormPage extends BasePage {
  readonly formHeading: Locator;
  readonly staffNameInput: Locator;
  readonly staffTypeDropdown: Locator;
  readonly specialtyInput: Locator;
  readonly isActiveCheckbox: Locator;
  readonly saveButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    super(page);
    this.formHeading = page.locator('h4').filter({ hasText: /add new staff|edit staff/i });
    this.staffNameInput = page.locator('input[name="staff_name"]');
    this.staffTypeDropdown = page.locator('[name="staff_type"]');
    this.specialtyInput = page.locator('input[name="specialty"]');
    this.isActiveCheckbox = page.getByRole('checkbox', { name: /active/i });
    this.saveButton = page.getByRole('button', { name: /save staff|update staff/i });
    this.cancelButton = page.getByRole('button', { name: /cancel/i });
  }

  async waitForFormVisible(): Promise<void> {
    await expect(this.formHeading).toBeVisible({ timeout: 10000 });
  }

  async waitForPageLoad(): Promise<void> {
    // Alias for waitForFormVisible for compatibility
    await this.waitForFormVisible();
  }

  async fillStaffForm(data: {
    staffName?: string;
    staffType?: string;
    specialty?: string;
    isActive?: boolean;
  }): Promise<void> {
    if (data.staffName !== undefined) {
      await this.staffNameInput.clear();
      await this.staffNameInput.fill(data.staffName);
    }

    if (data.staffType !== undefined) {
      await this.staffTypeDropdown.click();
      await this.page.getByRole('option', { name: data.staffType }).click();
      await this.page.waitForTimeout(200);
    }

    if (data.specialty !== undefined) {
      await this.specialtyInput.clear();
      await this.specialtyInput.fill(data.specialty);
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
    await this.page.waitForTimeout(1200);
  }

  async cancel(): Promise<void> {
    await this.cancelButton.click();
  }

  async getStaffName(): Promise<string> {
    return await this.staffNameInput.inputValue();
  }

  async isSubmitDisabled(): Promise<boolean> {
    return await this.saveButton.isDisabled();
  }
}
