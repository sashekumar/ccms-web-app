/**
 * Audit Trail - Angular Service
 * Handles API communication for audit trail operations
 */

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '../api.service';
import {
  AuditLogFilters,
  AdmissionLogFilters,
  AuditLogRecord,
  AdmissionLogRecord,
  AuditTrailStatsResponse,
  PaginatedAuditResponse,
  ApiResponse
} from '../../../shared/models/audit-trail/audit-trail.model';

@Injectable({
  providedIn: 'root'
})
export class AuditTrailService {
  private apiUrl = 'audit-trail';

  constructor(private apiService: ApiService) {}

  // ========================================================================
  // STATISTICS
  // ========================================================================

  getStats(): Observable<AuditTrailStatsResponse> {
    return this.apiService.post<ApiResponse<AuditTrailStatsResponse>>(
      `${this.apiUrl}/stats`,
      {}
    ).pipe(
      map(res => res.data)
    );
  }

  // ========================================================================
  // AUDIT LOGS
  // ========================================================================

  getAuditLogs(
    filters: AuditLogFilters = {},
    page: number = 1,
    limit: number = 10
  ): Observable<PaginatedAuditResponse<AuditLogRecord>> {
    return this.apiService.post<PaginatedAuditResponse<AuditLogRecord>>(
      `${this.apiUrl}/audit-logs`,
      { filters, page, limit }
    );
  }

  createAuditLog(dto: Partial<AuditLogRecord>): Observable<AuditLogRecord> {
    return this.apiService.post<ApiResponse<AuditLogRecord>>(
      `${this.apiUrl}/audit-logs/create`,
      dto
    ).pipe(
      map(res => res.data)
    );
  }

  updateAuditLog(audit_id: bigint, dto: Partial<AuditLogRecord>): Observable<AuditLogRecord> {
    return this.apiService.put<ApiResponse<AuditLogRecord>>(
      `${this.apiUrl}/audit-logs/${audit_id}`,
      dto
    ).pipe(
      map(res => res.data)
    );
  }

  // ========================================================================
  // ADMISSION LOGS
  // ========================================================================

  getAdmissionLogs(
    filters: AdmissionLogFilters = {},
    page: number = 1,
    limit: number = 10
  ): Observable<PaginatedAuditResponse<AdmissionLogRecord>> {
    return this.apiService.post<PaginatedAuditResponse<AdmissionLogRecord>>(
      `${this.apiUrl}/admission-logs`,
      { filters, page, limit }
    );
  }

  createAdmissionLog(dto: Partial<AdmissionLogRecord>): Observable<AdmissionLogRecord> {
    return this.apiService.post<ApiResponse<AdmissionLogRecord>>(
      `${this.apiUrl}/admission-logs/create`,
      dto
    ).pipe(
      map(res => res.data)
    );
  }

  updateAdmissionLog(log_id: bigint, dto: Partial<AdmissionLogRecord>): Observable<AdmissionLogRecord> {
    return this.apiService.put<ApiResponse<AdmissionLogRecord>>(
      `${this.apiUrl}/admission-logs/${log_id}`,
      dto
    ).pipe(
      map(res => res.data)
    );
  }
}
