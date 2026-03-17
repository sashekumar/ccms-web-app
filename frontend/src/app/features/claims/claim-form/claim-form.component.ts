import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';

import { ClaimService } from '../../../core/services/claims/claim.service';
import { ToastService } from '../../../core/services/toast.service';
import { LookupService, LookupItem } from '../../../shared/services/lookup.service';
import { Claim, UpdateClaimDto } from '../../../shared/models/claims/claim.model';
import { PERMISSIONS } from '../../../core/constants/permissions.constants';

@Component({
  selector: 'app-claim-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  template: `
    <div class="min-h-screen bg-gray-50 p-6">
      <!-- Header -->
      <div class="mb-6 flex justify-between items-center">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">
            {{ isEditMode ? 'Reimbursement Registration (Edit Claim)' : 'View Claim' }}
          </h1>
          <p class="mt-2 text-sm text-gray-600" *ngIf="claimData?.claim_ref_no">
             #{{ claimData?.claim_ref_no }}
          </p>
        </div>
        <button 
          type="button"
          (click)="goBack()"
          class="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1e3c72]">
          Back to List
        </button>
      </div>

      <!-- Main Layout matching View 4 mockup -->
      <form [formGroup]="claimForm" (ngSubmit)="onSubmit()" *ngIf="claimData" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        <!-- LEFT COLUMN: Registration Details -->
        <div class="bg-white rounded-lg shadow-lg">
          <div class="bg-blue-50 px-6 py-4 border-b border-blue-100 rounded-t-lg">
            <h2 class="text-lg font-semibold text-blue-800 flex items-center">
              <i class="fas fa-user-md mr-2"></i> Registration Detail
            </h2>
          </div>
          
          <div class="p-6 space-y-6">
            <!-- Patient Info Section -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                  <label class="block text-sm font-medium text-gray-700">Patient Type</label>
                  <p class="mt-1 text-sm text-gray-900 border-b border-gray-200 pb-1">{{ claimData.patient_type || 'N/A' }}</p>
               </div>
               <div>
                  <label class="block text-sm font-medium text-gray-700">Patient Name</label>
                  <p class="mt-1 text-sm text-gray-900 border-b border-gray-200 pb-1">{{ claimData.member_name }}</p>
               </div>
               <div>
                  <label class="block text-sm font-medium text-gray-700">Patient IC / Passport</label>
                  <p class="mt-1 text-sm text-gray-900 border-b border-gray-200 pb-1">{{ claimData.member_ic_no || 'N/A' }}</p>
               </div>
               <div>
                  <label class="block text-sm font-medium text-gray-700">Mode</label>
                  <p class="mt-1 text-sm text-gray-900 border-b border-gray-200 pb-1">{{ claimData.claim_mode || 'REIMB' }}</p>
               </div>
            </div>
            
            <hr class="border-gray-200" />
            
            <!-- Document Details -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Doc. Received Date *</label>
                <input 
                   type="datetime-local" 
                   formControlName="document_received_at"
                   class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#1e3c72] focus:border-[#1e3c72] disabled:bg-gray-100 disabled:text-gray-500"
                />
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select 
                   formControlName="claim_status"
                   class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#1e3c72] focus:border-[#1e3c72] disabled:bg-gray-100 disabled:text-gray-500"
                >
                   <option *ngFor="let s of claimStatuses" [value]="s.lookup_value">{{ s.lookup_code }}</option>
                </select>
              </div>
            </div>

            <hr class="border-gray-200" />
            
            <!-- Payee Information -->
            <div class="space-y-4">
               <h3 class="text-md font-medium text-gray-800">Payee Information</h3>
               
               <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Payee Name</label>
                    <input 
                       type="text" 
                       formControlName="payee_name"
                       class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#1e3c72] focus:border-[#1e3c72] disabled:bg-gray-100"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Payee IC/Passport</label>
                    <input 
                       type="text" 
                       formControlName="payee_ic_no"
                       class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#1e3c72] focus:border-[#1e3c72] disabled:bg-gray-100"
                    />
                  </div>
               </div>
               
               <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                    <input 
                       type="text" 
                       formControlName="payee_bank_name"
                       class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#1e3c72] focus:border-[#1e3c72] disabled:bg-gray-100"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Account No</label>
                    <input 
                       type="text" 
                       formControlName="payee_bank_account_no"
                       class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#1e3c72] focus:border-[#1e3c72] disabled:bg-gray-100"
                    />
                  </div>
               </div>
            </div>
            
            <hr class="border-gray-200" />
            
            <!-- Financial Information -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Total Billed RM</label>
                <input 
                   type="number" 
                   step="0.01"
                   formControlName="total_billed"
                   class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#1e3c72] focus:border-[#1e3c72] disabled:bg-gray-100"
                />
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Total Approved RM</label>
                <input 
                   type="number" 
                   step="0.01"
                   formControlName="total_approved"
                   class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#1e3c72] focus:border-[#1e3c72] disabled:bg-gray-100"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- RIGHT COLUMN: Claim History / Extra Info -->
        <div class="space-y-6">
          <div class="bg-white rounded-lg shadow-lg">
             <div class="bg-gray-50 px-6 py-4 border-b border-gray-200 rounded-t-lg">
                <h2 class="text-lg font-semibold text-gray-800 flex items-center">
                  <i class="fas fa-history mr-2"></i> Claim Application Details
                </h2>
             </div>
             
             <div class="p-6">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                   <div>
                      <label class="block text-sm font-medium text-gray-700">Hospital</label>
                      <p class="mt-1 text-sm text-gray-900 border-b border-gray-200 pb-1">{{ claimData.hospital_name || 'N/A' }}</p>
                   </div>
                   <div>
                      <label class="block text-sm font-medium text-gray-700">Diagnosis ID</label>
                      <p class="mt-1 text-sm text-gray-900 border-b border-gray-200 pb-1">{{ claimData.diagnosis_id || 'N/A' }}</p>
                   </div>
                </div>

                <div class="mb-4" *ngIf="claimForm.get('claim_status')?.value === 'REJECTED'">
                   <label class="block text-sm font-medium text-red-700 mb-1">Rejection Reason *</label>
                   <textarea 
                     formControlName="rejection_reason"
                     rows="3"
                     class="w-full px-3 py-2 border border-red-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
                     placeholder="State the reason for claim rejection..."
                   ></textarea>
                </div>
                
                <div class="mt-6 flex justify-end space-x-3">
                   <button 
                     type="button" 
                     (click)="goBack()"
                     class="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1e3c72]">
                     Cancel
                   </button>
                   <button 
                     *ngIf="isEditMode"
                     type="submit" 
                     [disabled]="claimForm.invalid || saving"
                     class="inline-flex items-center px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#1e3c72] hover:bg-[#2a5298] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1e3c72] disabled:bg-gray-400 disabled:cursor-not-allowed">
                     <svg *ngIf="saving" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                       <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                       <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                     </svg>
                     {{ saving ? 'Saving...' : 'Save Registration' }}
                   </button>
                </div>
             </div>
          </div>
        </div>
      </form>
    </div>
  `
})
export class ClaimFormComponent implements OnInit {
  PERMISSIONS = PERMISSIONS;
  
  claimForm: FormGroup;
  claimData: Claim | null = null;
  claimId: number = 0;
  isEditMode: boolean = false;
  saving = false;
  
  claimStatuses: LookupItem[] = [];

  constructor(
    private fb: FormBuilder,
    private claimService: ClaimService,
    private lookupService: LookupService,
    private toastService: ToastService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.claimForm = this.fb.group({
      claim_status: ['PENDING', Validators.required],
      document_received_at: [''],
      payee_name: [''],
      payee_ic_no: [''],
      payee_bank_name: [''],
      payee_bank_account_no: [''],
      total_billed: [0, [Validators.required, Validators.min(0)]],
      total_approved: [0, [Validators.min(0)]],
      rejection_reason: ['']
    });
    
    // Auto-update validators based on status
    this.claimForm.get('claim_status')?.valueChanges.subscribe(status => {
      const reasonCtrl = this.claimForm.get('rejection_reason');
      const approvedCtrl = this.claimForm.get('total_approved');
      
      if (status === 'REJECTED') {
         reasonCtrl?.setValidators([Validators.required]);
      } else {
         reasonCtrl?.clearValidators();
      }
      
      reasonCtrl?.updateValueAndValidity();
    });
  }

  ngOnInit(): void {
    this.loadLookups();
    
    this.route.params.subscribe(params => {
       if (params['id']) {
          this.claimId = +params['id'];
          // Determine mode from route, e.g. /claims/123/edit vs /claims/123
          this.isEditMode = this.router.url.includes('/edit');
          this.loadClaim(this.claimId);
       }
    });
  }

  loadLookups(): void {
    this.lookupService.getLookupByCategory('CLAIM_STATUS')
      .subscribe((res: any) => {
        if (res.success && res.data) {
          this.claimStatuses = res.data;
        }
      });
  }

  loadClaim(id: number): void {
     this.claimService.getClaimById(id).subscribe({
        next: (res) => {
           if (res.success && res.data) {
              this.claimData = res.data;
              this.patchForm(res.data);
              
              if (!this.isEditMode) {
                 this.claimForm.disable();
              }
           }
        },
        error: () => this.toastService.error('Failed to load claim details')
     });
  }

  patchForm(data: Claim): void {
     let docDate = '';
     if (data.document_received_at) {
        // Convert ISO to datetime-local format YYYY-MM-DDThh:mm
        const d = new Date(data.document_received_at);
        docDate = d.toISOString().slice(0, 16);
     }
  
     this.claimForm.patchValue({
        claim_status: data.claim_status || 'PENDING',
        document_received_at: docDate,
        payee_name: data.payee_name || '',
        payee_ic_no: data.payee_ic_no || '',
        payee_bank_name: data.payee_bank_name || '',
        payee_bank_account_no: data.payee_bank_account_no || '',
        total_billed: data.total_billed || 0,
        total_approved: data.total_approved || 0,
        rejection_reason: data.rejection_reason || ''
     });
  }

  onSubmit(): void {
    if (this.claimForm.invalid || !this.isEditMode) return;
    
    this.saving = true;
    
    const formValue = this.claimForm.value;
    const dto: UpdateClaimDto = {
       claim_status: formValue.claim_status,
       total_billed: formValue.total_billed,
       total_approved: formValue.total_approved,
       payee_name: formValue.payee_name,
       payee_ic_no: formValue.payee_ic_no,
       payee_bank_name: formValue.payee_bank_name,
       payee_bank_account_no: formValue.payee_bank_account_no
    };
    
    if (formValue.document_received_at) {
       dto.document_received_at = new Date(formValue.document_received_at).toISOString();
    }
    
    if (formValue.claim_status === 'REJECTED') {
       dto.rejection_reason = formValue.rejection_reason;
    }

    this.claimService.updateClaim(this.claimId, dto).subscribe({
      next: (res) => {
        if (res.success) {
           this.toastService.success('Claim updated successfully');
           this.goBack();
        }
      },
      error: (err) => {
        this.toastService.error(err.error?.message || 'Failed to update claim');
        this.saving = false;
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/claims']);
  }
}
