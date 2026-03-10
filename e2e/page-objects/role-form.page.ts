import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';
import { TIMEOUTS } from '../constants/timeouts';

/**
 * Role Form Page Object
 * 
 * Represents the role create/edit form page.
 * 
 * Following coding-standards.md principles:
 * - REUSABILITY: Form methods used across create and edit scenarios
 * - MODULARIZATION: Encapsulates role form logic
 * - COMMONIZATION: Extends BasePage for common functionality
 */

export class RoleFormPage extends BasePage {
  // Selectors
  private readonly selectors = {
    // Page elements
    pageTitle: 'h1',
    backButton: 'button:has-text("Back to Roles")',
    
    // Form fields
    roleNameInput: 'input[formControlName="roleName"]',
    roleCodeInput: 'input[formControlName="roleCode"]',
    descriptionTextarea: 'textarea[formControlName="description"]',
    isActiveCheckbox: 'input[formControlName="isActive"]',
    
    // Buttons
    cancelButton: 'button:has-text("Cancel")',
    submitButton: 'button[type="submit"]',
    
    // Error messages
    errorMessage: 'div.bg-red-50 p',
    fieldError: (fieldName: string) => `input[formControlName="${fieldName}"] ~ p.text-red-500, textarea[formControlName="${fieldName}"] ~ p.text-red-500`,
    
    // Validation messages
    roleNameRequired: 'text=Role name is required',
    roleNameMaxLength: 'text=Role name must not exceed 100 characters',
    roleCodeRequired: 'text=Role code is required',
    roleCodeMaxLength: 'text=Role code must not exceed 50 characters',
    roleCodePattern: 'text=Role code can only contain uppercase letters, numbers, and underscores',
  };

  // Expected URLs
  private readonly urls = {
    roleCreate: '/admin/roles/create',
    roleEdit: (id: number) => `/admin/roles/edit/${id}`,
    roleList: '/admin/roles',
  };

  constructor(page: Page) {
    super(page);
  }

  /**
   * Navigate to create role page
   */
  async gotoCreate(): Promise<void> {
    await super.goto(this.urls.roleCreate);
    await this.waitForPageLoad();
  }

  /**
   * Navigate to edit role page
   * @param roleId - Role ID to edit
   */
  async gotoEdit(roleId: number): Promise<void> {
    await super.goto(this.urls.roleEdit(roleId));
    await this.waitForPageLoad();
  }

  /**
   * Wait for form page to fully load
   */
  async waitForPageLoad(): Promise<void> {
    await this.page.locator(this.selectors.pageTitle).waitFor({ 
      state: 'visible', 
      timeout: TIMEOUTS.ELEMENT_VISIBLE 
    });
    await this.waitForNetworkIdle();
  }

  /**
   * Fill role name field
   * @param roleName - Role name to enter
   */
  async fillRoleName(roleName: string): Promise<void> {
    await this.fill(this.selectors.roleNameInput, roleName);
  }

  /**
   * Fill role code field
   * @param roleCode - Role code to enter
   */
  async fillRoleCode(roleCode: string): Promise<void> {
    await this.fill(this.selectors.roleCodeInput, roleCode);
  }

  /**
   * Fill description field
   * @param description - Description to enter
   */
  async fillDescription(description: string): Promise<void> {
    await this.fill(this.selectors.descriptionTextarea, description);
  }

  /**
   * Set active status checkbox
   * @param isActive - Whether role should be active
   */
  async setActive(isActive: boolean): Promise<void> {
    const checkbox = this.page.locator(this.selectors.isActiveCheckbox);
    const currentState = await checkbox.isChecked();
    
    if (currentState !== isActive) {
      await checkbox.click();
    }
  }

  /**
   * Fill entire role form
   * @param roleData - Role data to fill in
   */
  async fillRoleForm(roleData: {
    roleName?: string;
    roleCode?: string;
    description?: string;
    isActive?: boolean;
  }): Promise<void> {
    if (roleData.roleName) {
      await this.fillRoleName(roleData.roleName);
    }
    
    if (roleData.roleCode) {
      await this.fillRoleCode(roleData.roleCode);
    }
    
    if (roleData.description) {
      await this.fillDescription(roleData.description);
    }
    
    if (roleData.isActive !== undefined) {
      await this.setActive(roleData.isActive);
    }
  }

  /**
   * Click submit button
   */
  async clickSubmit(): Promise<void> {
    await this.click(this.selectors.submitButton);
    // Wait for navigation after successful submission
    await this.waitForNetworkIdle();
  }

  /**
   * Click cancel button
   */
  async clickCancel(): Promise<void> {
    await this.click(this.selectors.cancelButton);
  }

  /**
   * Click back button
   */
  async clickBack(): Promise<void> {
    await this.click(this.selectors.backButton);
  }

  /**
   * Submit form and wait for navigation
   */
  async submitForm(): Promise<void> {
    await this.clickSubmit();
    await this.waitForNavigation();
  }

  /**
   * Get page title
   */
  async getPageTitle(): Promise<string> {
    const title = this.page.locator(this.selectors.pageTitle);
    return await title.textContent() || '';
  }

  /**
   * Check if role name field is readonly
   */
  async isRoleNameReadonly(): Promise<boolean> {
    const input = this.page.locator(this.selectors.roleNameInput);
    const readonly = await input.getAttribute('readonly');
    return readonly !== null;
  }

  /**
   * Check if role code field is readonly
   */
  async isRoleCodeReadonly(): Promise<boolean> {
    const input = this.page.locator(this.selectors.roleCodeInput);
    const readonly = await input.getAttribute('readonly');
    return readonly !== null;
  }

  /**
   * Check if submit button is disabled
   */
  async isSubmitDisabled(): Promise<boolean> {
    const button = this.page.locator(this.selectors.submitButton);
    return await button.isDisabled();
  }

  /**
   * Get error message
   */
  async getErrorMessage(): Promise<string | null> {
    const errorElement = this.page.locator(this.selectors.errorMessage);
    const count = await errorElement.count();
    
    if (count === 0) {
      return null;
    }
    
    return await errorElement.textContent();
  }

  /**
   * Check if error message is visible
   */
  async hasError(): Promise<boolean> {
    return await this.isVisible(this.selectors.errorMessage);
  }

  /**
   * Get field error message for a specific field
   * @param fieldName - Field name to check
   */
  async getFieldError(fieldName: string): Promise<string | null> {
    const errorElement = this.page.locator(this.selectors.fieldError(fieldName));
    const count = await errorElement.count();
    
    if (count === 0) {
      return null;
    }
    
    return await errorElement.textContent();
  }

  // Expectation helpers
  
  /**
   * Expect form to be visible
   */
  async expectFormVisible(): Promise<void> {
    await expect(this.page.locator(this.selectors.roleNameInput)).toBeVisible();
    await expect(this.page.locator(this.selectors.roleCodeInput)).toBeVisible();
    await expect(this.page.locator(this.selectors.submitButton)).toBeVisible();
  }

  /**
   * Expect role name required error
   */
  async expectRoleNameRequiredError(): Promise<void> {
    await expect(this.page.locator(this.selectors.roleNameRequired)).toBeVisible();
  }

  /**
   * Expect role code required error
   */
  async expectRoleCodeRequiredError(): Promise<void> {
    await expect(this.page.locator(this.selectors.roleCodeRequired)).toBeVisible();
  }

  /**
   * Expect role code pattern error
   */
  async expectRoleCodePatternError(): Promise<void> {
    await expect(this.page.locator(this.selectors.roleCodePattern)).toBeVisible();
  }

  /**
   * Expect success navigation to role list
   */
  async expectNavigatedToRoleList(): Promise<void> {
    await this.page.waitForURL(new RegExp(this.urls.roleList));
  }

  /**
   * Expect page title
   * @param expectedTitle - Expected title
   */
  async expectPageTitle(expectedTitle: string): Promise<void> {
    await expect(this.page.locator(this.selectors.pageTitle)).toHaveText(expectedTitle);
  }
}
