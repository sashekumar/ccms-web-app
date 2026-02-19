import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil, forkJoin } from 'rxjs';
import { PermissionService } from '../../../core/services/permission.service';
import { Role, Module, Action, RolePermissionSummary } from '../../../shared/models/permission.model';

interface PermissionMatrixRow {
  module: Module;
  actions: {
    action: Action;
    isGranted: boolean;
    module_action_id?: number;
  }[];
}

@Component({
  selector: 'app-role-permissions',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-gray-50 p-6">
      <!-- Header -->
      <div class="mb-6">
        <button
          (click)="goBack()"
          class="mb-4 flex items-center text-sm text-gray-600 hover:text-gray-900"
        >
          <svg class="mr-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
          Back to Roles
        </button>
        <div *ngIf="role">
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-3xl font-bold text-gray-900">Role Permissions</h1>
              <p class="mt-1 text-sm text-gray-600">
                Manage permissions for role: <span class="font-medium">{{ role.role_name }}</span>
              </p>
            </div>
            <button
              (click)="saveChanges()"
              [disabled]="!hasChanges || saving"
              class="rounded-lg bg-gradient-to-r from-[#1e3c72] to-[#2a5298] px-6 py-2 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span *ngIf="saving" class="flex items-center">
                <svg class="mr-2 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </span>
              <span *ngIf="!saving">Save Changes</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading" class="flex items-center justify-center py-12">
        <div class="h-12 w-12 animate-spin rounded-full border-4 border-[#1e3c72] border-t-transparent"></div>
      </div>

      <!-- Success Message -->
      <div *ngIf="successMessage" class="mb-6 rounded-lg bg-green-50 p-4">
        <div class="flex">
          <svg class="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
          </svg>
          <div class="ml-3">
            <p class="text-sm text-green-800">{{ successMessage }}</p>
          </div>
        </div>
      </div>

      <!-- Error Message -->
      <div *ngIf="errorMessage" class="mb-6 rounded-lg bg-red-50 p-4">
        <div class="flex">
          <svg class="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
          </svg>
          <div class="ml-3">
            <p class="text-sm text-red-800">{{ errorMessage }}</p>
          </div>
        </div>
      </div>

      <!-- Permissions Matrix -->
      <div *ngIf="!loading && permissionMatrix.length > 0" class="overflow-hidden rounded-lg bg-white shadow">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="sticky left-0 z-10 bg-gray-50 px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Module
                </th>
                <th
                  *ngFor="let action of actions"
                  class="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  {{ action.action_name }}
                </th>
                <th class="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                  All
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 bg-white">
              <tr *ngFor="let row of permissionMatrix" class="hover:bg-gray-50">
                <!-- Module Name -->
                <td class="sticky left-0 z-10 bg-white whitespace-nowrap px-6 py-4">
                  <div class="text-sm font-medium text-gray-900">{{ row.module.module_name }}</div>
                  <div class="text-xs text-gray-500">{{ row.module.module_code }}</div>
                </td>

                <!-- Action Checkboxes -->
                <td *ngFor="let actionCell of row.actions" class="px-4 py-4 text-center">
                  <input
                    *ngIf="actionCell.module_action_id"
                    type="checkbox"
                    [checked]="actionCell.isGranted"
                    (change)="togglePermission(row.module.module_id, actionCell.action.action_id, $event)"
                    class="h-4 w-4 rounded border-gray-300 text-[#1e3c72] focus:ring-[#1e3c72]"
                  />
                  <span *ngIf="!actionCell.module_action_id" class="text-gray-300">-</span>
                </td>

                <!-- Select All for Module -->
                <td class="px-6 py-4 text-center">
                  <button
                    (click)="toggleModule(row.module.module_id)"
                    class="text-sm text-[#1e3c72] hover:text-[#2a5298]"
                  >
                    {{ areAllActionsGranted(row) ? 'Clear' : 'Select' }} All
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Summary -->
        <div class="border-t border-gray-200 bg-gray-50 px-6 py-4">
          <div class="flex items-center justify-between">
            <div class="text-sm text-gray-600">
              <span class="font-medium">{{ getGrantedCount() }}</span> of 
              <span class="font-medium">{{ getTotalCount() }}</span> permissions granted
            </div>
            <div class="flex gap-2">
              <button
                (click)="selectAll()"
                class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Select All
              </button>
              <button
                (click)="clearAll()"
                class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div *ngIf="!loading && permissionMatrix.length === 0" class="rounded-lg bg-white p-12 text-center shadow">
        <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
        </svg>
        <h3 class="mt-2 text-sm font-medium text-gray-900">No permissions available</h3>
        <p class="mt-1 text-sm text-gray-500">There are no modules or actions defined in the system.</p>
      </div>
    </div>
  `
})
export class RolePermissionsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  role: Role | null = null;
  modules: Module[] = [];
  actions: Action[] = [];
  rolePermissions: RolePermissionSummary[] = [];
  permissionMatrix: PermissionMatrixRow[] = [];
  
  loading = false;
  saving = false;
  hasChanges = false;
  
  successMessage = '';
  errorMessage = '';
  
  roleId?: number;
  
  private originalState: Map<string, boolean> = new Map();

  constructor(
    private permissionService: PermissionService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.params
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        if (params['id']) {
          this.roleId = parseInt(params['id']);
          this.loadData();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadData(): void {
    if (!this.roleId) return;

    this.loading = true;
    forkJoin({
      role: this.permissionService.getRoleById(this.roleId),
      permissionsMatrix: this.permissionService.getRolePermissionsMatrix(this.roleId)
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ role, permissionsMatrix }) => {
          this.role = role;
          this.buildMatrixFromData(permissionsMatrix);
          this.saveOriginalState();
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading data:', error);
          this.errorMessage = 'Failed to load role permissions';
          this.loading = false;
        }
      });
  }

  private buildMatrixFromData(data: any[]): void {
    // First, extract all unique actions and modules
    const actionMap = new Map<number, Action>();
    const moduleDataMap = new Map<number, any>();
    const moduleActionMap = new Map<string, any>();
    
    data.forEach((item: any) => {
      // Collect unique actions
      if (!actionMap.has(item.action_id)) {
        actionMap.set(item.action_id, {
          action_id: item.action_id,
          action_name: item.action_name,
          action_code: item.action_code,
          description: item.action_label,
          is_active: true
        });
      }
      
      // Collect unique modules
      if (!moduleDataMap.has(item.module_id)) {
        moduleDataMap.set(item.module_id, {
          module_id: item.module_id,
          module_name: item.module_name,
          module_code: item.module_code,
          description: null,
          category_id: null,
          icon: null,
          route: null,
          display_order: 0,
          is_active: true,
          created_at: new Date(),
          updated_at: null
        });
      }
      
      // Store module-action combinations
      const key = `${item.module_id}-${item.action_id}`;
      moduleActionMap.set(key, item);
    });
    
    // Set actions list
    this.actions = Array.from(actionMap.values());
    
    // Build matrix with consistent columns for all rows
    this.permissionMatrix = Array.from(moduleDataMap.values()).map(module => {
      const row: PermissionMatrixRow = {
        module: module,
        actions: this.actions.map(action => {
          const key = `${module.module_id}-${action.action_id}`;
          const item = moduleActionMap.get(key);
          
          return {
            action: action,
            isGranted: item ? (item.granted === 1) : false,
            module_action_id: item ? item.module_action_id : undefined
          };
        })
      };
      return row;
    });
  }

  private saveOriginalState(): void {
    this.originalState.clear();
    this.permissionMatrix.forEach(row => {
      row.actions.forEach(actionCell => {
        // Only save state for valid actions
        if (actionCell.module_action_id) {
          const key = `${row.module.module_id}-${actionCell.action.action_id}`;
          this.originalState.set(key, actionCell.isGranted);
        }
      });
    });
  }

  private checkForChanges(): void {
    let changed = false;
    
    for (const row of this.permissionMatrix) {
      for (const actionCell of row.actions) {
        // Only check actions that have a valid module_action_id
        if (!actionCell.module_action_id) continue;
        
        const key = `${row.module.module_id}-${actionCell.action.action_id}`;
        const originalValue = this.originalState.get(key) || false;
        if (originalValue !== actionCell.isGranted) {
          changed = true;
          break;
        }
      }
      if (changed) break;
    }
    
    this.hasChanges = changed;
  }

  togglePermission(moduleId: number, actionId: number, event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    const isChecked = checkbox.checked;
    
    const row = this.permissionMatrix.find(r => r.module.module_id === moduleId);
    if (row) {
      const actionCell = row.actions.find(a => a.action.action_id === actionId);
      if (actionCell) {
        actionCell.isGranted = isChecked;
        this.checkForChanges();
      }
    }
  }

  toggleModule(moduleId: number): void {
    const row = this.permissionMatrix.find(r => r.module.module_id === moduleId);
    if (!row) return;
    
    const allGranted = this.areAllActionsGranted(row);
    row.actions.forEach(actionCell => {
      // Only toggle actions that have a valid module_action_id
      if (actionCell.module_action_id) {
        actionCell.isGranted = !allGranted;
      }
    });
    
    this.checkForChanges();
  }

  areAllActionsGranted(row: PermissionMatrixRow): boolean {
    // Only check actions that have a valid module_action_id
    const validActions = row.actions.filter(a => a.module_action_id);
    if (validActions.length === 0) return false;
    return validActions.every(a => a.isGranted);
  }

  selectAll(): void {
    this.permissionMatrix.forEach(row => {
      row.actions.forEach(actionCell => {
        // Only toggle actions that have a valid module_action_id
        if (actionCell.module_action_id) {
          actionCell.isGranted = true;
        }
      });
    });
    this.checkForChanges();
  }

  clearAll(): void {
    this.permissionMatrix.forEach(row => {
      row.actions.forEach(actionCell => {
        // Only toggle actions that have a valid module_action_id
        if (actionCell.module_action_id) {
          actionCell.isGranted = false;
        }
      });
    });
    this.checkForChanges();
  }

  getGrantedCount(): number {
    let count = 0;
    this.permissionMatrix.forEach(row => {
      row.actions.forEach(actionCell => {
        // Only count valid actions
        if (actionCell.module_action_id && actionCell.isGranted) count++;
      });
    });
    return count;
  }

  getTotalCount(): number {
    let count = 0;
    this.permissionMatrix.forEach(row => {
      row.actions.forEach(actionCell => {
        // Only count valid actions
        if (actionCell.module_action_id) count++;
      });
    });
    return count;
  }

  saveChanges(): void {
    if (!this.roleId || !this.hasChanges) return;

    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';

    // Collect permissions to grant and revoke
    const toGrant: { module_action_id: number }[] = [];
    const toRevoke: { module_action_id: number }[] = [];

    this.permissionMatrix.forEach(row => {
      row.actions.forEach(actionCell => {
        const key = `${row.module.module_id}-${actionCell.action.action_id}`;
        const originalValue = this.originalState.get(key) || false;
        
        if (actionCell.isGranted && !originalValue && actionCell.module_action_id) {
          // Need to grant this permission
          toGrant.push({
            module_action_id: actionCell.module_action_id
          });
        } else if (!actionCell.isGranted && originalValue && actionCell.module_action_id) {
          // Need to revoke this permission
          toRevoke.push({
            module_action_id: actionCell.module_action_id
          });
        }
      });
    });

    // Execute grants and revokes
    const operations = [
      ...toGrant.map(dto => 
        this.permissionService.grantPermission({ role_id: this.roleId!, ...dto })
      ),
      ...toRevoke.map(dto => 
        this.permissionService.revokePermission({ role_id: this.roleId!, ...dto })
      )
    ];

    if (operations.length === 0) {
      this.saving = false;
      this.successMessage = 'No changes to save';
      return;
    }

    forkJoin(operations)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.successMessage = 'Permissions updated successfully';
          this.saving = false;
          this.hasChanges = false;
          
          // Reload data to get updated state
          this.loadData();
          
          // Clear success message after 3 seconds
          setTimeout(() => {
            this.successMessage = '';
          }, 3000);
        },
        error: (error) => {
          console.error('Error saving permissions:', error);
          this.errorMessage = error.error?.message || 'Failed to save permissions';
          this.saving = false;
        }
      });
  }

  goBack(): void {
    if (this.hasChanges) {
      const confirmed = confirm('You have unsaved changes. Are you sure you want to leave?');
      if (!confirmed) return;
    }
    this.router.navigate(['/admin/roles']);
  }
}
