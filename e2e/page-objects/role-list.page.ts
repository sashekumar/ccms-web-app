import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';
import { TIMEOUTS } from '../constants/timeouts';

/**
 * Role List Page Object
 * 
 * Represents the role management list page.
 * 
 * Following coding-standards.md principles:
 * - REUSABILITY: Role management methods used across test suites
 * - MODULARIZATION: Encapsulates role list page logic
 * - COMMONIZATION: Extends BasePage for common functionality
 */

export class RoleListPage extends BasePage {
  // Selectors
  private readonly selectors = {
    // Page elements
    pageTitle: 'h1:has-text("Role Management")',
    createButton: 'button:has-text("Create Role")',
    
    // Filters
    searchInput: 'input[placeholder*="role name or code"]',
    statusFilter: 'select:near(label:has-text("Status"))',
    
    // Table
    table: 'table',
    tableRows: 'tbody tr',
    
    // Loading
    loadingSpinner: 'app-loading-spinner',
    
    // Role row elements
    roleRow: (roleCode: string) => `tr:has-text("${roleCode}")`,
    viewPermissionsButton: (roleCode: string) => `tr:has-text("${roleCode}") button[title="View Permissions"]`,
    editButton: (roleCode: string) => `tr:has-text("${roleCode}") button[title="Edit"]`,
    deleteButton: (roleCode: string) => `tr:has-text("${roleCode}") button[title="Delete"]`,
    
    // Badges
    activeBadge: 'text=Active',
    inactiveBadge: 'text=Inactive',
    systemBadge: 'text=System',
    customBadge: 'text=Custom',
  };

  // Expected URLs
  private readonly urls = {
    roleList: '/roles',
    roleCreate: '/roles/create',
    roleEdit: (id: number) => `/roles/edit/${id}`,
    rolePermissions: (id: number) => `/roles/${id}/permissions`,
  };

  constructor(page: Page) {
    super(page);
  }

  /**
   * Navigate to role list page
   */
  async goto(): Promise<void> {
    await super.goto(this.urls.roleList);
    await this.waitForPageLoad();
  }

  /**
   * Wait for role list page to fully load
   */
  async waitForPageLoad(): Promise<void> {
    await this.page.locator(this.selectors.pageTitle).waitFor({ 
      state: 'visible', 
      timeout: TIMEOUTS.ELEMENT_VISIBLE 
    });
    await this.waitForNetworkIdle();
  }

  /**
   * Click Create Role button
   */
  async clickCreateRole(): Promise<void> {
    await this.click(this.selectors.createButton);
    await this.waitForNetworkIdle();
  }

  /**
   * Search for roles
   * @param searchTerm - Search term to filter roles
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
    const statusFilter = this.page.locator(this.selectors.statusFilter);
    
    if (status === 'active') {
      await statusFilter.selectOption({ label: 'Active Only' });
    } else if (status === 'inactive') {
      await statusFilter.selectOption({ label: 'Inactive Only' });
    } else {
      await statusFilter.selectOption({ label: 'All Roles' });
    }
    
    await this.waitForNetworkIdle();
  }

  /**
   * Get number of roles displayed in table
   */
  async getRoleCount(): Promise<number> {
    return await this.count(this.selectors.tableRows);
  }

  /**
   * Check if role exists in table
   * @param roleCode - Role code to check
   */
  async isRoleVisible(roleCode: string): Promise<boolean> {
    const count = await this.page.locator(this.selectors.roleRow(roleCode)).count();
    return count > 0;
  }

  /**
   * Get role row by role code
   * @param roleCode - Role code to find
   */
  private getRoleRow(roleCode: string): Locator {
    return this.page.locator(this.selectors.roleRow(roleCode));
  }

  /**
   * Click View Permissions button for specific role
   * @param roleCode - Role code to view permissions for
   */
  async viewPermissions(roleCode: string): Promise<void> {
    await this.click(this.selectors.viewPermissionsButton(roleCode));
    await this.waitForNetworkIdle();
  }

  /**
   * Click Edit button for specific role
   * @param roleCode - Role code to edit
   */
  async editRole(roleCode: string): Promise<void> {
    await this.click(this.selectors.editButton(roleCode));
    await this.waitForNetworkIdle();
  }

  /**
   * Click Delete button for specific role
   * @param roleCode - Role code to delete
   */
  async deleteRole(roleCode: string): Promise<void> {
    await this.click(this.selectors.deleteButton(roleCode));
    await this.wait(TIMEOUTS.MODAL_ANIMATION);
  }

  /**
   * Get role status
   * @param roleCode - Role code to check
   */
  async getRoleStatus(roleCode: string): Promise<'active' | 'inactive'> {
    const row = this.getRoleRow(roleCode);
    const isActive = await row.locator(this.selectors.activeBadge).count() > 0;
    return isActive ? 'active' : 'inactive';
  }

  /**
   * Get role type
   * @param roleCode - Role code to check
   */
  async getRoleType(roleCode: string): Promise<'system' | 'custom'> {
    const row = this.getRoleRow(roleCode);
    const isSystem = await row.locator(this.selectors.systemBadge).count() > 0;
    return isSystem ? 'system' : 'custom';
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
   * Expect to be on role list page
   */
  async expectOnRoleListPage(): Promise<void> {
    await expect(this.page).toHaveURL(new RegExp(this.urls.roleList));
    await expect(this.page.locator(this.selectors.pageTitle)).toBeVisible();
  }

  /**
   * Expect role to be in table
   * @param roleCode - Role code to check
   */
  async expectRoleVisible(roleCode: string): Promise<void> {
    await expect(this.getRoleRow(roleCode)).toBeVisible({ timeout: TIMEOUTS.ELEMENT_VISIBLE });
  }

  /**
   * Expect role not to be in table
   * @param roleCode - Role code to check
   */
  async expectRoleNotVisible(roleCode: string): Promise<void> {
    await expect(this.getRoleRow(roleCode)).not.toBeVisible();
  }

  /**
   * Expect specific number of roles in table
   * @param count - Expected number of roles
   */
  async expectRoleCount(count: number): Promise<void> {
    const roleCount = await this.getRoleCount();
    expect(roleCount).toBe(count);
  }

  /**
   * Expect create button to be visible
   */
  async expectCreateButtonVisible(): Promise<void> {
    await expect(this.page.locator(this.selectors.createButton)).toBeVisible();
  }
}
