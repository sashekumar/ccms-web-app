/**
 * Notifications Log Dashboard Component
 * Displays notification logs with status tracking and filtering
 * Modernized with DataTableComponent
 */

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { NotificationsService } from '../../../core/services/notifications/notifications.service';
import { ToastService } from '../../../core/services/toast.service';
import { LoggerService } from '../../../core/services/logger.service';
import { 
  DataTableComponent,
  DataTableColumn,
  DataTableAction,
  DataTablePagination,
  DataTableFilter,
  DataTableFilterState,
  DataTableRowActionEvent,
  DataTableSort
} from '../../../shared/components/ui/data-table/data-table.component';
import {
  NotificationLogRecord,
  NotificationsStatsResponse
} from '../../../shared/models/notifications/notifications.model';

@Component({
  selector: 'app-notifications-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    DataTableComponent
  ],
  templateUrl: './notifications-dashboard.component.html'
})
export class NotificationsDashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Data
  notifications: NotificationLogRecord[] = [];
  loading = false;

  // Pagination
  pagination: DataTablePagination = {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  };

  // Filters
  filters: DataTableFilter[] = [];
  currentFilters: DataTableFilterState = {
    page: 1,
    limit: 10
  };

  // DataTable Configuration
  columns: DataTableColumn[] = [];
  rowActions: DataTableAction[] = [];

  // Stats
  stats = {
    total: 0,
    today: 0,
    sent: 0,
    failed: 0,
    pending: 0
  };

  // Detail Panel
  selectedNotification: NotificationLogRecord | null = null;
  showDetailPanel = false;

  constructor(
    private notificationsService: NotificationsService,
    private toast: ToastService,
    private logger: LoggerService
  ) {
    this.initializeColumns();
    this.initializeFilters();
    this.initializeRowActions();
  }

  ngOnInit(): void {
    this.loadNotifications();
    this.loadStats();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  private initializeColumns(): void {
    this.columns = [
      {
        key: 'log_id',
        label: 'Log ID',
        type: 'text',
        sortable: true
      },
      {
        key: 'notification_type',
        label: 'Type',
        type: 'badge',
        sortable: true,
        badgeMap: {
          'EMAIL': { label: 'Email', color: 'blue' },
          'SMS': { label: 'SMS', color: 'green' },
          'PUSH': { label: 'Push', color: 'purple' },
          'IN_APP': { label: 'In-App', color: 'indigo' }
        }
      },
      {
        key: 'recipient_target',
        label: 'Recipient',
        type: 'text',
        sortable: false
      },
      {
        key: 'message_content',
        label: 'Message',
        type: 'text',
        sortable: false
      },
      {
        key: 'send_status',
        label: 'Status',
        type: 'badge',
        sortable: true,
        badgeMap: {
          'SENT': { label: 'Sent', color: 'green' },
          'FAILED': { label: 'Failed', color: 'red' },
          'PENDING': { label: 'Pending', color: 'yellow' }
        }
      },
      {
        key: 'sent_at',
        label: 'Sent At',
        type: 'date',
        sortable: true
      },
      {
        key: 'created_by',
        label: 'Created By',
        type: 'text',
        sortable: false
      }
    ];
  }

  private initializeFilters(): void {
    this.filters = [
      {
        key: 'search',
        label: 'Search',
        type: 'search',
        placeholder: 'Search notifications...',
        inputType: 'string'
      },
      {
        key: 'notification_type',
        label: 'Type',
        type: 'select',
        placeholder: 'All Types',
        options: [
          { value: '', label: 'All Types' },
          { value: 'EMAIL', label: 'Email' },
          { value: 'SMS', label: 'SMS' },
          { value: 'PUSH', label: 'Push Notification' },
          { value: 'IN_APP', label: 'In-App Notification' }
        ]
      },
      {
        key: 'send_status',
        label: 'Status',
        type: 'select',
        placeholder: 'All Status',
        options: [
          { value: '', label: 'All Status' },
          { value: 'SENT', label: 'Sent' },
          { value: 'FAILED', label: 'Failed' },
          { value: 'PENDING', label: 'Pending' }
        ]
      }
    ];
  }

  private initializeRowActions(): void {
    this.rowActions = [
      {
        id: 'view',
        title: 'View Details',
        iconPath: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z',
        color: 'blue',
        permission: 'NOTIFICATIONS.VIEW'
      }
    ];
  }

  // ============================================================================
  // DATA LOADING
  // ============================================================================

  loadNotifications(): void {
    this.loading = true;

    const filters: any = {};

    // Apply filters
    if (this.currentFilters['search']) {
      filters.search = this.currentFilters['search'];
    }
    if (this.currentFilters['notification_type']) {
      filters.notification_type = this.currentFilters['notification_type'];
    }
    if (this.currentFilters['send_status']) {
      filters.send_status = this.currentFilters['send_status'];
    }

    this.notificationsService.getNotifications(
      filters,
      this.pagination.page,
      this.pagination.limit
    )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.notifications = response.data || [];
          this.pagination = {
            ...this.pagination,
            total: response.total || 0,
            totalPages: Math.ceil((response.total || 0) / this.pagination.limit)
          };
          this.loading = false;
          this.calculateStats();
        },
        error: (error) => {
          this.loading = false;
          this.logger.error('Error loading notifications', error);
          this.toast.error('Failed to load notifications');
        }
      });
  }

  loadStats(): void {
    this.notificationsService.getStats()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.stats = {
            total: data.total_notifications || 0,
            today: data.notifications_today || 0,
            sent: data.notifications_sent || 0,
            failed: data.notifications_failed || 0,
            pending: data.notifications_pending || 0
          };
        },
        error: (error) => {
          this.logger.error('Error loading stats', error);
        }
      });
  }

  private calculateStats(): void {
    // Stats are loaded from service, but we can also calculate from current page
    // This is a fallback in case stats service fails
    if (this.stats.total === 0 && this.notifications.length > 0) {
      this.stats = {
        total: this.notifications.length,
        today: 0,
        sent: this.notifications.filter(n => n.send_status === 'SENT').length,
        failed: this.notifications.filter(n => n.send_status === 'FAILED').length,
        pending: this.notifications.filter(n => n.send_status === 'PENDING').length
      };
    }
  }

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  onFilterChange(filters: DataTableFilterState): void {
    this.currentFilters = filters;
    this.pagination.page = 1;
    this.loadNotifications();
  }

  onSortChange(event: DataTableSort | null): void {
    this.logger.debug('Sort change', event);
    // Backend sorting can be implemented here if needed
  }

  onRowAction(event: DataTableRowActionEvent): void {
    const { action, row } = event;

    switch (action) {
      case 'view':
        this.viewNotificationDetails(row);
        break;
    }
  }

  // ============================================================================
  // ACTIONS
  // ============================================================================

  viewNotificationDetails(notification: NotificationLogRecord): void {
    this.selectedNotification = notification;
    this.showDetailPanel = true;
    this.toast.info(`Viewing notification ${notification.log_id}`);
  }

  closeDetailPanel(): void {
    this.showDetailPanel = false;
    this.selectedNotification = null;
  }
}
