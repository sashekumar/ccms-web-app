import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../api.service';
import { Claim, ClaimFilters, PaginatedClaims, UpdateClaimDto } from '../../../shared/models/claims/claim.model';

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  errors?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class ClaimService {
  private readonly endpoint = '/claims';

  constructor(private apiService: ApiService) {}

  /**
   * Get paginated claims with filters
   * Uses POST to allow for complex payload filtering
   */
  getClaims(filters: ClaimFilters): Observable<PaginatedClaims> {
    return this.apiService.post<PaginatedClaims>(`${this.endpoint}/list`, filters);
  }

  /**
   * Get specific claim details by ID
   */
  getClaimById(id: number): Observable<ApiResponse<Claim>> {
    return this.apiService.get<ApiResponse<Claim>>(`${this.endpoint}/${id}`);
  }

  /**
   * Update an existing claim's details or status
   */
  updateClaim(id: number, dto: UpdateClaimDto): Observable<ApiResponse<Claim>> {
    return this.apiService.put<ApiResponse<Claim>>(`${this.endpoint}/${id}`, dto);
  }

  /**
   * Delete (soft-delete) a claim
   */
  deleteClaim(id: number): Observable<ApiResponse<null>> {
    return this.apiService.delete<ApiResponse<null>>(`${this.endpoint}/${id}`);
  }
}
