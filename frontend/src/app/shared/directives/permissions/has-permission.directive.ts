import { Directive, Input, TemplateRef, ViewContainerRef, OnInit, OnDestroy } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { PermissionService } from '../../../core/services/permission.service';
import { LoggerService } from '../../../core/services/logger.service';

/**
 * Structural directive to show/hide elements based on permissions
 * 
 * Usage:
 * <div *hasPermission="'USER_MANAGEMENT.VIEW'">Content</div>
 * <div *hasPermission="['USER_MANAGEMENT', 'VIEW']">Content</div>
 * <button *hasPermission="'USER_MANAGEMENT.CREATE'">Create User</button>
 */
@Directive({
  selector: '[hasPermission]',
  standalone: true
})
export class HasPermissionDirective implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private hasView = false;

  @Input() set hasPermission(permission: string | [string, string]) {
    this.checkPermission(permission);
  }

  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private permissionService: PermissionService,
    private logger: LoggerService
  ) {}

  ngOnInit(): void {
    // Listen to permission updates
    this.permissionService.userPermissions$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        // Re-check permission when user permissions change
        const permission = this.getCurrentPermission();
        if (permission) {
          this.checkPermission(permission);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private checkPermission(permission: string | [string, string]): void {
    let moduleCode: string;
    let actionCode: string;

    if (typeof permission === 'string') {
      // Format: "MODULE_CODE.ACTION_CODE"
      const parts = permission.split('.');
      if (parts.length !== 2) {
        this.logger.error(`Invalid permission format: ${permission}. Expected "MODULE_CODE.ACTION_CODE"`);
        this.removeView();
        return;
      }
      [moduleCode, actionCode] = parts;
    } else if (Array.isArray(permission) && permission.length === 2) {
      // Format: ["MODULE_CODE", "ACTION_CODE"]
      [moduleCode, actionCode] = permission;
    } else {
      this.logger.error(`Invalid permission format:`, permission);
      this.removeView();
      return;
    }

    this.permissionService.hasPermission(moduleCode, actionCode)
      .pipe(takeUntil(this.destroy$))
      .subscribe(hasPermission => {
        if (hasPermission) {
          this.createView();
        } else {
          this.removeView();
        }
      });
  }

  private createView(): void {
    if (!this.hasView) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
    }
  }

  private removeView(): void {
    if (this.hasView) {
      this.viewContainer.clear();
      this.hasView = false;
    }
  }

  private getCurrentPermission(): string | [string, string] | null {
    // This is a workaround to store the last permission value
    // In a real implementation, you might want to use a different approach
    return null;
  }
}
