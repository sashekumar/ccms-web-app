import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../api.service';
import {
  CreateEscalationDto,
  UpdateEscalationDto,
  AddEscalationUpdateDto,
  CloseEscalationDto,
  EscalationResponse,
  PaginatedResponse
} from '../../../shared/models/escalation.model';

@Injectable({
  providedIn: 'root'
})
export class EscalationService {
  private apiEndpoint = 'escalations';

  constructor(private apiService: ApiService) {}

  /**
   * Retrieve paginated list of escalations (POST)
   * @param page Page number (1-indexed)
   * @param pageSize Number of records per page
   * @param filters Optional filters: status, priority, assigned_to, source_id
   * @returns Observable of paginated escalations
   */
  getEscalations(
    page: number = 1,
    pageSize: number = 10,
    filters?: { status?: string; priority?: string; assigned_to?: number; source_id?: number }
  ): Observable<PaginatedResponse<EscalationResponse>> {
    const payload: any = {
      page,
      pageSize,
      ...filters
    };

    return this.apiService.post<PaginatedResponse<EscalationResponse>>(`${this.apiEndpoint}`, payload);
  }

  /**
   * Retrieve escalation by ID (POST)
   * @param escalationId Escalation ID
   * @returns Observable of escalation details with updates
   */
  getEscalationById(escalationId: number): Observable<EscalationResponse> {
    return this.apiService.post<EscalationResponse>(`${this.apiEndpoint}/${escalationId}`, {});
  }

  /**
   * Update escalation status/priority/deadline (PUT)
   * @param escalationId Escalation ID
   * @param updateDto Update payload
   * @returns Observable of updated escalation
   */
  updateEscalation(escalationId: number, updateDto: UpdateEscalationDto): Observable<EscalationResponse> {
    return this.apiService.put<EscalationResponse>(`${this.apiEndpoint}/${escalationId}`, updateDto);
  }

  /**
   * Assign escalation to an officer
   * @param escalationId Escalation ID
   * @param assignedToUserId User ID to assign to
   * @param remarks Optional assignment remarks
   * @returns Observable of updated escalation
   */
  assignEscalation(
    escalationId: number,
    assignedToUserId: number,
    remarks?: string
  ): Observable<EscalationResponse> {
    const payload: UpdateEscalationDto = {
      assigned_to: assignedToUserId,
      status: 'ASSIGNED'
    };
    
    if (remarks) {
      payload.remarks = remarks;
    }

    return this.apiService.put<EscalationResponse>(`${this.apiEndpoint}/${escalationId}`, payload);
  }

  /**
   * Add an update/note to escalation
   * @param escalationId Escalation ID
   * @param addUpdateDto Update details
   * @returns Observable of created update
   */
  addEscalationUpdate(escalationId: number, addUpdateDto: AddEscalationUpdateDto): Observable<any> {
    return this.apiService.post(`${this.apiEndpoint}/${escalationId}/updates`, addUpdateDto);
  }

  /**
   * Retrieve updates/notes for an escalation (POST)
   * @param escalationId Escalation ID
   * @returns Observable of escalation updates
   */
  getEscalationUpdates(escalationId: number): Observable<any[]> {
    return this.apiService.post<any[]>(`${this.apiEndpoint}/${escalationId}/updates/list`, {});
  }

  /**
   * Close escalation
   * @param escalationId Escalation ID
   * @param closeDto Closure details
   * @returns Observable of closed escalation
   */
  closeEscalation(escalationId: number, closeDto: CloseEscalationDto): Observable<EscalationResponse> {
    return this.apiService.post<EscalationResponse>(`${this.apiEndpoint}/${escalationId}/close`, closeDto);
  }

  /**
   * Retrieve escalation sources (reference data - POST)
   * @returns Observable of escalation sources
   */
  getEscalationSources(): Observable<any[]> {
    return this.apiService.post<any[]>(`${this.apiEndpoint}/lookups/sources`, {});
  }

  /**
   * Retrieve escalation natures (reference data - POST)
   * @returns Observable of escalation natures
   */
  getEscalationNatures(): Observable<any[]> {
    return this.apiService.post<any[]>(`${this.apiEndpoint}/lookups/natures`, {});
  }
}
