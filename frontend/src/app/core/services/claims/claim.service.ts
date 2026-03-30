import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../api.service';
import { Claim, ClaimFilters, PaginatedClaims, CreateClaimDto, UpdateClaimDto, ApproveClaimDto, RejectClaimDto } from '../../../shared/models/claims/claim.model';

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
  private readonly endpoint = 'claims';

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

  /**
   * Create a new reimbursement claim (claim_mode='REIMB')
   */
  createClaim(dto: CreateClaimDto): Observable<ApiResponse<Claim>> {
    return this.apiService.post<ApiResponse<Claim>>(this.endpoint, dto);
  }

  // ============================================================================
  // CLAIM EXPENSES (Sub-resource)
  // ============================================================================

  /**
   * Get all expense items for a claim
   */
  getClaimExpenses(claimId: number): Observable<ApiResponse<any[]>> {
    return this.apiService.get<ApiResponse<any[]>>(`${this.endpoint}/${claimId}/expenses`);
  }

  /**
   * Add a new expense item to a claim
   */
  addClaimExpense(claimId: number, expense: {
    benefit_category: string;
    description?: string;
    billed_amt: number;
    receipt_no?: string;
    receipt_date?: string;
  }): Observable<ApiResponse<{ expense_id: number }>> {
    return this.apiService.post<ApiResponse<{ expense_id: number }>>(
      `${this.endpoint}/${claimId}/expenses`,
      expense
    );
  }

  /**
   * Update an expense item
   */
  updateClaimExpense(claimId: number, expenseId: number, expense: {
    benefit_category?: string;
    description?: string;
    billed_amt?: number;
    receipt_no?: string;
    receipt_date?: string;
  }): Observable<ApiResponse<void>> {
    return this.apiService.put<ApiResponse<void>>(
      `${this.endpoint}/${claimId}/expenses/${expenseId}`,
      expense
    );
  }

  /**
   * Delete an expense item
   */
  deleteClaimExpense(claimId: number, expenseId: number): Observable<ApiResponse<void>> {
    return this.apiService.delete<ApiResponse<void>>(
      `${this.endpoint}/${claimId}/expenses/${expenseId}`
    );
  }

  // ============================================================================
  // CLAIM DOCUMENTS (Sub-resource)
  // ============================================================================

  /**
   * Get all documents for a claim
   */
  getClaimDocuments(claimId: number): Observable<ApiResponse<any[]>> {
    return this.apiService.get<ApiResponse<any[]>>(`${this.endpoint}/${claimId}/documents`);
  }

  /**
   * Add a new document to a claim
   */
  addClaimDocument(claimId: number, doc: {
    file_name: string;
    doc_category: string;
    file_path: string;
    file_extension?: string;
    file_size_bytes?: number;
  }): Observable<ApiResponse<{ doc_id: number }>> {
    return this.apiService.post<ApiResponse<{ doc_id: number }>>(
      `${this.endpoint}/${claimId}/documents`,
      doc
    );
  }

  /**
   * Update a document
   */
  updateClaimDocument(claimId: number, docId: number, doc: {
    file_name?: string;
    doc_category?: string;
    file_path?: string;
    remarks?: string;
  }): Observable<ApiResponse<void>> {
    return this.apiService.put<ApiResponse<void>>(
      `${this.endpoint}/${claimId}/documents/${docId}`,
      doc
    );
  }

  /**
   * Delete a document
   */
  deleteClaimDocument(claimId: number, docId: number): Observable<ApiResponse<void>> {
    return this.apiService.delete<ApiResponse<void>>(
      `${this.endpoint}/${claimId}/documents/${docId}`
    );
  }

  // ============================================================================
  // WORKFLOW: APPROVE & REJECT
  // ============================================================================

  approveClaimSubmission(id: number, dto: ApproveClaimDto): Observable<ApiResponse<Claim>> {
    return this.apiService.post<ApiResponse<Claim>>(`${this.endpoint}/${id}/approve`, dto);
  }

  rejectClaimSubmission(id: number, dto: RejectClaimDto): Observable<ApiResponse<Claim>> {
    return this.apiService.post<ApiResponse<Claim>>(`${this.endpoint}/${id}/reject`, dto);
  }
}
