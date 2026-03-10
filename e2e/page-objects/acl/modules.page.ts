import { Page } from '@playwright/test';
import { AclBasePage } from './acl-base.page';

/**
 * Modules Page Object - ACL Module Management
 * 
 * Following coding-standards.md principles:
 * - REUSABILITY: Extends AclBasePage for common functionality
 * - MODULARIZATION: Specific to module management
 */
export class ModulesPage extends AclBasePage {
  protected readonly pageUrl = '/admin/modules';
  protected readonly pageTitle = /Module/i;

  constructor(page: Page) {
    super(page);
  }

  /**
   * Fill module form
   */
  async fillModuleForm(data: {
    moduleCode?: string;
    moduleName?: string;
    categoryId?: string;
    description?: string;
  }): Promise<void> {
    if (data.moduleCode) {
      await this.page.locator('input[formcontrolname*="code"], input[name*="code"]').first().fill(data.moduleCode);
    }
    if (data.moduleName) {
      await this.page.locator('input[formcontrolname*="name"], input[name*="name"]').first().fill(data.moduleName);
    }
    if (data.categoryId) {
      await this.page.locator('select[formcontrolname*="category"]').selectOption(data.categoryId);
    }
    if (data.description) {
      await this.page.locator('textarea, input[formcontrolname*="description"]').first().fill(data.description);
    }
  }
}
