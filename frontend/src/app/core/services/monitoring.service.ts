import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ApiService } from './api.service';
import { API_ENDPOINTS } from '../constants';
import {
  LOSAlert,
  EightHourCheck,
  AcknowledgeAlertDto,
  RecordCheckDto,
  MonitoringFilters,
  PaginatedLOSAlerts,
  Paginated8HMChecks
} from '../../shared/models/monitoring.model';

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

/**
 * Monitoring Service
 * Handles 8-Hour Monitoring and LOS Alert operations
 * 
 * Features:
 * - View LOS alerts with filters
 * - Acknowledge alerts
 * - View 8HM checks
 * - Record monitoring checks
 */
@Injectable({
  providedIn: 'root'
})
export class MonitoringService {
  constructor(private api: ApiService) {}

  /**
   * Get active LOS alerts with filters
   */
  getLOSAlerts(filters: MonitoringFilters = {}): Observable<PaginatedLOSAlerts> {
    return this.api.post<ApiResponse<PaginatedLOSAlerts>>(
      API_ENDPOINTS.MONITORING.LOS_ALERTS,
      filters
    ).pipe(
      map(response => response.data),
      catchError(error => {
        console.error('Error fetching LOS alerts:', error);
        throw error;
      })
    );
  }

  /**
   * Acknowledge LOS alert
   */
  acknowledgeAlert(dto: AcknowledgeAlertDto): Observable<void> {
    return this.api.post<ApiResponse<void>>(
      API_ENDPOINTS.MONITORING.ACKNOWLEDGE_ALERT,
      dto
    ).pipe(
      map(() => undefined),
      catchError(error => {
        console.error('Error acknowledging alert:', error);
        throw error;
      })
    );
  }

  /**
   * Get 8-hour monitoring checks
   */
  get8HMChecks(filters: MonitoringFilters = {}): Observable<Paginated8HMChecks> {
    return this.api.post<ApiResponse<Paginated8HMChecks>>(
      API_ENDPOINTS.MONITORING.EIGHT_HM_CHECKS,
      filters
    ).pipe(
      map(response => response.data),
      catchError(error => {
        console.error('Error fetching 8HM checks:', error);
        throw error;
      })
    );
  }

  /**
   * Record 8-hour monitoring check
   */
  recordCheck(dto: RecordCheckDto): Observable<void> {
    return this.api.post<ApiResponse<void>>(
      API_ENDPOINTS.MONITORING.RECORD_CHECK,
      dto
    ).pipe(
      map(() => undefined),
      catchError(error => {
        console.error('Error recording check:', error);
        throw error;
      })
    );
  }
}
