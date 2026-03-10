import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';
import { TIMEOUTS } from '../constants/timeouts';

/**
 * User List Page Object
 * 
 * Represents the user management list page.
 * 
 * Following coding-standards.md principles:
 * - REUSABILITY: User management methods used across test suites
 * - MODULARIZATION: Encapsulates user list page logic
 * - COMMONIZATION: Extends BasePage for common functionality
 */

export class UserListPage extends BasePage {
  // Selectors
  private readonly selectors = {
    // Page elements
    pageTitle: 'h1:has-text("User Management")',
    createButton: 'button:has-text("Create User")',
    
    // Filters
    searchInput: 'input[placeholder*="Username"]',
    statusFilter: 'div.grid select:near(label:has-text("Status"))',
    roleFilter: 'select:near(label:has-text("Role"))',
    itemsPerPageFilter: 'select:near(label:has-text("Items per page"))',
    
    // Table
    table: 'table',
    tableRows: 'tbody tr',
    tableHeaders: 'thead th',
    
    // Loading
    loadingSpinner: 'app-loading-spinner',
    
    // Pagination
    previousButton: 'button:has-text("Previous")',
    nextButton: 'button:has-text("Next")',
    pageInfo: 'text=/Showing \\d+ to \\d+ of \\d+/',
    
    // User row actions
    viewButton: (username: string) => `tr:has-text("${username}") button[title="View"]`,
    editButton: (username: string) => `tr:has-text("${username}") button[title="Edit"]`,
    manageRolesButton: (username: string) => `tr:has-text("${username}") button[title="Manage Roles"]`,
    deleteButton: (username: string) => `tr:has-text("${username}") button[title="Delete"]`,
    
    // Status badge
    activeBadge: 'text=Active',
    inactiveBadge: 'text=Inactive',
  };

  // Expected URLs
  private readonly urls = {
    userList: '/admin/users',
    userCreate: '/admin/users/create',
   userEdit: (id: number) => `/admin/users/edit/${id}`,
    userView: (id: number) => `/admin/users/view/${id}`,
  };

  constructor(page: Page) {
    super(page);
  }

  /**
   * Get underlying Playwright page object for advanced operations
   */
  get pageObject(): Page {
    return this.page;
  }

  /**
   * Navigate to user list page
   */
  async goto(): Promise<void> {
    await super.goto(this.urls.userList);
    await this.waitForPageLoad();
  }

  /**
   * Wait for user list page to fully load
   */
  async waitForPageLoad(): Promise<void> {
    await this.page.locator(this.selectors.pageTitle).waitFor({ 
      state: 'visible', 
      timeout: TIMEOUTS.ELEMENT_VISIBLE 
    });
    await this.waitForNetworkIdle();
  }

  /**
   * Click Create User button
   */
  async clickCreateUser(): Promise<void> {
    await this.click(this.selectors.createButton);
    await this.waitForNetworkIdle();
  }

  /**
   * Search for users
   * @param searchTerm - Search term to filter users
   */
  async search(searchTerm: string): Promise<void> {
    await this.fill(this.selectors.searchInput, searchTerm);
    await this.wait(TIMEOUTS.CHANGE_DETECTION);
    await this.waitForNetworkIdle();
  }

  /**
   * Filter by status
   * @param status - 'active', 'inactive', or 'all'
   */
  async filterByStatus(status: 'active' | 'inactive' | 'all'): Promise<void> {
    // Use nth(0) to select the first Status filter (avoids matching multiple selects)
    const statusFilter = this.page.locator(this.selectors.statusFilter).nth(0);
    
    if (status === 'active') {
      await statusFilter.selectOption({ label: 'Active' });
    } else if (status === 'inactive') {
      await statusFilter.selectOption({ label: 'Inactive' });
    } else {
      await statusFilter.selectOption({ label: 'All Users' });
    }
    
    await this.waitForNetworkIdle();
  }

  /**
   * Filter by role
   * @param roleName - Role name to filter by
   */
  async filterByRole(roleName: string): Promise<void> {
    const roleFilter = this.page.locator(this.selectors.roleFilter);
    await roleFilter.selectOption({ label: roleName });
    await this.waitForNetworkIdle();
  }

  /**
   * Set items per page
   * @param count - Number of items per page (10, 25, 50, 100)
   */
  async setItemsPerPage(count: 10 | 25 | 50 | 100): Promise<void> {
    const itemsPerPageFilter = this.page.locator(this.selectors.itemsPerPageFilter);
    await itemsPerPageFilter.selectOption({ value: count.toString() });
    await this.waitForNetworkIdle();
  }

  /**
   * Get number of users displayed in table
   */
  async getUserCount(): Promise<number> {
    return await this.count(this.selectors.tableRows);
  }

  /**
   * Check if user exists in table
   * @param username - Username to check
   */
  async isUserVisible(username: string): Promise<boolean> {
    const count = await this.page.locator(`tr:has-text("${username}")`).count();
    return count > 0;
  }

  /**
   * Get user row by username
   * @param username - Username to find
   */
  private getUserRow(username: string): Locator {
    return this.page.locator(`tr:has-text("@${username}")`);
  }

  /**
   * Click View button for specific user
   * @param username - Username to view
   */
  async viewUser(username: string): Promise<void> {
    await this.click(this.selectors.viewButton(username));
    await this.waitForNetworkIdle();
  }

  /**
   * Click Edit button for specific user
   * @param username - Username to edit
   */
  async editUser(username: string): Promise<void> {
    // Wait for the row to be visible first
    await this.page.locator(`tr:has-text("${username}")`).waitFor({ state: 'visible', timeout: 5000 });
    
    // Then click the edit button
    const editButton = this.page.locator(this.selectors.editButton(username));
    await editButton.waitFor({ state: 'visible', timeout: 5000 });
    await editButton.click();
    await this.waitForNetworkIdle();
  }

  /**
   * Click Manage Roles button for specific user
   * @param username - Username to manage roles for
   */
  async manageUserRoles(username: string): Promise<void> {
    await this.click(this.selectors.manageRolesButton(username));
    await this.waitForNetworkIdle();
  }

  /**
   * Click Delete button for specific user
   * @param username - Username to delete
   */
  async deleteUser(username: string): Promise<void> {
    await this.click(this.selectors.deleteButton(username));
    await this.wait(TIMEOUTS.MODAL_ANIMATION);
  }

  /**
   * Get user status
   * @param username - Username to check
   */
  async getUserStatus(username: string): Promise<'active' | 'inactive'> {
    const row = this.getUserRow(username);
    const isActive = await row.locator(this.selectors.activeBadge).count() > 0;
    return isActive ? 'active' : 'inactive';
  }

  /**
   * Get user roles
   * @param username - Username to get roles for
   */
  async getUserRoles(username: string): Promise<string[]> {
    const row = this.getUserRow(username);
    const roleBadges = row.locator('span.inline-flex');
    const count = await roleBadges.count();
    
    const roles: string[] = [];
    for (let i = 0; i < count; i++) {
      const roleText = await roleBadges.nth(i).textContent();
      if (roleText) {
        roles.push(roleText.trim());
      }
    }
    
    return roles;
  }

  /**
   * Check if loading spinner is visible
   */
  async isLoading(): Promise<boolean> {
    return await this.isVisible(this.selectors.loadingSpinner);
  }

  /**
   * Wait for table to load
   */
  async waitForTableLoad(): Promise<void> {
    // Wait for spinner to disappear
    await this.page.locator(this.selectors.loadingSpinner).waitFor({ 
      state: 'hidden', 
      timeout: TIMEOUTS.ELEMENT_VISIBLE 
    }).catch(() => {
      // Spinner might not appear for fast loads
    });
    
    // Wait for table to be visible
    await this.page.locator(this.selectors.table).waitFor({ 
      state: 'visible', 
      timeout: TIMEOUTS.ELEMENT_VISIBLE 
    });
  }

  /**
   * Click next page in pagination
   */
  async nextPage(): Promise<void> {
    await this.click(this.selectors.nextButton);
    await this.waitForTableLoad();
  }

  /**
   * Click previous page in pagination
   */
  async previousPage(): Promise<void> {
    await this.click(this.selectors.previousButton);
    await this.waitForTableLoad();
  }

  /**
   * Expect to be on user list page
   */
  async expectOnUserListPage(): Promise<void> {
    await expect(this.page).toHaveURL(new RegExp(this.urls.userList));
    await expect(this.page.locator(this.selectors.pageTitle)).toBeVisible();
  }

  /**
   * Expect user to be in table
   * @param username - Username to check
   */
  async expectUserVisible(username: string): Promise<void> {
    await expect(this.getUserRow(username)).toBeVisible({ timeout: TIMEOUTS.ELEMENT_VISIBLE });
  }

  /**
   * Expect user not to be in table
   * @param username - Username to check
   */
  async expectUserNotVisible(username: string): Promise<void> {
    await expect(this.getUserRow(username)).not.toBeVisible();
  }

  /**
   * Expect specific number of users in table
   * @param count - Expected number of users
   */
  async expectUserCount(count: number): Promise<void> {
    const userCount = await this.getUserCount();
    expect(userCount).toBe(count);
  }

  /**
   * Expect create button to be visible
   */
  async expectCreateButtonVisible(): Promise<void> {
    await expect(this.page.locator(this.selectors.createButton)).toBeVisible();
  }
}
