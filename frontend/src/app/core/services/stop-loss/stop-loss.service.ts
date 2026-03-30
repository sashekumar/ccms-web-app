import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '../api.service';
import {
  StopLossFilters,
  StopLossRecord,
  StopLossStatsResponse,
  CreateStopLossDto,
  UpdateStopLossDto,
  PaginatedStopLossResponse,
  ApiResponse
} from '../../../shared/models/stop-loss/stop-loss.model';

@Injectable({
  providedIn: 'root'
})
export class StopLossService {
  private readonly apiEndpoint = 'stop-loss';

  constructor(private apiService: ApiService) {}

  getStopLossRecords(
    page: number = 1,
    pageSize: number = 10,
    filters?: StopLossFilters
  ): Observable<PaginatedStopLossResponse> {
    const payload: any = { page, limit: pageSize, ...filters };
    return this.apiService
      .post<ApiResponse<PaginatedStopLossResponse>>(this.apiEndpoint, payload)
      .pipe(map((res) => res.data));
  }

  getStats(): Observable<StopLossStatsResponse> {
    return this.apiService
      .post<ApiResponse<StopLossStatsResponse>>(`${this.apiEndpoint}/stats`, {})
      .pipe(map((res) => res.data));
  }

  getStopLossById(slId: number): Observable<StopLossRecord> {
    return this.apiService
      .post<ApiResponse<StopLossRecord>>(`${this.apiEndpoint}/${slId}`, {})
      .pipe(map((res) => res.data));
  }

  createStopLoss(dto: CreateStopLossDto): Observable<any> {
    return this.apiService
      .post<ApiResponse<any>>(`${this.apiEndpoint}/create`, dto)
      .pipe(map((res) => res.data));
  }

  updateStopLoss(slId: number, dto: UpdateStopLossDto): Observable<any> {
    return this.apiService
      .put<ApiResponse<any>>(`${this.apiEndpoint}/${slId}`, dto)
      .pipe(map((res) => res.data));
  }
}
