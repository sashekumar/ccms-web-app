import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  DefermentRequest,
  DefermentFilters,
  DefermentStatsResponse,
  PaginatedDefermentResponse,
  ApiResponse,
} from '../../models/deferment/deferment.model';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class DefermentService {
  private apiUrl = `${environment.apiUrl}/deferment-monitoring`;

  constructor(private http: HttpClient) {}

  /**
   * Get all deferment requests with pagination and filtering
   */
  getDefermentRequests(
    page: number = 1,
    limit: number = 20,
    filters?: DefermentFilters
  ): Observable<PaginatedDefermentResponse<DefermentRequest>> {
    const payload = {
      page,
      limit,
      filters: filters || {}
    };

    return this.http.post<PaginatedDefermentResponse<DefermentRequest>>(
      `${this.apiUrl}/cases`,
      payload
    );
  }

  /**
   * Get deferment request by ID
   */
  getDefermentRequest(
    defermentId: bigint
  ): Observable<ApiResponse<DefermentRequest>> {
    // Note: Backend doesn't have a direct endpoint for getting by deferment ID
    // This method may need to be refactored or use the cases endpoint with filtering
    return this.http.get<ApiResponse<DefermentRequest>>(
      `${this.apiUrl}/cases/${defermentId}`
    );
  }

  /**
   * Create a new deferment request
   */
  createDefermentRequest(
    payload: Omit<DefermentRequest, 'deferment_id' | 'updated_at' | 'created_at'>
  ): Observable<ApiResponse<DefermentRequest>> {
    return this.http.post<ApiResponse<DefermentRequest>>(this.apiUrl, payload);
  }

  /**
   * Approve a deferment request
   */
  approveDefermentRequest(
    defermentId: bigint,
    approvedBy: string,
    comments?: string
  ): Observable<ApiResponse<DefermentRequest>> {
    const payload = {
      approved_by: approvedBy,
      comments: comments || null,
    };
    return this.http.patch<ApiResponse<DefermentRequest>>(
      `${this.apiUrl}/${defermentId}/approve`,
      payload
    );
  }

  /**
   * Reject a deferment request
   */
  rejectDefermentRequest(
    defermentId: bigint,
    rejectedBy: string,
    reason: string
  ): Observable<ApiResponse<DefermentRequest>> {
    const payload = {
      approved_by: rejectedBy,
      comments: reason,
    };
    return this.http.patch<ApiResponse<DefermentRequest>>(
      `${this.apiUrl}/${defermentId}/reject`,
      payload
    );
  }

  /**
   * Get deferment statistics
   */
  getDefermentStats(): Observable<ApiResponse<DefermentStatsResponse>> {
    return this.http.post<ApiResponse<DefermentStatsResponse>>(
      `${this.apiUrl}/stats`,
      {}
    );
  }

  /**
   * Get deferments by admission ID
   */
  getAdmissionDeferments(
    admissionId: bigint,
    page: number = 1,
    limit: number = 20
  ): Observable<PaginatedDefermentResponse<DefermentRequest>> {
    const payload = {
      page,
      limit,
      filters: { admission_id: admissionId }
    };

    return this.http.post<PaginatedDefermentResponse<DefermentRequest>>(
      `${this.apiUrl}/cases`,
      payload
    );
  }

  /**
   * Get deferments by status
   */
  getDefermentsByStatus(
    status: string,
    page: number = 1,
    limit: number = 20
  ): Observable<PaginatedDefermentResponse<DefermentRequest>> {
    const payload = {
      page,
      limit,
      filters: { status }
    };

    return this.http.post<PaginatedDefermentResponse<DefermentRequest>>(
      `${this.apiUrl}/cases`,
      payload
    );
  }
}
