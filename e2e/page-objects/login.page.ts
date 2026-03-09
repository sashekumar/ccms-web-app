import { Page, expect } from '@playwright/test';
import { BasePage } from './base.page';
import { TIMEOUTS } from '../constants/timeouts';

/**
 * Login Page Object
 * 
 * Represents the login page and provides methods to interact with it.
 * 
 * Following coding-standards.md principles:
 * - REUSABILITY: Login methods used across all test suites
 * - MODULARIZATION: Encapsulates login page logic
 * - COMMONIZATION: Extends BasePage for common functionality
 */

export class LoginPage extends BasePage {
  // Selectors - Matching actual Angular form structure
  private readonly selectors = {
    usernameInput: 'input[formControlName="username"]',
    passwordInput: 'input[formControlName="password"]',
    loginButton: 'button[type="submit"]',
    errorMessage: '[role="alert"]',
    rememberMeCheckbox: 'input[name="rememberMe"]', // Not implemented yet
    forgotPasswordLink: 'a[href*="forgot-password"]', // Not implemented yet
    loginForm: 'form',
  };

  // Expected URLs
  private readonly urls = {
    login: '/auth/login',
    dashboard: '/dashboard',
  };

  constructor(page: Page) {
    super(page);
  }

  /**
   * Navigate to login page
   */
  async goto(): Promise<void> {
    await super.goto(this.urls.login);
    await this.waitForPageLoad();
  }

  /**
   * Wait for login page to fully load
   */
  async waitForPageLoad(): Promise<void> {
    await this.waitForVisible(this.selectors.loginForm);
    await this.waitForVisible(this.selectors.usernameInput);
    await this.waitForVisible(this.selectors.passwordInput);
    await this.waitForVisible(this.selectors.loginButton);
  }

  /**
   * Login with username and password
   * @param username - Username
   * @param password - User password
   * @param rememberMe - Check "Remember Me" checkbox (currently not implemented in UI)
   */
  async login(username: string, password: string, rememberMe: boolean = false): Promise<void> {
    await this.fill(this.selectors.usernameInput, username);
    await this.fill(this.selectors.passwordInput, password);
    
    // Remember Me checkbox not implemented in UI yet
    // if (rememberMe) {
    //   await this.check(this.selectors.rememberMeCheckbox);
    // }
    
    await this.click(this.selectors.loginButton);
  }

  /**
   * Fill username field
   * @param username - Username
   */
  async fillUsername(username: string): Promise<void> {
    await this.fill(this.selectors.usernameInput, username);
  }

  /**
   * Fill password field
   * @param password - Password
   */
  async fillPassword(password: string): Promise<void> {
    await this.fill(this.selectors.passwordInput, password);
  }

  /**
   * Click login button
   */
  async clickLogin(): Promise<void> {
    const button = this.page.locator(this.selectors.loginButton);
    await button.waitFor({ state: 'visible', timeout: TIMEOUTS.BUTTON_VISIBLE });
    await this.click(button);
  }

  /**
   * Check "Remember Me" checkbox
   */
  async checkRememberMe(): Promise<void> {
    await this.check(this.selectors.rememberMeCheckbox);
  }

  /**
   * Click "Forgot Password" link
   */
  async clickForgotPassword(): Promise<void> {
    await this.click(this.selectors.forgotPasswordLink);
  }

  /**
   * Get error message text
   */
  async getErrorMessage(): Promise<string | null> {
    return await this.getText(this.selectors.errorMessage);
  }

  /**
   * Check if error message is visible
   */
  async isErrorMessageVisible(): Promise<boolean> {
    return await this.isVisible(this.selectors.errorMessage);
  }

  /**
   * Wait for login to complete and navigate to dashboard
   */
  async waitForLoginSuccess(): Promise<void> {
    await this.waitForUrl(new RegExp(this.urls.dashboard));
    await this.waitForNetworkIdle();
  }

  /**
   * Expect login was successful (assertion)
   */
  async expectLoginSuccess(): Promise<void> {
    await expect(this.page).toHaveURL(new RegExp(this.urls.dashboard));
  }

  /**
   * Expect login failed with error message (assertion)
   * @param expectedMessage - Expected error message (optional)
   */
  async expectLoginFailed(expectedMessage?: string): Promise<void> {
    await expect(this.page.locator(this.selectors.errorMessage)).toBeVisible();
    
    if (expectedMessage) {
      const errorMessage = await this.getErrorMessage();
      expect(errorMessage).toContain(expectedMessage);
    }
  }

  /**
   * Expect to be on login page (assertion)
   */
  async expectOnLoginPage(): Promise<void> {
    await expect(this.page).toHaveURL(new RegExp(this.urls.login));
  }

  /**
   * Check if login button is enabled
   */
  async isLoginButtonEnabled(): Promise<boolean> {
    return await this.isEnabled(this.selectors.loginButton);
  }

  /**
   * Check if "Remember Me" is checked
   */
  async isRememberMeChecked(): Promise<boolean> {
    return await this.isChecked(this.selectors.rememberMeCheckbox);
  }

  /**
   * Get username input value
   */
  async getUsernameValue(): Promise<string> {
    return await this.getValue(this.selectors.usernameInput);
  }

  /**
   * Get password input value
   */
  async getPasswordValue(): Promise<string> {
    return await this.getValue(this.selectors.passwordInput);
  }

  /**
   * Clear username field
   */
  async clearUsername(): Promise<void> {
    await this.clear(this.selectors.usernameInput);
  }

  /**
   * Clear password field
   */
  async clearPassword(): Promise<void> {
    await this.clear(this.selectors.passwordInput);
  }

  /**
   * Submit form by pressing Enter
   */
  async submitWithEnter(): Promise<void> {
    await this.page.locator(this.selectors.passwordInput).press('Enter');
  }

  /**
   * Quick login helper - Login and wait for success
   * @param username - Username
   * @param password - User password
   */
  async loginAndWait(username: string, password: string): Promise<void> {
    await this.login(username, password);
    await this.waitForLoginSuccess();
  }
}
