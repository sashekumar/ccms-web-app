import { Page } from '@playwright/test';
import { AclBasePage } from './acl-base.page';

/**
 * Categories Page Object - ACL Category Management
 * 
 * Following coding-standards.md principles:
 * - REUSABILITY: Extends AclBasePage for common functionality
 * - MODULARIZATION: Specific to category management
 */
export class CategoriesPage extends AclBasePage {
  protected readonly pageUrl = '/admin/categories';
  protected readonly pageTitle = /Categor/i;

  constructor(page: Page) {
    super(page);
  }

  /**
   * Fill category form
   */
  async fillCategoryForm(data: {
    categoryCode?: string;
    categoryName?: string;
    description?: string;
  }): Promise<void> {
    if (data.categoryCode) {
      await this.page.locator('input[formcontrolname*="code"], input[name*="code"]').first().fill(data.categoryCode);
    }
    if (data.categoryName) {
      await this.page.locator('input[formcontrolname*="name"], input[name*="name"]').first().fill(data.categoryName);
    }
    if (data.description) {
      await this.page.locator('textarea, input[formcontrolname*="description"]').first().fill(data.description);
    }
  }
}
