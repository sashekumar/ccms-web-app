import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { AdmissionService } from '../../../core/services/admission.service';
import { MemberService } from '../../../core/services/member.service';
import { HospitalService } from '../../../core/services/hospital.service';
import { LookupService } from '../../../shared/services/lookup.service';
import { LoggerService } from '../../../core/services/logger.service';
import { ToastService } from '../../../core/services/toast.service';

import { Admission, CreateAdmissionDto, UpdateAdmissionDto } from '../../../shared/models/admission.model';
import { MemberListItem } from '../../../shared/models/member.model';
import { HospitalListItem } from '../../../shared/models/hospital.model';
import { LookupItem } from '../../../shared/services/lookup.service';
import { LoadingSpinnerComponent } from '../../../shared/components/ui/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-admission-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LoadingSpinnerComponent],
  template: `
    <div class="min-h-screen bg-gray-50 p-6">
      <!-- Header -->
      <div class="mb-6">
        <button
          (click)="goBack()"
          class="mb-2 inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors duration-150">
          <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <h1 class="text-3xl font-bold text-gray-900">
          {{ isEditMode ? 'Edit Admission' : 'Create New Admission' }}
        </h1>
        <p class="mt-2 text-sm text-gray-600">
          {{ isEditMode ? 'Update admission information' : 'Fill in the details to create a new admission record' }}
        </p>
      </div>

      <!-- Loading Spinner -->
      <app-loading-spinner *ngIf="loading"></app-loading-spinner>

      <!-- Form -->
      <div *ngIf="!loading" class="bg-white shadow rounded-lg p-6">
        <form [formGroup]="admissionForm" (ngSubmit)="onSubmit()">
          <!-- Patient & Hospital Information Section -->
          <div class="mb-8">
            <h3 class="text-lg font-medium text-gray-900 mb-4 pb-2 border-b border-gray-200">Patient & Hospital Information</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- Member (Patient) -->
              <div>
                <label for="member_id" class="block text-sm font-medium text-gray-700 mb-2">
                  Member ID (Patient) <span class="text-red-500">*</span>
                </label>
                <select
                  id="member_id"
                  formControlName="member_id"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#1e3c72] focus:border-[#1e3c72]"
                  [class.border-red-500]="admissionForm.get('member_id')?.invalid && admissionForm.get('member_id')?.touched"
                >
                  <option value="">Select policy holder</option>
                  <option *ngFor="let member of members" [value]="member.member_id">
                    {{ member.full_name }} ({{ member.ic_no }}) - ID: {{ member.member_id }}
                  </option>
                </select>
                <p *ngIf="admissionForm.get('member_id')?.invalid && admissionForm.get('member_id')?.touched" class="mt-1 text-sm text-red-600">
                  Member is required
                </p>
              </div>

              <!-- Hospital -->
              <div>
                <label for="hospital_id" class="block text-sm font-medium text-gray-700 mb-2">
                  Hospital <span class="text-red-500">*</span>
                </label>
                <select
                  id="hospital_id"
                  formControlName="hospital_id"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#1e3c72] focus:border-[#1e3c72]"
                  [class.border-red-500]="admissionForm.get('hospital_id')?.invalid && admissionForm.get('hospital_id')?.touched"
                >
                  <option value="">Select hospital</option>
                  <option *ngFor="let hospital of hospitals" [value]="hospital.hospital_id">
                    {{ hospital.hospital_name }}
                  </option>
                </select>
                <p *ngIf="admissionForm.get('hospital_id')?.invalid && admissionForm.get('hospital_id')?.touched" class="mt-1 text-sm text-red-600">
                  Hospital is required
                </p>
                <p class="mt-1 text-xs text-gray-500">
                  Claim will be auto-created (CLM-YYYY-NNNNN)
                </p>
              </div>
            </div>
          </div>

          <!-- Admission Dates Section -->
          <div class="mb-8">
            <h3 class="text-lg font-medium text-gray-900 mb-4 pb-2 border-b border-gray-200">Admission Dates</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- Admission Date -->
              <div>
                <label for="admission_date" class="block text-sm font-medium text-gray-700 mb-2">
                  Admission Date <span class="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  id="admission_date"
                  formControlName="admission_date"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#1e3c72] focus:border-[#1e3c72]"
                  [class.border-red-500]="admissionForm.get('admission_date')?.invalid && admissionForm.get('admission_date')?.touched"
                />
                <p *ngIf="admissionForm.get('admission_date')?.invalid && admissionForm.get('admission_date')?.touched" class="mt-1 text-sm text-red-600">
                  Admission date is required
                </p>
              </div>

              <!-- Discharge Date -->
              <div>
                <label for="discharge_date" class="block text-sm font-medium text-gray-700 mb-2">
                  Discharge Date
                </label>
                <input
                  type="date"
                  id="discharge_date"
                  formControlName="discharge_date"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#1e3c72] focus:border-[#1e3c72]"
                  [class.border-red-500]="admissionForm.get('discharge_date')?.invalid && admissionForm.get('discharge_date')?.touched"
                />
                <p *ngIf="admissionForm.get('discharge_date')?.hasError('dischargeBeforeAdmission') && admissionForm.get('discharge_date')?.touched" class="mt-1 text-sm text-red-600">
                  Discharge date must be after admission date
                </p>
              </div>

              <!-- Length of Stay (Days) -->
              <div>
                <label for="los_days" class="block text-sm font-medium text-gray-700 mb-2">
                  Length of Stay (Days)
                </label>
                <input
                  type="number"
                  id="los_days"
                  formControlName="los_days"
                  min="0"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#1e3c72] focus:border-[#1e3c72]"
                  placeholder="0"
                />
                <p class="mt-1 text-xs text-gray-500">
                  Optional: Will be auto-calculated if discharge date is set
                </p>
              </div>
            </div>
          </div>

          <!-- Admission Details Section -->
          <div class="mb-8">
            <h3 class="text-lg font-medium text-gray-900 mb-4 pb-2 border-b border-gray-200">Admission Details</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- Admission Type -->
              <div>
                <label for="admission_type" class="block text-sm font-medium text-gray-700 mb-2">
                  Admission Type <span class="text-red-500">*</span>
                </label>
                <select
                  id="admission_type"
                  formControlName="admission_type"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#1e3c72] focus:border-[#1e3c72]"
                  [class.border-red-500]="admissionForm.get('admission_type')?.invalid && admissionForm.get('admission_type')?.touched"
                >
                  <option value="">Select admission type</option>
                  <option *ngFor="let type of admissionTypes" [value]="type.lookup_value">
                    {{ type.lookup_code }}
                  </option>
                </select>
                <p *ngIf="admissionForm.get('admission_type')?.invalid && admissionForm.get('admission_type')?.touched" class="mt-1 text-sm text-red-600">
                  Admission type is required
                </p>
              </div>

              <!-- Room Type -->
              <div>
                <label for="room_type" class="block text-sm font-medium text-gray-700 mb-2">
                  Room Type <span class="text-red-500">*</span>
                </label>
                <select
                  id="room_type"
                  formControlName="room_type"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#1e3c72] focus:border-[#1e3c72]"
                  [class.border-red-500]="admissionForm.get('room_type')?.invalid && admissionForm.get('room_type')?.touched"
                >
                  <option value="">Select room type</option>
                  <option *ngFor="let type of roomTypes" [value]="type.lookup_value">
                    {{ type.lookup_code }}
                  </option>
                </select>
                <p *ngIf="admissionForm.get('room_type')?.invalid && admissionForm.get('room_type')?.touched" class="mt-1 text-sm text-red-600">
                  Room type is required
                </p>
              </div>

              <!-- Room Rate -->
              <div>
                <label for="room_rate" class="block text-sm font-medium text-gray-700 mb-2">
                  Room Rate (MYR)
                </label>
                <input
                  type="number"
                  id="room_rate"
                  formControlName="room_rate"
                  step="0.01"
                  min="0"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#1e3c72] focus:border-[#1e3c72]"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          <!-- ICU Details Section -->
          <div class="mb-8">
            <h3 class="text-lg font-medium text-gray-900 mb-4 pb-2 border-b border-gray-200">ICU Details</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- ICU Days -->
              <div>
                <label for="icu_days" class="block text-sm font-medium text-gray-700 mb-2">
                  ICU Days
                </label>
                <input
                  type="number"
                  id="icu_days"
                  formControlName="icu_days"
                  min="0"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#1e3c72] focus:border-[#1e3c72]"
                  placeholder="0"
                />
              </div>

              <!-- ICU Rate -->
              <div>
                <label for="icu_rate" class="block text-sm font-medium text-gray-700 mb-2">
                  ICU Rate (MYR)
                </label>
                <input
                  type="number"
                  id="icu_rate"
                  formControlName="icu_rate"
                  step="0.01"
                  min="0"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#1e3c72] focus:border-[#1e3c72]"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          <!-- Medical Details Section -->
          <div class="mb-8">
            <h3 class="text-lg font-medium text-gray-900 mb-4 pb-2 border-b border-gray-200">Medical Details</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- Initial Diagnosis -->
              <div>
                <label for="diagnosis" class="block text-sm font-medium text-gray-700 mb-2">
                  Initial Diagnosis
                </label>
                <input
                  type="text"
                  id="diagnosis"
                  formControlName="diagnosis"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#1e3c72] focus:border-[#1e3c72]"
                  placeholder="e.g. Dengue Fever"
                />
              </div>

              <!-- Diagnosis Category (for LOS Threshold) -->
              <div>
                <label for="diagnosisCategory" class="block text-sm font-medium text-gray-700 mb-2">
                  Diagnosis Category (for LOS Threshold)
                </label>
                <select
                  id="diagnosisCategory"
                  formControlName="diagnosisCategory"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#1e3c72] focus:border-[#1e3c72]"
                >
                  <option value="">-- No Category (Use Policy Default) --</option>
                  <option *ngFor="let cat of diagnosisCategories" [value]="cat.lookup_value">
                    {{ cat.lookup_code }}
                  </option>
                </select>
                <p class="mt-1 text-xs text-gray-500">
                  Select to apply specific Length of Stay threshold rules.
                </p>
              </div>
            </div>
          </div>

          <!-- Status & Flags Section -->
          <div class="mb-8">
            <h3 class="text-lg font-medium text-gray-900 mb-4 pb-2 border-b border-gray-200">Status & Alerts</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- EHM Status -->
              <div>
                <label for="ehm_status" class="block text-sm font-medium text-gray-700 mb-2">
                  EHM Status
                </label>
                <select
                  id="ehm_status"
                  formControlName="ehm_status"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#1e3c72] focus:border-[#1e3c72]"
                >
                  <option value="">Select EHM status</option>
                  <option *ngFor="let status of ehmStatuses" [value]="status.lookup_value">
                    {{ status.lookup_code }}
                  </option>
                </select>
              </div>

              <!-- Deferment Status -->
              <div>
                <label for="deferment_status" class="block text-sm font-medium text-gray-700 mb-2">
                  Deferment Status
                </label>
                <select
                  id="deferment_status"
                  formControlName="deferment_status"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#1e3c72] focus:border-[#1e3c72]"
                >
                  <option value="">Select deferment status</option>
                  <option *ngFor="let status of defermentStatuses" [value]="status.lookup_value">
                    {{ status.lookup_code }}
                  </option>
                </select>
              </div>

              <!-- Alert Flag -->
              <div class="flex items-center">
                <input
                  type="checkbox"
                  id="alert_flag"
                  formControlName="alert_flag"
                  class="h-4 w-4 text-[#1e3c72] focus:ring-[#1e3c72] border-gray-300 rounded"
                />
                <label for="alert_flag" class="ml-2 block text-sm font-medium text-gray-700">
                  Alert Flag
                </label>
              </div>
            </div>
          </div>

          <!-- Form Actions -->
          <div class="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              (click)="goBack()"
              [disabled]="submitting"
              class="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1e3c72] disabled:opacity-50 disabled:cursor-not-allowed">
              Cancel
            </button>
            <button
              type="submit"
              [disabled]="admissionForm.invalid || submitting"
              class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#1e3c72] hover:bg-[#2a5298] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1e3c72] disabled:opacity-50 disabled:cursor-not-allowed">
              <svg *ngIf="submitting" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {{ isEditMode ? 'Update Admission' : 'Create Admission' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `
})
export class AdmissionFormComponent implements OnInit, OnDestroy {
  admissionForm!: FormGroup;
  isEditMode = false;
  admissionId: number | null = null;
  loading = false;
  submitting = false;

  members: MemberListItem[] = [];
  hospitals: HospitalListItem[] = [];
  admissionTypes: LookupItem[] = [];
  roomTypes: LookupItem[] = [];
  ehmStatuses: LookupItem[] = [];
  defermentStatuses: LookupItem[] = [];
  diagnosisCategories: LookupItem[] = [];

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private admissionService: AdmissionService,
    private memberService: MemberService,
    private hospitalService: HospitalService,
    private lookupService: LookupService,
    private router: Router,
    private route: ActivatedRoute,
    private logger: LoggerService,
    private toast: ToastService
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    // Load master data for dropdowns
    this.loadMembers();
    this.loadHospitals();
    this.loadLookups();

    // Check if we're in edit mode
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.admissionId = parseInt(id, 10);
      this.isEditMode = true;
      this.loadAdmission();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Initialize form with validators
   */
  private initializeForm(): void {
    this.admissionForm = this.fb.group({
      member_id: ['', Validators.required],
      hospital_id: ['', Validators.required],
      policy_record_id: [''],
      admission_date: ['', Validators.required],
      discharge_date: [''],
      los_days: [{ value: '', disabled: true }], // Auto-calculated by backend, show here for info only (or we will compute locally on form changes if needed)
      admission_type: ['', Validators.required],
      room_type: ['', Validators.required],
      room_rate: [''],
      icu_days: [''],
      icu_rate: [''],
      ehm_status: [''],
      deferment_status: [''],
      estimated_amount: [''],
      diagnosis: [''],
      diagnosisCategory: [''],
      alert_flag: [false]
    });

    // Add custom validator for discharge date
    this.admissionForm.get('discharge_date')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.validateDischargeDate();
      });
  }

  /**
   * Validate discharge date is after admission date
   */
  private validateDischargeDate(): void {
    const admissionDate = this.admissionForm.get('admission_date')?.value;
    const dischargeDate = this.admissionForm.get('discharge_date')?.value;

    if (admissionDate && dischargeDate && new Date(dischargeDate) < new Date(admissionDate)) {
      this.admissionForm.get('discharge_date')?.setErrors({ dischargeBeforeAdmission: true });
    } else if (this.admissionForm.get('discharge_date')?.hasError('dischargeBeforeAdmission')) {
      this.admissionForm.get('discharge_date')?.setErrors(null);
    }
  }

  /**
   * Load active members (policy holders) for dropdown
   */
  private loadMembers(): void {
    this.memberService.getMembers({ 
      member_status: 'ACTIVE',
      is_deleted: false,
      limit: 1000 // Load more for dropdown
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.members = response.members;
        },
        error: (error) => {
          this.logger.error('Error loading members:', error);
          this.toast.error('Failed to load members list');
        }
      });
  }

  /**
   * Load active hospitals for dropdown
   */
  private loadHospitals(): void {
    this.hospitalService.getHospitals({ 
      is_panel: true,  // Panel hospitals only
      is_deleted: false,
      limit: 500 // Load all active hospitals
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.hospitals = response.hospitals;
        },
        error: (error) => {
          this.logger.error('Error loading hospitals:', error);
          this.toast.error('Failed to load hospitals list');
        }
      });
  }

  /**
   * Load lookup data for dropdowns
   */
  private loadLookups(): void {
    this.lookupService.getAdmissionTypes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (types) => this.admissionTypes = types,
        error: (error) => this.logger.error('Error loading admission types:', error)
      });

    this.lookupService.getRoomTypes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (types) => this.roomTypes = types,
        error: (error) => this.logger.error('Error loading room types:', error)
      });

    this.lookupService.getEhmStatuses()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (statuses) => this.ehmStatuses = statuses,
        error: (error) => this.logger.error('Error loading EHM statuses:', error)
      });

    this.lookupService.getDefermentStatuses()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (statuses) => this.defermentStatuses = statuses,
        error: (error) => this.logger.error('Error loading deferment statuses:', error)
      });

    this.lookupService.getDiagnosisCategories()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (categories) => this.diagnosisCategories = categories,
        error: (error) => this.logger.error('Error loading diagnosis categories:', error)
      });
  }

  /**
   * Load admission for editing
   */
  private loadAdmission(): void {
    if (!this.admissionId) return;

    this.loading = true;
    this.admissionService.getAdmissionById(this.admissionId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (admission) => {
          this.patchFormValues(admission);
          this.loading = false;
        },
        error: (error) => {
          this.logger.error('Error loading admission:', error);
          this.toast.error('Failed to load admission');
          this.goBack();
        }
      });
  }

  /**
   * Patch form with admission data
   */
  private patchFormValues(admission: Admission): void {
    // Note: For edit mode, we need to fetch member_id and hospital_id from the linked claim
    // For now, we'll disable these fields in edit mode since they shouldn't change
    this.admissionForm.patchValue({
      member_id: admission.member_id || '',
      hospital_id: admission.hospital_id || '',
      policy_record_id: admission.policy_record_id || '',
      admission_date: admission.admission_date ? this.formatDateForInput(admission.admission_date) : '',
      discharge_date: admission.discharge_date ? this.formatDateForInput(admission.discharge_date) : '',
      los_days: admission.los_days,
      admission_type: admission.admission_type,
      room_type: admission.room_type,
      room_rate: admission.room_rate,
      icu_days: admission.icu_days,
      icu_rate: admission.icu_rate,
      ehm_status: admission.ehm_status,
      deferment_status: admission.deferment_status,
      estimated_amount: admission.estimated_amount,
      diagnosis: admission.diagnosis || '',
      diagnosisCategory: admission.diagnosis_category || '',
      alert_flag: admission.alert_flag
    });
    
    // Disable member and hospital fields in edit mode (can't change parent claim)
    this.admissionForm.get('member_id')?.disable();
    this.admissionForm.get('hospital_id')?.disable();
  }

  /**
   * Format date for input field (YYYY-MM-DD)
   */
  private formatDateForInput(date: Date | string): string {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Handle form submission
   */
  onSubmit(): void {
    if (this.admissionForm.invalid) {
      this.admissionForm.markAllAsTouched();
      this.toast.error('Please fill in all required fields');
      return;
    }

    this.validateDischargeDate();
    if (this.admissionForm.get('discharge_date')?.hasError('dischargeBeforeAdmission')) {
      this.toast.error('Discharge date must be after admission date');
      return;
    }

    const formValue = this.admissionForm.getRawValue(); // Use getRawValue to include disabled fields
    
    // Clean up form data (remove empty values)
    const data: any = {
      member_id: formValue.member_id,
      hospital_id: formValue.hospital_id,
      admission_date: formValue.admission_date,
      admission_type: formValue.admission_type,
      room_type: formValue.room_type
    };

    // Add optional fields only if they have values
    if (formValue.policy_record_id) data.policy_record_id = parseInt(formValue.policy_record_id, 10);
    if (formValue.discharge_date) data.discharge_date = formValue.discharge_date;
    if (formValue.room_rate) data.room_rate = parseFloat(formValue.room_rate);
    if (formValue.icu_days) data.icu_days = parseInt(formValue.icu_days, 10);
    if (formValue.icu_rate) data.icu_rate = parseFloat(formValue.icu_rate);
    if (formValue.ehm_status) data.ehm_status = formValue.ehm_status;
    if (formValue.deferment_status) data.deferment_status = formValue.deferment_status;
    if (formValue.estimated_amount) data.estimated_amount = parseFloat(formValue.estimated_amount);
    if (formValue.diagnosis) data.diagnosis = formValue.diagnosis;
    if (formValue.diagnosisCategory) data.diagnosis_category = formValue.diagnosisCategory;
    data.alert_flag = !!formValue.alert_flag;

    if (this.isEditMode) {
      this.updateAdmission(data);
    } else {
      this.createAdmission(data);
    }
  }

  /**
   * Create new admission with auto-claim creation
   * Backend returns: { admission_id, claim_id, claim_ref_no }
   */
  private createAdmission(data: CreateAdmissionDto): void {
    this.submitting = true;
    this.admissionService.createAdmission(data)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.submitting = false;
          this.toast.success(`Admission created successfully! Claim: ${response.claim_ref_no}`);
          this.router.navigate(['/admissions', response.admission_id]);
        },
        error: (error) => {
          this.submitting = false;
          this.logger.error('Error creating admission:', error);
          this.toast.error(error.error?.message || 'Failed to create admission');
        }
      });
  }

  /**
   * Update existing admission
   */
  private updateAdmission(data: UpdateAdmissionDto): void {
    if (!this.admissionId) return;

    this.submitting = true;
    this.admissionService.updateAdmission(this.admissionId, data)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.submitting = false;
          this.toast.success('Admission updated successfully');
          this.router.navigate(['/admissions', this.admissionId]);
        },
        error: (error) => {
          this.submitting = false;
          this.logger.error('Error updating admission:', error);
          this.toast.error(error.error?.message || 'Failed to update admission');
        }
      });
  }

  /**
   * Navigate back
   */
  goBack(): void {
    if (this.isEditMode && this.admissionId) {
      this.router.navigate(['/admissions', this.admissionId]);
    } else {
      this.router.navigate(['/admissions']);
    }
  }
}
