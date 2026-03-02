import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ApiService } from './api.service';
import { API_ENDPOINTS } from '../constants';
import {
  Hospital,
  HospitalListItem,
  CreateHospitalDto,
  UpdateHospitalDto,
  HospitalFilters,
  PaginatedHospitals,
  HospitalStats,
  HospitalAddress,
  HospitalCode,
  HospitalStaff,
  HospitalStaffContact,
  FeeSchedule
} from '../../shared/models/hospital.model';

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

/**
 * Hospital Service - Handles hospital management operations
 */
@Injectable({
  providedIn: 'root'
})
export class HospitalService {
  constructor(private api: ApiService) {}

  /**
   * Get paginated list of hospitals with filters
   */
  getHospitals(filters: HospitalFilters = {}): Observable<PaginatedHospitals> {
    return this.api.post<ApiResponse<PaginatedHospitals>>(
      API_ENDPOINTS.HOSPITALS.LIST,
      filters
    ).pipe(
      map(response => response.data),
      catchError(error => {
        console.error('Error fetching hospitals:', error);
        throw error;
      })
    );
  }

  /**
   * Get hospital by ID
   */
  getHospitalById(hospital_id: string): Observable<Hospital> {
    return this.api.post<ApiResponse<Hospital>>(
      API_ENDPOINTS.HOSPITALS.GET,
      { hospital_id }
    ).pipe(
      map(response => response.data),
      catchError(error => {
        console.error('Error fetching hospital:', error);
        throw error;
      })
    );
  }

  /**
   * Create new hospital
   */
  createHospital(dto: CreateHospitalDto): Observable<string> {
    return this.api.post<ApiResponse<{ hospital_id: string }>>(
      API_ENDPOINTS.HOSPITALS.CREATE,
      dto
    ).pipe(
      map(response => response.data.hospital_id),
      catchError(error => {
        console.error('Error creating hospital:', error);
        throw error;
      })
    );
  }

  /**
   * Update hospital
   */
  updateHospital(hospital_id: string, dto: UpdateHospitalDto): Observable<void> {
    return this.api.put<ApiResponse<void>>(
      API_ENDPOINTS.HOSPITALS.UPDATE,
      { hospital_id, ...dto }
    ).pipe(
      map(() => undefined),
      catchError(error => {
        console.error('Error updating hospital:', error);
        throw error;
      })
    );
  }

  /**
   * Delete hospital (soft delete)
   */
  deleteHospital(hospital_id: string): Observable<void> {
    return this.api.post<ApiResponse<void>>(
      API_ENDPOINTS.HOSPITALS.DELETE,
      { hospital_id }
    ).pipe(
      map(() => undefined),
      catchError(error => {
        console.error('Error deleting hospital:', error);
        throw error;
      })
    );
  }

  /**
   * Check if hospital code is available
   */
  checkHospitalCode(hospital_code: string, exclude_hospital_id?: string): Observable<boolean> {
    const payload: any = { hospital_code };
    if (exclude_hospital_id) {
      payload.exclude_hospital_id = exclude_hospital_id;
    }
    return this.api.post<ApiResponse<{ available: boolean }>>(
      API_ENDPOINTS.HOSPITALS.CHECK_CODE,
      payload
    ).pipe(
      map(response => response.data.available),
      catchError(error => {
        console.error('Error checking hospital code:', error);
        throw error;
      })
    );
  }

  // ============================================================================
  // ADDRESS MANAGEMENT
  // ============================================================================

  /**
   * Get all addresses for a hospital
   */
  getHospitalAddresses(hospital_id: string): Observable<HospitalAddress[]> {
    return this.api.post<ApiResponse<HospitalAddress[]>>(
      API_ENDPOINTS.HOSPITALS.ADDRESSES.list(hospital_id),
      { hospital_id }
    ).pipe(
      map(response => response.data),
      catchError(error => {
        console.error('Error fetching hospital addresses:', error);
        throw error;
      })
    );
  }

  /**
   * Create hospital address
   */
  createHospitalAddress(hospital_id: string, dto: Partial<HospitalAddress>): Observable<string> {
    return this.api.post<ApiResponse<{ address_id: string }>>(
      API_ENDPOINTS.HOSPITALS.ADDRESSES.create(hospital_id),
      dto
    ).pipe(
      map(response => response.data.address_id),
      catchError(error => {
        console.error('Error creating hospital address:', error);
        throw error;
      })
    );
  }

  /**
   * Update hospital address
   */
  updateHospitalAddress(hospital_id: string, address_id: string, dto: Partial<HospitalAddress>): Observable<void> {
    return this.api.put<ApiResponse<void>>(
      API_ENDPOINTS.HOSPITALS.ADDRESSES.update(hospital_id, address_id),
      dto
    ).pipe(
      map(() => undefined),
      catchError(error => {
        console.error('Error updating hospital address:', error);
        throw error;
      })
    );
  }

  /**
   * Delete hospital address
   */
  deleteHospitalAddress(hospital_id: string, address_id: string): Observable<void> {
    return this.api.delete<ApiResponse<void>>(
      API_ENDPOINTS.HOSPITALS.ADDRESSES.delete(hospital_id, address_id)
    ).pipe(
      map(() => undefined),
      catchError(error => {
        console.error('Error deleting hospital address:', error);
        throw error;
      })
    );
  }

  // ============================================================================
  // CODE MANAGEMENT
  // ============================================================================

  /**
   * Get all codes for a hospital
   */
  getHospitalCodes(hospital_id: string): Observable<HospitalCode[]> {
    return this.api.post<ApiResponse<HospitalCode[]>>(
      API_ENDPOINTS.HOSPITALS.CODES.list(hospital_id),
      { hospital_id }
    ).pipe(
      map(response => response.data),
      catchError(error => {
        console.error('Error fetching hospital codes:', error);
        throw error;
      })
    );
  }

  /**
   * Create hospital code
   */
  createHospitalCode(hospital_id: string, dto: Partial<HospitalCode>): Observable<string> {
    return this.api.post<ApiResponse<{ code_id: string }>>(
      API_ENDPOINTS.HOSPITALS.CODES.create(hospital_id),
      dto
    ).pipe(
      map(response => response.data.code_id),
      catchError(error => {
        console.error('Error creating hospital code:', error);
        throw error;
      })
    );
  }

  /**
   * Update hospital code
   */
  updateHospitalCode(hospital_id: string, code_id: string, dto: Partial<HospitalCode>): Observable<void> {
    return this.api.put<ApiResponse<void>>(
      API_ENDPOINTS.HOSPITALS.CODES.update(hospital_id, code_id),
      dto
    ).pipe(
      map(() => undefined),
      catchError(error => {
        console.error('Error updating hospital code:', error);
        throw error;
      })
    );
  }

  /**
   * Delete hospital code
   */
  deleteHospitalCode(hospital_id: string, code_id: string): Observable<void> {
    return this.api.delete<ApiResponse<void>>(
      API_ENDPOINTS.HOSPITALS.CODES.delete(hospital_id, code_id)
    ).pipe(
      map(() => undefined),
      catchError(error => {
        console.error('Error deleting hospital code:', error);
        throw error;
      })
    );
  }

  // ============================================================================
  // STAFF MANAGEMENT
  // ============================================================================

  /**
   * Get all staff for a hospital
   */
  getHospitalStaff(hospital_id: string): Observable<HospitalStaff[]> {
    return this.api.post<ApiResponse<HospitalStaff[]>>(
      API_ENDPOINTS.HOSPITALS.STAFF.list(hospital_id),
      { hospital_id }
    ).pipe(
      map(response => response.data),
      catchError(error => {
        console.error('Error fetching hospital staff:', error);
        throw error;
      })
    );
  }

  /**
   * Create hospital staff
   */
  createHospitalStaff(hospital_id: string, dto: Partial<HospitalStaff>): Observable<string> {
    return this.api.post<ApiResponse<{ staff_id: string }>>(
      API_ENDPOINTS.HOSPITALS.STAFF.create(hospital_id),
      dto
    ).pipe(
      map(response => response.data.staff_id),
      catchError(error => {
        console.error('Error creating hospital staff:', error);
        throw error;
      })
    );
  }

  /**
   * Update hospital staff
   */
  updateHospitalStaff(hospital_id: string, staff_id: string, dto: Partial<HospitalStaff>): Observable<void> {
    return this.api.put<ApiResponse<void>>(
      API_ENDPOINTS.HOSPITALS.STAFF.update(hospital_id, staff_id),
      dto
    ).pipe(
      map(() => undefined),
      catchError(error => {
        console.error('Error updating hospital staff:', error);
        throw error;
      })
    );
  }

  /**
   * Delete hospital staff
   */
  deleteHospitalStaff(hospital_id: string, staff_id: string): Observable<void> {
    return this.api.delete<ApiResponse<void>>(
      API_ENDPOINTS.HOSPITALS.STAFF.delete(hospital_id, staff_id)
    ).pipe(
      map(() => undefined),
      catchError(error => {
        console.error('Error deleting hospital staff:', error);
        throw error;
      })
    );
  }

  // ============================================================================
  // FEE SCHEDULE MANAGEMENT
  // ============================================================================

  /**
   * Get fee schedules for a hospital
   */
  getHospitalFees(hospital_id: string, fee_type?: string): Observable<FeeSchedule[]> {
    const payload: any = { hospital_id };
    if (fee_type) {
      payload.fee_type = fee_type;
    }
    return this.api.post<ApiResponse<FeeSchedule[]>>(
      API_ENDPOINTS.HOSPITALS.FEES.list(hospital_id),
      payload
    ).pipe(
      map(response => response.data),
      catchError(error => {
        console.error('Error fetching hospital fees:', error);
        throw error;
      })
    );
  }

  createHospitalFee(hospital_id: string, dto: Partial<FeeSchedule>): Observable<string> {
    return this.api.post<ApiResponse<string>>(
      API_ENDPOINTS.HOSPITALS.FEES.create(hospital_id),
      dto
    ).pipe(
      map(response => response.data)
    );
  }

  updateHospitalFee(hospital_id: string, fee_id: string, dto: Partial<FeeSchedule>): Observable<void> {
    return this.api.put<ApiResponse<void>>(
      API_ENDPOINTS.HOSPITALS.FEES.update(hospital_id, fee_id),
      dto
    ).pipe(
      map(() => undefined)
    );
  }

  deleteHospitalFee(hospital_id: string, fee_id: string): Observable<void> {
    return this.api.delete<ApiResponse<void>>(
      API_ENDPOINTS.HOSPITALS.FEES.delete(hospital_id, fee_id)
    ).pipe(
      map(() => undefined)
    );
  }

  // ============================================================================
  // STAFF CONTACTS
  // ============================================================================

  getStaffContacts(hospital_id: string, staff_id: string): Observable<HospitalStaffContact[]> {
    return this.api.post<ApiResponse<HospitalStaffContact[]>>(
      API_ENDPOINTS.HOSPITALS.CONTACTS.list(hospital_id, staff_id),
      { staff_id }
    ).pipe(
      map(response => response.data)
    );
  }

  createStaffContact(hospital_id: string, staff_id: string, dto: Partial<HospitalStaffContact>): Observable<string> {
    return this.api.post<ApiResponse<string>>(
      API_ENDPOINTS.HOSPITALS.CONTACTS.create(hospital_id, staff_id),
      dto
    ).pipe(
      map(response => response.data)
    );
  }

  updateStaffContact(hospital_id: string, staff_id: string, contact_id: string, dto: Partial<HospitalStaffContact>): Observable<void> {
    return this.api.put<ApiResponse<void>>(
      API_ENDPOINTS.HOSPITALS.CONTACTS.update(hospital_id, staff_id, contact_id),
      dto
    ).pipe(
      map(() => undefined)
    );
  }

  deleteStaffContact(hospital_id: string, staff_id: string, contact_id: string): Observable<void> {
    return this.api.delete<ApiResponse<void>>(
      API_ENDPOINTS.HOSPITALS.CONTACTS.delete(hospital_id, staff_id, contact_id)
    ).pipe(
      map(() => undefined)
    );
  }
}
