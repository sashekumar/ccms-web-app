import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil, Observable } from 'rxjs';
import { HospitalService } from '../../../core/services/hospital.service';
import { BankService } from '../../../core/services/bank.service';
import { LookupService, LookupItem } from '../../../shared/services/lookup.service';
import { CreateHospitalDto, UpdateHospitalDto, Hospital } from '../../../shared/models/hospital.model';
import { Bank } from '../../../shared/models/bank.model';
import { LoggerService } from '../../../core/services/logger.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-hospital-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-gray-50 p-6">
      <!-- Header -->
      <div class="mb-6 flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">{{ isEditMode ? 'Edit Hospital' : 'Create Hospital' }}</h1>
          <p class="mt-1 text-sm text-gray-600">{{ isEditMode ? 'Update hospital information' : 'Add a new hospital to the system' }}</p>
        </div>
        <button
          (click)="goBack()"
          class="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 transition hover:bg-gray-50"
        >
          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
          </svg>
          Back to List
        </button>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading" class="rounded-lg bg-white p-12 text-center shadow">
        <div class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
        <p class="mt-4 text-gray-600">{{ isEditMode ? 'Loading hospital...' : 'Saving...' }}</p>
      </div>

      <!-- Form -->
      <div *ngIf="!loading" class="rounded-lg bg-white p-6 shadow">
        <form (ngSubmit)="save()" #hospitalForm="ngForm">
          <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
            <!-- Hospital Name -->
            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-gray-700">
                Hospital Name <span class="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="hospital_name"
                [(ngModel)]="formData.hospital_name"
                required
                maxlength="255"
                class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#1e3c72] focus:outline-none focus:ring-1 focus:ring-[#1e3c72]"
                placeholder="Enter hospital name"
                #hospitalNameInput="ngModel"
              />
              <p *ngIf="hospitalNameInput.invalid && hospitalNameInput.touched" class="mt-1 text-sm text-red-600">
                Hospital name is required (max 255 characters)
              </p>
            </div>

            <!-- Hospital Code -->
            <div>
              <label class="block text-sm font-medium text-gray-700">Hospital Code</label>
              <input
                type="text"
                name="hospital_code"
                [(ngModel)]="formData.hospital_code"
                maxlength="50"
                class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#1e3c72] focus:outline-none focus:ring-1 focus:ring-[#1e3c72]"
                placeholder="e.g., H001"
              />
            </div>

            <!-- Hospital Type -->
            <div>
              <label class="block text-sm font-medium text-gray-700">Hospital Type</label>
              <select
                name="hospital_type"
                [(ngModel)]="formData.hospital_type"
                class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#1e3c72] focus:outline-none focus:ring-1 focus:ring-[#1e3c72]"
              >
                <option [ngValue]="null">Select Type</option>
                <option *ngFor="let type of hospitalTypes$ | async" [value]="type.lookup_code">
                  {{ type.lookup_value }}
                </option>
              </select>
            </div>

            <!-- Registration Number -->
            <div>
              <label class="block text-sm font-medium text-gray-700">Registration Number</label>
              <input
                type="text"
                name="reg_no"
                [(ngModel)]="formData.reg_no"
                maxlength="100"
                class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#1e3c72] focus:outline-none focus:ring-1 focus:ring-[#1e3c72]"
                placeholder="Hospital registration number"
              />
            </div>

            <!-- Is Panel -->
            <div>
              <label class="block text-sm font-medium text-gray-700">Panel Status</label>
              <select
                name="is_panel"
                [(ngModel)]="formData.is_panel"
                class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#1e3c72] focus:outline-none focus:ring-1 focus:ring-[#1e3c72]"
              >
                <option [ngValue]="null">Not Specified</option>
                <option [ngValue]="true">Panel</option>
                <option [ngValue]="false">Non-Panel</option>
              </select>
            </div>

            <!-- Panel Status Details -->
            <div>
              <label class="block text-sm font-medium text-gray-700">Panel Status Details</label>
              <input
                type="text"
                name="panel_status"
                [(ngModel)]="formData.panel_status"
                maxlength="50"
                class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#1e3c72] focus:outline-none focus:ring-1 focus:ring-[#1e3c72]"
                placeholder="e.g., Active, Suspended"
              />
            </div>

            <!-- Panel Effective Date -->
            <div>
              <label class="block text-sm font-medium text-gray-700">Panel Effective Date</label>
              <input
                type="date"
                name="panel_effective_date"
                [(ngModel)]="formData.panel_effective_date"
                class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#1e3c72] focus:outline-none focus:ring-1 focus:ring-[#1e3c72]"
              />
            </div>

            <!-- Bank -->
            <div>
              <label class="block text-sm font-medium text-gray-700">Bank</label>
              <select
                name="bank_id"
                [(ngModel)]="formData.bank_id"
                class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#1e3c72] focus:outline-none focus:ring-1 focus:ring-[#1e3c72]"
              >
                <option [ngValue]="null">Select Bank</option>
                <option *ngFor="let bank of banks" [ngValue]="bank.bank_id">{{ bank.bank_name }}</option>
              </select>
            </div>

            <!-- Bank Account Number -->
            <div>
              <label class="block text-sm font-medium text-gray-700">Bank Account Number</label>
              <input
                type="text"
                name="bank_acc_no"
                [(ngModel)]="formData.bank_acc_no"
                maxlength="50"
                class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#1e3c72] focus:outline-none focus:ring-1 focus:ring-[#1e3c72]"
                placeholder="Bank account number"
              />
            </div>

            <!-- Accreditation Status -->
            <div>
              <label class="block text-sm font-medium text-gray-700">Accreditation Status</label>
              <select
                name="accreditation_status"
                [(ngModel)]="formData.accreditation_status"
                class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#1e3c72] focus:outline-none focus:ring-1 focus:ring-[#1e3c72]"
              >
                <option [ngValue]="null">Not Specified</option>
                <option *ngFor="let status of accreditationStatuses$ | async" [value]="status.lookup_code">
                  {{ status.lookup_value }}
                </option>
              </select>
            </div>

            <!-- Accreditation Expiry -->
            <div>
              <label class="block text-sm font-medium text-gray-700">Accreditation Expiry</label>
              <input
                type="date"
                name="accreditation_expiry"
                [(ngModel)]="formData.accreditation_expiry"
                class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#1e3c72] focus:outline-none focus:ring-1 focus:ring-[#1e3c72]"
              />
            </div>
          </div>

          <!-- Form Actions -->
          <div class="mt-6 flex gap-3 border-t pt-6">
            <button
              type="button"
              (click)="goBack()"
              [disabled]="saving"
              class="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 md:flex-none md:px-6"
            >
              Cancel
            </button>
            <button
              type="submit"
              [disabled]="hospitalForm.invalid || saving"
              class="flex-1 rounded-lg bg-gradient-to-r from-[#1e3c72] to-[#2a5298] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50 md:flex-none md:px-6"
            >
              {{ saving ? 'Saving...' : (isEditMode ? 'Update Hospital' : 'Create Hospital') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: []
})
export class HospitalFormComponent implements OnInit, OnDestroy {
  isEditMode = false;
  hospitalId?: string;
  loading = false;
  saving = false;
  banks: Bank[] = [];
  loadingBanks = false;

  // Dynamic lookups from database
  hospitalTypes$: Observable<LookupItem[]>;
  accreditationStatuses$: Observable<LookupItem[]>;

  formData: CreateHospitalDto | UpdateHospitalDto = {
    hospital_name: '',
    hospital_code: null,
    hospital_type: null,
    reg_no: null,
    bank_id: null,
    bank_acc_no: null,
    is_panel: null,
    panel_status: null,
    panel_effective_date: null,
    accreditation_status: null,
    accreditation_expiry: null
  };

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private hospitalService: HospitalService,
    private bankService: BankService,
    private lookupService: LookupService,
    private logger: LoggerService,
    private toast: ToastService
  ) {
    // Initialize dynamic lookups
    this.hospitalTypes$ = this.lookupService.getHospitalTypes();
    this.accreditationStatuses$ = this.lookupService.getAccreditationStatuses();
  }

  ngOnInit(): void {
    // Load banks for dropdown
    this.loadBanks();
    
    // Check if we're in edit mode
    this.hospitalId = this.route.snapshot.paramMap.get('id') || undefined;
    this.isEditMode = !!this.hospitalId;

    if (this.isEditMode && this.hospitalId) {
      this.loadHospital(this.hospitalId);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load banks for dropdown
   */
  loadBanks(): void {
    this.loadingBanks = true;
    this.bankService.getBanks({ is_active: true, limit: 1000 })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.banks = result.banks;
          this.loadingBanks = false;
        },
        error: (error) => {
          this.logger.error('Error loading banks:', error);
          this.toast.error('Failed to load banks');
          this.loadingBanks = false;
        }
      });
  }

  /**
   * Load hospital data for editing
   */
  loadHospital(id: string): void {
    this.loading = true;
    this.hospitalService.getHospitalById(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (hospital: Hospital) => {
          this.formData = {
            hospital_name: hospital.hospital_name,
            hospital_code: hospital.hospital_code,
            hospital_type: hospital.hospital_type,
            reg_no: hospital.reg_no,
            bank_id: hospital.bank_id,
            bank_acc_no: hospital.bank_acc_no,
            is_panel: hospital.is_panel,
            panel_status: hospital.panel_status,
            panel_effective_date: hospital.panel_effective_date ? this.formatDateForInput(hospital.panel_effective_date) : null,
            accreditation_status: hospital.accreditation_status,
            accreditation_expiry: hospital.accreditation_expiry ? this.formatDateForInput(hospital.accreditation_expiry) : null
          };
          this.loading = false;
        },
        error: (error) => {
          this.logger.error('Error loading hospital:', error);
          this.toast.error('Failed to load hospital');
          this.loading = false;
          this.goBack();
        }
      });
  }

  /**
   * Save hospital (create or update)
   */
  save(): void {
    if (this.saving) return;

    this.saving = true;

    if (this.isEditMode && this.hospitalId) {
      // Update existing hospital
      this.hospitalService.updateHospital(this.hospitalId, this.formData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.toast.success('Hospital updated successfully');
            this.saving = false;
            this.goBack();
          },
          error: (error: any) => {
            this.logger.error('Error updating hospital:', error);
            this.toast.error('Failed to update hospital');
            this.saving = false;
          }
        });
    } else {
      // Create new hospital
      this.hospitalService.createHospital(this.formData as CreateHospitalDto)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.toast.success('Hospital created successfully');
            this.saving = false;
            this.goBack();
          },
          error: (error: any) => {
            this.logger.error('Error creating hospital:', error);
            this.toast.error('Failed to create hospital');
            this.saving = false;
          }
        });
    }
  }

  /**
   * Navigate back to hospital list
   */
  goBack(): void {
    this.router.navigate(['/hospitals']);
  }

  /**
   * Format date for HTML date input (YYYY-MM-DD)
   */
  private formatDateForInput(date: Date | string | null): string | null {
    if (!date) return null;
    
    const d = new Date(date);
    if (isNaN(d.getTime())) return null;
    
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  }
}
