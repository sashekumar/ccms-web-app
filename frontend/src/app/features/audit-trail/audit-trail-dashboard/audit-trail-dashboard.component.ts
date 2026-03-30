/**
 * Audit Trail Dashboard Component
 * Displays audit logs and admission change logs with statistics
 */

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { LoadingSpinnerComponent } from '../../../shared/components/ui/loading-spinner/loading-spinner.component';
import { AuditTrailService } from '../../../core/services/audit-trail/audit-trail.service';
import { ToastService } from '../../../core/services/toast.service';
import {
  AuditTrailTabType,
  AuditTrailStatsResponse,
  AuditLogRecord,
  AdmissionLogRecord,
  AuditLogFilters,
  AdmissionLogFilters
} from '../../../shared/models/audit-trail/audit-trail.model';

@Component({
  selector: 'app-audit-trail-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, LoadingSpinnerComponent],
  templateUrl: './audit-trail-dashboard.component.html'
})
export class AuditTrailDashboardComponent implements OnInit, OnDestroy {
  // Tab configuration
  readonly tabOptions: readonly AuditTrailTabType[] = ['AUDIT_LOGS', 'ADMISSION_LOGS'];
  activeTab: AuditTrailTabType = 'AUDIT_LOGS';

  // Math reference for template
  readonly Math = Math;

  // Statistics
  stats: AuditTrailStatsResponse | null = null;
  statsLoading = false;
  statsError: string | null = null;

  // Audit Logs
  auditLogs: AuditLogRecord[] = [];
  auditPage = 1;
  auditLimit = 10;
  auditTotal = 0;
  auditLoading = false;
  auditError: string | null = null;
  auditFilters: AuditLogFilters = {};
  auditSearchTable = '';
  auditSearchUser = '';
  auditActionFilter = '';

  // Admission Logs
  admissionLogs: AdmissionLogRecord[] = [];
  admissionPage = 1;
  admissionLimit = 10;
  admissionTotal = 0;
  admissionLoading = false;
  admissionError: string | null = null;
  admissionFilters: AdmissionLogFilters = {};
  admissionSearchAdmissionId = '';
  admissionSearchUser = '';
  admissionTypeFilter = '';

  // Detail Panel
  selectedRecord: AuditLogRecord | AdmissionLogRecord | null = null;
  showDetailPanel = false;

  private destroy$ = new Subject<void>();

  constructor(
    private auditTrailService: AuditTrailService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.loadStats();
    this.loadAuditLogs();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ========================================================================
  // STATISTICS
  // ========================================================================

  loadStats(): void {
    this.statsLoading = true;
    this.statsError = null;

    this.auditTrailService.getStats()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.stats = data;
          this.statsLoading = false;
        },
        error: (error) => {
          const errorMsg = error?.message || 'Failed to load statistics';
          this.toast.error(errorMsg);
          this.statsError = errorMsg;
          this.statsLoading = false;
        }
      });
  }

  // ========================================================================
  // TAB NAVIGATION
  // ========================================================================

  switchTab(tab: AuditTrailTabType): void {
    this.activeTab = tab;
    this.selectedRecord = null;
    this.showDetailPanel = false;

    if (tab === 'AUDIT_LOGS') {
      if (this.auditLogs.length === 0) {
        this.loadAuditLogs();
      }
    } else if (tab === 'ADMISSION_LOGS') {
      if (this.admissionLogs.length === 0) {
        this.loadAdmissionLogs();
      }
    }
  }

  // ========================================================================
  // AUDIT LOGS OPERATIONS
  // ========================================================================

  loadAuditLogs(): void {
    this.auditLoading = true;
    this.auditError = null;

    // Build filters from search inputs
    this.auditFilters = {};
    if (this.auditSearchTable) this.auditFilters.table_name = this.auditSearchTable;
    if (this.auditSearchUser) this.auditFilters.changed_by = this.auditSearchUser;
    if (this.auditActionFilter) this.auditFilters.action_type = this.auditActionFilter;

    this.auditTrailService.getAuditLogs(this.auditFilters, this.auditPage, this.auditLimit)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.auditLogs = data.data;
          this.auditTotal = data.total;
          this.auditLoading = false;
        },
        error: (error) => {
          const errorMsg = error?.message || 'Failed to load audit logs';
          this.toast.error(errorMsg);
          this.auditError = errorMsg;
          this.auditLoading = false;
        }
      });
  }

  onAuditSearch(): void {
    this.auditPage = 1;
    this.loadAuditLogs();
  }

  onAuditPageChange(page: number): void {
    this.auditPage = page;
    this.loadAuditLogs();
  }

  selectAuditRecord(record: AuditLogRecord): void {
    this.selectedRecord = record;
    this.showDetailPanel = true;
  }

  // ========================================================================
  // ADMISSION LOGS OPERATIONS
  // ========================================================================

  loadAdmissionLogs(): void {
    this.admissionLoading = true;
    this.admissionError = null;

    // Build filters from search inputs
    this.admissionFilters = {};
    if (this.admissionSearchAdmissionId) {
      this.admissionFilters.admission_id = BigInt(this.admissionSearchAdmissionId);
    }
    if (this.admissionSearchUser) this.admissionFilters.changed_by = this.admissionSearchUser;
    if (this.admissionTypeFilter) this.admissionFilters.change_type = this.admissionTypeFilter;

    this.auditTrailService.getAdmissionLogs(this.admissionFilters, this.admissionPage, this.admissionLimit)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.admissionLogs = data.data;
          this.admissionTotal = data.total;
          this.admissionLoading = false;
        },
        error: (error) => {
          const errorMsg = error?.message || 'Failed to load admission logs';
          this.toast.error(errorMsg);
          this.admissionError = errorMsg;
          this.admissionLoading = false;
        }
      });
  }

  onAdmissionSearch(): void {
    this.admissionPage = 1;
    this.loadAdmissionLogs();
  }

  onAdmissionPageChange(page: number): void {
    this.admissionPage = page;
    this.loadAdmissionLogs();
  }

  selectAdmissionRecord(record: AdmissionLogRecord): void {
    this.selectedRecord = record;
    this.showDetailPanel = true;
  }

  // ========================================================================
  // DETAIL PANEL
  // ========================================================================

  closeDetailPanel(): void {
    this.showDetailPanel = false;
    this.selectedRecord = null;
  }

  // ========================================================================
  // HELPERS
  // ========================================================================

  formatDate(date: Date | string): string {
    try {
      const d = new Date(date);
      return d.toLocaleString();
    } catch {
      return String(date);
    }
  }

  formatJson(value: string | null | undefined): string {
    if (!value) return '';
    try {
      const parsed = JSON.parse(value);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return value;
    }
  }

  getActionBadgeClass(action: string): string {
    switch (action?.toUpperCase()) {
      case 'CREATE': return 'bg-green-100 text-green-800';
      case 'UPDATE': return 'bg-blue-100 text-blue-800';
      case 'DELETE': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  getActionLabel(action: string): string {
    return action?.toUpperCase() || 'UNKNOWN';
  }

  isAuditRecord(record: any): record is AuditLogRecord {
    return 'audit_id' in record && 'table_name' in record;
  }

  isAdmissionRecord(record: any): record is AdmissionLogRecord {
    return 'log_id' in record && 'admission_id' in record;
  }

  get auditPages(): number {
    return Math.ceil(this.auditTotal / this.auditLimit);
  }

  get admissionPages(): number {
    return Math.ceil(this.admissionTotal / this.admissionLimit);
  }
}
