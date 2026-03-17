import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

/**
 * Lookup item structure from database
 */
export interface LookupItem {
  lookup_id?: number;
  category_id?: number;
  lookup_code: string;
  lookup_value: string;
  sort_order?: number;
  is_active?: boolean;
}

/**
 * Cache entry with timestamp for TTL
 */
interface CacheEntry {
  data$: Observable<LookupItem[]>;
  timestamp: number;
}

/**
 * Service for managing dynamic lookup values from database
 * Provides cached access to all lookup categories for dropdowns with TTL
 */
@Injectable({
  providedIn: 'root'
})
export class LookupService {
  private cache = new Map<string, CacheEntry>();
  private readonly API_BASE = `${environment.apiUrl}/master/lookups/by-category-name`;
  private readonly CACHE_TTL = 30 * 60 * 1000; // 30 minutes in milliseconds

  constructor(private http: HttpClient) {}

  /**
   * Get lookup values for a category (with TTL caching)
   * @param categoryName - Category name (e.g., 'MEMBER_TYPE', 'GENDER')
   * @returns Observable of lookup items
   */
  getLookupByCategory(categoryName: string): Observable<LookupItem[]> {
    const now = Date.now();
    const cached = this.cache.get(categoryName);

    // Check if cache exists and is still valid
    if (cached && (now - cached.timestamp) < this.CACHE_TTL) {
      return cached.data$;
    }

    // Cache expired or doesn't exist - fetch new data
    const request$ = this.http
      .post<{ data: LookupItem[] }>(this.API_BASE, { category_name: categoryName })
      .pipe(
        map(response => response?.data || []),
        shareReplay(1)
      );

    this.cache.set(categoryName, {
      data$: request$,
      timestamp: now
    });

    return request$;
  }

  /**
   * Clear cache for a specific category or all categories
   * Call this after creating/updating/deleting lookup data
   * @param categoryName - Optional category name to clear. If not provided, clears all cache.
   */
  clearCache(categoryName?: string): void {
    if (categoryName) {
      this.cache.delete(categoryName);
    } else {
      this.cache.clear();
    }
  }

  /**
   * Refresh cache for a specific category
   * Forces a new API call and updates the cache
   * @param categoryName - Category name to refresh
   */
  refreshCategory(categoryName: string): Observable<LookupItem[]> {
    this.cache.delete(categoryName);
    return this.getLookupByCategory(categoryName);
  }

  /**
   * Convenience methods for common lookup categories
   */

  getMemberTypes(): Observable<LookupItem[]> {
    return this.getLookupByCategory('MEMBER_TYPE');
  }

  getGenders(): Observable<LookupItem[]> {
    return this.getLookupByCategory('GENDER');
  }

  getMemberStatuses(): Observable<LookupItem[]> {
    return this.getLookupByCategory('MEMBER_STATUS');
  }

  getAddressTypes(): Observable<LookupItem[]> {
    return this.getLookupByCategory('ADDRESS_TYPE');
  }

  getContactTypes(): Observable<LookupItem[]> {
    return this.getLookupByCategory('CONTACT_TYPE');
  }

  getRelationships(): Observable<LookupItem[]> {
    return this.getLookupByCategory('RELATIONSHIPS');
  }

  getAdmissionTypes(): Observable<LookupItem[]> {
    return this.getLookupByCategory('ADMISSION_TYPE');
  }

  getClaimStatuses(): Observable<LookupItem[]> {
    return this.getLookupByCategory('CLAIM_STATUS');
  }

  getClaimTypes(): Observable<LookupItem[]> {
    return this.getLookupByCategory('CLAIM_TYPE');
  }

  getPolicyStatuses(): Observable<LookupItem[]> {
    return this.getLookupByCategory('POLICY_STATUS');
  }

  getPaymentMethods(): Observable<LookupItem[]> {
    return this.getLookupByCategory('PAYMENT_METHOD');
  }

  getDocumentTypes(): Observable<LookupItem[]> {
    return this.getLookupByCategory('DOCUMENT_TYPE');
  }

  getStates(): Observable<LookupItem[]> {
    return this.getLookupByCategory('STATE_REGION');
  }

  getWardClasses(): Observable<LookupItem[]> {
    return this.getLookupByCategory('WARD_CLASS');
  }

  getHospitalTypes(): Observable<LookupItem[]> {
    return this.getLookupByCategory('HOSPITAL_TYPE');
  }

  getAccreditationStatuses(): Observable<LookupItem[]> {
    return this.getLookupByCategory('ACCREDITATION_STATUS');
  }

  getHospitalCodeTypes(): Observable<LookupItem[]> {
    return this.getLookupByCategory('HOSPITAL_CODE_TYPE');
  }

  getHospitalStaffTypes(): Observable<LookupItem[]> {
    return this.getLookupByCategory('HOSPITAL_STAFF_TYPE');
  }

  getHospitalContactTypes(): Observable<LookupItem[]> {
    return this.getLookupByCategory('HOSPITAL_CONTACT_TYPE');
  }

  getHospitalFeeTypes(): Observable<LookupItem[]> {
    return this.getLookupByCategory('HOSPITAL_FEE_TYPE');
  }

  getLimitTypes(): Observable<LookupItem[]> {
    return this.getLookupByCategory('PRODUCT_LIMIT_TYPE');
  }

  getCopayTypes(): Observable<LookupItem[]> {
    return this.getLookupByCategory('COPAY_TYPE');
  }

  getCopayAppliesTo(): Observable<LookupItem[]> {
    return this.getLookupByCategory('COPAY_APPLIES_TO');
  }

  // Admission-related lookups
  getRoomTypes(): Observable<LookupItem[]> {
    return this.getLookupByCategory('ROOM_TYPE');
  }

  getDiagnosisCategories(): Observable<LookupItem[]> {
    return this.getLookupByCategory('DIAGNOSIS_CATEGORY');
  }

  getAlertLevels(): Observable<LookupItem[]> {
    return this.getLookupByCategory('ALERT_LEVEL');
  }

  getEhmStatuses(): Observable<LookupItem[]> {
    return this.getLookupByCategory('EHM_STATUS');
  }

  getDefermentStatuses(): Observable<LookupItem[]> {
    return this.getLookupByCategory('DEFERMENT_STATUS');
  }
}
