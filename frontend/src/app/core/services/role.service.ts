import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map } from 'rxjs';
import rolesConfig from '../../../assets/config/roles-menu.json';

export interface MenuItem {
  id: string;
  label: string;
  icon: string;
  route?: string;
  children?: MenuItem[];
  expanded?: boolean;
}

export interface RoleConfig {
  roleId: number;
  roleName: string;
  roleDisplayName: string;
  description?: string;
  menuItems: MenuItem[];
}

export interface RoleBasedMenuConfig {
  version: string;
  lastUpdated: string;
  roles: RoleConfig[];
}

/**
 * Service to manage roles and role-based menu items
 */
@Injectable({
  providedIn: 'root'
})
export class RoleService {
  private rolesConfigSubject = new BehaviorSubject<RoleConfig[]>([]);
  public rolesConfig$ = this.rolesConfigSubject.asObservable();

  private selectedRoleSubject = new BehaviorSubject<RoleConfig | null>(null);
  public selectedRole$ = this.selectedRoleSubject.asObservable();

  constructor() {
    this.loadRolesConfig();
  }

  /**
   * Initialize roles based on user's roleId
   * If roleId is 0, user is admin and can see all roles
   * Otherwise, filter to user's specific role
   */
  initializeRoles(userRoleId: number): void {
    const allRoles = this.rolesConfigSubject.value;
    
    if (userRoleId === 0) {
      // Admin user - no filtering, show all roles
      // Default to first role if none selected
      if (!this.selectedRoleSubject.value && allRoles.length > 0) {
        this.selectedRoleSubject.next(allRoles[0]);
        sessionStorage.setItem('selectedRole', allRoles[0].roleId.toString());
      }
    } else {
      // Regular user - find and set their specific role
      const userRole = allRoles.find(r => r.roleId === userRoleId);
      if (userRole) {
        this.selectedRoleSubject.next(userRole);
        sessionStorage.setItem('selectedRole', userRole.roleId.toString());
      }
    }
  }

  /**
   * Check if user is admin (roleId === 0)
   */
  isAdmin(userRoleId: number): boolean {
    return userRoleId === 0;
  }

  private loadRolesConfig(): void {
    try {
      const config = rolesConfig as RoleBasedMenuConfig;
      console.log('Roles config loaded:', config);
      
      this.rolesConfigSubject.next(config.roles);
      
      // Load selected role from storage
      const storedRoleId = sessionStorage.getItem('selectedRole');
      if (storedRoleId) {
        const roleId = parseInt(storedRoleId, 10);
        const role = config.roles.find(r => r.roleId === roleId);
        if (role) {
          this.selectedRoleSubject.next(role);
        } else {
          // Default to first role if stored role not found
          this.selectedRoleSubject.next(config.roles[0]);
        }
      } else {
        // Default to first role
        this.selectedRoleSubject.next(config.roles[0]);
      }
    } catch (error) {
      console.error('Error loading roles config:', error);
      // Set empty roles - app will work without role-based menus
      this.rolesConfigSubject.next([]);
      this.selectedRoleSubject.next(null);
    }
  }

  getAllRoles(): Observable<RoleConfig[]> {
    return this.rolesConfig$;
  }

  getSelectedRole(): Observable<RoleConfig | null> {
    return this.selectedRole$;
  }

  setSelectedRole(roleId: number): void {
    const role = this.rolesConfigSubject.value.find(r => r.roleId === roleId);
    if (role) {
      this.selectedRoleSubject.next(role);
      sessionStorage.setItem('selectedRole', roleId.toString());
      console.log('Role changed to:', role.roleName);
    }
  }

  getMenuItemsForRole(roleId: number): Observable<MenuItem[]> {
    return this.rolesConfig$.pipe(
      map(roles => {
        const role = roles.find(r => r.roleId === roleId);
        return role ? role.menuItems : [];
      })
    );
  }

  getCurrentMenuItems(): Observable<MenuItem[]> {
    return this.selectedRole$.pipe(
      map(role => role ? role.menuItems : [])
    );
  }
}
