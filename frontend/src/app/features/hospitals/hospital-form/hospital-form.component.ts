import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { HospitalService } from '../../../core/services/hospital.service';
import { BankService } from '../../../core/services/bank.service';
import { LookupService, LookupItem } from '../../../shared/services/lookup.service';
import { CreateHospitalDto, UpdateHospitalDto, Hospital } from '../../../shared/models/hospital.model';
import { Bank } from '../../../shared/models/bank.model';
import { LoggerService } from '../../../core/services/logger.service';
import { ToastService } from '../../../core/services/toast.service';
import { DropdownComponent, DropdownOption } from '../../../shared/components/ui/dropdown/dropdown.component';
import { DatePickerComponent } from '../../../shared/components/ui/date-picker/date-picker.component';
import { TextInputComponent } from '../../../shared/components/ui/text-input/text-input.component';
import { ButtonComponent } from '../../../shared/components/ui/button/button.component';

import { APP_ROUTES } from '../../../core/constants/routes.constants'

@Component({
  selector: 'app-hospital-form',
  standalone: true,
  imports: [CommonModule, FormsModule, DropdownComponent, DatePickerComponent, TextInputComponent, ButtonComponent],
  template: `
    <div class="min-h-screen bg-gray-50 p-6">
      <!-- Header -->
      <div class="mb-6 flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">{{ isEditMode ? 'Edit Hospital' : 'Create Hospital' }}</h1>
          <p class="mt-1 text-sm text-gray-600">{{ isEditMode ? 'Update hospital information' : 'Add a new hospital to the system' }}</p>
        </div>
        <app-button
          variant="secondary"
          iconLeft="fas fa-arrow-left"
          (click)="goBack()"
        >
          Back to List
        </app-button>
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
              <app-text-input
                label="Hospital Name"
                name="hospital_name"
                [(ngModel)]="formData.hospital_name"
                [required]="true"
                [maxLength]="255"
                placeholder="Enter hospital name"
                #hospitalNameInput="ngModel"
              ></app-text-input>
              <p *ngIf="hospitalNameInput.invalid && hospitalNameInput.touched" class="mt-1 text-sm text-red-600">
                Hospital name is required (max 255 characters)
              </p>
            </div>

            <!-- Hospital Code -->
            <div>
              <app-text-input
                label="Hospital Code"
                name="hospital_code"
                [(ngModel)]="formData.hospital_code"
                [maxLength]="50"
                placeholder="e.g., H001"
              ></app-text-input>
            </div>

            <!-- Hospital Type -->
            <div>
              <app-dropdown
                label="Hospital Type"
                name="hospital_type"
                [(ngModel)]="formData.hospital_type"
                [options]="(hospitalTypeOptions$ | async) || []"
                placeholder="Select Type"
                [clearable]="true"
              ></app-dropdown>
            </div>

            <!-- Registration Number -->
            <div>
              <app-text-input
                label="Registration Number"
                name="reg_no"
                [(ngModel)]="formData.reg_no"
                [maxLength]="100"
                placeholder="Hospital registration number"
              ></app-text-input>
            </div>

            <!-- Is Panel -->
            <div>
              <app-dropdown
                label="Panel Status"
                name="is_panel"
                [(ngModel)]="panelStatusValue"
                [options]="panelStatusOptions"
                placeholder="Not Specified"
                [clearable]="true"
              ></app-dropdown>
            </div>

            <!-- Panel Status Details -->
            <div>
              <app-text-input
                label="Panel Status Details"
                name="panel_status"
                [(ngModel)]="formData.panel_status"
                [maxLength]="50"
                placeholder="e.g., Active, Suspended"
              ></app-text-input>
            </div>

            <!-- Panel Effective Date -->
            <div>
              <app-date-picker
                label="Panel Effective Date"
                name="panel_effective_date"
                mode="date"
                [(ngModel)]="formData.panel_effective_date"
                placeholder="Select panel effective date"
                [minDate]="today"
              ></app-date-picker>
            </div>

            <!-- Bank -->
            <div>
              <app-dropdown
                label="Bank"
                name="bank_id"
                [(ngModel)]="formData.bank_id"
                [options]="bankOptions"
                placeholder="Select Bank"
                [clearable]="true"
              ></app-dropdown>
            </div>

            <!-- Bank Account Number -->
            <div>
              <app-text-input
                label="Bank Account Number"
                name="bank_acc_no"
                [(ngModel)]="formData.bank_acc_no"
                [maxLength]="50"
                placeholder="Bank account number"
              ></app-text-input>
            </div>

            <!-- Accreditation Status -->
            <div>
              <app-dropdown
                label="Accreditation Status"
                name="accreditation_status"
                [(ngModel)]="formData.accreditation_status"
                [options]="(accreditationStatusOptions$ | async) || []"
                placeholder="Not Specified"
                [clearable]="true"
              ></app-dropdown>
            </div>

            <!-- Accreditation Expiry -->
            <div>
              <app-date-picker
                label="Accreditation Expiry"
                name="accreditation_expiry"
                mode="date"
                [(ngModel)]="formData.accreditation_expiry"
                placeholder="Select accreditation expiry date"
                [minDate]="today"
              ></app-date-picker>
            </div>
          </div>

          <!-- Form Actions -->
          <div class="mt-6 flex gap-3 border-t pt-6">
            <app-button
              type="button"
              variant="secondary"
              [disabled]="saving"
              [fullWidth]="false"
              customClass="flex-1 md:flex-none md:px-6"
              (click)="goBack()"
            >
              Cancel
            </app-button>
            <app-button
              type="submit"
              variant="primary"
              [disabled]="hospitalForm.invalid || saving"
              [loading]="saving"
              [fullWidth]="false"
              customClass="flex-1 md:flex-none md:px-6"
            >
              {{ isEditMode ? 'Update Hospital' : 'Create Hospital' }}
            </app-button>
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

  // Date restrictions
  today = new Date();

  // Dynamic lookups from database
  hospitalTypes$: Observable<LookupItem[]>;
  accreditationStatuses$: Observable<LookupItem[]>;

  // Dropdown options for custom components
  hospitalTypeOptions$: Observable<DropdownOption[]>;
  accreditationStatusOptions$: Observable<DropdownOption[]>;
  bankOptions: DropdownOption[] = [];
  panelStatusOptions: DropdownOption[] = [
    { value: 1, label: 'Panel' },
    { value: 0, label: 'Non-Panel' }
  ];

  // Converted panel status for dropdown (boolean -> number)
  get panelStatusValue(): number | null {
    if (this.formData.is_panel === true) return 1;
    if (this.formData.is_panel === false) return 0;
    return null;
  }
  set panelStatusValue(value: number | string | null) {
    if (value === 1 || value === '1') this.formData.is_panel = true;
    else if (value === 0 || value === '0') this.formData.is_panel = false;
    else this.formData.is_panel = null;
  }

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

    // Map lookups to dropdown options
    this.hospitalTypeOptions$ = this.hospitalTypes$.pipe(
      map(items => items.map(item => ({
        value: item.lookup_code,
        label: item.lookup_value
      })))
    );

    this.accreditationStatusOptions$ = this.accreditationStatuses$.pipe(
      map(items => items.map(item => ({
        value: item.lookup_code,
        label: item.lookup_value
      })))
    );
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
          // Map banks to dropdown options
          this.bankOptions = result.banks.map(bank => ({
            value: bank.bank_id,
            label: bank.bank_name
          }));
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
    this.router.navigate([APP_ROUTES.HOSPITALS.LIST]);
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



