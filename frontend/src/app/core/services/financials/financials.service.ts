import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '../api.service';
import {
  PaymentAdviceFilters,
  CreatePaymentAdviceDto,
  UpdatePaymentAdviceDto,
  PaymentAdviceResponse,
  PaymentAdviceStatsResponse,
  PaginatedPaymentAdviceResponse,
  ApiResponse
} from '../../../shared/models/financials/financials.model';

@Injectable({
  providedIn: 'root'
})
export class FinancialsService {
  private readonly apiEndpoint = 'financials';

  constructor(private apiService: ApiService) {}

  /**
   * Get paginated payment advices with optional filters (POST)
   */
  getPaymentAdvices(
    page: number = 1,
    pageSize: number = 10,
    filters?: PaymentAdviceFilters
  ): Observable<PaginatedPaymentAdviceResponse> {
    const payload: any = { page, limit: pageSize, ...filters };
    return this.apiService
      .post<ApiResponse<PaginatedPaymentAdviceResponse>>(this.apiEndpoint, payload)
      .pipe(map((res) => res.data));
  }

  /**
   * Get payment advice statistics (POST)
   */
  getStats(): Observable<PaymentAdviceStatsResponse> {
    return this.apiService
      .post<ApiResponse<PaymentAdviceStatsResponse>>(`${this.apiEndpoint}/stats`, {})
      .pipe(map((res) => res.data));
  }

  /**
   * Get payment advice by ID with all sub-entities (POST)
   */
  getPaymentAdviceById(paId: number): Observable<PaymentAdviceResponse> {
    return this.apiService
      .post<ApiResponse<PaymentAdviceResponse>>(`${this.apiEndpoint}/${paId}`, {})
      .pipe(map((res) => res.data));
  }

  /**
   * Create a new payment advice (POST)
   */
  createPaymentAdvice(dto: CreatePaymentAdviceDto): Observable<PaymentAdviceResponse> {
    return this.apiService
      .post<ApiResponse<PaymentAdviceResponse>>(`${this.apiEndpoint}/create`, dto)
      .pipe(map((res) => res.data));
  }

  /**
   * Update an existing payment advice (PUT)
   */
  updatePaymentAdvice(paId: number, dto: UpdatePaymentAdviceDto): Observable<PaymentAdviceResponse> {
    return this.apiService
      .put<ApiResponse<PaymentAdviceResponse>>(`${this.apiEndpoint}/${paId}`, dto)
      .pipe(map((res) => res.data));
  }
}
