import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { HospitalService } from '../../../core/services/hospital.service';
import { Hospital, HospitalAddress, HospitalCode, HospitalStaff, HospitalStaffContact, FeeSchedule } from '../../../shared/models/hospital.model';
import { HasPermissionDirective } from '../../../shared/directives/permissions/has-permission.directive';
import { PERMISSIONS } from '../../../core/constants/permissions.constants';
import { LoggerService } from '../../../core/services/logger.service';
import { ToastService } from '../../../core/services/toast.service';
import { LoadingSpinnerComponent } from '../../../shared/components/ui/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-hospital-view',
  standalone: true,
  imports: [CommonModule, FormsModule, HasPermissionDirective, LoadingSpinnerComponent],
  templateUrl: './hospital-view.component.html',
  styles: []
})
export class HospitalViewComponent implements OnInit, OnDestroy {
  hospital: Hospital | null = null;
  loading = false;
  activeTab = 'overview';

  // Permission constants (exposed to template)
  readonly PERMISSIONS = PERMISSIONS.HOSPITAL_MANAGEMENT;

  // Addresses
  addresses: HospitalAddress[] = [];
  loadingAddresses = false;
  showAddressForm = false;
  editingAddress: HospitalAddress | null = null;
  addressFormData: Partial<HospitalAddress> = {
    address_type: 'PRIMARY',
    street_line1: '',
    street_line2: '',
    postal_code: '',
    city: '',
    state: '',
    country: '',
    is_primary: false
  };
  
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

  // Predefined code types
  codeTypes = [
    { value: 'ZURICH_HOSP_CODE', label: 'Zurich Hospital Code' },
    { value: 'FWD_HOSP_CODE', label: 'FWD Hospital Code' },
    { value: 'INSURER_CODE', label: 'Insurer Code' },
    { value: 'OTHER', label: 'Other' }
  ];
  
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

  // Predefined staff types
  staffTypes = [
    { value: 'DOCTOR', label: 'Doctor' },
    { value: 'NURSE', label: 'Nurse' },
    { value: 'ADMIN', label: 'Administrative Staff' },
    { value: 'TECHNICIAN', label: 'Technician' },
    { value: 'OTHER', label: 'Other' }
  ];

  // Staff Contacts
  staffContactsMap: { [staffId: string]: HospitalStaffContact[] } = {};
  expandedStaffId: string | null = null;
  loadingContacts: { [staffId: string]: boolean } = {};
  showContactForm: { [staffId: string]: boolean } = {};
  editingContact: { [staffId: string]: HospitalStaffContact | null } = {};
  contactFormData: { [staffId: string]: Partial<HospitalStaffContact> } = {};

  // Predefined contact types
  contactTypes = [
    { value: 'EMAIL', label: 'Email' },
    { value: 'MOBILE', label: 'Mobile' },
    { value: 'PHONE', label: 'Phone' },
    { value: 'EXT', label: 'Extension' }
  ];

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

  // Predefined fee types
  feeTypes = [
    { value: 'TPA', label: 'TPA Fee' },
    { value: 'WAKALAH', label: 'Wakalah Fee' },
    { value: 'MMA', label: 'MMA Fee' },
    { value: 'CONSULTATION', label: 'Consultation Fee' },
    { value: 'PROCEDURE', label: 'Procedure Fee' },
    { value: 'OTHER', label: 'Other' }
  ];

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
    private logger: LoggerService,
    private toast: ToastService
  ) {}

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
      this.router.navigate(['/hospitals/edit', this.hospital.hospital_id]);
    }
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
    if (!this.hospital) return;

    if (!confirm('Are you sure you want to delete this address?')) {
      return;
    }

    const hospitalId = this.hospital.hospital_id;

    this.hospitalService.deleteHospitalAddress(hospitalId, addressId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toast.success('Address deleted successfully');
          this.loadAddresses();
        },
        error: (error) => {
          this.logger.error('Error deleting address:', error);
          this.toast.error('Failed to delete address');
        }
      });
  }

  /**
   * Reset address form
   */
  resetAddressForm(): void {
    this.addressFormData = {
      address_type: 'PRIMARY',
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
    if (!this.hospital) return;

    if (!confirm('Are you sure you want to delete this code?')) {
      return;
    }

    const hospitalId = this.hospital.hospital_id;

    this.hospitalService.deleteHospitalCode(hospitalId, codeId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toast.success('Code deleted successfully');
          this.loadCodes();
        },
        error: (error) => {
          this.logger.error('Error deleting code:', error);
          this.toast.error('Failed to delete code');
        }
      });
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
    if (!this.hospital) return;

    if (!confirm('Are you sure you want to delete this staff member?')) {
      return;
    }

    const hospitalId = this.hospital.hospital_id;

    this.hospitalService.deleteHospitalStaff(hospitalId, staffId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toast.success('Staff deleted successfully');
          this.loadStaff();
        },
        error: (error) => {
          this.logger.error('Error deleting staff:', error);
          this.toast.error('Failed to delete staff');
        }
      });
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
    if (!this.hospital) return;

    if (!confirm('Are you sure you want to delete this contact?')) {
      return;
    }

    const hospitalId = this.hospital.hospital_id;

    this.hospitalService.deleteStaffContact(hospitalId, staffId, contactId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toast.success('Contact deleted successfully');
          this.loadStaffContacts(staffId);
        },
        error: (error) => {
          this.logger.error('Error deleting contact:', error);
          this.toast.error('Failed to delete contact');
        }
      });
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
    if (!this.hospital) return;

    if (!confirm('Are you sure you want to delete this fee schedule?')) {
      return;
    }

    const hospitalId = this.hospital.hospital_id;

    this.hospitalService.deleteHospitalFee(hospitalId, feeId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toast.success('Fee schedule deleted successfully');
          this.loadFees();
        },
        error: (error) => {
          this.logger.error('Error deleting fee schedule:', error);
          this.toast.error('Failed to delete fee schedule');
        }
      });
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
    this.router.navigate(['/hospitals']);
  }
}
