import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from '../base.page';

/**
 * Member Form Page Object
 * Represents the member create/edit modal/form for e2e testing
 */
export class MemberFormPage extends BasePage {
  readonly modalTitle: Locator;
  readonly fullNameInput: Locator;
  readonly icNoInput: Locator;
  readonly memberTypeSelect: Locator;
  readonly memberStatusSelect: Locator;
  readonly saveButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    super(page);
    this.modalTitle = page.locator('[role="dialog"] h3, .modal-title').filter({ hasText: /member|policy holder/i });
    this.fullNameInput = page.getByLabel(/full name|name/i);
    this.icNoInput = page.getByLabel(/ic.*no|nric/i);
    this.memberTypeSelect = page.getByLabel(/member type|type/i);
    this.memberStatusSelect = page.getByLabel(/status/i);
    this.saveButton = page.getByRole('button', { name: /save|submit/i });
    this.cancelButton = page.getByRole('button', { name: /cancel/i });
  }

  async waitForPageLoad(): Promise<void> {
    await expect(this.modalTitle).toBeVisible({ timeout: 10000 });
  }

  async fillMemberForm(data: {
    fullName?: string;
    icNo?: string;
    memberType?: string;
    memberStatus?: string;
  }): Promise<void> {
    if (data.fullName !== undefined) {
      await this.fullNameInput.fill(data.fullName);
    }
    
    if (data.icNo !== undefined) {
      await this.icNoInput.fill(data.icNo);
    }
    
    if (data.memberType !== undefined) {
      await this.memberTypeSelect.selectOption(data.memberType);
    }
    
    if (data.memberStatus !== undefined) {
      await this.memberStatusSelect.selectOption(data.memberStatus);
    }
  }

  async submit(): Promise<void> {
    await this.saveButton.click();
    await this.page.waitForTimeout(1000);
  }

  async isSubmitDisabled(): Promise<boolean> {
    return await this.saveButton.isDisabled();
  }

  async getFullName(): Promise<string> {
    return await this.fullNameInput.inputValue();
  }

  async getIcNo(): Promise<string> {
    return await this.icNoInput.inputValue();
  }
}
