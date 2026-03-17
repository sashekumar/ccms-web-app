import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { AdmissionService } from '../../core/services/admission.service';
import { ToastService } from '../../core/services/toast.service';
import { LoggerService } from '../../core/services/logger.service';
import { PERMISSIONS } from '../../core/constants/permissions.constants';

@Component({
  selector: 'app-mq-operations',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './mq-operations.component.html',
  styles: [`
    .scrollbar-elegant::-webkit-scrollbar { width: 6px; }
    .scrollbar-elegant::-webkit-scrollbar-track { background: transparent; }
    .scrollbar-elegant::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
    .scrollbar-elegant::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
  `]
})
export class MqOperationsComponent implements OnInit, OnDestroy {
  readonly PERMISSIONS = PERMISSIONS;
  
  mqList: any[] = [];
  filteredList: any[] = [];
  loading = false;
  searchQuery = '';
  statusFilter = 'ALL';
  
  private destroy$ = new Subject<void>();

  constructor(
    private admissionService: AdmissionService,
    private toast: ToastService,
    private logger: LoggerService
  ) {}

  ngOnInit(): void {
    this.loadMQHistory();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadMQHistory(): void {
    this.loading = true;
    this.admissionService.getGlobalMQHistory()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.mqList = data;
          this.applyFilters();
          this.loading = false;
        },
        error: (error) => {
          this.loading = false;
          this.logger.error('Error loading MQ history', error);
          // In development, if endpoint doesn't exist yet, we can mock it
          this.toast.error('Failed to load global MQ history');
          this.mockData();
        }
      });
  }

  mockData(): void {
    // Mock data for UI demonstration while backend endpoint is being implemented
    this.mqList = [
      {
        remark_id: 101,
        admission_id: 501,
        claim_ref_no: 'CLM-2026-00124',
        patient_name: 'John Doe',
        hospital_name: 'Central General Hospital',
        remark_text: '[GENERATED MQ]\n1. Please provide the detailed clinical history.\n2. When was the patient first diagnosed?',
        action_for: 'MQ_SENT',
        created_at: new Date(Date.now() - 3600000 * 2), // 2 hours ago
        created_by_username: 'doctor_admin'
      },
      {
        remark_id: 102,
        admission_id: 504,
        claim_ref_no: 'CLM-2026-00128',
        patient_name: 'Sarah Smith',
        hospital_name: 'City Medical Center',
        remark_text: '[GENERATED MQ]\n1. Confirm the surgical procedure performed.\n2. Provide discharge summary.',
        action_for: 'MQ_SENT',
        created_at: new Date(Date.now() - 3600000 * 24), // 24 hours ago
        created_by_username: 'case_manager_1'
      }
    ];
    this.applyFilters();
  }

  applyFilters(): void {
    this.filteredList = this.mqList.filter(item => {
      const matchesSearch = !this.searchQuery || 
        item.claim_ref_no?.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        item.patient_name?.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        item.hospital_name?.toLowerCase().includes(this.searchQuery.toLowerCase());
      
      const matchesStatus = this.statusFilter === 'ALL' || 
        (this.statusFilter === 'PENDING' && item.action_for === 'MQ_SENT') ||
        (this.statusFilter === 'CLOSED' && item.action_for === 'MQ_CLOSED');

      return matchesSearch && matchesStatus;
    });
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  updateStatus(mq: any, status: string): void {
    const admissionId = mq.admission_id;
    this.admissionService.updateMQStatus(admissionId, status)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toast.success(`MQ ${mq.claim_ref_no} status updated to ${status}`);
          // Refresh list to show latest status
          this.loadMQHistory();
        },
        error: (err) => {
          this.toast.error('Failed to update MQ status');
          this.logger.error('Update MQ Status error', err);
        }
      });
  }

  formatDate(date: any): string {
    return new Date(date).toLocaleString('en-GB', { 
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' 
    });
  }
}
