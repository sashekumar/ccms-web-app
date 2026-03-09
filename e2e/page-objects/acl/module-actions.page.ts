import { Page, Locator } from '@playwright/test';
import { AclBasePage } from './acl-base.page';

/**
 * Module Actions Page Object - ACL Module-Action Mapping
 * 
 * Following coding-standards.md principles:
 * - REUSABILITY: Extends AclBasePage for common functionality
 * - MODULARIZATION: Specific to module-action mapping
 */
export class ModuleActionsPage extends AclBasePage {
  protected readonly pageUrl = '/admin/module-actions';
  protected readonly pageTitle = /Module.*Action|Action/i;

  constructor(page: Page) {
    super(page);
  }

  /**
   * Get module filter dropdown
   */
  getModuleFilter(): Locator {
    return this.page.locator('select[formcontrolname*="module"], select[name*="module"]').first();
  }

  /**
   * Filter by module
   */
  async filterByModule(moduleId: string): Promise<void> {
    await this.getModuleFilter().selectOption(moduleId);
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Get action checkboxes
   */
  getActionCheckboxes(): Locator {
    return this.page.locator('input[type="checkbox"]');
  }

  /**
   * Toggle action assignment
   */
  async toggleAction(actionName: string): Promise<void> {
    const checkbox = this.page.locator(`label:has-text("${actionName}") input[type="checkbox"], input[type="checkbox"]:near(:text("${actionName}"))`);
    await checkbox.click();
  }
}
