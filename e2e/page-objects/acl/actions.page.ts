import { Page } from '@playwright/test';
import { AclBasePage } from './acl-base.page';

/**
 * Actions Page Object - ACL Action Management
 * 
 * Following coding-standards.md principles:
 * - REUSABILITY: Extends AclBasePage for common functionality
 * - MODULARIZATION: Specific to action management
 */
export class ActionsPage extends AclBasePage {
  protected readonly pageUrl = '/admin/actions';
  protected readonly pageTitle = /Action/i;

  constructor(page: Page) {
    super(page);
  }

  /**
   * Fill action form (Template-Driven Forms with ngModel)
   */
  async fillActionForm(data: {
    actionCode?: string;
    actionName?: string;
    description?: string;
  }): Promise<void> {
    if (data.actionCode) {
      await this.page.locator('input[name="code"]').fill(data.actionCode);
    }
    if (data.actionName) {
      await this.page.locator('input[name="name"]').fill(data.actionName);
    }
    if (data.description) {
      await this.page.locator('textarea[name="description"]').fill(data.description);
    }
  }
}
