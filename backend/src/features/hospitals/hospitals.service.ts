import { HospitalsRepository } from './hospitals.repository';
import { CreateHospitalDto, UpdateHospitalDto, HospitalFilters, PaginatedHospitals, Hospital } from './hospitals.types';
import { BaseService } from '../../core/base/base.service';
import { HospitalAddressesRepository } from './hospital-addresses.repository';
import { CreateHospitalAddressDto, UpdateHospitalAddressDto, HospitalAddress } from './hospital-addresses.types';
import { HospitalCodesRepository } from './hospital-codes.repository';
import { CreateHospitalCodeDto, UpdateHospitalCodeDto, HospitalCode } from './hospital-codes.types';
import { HospitalStaffRepository } from './hospital-staff.repository';
import { CreateHospitalStaffDto, UpdateHospitalStaffDto, HospitalStaff } from './hospital-staff.types';
import { HospitalStaffContactsRepository } from './hospital-staff-contacts.repository';
import { CreateHospitalStaffContactDto, UpdateHospitalStaffContactDto, HospitalStaffContact } from './hospital-staff-contacts.types';
import { FeeSchedulesRepository } from './fee-schedules.repository';
import { CreateFeeScheduleDto, UpdateFeeScheduleDto, FeeSchedule, FeeScheduleFilters } from './fee-schedules.types';

export class HospitalsService extends BaseService<Hospital> {
  protected repository: HospitalsRepository;
  private addressesRepository: HospitalAddressesRepository;
  private codesRepository: HospitalCodesRepository;
  private staffRepository: HospitalStaffRepository;
  private contactsRepository: HospitalStaffContactsRepository;
  private feesRepository: FeeSchedulesRepository;

  constructor() {
    const repository = new HospitalsRepository();
    super(repository);
    this.repository = repository;
    this.addressesRepository = new HospitalAddressesRepository();
    this.codesRepository = new HospitalCodesRepository();
    this.staffRepository = new HospitalStaffRepository();
    this.contactsRepository = new HospitalStaffContactsRepository();
    this.feesRepository = new FeeSchedulesRepository();
  }

  /**
   * Get paginated list of hospitals
   */
  public async getHospitals(filters: HospitalFilters): Promise<PaginatedHospitals> {
    return await this.repository.getHospitals(filters);
  }

  /**
   * Get hospital by ID
   */
  public async getHospitalById(hospitalId: number): Promise<Hospital | null> {
    return await this.repository.getHospitalById(hospitalId);
  }

  /**
   * Validate GUID format
   */
  private isValidGuid(guid: string): boolean {
    const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return guidRegex.test(guid);
  }

  /**
   * Create new hospital
   */
  public async createHospital(dto: CreateHospitalDto, createdBy: string): Promise<number> {
    // Validate hospital name (required)
    if (!dto.hospital_name || dto.hospital_name.trim().length === 0) {
      throw new Error('Hospital name is required');
    }

    if (dto.hospital_name.length > 255) {
      throw new Error('Hospital name must not exceed 255 characters');
    }

    // Validate hospital code if provided
    if (dto.hospital_code) {
      if (dto.hospital_code.length > 50) {
        throw new Error('Hospital code must not exceed 50 characters');
      }

      // Check if hospital code exists
      const exists = await this.repository.hospitalCodeExists(dto.hospital_code);
      if (exists) {
        throw new Error('Hospital code already exists');
      }
    }

    // Validate hospital type if provided
    if (dto.hospital_type && dto.hospital_type.length > 50) {
      throw new Error('Hospital type must not exceed 50 characters');
    }

    // Validate reg_no if provided
    if (dto.reg_no && dto.reg_no.length > 50) {
      throw new Error('Registration number must not exceed 50 characters');
    }

    // Validate bank_acc_no if provided
    if (dto.bank_acc_no && dto.bank_acc_no.length > 50) {
      throw new Error('Bank account number must not exceed 50 characters');
    }

    // Validate panel_status if provided
    if (dto.panel_status && dto.panel_status.length > 50) {
      throw new Error('Panel status must not exceed 50 characters');
    }

    // Validate accreditation_status if provided
    if (dto.accreditation_status && dto.accreditation_status.length > 50) {
      throw new Error('Accreditation status must not exceed 50 characters');
    }

    // Create hospital (always defaults to active: is_deleted = false)
    const hospitalId = await this.repository.createHospital(
      dto.hospital_name.trim(),
      dto.hospital_code,
      dto.hospital_type,
      dto.reg_no,
      dto.bank_id,
      dto.bank_acc_no,
      dto.is_panel !== undefined ? dto.is_panel : false,
      dto.panel_status,
      dto.panel_effective_date,
      dto.accreditation_status,
      dto.accreditation_expiry,
      false, // is_deleted - always false for new hospitals
      createdBy
    );

    return hospitalId;
  }

  /**
   * Update hospital
   */
  public async updateHospital(hospitalId: number, dto: UpdateHospitalDto, updatedBy: string): Promise<void> {
    // Check if hospital exists
    const hospital = await this.repository.getHospitalById(hospitalId);
    if (!hospital) {
      throw new Error('Hospital not found');
    }

    // Validate hospital name if being updated
    if (dto.hospital_name !== undefined) {
      if (!dto.hospital_name || dto.hospital_name.trim().length === 0) {
        throw new Error('Hospital name cannot be empty');
      }

      if (dto.hospital_name.length > 255) {
        throw new Error('Hospital name must not exceed 255 characters');
      }
    }

    // Validate hospital code if being updated
    if (dto.hospital_code !== undefined && dto.hospital_code) {
      if (dto.hospital_code.length > 50) {
        throw new Error('Hospital code must not exceed 50 characters');
      }

      // Check if hospital code already exists (excluding current hospital)
      const exists = await this.repository.hospitalCodeExists(dto.hospital_code, hospitalId);
      if (exists) {
        throw new Error('Hospital code already exists');
      }
    }

    // Validate hospital type if being updated
    if (dto.hospital_type !== undefined && dto.hospital_type && dto.hospital_type.length > 50) {
      throw new Error('Hospital type must not exceed 50 characters');
    }

    // Validate reg_no if being updated
    if (dto.reg_no !== undefined && dto.reg_no && dto.reg_no.length > 50) {
      throw new Error('Registration number must not exceed 50 characters');
    }

    // Validate bank_acc_no if being updated
    if (dto.bank_acc_no !== undefined && dto.bank_acc_no && dto.bank_acc_no.length > 50) {
      throw new Error('Bank account number must not exceed 50 characters');
    }

    // Validate panel_status if being updated
    if (dto.panel_status !== undefined && dto.panel_status && dto.panel_status.length > 50) {
      throw new Error('Panel status must not exceed 50 characters');
    }

    // Validate accreditation_status if being updated
    if (dto.accreditation_status !== undefined && dto.accreditation_status && dto.accreditation_status.length > 50) {
      throw new Error('Accreditation status must not exceed 50 characters');
    }

    await this.repository.updateHospital(
      hospitalId,
      dto.hospital_name ? dto.hospital_name.trim() : undefined,
      dto.hospital_code,
      dto.hospital_type,
      dto.reg_no,
      dto.bank_id,
      dto.bank_acc_no,
      dto.is_panel,
      dto.panel_status,
      dto.panel_effective_date,
      dto.accreditation_status,
      dto.accreditation_expiry,
      dto.is_deleted,
      updatedBy
    );
  }

  /**
   * Delete hospital (soft delete)
   */
  public async deleteHospital(hospitalId: number): Promise<void> {
    // Check if hospital exists
    const hospital = await this.repository.getHospitalById(hospitalId);
    if (!hospital) {
      throw new Error('Hospital not found');
    }

    await this.repository.deleteHospital(hospitalId);
  }

  /**
   * Check if hospital code is available
   */
  public async checkHospitalCodeAvailability(hospitalCode: string, excludeHospitalId?: number): Promise<boolean> {
    const exists = await this.repository.hospitalCodeExists(hospitalCode, excludeHospitalId);
    return !exists;
  }

  // ========================================================================
  // HOSPITAL ADDRESSES
  // ========================================================================

  public async getAddressesByHospitalId(hospitalId: number): Promise<HospitalAddress[]> {
    return await this.addressesRepository.getAddressesByHospitalId(hospitalId);
  }

  public async getAddressById(addressId: number): Promise<HospitalAddress | null> {
    return await this.addressesRepository.getAddressById(addressId);
  }

  public async createAddress(dto: CreateHospitalAddressDto, createdBy: string): Promise<number> {
    // Verify hospital exists
    const hospital = await this.repository.getHospitalById(dto.hospital_id);
    if (!hospital) {
      throw new Error('Hospital not found');
    }

    // If setting as primary, clear other primary flags
    if (dto.is_primary) {
      await this.addressesRepository.clearPrimaryFlags(dto.hospital_id);
    }

    return await this.addressesRepository.createAddress(
      dto.hospital_id,
      dto.address_type || 'PRIMARY',
      dto.street_line1,
      dto.street_line2,
      dto.city,
      dto.state,
      dto.postal_code,
      dto.country,
      dto.latitude,
      dto.longitude,
      dto.is_primary || false,
      createdBy
    );
  }

  public async updateAddress(addressId: number, dto: UpdateHospitalAddressDto, updatedBy: string): Promise<void> {
    const address = await this.addressesRepository.getAddressById(addressId);
    if (!address) {
      throw new Error('Address not found');
    }

    // If setting as primary, clear other primary flags
    if (dto.is_primary) {
      await this.addressesRepository.clearPrimaryFlags(address.hospital_id);
    }

    await this.addressesRepository.updateAddress(
      addressId,
      dto.address_type,
      dto.street_line1,
      dto.street_line2,
      dto.city,
      dto.state,
      dto.postal_code,
      dto.country,
      dto.latitude,
      dto.longitude,
      dto.is_primary,
      updatedBy
    );
  }

  public async deleteAddress(addressId: number): Promise<void> {
    const address = await this.addressesRepository.getAddressById(addressId);
    if (!address) {
      throw new Error('Address not found');
    }

    await this.addressesRepository.deleteAddress(addressId);
  }

  // ========================================================================
  // HOSPITAL CODES
  // ========================================================================

  public async getCodesByHospitalId(hospitalId: number): Promise<HospitalCode[]> {
    return await this.codesRepository.getCodesByHospitalId(hospitalId);
  }

  public async getCodeById(codeId: number): Promise<HospitalCode | null> {
    return await this.codesRepository.getCodeById(codeId);
  }

  public async createCode(dto: CreateHospitalCodeDto, createdBy: string): Promise<number> {
    // Verify hospital exists
    const hospital = await this.repository.getHospitalById(dto.hospital_id);
    if (!hospital) {
      throw new Error('Hospital not found');
    }

    // Check for duplicate code_type for this hospital
    const exists = await this.codesRepository.codeTypeExists(dto.hospital_id, dto.code_type);
    if (exists) {
      throw new Error(`Code type '${dto.code_type}' already exists for this hospital`);
    }

    return await this.codesRepository.createCode(
      dto.hospital_id,
      dto.code_type,
      dto.code_value,
      dto.is_active !== undefined ? dto.is_active : true,
      createdBy
    );
  }

  public async updateCode(codeId: number, dto: UpdateHospitalCodeDto, updatedBy: string): Promise<void> {
    const code = await this.codesRepository.getCodeById(codeId);
    if (!code) {
      throw new Error('Code not found');
    }

    // Check for duplicate code_type if changing
    if (dto.code_type && dto.code_type !== code.code_type) {
      const exists = await this.codesRepository.codeTypeExists(code.hospital_id, dto.code_type, codeId);
      if (exists) {
        throw new Error(`Code type '${dto.code_type}' already exists for this hospital`);
      }
    }

    await this.codesRepository.updateCode(
      codeId,
      dto.code_type,
      dto.code_value,
      dto.is_active,
      updatedBy
    );
  }

  public async deleteCode(codeId: number): Promise<void> {
    const code = await this.codesRepository.getCodeById(codeId);
    if (!code) {
      throw new Error('Code not found');
    }

    await this.codesRepository.deleteCode(codeId);
  }

  // ========================================================================
  // HOSPITAL STAFF
  // ========================================================================

  public async getStaffByHospitalId(hospitalId: number): Promise<HospitalStaff[]> {
    return await this.staffRepository.getStaffByHospitalId(hospitalId);
  }

  public async getStaffById(staffId: number): Promise<HospitalStaff | null> {
    return await this.staffRepository.getStaffById(staffId);
  }

  public async createStaff(dto: CreateHospitalStaffDto, createdBy: string): Promise<number> {
    // Verify hospital exists
    const hospital = await this.repository.getHospitalById(dto.hospital_id);
    if (!hospital) {
      throw new Error('Hospital not found');
    }

    // Validate staff name
    if (!dto.staff_name || dto.staff_name.trim().length === 0) {
      throw new Error('Staff name is required');
    }

    return await this.staffRepository.createStaff(
      dto.hospital_id,
      dto.staff_name.trim(),
      dto.staff_type,
      dto.specialty,
      dto.is_active !== undefined ? dto.is_active : true,
      createdBy
    );
  }

  public async updateStaff(staffId: number, dto: UpdateHospitalStaffDto, updatedBy: string): Promise<void> {
    const staff = await this.staffRepository.getStaffById(staffId);
    if (!staff) {
      throw new Error('Staff not found');
    }

    // Validate staff name if updating
    if (dto.staff_name !== undefined && dto.staff_name.trim().length === 0) {
      throw new Error('Staff name cannot be empty');
    }

    await this.staffRepository.updateStaff(
      staffId,
      dto.staff_name ? dto.staff_name.trim() : undefined,
      dto.staff_type,
      dto.specialty,
      dto.is_active,
      updatedBy
    );
  }

  public async deleteStaff(staffId: number): Promise<void> {
    const staff = await this.staffRepository.getStaffById(staffId);
    if (!staff) {
      throw new Error('Staff not found');
    }

    await this.staffRepository.deleteStaff(staffId);
  }

  // ========================================================================
  // STAFF CONTACTS
  // ========================================================================

  public async getContactsByStaffId(staffId: number): Promise<HospitalStaffContact[]> {
    return await this.contactsRepository.getContactsByStaffId(staffId);
  }

  public async getContactById(contactId: number): Promise<HospitalStaffContact | null> {
    return await this.contactsRepository.getContactById(contactId);
  }

  public async createContact(dto: CreateHospitalStaffContactDto, createdBy: string): Promise<number> {
    // Verify staff exists
    const staff = await this.staffRepository.getStaffById(dto.staff_id);
    if (!staff) {
      throw new Error('Staff not found');
    }

    // If setting as primary, clear other primary flags
    if (dto.is_primary) {
      await this.contactsRepository.clearPrimaryFlags(dto.staff_id);
    }

    return await this.contactsRepository.createContact(
      dto.staff_id,
      dto.contact_type,
      dto.contact_value,
      dto.is_primary || false,
      createdBy
    );
  }

  public async updateContact(contactId: number, dto: UpdateHospitalStaffContactDto, updatedBy: string): Promise<void> {
    const contact = await this.contactsRepository.getContactById(contactId);
    if (!contact) {
      throw new Error('Contact not found');
    }

    // If setting as primary, clear other primary flags
    if (dto.is_primary) {
      await this.contactsRepository.clearPrimaryFlags(contact.staff_id);
    }

    await this.contactsRepository.updateContact(
      contactId,
      dto.contact_type,
      dto.contact_value,
      dto.is_primary,
      updatedBy
    );
  }

  public async deleteContact(contactId: number): Promise<void> {
    const contact = await this.contactsRepository.getContactById(contactId);
    if (!contact) {
      throw new Error('Contact not found');
    }

    await this.contactsRepository.deleteContact(contactId);
  }

  // ========================================================================
  // FEE SCHEDULES
  // ========================================================================

  public async getFeesByHospitalId(hospitalId: number, filters?: FeeScheduleFilters): Promise<FeeSchedule[]> {
    return await this.feesRepository.getFeesByHospitalId(hospitalId, filters);
  }

  public async getFeeById(feeId: number): Promise<FeeSchedule | null> {
    return await this.feesRepository.getFeeById(feeId);
  }

  public async createFee(dto: CreateFeeScheduleDto, createdBy: string): Promise<number> {
    // Verify hospital exists if provided
    if (dto.hospital_id) {
      const hospital = await this.repository.getHospitalById(dto.hospital_id);
      if (!hospital) {
        throw new Error('Hospital not found');
      }
    }

    return await this.feesRepository.createFee(
      dto.hospital_id,
      dto.fee_type,
      dto.item_code,
      dto.description,
      dto.amount,
      dto.effective_date,
      dto.expiry_date,
      dto.is_active !== undefined ? dto.is_active : true,
      createdBy
    );
  }

  public async updateFee(feeId: number, dto: UpdateFeeScheduleDto, updatedBy: string): Promise<void> {
    const fee = await this.feesRepository.getFeeById(feeId);
    if (!fee) {
      throw new Error('Fee schedule not found');
    }

    await this.feesRepository.updateFee(
      feeId,
      dto.fee_type,
      dto.item_code,
      dto.description,
      dto.amount,
      dto.effective_date,
      dto.expiry_date,
      dto.is_active,
      updatedBy
    );
  }

  public async deleteFee(feeId: number): Promise<void> {
    const fee = await this.feesRepository.getFeeById(feeId);
    if (!fee) {
      throw new Error('Fee schedule not found');
    }

    await this.feesRepository.deleteFee(feeId);
  }
}
