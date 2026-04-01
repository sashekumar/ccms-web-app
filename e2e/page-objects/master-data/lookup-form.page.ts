import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from '../base.page';

/**
 * Lookup Form Page Object
 * Represents the lookup value create/edit modal/form for e2e testing
 */
export class LookupFormPage extends BasePage {
  readonly modalTitle: Locator;
  readonly lookupCodeInput: Locator;
  readonly lookupValueInput: Locator;
  readonly categoryDropdownTrigger: Locator;
  readonly newCategoryNameInput: Locator;
  readonly isActiveCheckbox: Locator;
  readonly saveButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    super(page);
    this.modalTitle = page.locator('h3').filter({ hasText: /lookup/i });
    this.lookupCodeInput = page.getByLabel(/lookup code/i);
    this.lookupValueInput = page.getByLabel(/lookup value/i);
    // Category is an app-dropdown; scope to modal overlay to avoid matching table filter
    this.categoryDropdownTrigger = page.locator('.fixed app-dropdown').filter({ hasText: /category/i }).locator('button').first();
    this.newCategoryNameInput = page.getByLabel(/new category name/i);
    this.isActiveCheckbox = page.locator('.fixed app-checkbox input[type="checkbox"]');
    this.saveButton = page.getByRole('button', { name: /save|submit/i });
    this.cancelButton = page.getByRole('button', { name: /cancel/i });
  }

  async waitForPageLoad(): Promise<void> {
    await expect(this.modalTitle).toBeVisible({ timeout: 10000 });
  }

  async fillLookupForm(data: {
    lookupCode?: string;
    lookupValue?: string;
    newCategoryName?: string; // Use "+ Add New Category" option and provide a name
    isActive?: boolean;
  }): Promise<void> {
    if (data.lookupCode !== undefined) {
      await this.lookupCodeInput.fill(data.lookupCode);
    }
    
    if (data.lookupValue !== undefined) {
      await this.lookupValueInput.fill(data.lookupValue);
    }

    if (data.newCategoryName !== undefined) {
      // Open category dropdown and select "+ Add New Category"
      await this.categoryDropdownTrigger.click();
      await this.page.locator('[role="option"], li[role="option"]').filter({ hasText: 'Add New Category' }).click();
      // Fill in the new category name
      await this.newCategoryNameInput.fill(data.newCategoryName);
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

  async getLookupCode(): Promise<string> {
    return await this.lookupCodeInput.inputValue();
  }

  async getLookupValue(): Promise<string> {
    return await this.lookupValueInput.inputValue();
  }
}
