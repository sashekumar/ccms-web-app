import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { MemberService } from '../../../core/services/member.service';
import { LoggerService } from '../../../core/services/logger.service';
import { ToastService } from '../../../core/services/toast.service';
import { LookupService, LookupItem } from '../../../shared/services/lookup.service';

import { MemberListItem, MemberFilters } from '../../../shared/models/member.model';
import { ButtonComponent } from '../../../shared/components/ui/button/button.component';
import { DataTableComponent, DataTableColumn, DataTableFilter, DataTablePagination, DataTableAction } from '../../../shared/components/ui/data-table/data-table.component';
import { ConfirmDialogComponent } from '../../../shared/components/ui/confirm-dialog/confirm-dialog.component';
import { HasPermissionDirective } from '../../../shared/directives/permissions/has-permission.directive';
import { PERMISSIONS } from '../../../core/constants/permissions.constants';
import { APP_ROUTES } from '../../../core/constants/routes.constants';

@Component({
  selector: 'app-member-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonComponent,
    DataTableComponent,
    ConfirmDialogComponent,
    HasPermissionDirective
  ],
  templateUrl: './member-list.component.html',
  styles: []
})
export class MemberListComponent implements OnInit, OnDestroy {
  readonly PERMISSIONS = PERMISSIONS.POLICY_HOLDERS;
  protected readonly Math = Math;

  // Data Table Configuration
  columns: DataTableColumn[] = [
    {
      key: 'full_name',
      label: 'Member',
      type: 'avatar',
      avatarSubKey: 'ic_no',
      sortable: true
    },
    {
      key: 'fwd_member_no',
      label: 'Member Number',
      type: 'text',
      sortable: true,
      emptyText: '-'
    },
    {
      key: 'member_type',
      label: 'Type',
      type: 'text',
      sortable: true,
      emptyText: '-'
    },
    {
      key: 'enrollment_date',
      label: 'Enrollment Date',
      type: 'date',
      dateFormat: 'dd/MM/yyyy',
      sortable: true
    },
    {
      key: 'member_status',
      label: 'Status',
      type: 'badge',
      sortable: true,
      badgeClickable: true,
      badgeMap: {
        'ACTIVE': { label: 'Active', color: 'green' },
        'INACTIVE': { label: 'Inactive', color: 'gray' },
        'SUSPENDED': { label: 'Suspended', color: 'yellow' },
        'TERMINATED': { label: 'Terminated', color: 'red' }
      },
      emptyText: '-'
    }
  ];

  tableFilters: DataTableFilter[] = [
    {
      key: 'search',
      label: 'Search',
      type: 'search',
      placeholder: 'Name, IC number, or member number'
    },
    {
      key: 'member_type',
      label: 'Member Type',
      type: 'select',
      placeholder: 'All Types',
      options: [
        { label: 'All Types', value: '' },
        { label: 'Principal', value: 'Principal' },
        { label: 'Dependent', value: 'Dependent' },
        { label: 'Other', value: 'Other' }
      ]
    },
    {
      key: 'member_status',
      label: 'Status',
      type: 'select',
      placeholder: 'All Statuses',
      options: [
        { label: 'All', value: '' },
        { label: 'Active', value: 'ACTIVE' },
        { label: 'Inactive', value: 'INACTIVE' },
        { label: 'Suspended', value: 'SUSPENDED' },
        { label: 'Terminated', value: 'TERMINATED' }
      ]
    }
  ];

  rowActions: DataTableAction[] = [
    {
      id: 'view',
      title: 'View Member',
      iconPath: 'M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z',
      color: 'blue',
      testId: 'view-member'
    },
    {
      id: 'edit',
      title: 'Edit Member',
      iconPath: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
      color: 'blue',
      permission: this.PERMISSIONS.UPDATE,
      testId: 'edit-member'
    },
    {
      id: 'delete',
      title: 'Delete Member',
      iconPath: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16',
      color: 'red',
      permission: this.PERMISSIONS.DELETE,
      testId: 'delete-member'
    }
  ];

  // Component State
  members: MemberListItem[] = [];
  loading = false;
  memberTypeLookups: LookupItem[] = [];
  stats = {
    total: 0,
    active: 0,
    suspended: 0,
    terminated: 0
  };

  filters: MemberFilters = {
    search: '',
    member_type: '',
    member_status: undefined,
    is_deleted: undefined,
    page: 1,
    limit: 25
  };

  pagination: DataTablePagination = {
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 0
  };

  // Confirmation Dialog State
  showDeleteConfirm = false;
  memberToDelete: MemberListItem | null = null;

  // Status Change Dialog State
  showStatusChangeDialog = false;
  memberToChangeStatus: MemberListItem | null = null;
  newMemberStatus: string = '';

  private destroy$ = new Subject<void>();
  private searchSubject$ = new Subject<string>();

  constructor(
    private memberService: MemberService,
    private router: Router,
    private logger: LoggerService,
    private toast: ToastService,
    private lookupService: LookupService
  ) {}

  ngOnInit(): void {
    // Setup search debouncing
    this.searchSubject$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe((searchTerm) => {
        this.filters.search = searchTerm;
        this.filters.page = 1;
        this.loadMembers();
      });

    // Load lookups for filter dropdowns
    this.loadMemberTypeLookups();
    this.loadMembers();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load member type lookups from database
   */
  private loadMemberTypeLookups(): void {
    this.lookupService.getLookupByCategory('MEMBER_TYPE')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (lookups) => {
          this.memberTypeLookups = lookups;
          // Update filter options dynamically
          const memberTypeFilter = this.tableFilters.find(f => f.key === 'member_type');
          if (memberTypeFilter && memberTypeFilter.options) {
            memberTypeFilter.options = [
              { label: 'All Types', value: '' },
              ...lookups.map(l => ({ label: l.lookup_value, value: l.lookup_code }))
            ];
          }
        },
        error: (error) => {
          this.logger.error('Error loading member type lookups:', error);
          // Keep hardcoded fallback options if lookup fails
        }
      });
  }

  /**
   * Load members with current filters
   */
  loadMembers(): void {
    this.loading = true;
    this.logger.info('Loading members with filters:', this.filters);

    this.memberService.getMembers(this.filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          // No need to compute is_active - use member_status from backend
          this.members = result.members;
          this.pagination = {
            page: result.page,
            limit: result.limit || this.filters.limit || 25,
            total: result.total,
            totalPages: result.totalPages
          };

          // Calculate stats from response
          this.stats = {
            total: result.stats?.total_members || result.total,
            active: this.members.filter(m => m.member_status === 'ACTIVE').length,
            suspended: this.members.filter(m => m.member_status === 'SUSPENDED').length,
            terminated: this.members.filter(m => m.member_status === 'TERMINATED').length
          };

          this.loading = false;
          this.logger.info('Members loaded successfully');
        },
        error: (error) => {
          this.loading = false;
          this.logger.error('Error loading members:', error);
          this.toast.error('Failed to load members');
        }
      });
  }

  /**
   * Handle table filter change
   */
  onTableFilterChange(filters: Record<string, any>): void {
    this.logger.info('Table filter changed:', filters);
    
    // Map filter values to API filter format
    this.filters = {
      search: filters['search'] || '',
      member_type: filters['member_type'] || '',
      is_deleted: filters['is_deleted'] === null ? undefined : filters['is_deleted'],
      member_status: undefined,
      page: 1,
      limit: filters['limit'] || 25
    };
    
    this.loadMembers();
  }

  /**
   * Handle table row action
   */
  onRowAction(event: { action: string; row: any }): void {
    const member = event.row as MemberListItem;
    const actionId = event.action; // DataTable emits the 'id' as 'action'
    
    switch (actionId) {
      case 'view':
        this.viewMember(member.member_id);
        break;
      case 'edit':
        this.editMember(member.member_id);
        break;
      case 'delete':
        this.memberToDelete = member;
        this.showDeleteConfirm = true;
        break;
    }
  }

  /**
   * Handle page change
   */
  onPageChange(page: number): void {
    this.filters.page = page;
    this.loadMembers();
  }

  /**
   * Handle cell click (for status badge)
   */
  onCellClick(event: { row: any; column: any; value: any }): void {
    if (event.column.key === 'member_status') {
      this.memberToChangeStatus = event.row;
      this.newMemberStatus = event.value || 'ACTIVE';
      this.showStatusChangeDialog = true;
    }
  }

  /**
   * Change member status
   */
  changeMemberStatus(newStatus: string): void {
    if (!this.memberToChangeStatus) return;

    const memberId = this.memberToChangeStatus.member_id;
    
    this.memberService.updateMember(memberId, { member_status: newStatus })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toast.success(`Member status updated to ${newStatus}`);
          this.showStatusChangeDialog = false;
          this.memberToChangeStatus = null;
          this.loadMembers();
        },
        error: (error: any) => {
          this.logger.error('Error updating member status:', error);
          this.toast.error('Failed to update member status');
          this.showStatusChangeDialog = false;
          this.memberToChangeStatus = null;
        }
      });
  }

  /**
   * Cancel status change
   */
  cancelStatusChange(): void {
    this.showStatusChangeDialog = false;
    this.memberToChangeStatus = null;
    this.newMemberStatus = '';
  }

  /**
   * Navigate to create member page
   */
  createMember(): void {
    this.router.navigate([APP_ROUTES.MEMBERS.CREATE]);
  }

  /**
   * Navigate to view member page
   */
  viewMember(member_id: string): void {
    this.router.navigate([APP_ROUTES.MEMBERS.DETAIL(member_id)]);
  }

  /**
   * Navigate to edit member page
   */
  editMember(member_id: string): void {
    this.router.navigate([APP_ROUTES.MEMBERS.EDIT(member_id)]);
  }

  /**
   * Confirm delete member
   */
  confirmDelete(): void {
    if (!this.memberToDelete) return;

    this.loading = true;
    this.showDeleteConfirm = false;

    this.memberService.deleteMember(this.memberToDelete.member_id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toast.success(`Member "${this.memberToDelete?.full_name}" deleted successfully`);
          this.memberToDelete = null;
          this.loadMembers();
        },
        error: (error) => {
          this.loading = false;
          this.logger.error('Error deleting member:', error);
          this.toast.error('Failed to delete member');
          this.memberToDelete = null;
        }
      });
  }

  /**
   * Cancel delete member
   */
  cancelDelete(): void {
    this.showDeleteConfirm = false;
    this.memberToDelete = null;
  }

  /**
   * Get initials for avatar
   */
  getInitials(name: string): string {
    if (!name) return '??';
    const words = name.split(' ').filter(word => word.length > 0);
    if (words.length === 0) return '??';
    if (words.length === 1) {
      // For single word, return first 2 characters
      return words[0].substring(0, 2).toUpperCase();
    }
    // For multiple words, return first character of each word (up to 2)
    return words
      .slice(0, 2)
      .map(word => word[0])
      .join('')
      .toUpperCase();
  }

  /**
   * Get status badge configuration for member
   */
  getStatusBadge(member: MemberListItem): { text: string; class: string } {
    return member.is_deleted
      ? { text: 'Deleted', class: 'bg-red-100 text-red-800' }
      : { text: 'Active', class: 'bg-green-100 text-green-800' };
  }

  /**
   * Format date to display format
   */
  formatDate(date: string | Date): string {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleDateString('en-GB'); // Returns dd/MM/yyyy format
  }
}


