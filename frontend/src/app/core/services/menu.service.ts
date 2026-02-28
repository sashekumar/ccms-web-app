import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { PermissionService } from './permission.service';
import { UserPermissionsResponse, CategoryPermissions, ModulePermissions } from '../../shared/models/permission.model';

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
    // Subscribe to permission changes and rebuild menu
    this.permissionService.userPermissions$.subscribe({
      next: (permissions) => {
        if (permissions) {
          const menuItems = this.buildMenuFromPermissions(permissions);
          this.menuItemsSubject.next(menuItems);
        } else {
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
  private buildMenuFromPermissions(permissions: UserPermissionsResponse): MenuItem[] {
    const menuItems: MenuItem[] = [];
    const categoryItems: MenuItem[] = [];

    // Handle new category-based structure
    if (permissions && permissions.categories) {
      // Process each category
      permissions.categories.forEach((category: CategoryPermissions) => {
        const categoryChildren: MenuItem[] = [];

        // Process modules in this category
        category.modules.forEach((module: ModulePermissions) => {
          // Skip detail-view-only modules
          if (DETAIL_VIEW_MODULES.includes(module.module_code)) {
            return;
          }

          // Only include modules with VIEW permission
          const hasViewPermission = module.actions.some(
            (action: { action_code: string }) => action.action_code === 'VIEW'
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
          categoryItems.push({
            id: (category.category_code || 'uncategorized').toLowerCase(),
            label: category.category_name || 'Uncategorized',
            icon: category.category_icon || 'folder',
            children: categoryChildren,
            expanded: true  // Auto-expand categories
          });
        }
      });

      // Process uncategorized modules (add them as top-level items FIRST)
      if (permissions.uncategorized_modules && permissions.uncategorized_modules.length > 0) {
        permissions.uncategorized_modules.forEach((module: ModulePermissions) => {
          // Skip detail-view-only modules
          if (DETAIL_VIEW_MODULES.includes(module.module_code)) {
            return;
          }

          const hasViewPermission = module.actions.some(
            (action: { action_code: string }) => action.action_code === 'VIEW'
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
      }

      // Add categories after uncategorized modules
      menuItems.push(...categoryItems);
    } 
    // Fallback to old flat structure for backward compatibility
    else if (permissions && permissions.modules) {
      const moduleMap = new Map<string, ModulePermissions>();
      
      // Group permissions by module with VIEW access
      permissions.modules.forEach((module: ModulePermissions) => {
        // Skip detail-view-only modules
        if (DETAIL_VIEW_MODULES.includes(module.module_code)) {
          return;
        }

        const hasViewPermission = module.actions.some(
          (action: { action_code: string }) => action.action_code === 'VIEW'
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
    }
    else {
      console.warn('⚠️ No permissions data available for menu building');
    }

    // If no menu items, provide default dashboard
    if (menuItems.length === 0) {
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
