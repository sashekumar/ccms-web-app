/**
 * Hospital Test Helpers and Fixtures
 * 
 * @description Shared test utilities for hospital-related component tests
 * 
 * PURPOSE:
 * - Provides type-safe mock interfaces for all hospital services
 * - Offers reusable test helper functions to reduce code duplication
 * - Supplies standard mock data fixtures for consistent testing
 * 
 * USAGE:
 * Import the needed helpers in your test files:
 * ```typescript
 * import {
 *   MockHospitalService,
 *   createMockForm,
 *   stubConfirm,
 *   testNullHospitalPrevention,
 *   mockHospital,
 *   mockAddresses
 * } from '../testing/hospital-test-helpers';
 * ```
 * 
 * @see coding-standards.md for testing best practices
 */

import { Mock } from 'vitest';
import {
  Hospital,
  HospitalAddress,
  HospitalCode,
  HospitalStaff,
  HospitalStaffContact,
  FeeSchedule
} from '../../../shared/models/hospital.model';
import { Observable } from 'rxjs';
import { Params } from '@angular/router';

// ============================================================================
// TYPE-SAFE MOCK INTERFACES
// ============================================================================

/**
 * Type-safe mock interface for HospitalService
 * Replaces 'any' types with proper Mock type from Vitest
 */
export interface MockHospitalService {
  getHospitalById: Mock;
  getHospitalAddresses: Mock;
  createHospitalAddress: Mock;
  updateHospitalAddress: Mock;
  deleteHospitalAddress: Mock;
  getHospitalCodes: Mock;
  createHospitalCode: Mock;
  updateHospitalCode: Mock;
  deleteHospitalCode: Mock;
  getHospitalStaff: Mock;
  createHospitalStaff: Mock;
  updateHospitalStaff: Mock;
  deleteHospitalStaff: Mock;
  getStaffContacts: Mock;
  createStaffContact: Mock;
  updateStaffContact: Mock;
  deleteStaffContact: Mock;
  getHospitalFees: Mock;
  createHospitalFee: Mock;
  updateHospitalFee: Mock;
  deleteHospitalFee: Mock;
}

/**
 * Type-safe mock interface for Angular Router
 */
export interface MockRouter {
  navigate: Mock;
}

/**
 * Type-safe mock interface for Angular ActivatedRoute
 */
export interface MockActivatedRoute {
  params: Observable<Params>;
  snapshot: {
    params: Params;
    paramMap: {
      get: (key: string) => string | null;
    };
  };
}

/**
 * Type-safe mock interface for ToastService
 */
export interface MockToastService {
  success: Mock;
  error: Mock;
  info: Mock;
  warning: Mock;
}

/**
 * Type-safe mock interface for LoggerService
 */
export interface MockLoggerService {
  info: Mock;
  error: Mock;
  warn: Mock;
  debug: Mock;
}

/**
 * Type-safe mock interface for Angular Forms
 */
export interface MockForm {
  valid: boolean;
  invalid: boolean;
}

// ============================================================================
// MOCK DATA FIXTURES
// ============================================================================

/**
 * Standard mock hospital data for testing
 */
export const mockHospital: Hospital = {
  hospital_id: '1',
  legacy_hospital_id: '123e4567-e89b-12d3-a456-426614174000',
  hospital_name: 'Test Hospital',
  hospital_code: 'TH001',
  hospital_type: 'Private',
  reg_no: 'REG123',
  bank_id: 1,
  bank_acc_no: '1234567890',
  is_panel: true,
  panel_status: 'Active',
  panel_effective_date: new Date('2024-01-01'),
  accreditation_status: 'Accredited',
  accreditation_expiry: new Date('2025-12-31'),
  is_deleted: false,
  created_at: new Date(),
  updated_at: new Date()
};

/**
 * Standard mock hospital addresses for testing
 */
export const mockAddresses: Partial<HospitalAddress>[] = [{
  address_id: '1',
  hospital_id: '1',
  address_type: 'PRIMARY',
  street_line1: '123 Main St',
  city: 'Test City',
  state: 'Test State',
  postal_code: '12345',
  country: 'Test Country',
  is_primary: true
}];

/**
 * Standard mock hospital codes for testing
 */
export const mockCodes: HospitalCode[] = [{
  code_id: '1',
  hospital_id: '1',
  code_type: 'INSURER_CODE',
  code_value: 'INS123',
  is_active: true
}];

/**
 * Standard mock hospital staff for testing
 */
export const mockStaff: HospitalStaff[] = [{
  staff_id: '1',
  hospital_id: '1',
  staff_name: 'Dr. Test',
  staff_type: 'Doctor',
  specialty: 'Cardiology',
  is_active: true
}];

/**
 * Standard mock staff contacts for testing
 */
export const mockContacts: HospitalStaffContact[] = [{
  contact_id: '1',
  staff_id: '1',
  contact_type: 'EMAIL',
  contact_value: 'test@hospital.com',
  is_primary: true,
  created_at: new Date(),
  updated_at: new Date()
}];

/**
 * Standard mock fee schedules for testing
 */
export const mockFees: FeeSchedule[] = [{
  fee_id: '1',
  hospital_id: '1',
  fee_type: 'TPA',
  item_code: 'FEE001',
  description: 'Test Fee',
  amount: 100,
  effective_date: new Date('2024-01-01'),
  expiry_date: new Date('2024-12-31'),
  is_active: true
}];

// ============================================================================
// REUSABLE TEST HELPER FUNCTIONS
// ============================================================================

/**
 * Helper: Create a valid mock form
 * 
 * @param isValid - Whether the form should be valid (default: true)
 * @returns Mock form object with valid/invalid properties
 * 
 * @example
 * ```typescript
 * const validForm = createMockForm();
 * const invalidForm = createMockForm(false);
 * ```
 */
export const createMockForm = (isValid = true): MockForm => ({
  valid: isValid,
  invalid: !isValid
});

/**
 * Helper: Stub window.confirm with a return value
 * 
 * @param vi - Vitest instance
 * @param returnValue - The value that confirm() should return
 * 
 * @example
 * ```typescript
 * stubConfirm(vi, true); // User clicks "OK"
 * stubConfirm(vi, false); // User clicks "Cancel"
 * ```
 */
export const stubConfirm = (vi: any, returnValue: boolean): void => {
  vi.stubGlobal('confirm', vi.fn(() => returnValue));
};

// ============================================================================
// REUSABLE TEST HELPER GENERATORS
// ============================================================================

/**
 * Factory: Creates test helpers with access to component and test context
 * 
 * Call this in your beforeEach or describe block to create test helpers
 * that have access to your component instance and mocks.
 * 
 * @param context - Test context including component, services, and test globals
 * @returns Object containing all test helper functions
 * 
 * @example
 * ```typescript
 * describe('MyComponent', () => {
 *   let component: MyComponent;
 *   let service: MockService;
 *   
 *   const helpers = createTestHelpers(() => ({
 *     component,
 *     loggerService,
 *     it,
 *     expect,
 *     vi
 *   }));
 *   
 *   helpers.testNullHospitalPrevention('save', () => component.save(), () => service.save);
 * });
 * ```
 */
export const createTestHelpers = (getContext: () => {
  component: any;
  loggerService?: any;
  it: any;
  expect: any;
  vi: any;
}) => {
  /**
   * Helper: Test that an operation doesn't execute when hospital is null
   */
  const testNullHospitalPrevention = (
    operationName: string,
    operation: () => void,
    getServiceSpy: () => Mock
  ): void => {
    const ctx = getContext();
    ctx.it(`should not ${operationName} when hospital is null`, () => {
      const { component, expect } = getContext();
      component.hospital = null;
      operation();
      expect(getServiceSpy()).not.toHaveBeenCalled();
    });
  };

  /**
   * Helper: Test that an operation doesn't execute when form is invalid
   */
  const testInvalidFormPrevention = (
    operationName: string,
    operation: (form: MockForm) => void,
    getServiceSpy: () => Mock
  ): void => {
    const ctx = getContext();
    ctx.it(`should not ${operationName} when form is invalid`, () => {
      const { component, expect } = getContext();
      const mockForm = createMockForm(false);
      component.hospital = mockHospital;
      operation(mockForm);
      expect(getServiceSpy()).not.toHaveBeenCalled();
    });
  };

  /**
   * Helper: Test delete operation with confirmation declined
   */
  const testDeleteWithDeclinedConfirmation = (
    operationName: string,
    operation: () => void,
    getServiceSpy: () => Mock
  ): void => {
    const ctx = getContext();
    ctx.it(`should not ${operationName} when confirmation is declined`, () => {
      const { component, expect, vi } = getContext();
      stubConfirm(vi, false);
      component.hospital = mockHospital;
      operation();
      expect(getServiceSpy()).not.toHaveBeenCalled();
    });
  };

  /**
   * Helper: Test error handling for an operation
   */
  const testErrorHandling = (
    operationName: string,
    setupError: () => void,
    operation: () => void,
    expectLogger = true
  ): void => {
    const ctx = getContext();
    ctx.it(`should handle ${operationName} error`, () => {
      const { component, loggerService, expect } = getContext();
      setupError();
      component.hospital = mockHospital;
      operation();
      if (expectLogger && loggerService) {
        expect(loggerService.error).toHaveBeenCalled();
      }
    });
  };

  return {
    testNullHospitalPrevention,
    testInvalidFormPrevention,
    testDeleteWithDeclinedConfirmation,
    testErrorHandling
  };
};
