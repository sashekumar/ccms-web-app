import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from '../base.page';

/**
 * MQ Template Form Page Object
 * Represents the MQ template create/edit modal for e2e testing
 */
export class MqTemplateFormPage extends BasePage {
  readonly modalTitle: Locator;
  readonly templateCodeInput: Locator;
  readonly recipientTypeSelect: Locator;
  readonly categorySelect: Locator;
  readonly emailSubjectInput: Locator;
  readonly reminderDaysInput: Locator;
  readonly autoReminderDaysInput: Locator;
  readonly isActiveCheckbox: Locator;
  readonly saveButton: Locator;
  readonly cancelButton: Locator;

  // Question modal fields
  readonly questionTextArea: Locator;
  readonly requiredLinesInput: Locator;
  readonly sortOrderInput: Locator;

  constructor(page: Page) {
    super(page);
    this.modalTitle = page.locator('.rounded-lg.bg-white h3, [role="dialog"] h3').first();
    
    // Template form fields
    this.templateCodeInput = page.locator('app-text-input').filter({ hasText: /template code/i }).locator('input');
    this.recipientTypeSelect = page.locator('app-dropdown').filter({ hasText: /recipient/i }).locator('select, button');
    this.categorySelect = page.locator('app-dropdown').filter({ hasText: /category/i }).locator('select, button');
    this.emailSubjectInput = page.locator('app-text-input').filter({ hasText: /email subject/i }).locator('input');
    this.reminderDaysInput = page.locator('app-text-input').filter({ hasText: /reminder days/i }).locator('input').first();
    this.autoReminderDaysInput = page.locator('app-text-input').filter({ hasText: /auto-reminder/i }).locator('input');
    this.isActiveCheckbox = page.locator('app-checkbox').filter({ hasText: /active/i }).locator('input[type="checkbox"]');
    
    // Question form fields
    this.questionTextArea = page.locator('app-text-area').filter({ hasText: /question text/i }).locator('textarea');
    this.requiredLinesInput = page.locator('app-text-input').filter({ hasText: /response lines/i }).locator('input');
    this.sortOrderInput = page.locator('app-text-input').filter({ hasText: /sort order/i }).locator('input');
    
    this.saveButton = page.getByRole('button', { name: /save/i });
    this.cancelButton = page.getByRole('button', { name: /cancel/i });
  }

  async waitForPageLoad(): Promise<void> {
    await expect(this.modalTitle).toBeVisible({ timeout: 10000 });
  }

  async fillTemplateForm(data: {
    templateCode?: string;
    recipientType?: string;
    category?: string;
    emailSubject?: string;
    reminderDays?: number;
    autoReminderDays?: number;
    isActive?: boolean;
  }): Promise<void> {
    if (data.templateCode !== undefined) {
      await this.templateCodeInput.fill(data.templateCode);
      await this.page.waitForTimeout(100);
    }

    if (data.recipientType !== undefined) {
      // Check if it's a select or custom dropdown
      const isSelect = await this.recipientTypeSelect.evaluate(el => el.tagName === 'SELECT');
      if (isSelect) {
        await this.recipientTypeSelect.selectOption({ label: data.recipientType });
      } else {
        // Custom dropdown - click and select
        await this.recipientTypeSelect.click();
        await this.page.locator(`[role="option"], li`).filter({ hasText: data.recipientType }).click();
      }
      await this.page.waitForTimeout(100);
    }

    if (data.category !== undefined) {
      const isSelect = await this.categorySelect.evaluate(el => el.tagName === 'SELECT');
      if (isSelect) {
        await this.categorySelect.selectOption({ label: data.category });
      } else {
        await this.categorySelect.click();
        await this.page.locator(`[role="option"], li`).filter({ hasText: data.category }).click();
      }
      await this.page.waitForTimeout(100);
    }

    if (data.emailSubject !== undefined) {
      await this.emailSubjectInput.fill(data.emailSubject);
      await this.page.waitForTimeout(100);
    }

    if (data.reminderDays !== undefined) {
      await this.reminderDaysInput.fill(data.reminderDays.toString());
      await this.page.waitForTimeout(100);
    }

    if (data.autoReminderDays !== undefined) {
      await this.autoReminderDaysInput.fill(data.autoReminderDays.toString());
      await this.page.waitForTimeout(100);
    }

    if (data.isActive !== undefined) {
      const isChecked = await this.isActiveCheckbox.isChecked();
      if (isChecked !== data.isActive) {
        await this.isActiveCheckbox.click();
      }
      await this.page.waitForTimeout(100);
    }
  }

  async fillQuestionForm(data: {
    questionText?: string;
    requiredLines?: number;
    sortOrder?: number;
  }): Promise<void> {
    if (data.questionText !== undefined) {
      await this.questionTextArea.fill(data.questionText);
      await this.page.waitForTimeout(100);
    }

    if (data.requiredLines !== undefined) {
      await this.requiredLinesInput.fill(data.requiredLines.toString());
      await this.page.waitForTimeout(100);
    }

    if (data.sortOrder !== undefined) {
      await this.sortOrderInput.fill(data.sortOrder.toString());
      await this.page.waitForTimeout(100);
    }
  }

  async submit(): Promise<void> {
    await this.saveButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  async cancel(): Promise<void> {
    await this.cancelButton.click();
    await this.page.waitForTimeout(300);
  }

  async expectValidationError(fieldName: string): Promise<void> {
    const errorMessage = this.page.locator('.text-red-500, .text-danger, .error-message').filter({ 
      hasText: new RegExp(fieldName, 'i') 
    });
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
  }
}
