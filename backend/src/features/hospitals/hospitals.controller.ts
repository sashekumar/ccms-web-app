import { Request, Response } from 'express';
import { HospitalsService } from './hospitals.service';
import { CreateHospitalDto, UpdateHospitalDto, HospitalFilters, GetHospitalRequest } from './hospitals.types';
import { ResponseUtil } from '../../core/utils/response.util';
import { getErrorMessage } from '../../core/utils/error.util';

export class HospitalsController {
  private service: HospitalsService;

  constructor() {
    this.service = new HospitalsService();
  }

  /**
   * Get paginated list of hospitals
   * POST /api/hospitals/list
   * Body: { search?, hospitalType?, isPanel?, panelStatus?, isDeleted?, page?, limit?, sortBy?, sortOrder? }
   */
  public getHospitals = async (req: Request, res: Response): Promise<void> => {
    try {
      // Accept both camelCase and snake_case from frontend
      const filters: HospitalFilters = {
        search: req.body.search,
        hospitalType: req.body.hospitalType ?? req.body.hospital_type,
        isPanel: req.body.isPanel ?? req.body.is_panel,
        panelStatus: req.body.panelStatus ?? req.body.panel_status,
        isDeleted: req.body.isDeleted ?? req.body.is_deleted,
        page: req.body.page || 1,
        limit: req.body.limit || 10,
        sortBy: req.body.sortBy ?? req.body.sort_by ?? 'hospital_id',
        sortOrder: req.body.sortOrder ?? req.body.sort_order ?? 'DESC'
      };

      const result = await this.service.getHospitals(filters);

      ResponseUtil.success(res, result, 'Hospitals retrieved successfully');
    } catch (error: unknown) {
      ResponseUtil.error(res, 'Error fetching hospitals', 500, getErrorMessage(error));
    }
  };

  /**
   * Get hospital by ID
   * POST /api/hospitals/get
   * Body: { hospital_id }
   */
  public getHospitalById = async (req: Request, res: Response): Promise<void> => {
    try {
      const request: GetHospitalRequest = req.body;
      const hospitalId = request.hospital_id;

      if (!hospitalId || isNaN(hospitalId)) {
        ResponseUtil.error(res, 'Invalid hospital ID', 400);
        return;
      }

      const hospital = await this.service.getHospitalById(hospitalId);

      if (!hospital) {
        ResponseUtil.notFound(res, 'Hospital not found');
        return;
      }

      ResponseUtil.success(res, hospital, 'Hospital retrieved successfully');
    } catch (error: unknown) {
      ResponseUtil.error(res, 'Error fetching hospital', 500, getErrorMessage(error));
    }
  };

  /**
   * Create new hospital
   * POST /api/hospitals/create
   * Body: { hospital_name, hospital_code?, hospital_type?, reg_no?, bank_id?, bank_acc_no?, 
   *         legacy_hospital_id?, is_panel?, panel_status?, panel_effective_date?, 
   *         accreditation_status?, accreditation_expiry?, created_by? }
   */
  public createHospital = async (req: Request, res: Response): Promise<void> => {
    try {
      const dto: CreateHospitalDto = req.body;

      if (!dto.hospital_name) {
        ResponseUtil.error(res, 'hospital_name is required', 400);
        return;
      }

      const hospitalId = await this.service.createHospital(dto);

      ResponseUtil.success(res, { hospital_id: hospitalId }, 'Hospital created successfully', 201);
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);
      
      // Check for SQL Server UNIQUE constraint violations
      if (errorMessage.includes('UNIQUE KEY constraint') || errorMessage.includes('duplicate key')) {
        if (errorMessage.includes('hospital_code')) {
          ResponseUtil.conflict(res, 'Hospital code already exists');
        } else if (errorMessage.includes('hospital_name')) {
          ResponseUtil.conflict(res, 'Hospital name already exists');
        } else {
          ResponseUtil.conflict(res, 'Duplicate value detected');
        }
        return;
      }
      
      if (errorMessage === 'Hospital code already exists') {
        ResponseUtil.conflict(res, errorMessage);
        return;
      }

      if (errorMessage.includes('must be') || errorMessage.includes('is required') || errorMessage.includes('cannot be')) {
        ResponseUtil.error(res, errorMessage, 400);
        return;
      }

      ResponseUtil.error(res, 'Error creating hospital', 500, errorMessage);
    }
  };

  /**
   * Update hospital
   * POST /api/hospitals/update
   * Body: { hospital_id, hospital_name?, hospital_code?, hospital_type?, reg_no?, bank_id?, 
   *         bank_acc_no?, legacy_hospital_id?, is_panel?, panel_status?, panel_effective_date?, 
   *         accreditation_status?, accreditation_expiry?, updated_by? }
   */
  public updateHospital = async (req: Request, res: Response): Promise<void> => {
    try {
      const hospitalId = parseInt(req.body.hospital_id, 10);
      const dto: UpdateHospitalDto = {
        hospital_name: req.body.hospital_name,
        hospital_code: req.body.hospital_code,
        hospital_type: req.body.hospital_type,
        reg_no: req.body.reg_no,
        bank_id: req.body.bank_id,
        bank_acc_no: req.body.bank_acc_no,
        legacy_hospital_id: req.body.legacy_hospital_id,
        is_panel: req.body.is_panel,
        panel_status: req.body.panel_status,
        panel_effective_date: req.body.panel_effective_date,
        accreditation_status: req.body.accreditation_status,
        accreditation_expiry: req.body.accreditation_expiry,
        updated_by: req.body.updated_by
      };

      if (!hospitalId || isNaN(hospitalId)) {
        ResponseUtil.error(res, 'Invalid hospital ID', 400);
        return;
      }

      await this.service.updateHospital(hospitalId, dto);

      ResponseUtil.success(res, null, 'Hospital updated successfully');
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);
      
      if (errorMessage === 'Hospital not found') {
        ResponseUtil.notFound(res, errorMessage);
        return;
      }

      // Check for SQL Server UNIQUE constraint violations
      if (errorMessage.includes('UNIQUE KEY constraint') || errorMessage.includes('duplicate key')) {
        if (errorMessage.includes('hospital_code')) {
          ResponseUtil.conflict(res, 'Hospital code already exists');
        } else if (errorMessage.includes('hospital_name')) {
          ResponseUtil.conflict(res, 'Hospital name already exists');
        } else {
          ResponseUtil.conflict(res, 'Duplicate value detected');
        }
        return;
      }

      if (errorMessage === 'Hospital code already exists') {
        ResponseUtil.conflict(res, errorMessage);
        return;
      }

      if (errorMessage.includes('must be') || errorMessage.includes('cannot be')) {
        ResponseUtil.error(res, errorMessage, 400);
        return;
      }

      ResponseUtil.error(res, 'Error updating hospital', 500, errorMessage);
    }
  };

  /**
   * Delete hospital (soft delete)
   * POST /api/hospitals/delete
   * Body: { hospital_id }
   */
  public deleteHospital = async (req: Request, res: Response): Promise<void> => {
    try {
      const hospitalId = req.body.hospital_id;

      if (!hospitalId || isNaN(hospitalId)) {
        ResponseUtil.error(res, 'Invalid hospital ID', 400);
        return;
      }

      await this.service.deleteHospital(hospitalId);

      ResponseUtil.success(res, null, 'Hospital deleted successfully');
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);
      
      if (errorMessage === 'Hospital not found') {
        ResponseUtil.notFound(res, errorMessage);
        return;
      }

      ResponseUtil.error(res, 'Error deleting hospital', 500, errorMessage);
    }
  };

  /**
   * Check hospital code availability
   * POST /api/hospitals/check-code
   * Body: { hospital_code, exclude_hospital_id? }
   */
  public checkHospitalCode = async (req: Request, res: Response): Promise<void> => {
    try {
      const { hospital_code, exclude_hospital_id } = req.body;

      const isAvailable = await this.service.checkHospitalCodeAvailability(hospital_code, exclude_hospital_id);

      ResponseUtil.success(res, { available: isAvailable }, 'Hospital code availability checked');
    } catch (error: unknown) {
      ResponseUtil.error(res, 'Error checking hospital code', 500, getErrorMessage(error));
    }
  };

  // ========================================================================
  // HOSPITAL ADDRESSES
  // ========================================================================

  public getAddresses = async (req: Request, res: Response): Promise<void> => {
    try {
      const hospitalId = parseInt(req.params.hospitalId);
      if (isNaN(hospitalId)) {
        ResponseUtil.error(res, 'Invalid hospital ID', 400);
        return;
      }

      const addresses = await this.service.getAddressesByHospitalId(hospitalId);
      ResponseUtil.success(res, addresses, 'Addresses retrieved successfully');
    } catch (error: unknown) {
      ResponseUtil.error(res, 'Error fetching addresses', 500, getErrorMessage(error));
    }
  };

  public createAddress = async (req: Request, res: Response): Promise<void> => {
    try {
      const hospitalId = parseInt(req.params.hospitalId);
      if (isNaN(hospitalId)) {
        ResponseUtil.error(res, 'Invalid hospital ID', 400);
        return;
      }

      const dto = { ...req.body, hospital_id: hospitalId };
      const addressId = await this.service.createAddress(dto);

      ResponseUtil.success(res, { address_id: addressId }, 'Address created successfully', 201);
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);
      if (errorMessage === 'Hospital not found') {
        ResponseUtil.notFound(res, errorMessage);
        return;
      }
      ResponseUtil.error(res, 'Error creating address', 500, errorMessage);
    }
  };

  public updateAddress = async (req: Request, res: Response): Promise<void> => {
    try {
      const addressId = parseInt(req.params.addressId);
      if (isNaN(addressId)) {
        ResponseUtil.error(res, 'Invalid address ID', 400);
        return;
      }

      await this.service.updateAddress(addressId, req.body);
      ResponseUtil.success(res, null, 'Address updated successfully');
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);
      if (errorMessage === 'Address not found') {
        ResponseUtil.notFound(res, errorMessage);
        return;
      }
      ResponseUtil.error(res, 'Error updating address', 500, errorMessage);
    }
  };

  public deleteAddress = async (req: Request, res: Response): Promise<void> => {
    try {
      const addressId = parseInt(req.params.addressId);
      if (isNaN(addressId)) {
        ResponseUtil.error(res, 'Invalid address ID', 400);
        return;
      }

      await this.service.deleteAddress(addressId);
      ResponseUtil.success(res, null, 'Address deleted successfully');
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);
      if (errorMessage === 'Address not found') {
        ResponseUtil.notFound(res, errorMessage);
        return;
      }
      ResponseUtil.error(res, 'Error deleting address', 500, errorMessage);
    }
  };

  // ========================================================================
  // HOSPITAL CODES
  // ========================================================================

  public getCodes = async (req: Request, res: Response): Promise<void> => {
    try {
      const hospitalId = parseInt(req.params.hospitalId);
      if (isNaN(hospitalId)) {
        ResponseUtil.error(res, 'Invalid hospital ID', 400);
        return;
      }

      const codes = await this.service.getCodesByHospitalId(hospitalId);
      ResponseUtil.success(res, codes, 'Codes retrieved successfully');
    } catch (error: unknown) {
      ResponseUtil.error(res, 'Error fetching codes', 500, getErrorMessage(error));
    }
  };

  public createCode = async (req: Request, res: Response): Promise<void> => {
    try {
      const hospitalId = parseInt(req.params.hospitalId);
      if (isNaN(hospitalId)) {
        ResponseUtil.error(res, 'Invalid hospital ID', 400);
        return;
      }

      const dto = { ...req.body, hospital_id: hospitalId };
      const codeId = await this.service.createCode(dto);

      ResponseUtil.success(res, { code_id: codeId }, 'Code created successfully', 201);
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);
      if (errorMessage === 'Hospital not found') {
        ResponseUtil.notFound(res, errorMessage);
        return;
      }
      if (errorMessage.includes('already exists')) {
        ResponseUtil.conflict(res, errorMessage);
        return;
      }
      ResponseUtil.error(res, 'Error creating code', 500, errorMessage);
    }
  };

  public updateCode = async (req: Request, res: Response): Promise<void> => {
    try {
      const codeId = parseInt(req.params.codeId);
      if (isNaN(codeId)) {
        ResponseUtil.error(res, 'Invalid code ID', 400);
        return;
      }

      await this.service.updateCode(codeId, req.body);
      ResponseUtil.success(res, null, 'Code updated successfully');
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);
      if (errorMessage === 'Code not found') {
        ResponseUtil.notFound(res, errorMessage);
        return;
      }
      if (errorMessage.includes('already exists')) {
        ResponseUtil.conflict(res, errorMessage);
        return;
      }
      ResponseUtil.error(res, 'Error updating code', 500, errorMessage);
    }
  };

  public deleteCode = async (req: Request, res: Response): Promise<void> => {
    try {
      const codeId = parseInt(req.params.codeId);
      if (isNaN(codeId)) {
        ResponseUtil.error(res, 'Invalid code ID', 400);
        return;
      }

      await this.service.deleteCode(codeId);
      ResponseUtil.success(res, null, 'Code deleted successfully');
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);
      if (errorMessage === 'Code not found') {
        ResponseUtil.notFound(res, errorMessage);
        return;
      }
      ResponseUtil.error(res, 'Error deleting code', 500, errorMessage);
    }
  };

  // ========================================================================
  // HOSPITAL STAFF
  // ========================================================================

  public getStaff = async (req: Request, res: Response): Promise<void> => {
    try {
      const hospitalId = parseInt(req.params.hospitalId);
      if (isNaN(hospitalId)) {
        ResponseUtil.error(res, 'Invalid hospital ID', 400);
        return;
      }

      const staff = await this.service.getStaffByHospitalId(hospitalId);
      ResponseUtil.success(res, staff, 'Staff retrieved successfully');
    } catch (error: unknown) {
      ResponseUtil.error(res, 'Error fetching staff', 500, getErrorMessage(error));
    }
  };

  public createStaff = async (req: Request, res: Response): Promise<void> => {
    try {
      const hospitalId = parseInt(req.params.hospitalId);
      if (isNaN(hospitalId)) {
        ResponseUtil.error(res, 'Invalid hospital ID', 400);
        return;
      }

      const dto = { ...req.body, hospital_id: hospitalId };
      
      if (!dto.staff_name) {
        ResponseUtil.error(res, 'staff_name is required', 400);
        return;
      }

      const staffId = await this.service.createStaff(dto);

      ResponseUtil.success(res, { staff_id: staffId }, 'Staff created successfully', 201);
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);
      if (errorMessage === 'Hospital not found') {
        ResponseUtil.notFound(res, errorMessage);
        return;
      }
      if (errorMessage.includes('is required')) {
        ResponseUtil.error(res, errorMessage, 400);
        return;
      }
      ResponseUtil.error(res, 'Error creating staff', 500, errorMessage);
    }
  };

  public updateStaff = async (req: Request, res: Response): Promise<void> => {
    try {
      const staffId = parseInt(req.params.staffId);
      if (isNaN(staffId)) {
        ResponseUtil.error(res, 'Invalid staff ID', 400);
        return;
      }

      await this.service.updateStaff(staffId, req.body);
      ResponseUtil.success(res, null, 'Staff updated successfully');
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);
      if (errorMessage === 'Staff not found') {
        ResponseUtil.notFound(res, errorMessage);
        return;
      }
      if (errorMessage.includes('cannot be empty')) {
        ResponseUtil.error(res, errorMessage, 400);
        return;
      }
      ResponseUtil.error(res, 'Error updating staff', 500, errorMessage);
    }
  };

  public deleteStaff = async (req: Request, res: Response): Promise<void> => {
    try {
      const staffId = parseInt(req.params.staffId);
      if (isNaN(staffId)) {
        ResponseUtil.error(res, 'Invalid staff ID', 400);
        return;
      }

      await this.service.deleteStaff(staffId);
      ResponseUtil.success(res, null, 'Staff deleted successfully');
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);
      if (errorMessage === 'Staff not found') {
        ResponseUtil.notFound(res, errorMessage);
        return;
      }
      ResponseUtil.error(res, 'Error deleting staff', 500, errorMessage);
    }
  };

  // ========================================================================
  // STAFF CONTACTS
  // ========================================================================

  public getContacts = async (req: Request, res: Response): Promise<void> => {
    try {
      const staffId = parseInt(req.params.staffId);
      if (isNaN(staffId)) {
        ResponseUtil.error(res, 'Invalid staff ID', 400);
        return;
      }

      const contacts = await this.service.getContactsByStaffId(staffId);
      ResponseUtil.success(res, contacts, 'Contacts retrieved successfully');
    } catch (error: unknown) {
      ResponseUtil.error(res, 'Error fetching contacts', 500, getErrorMessage(error));
    }
  };

  public createContact = async (req: Request, res: Response): Promise<void> => {
    try {
      const staffId = parseInt(req.params.staffId);
      if (isNaN(staffId)) {
        ResponseUtil.error(res, 'Invalid staff ID', 400);
        return;
      }

      const dto = { ...req.body, staff_id: staffId };
      const contactId = await this.service.createContact(dto);

      ResponseUtil.success(res, { contact_id: contactId }, 'Contact created successfully', 201);
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);
      if (errorMessage === 'Staff not found') {
        ResponseUtil.notFound(res, errorMessage);
        return;
      }
      ResponseUtil.error(res, 'Error creating contact', 500, errorMessage);
    }
  };

  public updateContact = async (req: Request, res: Response): Promise<void> => {
    try {
      const contactId = parseInt(req.params.contactId);
      if (isNaN(contactId)) {
        ResponseUtil.error(res, 'Invalid contact ID', 400);
        return;
      }

      await this.service.updateContact(contactId, req.body);
      ResponseUtil.success(res, null, 'Contact updated successfully');
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);
      if (errorMessage === 'Contact not found') {
        ResponseUtil.notFound(res, errorMessage);
        return;
      }
      ResponseUtil.error(res, 'Error updating contact', 500, errorMessage);
    }
  };

  public deleteContact = async (req: Request, res: Response): Promise<void> => {
    try {
      const contactId = parseInt(req.params.contactId);
      if (isNaN(contactId)) {
        ResponseUtil.error(res, 'Invalid contact ID', 400);
        return;
      }

      await this.service.deleteContact(contactId);
      ResponseUtil.success(res, null, 'Contact deleted successfully');
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);
      if (errorMessage === 'Contact not found') {
        ResponseUtil.notFound(res, errorMessage);
        return;
      }
      ResponseUtil.error(res, 'Error deleting contact', 500, errorMessage);
    }
  };

  // ========================================================================
  // FEE SCHEDULES
  // ========================================================================

  public getFees = async (req: Request, res: Response): Promise<void> => {
    try {
      const hospitalId = parseInt(req.params.hospitalId);
      if (isNaN(hospitalId)) {
        ResponseUtil.error(res, 'Invalid hospital ID', 400);
        return;
      }

      const fees = await this.service.getFeesByHospitalId(hospitalId, req.body);
      ResponseUtil.success(res, fees, 'Fees retrieved successfully');
    } catch (error: unknown) {
      ResponseUtil.error(res, 'Error fetching fees', 500, getErrorMessage(error));
    }
  };

  public createFee = async (req: Request, res: Response): Promise<void> => {
    try {
      const hospitalId = parseInt(req.params.hospitalId);
      if (isNaN(hospitalId)) {
        ResponseUtil.error(res, 'Invalid hospital ID', 400);
        return;
      }

      const dto = { ...req.body, hospital_id: hospitalId };
      const feeId = await this.service.createFee(dto);

      ResponseUtil.success(res, { fee_id: feeId }, 'Fee created successfully', 201);
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);
      if (errorMessage === 'Hospital not found') {
        ResponseUtil.notFound(res, errorMessage);
        return;
      }
      ResponseUtil.error(res, 'Error creating fee', 500, errorMessage);
    }
  };

  public updateFee = async (req: Request, res: Response): Promise<void> => {
    try {
      const feeId = parseInt(req.params.feeId);
      if (isNaN(feeId)) {
        ResponseUtil.error(res, 'Invalid fee ID', 400);
        return;
      }

      await this.service.updateFee(feeId, req.body);
      ResponseUtil.success(res, null, 'Fee updated successfully');
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);
      if (errorMessage === 'Fee schedule not found') {
        ResponseUtil.notFound(res, errorMessage);
        return;
      }
      ResponseUtil.error(res, 'Error updating fee', 500, errorMessage);
    }
  };

  public deleteFee = async (req: Request, res: Response): Promise<void> => {
    try {
      const feeId = parseInt(req.params.feeId);
      if (isNaN(feeId)) {
        ResponseUtil.error(res, 'Invalid fee ID', 400);
        return;
      }

      await this.service.deleteFee(feeId);
      ResponseUtil.success(res, null, 'Fee deleted successfully');
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);
      if (errorMessage === 'Fee schedule not found') {
        ResponseUtil.notFound(res, errorMessage);
        return;
      }
      ResponseUtil.error(res, 'Error deleting fee', 500, errorMessage);
    }
  };
}
