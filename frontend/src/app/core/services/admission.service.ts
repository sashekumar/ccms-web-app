import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ApiService } from './api.service';
import { API_ENDPOINTS } from '../constants';
import {
  Admission,
  AdmissionListItem,
  AdmissionWithRemarks,
  CreateAdmissionDto,
  CreateAdmissionResponse,
  UpdateAdmissionDto,
  ApproveAdmissionDto,
  RejectAdmissionDto,
  SendMedicalQueryDto,
  RespondToMQDto,
  DeferAdmissionDto,
  ResolveDefermentDto,
  AdmissionFilters,
  PaginatedAdmissions
} from '../../shared/models/admission.model';

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

/**
 * Admission Service
 * Handles admission operations with v7 schema compliance
 * 
 * Features:
 * - CRUD operations
 * - Workflow: Approve/reject with remarks
 * - GL generation on approval
 * - Lookup-based dropdowns (no hardcoded values)
 */
@Injectable({
  providedIn: 'root'
})
export class AdmissionService {
  constructor(private api: ApiService) {}

  // ============================================================================
  // ADMISSION CRUD
  // ============================================================================

  /**
   * Get paginated list of admissions with filters
   */
  getAdmissions(filters: AdmissionFilters = {}): Observable<PaginatedAdmissions> {
    return this.api.post<ApiResponse<PaginatedAdmissions>>(
      API_ENDPOINTS.ADMISSIONS.LIST,
      filters
    ).pipe(
      map(response => response.data),
      catchError(error => {
        console.error('Error fetching admissions:', error);
        throw error;
      })
    );
  }

  /**
   * Get admission by ID
   */
  getAdmissionById(admission_id: number): Observable<Admission> {
    return this.api.post<ApiResponse<Admission>>(
      API_ENDPOINTS.ADMISSIONS.GET,
      { admission_id }
    ).pipe(
      map(response => response.data),
      catchError(error => {
        console.error('Error fetching admission:', error);
        throw error;
      })
    );
  }

  /**
   * Get admission with workflow history (remarks)
   */
  getAdmissionWithRemarks(admission_id: number): Observable<AdmissionWithRemarks> {
    return this.api.post<ApiResponse<AdmissionWithRemarks>>(
      API_ENDPOINTS.ADMISSIONS.GET_WITH_REMARKS,
      { admission_id }
    ).pipe(
      map(response => response.data),
      catchError(error => {
        console.error('Error fetching admission with remarks:', error);
        throw error;
      })
    );
  }

  /**
   * Create new admission with auto-claim creation
   * Backend creates both claim (CLM-YYYY-NNNNN) and admission
   * Returns: { admission_id, claim_id, claim_ref_no }
   */
  createAdmission(dto: CreateAdmissionDto): Observable<CreateAdmissionResponse> {
    return this.api.post<ApiResponse<CreateAdmissionResponse>>(
      API_ENDPOINTS.ADMISSIONS.CREATE,
      dto
    ).pipe(
      map(response => response.data),
      catchError(error => {
        console.error('Error creating admission:', error);
        throw error;
      })
    );
  }

  /**
   * Update admission details
   */
  updateAdmission(admission_id: number, dto: UpdateAdmissionDto): Observable<void> {
    return this.api.put<ApiResponse<void>>(
      API_ENDPOINTS.ADMISSIONS.UPDATE,
      { admission_id, ...dto }
    ).pipe(
      map(() => undefined),
      catchError(error => {
        console.error('Error updating admission:', error);
        throw error;
      })
    );
  }

  /**
   * Delete admission (soft delete)
   */
  deleteAdmission(admission_id: number): Observable<void> {
    return this.api.post<ApiResponse<void>>(
      API_ENDPOINTS.ADMISSIONS.DELETE,
      { admission_id }
    ).pipe(
      map(() => undefined),
      catchError(error => {
        console.error('Error deleting admission:', error);
        throw error;
      })
    );
  }

  // ============================================================================
  // WORKFLOW: APPROVAL & REJECTION
  // ============================================================================

  /**
   * Approve admission (generates GL)
   * Returns GL reference number
   */
  approveAdmission(admission_id: number, dto: ApproveAdmissionDto): Observable<string> {
    return this.api.post<ApiResponse<{ gl_ref_no: string }>>(
      API_ENDPOINTS.ADMISSIONS.APPROVE,
      { admission_id, ...dto }
    ).pipe(
      map(response => response.data.gl_ref_no),
      catchError(error => {
        console.error('Error approving admission:', error);
        throw error;
      })
    );
  }

  /**
   * Reject admission
   */
  rejectAdmission(admission_id: number, dto: RejectAdmissionDto): Observable<void> {
    return this.api.post<ApiResponse<void>>(
      API_ENDPOINTS.ADMISSIONS.REJECT,
      { admission_id, ...dto }
    ).pipe(
      map(() => undefined),
      catchError(error => {
        console.error('Error rejecting admission:', error);
        throw error;
      })
    );
  }

  // ============================================================================
  // WORKFLOW: MEDICAL QUERY (MQ)
  // ============================================================================

  /**
   * Send Medical Query to hospital
   */
  sendMedicalQuery(admission_id: number, dto: SendMedicalQueryDto): Observable<void> {
    return this.api.post<ApiResponse<void>>(
      API_ENDPOINTS.ADMISSIONS.SEND_MQ,
      { admission_id, ...dto }
    ).pipe(
      map(() => undefined),
      catchError(error => {
        console.error('Error sending medical query:', error);
        throw error;
      })
    );
  }

  /**
   * Respond to Medical Query (Hospital)
   */
  respondToMQ(admission_id: number, dto: RespondToMQDto): Observable<void> {
    return this.api.post<ApiResponse<void>>(
      API_ENDPOINTS.ADMISSIONS.RESPOND_MQ,
      { admission_id, ...dto }
    ).pipe(
      map(() => undefined),
      catchError(error => {
        console.error('Error responding to medical query:', error);
        throw error;
      })
    );
  }

  // ============================================================================
  // WORKFLOW: DEFERMENT
  // ============================================================================

  /**
   * Defer admission for later review
   */
  deferAdmission(admission_id: number, dto: DeferAdmissionDto): Observable<void> {
    return this.api.post<ApiResponse<void>>(
      API_ENDPOINTS.ADMISSIONS.DEFER,
      { admission_id, ...dto }
    ).pipe(
      map(() => undefined),
      catchError(error => {
        console.error('Error deferring admission:', error);
        throw error;
      })
    );
  }

  /**
   * Resolve deferment and continue review
   */
  resolveDeferment(admission_id: number, dto: ResolveDefermentDto): Observable<void> {
    return this.api.post<ApiResponse<void>>(
      API_ENDPOINTS.ADMISSIONS.RESOLVE_DEFERMENT,
      { admission_id, ...dto }
    ).pipe(
      map(() => undefined),
      catchError(error => {
        console.error('Error resolving deferment:', error);
        throw error;
      })
    );
  }

  /**
   * Get global medical query history (across all admissions) with pagination and filters
   */
  getGlobalMQHistory(filters: any = {}): Observable<{ data: any[], total: number }> {
    return this.api.post<ApiResponse<{ data: any[], total: number }>>(
      API_ENDPOINTS.ADMISSIONS.GET_MQ_HISTORY,
      filters
    ).pipe(
      map(response => response.data),
      catchError(error => {
        console.error('Error fetching global MQ history:', error);
        throw error;
      })
    );
  }

  /**
   * Update MQ status manually
   */
  updateMQStatus(admission_id: number, status: string): Observable<void> {
    return this.api.post<ApiResponse<void>>(
      API_ENDPOINTS.ADMISSIONS.UPDATE_MQ_STATUS,
      { admission_id, status }
    ).pipe(
      map(() => undefined),
      catchError(error => {
        console.error('Error updating MQ status:', error);
        throw error;
      })
    );
  }
}
