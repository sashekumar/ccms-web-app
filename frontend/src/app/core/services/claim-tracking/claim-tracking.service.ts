import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '../api.service';
import {
  StatusLogFilters, MilestoneFilters, DurationFilters,
  StatusLogRecord, MilestoneRecord, DurationRecord,
  ClaimTrackingStatsResponse, ClaimHistory,
  PaginatedTrackingResponse,
  ApiResponse
} from '../../../shared/models/claim-tracking/claim-tracking.model';

@Injectable({
  providedIn: 'root'
})
export class ClaimTrackingService {
  private readonly apiEndpoint = 'claim-tracking';

  constructor(private apiService: ApiService) {}

  getStats(): Observable<ClaimTrackingStatsResponse> {
    return this.apiService
      .post<ApiResponse<ClaimTrackingStatsResponse>>(`${this.apiEndpoint}/stats`, {})
      .pipe(map((res) => res.data));
  }

  getClaimHistory(claimId: number): Observable<ClaimHistory> {
    return this.apiService
      .post<ApiResponse<ClaimHistory>>(`${this.apiEndpoint}/history/${claimId}`, {})
      .pipe(map((res) => res.data));
  }

  getStatusLogs(page = 1, pageSize = 10, filters?: StatusLogFilters): Observable<PaginatedTrackingResponse<StatusLogRecord>> {
    return this.apiService
      .post<ApiResponse<PaginatedTrackingResponse<StatusLogRecord>>>(`${this.apiEndpoint}/status-log`, { page, limit: pageSize, ...filters })
      .pipe(map((res) => res.data));
  }

  getMilestones(page = 1, pageSize = 10, filters?: MilestoneFilters): Observable<PaginatedTrackingResponse<MilestoneRecord>> {
    return this.apiService
      .post<ApiResponse<PaginatedTrackingResponse<MilestoneRecord>>>(`${this.apiEndpoint}/milestones`, { page, limit: pageSize, ...filters })
      .pipe(map((res) => res.data));
  }

  getDurations(page = 1, pageSize = 10, filters?: DurationFilters): Observable<PaginatedTrackingResponse<DurationRecord>> {
    return this.apiService
      .post<ApiResponse<PaginatedTrackingResponse<DurationRecord>>>(`${this.apiEndpoint}/durations`, { page, limit: pageSize, ...filters })
      .pipe(map((res) => res.data));
  }

  createStatusLog(dto: any): Observable<any> {
    return this.apiService
      .post<ApiResponse<any>>(`${this.apiEndpoint}/status-log/create`, dto)
      .pipe(map((res) => res.data));
  }

  createMilestone(dto: any): Observable<any> {
    return this.apiService
      .post<ApiResponse<any>>(`${this.apiEndpoint}/milestones/create`, dto)
      .pipe(map((res) => res.data));
  }

  createDuration(dto: any): Observable<any> {
    return this.apiService
      .post<ApiResponse<any>>(`${this.apiEndpoint}/durations/create`, dto)
      .pipe(map((res) => res.data));
  }

  updateStatusLog(id: number, dto: any): Observable<any> {
    return this.apiService
      .put<ApiResponse<any>>(`${this.apiEndpoint}/status-log/${id}`, dto)
      .pipe(map((res) => res.data));
  }

  updateMilestone(id: number, dto: any): Observable<any> {
    return this.apiService
      .put<ApiResponse<any>>(`${this.apiEndpoint}/milestones/${id}`, dto)
      .pipe(map((res) => res.data));
  }

  updateDuration(id: number, dto: any): Observable<any> {
    return this.apiService
      .put<ApiResponse<any>>(`${this.apiEndpoint}/durations/${id}`, dto)
      .pipe(map((res) => res.data));
  }
}
