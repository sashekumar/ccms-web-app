import { Page, Locator } from '@playwright/test';
import { BasePage } from '../base.page';
import { TIMEOUTS } from '../../constants/timeouts';

/**
 * ACL Base Page Object - Foundation for all ACL page objects
 * 
 * Following coding-standards.md principles:
 * - REUSABILITY: Common ACL page methods shared across all ACL pages
 * - COMMONIZATION: Centralized ACL-specific navigation and interactions
 * - DRY: No duplicate ACL page logic
 * 
 * All ACL page objects should extend this class.
 */
export abstract class AclBasePage extends BasePage {
  protected abstract readonly pageUrl: string;
  protected abstract readonly pageTitle: RegExp;

  // Common selectors for ACL pages
  protected readonly selectors = {
    pageTitle: 'h1, h2, .page-title',
    createButton: 'button:has-text("Create"), button:has-text("Add"), button:has-text("New")',
    table: 'table',
    listContainer: '.list, .card, .item',
    searchInput: 'input',
    statusFilter: 'select',
    form: 'form, [class*="form"]',
    submitButton: 'button[type="submit"], button:has-text("Save"), button:has-text("Submit")',
    cancelButton: 'button:has-text("Cancel"), button:has-text("Back")',
    editButton: 'button:has-text("Edit"), [data-testid*="edit"]',
    deleteButton: 'button:has-text("Delete"), [data-testid*="delete"]',
    loadingSpinner: '.loading, .spinner, [class*="loading"]',
  };

  /**
   * Navigate to this ACL page
   */
  async navigateToPage(): Promise<void> {
    await this.page.goto(this.pageUrl);
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Wait for page to be fully loaded
   */
  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForTimeout(TIMEOUTS.PAGE_LOAD_DELAY);
  }

  /**
   * Get page title element
   */
  getPageTitle(): Locator {
    return this.page.locator(this.selectors.pageTitle);
  }

  /**
   * Verify page is displayed with correct title
   */
  async expectPageDisplayed(): Promise<void> {
    await this.page.waitForURL(new RegExp(this.pageUrl));
    const title = this.getPageTitle();
    await title.waitFor({ state: 'visible', timeout: TIMEOUTS.ELEMENT_VISIBLE });
  }

  /**
   * Get create button
   */
  getCreateButton(): Locator {
    return this.page.locator(this.selectors.createButton);
  }

  /**
   * Click create button to open form
   */
  async clickCreate(): Promise<void> {
    const btn = this.getCreateButton();
    await btn.click();
    await this.page.waitForTimeout(TIMEOUTS.PAGE_LOAD_DELAY);
  }

  /**
   * Get data table
   */
  getTable(): Locator {
    return this.page.locator(this.selectors.table);
  }

  /**
   * Check if table or list is visible
   */
  async hasDataDisplay(): Promise<boolean> {
    const hasTable = await this.page.locator(this.selectors.table).isVisible();
    const hasList = await this.page.locator(this.selectors.listContainer).first().isVisible();
    return hasTable || hasList;
  }

  /**
   * Get search input
   */
  getSearchInput(): Locator {
    return this.page.locator(this.selectors.searchInput).first();
  }

  /**
   * Search for item
   */
  async search(term: string): Promise<void> {
    const input = this.getSearchInput();
    await input.fill(term);
    await this.page.waitForTimeout(TIMEOUTS.CHANGE_DETECTION);
  }

  /**
   * Get form element
   */
  getForm(): Locator {
    return this.page.locator(this.selectors.form).first();
  }

  /**
   * Get cancel button
   */
  getCancelButton(): Locator {
    return this.page.locator(this.selectors.cancelButton);
  }

  /**
   * Click cancel button
   */
  async clickCancel(): Promise<void> {
    await this.getCancelButton().click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Get submit button
   */
  getSubmitButton(): Locator {
    return this.page.locator(this.selectors.submitButton);
  }

  /**
   * Get row count from table
   */
  async getRowCount(): Promise<number> {
    const rows = this.page.locator('table tbody tr');
    return await rows.count();
  }
}
