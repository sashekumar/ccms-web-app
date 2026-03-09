import { Page, expect } from '@playwright/test';
import { BasePage } from './base.page';
import { TIMEOUTS } from '../constants/timeouts';

/**
 * Dashboard Page Object
 * 
 * Represents the main dashboard page after login.
 * 
 * Following coding-standards.md principles:
 * - REUSABILITY: Dashboard methods used across test suites
 * - MODULARIZATION: Encapsulates dashboard page logic
 * - COMMONIZATION: Extends BasePage for common functionality
 */

export class DashboardPage extends BasePage {
  // Selectors - Matching actual Angular application structure
  private readonly selectors = {
    pageTitle: 'h4, h1', // Dashboard shows "Claims Overview" in h4
    sidebar: 'app-sidebar', // Main sidebar component (using only component, not aside to avoid strict mode)
    header: 'app-header', // Top header component (specific to avoid strict mode)
    sidebarToggle: 'button[aria-label="Toggle sidebar"]', // Sidebar toggle button in header
    logoutButton: 'app-header button[title="Logout"]', // Specific logout button in header only
    
    // Navigation menu items (dynamic based on permissions)
    menu: {
      dashboard: 'a[routerLink="/dashboard"], a[href="/dashboard"]',
      users: 'a:has-text("User Management"), a[routerLink*="users"]',
      roles: 'a:has-text("Role Management"), a[routerLink*="roles"]',
      permissions: 'a:has-text("Permission"), a[routerLink*="permissions"]',
      claims: 'a:has-text("Claim"), a[routerLink*="claims"]',
      members: 'a:has-text("Member"), a[routerLink*="members"]',
      reports: 'a:has-text("Report"), a[routerLink*="reports"]',
      profile: 'a:has-text("Profile"), a[routerLink*="profile"]',
      categories: 'a:has-text("Categories"), a[routerLink*="categories"]',
      modules: 'a:has-text("Modules"), a[routerLink*="modules"]',
      actions: 'a:has-text("Actions"), a[routerLink*="actions"]',
      moduleActions: 'a:has-text("Module Actions"), a[routerLink*="module-actions"]',
    },
    
    // Dashboard widgets (stats cards)
    widgets: {
      totalUsers: '[data-testid="widget-total-users"], .bg-white:has-text("Total")',
      activeRoles: '[data-testid="widget-active-roles"]',
      recentActivity: '[data-testid="widget-recent-activity"]',
    },
  };

  // Expected URLs
  private readonly urls = {
    dashboard: '/dashboard',
    login: '/auth/login',
  };

  constructor(page: Page) {
    super(page);
  }

  /**
   * Navigate to dashboard page
   */
  async goto(): Promise<void> {
    await super.goto(this.urls.dashboard);
    await this.waitForPageLoad();
  }

  /**
   * Wait for dashboard page to fully load
   * Note: Sidebar has 300ms CSS transition, wait for it to complete
   */
  async waitForPageLoad(): Promise<void> {
    // Wait for elements to be attached to DOM (more reliable than waiting for visible)
    await this.page.locator(this.selectors.sidebar).waitFor({ state: 'attached', timeout: TIMEOUTS.ELEMENT_ATTACHED });
    await this.page.locator(this.selectors.header).waitFor({ state: 'attached', timeout: TIMEOUTS.ELEMENT_ATTACHED });
    await this.waitForNetworkIdle();
    // Wait for CSS transitions and Angular initialization to complete
    await this.wait(TIMEOUTS.PAGE_LOAD_DELAY);
  }

  /**
   * Get page title text
   */
  async getPageTitle(): Promise<string | null> {
    return await this.getText(this.selectors.pageTitle);
  }

  /**
   * Check if user is on dashboard
   */
  async isOnDashboard(): Promise<boolean> {
    return this.getCurrentUrl().includes(this.urls.dashboard);
  }

  /**
   * Expect to be on dashboard (assertion)
   */
  async expectOnDashboard(): Promise<void> {
    await expect(this.page).toHaveURL(new RegExp(this.urls.dashboard));
  }

  /**
   * Navigate to Users page
   */
  async navigateToUsers(): Promise<void> {
    const isMobile = await this.page.evaluate(() => window.innerWidth < 768);
    if (isMobile) {
      await this.openSidebar();
      await this.wait(TIMEOUTS.SIDEBAR_TRANSITION);
      await this.expandCategory('System Administration');
      await this.wait(TIMEOUTS.ANGULAR_RENDER_DELAY);
    }
    await this.click(this.selectors.menu.users);
    await this.waitForNetworkIdle();
  }

  /**
   * Navigate to Roles page
   */
  async navigateToRoles(): Promise<void> {
    const isMobile = await this.page.evaluate(() => window.innerWidth < 768);
    if (isMobile) {
      await this.openSidebar();
      await this.wait(TIMEOUTS.SIDEBAR_TRANSITION);
      await this.expandCategory('System Administration');
      await this.wait(TIMEOUTS.ANGULAR_RENDER_DELAY);
    }
    await this.click(this.selectors.menu.roles);
    await this.waitForNetworkIdle();
  }

  /**
   * Navigate to Permissions page
   */
  async navigateToPermissions(): Promise<void> {
    await this.click(this.selectors.menu.permissions);
    await this.waitForNetworkIdle();
  }

  /**
   * Navigate to Claims page
   */
  async navigateToClaims(): Promise<void> {
    await this.click(this.selectors.menu.claims);
    await this.waitForNetworkIdle();
  }

  /**
   * Navigate to Members page
   */
  async navigateToMembers(): Promise<void> {
    await this.click(this.selectors.menu.members);
    await this.waitForNetworkIdle();
  }

  /**
   * Navigate to Reports page
   */
  async navigateToReports(): Promise<void> {
    await this.click(this.selectors.menu.reports);
    await this.waitForNetworkIdle();
  }

  /**
   * Navigate to Profile page
   */
  async navigateToProfile(): Promise<void> {
    await this.click(this.selectors.menu.profile);
    await this.waitForNetworkIdle();
  }

  /**
   * Navigate to Categories page (ACL)
   */
  async navigateToCategories(): Promise<void> {
    await this.click(this.selectors.menu.categories);
    await this.waitForNetworkIdle();
  }

  /**
   * Navigate to Modules page (ACL)
   */
  async navigateToModules(): Promise<void> {
    await this.click(this.selectors.menu.modules);
    await this.waitForNetworkIdle();
  }

  /**
   * Navigate to Actions page (ACL)
   */
  async navigateToActions(): Promise<void> {
    await this.click(this.selectors.menu.actions);
    await this.waitForNetworkIdle();
  }

  /**
   * Navigate to Module Actions page (ACL)
   */
  async navigateToModuleActions(): Promise<void> {
    await this.click(this.selectors.menu.moduleActions);
    await this.waitForNetworkIdle();
  }

  /**
   * Logout from application
   */
  async logout(): Promise<void> {
    // Set up dialog handler before any click action
    this.page.once('dialog', async dialog => {
      await dialog.accept();
    });
    
    // Check if mobile viewport
    const isMobile = await this.page.evaluate(() => window.innerWidth < 768);
    
    if (isMobile) {
      // On mobile, use JavaScript to directly trigger click to bypass overlay issues
      await this.page.evaluate(() => {
        const button = document.querySelector('app-header button[title="Logout"]') as HTMLButtonElement;
        if (button) {
          button.click();
        }
      });
      await this.wait(TIMEOUTS.MODAL_ANIMATION);
    } else {
      // Desktop: normal click
      const button = this.page.locator(this.selectors.logoutButton).first();
      await button.waitFor({ state: 'visible', timeout: TIMEOUTS.BUTTON_VISIBLE });
      await this.wait(TIMEOUTS.MODAL_ANIMATION);
      await button.click({ timeout: TIMEOUTS.ELEMENT_VISIBLE });
    }
    
    // Wait for navigation to login page
    await this.page.waitForURL(new RegExp(this.urls.login), { timeout: TIMEOUTS.PAGE_LOAD });
  }

  /**
   * Check if menu item is visible
   * @param menuItem - Menu item name (users, roles, permissions, etc.)
   */
  async isMenuItemVisible(menuItem: keyof typeof this.selectors.menu): Promise<boolean> {
    return await this.isVisible(this.selectors.menu[menuItem]);
  }

  /**
   * Get widget value
   * @param widget - Widget name (totalUsers, activeRoles, recentActivity)
   */
  async getWidgetValue(widget: keyof typeof this.selectors.widgets): Promise<string | null> {
    return await this.getText(this.selectors.widgets[widget]);
  }

  /**
   * Check if sidebar is visible
   * Note: Sidebar may have CSS transitions, so we check if element exists in DOM
   */
  async isSidebarVisible(): Promise<boolean> {
    const sidebar = this.page.locator(this.selectors.sidebar);
    const count = await sidebar.count();
    return count > 0;
  }

  /**
   * Open sidebar (useful for mobile where sidebar auto-closes)
   */
  async openSidebar(): Promise<void> {
    // Check if mobile viewport
    const isMobile = await this.page.evaluate(() => window.innerWidth < 768);
    
    if (isMobile) {
      // On mobile, sidebar might be completely hidden - look for toggle button and click
      const toggleButton = this.page.locator(this.selectors.sidebarToggle);
      const toggleCount = await toggleButton.count();
      
      if (toggleCount > 0) {
        await toggleButton.click();
        await this.wait(TIMEOUTS.SIDEBAR_TRANSITION);
        
        // Wait for sidebar to be visible
        const sidebar = this.page.locator(this.selectors.sidebar);
        await sidebar.waitFor({ state: 'visible', timeout: TIMEOUTS.ELEMENT_VISIBLE });
        return;
      }
    }
    
    // Desktop: On mobile, use multiple clicks with verification to ensure sidebar opens
    for (let attempt = 0; attempt < 3; attempt++) {
      const sidebar = this.page.locator(this.selectors.sidebar);
      const sidebarClass = await sidebar.getAttribute('class');
      
      // Check if sidebar is collapsed (w-[70px] class indicates collapsed state)
      if (sidebarClass && sidebarClass.includes('w-[70px]')) {
        const toggleButton = this.page.locator(this.selectors.sidebarToggle);
        await toggleButton.click();
        
        // Wait for sidebar transition + Angular re-render
        await this.wait(TIMEOUTS.SIDEBAR_TRANSITION);
        
        // Verify sidebar is expanded by checking for category buttons WITH text labels
        // Category buttons in expanded mode should have visible text
        const categoryWithLabel = this.page.locator('app-sidebar button span.link-text');
        const hasVisibleLabels = await categoryWithLabel.count() > 0;
        
        if (hasVisibleLabels) {
          return; // Successfully opened
        }
      } else {
        // Sidebar is already expanded
        return;
      }
    }
  }

  /**
   * Expand a category in the sidebar (e.g., "System Administration")
   * @param categoryText - Text of the category to expand (case-insensitive partial match)
   */
  async expandCategory(categoryText: string): Promise<void> {
    // Find category button with the text (works for both expanded and collapsed sidebar)
    const categoryButton = this.page.locator(`button:has-text("${categoryText}")`).first();
    const buttonCount = await categoryButton.count();
    
    if (buttonCount > 0) {
      // Check if already expanded by looking for the down arrow SVG rotation
      const svg = categoryButton.locator('svg').first();
      const svgClass = await svg.getAttribute('class');
      
      // If not expanded (no rotate-180 class), click to expand
      if (svgClass && !svgClass.includes('rotate-180')) {
        await categoryButton.click();
        // Wait for Angular to render the children
        await this.wait(TIMEOUTS.ANGULAR_RENDER_DELAY);
      }
    }
  }

  /**
   * Expect specific menu items to be visible (permission check)
   * @param menuItems - Array of menu item names that should be visible
   */
  async expectMenuItemsVisible(menuItems: Array<keyof typeof this.selectors.menu>): Promise<void> {
    // Check if mobile viewport
    const isMobile = await this.page.evaluate(() => window.innerWidth < 768);
    
    // On mobile, open sidebar first to make menu items visible
    if (isMobile) {
      await this.openSidebar();
      
      // Wait for System Administration category button to be rendered with text label
      // This indicates Angular has re-rendered templates with isOpen=true
      const categoryWithLabel = this.page.locator('button:has-text("System Administration"), button span.link-text:has-text("System")');
      await categoryWithLabel.waitFor({ state: 'attached', timeout: TIMEOUTS.ELEMENT_VISIBLE }).catch(() => {
        // Category not found - continue anyway as test will fail with proper error message
      });
    }
    
    // Expand System Administration category (contains User Management, Role Management, etc.)
    await this.expandCategory('System Administration');
    
    // Additional wait for DOM to update
    if (isMobile) {
      await this.wait(TIMEOUTS.ANGULAR_RENDER_DELAY);
    }
    
    // Now check for menu items
    for (const item of menuItems) {
      const locator = this.page.locator(this.selectors.menu[item]);
      
      if (isMobile) {
        await expect(locator).toBeVisible({ timeout: TIMEOUTS.ELEMENT_VISIBLE }); 
      } else {
        await expect(locator).toBeVisible();
      }
    }
  }

  /**
   * Expect specific menu items to be hidden (permission check)
   * @param menuItems - Array of menu item names that should be hidden
   */
  async expectMenuItemsHidden(menuItems: Array<keyof typeof this.selectors.menu>): Promise<void> {
    for (const item of menuItems) {
      const count = await this.count(this.selectors.menu[item]);
      expect(count).toBe(0);
    }
  }
}
