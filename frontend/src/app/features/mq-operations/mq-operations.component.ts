import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { AdmissionService } from '../../core/services/admission.service';
import { ToastService } from '../../core/services/toast.service';
import { LoggerService } from '../../core/services/logger.service';
import { MqPrintService } from '../../core/services/mq-print.service';
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
  loading = false;
  selectedMQ: any = null;
  
  // Pagination & Filtering
  searchQuery = '';
  statusFilter = 'ALL';
  page = 1;
  limit = 10;
  total = 0;
  totalPages = 0;
  
  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  constructor(
    private admissionService: AdmissionService,
    private toast: ToastService,
    private logger: LoggerService,
    private printService: MqPrintService
  ) {}

  ngOnInit(): void {
    this.loadMQHistory();
    
    // Setup search debouncing
    this.searchSubject.pipe(
      takeUntil(this.destroy$),
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe(() => {
      this.page = 1;
      this.loadMQHistory();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadMQHistory(): void {
    this.loading = true;
    const filters = {
      page: this.page,
      limit: this.limit,
      search: this.searchQuery,
      status: this.statusFilter
    };

    this.admissionService.getGlobalMQHistory(filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.mqList = response.data;
          this.total = response.total;
          this.totalPages = Math.ceil(this.total / this.limit);
          this.loading = false;
        },
        error: (error) => {
          this.loading = false;
          this.logger.error('Error loading MQ history', error);
          this.toast.error('Failed to load global MQ history');
        }
      });
  }

  onSearchChange(): void {
    this.searchSubject.next(this.searchQuery);
  }

  onFilterChange(): void {
    this.page = 1;
    this.loadMQHistory();
  }

  onPageChange(newPage: number): void {
    if (newPage >= 1 && newPage <= this.totalPages) {
      this.page = newPage;
      this.loadMQHistory();
    }
  }

  updateStatus(mq: any, status: string): void {
    const admissionId = mq.admission_id;
    this.admissionService.updateMQStatus(admissionId, status)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toast.success(`MQ ${mq.claim_ref_no} status updated to ${status}`);
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

  getPaginationRange(): number[] {
    const range: number[] = [];
    const maxPagesToShow = 5;
    let start = Math.max(1, this.page - 2);
    let end = Math.min(this.totalPages, start + maxPagesToShow - 1);
    
    if (end - start < maxPagesToShow - 1) {
      start = Math.max(1, end - maxPagesToShow + 1);
    }
    
    for (let i = start; i <= end; i++) {
      range.push(i);
    }
    return range;
  }

  downloadMQ(mq: any): void {
    if (!mq.remark_text || mq.remark_text === 'No questionnaire content') {
      this.toast.error('No questionnaire content found for this MQ');
      return;
    }

    const lines = mq.remark_text.split('\n');
    const questions = lines
      .filter((line: string) => /^\d+\.\s/.test(line)) 
      .map((line: string) => ({
        text: line.replace(/^\d+\.\s/, ''),
        lines: 3
      }));

    if (questions.length === 0) {
      questions.push({
        text: mq.remark_text.replace('[GENERATED MQ]', '').trim() || 'Record without specific questions',
        lines: 3
      });
    }

    this.printService.print({
      refNo: mq.claim_ref_no,
      recipientType: mq.remark_text.toLowerCase().includes('policyholder') ? 'PH' : 'HOSP',
      questions: questions,
      date: new Date(mq.created_at),
      patientName: mq.patient_name,
      hospitalName: mq.hospital_name
    });
  }

  /**
   * Clean up technical prefix from response text
   */
  getCleanResponse(text: string | null | undefined): string {
    if (!text) return '';
    return text.replace(/^Medical Query response received\. Response:\s*/, '').replace(/\[ATTACHMENT: .*?\]/, '').trim();
  }
}
