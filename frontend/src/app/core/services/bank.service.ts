import { Injectable } from '@angular/core';
import { ApiResponse } from './base-api.service';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ApiService } from './api.service';
import { API_ENDPOINTS } from '../constants';
import {
  Bank,
  CreateBankDto,
  UpdateBankDto,
  BankFilters,
  PaginatedBanks
} from '../../shared/models/bank.model';

/**
 * Bank Service - Handles bank management operations
 */
@Injectable({
  providedIn: 'root'
})
export class BankService {
  constructor(private api: ApiService) {}

  /**
   * Get paginated list of banks with filters
   */
  getBanks(filters: BankFilters = {}): Observable<PaginatedBanks> {
    return this.api.post<ApiResponse<PaginatedBanks>>(
      API_ENDPOINTS.BANKS.LIST,
      filters
    ).pipe(
      map(response => response.data),
      catchError(error => {
        throw error;
      })
    );
  }

  /**
   * Get bank by ID
   */
  getBankById(bank_id: number): Observable<Bank> {
    return this.api.post<ApiResponse<Bank>>(
      API_ENDPOINTS.BANKS.GET,
      { bank_id }
    ).pipe(
      map(response => response.data),
      catchError(error => {
        throw error;
      })
    );
  }

  /**
   * Create new bank
   */
  createBank(dto: CreateBankDto): Observable<number> {
    return this.api.post<ApiResponse<{ bank_id: number }>>(
      API_ENDPOINTS.BANKS.CREATE,
      dto
    ).pipe(
      map(response => response.data.bank_id),
      catchError(error => {
        throw error;
      })
    );
  }

  /**
   * Update bank
   */
  updateBank(bank_id: number, dto: UpdateBankDto): Observable<void> {
    return this.api.put<ApiResponse<void>>(
      API_ENDPOINTS.BANKS.UPDATE,
      { bank_id, ...dto }
    ).pipe(
      map(() => undefined),
      catchError(error => {
        throw error;
      })
    );
  }

  /**
   * Delete bank (soft delete)
   */
  deleteBank(bank_id: number): Observable<void> {
    return this.api.post<ApiResponse<void>>(
      API_ENDPOINTS.BANKS.DELETE,
      { bank_id }
    ).pipe(
      map(() => undefined),
      catchError(error => {
        throw error;
      })
    );
  }

  /**
   * Check if bank code is available
   */
  checkBankCode(bank_code: string, exclude_bank_id?: number): Observable<boolean> {
    return this.api.post<ApiResponse<{ available: boolean }>>(
      API_ENDPOINTS.BANKS.CHECK_CODE,
      { bank_code, exclude_bank_id }
    ).pipe(
      map(response => response.data.available),
      catchError(error => {
        throw error;
      })
    );
  }
}
