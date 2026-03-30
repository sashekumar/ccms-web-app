import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  EightHourMonitoringRecord,
  EightHourMonitoringFilters,
  EightHourMonitoringStatsResponse,
  PaginatedEightHourMonitoringResponse,
  ApiResponse,
} from '../../models/eight-hour-monitoring/eight-hour-monitoring.model';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class EightHourMonitoringService {
  private apiUrl = `${environment.apiUrl}/eight-hour-monitoring`;

  constructor(private http: HttpClient) {}

  /**
   * Get all 8-hour monitoring checks with pagination and filtering
   */
  getChecks(
    page: number = 1,
    limit: number = 20,
    filters?: EightHourMonitoringFilters
  ): Observable<PaginatedEightHourMonitoringResponse<EightHourMonitoringRecord>> {
    const payload = {
      page,
      limit,
      filters: filters || {}
    };

    return this.http.post<PaginatedEightHourMonitoringResponse<EightHourMonitoringRecord>>(
      `${this.apiUrl}/checks`,
      payload
    );
  }

  /**
   * Get 8-hour check by ID
   */
  getCheck(
    monitoringId: bigint
  ): Observable<ApiResponse<EightHourMonitoringRecord>> {
    // Note: Backend doesn't have a direct endpoint for getting by check ID
    // This method may need to be refactored or use the checks endpoint with filtering
    return this.http.get<ApiResponse<EightHourMonitoringRecord>>(
      `${this.apiUrl}/checks/${monitoringId}`
    );
  }

  /**
   * Record an 8-hour check completion
   */
  recordCheck(
    monitoringId: bigint,
    notes?: string
  ): Observable<ApiResponse<EightHourMonitoringRecord>> {
    const payload = {
      notes: notes || null,
    };
    return this.http.patch<ApiResponse<EightHourMonitoringRecord>>(
      `${this.apiUrl}/${monitoringId}/record`,
      payload
    );
  }

  /**
   * Get 8-hour monitoring statistics
   */
  getStats(): Observable<ApiResponse<EightHourMonitoringStatsResponse>> {
    return this.http.post<ApiResponse<EightHourMonitoringStatsResponse>>(
      `${this.apiUrl}/stats`,
      {}
    );
  }

  /**
   * Get checks by admission ID
   */
  getAdmissionChecks(
    admissionId: bigint,
    page: number = 1,
    limit: number = 20
  ): Observable<PaginatedEightHourMonitoringResponse<EightHourMonitoringRecord>> {
    const payload = {
      page,
      limit,
      filters: { admission_id: admissionId }
    };

    return this.http.post<PaginatedEightHourMonitoringResponse<EightHourMonitoringRecord>>(
      `${this.apiUrl}/checks`,
      payload
    );
  }

  /**
   * Get checks by status
   */
  getChecksByStatus(
    status: string,
    page: number = 1,
    limit: number = 20
  ): Observable<PaginatedEightHourMonitoringResponse<EightHourMonitoringRecord>> {
    const payload = {
      page,
      limit,
      filters: { status }
    };

    return this.http.post<PaginatedEightHourMonitoringResponse<EightHourMonitoringRecord>>(
      `${this.apiUrl}/checks`,
      payload
    );
  }
}
