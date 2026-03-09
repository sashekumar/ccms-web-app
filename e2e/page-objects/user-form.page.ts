import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';
import { TIMEOUTS } from '../constants/timeouts';

/**
 * User Form Page Object
 * 
 * Represents the user create/edit form page.
 * 
 * Following coding-standards.md principles:
 * - REUSABILITY: Form methods used across create and edit scenarios
 * - MODULARIZATION: Encapsulates user form logic
 * - COMMONIZATION: Extends BasePage for common functionality
 */

export class UserFormPage extends BasePage {
  // Selectors
  private readonly selectors = {
    // Page elements
    pageTitle: 'h1',
    backButton: 'button:has-text("Back to Users")',
    
    // Form fields
    usernameInput: 'input[formControlName="username"]',
    fullNameInput: 'input[formControlName="full_name"]',
    passwordInput: 'input[formControlName="password"]',
    confirmPasswordInput: 'input[formControlName="confirmPassword"]',
    isActiveCheckbox: 'input[formControlName="is_active"]',
    
    // Buttons
    cancelButton: 'button:has-text("Cancel")',
    submitButton: 'button[type="submit"]',
    
    // Error messages
    errorMessage: 'div.bg-red-50 p',
    fieldError: (fieldName: string) => `input[formControlName="${fieldName}"] ~ p.text-red-500`,
    
    // Validation messages
    usernameRequired: 'text=Username is required',
    usernameMinLength: 'text=Username must be at least 3 characters',
    usernamePattern: 'text=Username can only contain letters, numbers, and underscores',
    fullNameRequired: 'text=Full name is required',
    passwordRequired: 'text=Password is required',
    passwordMinLength: 'text=Password must be at least 8 characters',
    passwordMismatch: 'text=Passwords do not match',
    confirmPasswordRequired: 'text=Password confirmation is required',
  };

  // Expected URLs
  private readonly urls = {
    userCreate: '/users/create',
    userEdit: (id: number) => `/users/edit/${id}`,
    userList: '/users',
  };

  constructor(page: Page) {
    super(page);
  }

  /**
   * Navigate to create user page
   */
  async gotoCreate(): Promise<void> {
    await super.goto(this.urls.userCreate);
    await this.waitForPageLoad();
  }

  /**
   * Navigate to edit user page
   * @param userId - User ID to edit
   */
  async gotoEdit(userId: number): Promise<void> {
    await super.goto(this.urls.userEdit(userId));
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
   * Fill username field
   * @param username - Username to enter
   */
  async fillUsername(username: string): Promise<void> {
    await this.fill(this.selectors.usernameInput, username);
  }

  /**
   * Fill full name field
   * @param fullName - Full name to enter
   */
  async fillFullName(fullName: string): Promise<void> {
    await this.fill(this.selectors.fullNameInput, fullName);
  }

  /**
   * Fill password field
   * @param password - Password to enter
   */
  async fillPassword(password: string): Promise<void> {
    await this.fill(this.selectors.passwordInput, password);
  }

  /**
   * Fill confirm password field
   * @param password - Password to enter
   */
  async fillConfirmPassword(password: string): Promise<void> {
    await this.fill(this.selectors.confirmPasswordInput, password);
  }

  /**
   * Set active status checkbox
   * @param isActive - Whether user should be active
   */
  async setActive(isActive: boolean): Promise<void> {
    const checkbox = this.page.locator(this.selectors.isActiveCheckbox);
    const currentState = await checkbox.isChecked();
    
    if (currentState !== isActive) {
      await checkbox.click();
    }
  }

  /**
   * Fill entire user form
   * @param userData - User data to fill in
   */
  async fillUserForm(userData: {
    username?: string;
    fullName?: string;
    password?: string;
    confirmPassword?: string;
    isActive?: boolean;
  }): Promise<void> {
    if (userData.username) {
      await this.fillUsername(userData.username);
    }
    
    if (userData.fullName) {
      await this.fillFullName(userData.fullName);
    }
    
    if (userData.password) {
      await this.fillPassword(userData.password);
    }
    
    if (userData.confirmPassword) {
      await this.fillConfirmPassword(userData.confirmPassword);
    }
    
    if (userData.isActive !== undefined) {
      await this.setActive(userData.isActive);
    }
  }

  /**
   * Click submit button
   */
  async submit(): Promise<void> {
    await this.click(this.selectors.submitButton);
    await this.waitForNetworkIdle();
  }

  /**
   * Click cancel button
   */
  async cancel(): Promise<void> {
    await this.click(this.selectors.cancelButton);
    await this.waitForNetworkIdle();
  }

  /**
   * Click back button
   */
  async clickBack(): Promise<void> {
    await this.click(this.selectors.backButton);
    await this.waitForNetworkIdle();
  }

  /**
   * Check if form is in edit mode
   */
  async isEditMode(): Promise<boolean> {
    const title = await this.getText(this.selectors.pageTitle);
    return title ? title.includes('Edit User') : false;
  }

  /**
   * Check if form is in create mode
   */
  async isCreateMode(): Promise<boolean> {
    const title = await this.getText(this.selectors.pageTitle);
    return title ? title.includes('Create User') : false;
  }

  /**
   * Check if username field is readonly
   */
  async isUsernameReadonly(): Promise<boolean> {
    const input = this.page.locator(this.selectors.usernameInput);
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
   * Expect to be on create page
   */
  async expectOnCreatePage(): Promise<void> {
    await expect(this.page).toHaveURL(new RegExp(this.urls.userCreate));
    await expect(this.page.locator(this.selectors.pageTitle)).toContainText('Create User');
  }

  /**
   * Expect to be on edit page
   * @param userId - Expected user ID
   */
  async expectOnEditPage(userId: number): Promise<void> {
    await expect(this.page).toHaveURL(new RegExp(this.urls.userEdit(userId)));
    await expect(this.page.locator(this.selectors.pageTitle)).toContainText('Edit User');
  }

  /**
   * Expect form to be visible
   */
  async expectFormVisible(): Promise<void> {
    await expect(this.page.locator(this.selectors.usernameInput)).toBeVisible();
    await expect(this.page.locator(this.selectors.fullNameInput)).toBeVisible();
    await expect(this.page.locator(this.selectors.submitButton)).toBeVisible();
  }

  /**
   * Expect username required error
   */
  async expectUsernameRequiredError(): Promise<void> {
    await expect(this.page.locator(this.selectors.usernameRequired)).toBeVisible();
  }

  /**
   * Expect username min length error
   */
  async expectUsernameMinLengthError(): Promise<void> {
    await expect(this.page.locator(this.selectors.usernameMinLength)).toBeVisible();
  }

  /**
   * Expect username pattern error
   */
  async expectUsernamePatternError(): Promise<void> {
    await expect(this.page.locator(this.selectors.usernamePattern)).toBeVisible();
  }

  /**
   * Expect full name required error
   */
  async expectFullNameRequiredError(): Promise<void> {
    await expect(this.page.locator(this.selectors.fullNameRequired)).toBeVisible();
  }

  /**
   * Expect password required error
   */
  async expectPasswordRequiredError(): Promise<void> {
    await expect(this.page.locator(this.selectors.passwordRequired)).toBeVisible();
  }

  /**
   * Expect password min length error
   */
  async expectPasswordMinLengthError(): Promise<void> {
    await expect(this.page.locator(this.selectors.passwordMinLength)).toBeVisible();
  }

  /**
   * Expect password mismatch error
   */
  async expectPasswordMismatchError(): Promise<void> {
    await expect(this.page.locator(this.selectors.passwordMismatch)).toBeVisible();
  }

  /**
   * Expect confirm password required error
   */
  async expectConfirmPasswordRequiredError(): Promise<void> {
    await expect(this.page.locator(this.selectors.confirmPasswordRequired)).toBeVisible();
  }

  /**
   * Expect submit button to be disabled
   */
  async expectSubmitDisabled(): Promise<void> {
    await expect(this.page.locator(this.selectors.submitButton)).toBeDisabled();
  }

  /**
   * Expect submit button to be enabled
   */
  async expectSubmitEnabled(): Promise<void> {
    await expect(this.page.locator(this.selectors.submitButton)).toBeEnabled();
  }

  /**
   * Expect error message to be visible
   */
  async expectErrorVisible(): Promise<void> {
    await expect(this.page.locator(this.selectors.errorMessage)).toBeVisible();
  }

  /**
   * Expect specific error message
   * @param message - Expected error message
   */
  async expectErrorMessage(message: string): Promise<void> {
    await expect(this.page.locator(this.selectors.errorMessage)).toContainText(message);
  }

  /**
   * Expect to be redirected to user list
   */
  async expectRedirectedToUserList(): Promise<void> {
    await this.page.waitForURL(new RegExp(this.urls.userList), { 
      timeout: TIMEOUTS.NAVIGATION 
    });
  }
}
