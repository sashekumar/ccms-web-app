import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { HospitalService } from '../../../core/services/hospital.service';
import { LookupService, LookupItem } from '../../../shared/services/lookup.service';
import { Hospital, HospitalAddress, HospitalCode, HospitalStaff, HospitalStaffContact, FeeSchedule } from '../../../shared/models/hospital.model';
import { HasPermissionDirective } from '../../../shared/directives/permissions/has-permission.directive';
import { PERMISSIONS } from '../../../core/constants/permissions.constants';
import { APP_ROUTES } from '../../../core/constants/routes.constants';
import { LoggerService } from '../../../core/services/logger.service';
import { ToastService } from '../../../core/services/toast.service';
import { LoadingSpinnerComponent } from '../../../shared/components/ui/loading-spinner/loading-spinner.component';
import { ButtonComponent } from '../../../shared/components/ui/button/button.component';
import { DropdownComponent, DropdownOption } from '../../../shared/components/ui/dropdown/dropdown.component';
import { DatePickerComponent } from '../../../shared/components/ui/date-picker/date-picker.component';
import { TextInputComponent } from '../../../shared/components/ui/text-input/text-input.component';
import { ToggleComponent } from '../../../shared/components/ui/toggle/toggle.component';
import { ConfirmDialogComponent } from '../../../shared/components/ui/confirm-dialog/confirm-dialog.component';
import { StatusBadgeComponent } from '../../../shared/components/ui/status-badge/status-badge.component';
import { CheckboxComponent } from '../../../shared/components/ui/checkbox/checkbox.component';
import { BadgeComponent } from '../../../shared/components/ui/badge/badge.component';
import { TextAreaComponent } from '../../../shared/components/ui/text-area/text-area.component';
import { CurrencyMyrPipe } from '../../../shared/pipes/currency-myr.pipe';

@Component({
  selector: 'app-hospital-view',
  standalone: true,
  imports: [CommonModule, FormsModule, HasPermissionDirective, LoadingSpinnerComponent, ButtonComponent, DropdownComponent, DatePickerComponent, TextInputComponent, ToggleComponent, ConfirmDialogComponent, StatusBadgeComponent, CheckboxComponent, BadgeComponent, TextAreaComponent, CurrencyMyrPipe],
  templateUrl: './hospital-view.component.html',
  styles: []
})
export class HospitalViewComponent implements OnInit, OnDestroy {
  hospital: Hospital | null = null;
  loading = false;
  activeTab = 'overview';

  // Date restrictions
  today = new Date();

  // Panel toggle confirmation dialog
  showPanelToggleConfirm = false;
  pendingPanelStatus: boolean | null = null;

  // Address primary toggle confirmation dialog
  showAddressPrimaryConfirm = false;
  addressToToggle: HospitalAddress | null = null;

  // Address delete confirmation dialog
  showAddressDeleteConfirm = false;
  addressIdToDelete: string | null = null;

  // Permission constants (exposed to template)
  readonly PERMISSIONS = PERMISSIONS.HOSPITAL_MANAGEMENT;

  // Addresses
  addresses: HospitalAddress[] = [];
  loadingAddresses = false;
  showAddressForm = false;
  editingAddress: HospitalAddress | null = null;
  addressFormData: Partial<HospitalAddress> = {
    address_type: '',
    street_line1: '',
    street_line2: '',
    postal_code: '',
    city: '',
    state: '',
    country: '',
    is_primary: false
  };

  // Dynamic lookups from database
  addressTypes$: Observable<LookupItem[]>;
  
  // Dropdown options for custom components
  addressTypeOptions$: Observable<DropdownOption[]>;
  
  // Codes
  codes: HospitalCode[] = [];
  loadingCodes = false;
  showCodeForm = false;
  editingCode: HospitalCode | null = null;
  codeFormData: Partial<HospitalCode> = {
    code_type: '',
    code_value: '',
    is_active: true
  };

  // Code active toggle confirmation dialog
  showCodeActiveConfirm = false;
  codeToToggle: HospitalCode | null = null;

  // Code delete confirmation dialog
  showCodeDeleteConfirm = false;
  codeIdToDelete: string | null = null;

  // Staff active toggle confirmation dialog
  showStaffActiveConfirm = false;
  staffToToggle: HospitalStaff | null = null;

  // Staff delete confirmation dialog
  showStaffDeleteConfirm = false;
  staffIdToDelete: string | null = null;

  // Contact delete confirmation dialog
  showContactDeleteConfirm = false;
  contactToDelete: { staffId: string; contactId: string } | null = null;

  // Contact primary toggle confirmation dialog
  showContactPrimaryConfirm = false;
  contactToTogglePrimary: { staffId: string; contact: HospitalStaffContact } | null = null;

  // Fee active toggle confirmation dialog
  showFeeActiveConfirm = false;
  feeToToggle: FeeSchedule | null = null;

  // Fee delete confirmation dialog
  showFeeDeleteConfirm = false;
  feeIdToDelete: string | null = null;

  // Dynamic lookups from database
  codeTypes$: Observable<LookupItem[]>;
  
  // Dropdown options for custom components
  codeTypeOptions$: Observable<DropdownOption[]>;
  
  // Staff
  staff: HospitalStaff[] = [];
  loadingStaff = false;
  showStaffForm = false;
  editingStaff: HospitalStaff | null = null;
  staffFormData: Partial<HospitalStaff> = {
    staff_name: '',
    staff_type: '',
    specialty: '',
    is_active: true
  };

  // Dynamic lookups from database
  staffTypes$: Observable<LookupItem[]>;

  // Dropdown options for custom components
  staffTypeOptions$: Observable<DropdownOption[]>;

  // Staff Contacts
  staffContactsMap: { [staffId: string]: HospitalStaffContact[] } = {};
  expandedStaffId: string | null = null;
  loadingContacts: { [staffId: string]: boolean } = {};
  showContactForm: { [staffId: string]: boolean } = {};
  editingContact: { [staffId: string]: HospitalStaffContact | null } = {};
  contactFormData: { [staffId: string]: Partial<HospitalStaffContact> } = {};

  // Dynamic lookups from database
  contactTypes$: Observable<LookupItem[]>;

  // Dropdown options for custom components
  contactTypeOptions$: Observable<DropdownOption[]>;

  // Fees
  fees: FeeSchedule[] = [];
  loadingFees = false;
  showFeeForm = false;
  editingFee: FeeSchedule | null = null;
  feeFormData: any = {
    fee_type: '',
    item_code: '',
    description: '',
    amount: 0,
    effective_date: undefined,
    expiry_date: undefined,
    is_active: true
  };

  // Dynamic lookups from database
  feeTypes$: Observable<LookupItem[]>;

  // Dropdown options for custom components
  feeTypeOptions$: Observable<DropdownOption[]>;

  /**
   * Computed minDate for expiry date based on effective date
   * Returns effective_date if set and >= today, otherwise returns today
   */
  get effectiveDateForExpiry(): Date {
    if (this.feeFormData.effective_date) {
      const effectiveDate = new Date(this.feeFormData.effective_date);
      // If effective date is >= today, use it; otherwise use today
      return effectiveDate >= this.today ? effectiveDate : this.today;
    }
    return this.today;
  }

  tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'addresses', label: 'Addresses' },
    { id: 'codes', label: 'Codes' },
    { id: 'staff', label: 'Staff' },
    { id: 'fees', label: 'Fee Schedules' }
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private hospitalService: HospitalService,
    private lookupService: LookupService,
    private logger: LoggerService,
    private toast: ToastService
  ) {
    // Initialize dynamic lookups
    this.addressTypes$ = this.lookupService.getAddressTypes();
    this.codeTypes$ = this.lookupService.getHospitalCodeTypes();
    this.staffTypes$ = this.lookupService.getHospitalStaffTypes();
    this.contactTypes$ = this.lookupService.getHospitalContactTypes();
    this.feeTypes$ = this.lookupService.getHospitalFeeTypes();

    // Map lookups to dropdown options
    this.addressTypeOptions$ = this.addressTypes$.pipe(
      map(items => items.map(item => ({
        value: item.lookup_code,
        label: item.lookup_value
      })))
    );

    this.codeTypeOptions$ = this.codeTypes$.pipe(
      map(items => items.map(item => ({
        value: item.lookup_code,
        label: item.lookup_value
      })))
    );

    this.staffTypeOptions$ = this.staffTypes$.pipe(
      map(items => items.map(item => ({
        value: item.lookup_code,
        label: item.lookup_value
      })))
    );

    this.contactTypeOptions$ = this.contactTypes$.pipe(
      map(items => items.map(item => ({
        value: item.lookup_code,
        label: item.lookup_value
      })))
    );

    this.feeTypeOptions$ = this.feeTypes$.pipe(
      map(items => items.map(item => ({
        value: item.lookup_code,
        label: item.lookup_value
      })))
    );
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadHospital(id);
    } else {
      this.toast.error('Invalid hospital ID');
      this.goBack();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load hospital data
   */
  loadHospital(id: string): void {
    this.loading = true;
    this.hospitalService.getHospitalById(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (hospital) => {
          this.hospital = hospital;
          this.loading = false;
          this.logger.info('Hospital loaded successfully');
        },
        error: (error) => {
          this.logger.error('Error loading hospital:', error);
          this.toast.error('Failed to load hospital');
          this.loading = false;
        }
      });
  }

  /**
   * Navigate to edit page
   */
  editHospital(): void {
    if (this.hospital) {
      this.router.navigate([APP_ROUTES.HOSPITALS.EDIT(this.hospital.hospital_id)]);
    }
  }

  /**
   * Handle panel status toggle - show confirmation first
   */
  onTogglePanelStatus(newStatus: boolean): void {
    if (!this.hospital) return;
    
    this.pendingPanelStatus = newStatus;
    this.showPanelToggleConfirm = true;
  }

  /**
   * Confirm panel status change
   */
  confirmPanelToggle(): void {
    if (!this.hospital || this.pendingPanelStatus === null) return;

    const hospitalId = this.hospital.hospital_id;
    const newStatus = this.pendingPanelStatus;

    this.hospitalService.updateHospital(hospitalId, { is_panel: newStatus })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          if (this.hospital) {
            this.hospital.is_panel = newStatus;
          }
          this.toast.success(`Hospital panel status updated to ${newStatus ? 'Panel' : 'Non-Panel'}`);
          this.showPanelToggleConfirm = false;
          this.pendingPanelStatus = null;
        },
        error: (error) => {
          this.logger.error('Error updating panel status:', error);
          this.toast.error('Failed to update panel status');
          this.showPanelToggleConfirm = false;
          this.pendingPanelStatus = null;
        }
      });
  }

  /**
   * Cancel panel status change
   */
  cancelPanelToggle(): void {
    this.showPanelToggleConfirm = false;
    this.pendingPanelStatus = null;
  }

  /**
   * Handle address primary status toggle - show confirmation first
   */
  onToggleAddressPrimary(address: HospitalAddress): void {
    if (!this.hospital) return;
    
    this.addressToToggle = address;
    this.showAddressPrimaryConfirm = true;
  }

  /**
   * Confirm address primary status change
   */
  confirmAddressPrimaryToggle(): void {
    if (!this.hospital || !this.addressToToggle) return;

    const addressId = this.addressToToggle.address_id;
    const newStatus = !this.addressToToggle.is_primary;

    this.hospitalService.updateHospitalAddress(this.hospital.hospital_id, addressId, { is_primary: newStatus })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          if (this.addressToToggle) {
            this.addressToToggle.is_primary = newStatus;
          }
          this.toast.success(`Address primary status updated to ${newStatus ? 'Primary' : 'Non-Primary'}`);
          this.showAddressPrimaryConfirm = false;
          this.addressToToggle = null;
          // Reload addresses to ensure consistency
          this.loadAddresses();
        },
        error: (error) => {
          this.logger.error('Error updating address primary status:', error);
          this.toast.error('Failed to update address primary status');
          this.showAddressPrimaryConfirm = false;
          this.addressToToggle = null;
        }
      });
  }

  /**
   * Cancel address primary status change
   */
  cancelAddressPrimaryToggle(): void {
    this.showAddressPrimaryConfirm = false;
    this.addressToToggle = null;
  }

  /**
   * Show confirmation dialog for address deletion
   */
  onDeleteAddress(addressId: string): void {
    this.addressIdToDelete = addressId;
    this.showAddressDeleteConfirm = true;
  }

  /**
   * Confirm and delete address
   */
  confirmAddressDelete(): void {
    if (!this.hospital || !this.addressIdToDelete) return;

    const hospitalId = this.hospital.hospital_id;
    const addressId = this.addressIdToDelete;

    this.hospitalService.deleteHospitalAddress(hospitalId, addressId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toast.success('Address deleted successfully');
          this.loadAddresses();
          this.showAddressDeleteConfirm = false;
          this.addressIdToDelete = null;
        },
        error: (error) => {
          this.logger.error('Error deleting address:', error);
          this.toast.error('Failed to delete address');
          this.showAddressDeleteConfirm = false;
          this.addressIdToDelete = null;
        }
      });
  }

  /**
   * Cancel address deletion
   */
  cancelAddressDelete(): void {
    this.showAddressDeleteConfirm = false;
    this.addressIdToDelete = null;
  }

  /**
   * Show confirmation dialog for code active toggle
   */
  onToggleCodeActive(code: HospitalCode): void {
    this.codeToToggle = code;
    this.showCodeActiveConfirm = true;
  }

  /**
   * Confirm and toggle code active status
   */
  confirmCodeActiveToggle(): void {
    if (!this.hospital || !this.codeToToggle) return;

    const hospitalId = this.hospital.hospital_id;
    const codeId = this.codeToToggle.code_id;
    const newStatus = !this.codeToToggle.is_active;

    this.hospitalService.updateHospitalCode(hospitalId, codeId, { is_active: newStatus })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toast.success('Code status updated successfully');
          if (this.codeToToggle) {
            this.codeToToggle.is_active = newStatus;
          }
          this.loadCodes();
          this.showCodeActiveConfirm = false;
          this.codeToToggle = null;
        },
        error: (error) => {
          this.logger.error('Error updating code status:', error);
          this.toast.error('Failed to update code status');
          this.showCodeActiveConfirm = false;
          this.codeToToggle = null;
        }
      });
  }

  /**
   * Cancel code active status toggle
   */
  cancelCodeActiveToggle(): void {
    this.showCodeActiveConfirm = false;
    this.codeToToggle = null;
  }

  /**
   * Show confirmation dialog for code deletion
   */
  onDeleteCode(codeId: string): void {
    this.codeIdToDelete = codeId;
    this.showCodeDeleteConfirm = true;
  }

  /**
   * Confirm and delete code
   */
  confirmCodeDelete(): void {
    if (!this.hospital || !this.codeIdToDelete) return;

    const hospitalId = this.hospital.hospital_id;
    const codeId = this.codeIdToDelete;

    this.hospitalService.deleteHospitalCode(hospitalId, codeId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toast.success('Code deleted successfully');
          this.loadCodes();
          this.showCodeDeleteConfirm = false;
          this.codeIdToDelete = null;
        },
        error: (error) => {
          this.logger.error('Error deleting code:', error);
          this.toast.error('Failed to delete code');
          this.showCodeDeleteConfirm = false;
          this.codeIdToDelete = null;
        }
      });
  }

  /**
   * Cancel code deletion
   */
  cancelCodeDelete(): void {
    this.showCodeDeleteConfirm = false;
    this.codeIdToDelete = null;
  }

  /**
   * Show confirmation dialog for staff active toggle
   */
  onToggleStaffActive(staff: HospitalStaff): void {
    this.staffToToggle = staff;
    this.showStaffActiveConfirm = true;
  }

  /**
   * Confirm and toggle staff active status
   */
  confirmStaffActiveToggle(): void {
    if (!this.hospital || !this.staffToToggle) return;

    const hospitalId = this.hospital.hospital_id;
    const staffId = this.staffToToggle.staff_id;
    const newStatus = !this.staffToToggle.is_active;

    this.hospitalService.updateHospitalStaff(hospitalId, staffId, { is_active: newStatus })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toast.success('Staff status updated successfully');
          if (this.staffToToggle) {
            this.staffToToggle.is_active = newStatus;
          }
          this.loadStaff();
          this.showStaffActiveConfirm = false;
          this.staffToToggle = null;
        },
        error: (error) => {
          this.logger.error('Error updating staff status:', error);
          this.toast.error('Failed to update staff status');
          this.showStaffActiveConfirm = false;
          this.staffToToggle = null;
        }
      });
  }

  /**
   * Cancel staff active status toggle
   */
  cancelStaffActiveToggle(): void {
    this.showStaffActiveConfirm = false;
    this.staffToToggle = null;
  }

  /**
   * Show confirmation dialog for staff deletion
   */
  onDeleteStaff(staffId: string): void {
    this.staffIdToDelete = staffId;
    this.showStaffDeleteConfirm = true;
  }

  /**
   * Confirm and delete staff
   */
  confirmStaffDelete(): void {
    if (!this.hospital || !this.staffIdToDelete) return;

    const hospitalId = this.hospital.hospital_id;
    const staffId = this.staffIdToDelete;

    this.hospitalService.deleteHospitalStaff(hospitalId, staffId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toast.success('Staff deleted successfully');
          this.loadStaff();
          this.showStaffDeleteConfirm = false;
          this.staffIdToDelete = null;
        },
        error: (error) => {
          this.logger.error('Error deleting staff:', error);
          this.toast.error('Failed to delete staff');
          this.showStaffDeleteConfirm = false;
          this.staffIdToDelete = null;
        }
      });
  }

  /**
   * Cancel staff deletion
   */
  cancelStaffDelete(): void {
    this.showStaffDeleteConfirm = false;
    this.staffIdToDelete = null;
  }

  /**
   * Show confirmation dialog for contact deletion
   */
  onDeleteContact(staffId: string, contactId: string): void {
    this.contactToDelete = { staffId, contactId };
    this.showContactDeleteConfirm = true;
  }

  /**
   * Confirm and delete contact
   */
  confirmContactDelete(): void {
    if (!this.hospital || !this.contactToDelete) return;

    const hospitalId = this.hospital.hospital_id;
    const { staffId, contactId } = this.contactToDelete;

    this.hospitalService.deleteStaffContact(hospitalId, staffId, contactId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toast.success('Contact deleted successfully');
          this.loadStaffContacts(staffId);
          this.showContactDeleteConfirm = false;
          this.contactToDelete = null;
        },
        error: (error) => {
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

  /**
   * Show confirmation dialog for contact primary toggle
   */
  onToggleContactPrimary(staffId: string, contact: HospitalStaffContact): void {
    this.contactToTogglePrimary = { staffId, contact };
    this.showContactPrimaryConfirm = true;
  }

  /**
   * Confirm and toggle contact primary status
   */
  confirmContactPrimaryToggle(): void {
    if (!this.hospital || !this.contactToTogglePrimary) return;

    const hospitalId = this.hospital.hospital_id;
    const { staffId, contact } = this.contactToTogglePrimary;
    const newStatus = !contact.is_primary;

    this.hospitalService.updateStaffContact(hospitalId, staffId, contact.contact_id, { is_primary: newStatus })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toast.success('Contact primary status updated successfully');
          if (this.contactToTogglePrimary) {
            this.contactToTogglePrimary.contact.is_primary = newStatus;
          }
          this.loadStaffContacts(staffId);
          this.showContactPrimaryConfirm = false;
          this.contactToTogglePrimary = null;
        },
        error: (error) => {
          this.logger.error('Error updating contact primary status:', error);
          this.toast.error('Failed to update contact primary status');
          this.showContactPrimaryConfirm = false;
          this.contactToTogglePrimary = null;
        }
      });
  }

  /**
   * Cancel contact primary status toggle
   */
  cancelContactPrimaryToggle(): void {
    this.showContactPrimaryConfirm = false;
    this.contactToTogglePrimary = null;
  }

  /**
   * Show confirmation dialog for fee active toggle
   */
  onToggleFeeActive(fee: FeeSchedule): void {
    this.feeToToggle = fee;
    this.showFeeActiveConfirm = true;
  }

  /**
   * Confirm and toggle fee active status
   */
  confirmFeeActiveToggle(): void {
    if (!this.hospital || !this.feeToToggle) return;

    const hospitalId = this.hospital.hospital_id;
    const feeId = this.feeToToggle.fee_id;
    const newStatus = !this.feeToToggle.is_active;

    this.hospitalService.updateHospitalFee(hospitalId, feeId, { is_active: newStatus })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toast.success('Fee schedule status updated successfully');
          if (this.feeToToggle) {
            this.feeToToggle.is_active = newStatus;
          }
          this.loadFees();
          this.showFeeActiveConfirm = false;
          this.feeToToggle = null;
        },
        error: (error) => {
          this.logger.error('Error updating fee schedule status:', error);
          this.toast.error('Failed to update fee schedule status');
          this.showFeeActiveConfirm = false;
          this.feeToToggle = null;
        }
      });
  }

  /**
   * Cancel fee active status toggle
   */
  cancelFeeActiveToggle(): void {
    this.showFeeActiveConfirm = false;
    this.feeToToggle = null;
  }

  /**
   * Show confirmation dialog for fee deletion
   */
  onDeleteFee(feeId: string): void {
    this.feeIdToDelete = feeId;
    this.showFeeDeleteConfirm = true;
  }

  /**
   * Confirm and delete fee
   */
  confirmFeeDelete(): void {
    if (!this.hospital || !this.feeIdToDelete) return;

    const hospitalId = this.hospital.hospital_id;
    const feeId = this.feeIdToDelete;

    this.hospitalService.deleteHospitalFee(hospitalId, feeId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toast.success('Fee schedule deleted successfully');
          this.loadFees();
          this.showFeeDeleteConfirm = false;
          this.feeIdToDelete = null;
        },
        error: (error) => {
          this.logger.error('Error deleting fee schedule:', error);
          this.toast.error('Failed to delete fee schedule');
          this.showFeeDeleteConfirm = false;
          this.feeIdToDelete = null;
        }
      });
  }

  /**
   * Cancel fee deletion
   */
  cancelFeeDelete(): void {
    this.showFeeDeleteConfirm = false;
    this.feeIdToDelete = null;
  }

  // ============================================================================
  // ADDRESS MANAGEMENT
  // ============================================================================

  /**
   * Load hospital addresses
   */
  loadAddresses(): void {
    if (!this.hospital) return;

    this.loadingAddresses = true;
    this.hospitalService.getHospitalAddresses(this.hospital.hospital_id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (addresses) => {
          this.addresses = addresses;
          this.loadingAddresses = false;
          this.logger.info('Addresses loaded successfully');
        },
        error: (error) => {
          this.logger.error('Error loading addresses:', error);
          this.toast.error('Failed to load addresses');
          this.loadingAddresses = false;
        }
      });
  }

  /**
   * Save address (create or update)
   */
  saveAddress(form: any): void {
    if (!this.hospital || form.invalid) return;

    const hospitalId = this.hospital.hospital_id;
    const addressData = { ...this.addressFormData };

    if (this.editingAddress) {
      // Update existing address
      this.hospitalService.updateHospitalAddress(hospitalId, this.editingAddress.address_id, addressData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.toast.success('Address updated successfully');
            this.showAddressForm = false;
            this.editingAddress = null;
            this.resetAddressForm();
            this.loadAddresses();
          },
          error: (error) => {
            this.logger.error('Error updating address:', error);
            this.toast.error('Failed to update address');
          }
        });
    } else {
      // Create new address
      this.hospitalService.createHospitalAddress(hospitalId, addressData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.toast.success('Address created successfully');
            this.showAddressForm = false;
            this.resetAddressForm();
            this.loadAddresses();
          },
          error: (error) => {
            this.logger.error('Error creating address:', error);
            this.toast.error('Failed to create address');
          }
        });
    }
  }

  /**
   * Delete address
   */
  deleteAddress(addressId: string): void {
    // Redirect to the new confirmation dialog method
    this.onDeleteAddress(addressId);
  }

  /**
   * Reset address form
   */
  resetAddressForm(): void {
    this.addressFormData = {
      address_type: '',
      street_line1: '',
      street_line2: '',
      postal_code: '',
      city: '',
      state: '',
      country: '',
      is_primary: false
    };
  }

  /**
   * Show address form for adding new address
   */
  showAddAddressForm(): void {
    this.resetAddressForm();
    this.editingAddress = null;
    this.showAddressForm = true;
  }

  /**
   * Edit address - populate form with existing data
   */
  editAddress(address: HospitalAddress): void {
    this.editingAddress = address;
    this.addressFormData = {
      address_type: address.address_type,
      street_line1: address.street_line1 || '',
      street_line2: address.street_line2 || '',
      postal_code: address.postal_code || '',
      city: address.city || '',
      state: address.state || '',
      country: address.country || '',
      is_primary: address.is_primary || false
    };
    this.showAddressForm = true;
  }

  /**
   * Cancel address form
   */
  cancelAddressForm(): void {
    this.showAddressForm = false;
    this.editingAddress = null;
    this.resetAddressForm();
  }

  // ============================================================================
  // CODE MANAGEMENT
  // ============================================================================

  /**
   * Load hospital codes
   */
  loadCodes(): void {
    if (!this.hospital) return;

    this.loadingCodes = true;
    this.hospitalService.getHospitalCodes(this.hospital.hospital_id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (codes) => {
          this.codes = codes;
          this.loadingCodes = false;
          this.logger.info('Codes loaded successfully');
        },
        error: (error) => {
          this.logger.error('Error loading codes:', error);
          this.toast.error('Failed to load codes');
          this.loadingCodes = false;
        }
      });
  }

  /**
   * Save code (create or update)
   */
  saveCode(form: any): void {
    if (!this.hospital || form.invalid) return;

    const hospitalId = this.hospital.hospital_id;
    const codeData = { ...this.codeFormData };

    if (this.editingCode) {
      // Update existing code
      this.hospitalService.updateHospitalCode(hospitalId, this.editingCode.code_id, codeData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.toast.success('Code updated successfully');
            this.showCodeForm = false;
            this.editingCode = null;
            this.resetCodeForm();
            this.loadCodes();
          },
          error: (error) => {
            this.logger.error('Error updating code:', error);
            this.toast.error('Failed to update code');
          }
        });
    } else {
      // Create new code
      this.hospitalService.createHospitalCode(hospitalId, codeData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.toast.success('Code created successfully');
            this.showCodeForm = false;
            this.resetCodeForm();
            this.loadCodes();
          },
          error: (error) => {
            this.logger.error('Error creating code:', error);
            this.toast.error('Failed to create code');
          }
        });
    }
  }

  /**
   * Delete code
   */
  deleteCode(codeId: string): void {
    // Redirect to the new confirmation dialog method
    this.onDeleteCode(codeId);
  }

  /**
   * Reset code form
   */
  resetCodeForm(): void {
    this.codeFormData = {
      code_type: '',
      code_value: '',
      is_active: true
    };
  }

  /**
   * Show code form for adding new code
   */
  showAddCodeForm(): void {
    this.resetCodeForm();
    this.editingCode = null;
    this.showCodeForm = true;
  }

  /**
   * Edit code - populate form with existing data
   */
  editCode(code: HospitalCode): void {
    this.editingCode = code;
    this.codeFormData = {
      code_type: code.code_type || '',
      code_value: code.code_value || '',
      is_active: code.is_active !== undefined ? code.is_active : true
    };
    this.showCodeForm = true;
  }

  /**
   * Cancel code form
   */
  cancelCodeForm(): void {
    this.showCodeForm = false;
    this.editingCode = null;
    this.resetCodeForm();
  }

  // ============================================================================
  // STAFF MANAGEMENT
  // ============================================================================

  /**
   * Load hospital staff
   */
  loadStaff(): void {
    if (!this.hospital) return;

    this.loadingStaff = true;
    this.hospitalService.getHospitalStaff(this.hospital.hospital_id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (staff) => {
          this.staff = staff;
          this.loadingStaff = false;
          this.logger.info('Staff loaded successfully');
        },
        error: (error) => {
          this.logger.error('Error loading staff:', error);
          this.toast.error('Failed to load staff');
          this.loadingStaff = false;
        }
      });
  }

  /**
   * Save staff (create or update)
   */
  saveStaff(form: any): void {
    if (!this.hospital || form.invalid) return;

    const hospitalId = this.hospital.hospital_id;
    const staffData = { ...this.staffFormData };

    if (this.editingStaff) {
      // Update existing staff
      this.hospitalService.updateHospitalStaff(hospitalId, this.editingStaff.staff_id, staffData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.toast.success('Staff updated successfully');
            this.showStaffForm = false;
            this.editingStaff = null;
            this.resetStaffForm();
            this.loadStaff();
          },
          error: (error) => {
            this.logger.error('Error updating staff:', error);
            this.toast.error('Failed to update staff');
          }
        });
    } else {
      // Create new staff
      this.hospitalService.createHospitalStaff(hospitalId, staffData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.toast.success('Staff created successfully');
            this.showStaffForm = false;
            this.resetStaffForm();
            this.loadStaff();
          },
          error: (error) => {
            this.logger.error('Error creating staff:', error);
            this.toast.error('Failed to create staff');
          }
        });
    }
  }

  /**
   * Delete staff
   */
  deleteStaff(staffId: string): void {
    // Redirect to the new confirmation dialog method
    this.onDeleteStaff(staffId);
  }

  /**
   * Reset staff form
   */
  resetStaffForm(): void {
    this.staffFormData = {
      staff_name: '',
      staff_type: '',
      specialty: '',
      is_active: true
    };
  }

  /**
   * Show staff form for adding new staff
   */
  showAddStaffForm(): void {
    this.resetStaffForm();
    this.editingStaff = null;
    this.showStaffForm = true;
  }

  /**
   * Edit staff - populate form with existing data
   */
  editStaff(staff: HospitalStaff): void {
    this.editingStaff = staff;
    this.staffFormData = {
      staff_name: staff.staff_name || '',
      staff_type: staff.staff_type || '',
      specialty: staff.specialty || '',
      is_active: staff.is_active !== undefined ? staff.is_active : true
    };
    this.showStaffForm = true;
  }

  /**
   * Cancel staff form
   */
  cancelStaffForm(): void {
    this.showStaffForm = false;
    this.editingStaff = null;
    this.resetStaffForm();
  }

  // ============================================================================
  // STAFF CONTACTS MANAGEMENT
  // ============================================================================

  /**
   * Toggle staff contacts expansion
   */
  toggleStaffContacts(staffId: string): void {
    if (this.expandedStaffId === staffId) {
      this.expandedStaffId = null;
    } else {
      this.expandedStaffId = staffId;
      this.loadStaffContacts(staffId);
    }
  }

  /**
   * Load contacts for a specific staff member
   */
  loadStaffContacts(staffId: string): void {
    if (!this.hospital) return;

    this.loadingContacts[staffId] = true;
    this.hospitalService.getStaffContacts(this.hospital.hospital_id, staffId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (contacts) => {
          this.staffContactsMap[staffId] = contacts;
          this.loadingContacts[staffId] = false;
          this.logger.info(`Contacts loaded for staff ${staffId}`);
        },
        error: (error) => {
          this.logger.error('Error loading staff contacts:', error);
          this.toast.error('Failed to load staff contacts');
          this.loadingContacts[staffId] = false;
        }
      });
  }

  /**
   * Show contact form for adding new contact
   */
  showAddContactForm(staffId: string): void {
    this.resetContactForm(staffId);
    this.editingContact[staffId] = null;
    this.showContactForm[staffId] = true;
  }

  /**
   * Save contact (create or update)
   */
  saveContact(staffId: string, form: any): void {
    if (!this.hospital || form.invalid) return;

    const hospitalId = this.hospital.hospital_id;
    const contactData = { ...this.contactFormData[staffId] };

    if (this.editingContact[staffId]) {
      // Update existing contact
      const contactId = this.editingContact[staffId]!.contact_id;
      this.hospitalService.updateStaffContact(hospitalId, staffId, contactId, contactData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.toast.success('Contact updated successfully');
            this.showContactForm[staffId] = false;
            this.editingContact[staffId] = null;
            this.resetContactForm(staffId);
            this.loadStaffContacts(staffId);
          },
          error: (error) => {
            this.logger.error('Error updating contact:', error);
            this.toast.error('Failed to update contact');
          }
        });
    } else {
      // Create new contact
      this.hospitalService.createStaffContact(hospitalId, staffId, contactData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.toast.success('Contact created successfully');
            this.showContactForm[staffId] = false;
            this.resetContactForm(staffId);
            this.loadStaffContacts(staffId);
          },
          error: (error) => {
            this.logger.error('Error creating contact:', error);
            this.toast.error('Failed to create contact');
          }
        });
    }
  }

  /**
   * Edit contact - populate form with existing data
   */
  editContact(staffId: string, contact: HospitalStaffContact): void {
    this.editingContact[staffId] = contact;
    this.contactFormData[staffId] = {
      contact_type: contact.contact_type || '',
      contact_value: contact.contact_value || '',
      is_primary: contact.is_primary !== undefined ? contact.is_primary : false
    };
    this.showContactForm[staffId] = true;
  }

  /**
   * Delete contact
   */
  deleteContact(staffId: string, contactId: string): void {
    // Redirect to the new confirmation dialog method
    this.onDeleteContact(staffId, contactId);
  }

  /**
   * Reset contact form
   */
  resetContactForm(staffId: string): void {
    this.contactFormData[staffId] = {
      contact_type: '',
      contact_value: '',
      legacy_hospital_contact_id: '',
      is_primary: false
    };
  }

  /**
   * Cancel contact form
   */
  cancelContactForm(staffId: string): void {
    this.showContactForm[staffId] = false;
    this.editingContact[staffId] = null;
    this.resetContactForm(staffId);
  }

  // ============================================================================
  // FEE SCHEDULE MANAGEMENT
  // ============================================================================

  /**
   * Load hospital fee schedules
   */
  loadFees(): void {
    if (!this.hospital) return;

    this.loadingFees = true;
    this.hospitalService.getHospitalFees(this.hospital.hospital_id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (fees) => {
          this.fees = fees;
          this.loadingFees = false;
          this.logger.info('Fee schedules loaded successfully');
        },
        error: (error) => {
          this.logger.error('Error loading fee schedules:', error);
          this.toast.error('Failed to load fee schedules');
          this.loadingFees = false;
        }
      });
  }

  /**
   * Save fee schedule (create or update)
   */
  saveFee(form: any): void {
    if (!this.hospital || form.invalid) return;

    const hospitalId = this.hospital.hospital_id;
    const feeData = { ...this.feeFormData };

    if (this.editingFee) {
      // Update existing fee
      this.hospitalService.updateHospitalFee(hospitalId, this.editingFee.fee_id, feeData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.toast.success('Fee schedule updated successfully');
            this.showFeeForm = false;
            this.editingFee = null;
            this.resetFeeForm();
            this.loadFees();
          },
          error: (error) => {
            this.logger.error('Error updating fee schedule:', error);
            this.toast.error('Failed to update fee schedule');
          }
        });
    } else {
      // Create new fee
      this.hospitalService.createHospitalFee(hospitalId, feeData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.toast.success('Fee schedule created successfully');
            this.showFeeForm = false;
            this.resetFeeForm();
            this.loadFees();
          },
          error: (error) => {
            this.logger.error('Error creating fee schedule:', error);
            this.toast.error('Failed to create fee schedule');
          }
        });
    }
  }

  /**
   * Delete fee schedule
   */
  deleteFee(feeId: string): void {
    // Redirect to the new confirmation dialog method
    this.onDeleteFee(feeId);
  }

  /**
   * Reset fee form
   */
  resetFeeForm(): void {
    this.feeFormData = {
      fee_type: '',
      item_code: '',
      description: '',
      amount: 0,
      effective_date: undefined,
      expiry_date: undefined,
      is_active: true
    };
  }

  /**
   * Show fee form for adding new fee
   */
  showAddFeeForm(): void {
    this.resetFeeForm();
    this.editingFee = null;
    this.showFeeForm = true;
  }

  /**
   * Edit fee - populate form with existing data
   */
  editFee(fee: FeeSchedule): void {
    this.editingFee = fee;
    this.feeFormData = {
      fee_type: fee.fee_type || '',
      item_code: fee.item_code || '',
      description: fee.description || '',
      amount: fee.amount || 0,
      effective_date: fee.effective_date ? new Date(fee.effective_date).toISOString().split('T')[0] : undefined,
      expiry_date: fee.expiry_date ? new Date(fee.expiry_date).toISOString().split('T')[0] : undefined,
      is_active: fee.is_active !== undefined ? fee.is_active : true
    };
    this.showFeeForm = true;
  }

  /**
   * Cancel fee form
   */
  cancelFeeForm(): void {
    this.showFeeForm = false;
    this.editingFee = null;
    this.resetFeeForm();
  }

  /**
   * Handle tab change
   */
  onTabChange(tab: string): void {
    this.activeTab = tab;

    // Load data when tab is activated
    if (tab === 'addresses' && this.addresses.length === 0 && !this.loadingAddresses) {
      this.loadAddresses();
    }
    if (tab === 'codes' && this.codes.length === 0 && !this.loadingCodes) {
      this.loadCodes();
    }
    if (tab === 'staff' && this.staff.length === 0 && !this.loadingStaff) {
      this.loadStaff();
    }
    if (tab === 'fees' && this.fees.length === 0 && !this.loadingFees) {
      this.loadFees();
    }
  }

  /**
   * Navigate back to list
   */
  goBack(): void {
    this.router.navigate([APP_ROUTES.HOSPITALS.LIST]);
  }
}


