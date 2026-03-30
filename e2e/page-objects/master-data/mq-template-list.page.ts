import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from '../base.page';

/**
 * MQ Template List Page Object
 * Represents the MQ Templates management page for e2e testing
 */
export class MqTemplateListPage extends BasePage {
  readonly pageTitle: Locator;
  readonly createButton: Locator;
  readonly searchInput: Locator;
  readonly dataTable: Locator;
  readonly noDataMessage: Locator;
  readonly recipientTypeFilter: Locator;
  readonly categoryFilter: Locator;
  readonly statusFilter: Locator;
  readonly questionsPanel: Locator;
  readonly addQuestionButton: Locator;

  constructor(page: Page) {
    super(page);
    this.pageTitle = page.locator('h1').filter({ hasText: /mq templates/i });
    this.createButton = page.getByRole('button', { name: /new template/i });
    this.searchInput = page.getByPlaceholder(/search/i);
    this.dataTable = page.locator('app-data-table').first();
    this.noDataMessage = page.getByText(/no.*template.*found/i);
    this.recipientTypeFilter = page.locator('select, [role="combobox"]').filter({ hasText: /recipient/i });
    this.categoryFilter = page.locator('select, [role="combobox"]').filter({ hasText: /category/i });
    this.statusFilter = page.locator('select, [role="combobox"]').filter({ hasText: /status|active/i });
    this.questionsPanel = page.locator('.w-96').filter({ hasText: /question/i });
    this.addQuestionButton = page.getByRole('button', { name: /add q/i });
  }

  async goto(): Promise<void> {
    await super.goto('/mq-templates');
  }

  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
    await expect(this.pageTitle).toBeVisible({ timeout: 10000 });
  }

  async clickCreateTemplate(): Promise<void> {
    await this.createButton.click();
    await this.page.waitForTimeout(300);
  }

  async search(searchTerm: string): Promise<void> {
    await this.searchInput.fill(searchTerm);
    await this.page.waitForTimeout(500);
  }

  getRow(identifier: string): Locator {
    return this.page.locator(`tr:has-text("${identifier}")`);
  }

  async clickRow(identifier: string): Promise<void> {
    const row = this.getRow(identifier);
    await expect(row).toBeVisible({ timeout: 10000 });
    await row.click();
    await this.page.waitForTimeout(500);
  }

  async clickEdit(identifier: string): Promise<void> {
    const row = this.getRow(identifier);
    await expect(row).toBeVisible({ timeout: 10000 });
    const editButton = row.locator('button:has-text("Edit"), button[title*="Edit"], svg').first();
    await editButton.click();
    await this.page.waitForTimeout(300);
  }

  async clickDelete(identifier: string): Promise<void> {
    const row = this.getRow(identifier);
    await expect(row).toBeVisible({ timeout: 10000 });
    const deleteButton = row.locator('button').filter({ hasText: /delete|trash/i }).or(
      row.locator('svg').filter({ has: this.page.locator('path[d*="M19 7l"]') })
    ).first();
    await deleteButton.click();
    await this.page.waitForTimeout(300);
  }

  async expectTemplateVisible(identifier: string): Promise<void> {
    await expect(this.getRow(identifier)).toBeVisible({ timeout: 10000 });
  }

  async expectTemplateNotVisible(identifier: string): Promise<void> {
    await expect(this.getRow(identifier)).not.toBeVisible({ timeout: 5000 });
  }

  async expectQuestionsPanelVisible(): Promise<void> {
    await expect(this.questionsPanel).toBeVisible({ timeout: 10000 });
  }

  async getQuestionCount(): Promise<number> {
    const questions = this.page.locator('.group.flex.items-start.gap-3');
    return await questions.count();
  }

  async clickAddQuestion(): Promise<void> {
    await this.addQuestionButton.click();
    await this.page.waitForTimeout(300);
  }

  async clickEditQuestion(questionText: string): Promise<void> {
    const questionRow = this.page.locator('.group').filter({ hasText: questionText });
    await questionRow.hover();
    const editButton = questionRow.locator('button').first();
    await editButton.click();
    await this.page.waitForTimeout(300);
  }

  async clickDeleteQuestion(questionText: string): Promise<void> {
    const questionRow = this.page.locator('.group').filter({ hasText: questionText });
    await questionRow.hover();
    const deleteButton = questionRow.locator('button').last();
    await deleteButton.click();
    await this.page.waitForTimeout(300);
  }

  async confirmDialog(): Promise<void> {
    const confirmButton = this.page.getByRole('button', { name: /yes|confirm|delete/i });
    await confirmButton.click();
    await this.page.waitForTimeout(500);
  }

  async cancelDialog(): Promise<void> {
    const cancelButton = this.page.getByRole('button', { name: /cancel|no/i });
    await cancelButton.click();
    await this.page.waitForTimeout(300);
  }
}
