import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil, Observable } from 'rxjs';

import { MemberService } from '../../../core/services/member.service';
import { ProductService } from '../../../core/services/product.service';
import { BankService } from '../../../core/services/bank.service';
import { LoggerService } from '../../../core/services/logger.service';
import { ToastService } from '../../../core/services/toast.service';
import { LookupService, LookupItem } from '../../../shared/services/lookup.service';
import { ProductListItem } from '../../../shared/models/product.model';
import { Bank } from '../../../shared/models/bank.model';

import { 
  Member, 
  MemberAddress, 
  MemberContact, 
  MemberPolicy, 
  MemberDependent, 
  MemberPEC,
  CreateMemberAddressDto,
  UpdateMemberAddressDto,
  CreateMemberContactDto,
  UpdateMemberContactDto,
  CreateMemberPolicyDto,
  UpdateMemberPolicyDto,
  CreateMemberDependentDto,
  UpdateMemberDependentDto,
  CreateMemberPECDto,
  UpdateMemberPECDto
} from '../../../shared/models/member.model';

import { HasPermissionDirective } from '../../../shared/directives/permissions/has-permission.directive';
import { PERMISSIONS } from '../../../core/constants/permissions.constants';
import { LoadingSpinnerComponent } from '../../../shared/components/ui/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-member-view',
  standalone: true,
  imports: [CommonModule, FormsModule, HasPermissionDirective, LoadingSpinnerComponent],
  templateUrl: './member-view.component.html',
  styles: []
})
export class MemberViewComponent implements OnInit, OnDestroy {
  member: Member | null = null;
  loading = false;
  activeTab: 'details' | 'addresses' | 'contacts' | 'policies' | 'dependents' = 'details';

  // Permission constants (exposed to template)
  readonly PERMISSIONS = PERMISSIONS.POLICY_HOLDERS;

  // Addresses
  addresses: MemberAddress[] = [];
  loadingAddresses = false;
  showAddressForm = false;
  editingAddress: MemberAddress | null = null;
  addressFormData: Partial<CreateMemberAddressDto> = {};

  // Contacts
  contacts: MemberContact[] = [];
  loadingContacts = false;
  showContactForm = false;
  editingContact: MemberContact | null = null;
  contactFormData: Partial<CreateMemberContactDto> = {};

  // Policies
  policies: MemberPolicy[] = [];
  loadingPolicies = false;
  showPolicyForm = false;
  editingPolicy: MemberPolicy | null = null;
  policyFormData: Partial<CreateMemberPolicyDto> = {};

  // Dependents
  dependents: MemberDependent[] = [];
  loadingDependents = false;
  showDependentForm = false;
  editingDependent: MemberDependent | null = null;
  dependentFormData: Partial<CreateMemberDependentDto> = {};

  // PEC Conditions (nested under selected dependent)
  selectedDependentForPEC: MemberDependent | null = null;
  pecConditions: MemberPEC[] = [];
  loadingPEC = false;
  showPECForm = false;
  editingPEC: MemberPEC | null = null;
  pecFormData: Partial<CreateMemberPECDto> = {};

  tabs: Array<{ id: 'details' | 'addresses' | 'contacts' | 'policies' | 'dependents', label: string }> = [
    { id: 'details', label: 'Member Details' },
    { id: 'addresses', label: 'Addresses' },
    { id: 'contacts', label: 'Contacts' },
    { id: 'policies', label: 'Policies' },
    { id: 'dependents', label: 'Dependents & PEC' }
  ];

  // Dynamic lookups from database
  addressTypes$: Observable<LookupItem[]>;
  contactTypes$: Observable<LookupItem[]>;
  memberStatuses$: Observable<LookupItem[]>;
  policyStatuses$: Observable<LookupItem[]>;
  relationships$: Observable<LookupItem[]>;
  products: ProductListItem[] = [];
  banks: Bank[] = [];

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private memberService: MemberService,
    private productService: ProductService,
    private bankService: BankService,
    private logger: LoggerService,
    private toast: ToastService,
    private lookupService: LookupService
  ) {
    // Initialize dynamic lookups
    this.addressTypes$ = this.lookupService.getAddressTypes();
    this.contactTypes$ = this.lookupService.getContactTypes();
    this.memberStatuses$ = this.lookupService.getMemberStatuses();
    this.policyStatuses$ = this.lookupService.getPolicyStatuses();
    this.relationships$ = this.lookupService.getRelationships();
    
    // Load products for dropdown
    this.productService.getProducts({ is_active: true, limit: 1000 }).pipe(takeUntil(this.destroy$)).subscribe({
      next: (result) => {
        this.products = result.products || [];
      },
      error: (err) => {
        console.error('Error loading products:', err);
      }
    });
    
    // Load banks for display
    this.bankService.getBanks({ is_active: true, limit: 1000 }).pipe(takeUntil(this.destroy$)).subscribe({
      next: (result) => {
        this.banks = result.banks || [];
      },
      error: (err) => {
        console.error('Error loading banks:', err);
      }
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadMember(id);
    } else {
      this.toast.error('Invalid member ID');
      this.goBack();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load member data
   */
  loadMember(id: string): void {
    this.loading = true;
    this.memberService.getMemberById(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (member) => {
          this.member = member;
          this.loading = false;
          this.logger.info('Member loaded successfully');
        },
        error: (error) => {
          this.logger.error('Error loading member:', error);
          this.toast.error('Failed to load member');
          this.loading = false;
          this.goBack();
        }
      });
  }

  /**
   * Navigate back to list
   */
  goBack(): void {
    this.router.navigate(['/members']);
  }

  /**
   * Navigate to edit page
   */
  editMember(): void {
    if (this.member) {
      this.router.navigate(['/members', this.member.member_id, 'edit']);
    }
  }

  /**
   * Handle tab change
   */
  onTabChange(tabId: 'details' | 'addresses' | 'contacts' | 'policies' | 'dependents'): void {
    this.activeTab = tabId;
    
    // Lazy load tab data
    if (tabId === 'addresses' && this.addresses.length === 0) {
      this.loadAddresses();
    } else if (tabId === 'contacts' && this.contacts.length === 0) {
      this.loadContacts();
    } else if (tabId === 'policies' && this.policies.length === 0) {
      this.loadPolicies();
    } else if (tabId === 'dependents' && this.dependents.length === 0) {
      this.loadDependents();
    }
  }

  // ============================================================================
  // ADDRESS MANAGEMENT
  // ============================================================================

  loadAddresses(): void {
    if (!this.member) return;

    this.loadingAddresses = true;
    this.memberService.getAddressesByMemberId(this.member.member_id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (addresses: MemberAddress[]) => {
          this.addresses = addresses;
          this.loadingAddresses = false;
        },
        error: (error: any) => {
          this.logger.error('Error loading addresses:', error);
          this.toast.error('Failed to load addresses');
          this.loadingAddresses = false;
        }
      });
  }

  showAddressFormDialog(address?: MemberAddress): void {
    if (address) {
      this.editingAddress = address;
      this.addressFormData = {
        member_id: address.member_id,
        address_type: address.address_type || undefined,
        street_line1: address.street_line1 || undefined,
        street_line2: address.street_line2 || undefined,
        city: address.city || undefined,
        state: address.state || undefined,
        postal_code: address.postal_code || undefined,
        country: address.country || undefined,
        is_primary: address.is_primary
      };
    } else {
      this.editingAddress = null;
      this.resetAddressForm();
    }
    this.showAddressForm = true;
  }

  saveAddress(form: any): void {
    if (!this.member || form.invalid) return;

    if (this.editingAddress) {
      // Update existing address
      this.memberService.updateAddress(this.editingAddress.address_id, this.addressFormData as UpdateMemberAddressDto)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.toast.success('Address updated successfully');
            this.cancelAddressForm();
            this.loadAddresses();
          },
          error: (error: any) => {
            this.logger.error('Error updating address:', error);
            this.toast.error('Failed to update address');
          }
        });
    } else {
      // Create new address
      const dto: CreateMemberAddressDto = {
        ...this.addressFormData,
        member_id: this.member.member_id
      } as CreateMemberAddressDto;
      this.memberService.createAddress(dto)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.toast.success('Address created successfully');
            this.cancelAddressForm();
            this.loadAddresses();
          },
          error: (error: any) => {
            this.logger.error('Error creating address:', error);
            this.toast.error('Failed to create address');
          }
        });
    }
  }

  setPrimaryAddress(address: MemberAddress): void {
    if (!this.member || address.is_primary) return;

    if (!confirm('Set this address as primary?')) return;

    this.memberService.setPrimaryAddress(address.address_id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toast.success('Primary address updated');
          this.loadAddresses();
        },
        error: (error: any) => {
          this.logger.error('Error setting primary address:', error);
          this.toast.error('Failed to set primary address');
        }
      });
  }

  deleteAddress(address: MemberAddress): void {
    if (!this.member) return;
    if (!confirm(`Delete this address?`)) return;

    this.memberService.deleteAddress(address.address_id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toast.success('Address deleted successfully');
          this.loadAddresses();
        },
        error: (error: any) => {
          this.logger.error('Error deleting address:', error);
          this.toast.error('Failed to delete address');
        }
      });
  }

  cancelAddressForm(): void {
    this.showAddressForm = false;
    this.editingAddress = null;
    this.resetAddressForm();
  }

  resetAddressForm(): void {
    this.addressFormData = {
      member_id: this.member?.member_id || '',
      address_type: '',
      street_line1: '',
      street_line2: '',
      city: '',
      state: '',
      postal_code: '',
      country: '',
      is_primary: false
    };
  }

  // ============================================================================
  // CONTACT MANAGEMENT
  // ============================================================================

  loadContacts(): void {
    if (!this.member) return;

    this.loadingContacts = true;
    this.memberService.getContactsByMemberId(this.member.member_id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (contacts: MemberContact[]) => {
          this.contacts = contacts;
          this.loadingContacts = false;
        },
        error: (error: any) => {
          this.logger.error('Error loading contacts:', error);
          this.toast.error('Failed to load contacts');
          this.loadingContacts = false;
        }
      });
  }

  showContactFormDialog(contact?: MemberContact): void {
    if (contact) {
      this.editingContact = contact;
      this.contactFormData = {
        member_id: contact.member_id,
        contact_type: contact.contact_type,
        contact_value: contact.contact_value || undefined,
        is_primary: contact.is_primary
      };
    } else {
      this.editingContact = null;
      this.resetContactForm();
    }
    this.showContactForm = true;
  }

  saveContact(form: any): void {
    if (!this.member || form.invalid) return;

    if (this.editingContact) {
      // Update existing contact
      this.memberService.updateContact(this.editingContact.contact_id, this.contactFormData as UpdateMemberContactDto)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.toast.success('Contact updated successfully');
            this.cancelContactForm();
            this.loadContacts();
          },
          error: (error: any) => {
            this.logger.error('Error updating contact:', error);
            this.toast.error('Failed to update contact');
          }
        });
    } else {
      // Create new contact
      const dto: CreateMemberContactDto = {
        ...this.contactFormData,
        member_id: this.member.member_id
      } as CreateMemberContactDto;
      this.memberService.createContact(dto)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.toast.success('Contact created successfully');
            this.cancelContactForm();
            this.loadContacts();
          },
          error: (error: any) => {
            this.logger.error('Error creating contact:', error);
            this.toast.error('Failed to create contact');
          }
        });
    }
  }

  setPrimaryContact(contact: MemberContact): void {
    if (!this.member || contact.is_primary) return;

    if (!confirm('Set this contact as primary for its type?')) return;

    this.memberService.setPrimaryContact(contact.contact_id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toast.success('Primary contact updated');
          this.loadContacts();
        },
        error: (error: any) => {
          this.logger.error('Error setting primary contact:', error);
          this.toast.error('Failed to set primary contact');
        }
      });
  }

  deleteContact(contact: MemberContact): void {
    if (!this.member) return;
    if (!confirm(`Delete this contact?`)) return;

    this.memberService.deleteContact(contact.contact_id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toast.success('Contact deleted successfully');
          this.loadContacts();
        },
        error: (error: any) => {
          this.logger.error('Error deleting contact:', error);
          this.toast.error('Failed to delete contact');
        }
      });
  }

  cancelContactForm(): void {
    this.showContactForm = false;
    this.editingContact = null;
    this.resetContactForm();
  }

  resetContactForm(): void {
    this.contactFormData = {
      member_id: this.member?.member_id || '',
      contact_type: '',
      contact_value: '',
      is_primary: false
    };
  }

  // ============================================================================
  // POLICY MANAGEMENT
  // ============================================================================

  loadPolicies(): void {
    if (!this.member) return;

    this.loadingPolicies = true;
    this.memberService.getPoliciesByMemberId(this.member.member_id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (policies: MemberPolicy[]) => {
          this.policies = policies;
          this.loadingPolicies = false;
        },
        error: (error: any) => {
          this.logger.error('Error loading policies:', error);
          this.toast.error('Failed to load policies');
          this.loadingPolicies = false;
        }
      });
  }

  savingPolicy = false;

  showPolicyFormDialog(policy?: MemberPolicy): void {
    if (policy) {
      this.editingPolicy = policy;
      this.policyFormData = {
        member_id: policy.member_id,
        product_id: policy.product_id,
        policy_no: policy.policy_no || undefined,
        effective_date: this.formatDate(policy.effective_date),
        expiry_date: this.formatDate(policy.expiry_date),
        status: policy.status || ''
      };
    } else {
      this.editingPolicy = null;
      this.resetPolicyForm();
    }
    this.showPolicyForm = true;
  }

  savePolicy(form: any): void {
    if (!this.member || form.invalid || this.savingPolicy) return;
    
    this.savingPolicy = true;

    if (this.editingPolicy) {
      // Update existing policy
      this.memberService.updatePolicy(this.editingPolicy.policy_id, this.policyFormData as UpdateMemberPolicyDto)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.toast.success('Policy updated successfully');
            this.savingPolicy = false;
            this.cancelPolicyForm();
            this.loadPolicies();
          },
          error: (error: any) => {
            this.logger.error('Error updating policy:', error);
            this.toast.error('Failed to update policy');
            this.savingPolicy = false;
          }
        });
    } else {
      // Create new policy
      const dto: CreateMemberPolicyDto = {
        ...this.policyFormData,
        member_id: this.member.member_id
      } as CreateMemberPolicyDto;
      this.memberService.createPolicy(dto)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.toast.success('Policy created successfully');
            this.savingPolicy = false;
            this.cancelPolicyForm();
            this.loadPolicies();
          },
          error: (error: any) => {
            this.logger.error('Error creating policy:', error);
            this.toast.error('Failed to create policy');
            this.savingPolicy = false;
          }
        });
    }
  }

  deletePolicy(policy: MemberPolicy): void {
    if (!this.member) return;
    if (!confirm(`Delete this policy?`)) return;

    this.memberService.deletePolicy(policy.policy_id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toast.success('Policy deleted successfully');
          this.loadPolicies();
        },
        error: (error: any) => {
          this.logger.error('Error deleting policy:', error);
          this.toast.error('Failed to delete policy');
        }
      });
  }

  cancelPolicyForm(): void {
    this.showPolicyForm = false;
    this.editingPolicy = null;
    this.resetPolicyForm();
  }

  resetPolicyForm(): void {
    this.policyFormData = {
      member_id: this.member?.member_id || '',
      policy_no: '',
      product_id: '',
      effective_date: undefined,
      expiry_date: undefined,
      status: ''
    };
  }

  getProductName(productId: string): string {
    const product = this.products.find(p => p.product_id === productId);
    return product?.plan_name || product?.plan_code || productId;
  }

  getBankName(bankId: number): string {
    const bank = this.banks.find(b => b.bank_id === bankId);
    return bank?.bank_name || `Bank ID: ${bankId}`;
  }

  // ============================================================================
  // DEPENDENT MANAGEMENT
  // ============================================================================

  loadDependents(): void {
    if (!this.member) return;

    this.loadingDependents = true;
    this.memberService.getDependentsByMemberId(this.member.member_id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (dependents: MemberDependent[]) => {
          this.dependents = dependents;
          this.loadingDependents = false;
        },
        error: (error: any) => {
          this.logger.error('Error loading dependents:', error);
          this.toast.error('Failed to load dependents');
          this.loadingDependents = false;
        }
      });
  }

  showDependentFormDialog(dependent?: MemberDependent): void {
    if (dependent) {
      this.editingDependent = dependent;
      this.dependentFormData = {
        principal_member_id: dependent.principal_member_id,
        full_name: dependent.full_name,
        ic_no: dependent.ic_no || undefined,
        relationship_id: dependent.relationship_id || undefined,
        dob: this.formatDate(dependent.dob),
        is_active: dependent.is_active
      };
    } else {
      this.editingDependent = null;
      this.resetDependentForm();
    }
    this.showDependentForm = true;
  }

  saveDependent(form: any): void {
    if (!this.member || form.invalid) return;

    // Clean up the form data - convert null to undefined for optional fields
    const cleanedFormData = { ...this.dependentFormData };
    if (cleanedFormData.relationship_id === null) {
      delete cleanedFormData.relationship_id;
    }

    if (this.editingDependent) {
      // Update existing dependent
      this.memberService.updateDependent(this.editingDependent.dependent_id, cleanedFormData as UpdateMemberDependentDto)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.toast.success('Dependent updated successfully');
            this.cancelDependentForm();
            this.loadDependents();
          },
          error: (error: any) => {
            this.logger.error('Error updating dependent:', error);
            this.toast.error('Failed to update dependent');
          }
        });
    } else {
      // Create new dependent
      const dto: CreateMemberDependentDto = {
        ...cleanedFormData,
        principal_member_id: this.member.member_id
      } as CreateMemberDependentDto;
      this.memberService.createDependent(dto)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.toast.success('Dependent created successfully');
            this.cancelDependentForm();
            this.loadDependents();
          },
          error: (error: any) => {
            this.logger.error('Error creating dependent:', error);
            this.toast.error('Failed to create dependent');
          }
        });
    }
  }

  toggleDependentActive(dependent: MemberDependent): void {
    if (!this.member) return;

    const action = dependent.is_active ? 'deactivate' : 'activate';
    if (!confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} this dependent?`)) return;

    this.memberService.toggleDependentActive(dependent.dependent_id, !dependent.is_active)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toast.success(`Dependent ${action}d successfully`);
          this.loadDependents();
        },
        error: (error: any) => {
          this.logger.error(`Error ${action}ing dependent:`, error);
          this.toast.error(`Failed to ${action} dependent`);
        }
      });
  }

  deleteDependent(dependent: MemberDependent): void {
    if (!this.member) return;
    if (!confirm(`Delete this dependent? This will also delete all associated PEC conditions.`)) return;

    this.memberService.deleteDependent(dependent.dependent_id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toast.success('Dependent deleted successfully');
          // If we were viewing this dependent's PEC, clear it
          if (this.selectedDependentForPEC?.dependent_id === dependent.dependent_id) {
            this.selectedDependentForPEC = null;
            this.pecConditions = [];
          }
          this.loadDependents();
        },
        error: (error: any) => {
          this.logger.error('Error deleting dependent:', error);
          this.toast.error('Failed to delete dependent');
        }
      });
  }

  cancelDependentForm(): void {
    this.showDependentForm = false;
    this.editingDependent = null;
    this.resetDependentForm();
  }

  resetDependentForm(): void {
    this.dependentFormData = {
      principal_member_id: this.member?.member_id || '',
      full_name: '',
      ic_no: '',
      relationship_id: null,
      dob: undefined,
      is_active: true
    };
  }

  // ============================================================================
  // PEC CONDITION MANAGEMENT (nested under dependents)
  // ============================================================================

  viewDependentPEC(dependent: MemberDependent): void {
    this.selectedDependentForPEC = dependent;
    this.loadPECConditions();
  }

  closePECView(): void {
    this.selectedDependentForPEC = null;
    this.pecConditions = [];
  }

  loadPECConditions(): void {
    if (!this.selectedDependentForPEC) return;

    this.loadingPEC = true;
    this.memberService.getPECsByDependentId(this.selectedDependentForPEC.dependent_id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (pecs: MemberPEC[]) => {
          this.pecConditions = pecs;
          this.loadingPEC = false;
        },
        error: (error: any) => {
          this.logger.error('Error loading PEC conditions:', error);
          this.toast.error('Failed to load PEC conditions');
          this.loadingPEC = false;
        }
      });
  }

  showPECFormDialog(pec?: MemberPEC): void {
    if (!this.selectedDependentForPEC) return;

    if (pec) {
      this.editingPEC = pec;
      this.pecFormData = {
        dependent_id: pec.dependent_id,
        condition_code: pec.condition_code || '',
        condition_name: pec.condition_name || undefined,
        diagnosis_date: this.formatDate(pec.diagnosis_date),
        is_excluded: pec.is_excluded,
        notes: pec.notes || undefined
      };
    } else {
      this.editingPEC = null;
      this.resetPECForm();
    }
    this.showPECForm = true;
  }

  savePEC(form: any): void {
    if (!this.member || !this.selectedDependentForPEC || form.invalid) return;

    if (this.editingPEC) {
      // Update existing PEC
      this.memberService.updatePEC(this.editingPEC.pec_id, this.pecFormData as UpdateMemberPECDto)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.toast.success('PEC condition updated successfully');
            this.cancelPECForm();
            this.loadPECConditions();
          },
          error: (error: any) => {
            this.logger.error('Error updating PEC:', error);
            this.toast.error('Failed to update PEC condition');
          }
        });
    } else {
      // Create new PEC
      const dto: CreateMemberPECDto = {
        ...this.pecFormData,
        dependent_id: this.selectedDependentForPEC.dependent_id
      } as CreateMemberPECDto;
      this.memberService.createPEC(dto)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.toast.success('PEC condition created successfully');
            this.cancelPECForm();
            this.loadPECConditions();
          },
          error: (error: any) => {
            this.logger.error('Error creating PEC:', error);
            this.toast.error('Failed to create PEC condition');
          }
        });
    }
  }

  togglePECExcluded(pec: MemberPEC): void {
    if (!this.member || !this.selectedDependentForPEC) return;

    const action = pec.is_excluded ? 'include' : 'exclude';
    if (!confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} this PEC condition?`)) return;

    this.memberService.togglePECExcluded(pec.pec_id, !pec.is_excluded)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toast.success(`PEC condition ${action}d successfully`);
          this.loadPECConditions();
        },
        error: (error: any) => {
          this.logger.error(`Error ${action}ing PEC:`, error);
          this.toast.error(`Failed to ${action} PEC condition`);
        }
      });
  }

  deletePEC(pec: MemberPEC): void {
    if (!this.member || !this.selectedDependentForPEC) return;
    if (!confirm('Delete this PEC condition?')) return;

    this.memberService.deletePEC(pec.pec_id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toast.success('PEC condition deleted successfully');
          this.loadPECConditions();
        },
        error: (error: any) => {
          this.logger.error('Error deleting PEC:', error);
          this.toast.error('Failed to delete PEC condition');
        }
      });
  }

  cancelPECForm(): void {
    this.showPECForm = false;
    this.editingPEC = null;
    this.resetPECForm();
  }

  resetPECForm(): void {
    this.pecFormData = {
      dependent_id: this.selectedDependentForPEC?.dependent_id || '',
      condition_code: '',
      condition_name: '',
      diagnosis_date: undefined,
      is_excluded: false,
      notes: ''
    };
  }

  /**
   * Helper to format date for HTML date input (YYYY-MM-DD)
   */
  private formatDate(date: Date | string | null | undefined): string | undefined {
    if (!date) return undefined;
    const d = new Date(date);
    if (isNaN(d.getTime())) return undefined;
    return d.toISOString().split('T')[0];
  }
}
