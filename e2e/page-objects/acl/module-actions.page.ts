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
  protected readonly pageTitle = /Module-Action Management/i;

  constructor(page: Page) {
    super(page);
  }

  /**
   * Get "Attach Actions to Module" button
   */
  getCreateButton(): Locator {
    return this.page.locator('button:has-text("Attach Actions to Module")');
  }

  /**
   * Get module select in create form
   */
  getModuleSelect(): Locator {
    return this.page.locator('app-dropdown[name="module"]');
  }

  /**
   * Get module filter dropdown (first app-dropdown on page)
   */
  getModuleFilter(): Locator {
    return this.page.locator('app-dropdown').nth(0);
  }

  /**
   * Get action filter dropdown (second app-dropdown on page)
   */
  getActionFilter(): Locator {
    return this.page.locator('app-dropdown').nth(1);
  }

  /**
   * Get status filter dropdown (third app-dropdown on page)
   */
  getStatusFilter(): Locator {
    return this.page.locator('app-dropdown').nth(2);
  }

  /**
   * Get action checkboxes in create form
   */
  getActionCheckboxes(): Locator {
    return this.page.locator('input[type="checkbox"][id^="action-"]');
  }

  /**
   * Get search input
   */
  getSearchInput(): Locator {
    return this.page.locator('input[placeholder*="Module or action name"]');
  }

  /**
   * Get edit buttons
   */
  getEditButtons(): Locator {
    return this.page.locator('[data-testid="edit-module-action-button"]');
  }

  /**
   * Get delete buttons
   */
  getDeleteButtons(): Locator {
    return this.page.locator('[data-testid="delete-module-action-button"]');
  }

  /**
   * Get custom label input in modal
   */
  getLabelInput(): Locator {
    return this.page.locator('input[name="label"]');
  }
}
