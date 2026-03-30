/**
 * Investigation Filter & Search Utilities
 * 
 * Centralized utility functions for backend filtering and search operations
 * Provides reusable patterns for query building and data processing
 * 
 * Benefits:
 * - Consistent filtering logic across services
 * - Easier to test and maintain
 * - Prevents code duplication in repository layer
 * - Standardized search and sort operations
 */

import { InvestigationFilters } from '../dto/investigation.dto';

/**
 * Status priority for ordering
 * Lower number = higher priority
 */
export const STATUS_PRIORITY: Record<string, number> = {
  'OPEN': 1,
  'IN_PROGRESS': 2,
  'UNDER_REVIEW': 3,
  'COMPLETED': 4,
  'CLOSED': 5
};

/**
 * Default filter values
 */
export const DEFAULT_FILTERS: Partial<InvestigationFilters> = {
  page: 1,
  limit: 10,
  sortBy: 'created_at',
  sortOrder: 'DESC'
};

/**
 * Max records per page
 */
export const MAX_LIMIT = 100;

/**
 * Build SQL WHERE clause from filters
 * Centralizes filter logic to avoid duplication
 * 
 * @param filters Investigation filters
 * @returns Object with WHERE clause string and parameters
 */
export function buildWhereClause(filters: Partial<InvestigationFilters>): {
  clause: string;
  params: Record<string, any>;
} {
  const clauses: string[] = [];
  const params: Record<string, any> = {};

  // Status filter
  if (filters.status) {
    clauses.push('ix.ix_status = @status');
    params.status = filters.status;
  }

  // Claim ID filter
  if (filters.claimId) {
    clauses.push('ix.claim_id = @claimId');
    params.claimId = filters.claimId;
  }

  // Clinic ID filter
  if (filters.clinicId) {
    clauses.push('ix.clinic_id = @clinicId');
    params.clinicId = filters.clinicId;
  }

  // Search term (searches across claim ref and clinic name)
  if (filters.searchTerm && filters.searchTerm.trim()) {
    clauses.push('(c.claim_ref_no LIKE @search OR h.hospital_name LIKE @search)');
    params.search = `%${filters.searchTerm.trim()}%`;
  }

  return {
    clause: clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '',
    params
  };
}

/**
 * Build SQL ORDER BY clause from sort parameters
 * 
 * @param sortBy Field to sort by
 * @param sortOrder Sort direction
 * @returns ORDER BY clause string
 */
export function buildOrderByClause(sortBy: string = 'created_at', sortOrder: string = 'DESC'): string {
  // Map frontend field names to database columns
  const fieldMapping: Record<string, string> = {
    'created_at': 'ix.created_at',
    'status': 'ix.ix_status',
    'ix_status': 'ix.ix_status',
    'claim_id': 'ix.claim_id'
  };

  const column = fieldMapping[sortBy] || 'ix.created_at';
  const order = sortOrder?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  return `ORDER BY ${column} ${order}`;
}

/**
 * Build SQL OFFSET and LIMIT clause for pagination
 * 
 * @param page Page number (1-indexed)
 * @param limit Records per page
 * @returns Object with OFFSET/LIMIT clause and parameters
 */
export function buildPaginationClause(page: number = 1, limit: number = 10): {
  clause: string;
  params: Record<string, any>;
} {
  const validPage = Math.max(1, page || 1);
  const validLimit = Math.min(Math.max(1, limit || 10), MAX_LIMIT);
  const offset = (validPage - 1) * validLimit;

  return {
    clause: `OFFSET ${offset} ROWS FETCH NEXT ${validLimit} ROWS ONLY`,
    params: { page: validPage, limit: validLimit }
  };
}

/**
 * Normalize filters for consistency
 * 
 * @param filters Raw filters from controller
 * @returns Normalized and validated filters
 */
export function normalizeFilters(filters: any): Partial<InvestigationFilters> {
  const validStatuses = ['OPEN', 'IN_PROGRESS', 'UNDER_REVIEW', 'COMPLETED', 'CLOSED'];
  const rawStatus = filters.status ? String(filters.status).toUpperCase() : undefined;
  const status = rawStatus && validStatuses.includes(rawStatus) ? (rawStatus as any) : undefined;
  
  return {
    page: filters.page ? Math.max(1, Number(filters.page)) : 1,
    limit: filters.limit ? Math.min(Math.max(1, Number(filters.limit)), MAX_LIMIT) : 10,
    status,
    claimId: filters.claimId ? Number(filters.claimId) : undefined,
    clinicId: filters.clinicId ? Number(filters.clinicId) : undefined,
    sortBy: filters.sortBy || 'created_at',
    sortOrder: filters.sortOrder?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC',
    searchTerm: filters.searchTerm ? String(filters.searchTerm).trim() : undefined
  };
}

/**
 * Calculate pagination metadata
 * 
 * @param total Total records
 * @param page Current page
 * @param limit Records per page
 * @returns Pagination metadata
 */
export function calculatePaginationMeta(total: number, page: number, limit: number): {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
} {
  const totalPages = Math.ceil(total / limit) || 1;
  const currentPage = Math.max(1, Math.min(page, totalPages));

  return {
    total,
    page: currentPage,
    limit,
    totalPages,
    hasNextPage: currentPage < totalPages,
    hasPreviousPage: currentPage > 1
  };
}

/**
 * Get status priority
 * Used for grouping or prioritizing investigations
 * 
 * @param status Investigation status
 * @returns Priority number
 */
export function getStatusPriority(status: string): number {
  return STATUS_PRIORITY[status] || 99;
}

/**
 * Sort investigations by status priority
 * 
 * @param investigations Investigation array
 * @param order Sort order
 * @returns Sorted array
 */
export function sortByStatusPriority(investigations: any[], order: 'ASC' | 'DESC' = 'ASC'): any[] {
  return [...investigations].sort((a, b) => {
    const priorityA = getStatusPriority(a.ix_status);
    const priorityB = getStatusPriority(b.ix_status);

    return order === 'ASC' ? priorityA - priorityB : priorityB - priorityA;
  });
}

/**
 * Search investigations by claim reference or clinic name
 * 
 * @param investigations Investigation array
 * @param searchTerm Search term (case-insensitive)
 * @returns Filtered array
 */
export function searchInvestigations(investigations: any[], searchTerm: string): any[] {
  if (!searchTerm?.trim()) return investigations;

  const term = searchTerm.toLowerCase();
  return investigations.filter(inv =>
    (inv.claim_ref_no?.toLowerCase().includes(term)) ||
    (inv.clinic_name?.toLowerCase().includes(term)) ||
    (inv.findings?.toLowerCase().includes(term))
  );
}

/**
 * Format investigation response
 * Normalizes data for API response
 * 
 * @param investigation Investigation record
 * @returns Formatted investigation
 */
export function formatInvestigationResponse(investigation: any): any {
  return {
    ix_id: investigation.ix_id,
    claim_id: investigation.claim_id,
    claim_ref_no: investigation.claim_ref_no,
    clinic_id: investigation.clinic_id,
    clinic_name: investigation.clinic_name,
    status: investigation.ix_status, // Map ix_status to status for API
    findings: investigation.findings,
    is_pec_found: investigation.is_pec_found,
    request_payment_amt: investigation.request_payment_amt,
    created_at: investigation.created_at?.toISOString(),
    created_by: investigation.created_by,
    updated_at: investigation.updated_at?.toISOString(),
    updated_by: investigation.updated_by,
    pending_requests_count: investigation.pending_requests_count || 0,
    call_logs_count: investigation.call_logs_count || 0
  };
}

/**
 * Batch format investigations
 * 
 * @param investigations Investigation array
 * @returns Formatted array
 */
export function formatInvestigationsResponse(investigations: any[]): any[] {
  return investigations.map(formatInvestigationResponse);
}

/**
 * Get request type label
 * 
 * @param type Request type code
 * @returns Human-readable label
 */
export function getRequestTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    'MEDICAL_RECORDS': 'Medical Records',
    'DISCHARGE_SUMMARY': 'Discharge Summary',
    'INVESTIGATION_REPORT': 'Investigation Report',
    'SUPPORTING_DOCUMENTS': 'Supporting Documents',
    'CONSULTATION_NOTES': 'Consultation Notes',
    'FINANCIAL_DOCUMENTS': 'Financial Documents'
  };

  return labels[type] || type;
}

/**
 * Calculate days between two dates
 * 
 * @param from Start date
 * @param to End date
 * @returns Number of days
 */
export function daysBetween(from: Date, to: Date = new Date()): number {
  const diffTime = Math.abs(to.getTime() - from.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Build aggregation query for statistics
 * 
 * @returns SQL for counting investigations by status
 */
export function buildStatisticsQuery(): string {
  return `
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN ix_status = 'OPEN' THEN 1 ELSE 0 END) as open_count,
      SUM(CASE WHEN ix_status = 'IN_PROGRESS' THEN 1 ELSE 0 END) as in_progress_count,
      SUM(CASE WHEN ix_status = 'UNDER_REVIEW' THEN 1 ELSE 0 END) as under_review_count,
      SUM(CASE WHEN ix_status = 'COMPLETED' THEN 1 ELSE 0 END) as completed_count,
      SUM(CASE WHEN ix_status = 'CLOSED' THEN 1 ELSE 0 END) as closed_count
    FROM ccms_investigations
  `;
}
