import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from '../base.page';

/**
 * Product Threshold Form Page Object
 * Represents the LOS Alert Threshold modal overlay in the LOS Alert Thresholds tab of product-view.
 * Modal: div.fixed.inset-0 > div.w-full.max-w-lg > h3 "Add Threshold" / "Edit Threshold"
 * Fields:
 *   - diagnosis_category (app-dropdown, optional - default apply to all)
 *   - threshold_days (app-text-input integer, required)
 *   - alert_level (app-dropdown, required)
 *   - is_active (app-checkbox)
 * Buttons: "Cancel" and "Create" / "Update"
 */
export class ProductThresholdFormPage extends BasePage {
  readonly modalTitle: Locator;
  readonly diagnosisCategoryDropdown: Locator;
  readonly thresholdDaysInput: Locator;
  readonly alertLevelDropdown: Locator;
  readonly isActiveCheckbox: Locator;
  readonly saveButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    super(page);
    this.modalTitle = page.locator('h3').filter({ hasText: /add threshold|edit threshold/i });
    this.diagnosisCategoryDropdown = page.locator('[name="diagnosis_category"]');
    this.thresholdDaysInput = page.locator('input[name="threshold_days"]');
    this.alertLevelDropdown = page.locator('[name="alert_level"]');
    this.isActiveCheckbox = page.getByRole('checkbox', { name: /^active$/i });
    this.saveButton = page.getByRole('button', { name: /^create$|^update$/i });
    this.cancelButton = page.getByRole('button', { name: /^cancel$/i });
  }

  async waitForPageLoad(): Promise<void> {
    await expect(this.modalTitle).toBeVisible({ timeout: 10000 });
  }

  async fillThresholdForm(data: {
    diagnosisCategory?: string;
    thresholdDays?: string | number;
    alertLevel?: string | number;
    isActive?: boolean;
  }): Promise<void> {
    if (data.diagnosisCategory !== undefined) {
      await this.diagnosisCategoryDropdown.click();
      await this.page.getByRole('option', { name: data.diagnosisCategory }).click();
      await this.page.waitForTimeout(300);
    }
    if (data.thresholdDays !== undefined) {
      await this.thresholdDaysInput.click();
      await this.thresholdDaysInput.clear();
      await this.thresholdDaysInput.fill(String(data.thresholdDays));
    }
    if (data.alertLevel !== undefined) {
      await this.alertLevelDropdown.click();
      const alertLevelStr = String(data.alertLevel);
      // Alert levels might be "Level 1", "Level 2", or just "1", "2"
      // Try to match either format
      let option = this.page.getByRole('option', { name: `Level ${alertLevelStr}` });
      let isVisible = await option.isVisible().catch(() => false);
      if (!isVisible) {
        option = this.page.getByRole('option', { name: alertLevelStr });
      }
      await option.click();
      await this.page.waitForTimeout(300);
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
    await this.page.waitForLoadState('networkidle');
  }

  async cancel(): Promise<void> {
    await this.cancelButton.click();
  }

  async isSubmitDisabled(): Promise<boolean> {
    return await this.saveButton.isDisabled();
  }

  async getThresholdDays(): Promise<string> {
    return await this.thresholdDaysInput.inputValue();
  }
}
