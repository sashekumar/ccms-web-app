import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  LOSAlertRecord,
  LOSMonitoringFilters,
  LOSMonitoringStatsResponse,
  PaginatedLOSMonitoringResponse,
  ApiResponse,
} from '../../models/los-monitoring/los-monitoring.model';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class LOSMonitoringService {
  private apiUrl = `${environment.apiUrl}/los-monitoring`;

  constructor(private http: HttpClient) {}

  /**
   * Get all LOS alerts with pagination and filtering
   */
  getLOSAlerts(
    page: number = 1,
    limit: number = 20,
    filters?: LOSMonitoringFilters
  ): Observable<PaginatedLOSMonitoringResponse<LOSAlertRecord>> {
    const payload = {
      page,
      limit,
      filters: filters || {}
    };

    return this.http.post<PaginatedLOSMonitoringResponse<LOSAlertRecord>>(
      `${this.apiUrl}/alerts`,
      payload
    );
  }

  /**
   * Get LOS alert by ID
   */
  getLOSAlert(alertId: bigint): Observable<ApiResponse<LOSAlertRecord>> {
    // Note: Backend doesn't have a direct endpoint for getting by alert ID
    // This method may need to be refactored or use the alerts endpoint with filtering
    return this.http.get<ApiResponse<LOSAlertRecord>>(
      `${this.apiUrl}/alerts/${alertId}`
    );
  }

  /**
   * Acknowledge an LOS alert
   */
  acknowledgeLOSAlert(
    alertId: bigint,
    acknowledgedBy: string,
    notes?: string
  ): Observable<ApiResponse<LOSAlertRecord>> {
    const payload = {
      acknowledged_by: acknowledgedBy,
      notes: notes || null,
    };
    return this.http.patch<ApiResponse<LOSAlertRecord>>(
      `${this.apiUrl}/${alertId}/acknowledge`,
      payload
    );
  }

  /**
   * Get LOS monitoring statistics
   */
  getLOSStats(): Observable<ApiResponse<LOSMonitoringStatsResponse>> {
    return this.http.post<ApiResponse<LOSMonitoringStatsResponse>>(
      `${this.apiUrl}/stats`,
      {}
    );
  }

  /**
   * Get alerts by admission ID
   */
  getAdmissionLOSAlerts(
    admissionId: bigint,
    page: number = 1,
    limit: number = 20
  ): Observable<PaginatedLOSMonitoringResponse<LOSAlertRecord>> {
    const payload = {
      page,
      limit,
      filters: { admission_id: admissionId }
    };

    return this.http.post<PaginatedLOSMonitoringResponse<LOSAlertRecord>>(
      `${this.apiUrl}/alerts`,
      payload
    );
  }

  /**
   * Get alerts by status
   */
  getAlertsByStatus(
    status: string,
    page: number = 1,
    limit: number = 20
  ): Observable<PaginatedLOSMonitoringResponse<LOSAlertRecord>> {
    const payload = {
      page,
      limit,
      filters: { status }
    };

    return this.http.post<PaginatedLOSMonitoringResponse<LOSAlertRecord>>(
      `${this.apiUrl}/alerts`,
      payload
    );
  }
}
