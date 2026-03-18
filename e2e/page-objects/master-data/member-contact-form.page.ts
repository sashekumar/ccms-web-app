import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from '../base.page';

/**
 * Member Contact Form Page Object
 * Represents the member contact create/edit modal/form for e2e testing
 */
export class MemberContactFormPage extends BasePage {
  readonly modalTitle: Locator;
  readonly contactTypeSelect: Locator;
  readonly contactValueInput: Locator;
  readonly contactNameInput: Locator;
  readonly relationshipSelect: Locator;
  readonly isPrimaryCheckbox: Locator;
  readonly isEmergencyCheckbox: Locator;
  readonly saveButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    super(page);
    this.modalTitle = page.locator('[role="dialog"] h3, .modal-title').filter({ hasText: /contact/i });
    this.contactTypeSelect = page.getByLabel(/contact type|type/i);
    this.contactValueInput = page.getByLabel(/contact value|phone|email|value/i);
    this.contactNameInput = page.getByLabel(/contact name|name/i);
    this.relationshipSelect = page.getByLabel(/relationship/i);
    this.isPrimaryCheckbox = page.getByLabel(/primary|is primary/i);
    this.isEmergencyCheckbox = page.getByLabel(/emergency|is emergency/i);
    this.saveButton = page.getByRole('button', { name: /save|submit/i });
    this.cancelButton = page.getByRole('button', { name: /cancel/i });
  }

  async waitForPageLoad(): Promise<void> {
    await expect(this.modalTitle).toBeVisible({ timeout: 10000 });
  }

  async fillContactForm(data: {
    contactType?: string;
    contactValue?: string;
    contactName?: string;
    relationship?: string;
    isPrimary?: boolean;
    isEmergency?: boolean;
  }): Promise<void> {
    if (data.contactType !== undefined) {
      await this.contactTypeSelect.selectOption(data.contactType);
    }
    
    if (data.contactValue !== undefined) {
      await this.contactValueInput.fill(data.contactValue);
    }
    
    if (data.contactName !== undefined) {
      await this.contactNameInput.fill(data.contactName);
    }
    
    if (data.relationship !== undefined) {
      await this.relationshipSelect.selectOption(data.relationship);
    }
    
    if (data.isPrimary !== undefined) {
      const isChecked = await this.isPrimaryCheckbox.isChecked();
      if (data.isPrimary !== isChecked) {
        await this.isPrimaryCheckbox.click();
      }
    }
    
    if (data.isEmergency !== undefined) {
      const isChecked = await this.isEmergencyCheckbox.isChecked();
      if (data.isEmergency !== isChecked) {
        await this.isEmergencyCheckbox.click();
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

  async getContactType(): Promise<string> {
    return await this.contactTypeSelect.inputValue();
  }

  async getContactValue(): Promise<string> {
    return await this.contactValueInput.inputValue();
  }
}
