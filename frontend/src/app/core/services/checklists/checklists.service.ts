/**
 * Checklists - Angular Service
 * Handles API communication for checklist operations
 */

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '../api.service';
import {
  ChecklistRecord,
  ChecklistFilters,
  ChecklistsStatsResponse,
  PaginatedChecklistResponse,
  ApiResponse
} from '../../../shared/models/checklists/checklists.model';

@Injectable({
  providedIn: 'root'
})
export class ChecklistsService {
  private apiUrl = 'checklists';

  constructor(private apiService: ApiService) {}

  // ========================================================================
  // STATISTICS
  // ========================================================================

  getStats(): Observable<ChecklistsStatsResponse> {
    return this.apiService.post<ApiResponse<ChecklistsStatsResponse>>(
      `${this.apiUrl}/stats`,
      {}
    ).pipe(
      map(res => res.data)
    );
  }

  // ========================================================================
  // CHECKLIST OPERATIONS
  // ========================================================================

  getChecklists(
    filters: ChecklistFilters = {},
    page: number = 1,
    limit: number = 10
  ): Observable<PaginatedChecklistResponse<ChecklistRecord>> {
    return this.apiService.post<PaginatedChecklistResponse<ChecklistRecord>>(
      `${this.apiUrl}/checklists`,
      { filters, page, limit }
    );
  }

  getClaimChecklists(claim_id: bigint): Observable<ChecklistRecord[]> {
    return this.apiService.get<ApiResponse<ChecklistRecord[]>>(
      `${this.apiUrl}/checklists/claim/${claim_id}`
    ).pipe(
      map(res => res.data)
    );
  }

  createChecklist(dto: Partial<ChecklistRecord>): Observable<ChecklistRecord> {
    return this.apiService.post<ApiResponse<ChecklistRecord>>(
      `${this.apiUrl}/checklists/create`,
      dto
    ).pipe(
      map(res => res.data)
    );
  }

  updateChecklist(checklist_id: bigint, dto: Partial<ChecklistRecord>): Observable<ChecklistRecord> {
    return this.apiService.put<ApiResponse<ChecklistRecord>>(
      `${this.apiUrl}/checklists/${checklist_id}`,
      dto
    ).pipe(
      map(res => res.data)
    );
  }

  deleteChecklist(checklist_id: bigint): Observable<{ deleted: boolean }> {
    return this.apiService.delete<ApiResponse<{ deleted: boolean }>>(
      `${this.apiUrl}/checklists/${checklist_id}`
    ).pipe(
      map(res => res.data)
    );
  }
}
