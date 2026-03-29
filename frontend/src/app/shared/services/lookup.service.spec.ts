import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { LookupService, LookupItem } from './lookup.service';
import { environment } from '../../../environments/environment';

describe('LookupService (shared)', () => {
  let service: LookupService;
  let httpMock: HttpTestingController;
  const apiBase = `${environment.apiUrl}/master/lookups/by-category-name`;

  const mockItems: LookupItem[] = [
    { lookup_code: 'A', lookup_value: 'Option A', is_active: true },
    { lookup_code: 'B', lookup_value: 'Option B', is_active: true }
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [LookupService]
    });

    service = TestBed.inject(LookupService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getLookupByCategory()', () => {
    it('should fetch items for a category', () => {
      service.getLookupByCategory('MEMBER_TYPE').subscribe(result => {
        expect(result).toEqual(mockItems);
      });

      const req = httpMock.expectOne(apiBase);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ category_name: 'MEMBER_TYPE' });
      req.flush({ data: mockItems });
    });

    it('should return cached data on second call', () => {
      // First call
      service.getLookupByCategory('GENDER').subscribe();
      const req1 = httpMock.expectOne(apiBase);
      req1.flush({ data: mockItems });

      // Second call - uses cache, no new HTTP request
      service.getLookupByCategory('GENDER').subscribe(result => {
        expect(result).toEqual(mockItems);
      });
      httpMock.expectNone(apiBase);
    });

    it('should handle null/undefined data in response', () => {
      service.getLookupByCategory('UNKNOWN').subscribe(result => {
        expect(result).toEqual([]);
      });

      const req = httpMock.expectOne(apiBase);
      req.flush({ data: null });
    });
  });

  describe('clearCache()', () => {
    it('should clear cache for a specific category', () => {
      // Populate cache
      service.getLookupByCategory('MEMBER_TYPE').subscribe();
      const req1 = httpMock.expectOne(apiBase);
      req1.flush({ data: mockItems });

      // Clear specific category
      service.clearCache('MEMBER_TYPE');

      // Next call should fetch new data
      service.getLookupByCategory('MEMBER_TYPE').subscribe();
      const req2 = httpMock.expectOne(apiBase);
      req2.flush({ data: mockItems });
    });

    it('should clear all cache when no category specified', () => {
      // Populate cache
      service.getLookupByCategory('MEMBER_TYPE').subscribe();
      const req1 = httpMock.expectOne(apiBase);
      req1.flush({ data: mockItems });

      service.getLookupByCategory('GENDER').subscribe();
      const req2 = httpMock.expectOne(apiBase);
      req2.flush({ data: mockItems });

      // Clear all
      service.clearCache();

      // Both should fetch new data
      service.getLookupByCategory('MEMBER_TYPE').subscribe();
      const req3 = httpMock.expectOne(apiBase);
      req3.flush({ data: mockItems });

      service.getLookupByCategory('GENDER').subscribe();
      const req4 = httpMock.expectOne(apiBase);
      req4.flush({ data: mockItems });
    });
  });

  describe('refreshCategory()', () => {
    it('should force a new fetch after clearing cache', () => {
      // Populate cache
      service.getLookupByCategory('STATE_REGION').subscribe();
      const req1 = httpMock.expectOne(apiBase);
      req1.flush({ data: mockItems });

      // Refresh forces new call
      service.refreshCategory('STATE_REGION').subscribe(result => {
        expect(result).toEqual(mockItems);
      });
      const req2 = httpMock.expectOne(apiBase);
      req2.flush({ data: mockItems });
    });
  });

  describe('Convenience methods', () => {
    const testConvenienceMethod = (methodName: string, expectedCategory: string) => {
      it(`should call getLookupByCategory('${expectedCategory}')`, () => {
        (service as any)[methodName]().subscribe();
        const req = httpMock.expectOne(apiBase);
        expect(req.request.body).toEqual({ category_name: expectedCategory });
        req.flush({ data: mockItems });
      });
    };

    testConvenienceMethod('getMemberTypes', 'MEMBER_TYPE');
    testConvenienceMethod('getGenders', 'GENDER');
    testConvenienceMethod('getMemberStatuses', 'MEMBER_STATUS');
    testConvenienceMethod('getAddressTypes', 'ADDRESS_TYPE');
    testConvenienceMethod('getContactTypes', 'CONTACT_TYPE');
    testConvenienceMethod('getRelationships', 'RELATIONSHIPS');
    testConvenienceMethod('getAdmissionTypes', 'ADMISSION_TYPE');
    testConvenienceMethod('getClaimStatuses', 'CLAIM_STATUS');
    testConvenienceMethod('getClaimTypes', 'CLAIM_TYPE');
    testConvenienceMethod('getPolicyStatuses', 'POLICY_STATUS');
    testConvenienceMethod('getPaymentMethods', 'PAYMENT_METHOD');
    testConvenienceMethod('getDocumentTypes', 'DOCUMENT_TYPE');
    testConvenienceMethod('getStates', 'STATE_REGION');
    testConvenienceMethod('getWardClasses', 'WARD_CLASS');
    testConvenienceMethod('getHospitalTypes', 'HOSPITAL_TYPE');
    testConvenienceMethod('getAccreditationStatuses', 'ACCREDITATION_STATUS');
    testConvenienceMethod('getHospitalCodeTypes', 'HOSPITAL_CODE_TYPE');
    testConvenienceMethod('getHospitalStaffTypes', 'HOSPITAL_STAFF_TYPE');
    testConvenienceMethod('getHospitalContactTypes', 'HOSPITAL_CONTACT_TYPE');
    testConvenienceMethod('getHospitalFeeTypes', 'HOSPITAL_FEE_TYPE');
    testConvenienceMethod('getLimitTypes', 'PRODUCT_LIMIT_TYPE');
    testConvenienceMethod('getCopayTypes', 'COPAY_TYPE');
    testConvenienceMethod('getCopayAppliesTo', 'COPAY_APPLIES_TO');
    testConvenienceMethod('getRoomTypes', 'ROOM_TYPE');
    testConvenienceMethod('getDiagnosisCategories', 'DIAGNOSIS_CATEGORY');
    testConvenienceMethod('getAlertLevels', 'ALERT_LEVEL');
    testConvenienceMethod('getEhmStatuses', 'EHM_STATUS');
    testConvenienceMethod('getDefermentStatuses', 'DEFERMENT_STATUS');
  });
});
