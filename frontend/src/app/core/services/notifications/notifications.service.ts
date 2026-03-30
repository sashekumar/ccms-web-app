/**
 * Notifications Log - Angular Service
 * Handles API communication for notification log operations
 */

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '../api.service';
import {
  NotificationLogRecord,
  NotificationFilters,
  NotificationsStatsResponse,
  PaginatedNotificationResponse,
  ApiResponse
} from '../../../shared/models/notifications/notifications.model';

@Injectable({
  providedIn: 'root'
})
export class NotificationsService {
  private apiUrl = 'notifications';

  constructor(private apiService: ApiService) {}

  // ========================================================================
  // STATISTICS
  // ========================================================================

  getStats(): Observable<NotificationsStatsResponse> {
    return this.apiService.post<ApiResponse<NotificationsStatsResponse>>(
      `${this.apiUrl}/stats`,
      {}
    ).pipe(
      map(res => res.data)
    );
  }

  // ========================================================================
  // NOTIFICATION LOG OPERATIONS
  // ========================================================================

  getNotifications(
    filters: NotificationFilters = {},
    page: number = 1,
    limit: number = 10
  ): Observable<PaginatedNotificationResponse<NotificationLogRecord>> {
    return this.apiService.post<PaginatedNotificationResponse<NotificationLogRecord>>(
      `${this.apiUrl}/notifications`,
      { filters, page, limit }
    );
  }

  createNotification(dto: Partial<NotificationLogRecord>): Observable<NotificationLogRecord> {
    return this.apiService.post<ApiResponse<NotificationLogRecord>>(
      `${this.apiUrl}/notifications/create`,
      dto
    ).pipe(
      map(res => res.data)
    );
  }

  updateNotification(log_id: bigint, dto: Partial<NotificationLogRecord>): Observable<NotificationLogRecord> {
    return this.apiService.put<ApiResponse<NotificationLogRecord>>(
      `${this.apiUrl}/notifications/${log_id}`,
      dto
    ).pipe(
      map(res => res.data)
    );
  }
}
