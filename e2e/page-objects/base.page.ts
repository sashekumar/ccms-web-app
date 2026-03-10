import { Page, Locator } from '@playwright/test';

/**
 * Base Page Object - Foundation for all page objects
 * 
 * Following coding-standards.md principles:
 * - REUSABILITY: Common page methods used by all pages
 * - COMMONIZATION: Shared navigation, waiting, interaction logic
 * - DRY: No duplicate page interaction code
 * 
 * All page objects should extend this base class.
 */

export abstract class BasePage {
  protected readonly page: Page;
  protected readonly baseUrl: string;

  constructor(page: Page) {
    this.page = page;
    this.baseUrl = process.env.BASE_URL || 'http://localhost:4200';
  }

  /**
   * Navigate to specific path
   * @param path - Relative path from base URL
   */
  async goto(path: string = ''): Promise<void> {
    await this.page.goto(`${this.baseUrl}${path}`);
  }

  /**
   * Get current URL
   */
  getCurrentUrl(): string {
    return this.page.url();
  }

  /**
   * Wait for specific URL pattern
   * @param pattern - URL pattern to wait for
   */
  async waitForUrl(pattern: string | RegExp): Promise<void> {
    await this.page.waitForURL(pattern);
  }

  /**
   * Get element by test ID (preferred selector strategy)
   * @param testId - data-testid attribute value
   */
  getByTestId(testId: string): Locator {
    return this.page.getByTestId(testId);
  }

  /**
   * Get element by role
   * @param role - ARIA role
   * @param options - Additional options
   */
  getByRole(role: string, options?: any): Locator {
    return this.page.getByRole(role as any, options);
  }

  /**
   * Get element by label text
   * @param text - Label text
   */
  getByLabel(text: string | RegExp): Locator {
    return this.page.getByLabel(text);
  }

  /**
   * Get element by placeholder
   * @param text - Placeholder text
   */
  getByPlaceholder(text: string | RegExp): Locator {
    return this.page.getByPlaceholder(text);
  }

  /**
   * Get element by text content
   * @param text - Text content
   */
  getByText(text: string | RegExp): Locator {
    return this.page.getByText(text);
  }

  /**
   * Click element
   * @param selector - Element selector or locator
   */
  async click(selector: string | Locator): Promise<void> {
    const locator = typeof selector === 'string' ? this.page.locator(selector) : selector;
    await locator.click();
  }

  /**
   * Fill input field
   * @param selector - Input selector or locator
   * @param value - Value to fill
   */
  async fill(selector: string | Locator, value: string): Promise<void> {
    const locator = typeof selector === 'string' ? this.page.locator(selector) : selector;
    await locator.fill(value);
  }

  /**
   * Type into input field (simulates user typing)
   * @param selector - Input selector or locator
   * @param value - Value to type
   */
  async type(selector: string | Locator, value: string): Promise<void> {
    const locator = typeof selector === 'string' ? this.page.locator(selector) : selector;
    await locator.type(value);
  }

  /**
   * Select option from dropdown
   * @param selector - Select selector or locator
   * @param value - Option value to select
   */
  async select(selector: string | Locator, value: string | string[]): Promise<void> {
    const locator = typeof selector === 'string' ? this.page.locator(selector) : selector;
    await locator.selectOption(value);
  }

  /**
   * Check checkbox or radio button
   * @param selector - Checkbox/radio selector or locator
   */
  async check(selector: string | Locator): Promise<void> {
    const locator = typeof selector === 'string' ? this.page.locator(selector) : selector;
    await locator.check();
  }

  /**
   * Uncheck checkbox
   * @param selector - Checkbox selector or locator
   */
  async uncheck(selector: string | Locator): Promise<void> {
    const locator = typeof selector === 'string' ? this.page.locator(selector) : selector;
    await locator.uncheck();
  }

  /**
   * Wait for element to be visible
   * @param selector - Element selector or locator
   */
  async waitForVisible(selector: string | Locator): Promise<void> {
    const locator = typeof selector === 'string' ? this.page.locator(selector) : selector;
    await locator.waitFor({ state: 'visible' });
  }

  /**
   * Wait for element to be hidden
   * @param selector - Element selector or locator
   */
  async waitForHidden(selector: string | Locator): Promise<void> {
    const locator = typeof selector === 'string' ? this.page.locator(selector) : selector;
    await locator.waitFor({ state: 'hidden' });
  }

  /**
   * Wait for network to be idle
   */
  async waitForNetworkIdle(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Wait for specific time (use sparingly, prefer other wait methods)
   * @param ms - Milliseconds to wait
   */
  async wait(ms: number): Promise<void> {
    await this.page.waitForTimeout(ms);
  }

  /**
   * Check if element is visible
   * @param selector - Element selector or locator
   */
  async isVisible(selector: string | Locator): Promise<boolean> {
    const locator = typeof selector === 'string' ? this.page.locator(selector) : selector;
    return await locator.isVisible();
  }

  /**
   * Check if element is enabled
   * @param selector - Element selector or locator
   */
  async isEnabled(selector: string | Locator): Promise<boolean> {
    const locator = typeof selector === 'string' ? this.page.locator(selector) : selector;
    return await locator.isEnabled();
  }

  /**
   * Get element text content
   * @param selector - Element selector or locator
   */
  async getText(selector: string | Locator): Promise<string | null> {
    const locator = typeof selector === 'string' ? this.page.locator(selector) : selector;
    return await locator.textContent();
  }

  /**
   * Get element attribute value
   * @param selector - Element selector or locator
   * @param attribute - Attribute name
   */
  async getAttribute(selector: string | Locator, attribute: string): Promise<string | null> {
    const locator = typeof selector === 'string' ? this.page.locator(selector) : selector;
    return await locator.getAttribute(attribute);
  }

  /**
   * Get input value
   * @param selector - Input selector or locator
   */
  async getValue(selector: string | Locator): Promise<string> {
    const locator = typeof selector === 'string' ? this.page.locator(selector) : selector;
    return await locator.inputValue();
  }

  /**
   * Take screenshot
   * @param name - Screenshot file name
   */
  async screenshot(name: string): Promise<void> {
    await this.page.screenshot({ path: `test-results/screenshots/${name}.png` });
  }

  /**
   * Reload current page
   */
  async reload(): Promise<void> {
    await this.page.reload();
  }

  /**
   * Go back in browser history
   */
  async goBack(): Promise<void> {
    await this.page.goBack();
  }

  /**
   * Go forward in browser history
   */
  async goForward(): Promise<void> {
    await this.page.goForward();
  }

  /**
   * Get page title
   */
  async getTitle(): Promise<string> {
    return await this.page.title();
  }

  /**
   * Wait for navigation to complete
   */
  async waitForNavigation(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Execute JavaScript in page context
   * @param script - JavaScript code to execute
   */
  async evaluate<T>(script: any): Promise<T> {
    return await this.page.evaluate(script);
  }

  /**
   * Hover over element
   * @param selector - Element selector or locator
   */
  async hover(selector: string | Locator): Promise<void> {
    const locator = typeof selector === 'string' ? this.page.locator(selector) : selector;
    await locator.hover();
  }

  /**
   * Press keyboard key
   * @param key - Key to press
   */
  async press(key: string): Promise<void> {
    await this.page.keyboard.press(key);
  }

  /**
   * Get count of matching elements
   * @param selector - Element selector
   */
  async count(selector: string): Promise<number> {
    return await this.page.locator(selector).count();
  }

  /**
   * Wait for selector to appear
   * @param selector - Element selector
   * @param timeout - Optional timeout in milliseconds
   */
  async waitForSelector(selector: string, timeout?: number): Promise<void> {
    await this.page.waitForSelector(selector, { timeout });
  }

  /**
   * Check if checkbox/radio is checked
   * @param selector - Checkbox/radio selector or locator
   */
  async isChecked(selector: string | Locator): Promise<boolean> {
    const locator = typeof selector === 'string' ? this.page.locator(selector) : selector;
    return await locator.isChecked();
  }

  /**
   * Clear input field
   * @param selector - Input selector or locator
   */
  async clear(selector: string | Locator): Promise<void> {
    const locator = typeof selector === 'string' ? this.page.locator(selector) : selector;
    await locator.clear();
  }

  /**
   * Double click element
   * @param selector - Element selector or locator
   */
  async doubleClick(selector: string | Locator): Promise<void> {
    const locator = typeof selector === 'string' ? this.page.locator(selector) : selector;
    await locator.dblclick();
  }

  /**
   * Right click element
   * @param selector - Element selector or locator
   */
  async rightClick(selector: string | Locator): Promise<void> {
    const locator = typeof selector === 'string' ? this.page.locator(selector) : selector;
    await locator.click({ button: 'right' });
  }
}
