import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../api.service';
import {
  InvestigationResponse,
  CreateInvestigationDto,
  UpdateInvestigationDto,
  CreateInvestigationRequestDto,
  UpdateInvestigationRequestDto,
  CreateInvestigationCallLogDto,
  CloseInvestigationDto,
  InvestigationFilters,
  PaginatedInvestigationsResponse,
  InvestigationStats
} from '../../../shared/models/investigation.model';

/**
 * Investigation Service
 * Handles API communication for medical investigation case management
 * 
 * Features:
 * - Fetch investigations with filtering
 * - Create and manage investigation cases
 * - Track document/info requests
 * - Log investigation calls
 * - Close investigations with final findings
 */
@Injectable({
  providedIn: 'root'
})
export class InvestigationService {
  private apiEndpoint = 'investigations';

  constructor(private apiService: ApiService) {}

  /**
   * Get investigations with filters
   * POST /api/investigations
   */
  getInvestigations(filters: InvestigationFilters = {}): Observable<PaginatedInvestigationsResponse> {
    const payload = {
      page: filters.page || 1,
      limit: filters.limit || 10,
      status: filters.status,
      claim_id: filters.claim_id,
      clinic_id: filters.clinic_id,
      sortBy: filters.sortBy || 'created_at',
      sortOrder: filters.sortOrder || 'DESC',
      searchTerm: filters.searchTerm
    };

    return this.apiService.post<PaginatedInvestigationsResponse>(this.apiEndpoint, payload);
  }

  /**
   * Get single investigation by ID
   * POST /api/investigations/:id
   */
  getInvestigationById(ixId: number): Observable<InvestigationResponse> {
    return this.apiService.post<InvestigationResponse>(`${this.apiEndpoint}/${ixId}`, {});
  }

  /**
   * Create investigation case
   * POST /api/investigations/create
   */
  createInvestigation(dto: CreateInvestigationDto): Observable<InvestigationResponse> {
    return this.apiService.post<InvestigationResponse>(`${this.apiEndpoint}/create`, dto);
  }

  /**
   * Update investigation status and findings
   * PUT /api/investigations/:id
   */
  updateInvestigation(ixId: number, dto: UpdateInvestigationDto): Observable<InvestigationResponse> {
    return this.apiService.put<InvestigationResponse>(`${this.apiEndpoint}/${ixId}`, dto);
  }

  /**
   * Close investigation
   * PUT /api/investigations/:id/close
   */
  closeInvestigation(ixId: number, dto: CloseInvestigationDto): Observable<InvestigationResponse> {
    return this.apiService.put<InvestigationResponse>(`${this.apiEndpoint}/${ixId}/close`, dto);
  }

  /**
   * Add investigation request (document/info request)
   * POST /api/investigations/:id/requests
   */
  addInvestigationRequest(ixId: number, dto: CreateInvestigationRequestDto): Observable<any> {
    return this.apiService.post<any>(`${this.apiEndpoint}/${ixId}/requests`, dto);
  }

  /**
   * Get investigation requests
   * POST /api/investigations/:id/requests/list
   */
  getInvestigationRequests(ixId: number): Observable<any[]> {
    return this.apiService.post<any[]>(`${this.apiEndpoint}/${ixId}/requests/list`, {});
  }

  /**
   * Update investigation request status
   * PUT /api/investigations/requests/:requestId
   */
  updateInvestigationRequest(requestId: number, dto: UpdateInvestigationRequestDto): Observable<void> {
    return this.apiService.put<void>(`${this.apiEndpoint}/requests/${requestId}`, dto);
  }

  /**
   * Add call log
   * POST /api/investigations/:id/calls
   */
  addCallLog(ixId: number, dto: CreateInvestigationCallLogDto): Observable<any> {
    return this.apiService.post<any>(`${this.apiEndpoint}/${ixId}/calls`, dto);
  }

  /**
   * Get call logs
   * POST /api/investigations/:id/calls/list
   */
  getCallLogs(ixId: number): Observable<any[]> {
    return this.apiService.post<any[]>(`${this.apiEndpoint}/${ixId}/calls/list`, {});
  }

  /**
   * Get investigation statistics
   * POST /api/investigations/stats
   */
  getInvestigationStats(): Observable<InvestigationStats> {
    return this.apiService.post<InvestigationStats>(`${this.apiEndpoint}/stats`, {});
  }
}
