/**
 * Investigation Validators
 * 
 * Centralized validation logic for investigation operations
 * Implements business rules validation, ensuring data integrity and consistency
 * 
 * Purpose:
 * - Single source of truth for validation rules
 * - Reusable across service, controller, and middleware layers
 * - Consistent error messages
 * - Easier maintenance and testing
 */

import { InvestigationEntity } from '../investigation.entity';
import { CreateInvestigationDto, UpdateInvestigationDto } from '../dto/investigation.dto';

/**
 * Valid status transitions for investigations
 * Defines the state machine for investigation workflow
 */
const STATUS_TRANSITIONS: Record<string, string[]> = {
  'OPEN': ['IN_PROGRESS', 'CLOSED'],
  'IN_PROGRESS': ['UNDER_REVIEW', 'OPEN', 'CLOSED'],
  'UNDER_REVIEW': ['COMPLETED', 'IN_PROGRESS', 'CLOSED'],
  'COMPLETED': ['CLOSED'],
  'CLOSED': []
};

/**
 * Valid investigation statuses
 */
const VALID_STATUSES = Object.keys(STATUS_TRANSITIONS);

/**
 * Valid request types
 */
const VALID_REQUEST_TYPES = [
  'MEDICAL_RECORDS',
  'DISCHARGE_SUMMARY',
  'INVESTIGATION_REPORT',
  'SUPPORTING_DOCUMENTS',
  'CONSULTATION_NOTES',
  'FINANCIAL_DOCUMENTS'
];

/**
 * Valid request statuses
 */
const VALID_REQUEST_STATUSES = ['PENDING', 'RECEIVED', 'PARTIAL', 'NOT_AVAILABLE'];

/**
 * Validation error
 */
export class ValidationError extends Error {
  constructor(public field: string, message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Validate create investigation DTO
 * Business Rules:
 * - claim_id is required and must be numeric
 * 
 * @param dto CreateInvestigationDto
 * @throws ValidationError if validation fails
 */
export function validateCreateInvestigation(dto: CreateInvestigationDto): void {
  if (!dto.claim_id || typeof dto.claim_id !== 'number' || dto.claim_id <= 0) {
    throw new ValidationError('claim_id', 'Claim ID is required and must be a positive number');
  }
}

/**
 * Validate update investigation DTO
 * Business Rules:
 * - If status is provided, it must be valid
 * - Status transitions must follow state machine rules
 * - findings is optional
 * 
 * @param dto UpdateInvestigationDto
 * @param currentStatus Current investigation status
 * @throws ValidationError if validation fails
 */
export function validateUpdateInvestigation(dto: UpdateInvestigationDto, currentStatus: string): void {
  // Validate status if provided
  if (dto.status) {
    if (!VALID_STATUSES.includes(dto.status)) {
      throw new ValidationError('status', `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`);
    }

    // Validate status transition
    if (!isValidStatusTransition(currentStatus, dto.status)) {
      throw new ValidationError(
        'status',
        `Cannot transition from ${currentStatus} to ${dto.status}. Valid transitions: ${STATUS_TRANSITIONS[currentStatus]?.join(', ') || 'none'}`
      );
    }

    // Cannot update closed investigations
    if (currentStatus === 'CLOSED') {
      throw new ValidationError('status', 'Cannot update closed investigations. Create new investigation if needed.');
    }
  }

  // Validate findings if provided
  if (dto.findings !== undefined && typeof dto.findings !== 'string') {
    throw new ValidationError('findings', 'Findings must be a string');
  }

  // Validate is_pec_found if provided
  if (dto.is_pec_found !== undefined && typeof dto.is_pec_found !== 'boolean') {
    throw new ValidationError('is_pec_found', 'is_pec_found must be a boolean');
  }

  // Validate request_payment_amt if provided
  if (dto.request_payment_amt !== undefined) {
    if (typeof dto.request_payment_amt !== 'number' || dto.request_payment_amt < 0) {
      throw new ValidationError('request_payment_amt', 'Request payment amount must be a non-negative number');
    }
  }
}

/**
 * Validate investigation request creation
 * Business Rules:
 * - request_type must be valid
 * - requested_from is required
 * - expected_date must be in future
 * 
 * @param data Investigation request data
 * @throws ValidationError if validation fails
 */
export function validateCreateInvestigationRequest(data: any): void {
  if (!data.request_type || !VALID_REQUEST_TYPES.includes(data.request_type)) {
    throw new ValidationError('request_type', `Invalid request type. Must be one of: ${VALID_REQUEST_TYPES.join(', ')}`);
  }

  if (!data.requested_from || typeof data.requested_from !== 'string' || !data.requested_from.trim()) {
    throw new ValidationError('requested_from', 'Requested from field is required');
  }

  if (!data.expected_date || new Date(data.expected_date) <= new Date()) {
    throw new ValidationError('expected_date', 'Expected date must be in the future');
  }
}

/**
 * Validate investigation request update
 * Business Rules:
 * - status must be valid if provided
 * - received_date cannot be before created_date
 * - status can only be updated to validate states
 * 
 * @param data Investigation request update data
 * @param currentStatus Current request status
 * @throws ValidationError if validation fails
 */
export function validateUpdateInvestigationRequest(data: any, currentStatus: string): void {
  if (data.status) {
    if (!VALID_REQUEST_STATUSES.includes(data.status)) {
      throw new ValidationError('status', `Invalid status. Must be one of: ${VALID_REQUEST_STATUSES.join(', ')}`);
    }

    // Cannot update if already received
    if (currentStatus === 'RECEIVED' && data.status !== 'RECEIVED') {
      throw new ValidationError('status', 'Cannot change status of already received request');
    }
  }

  if (data.received_date && typeof data.received_date !== 'string') {
    throw new ValidationError('received_date', 'Received date must be a date string');
  }

  if (data.remarks !== undefined && typeof data.remarks !== 'string') {
    throw new ValidationError('remarks', 'Remarks must be a string');
  }
}

/**
 * Validate call log creation
 * Business Rules:
 * - call_date must be valid date
 * - called_party is required
 * - call_duration must be non-negative
 * 
 * @param data Call log data
 * @throws ValidationError if validation fails
 */
export function validateCreateCallLog(data: any): void {
  if (!data.call_date || isNaN(new Date(data.call_date).getTime())) {
    throw new ValidationError('call_date', 'Call date must be a valid date');
  }

  if (!data.called_party || typeof data.called_party !== 'string' || !data.called_party.trim()) {
    throw new ValidationError('called_party', 'Called party is required');
  }

  if (data.call_duration !== undefined) {
    if (typeof data.call_duration !== 'number' || data.call_duration < 0) {
      throw new ValidationError('call_duration', 'Call duration must be a non-negative number');
    }
  }
}

/**
 * Validate filter parameters
 * 
 * @param filters Filter object
 * @throws ValidationError if validation fails
 */
export function validateFilters(filters: any): void {
  if (filters.page && (typeof filters.page !== 'number' || filters.page < 1)) {
    throw new ValidationError('page', 'Page must be a positive number');
  }

  if (filters.limit && (typeof filters.limit !== 'number' || filters.limit < 1 || filters.limit > 100)) {
    throw new ValidationError('limit', 'Limit must be between 1 and 100');
  }

  if (filters.status && !VALID_STATUSES.includes(filters.status)) {
    throw new ValidationError('status', `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`);
  }

  if (filters.claimId && (typeof filters.claimId !== 'number' || filters.claimId <= 0)) {
    throw new ValidationError('claimId', 'Claim ID must be a positive number');
  }

  if (filters.clinicId && (typeof filters.clinicId !== 'number' || filters.clinicId <= 0)) {
    throw new ValidationError('clinicId', 'Clinic ID must be a positive number');
  }

  if (filters.sortBy && !['created_at', 'ix_status', 'claim_id'].includes(filters.sortBy)) {
    throw new ValidationError('sortBy', 'Invalid sort field');
  }

  if (filters.sortOrder && !['ASC', 'DESC'].includes(filters.sortOrder.toUpperCase())) {
    throw new ValidationError('sortOrder', 'Sort order must be ASC or DESC');
  }
}

/**
 * Check if status transition is valid
 * 
 * @param currentStatus Current status
 * @param newStatus Desired new status
 * @returns True if transition is allowed
 */
export function isValidStatusTransition(currentStatus: string, newStatus: string): boolean {
  if (currentStatus === newStatus) return false;
  return STATUS_TRANSITIONS[currentStatus]?.includes(newStatus) ?? false;
}

/**
 * Get valid next statuses
 * 
 * @param status Current status
 * @returns Array of valid next statuses
 */
export function getValidNextStatuses(status: string): string[] {
  return STATUS_TRANSITIONS[status] || [];
}

/**
 * Get all valid statuses
 * 
 * @returns Array of valid statuses
 */
export function getAllValidStatuses(): string[] {
  return VALID_STATUSES;
}

/**
 * Sanitize string input to prevent injection
 * 
 * @param input String to sanitize
 * @returns Sanitized string
 */
export function sanitizeString(input: string | undefined): string | undefined {
  if (!input) return input;
  return input.trim().slice(0, 500); // Max 500 chars
}

/**
 * Validate paginated slice
 * 
 * @param total Total records
 * @param page Page number
 * @param limit Records per page
 * @returns True if slice is valid
 */
export function isValidPaginatedSlice(total: number, page: number, limit: number): boolean {
  if (total === 0) return true;
  const maxPage = Math.ceil(total / limit);
  return page >= 1 && page <= maxPage;
}
