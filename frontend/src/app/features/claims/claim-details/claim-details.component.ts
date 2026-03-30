import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, forkJoin } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { ClaimService } from '../../../core/services/claims/claim.service';
import { MemberService } from '../../../core/services/member.service';
import { HospitalService } from '../../../core/services/hospital.service';
import { ToastService } from '../../../core/services/toast.service';
import { LookupService, LookupItem } from '../../../shared/services/lookup.service';
import { Claim } from '../../../shared/models/claims/claim.model';
import { MemberListItem, MemberDependent } from '../../../shared/models/member.model';
import { HospitalListItem } from '../../../shared/models/hospital.model';
import { PERMISSIONS } from '../../../core/constants/permissions.constants';
import { APP_ROUTES } from '../../../core/constants/routes.constants';

@Component({
  selector: 'app-claim-details',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './claim-details.component.html'
})
export class ClaimDetailsComponent implements OnInit, OnDestroy {
  destroy$ = new Subject<void>();
  claimId: number = 0;
  claimData?: Claim;
  
  // Lookups & Data
  members: MemberListItem[] = [];
  hospitals: HospitalListItem[] = [];
  dependents: MemberDependent[] = [];
  benefitCategories: LookupItem[] = [];
  diagnosisCategories: LookupItem[] = [];
  documentTypes: LookupItem[] = [];
  
  // Tab State
  activeTab: string = 'info';
  tabs = [
    { id: 'info', label: 'Claim Information' },
    { id: 'expenses', label: 'Expenses' },
    { id: 'documents', label: 'Documents' }
  ];
  
  // Sub-resource tracking
  claimExpenses: any[] = [];
  claimDocuments: any[] = [];
  loadingExpenses = false;
  loadingDocuments = false;
  
  // Permissions
  PERMISSIONS = PERMISSIONS;

  // Decision Modal State
  showDecisionModal = false;
  decisionType: 'APPROVE' | 'REJECT' | '' = '';
  decisionData = {
    approvedAmount: 0,
    remarks: '',
    rejectionReason: '',
    rejectionType: 'TECHNICAL'
  };
  submittingDecision = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private claimService: ClaimService,
    private memberService: MemberService,
    private hospitalService: HospitalService,
    private lookupService: LookupService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.claimId = +params['id'];
      if (!this.claimId || isNaN(this.claimId)) {
        this.router.navigate([APP_ROUTES.CLAIMS.LIST]);
        return;
      }
      this.loadAllData();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadAllData(): void {
    // 1. Initial Load: Basic Claim, Member & Hospital Lookups
    forkJoin({
      claim: this.claimService.getClaimById(this.claimId),
      members: this.memberService.getMembers({ limit: 1000 } as any),
      hospitals: this.hospitalService.getHospitals({ limit: 500 } as any),
      benefits: this.lookupService.getLookupByCategory('BENEFIT_CATEGORY'),
      diagnosis: this.lookupService.getLookupByCategory('DIAGNOSIS_CATEGORY'),
      docs: this.lookupService.getLookupByCategory('CLAIM_DOCUMENT_TYPE')
    }).subscribe({
      next: (res: any) => {
        if (res.claim.success && res.claim.data) {
          this.claimData = res.claim.data;
          this.members = res.members.members || [];
          this.hospitals = (res.hospitals as any).data || (res.hospitals as any).hospitals || [];
          this.benefitCategories = res.benefits || [];
          this.diagnosisCategories = res.diagnosis || [];
          this.documentTypes = res.docs || [];
          
          // 2. Secondary Load: Dependents for the member
          if (this.claimData?.member_id) {
             this.loadDependents(this.claimData.member_id);
          }
          
          // 3. Sub-resources
          this.loadExpenses();
          this.loadDocuments();
        } else {
          this.toastService.error('Claim data not found');
          this.router.navigate([APP_ROUTES.CLAIMS.LIST]);
        }
      },
      error: () => this.toastService.error('Error loading data')
    });
  }

  private loadDependents(memberId: number): void {
     this.memberService.getDependentsByMemberId(String(memberId)).subscribe({
        next: deps => { this.dependents = deps || []; },
        error: () => { this.dependents = []; }
     });
  }

  loadExpenses(): void {
    this.loadingExpenses = true;
    this.claimService.getClaimExpenses(this.claimId).subscribe({
      next: res => { 
        this.claimExpenses = (res.success ? res.data : (Array.isArray(res) ? res : [])) || []; 
        this.loadingExpenses = false; 
      },
      error: () => { this.loadingExpenses = false; }
    });
  }

  loadDocuments(): void {
    this.loadingDocuments = true;
    this.claimService.getClaimDocuments(this.claimId).subscribe({
      next: res => { 
        this.claimDocuments = (res.success ? res.data : (Array.isArray(res) ? res : [])) || []; 
        this.loadingDocuments = false; 
      },
      error: () => { this.loadingDocuments = false; }
    });
  }

  switchTab(tabId: string): void {
    this.activeTab = tabId;
  }

  enterEditMode(): void {
    this.router.navigate([APP_ROUTES.CLAIMS.EDIT(this.claimId)]);
  }

  onDeleteClaim(): void {
    if (!this.claimData) return;
    
    if (confirm('Are you sure you want to delete this claim? This action cannot be undone.')) {
      this.claimService.deleteClaim(this.claimId).subscribe({
        next: (res) => {
          if (res.success) {
            this.toastService.success('Claim deleted successfully');
            this.router.navigate([APP_ROUTES.CLAIMS.LIST]);
          } else {
            this.toastService.error(res.message || 'Failed to delete claim');
          }
        },
        error: (err) => {
          this.toastService.error(err.error?.message || 'Error deleting claim');
        }
      });
    }
  }

  onApproveClaim(): void {
    if (!this.claimData) return;
    this.decisionType = 'APPROVE';
    this.decisionData = {
      approvedAmount: this.claimData.total_billed || 0,
      remarks: '',
      rejectionReason: '',
      rejectionType: 'TECHNICAL'
    };
    this.showDecisionModal = true;
  }

  onRejectClaim(): void {
    if (!this.claimData) return;
    this.decisionType = 'REJECT';
    this.decisionData = {
      approvedAmount: 0,
      remarks: '',
      rejectionReason: '',
      rejectionType: 'TECHNICAL'
    };
    this.showDecisionModal = true;
  }

  submitDecision(): void {
    if (!this.claimData || !this.decisionType) return;

    this.submittingDecision = true;

    if (this.decisionType === 'APPROVE') {
      if (this.decisionData.approvedAmount <= 0) {
        this.toastService.error('Approved amount must be greater than 0');
        this.submittingDecision = false;
        return;
      }
      this.claimService.approveClaimSubmission(this.claimId, {
        total_approved: this.decisionData.approvedAmount,
        remarks: this.decisionData.remarks || undefined
      }).subscribe({
        next: (res) => {
          this.submittingDecision = false;
          if (res.success) {
            this.toastService.success('Claim approved successfully');
            this.showDecisionModal = false;
            this.loadAllData();
          } else {
            this.toastService.error(res.message || 'Failed to approve claim');
          }
        },
        error: (err) => {
          this.submittingDecision = false;
          this.toastService.error(err.error?.message || 'Error approving claim');
        }
      });
    } else {
      if (!this.decisionData.rejectionReason.trim()) {
        this.toastService.error('Rejection reason is required');
        this.submittingDecision = false;
        return;
      }
      this.claimService.rejectClaimSubmission(this.claimId, {
        rejection_reason: this.decisionData.rejectionReason.trim(),
        rejection_type: this.decisionData.rejectionType || undefined,
        remarks: this.decisionData.remarks || undefined
      }).subscribe({
        next: (res) => {
          this.submittingDecision = false;
          if (res.success) {
            this.toastService.success('Claim rejected successfully');
            this.showDecisionModal = false;
            this.loadAllData();
          } else {
            this.toastService.error(res.message || 'Failed to reject claim');
          }
        },
        error: (err) => {
          this.submittingDecision = false;
          this.toastService.error(err.error?.message || 'Error rejecting claim');
        }
      });
    }
  }

  goBack(): void {
    this.router.navigate([APP_ROUTES.CLAIMS.LIST]);
  }

  // Helper formatting methods
  formatStatus(status: string | null | undefined): string {
    if (!status) return 'N/A';
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  getMemberName(): string {
    const member = this.members.find(m => String(m.member_id) === String(this.claimData?.member_id));
    return member ? `${member.full_name} (${member.ic_no || 'No IC'})` : 'N/A';
  }

  getPatientName(): string {
    const patient = this.dependents.find(d => String(d.dependent_id) === String(this.claimData?.patient_id));
    return patient ? `${patient.full_name} (${patient.ic_no || 'No IC'})` : 'N/A';
  }

  getHospitalName(): string {
    const hospital = this.hospitals.find(h => String(h.hospital_id) === String(this.claimData?.hospital_id));
    return hospital ? hospital.hospital_name : 'N/A';
  }

  getLookupValue(lookups: LookupItem[], code: string | null | undefined): string {
    if (!code) return 'N/A';
    const lookup = lookups.find(l => l.lookup_code === code);
    return lookup ? lookup.lookup_value : code;
  }

  formatFileSize(bytes: number): string {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }
}


