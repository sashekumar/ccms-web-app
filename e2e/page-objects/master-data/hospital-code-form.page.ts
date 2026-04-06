import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from '../base.page';

/**
 * Hospital Code Form Page Object
 * Represents the inline code form in the Codes tab of hospital-view.
 * Actual fields: code_type (dropdown, required), code_value (required), is_active (checkbox)
 */
export class HospitalCodeFormPage extends BasePage {
  readonly formHeading: Locator;
  readonly codeTypeDropdown: Locator;
  readonly codeValueInput: Locator;
  readonly isActiveCheckbox: Locator;
  readonly saveButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    super(page);
    this.formHeading = page.locator('h4').filter({ hasText: /add new code|edit code/i });
    this.codeTypeDropdown = page.locator('[name="code_type"]');
    this.codeValueInput = page.locator('input[name="code_value"]');
    this.isActiveCheckbox = page.getByRole('checkbox', { name: /active/i });
    this.saveButton = page.getByRole('button', { name: /save code|update code/i });
    this.cancelButton = page.getByRole('button', { name: /cancel/i });
  }

  async waitForFormVisible(): Promise<void> {
    await expect(this.formHeading).toBeVisible({ timeout: 10000 });
  }

  async fillCodeForm(data: {
    codeType?: string;
    codeValue?: string;
    isActive?: boolean;
  }): Promise<void> {
    if (data.codeType !== undefined) {
      await this.codeTypeDropdown.click();
      await this.page.getByRole('option', { name: data.codeType }).click();
      await this.page.waitForTimeout(200);
    }

    if (data.codeValue !== undefined) {
      await this.codeValueInput.clear();
      await this.codeValueInput.fill(data.codeValue);
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

  async isSubmitDisabled(): Promise<boolean> {
    return await this.saveButton.isDisabled();
  }

  async getCodeValue(): Promise<string> {
    return await this.codeValueInput.inputValue();
  }
}
