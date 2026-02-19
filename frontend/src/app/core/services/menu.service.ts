import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { PermissionService } from './permission.service';

export interface MenuItem {
  id: string;
  label: string;
  icon: string;
  route?: string;
  children?: MenuItem[];
  expanded?: boolean;
  moduleCode?: string;
}

/**
 * Modules that should not appear in the menu
 * These are detail views accessed from other pages, not standalone menu items
 */
const DETAIL_VIEW_MODULES = [
  'ROLE_PERMISSION_MANAGEMENT',  // Accessed via /admin/roles/permissions/:id
  'USER_ROLE_ASSIGNMENT'         // Accessed via /admin/users/roles/:id
];

/**
 * MenuService - Builds navigation menu based on user permissions
 */
@Injectable({
  providedIn: 'root'
})
export class MenuService {
  private menuItemsSubject = new BehaviorSubject<MenuItem[]>([]);
  public menuItems$ = this.menuItemsSubject.asObservable();

  constructor(private permissionService: PermissionService) {
    console.log('🔧 MenuService initialized');
    // Subscribe to permission changes and rebuild menu
    this.permissionService.userPermissions$.subscribe({
      next: (permissions) => {
        console.log('📬 MenuService received permissions:', permissions);
        if (permissions) {
          const menuItems = this.buildMenuFromPermissions(permissions);
          console.log(`✅ MenuService built ${menuItems.length} menu items, updating BehaviorSubject`);
          console.log('🔔 Current BehaviorSubject value BEFORE update:', this.menuItemsSubject.value);
          this.menuItemsSubject.next(menuItems);
          console.log('🔔 Current BehaviorSubject value AFTER update:', this.menuItemsSubject.value);
          console.log('🔔 Number of observers:', (this.menuItemsSubject as any).observers?.length || 0);
        } else {
          console.log('⚠️ No permissions received, setting default menu');
          // No permissions loaded yet, show default menu
          this.setDefaultMenuItems();
        }
      },
      error: (err) => {
        console.error('❌ Failed to load menu items:', err);
        this.setDefaultMenuItems();
      }
    });
  }

  /**
   * Load menu items based on user permissions
   */
  loadMenuItems(): void {
    this.permissionService.getUserPermissions().subscribe({
      next: (permissions) => {
        const menuItems = this.buildMenuFromPermissions(permissions);
        this.menuItemsSubject.next(menuItems);
      },
      error: (err) => {
        console.error('Failed to load menu items:', err);
        // Set default menu items on error
        this.setDefaultMenuItems();
      }
    });
  }

  /**
   * Build menu structure from user permissions
   * Uses category-based structure from backend for dynamic menu generation
   */
  private buildMenuFromPermissions(permissions: any): MenuItem[] {
    console.log('🔨 Building menu from permissions:', permissions);
    const menuItems: MenuItem[] = [];
    const categoryItems: MenuItem[] = [];

    // Handle new category-based structure
    if (permissions && permissions.categories) {
      console.log(`📦 Received ${permissions.categories.length} categories from backend`);
      // Process each category
      permissions.categories.forEach((category: any) => {
        const categoryChildren: MenuItem[] = [];

        // Process modules in this category
        category.modules.forEach((module: any) => {
          // Skip detail-view-only modules
          if (DETAIL_VIEW_MODULES.includes(module.module_code)) {
            return;
          }

          // Only include modules with VIEW permission
          const hasViewPermission = module.actions.some(
            (action: any) => action.action_code === 'VIEW'
          );

          if (hasViewPermission) {
            categoryChildren.push({
              id: module.module_code.toLowerCase().replace(/_/g, '-'),
              label: module.module_name,
              icon: module.icon || 'circle',
              route: module.module_route || `/${module.module_code.toLowerCase().replace(/_/g, '-')}`,
              moduleCode: module.module_code
            });
          }
        });

        // Only add category if it has visible modules
        if (categoryChildren.length > 0) {
          console.log(`📁 Adding category: ${category.category_name} with ${categoryChildren.length} modules`);
          categoryItems.push({
            id: category.category_code.toLowerCase(),
            label: category.category_name,
            icon: category.category_icon || 'folder',
            children: categoryChildren,
            expanded: true  // Auto-expand categories
          });
        }
      });

      console.log(`✅ Built ${categoryItems.length} category items`);
      console.log('📋 Category structure:', JSON.stringify(categoryItems, null, 2));

      // Process uncategorized modules (add them as top-level items FIRST)
      if (permissions.uncategorized_modules && permissions.uncategorized_modules.length > 0) {
        console.log(`📂 Processing ${permissions.uncategorized_modules.length} uncategorized modules`);
        permissions.uncategorized_modules.forEach((module: any) => {
          // Skip detail-view-only modules
          if (DETAIL_VIEW_MODULES.includes(module.module_code)) {
            return;
          }

          const hasViewPermission = module.actions.some(
            (action: any) => action.action_code === 'VIEW'
          );

          if (hasViewPermission) {
            menuItems.push({
              id: module.module_code.toLowerCase().replace(/_/g, '-'),
              label: module.module_name,
              icon: module.icon || 'circle',
              route: module.module_route || `/${module.module_code.toLowerCase().replace(/_/g, '-')}`,
              moduleCode: module.module_code
            });
          }
        });
        console.log(`✅ Added ${menuItems.length} uncategorized modules (placed first)`);
      }

      // Add categories after uncategorized modules
      menuItems.push(...categoryItems);
    } 
    // Fallback to old flat structure for backward compatibility
    else if (permissions && permissions.modules) {
      console.log('⚠️ Using fallback flat structure (no categories)');
      console.log(`📦 Received ${permissions.modules.length} modules in flat structure`);
      const moduleMap = new Map<string, any>();
      
      // Group permissions by module with VIEW access
      permissions.modules.forEach((module: any) => {
        // Skip detail-view-only modules
        if (DETAIL_VIEW_MODULES.includes(module.module_code)) {
          return;
        }

        const hasViewPermission = module.actions.some(
          (action: any) => action.action_code === 'VIEW'
        );
        if (hasViewPermission) {
          moduleMap.set(module.module_code, module);
        }
      });

      // Convert to menu items
      moduleMap.forEach((module) => {
        menuItems.push({
          id: module.module_code.toLowerCase().replace(/_/g, '-'),
          label: module.module_name,
          icon: module.icon || 'circle',
          route: module.module_route || `/${module.module_code.toLowerCase().replace(/_/g, '-')}`,
          moduleCode: module.module_code
        });
      });
      console.log(`✅ Built ${menuItems.length} menu items from flat structure`);
    }
    else {
      console.warn('⚠️ No permissions data available for menu building');
    }

    // If no menu items, provide default dashboard
    if (menuItems.length === 0) {
      console.log('📊 No menu items built, adding default dashboard');
      menuItems.push({
        id: 'dashboard',
        label: 'Dashboard',
        icon: 'tachometer-alt',
        route: '/dashboard',
        moduleCode: 'DASHBOARD'
      });
    }

    // Add hardcoded Logout menu item at the end
    menuItems.push({
      id: 'logout',
      label: 'Logout',
      icon: 'sign-out-alt'
      // No route - handled via click event
    });

    console.log(`🎯 Final menu structure: ${menuItems.length} top-level items`);
    return menuItems;
  }

  /**
   * Set default menu items (used on error or when not authenticated)
   */
  private setDefaultMenuItems(): void {
    const defaultItems: MenuItem[] = [
      {
        id: 'dashboard',
        label: 'Dashboard',
        icon: 'tachometer-alt',
        route: '/dashboard'
      },
      {
        id: 'logout',
        label: 'Logout',
        icon: 'sign-out-alt'
        // No route - handled via click event
      }
    ];
    this.menuItemsSubject.next(defaultItems);
  }

  /**
   * Reload menu items (useful after role assignment changes)
   */
  reloadMenu(): void {
    this.loadMenuItems();
  }

  /**
   * Get current menu items
   */
  getCurrentMenuItems(): Observable<MenuItem[]> {
    return this.menuItems$;
  }
}
