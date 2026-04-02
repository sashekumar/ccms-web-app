import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

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
import { APP_ROUTES } from '../../../core/constants/routes.constants';
import { LoadingSpinnerComponent } from '../../../shared/components/ui/loading-spinner/loading-spinner.component';
import { ButtonComponent } from '../../../shared/components/ui/button/button.component';
import { ToggleComponent } from '../../../shared/components/ui/toggle/toggle.component';
import { ConfirmDialogComponent } from '../../../shared/components/ui/confirm-dialog/confirm-dialog.component';
import { StatusBadgeComponent } from '../../../shared/components/ui/status-badge/status-badge.component';
import { TextInputComponent } from '../../../shared/components/ui/text-input/text-input.component';
import { DropdownComponent } from '../../../shared/components/ui/dropdown/dropdown.component';
import { DatePickerComponent } from '../../../shared/components/ui/date-picker/date-picker.component';
import { CheckboxComponent } from '../../../shared/components/ui/checkbox/checkbox.component';

@Component({
  selector: 'app-member-view',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HasPermissionDirective,
    LoadingSpinnerComponent,
    ButtonComponent,
    ToggleComponent,
    ConfirmDialogComponent,
    StatusBadgeComponent,
    TextInputComponent,
    DropdownComponent,
    DatePickerComponent,
    CheckboxComponent
  ],
  templateUrl: './member-view.component.html',
  styles: []
})
export class MemberViewComponent implements OnInit, OnDestroy {
  member: Member | null = null;
  loading = false;
  activeTab: 'details' | 'addresses' | 'contacts' | 'policies' | 'dependents' = 'details';

  // Permission constants (exposed to template)
  readonly PERMISSIONS = PERMISSIONS.POLICY_HOLDERS;

  // Confirmation dialogs
  showAddressPrimaryConfirm = false;
  addressToToggle: MemberAddress | null = null;

  showAddressDeleteConfirm = false;
  addressToDelete: MemberAddress | null = null;

  showContactPrimaryConfirm = false;
  contactToToggle: MemberContact | null = null;

  showContactDeleteConfirm = false;
  contactToDelete: MemberContact | null = null;

  showDependentActiveConfirm = false;
  dependentToToggle: MemberDependent | null = null;

  showDependentDeleteConfirm = false;
  dependentToDelete: MemberDependent | null = null;

  showPolicyDeleteConfirm = false;
  policyToDelete: MemberPolicy | null = null;

  showPECToggleConfirm = false;
  pecToToggle: MemberPEC | null = null;

  showPECDeleteConfirm = false;
  pecToDelete: MemberPEC | null = null;

  // Status Change Dialog State
  showStatusChangeDialog = false;
  newMemberStatus: string = '';

  // Policy Status Change Dialog State
  showPolicyStatusChangeDialog = false;
  policyToChangeStatus: MemberPolicy | null = null;
  newPolicyStatus: string = '';

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
  contactValueError: string = '';

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
    this.router.navigate([APP_ROUTES.MEMBERS.LIST]);
  }

  /**
   * Navigate to edit page
   */
  editMember(): void {
    if (this.member) {
      this.router.navigate([APP_ROUTES.MEMBERS.EDIT(this.member.member_id)]);
    }
  }

  /**
   * Open status change dialog when clicking status badge
   */
  openStatusChangeDialog(): void {
    if (!this.member || this.member.is_deleted) return;
    this.newMemberStatus = this.member.member_status || 'ACTIVE';
    this.showStatusChangeDialog = true;
  }

  /**
   * Change member status
   */
  changeMemberStatus(newStatus: string): void {
    if (!this.member) return;

    const memberId = this.member.member_id;
    
    this.memberService.updateMember(memberId, { member_status: newStatus })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toast.success(`Member status updated to ${newStatus}`);
          this.showStatusChangeDialog = false;
          this.loadMember(memberId); // Reload member to get updated status
        },
        error: (error: any) => {
          this.logger.error('Error updating member status:', error);
          this.toast.error('Failed to update member status');
          this.showStatusChangeDialog = false;
        }
      });
  }

  /**
   * Cancel status change
   */
  cancelStatusChange(): void {
    this.showStatusChangeDialog = false;
    this.newMemberStatus = '';
  }

  /**
   * Open policy status change dialog when clicking policy status badge
   */
  openPolicyStatusChangeDialog(policy: MemberPolicy): void {
    if (!policy || policy.is_deleted) return;
    this.policyToChangeStatus = policy;
    this.newPolicyStatus = policy.status || 'ACTIVE';
    this.showPolicyStatusChangeDialog = true;
  }

  /**
   * Change policy status
   */
  changePolicyStatus(newStatus: string): void {
    if (!this.policyToChangeStatus) return;

    const policyId = this.policyToChangeStatus.policy_id;
    
    this.memberService.updatePolicy(policyId, { status: newStatus })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toast.success(`Policy status updated to ${newStatus}`);
          this.showPolicyStatusChangeDialog = false;
          this.policyToChangeStatus = null;
          this.loadPolicies(); // Reload policies to get updated status
        },
        error: (error: any) => {
          this.logger.error('Error updating policy status:', error);
          this.toast.error('Failed to update policy status');
          this.showPolicyStatusChangeDialog = false;
          this.policyToChangeStatus = null;
        }
      });
  }

  /**
   * Cancel policy status change
   */
  cancelPolicyStatusChange(): void {
    this.showPolicyStatusChangeDialog = false;
    this.policyToChangeStatus = null;
    this.newPolicyStatus = '';
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

  /**
   * Handle address primary toggle
   */
  onToggleAddressPrimary(address: MemberAddress): void {
    if (address.is_primary) {
      // Cannot toggle off primary - user must set another as primary instead
      this.toast.info('To change primary address, set another address as primary');
      return;
    }
    this.addressToToggle = address;
    this.showAddressPrimaryConfirm = true;
  }

  /**
   * Confirm address primary toggle
   */
  confirmAddressPrimaryToggle(): void {
    if (!this.member || !this.addressToToggle) return;

    this.memberService.setPrimaryAddress(this.addressToToggle.address_id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toast.success('Primary address updated');
          this.showAddressPrimaryConfirm = false;
          this.addressToToggle = null;
          this.loadAddresses();
        },
        error: (error: any) => {
          this.logger.error('Error setting primary address:', error);
          this.toast.error('Failed to set primary address');
          this.showAddressPrimaryConfirm = false;
          this.addressToToggle = null;
          this.loadAddresses();
        }
      });
  }

  /**
   * Cancel address primary toggle
   */
  cancelAddressPrimaryToggle(): void {
    this.showAddressPrimaryConfirm = false;
    this.addressToToggle = null;
    this.loadAddresses(); // Reload to reset toggle state
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

  /**
   * Show confirmation dialog for address deletion
   */
  deleteAddress(address: MemberAddress): void {
    this.addressToDelete = address;
    this.showAddressDeleteConfirm = true;
  }

  /**
   * Confirm and delete address
   */
  confirmAddressDelete(): void {
    if (!this.member || !this.addressToDelete) return;

    this.memberService.deleteAddress(this.addressToDelete.address_id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toast.success('Address deleted successfully');
          this.showAddressDeleteConfirm = false;
          this.addressToDelete = null;
          this.loadAddresses();
        },
        error: (error: any) => {
          this.logger.error('Error deleting address:', error);
          this.toast.error('Failed to delete address');
          this.showAddressDeleteConfirm = false;
          this.addressToDelete = null;
        }
      });
  }

  /**
   * Cancel address deletion
   */
  cancelAddressDelete(): void {
    this.showAddressDeleteConfirm = false;
    this.addressToDelete = null;
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

  /**
   * Validate contact value based on contact type
   */
  validateContactValue(): boolean {
    const { contact_type, contact_value } = this.contactFormData;
    
    if (!contact_value || !contact_type) {
      this.contactValueError = '';
      return true;
    }

    const value = contact_value.trim();
    
    switch (contact_type.toUpperCase()) {
      case 'EMAIL':
        const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailPattern.test(value)) {
          this.contactValueError = 'Please enter a valid email address';
          return false;
        }
        break;
      
      case 'PHONE':
      case 'MOBILE':
      case 'FAX':
      case 'WHATSAPP':
        // Allow digits, spaces, hyphens, parentheses, and plus sign
        const phonePattern = /^[0-9+\-\s()]+$/;
        if (!phonePattern.test(value)) {
          this.contactValueError = 'Please enter a valid phone number (digits, spaces, hyphens, parentheses, and + allowed)';
          return false;
        }
        // Check minimum length (at least 7 digits)
        const digitsOnly = value.replace(/[^0-9]/g, '');
        if (digitsOnly.length < 7) {
          this.contactValueError = 'Phone number must contain at least 7 digits';
          return false;
        }
        break;
      
      case 'OTHER':
      default:
        // No specific validation for other types
        break;
    }
    
    this.contactValueError = '';
    return true;
  }

  /**
   * Handle contact value change to validate in real-time
   */
  onContactValueChange(): void {
    this.validateContactValue();
  }

  saveContact(form: any): void {
    if (!this.member || form.invalid) return;

    // Validate contact value based on type
    if (!this.validateContactValue()) {
      this.toast.error(this.contactValueError);
      return;
    }

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

  /**
   * Handle contact primary toggle
   */
  onToggleContactPrimary(contact: MemberContact): void {
    if (contact.is_primary) {
      // Cannot toggle off primary - user must set another as primary instead
      this.toast.info('To change primary contact, set another contact as primary');
      return;
    }
    this.contactToToggle = contact;
    this.showContactPrimaryConfirm = true;
  }

  /**
   * Confirm contact primary toggle
   */
  confirmContactPrimaryToggle(): void {
    if (!this.member || !this.contactToToggle) return;

    this.memberService.setPrimaryContact(this.contactToToggle.contact_id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toast.success('Primary contact updated');
          this.showContactPrimaryConfirm = false;
          this.contactToToggle = null;
          this.loadContacts();
        },
        error: (error: any) => {
          this.logger.error('Error setting primary contact:', error);
          this.toast.error('Failed to set primary contact');
          this.showContactPrimaryConfirm = false;
          this.contactToToggle = null;
          this.loadContacts();
        }
      });
  }

  /**
   * Cancel contact primary toggle
   */
  cancelContactPrimaryToggle(): void {
    this.showContactPrimaryConfirm = false;
    this.contactToToggle = null;
    this.loadContacts(); // Reload to reset toggle state
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

  /**
   * Show confirmation dialog for contact deletion
   */
  deleteContact(contact: MemberContact): void {
    this.contactToDelete = contact;
    this.showContactDeleteConfirm = true;
  }

  /**
   * Confirm and delete contact
   */
  confirmContactDelete(): void {
    if (!this.member || !this.contactToDelete) return;

    this.memberService.deleteContact(this.contactToDelete.contact_id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toast.success('Contact deleted successfully');
          this.showContactDeleteConfirm = false;
          this.contactToDelete = null;
          this.loadContacts();
        },
        error: (error: any) => {
          this.logger.error('Error deleting contact:', error);
          this.toast.error('Failed to delete contact');
          this.showContactDeleteConfirm = false;
          this.contactToDelete = null;
        }
      });
  }

  /**
   * Cancel contact deletion
   */
  cancelContactDelete(): void {
    this.showContactDeleteConfirm = false;
    this.contactToDelete = null;
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
    this.contactValueError = '';
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

  /**
   * Show confirmation dialog for policy deletion
   */
  deletePolicy(policy: MemberPolicy): void {
    this.policyToDelete = policy;
    this.showPolicyDeleteConfirm = true;
  }

  /**
   * Confirm and delete policy
   */
  confirmPolicyDelete(): void {
    if (!this.member || !this.policyToDelete) return;

    this.memberService.deletePolicy(this.policyToDelete.policy_id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toast.success('Policy deleted successfully');
          this.showPolicyDeleteConfirm = false;
          this.policyToDelete = null;
          this.loadPolicies();
        },
        error: (error: any) => {
          this.logger.error('Error deleting policy:', error);
          this.toast.error('Failed to delete policy');
          this.showPolicyDeleteConfirm = false;
          this.policyToDelete = null;
        }
      });
  }

  /**
   * Cancel policy deletion
   */
  cancelPolicyDelete(): void {
    this.showPolicyDeleteConfirm = false;
    this.policyToDelete = null;
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

  /**
   * Helper methods to transform lookup observables into dropdown options
   * These avoid complex inline template expressions that cause TypeScript issues
   */
  get addressTypeOptions$(): Observable<{ value: string; label: string }[]> {
    return this.addressTypes$.pipe(
      map(items => items.map(t => ({ value: t.lookup_code, label: t.lookup_value })))
    );
  }

  get contactTypeOptions$(): Observable<{ value: string; label: string }[]> {
    return this.contactTypes$.pipe(
      map(items => items.map(t => ({ value: t.lookup_code, label: t.lookup_value })))
    );
  }

  get policyStatusOptions$(): Observable<{ value: string; label: string }[]> {
    return this.policyStatuses$.pipe(
      map(items => items.map(s => ({ value: s.lookup_code, label: s.lookup_value })))
    );
  }

  get relationshipOptions$(): Observable<{ value: string; label: string }[]> {
    return this.relationships$.pipe(
      map(items => items.map(r => ({ value: (r.lookup_id || 0).toString(), label: r.lookup_value })))
    );
  }

  get productOptions(): { value: string; label: string }[] {
    return this.products.map(p => ({ value: p.product_id, label: p.plan_name || p.plan_code }));
  }

  /**
   * Get today's date for maxDate validation in date pickers
   */
  get todayDate(): Date {
    return new Date();
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

  /**
   * Handle dependent active toggle
   */
  onToggleDependentActive(event: boolean, dependent: MemberDependent): void {
    this.dependentToToggle = { ...dependent, is_active: event }; // Store the new state
    this.showDependentActiveConfirm = true;
  }

  /**
   * Confirm dependent active toggle
   */
  confirmDependentActiveToggle(): void {
    if (!this.member || !this.dependentToToggle) return;

    const newActiveState = this.dependentToToggle.is_active ?? false;
    const action = newActiveState ? 'activate' : 'deactivate';

    this.memberService.toggleDependentActive(
      this.dependentToToggle.dependent_id,
      newActiveState
    )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toast.success(`Dependent ${action}d successfully`);
          this.showDependentActiveConfirm = false;
          this.dependentToToggle = null;
          this.loadDependents();
        },
        error: (error: any) => {
          this.logger.error(`Error ${action}ing dependent:`, error);
          this.toast.error(`Failed to ${action} dependent`);
          this.showDependentActiveConfirm = false;
          this.dependentToToggle = null;
          this.loadDependents();
        }
      });
  }

  /**
   * Cancel dependent active toggle
   */
  cancelDependentActiveToggle(): void {
    this.showDependentActiveConfirm = false;
    this.dependentToToggle = null;
    this.loadDependents(); // Reload to reset toggle state
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

  /**
   * Show confirmation dialog for dependent deletion
   */
  deleteDependent(dependent: MemberDependent): void {
    this.dependentToDelete = dependent;
    this.showDependentDeleteConfirm = true;
  }

  /**
   * Confirm and delete dependent
   */
  confirmDependentDelete(): void {
    if (!this.member || !this.dependentToDelete) return;

    this.memberService.deleteDependent(this.dependentToDelete.dependent_id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toast.success('Dependent deleted successfully');
          // If we were viewing this dependent's PEC, clear it
          if (this.selectedDependentForPEC?.dependent_id === this.dependentToDelete?.dependent_id) {
            this.selectedDependentForPEC = null;
            this.pecConditions = [];
          }
          this.showDependentDeleteConfirm = false;
          this.dependentToDelete = null;
          this.loadDependents();
        },
        error: (error: any) => {
          this.logger.error('Error deleting dependent:', error);
          this.toast.error('Failed to delete dependent');
          this.showDependentDeleteConfirm = false;
          this.dependentToDelete = null;
        }
      });
  }

  /**
   * Cancel dependent deletion
   */
  cancelDependentDelete(): void {
    this.showDependentDeleteConfirm = false;
    this.dependentToDelete = null;
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

  /**
   * Show confirmation dialog for PEC coverage toggle
   */
  togglePECExcluded(pec: MemberPEC): void {
    this.pecToToggle = pec;
    this.showPECToggleConfirm = true;
  }

  /**
   * Confirm and toggle PEC excluded status
   */
  confirmPECToggle(): void {
    if (!this.member || !this.selectedDependentForPEC || !this.pecToToggle) return;

    const action = this.pecToToggle.is_excluded ? 'include' : 'exclude';

    this.memberService.togglePECExcluded(this.pecToToggle.pec_id, !this.pecToToggle.is_excluded)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toast.success(`PEC condition ${action}d successfully`);
          this.showPECToggleConfirm = false;
          this.pecToToggle = null;
          this.loadPECConditions();
        },
        error: (error: any) => {
          this.logger.error(`Error ${action}ing PEC:`, error);
          this.toast.error(`Failed to ${action} PEC condition`);
          this.showPECToggleConfirm = false;
          this.pecToToggle = null;
        }
      });
  }

  /**
   * Cancel PEC toggle
   */
  cancelPECToggle(): void {
    this.showPECToggleConfirm = false;
    this.pecToToggle = null;
  }

  /**
   * Show confirmation dialog for PEC deletion
   */
  deletePEC(pec: MemberPEC): void {
    this.pecToDelete = pec;
    this.showPECDeleteConfirm = true;
  }

  /**
   * Confirm and delete PEC
   */
  confirmPECDelete(): void {
    if (!this.member || !this.selectedDependentForPEC || !this.pecToDelete) return;

    this.memberService.deletePEC(this.pecToDelete.pec_id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toast.success('PEC condition deleted successfully');
          this.showPECDeleteConfirm = false;
          this.pecToDelete = null;
          this.loadPECConditions();
        },
        error: (error: any) => {
          this.logger.error('Error deleting PEC:', error);
          this.toast.error('Failed to delete PEC condition');
          this.showPECDeleteConfirm = false;
          this.pecToDelete = null;
        }
      });
  }

  /**
   * Cancel PEC deletion
   */
  cancelPECDelete(): void {
    this.showPECDeleteConfirm = false;
    this.pecToDelete = null;
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


