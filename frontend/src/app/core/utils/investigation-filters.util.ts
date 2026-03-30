/**
 * Investigation Filter Utilities
 * 
 * Centralized utility functions for filtering, sorting, and searching investigations
 * Implements reusable patterns for common filter operations
 * 
 * Benefits:
 * - Single source of truth for filter logic
 * - Reduced code duplication
 * - Easier to maintain and test
 * - Consistent filter behavior across components
 */

import { InvestigationResponse, InvestigationFilters } from '../../shared/models/investigations/investigation.model';

/**
 * Investigation status enum with priority order
 * Lower number = higher priority in display
 */
export const INVESTIGATION_STATUS_PRIORITY = {
  'OPEN': 1,
  'IN_PROGRESS': 2,
  'UNDER_REVIEW': 3,
  'COMPLETED': 4,
  'CLOSED': 5
} as const;

/**
 * Valid status transitions for investigation workflow
 * Defines allowed state changes
 */
export const VALID_STATUS_TRANSITIONS: Record<string, string[]> = {
  'OPEN': ['IN_PROGRESS', 'CLOSED'],
  'IN_PROGRESS': ['UNDER_REVIEW', 'OPEN', 'CLOSED'],
  'UNDER_REVIEW': ['COMPLETED', 'IN_PROGRESS', 'CLOSED'],
  'COMPLETED': ['CLOSED'],
  'CLOSED': []
};

/**
 * Request type labels for display
 */
export const REQUEST_TYPE_LABELS: Record<string, string> = {
  'MEDICAL_RECORDS': 'Medical Records',
  'DISCHARGE_SUMMARY': 'Discharge Summary',
  'INVESTIGATION_REPORT': 'Investigation Report',
  'SUPPORTING_DOCUMENTS': 'Supporting Documents',
  'CONSULTATION_NOTES': 'Consultation Notes',
  'FINANCIAL_DOCUMENTS': 'Financial Documents'
};

/**
 * Status colors for UI rendering
 */
export const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  'OPEN': { bg: '#fef3c7', text: '#92400e' },
  'IN_PROGRESS': { bg: '#dbeafe', text: '#1e40af' },
  'UNDER_REVIEW': { bg: '#f3e8ff', text: '#581c87' },
  'COMPLETED': { bg: '#dcfce7', text: '#166534' },
  'CLOSED': { bg: '#f3f4f6', text: '#374151' }
};

/**
 * Build filter payload from UI state
 * Handles null/undefined values and type conversions
 * 
 * @param state UI filter state object
 * @returns Cleaned filter object for API
 */
export function buildInvestigationFilters(state: any): InvestigationFilters {
  return {
    page: state.page || 1,
    limit: state.limit || 10,
    status: state.activeStatusTab !== 'all' ? state.activeStatusTab : undefined,
    searchTerm: state.searchTerm?.trim() || undefined,
    claim_id: state.claimIdFilter ? Number(state.claimIdFilter) : undefined,
    clinic_id: state.clinicIdFilter ? Number(state.clinicIdFilter) : undefined,
    sortBy: (state.sortBy || 'created_at') as 'created_at' | 'status' | 'expected_date',
    sortOrder: state.sortOrder || 'DESC'
  };
}

/**
 * Sort investigations by given field
 * 
 * @param investigations Array of investigations
 * @param sortBy Field to sort by
 * @param order Sort order (ASC/DESC)
 * @returns Sorted array
 */
export function sortInvestigations(
  investigations: InvestigationResponse[],
  sortBy: string,
  order: 'ASC' | 'DESC' = 'DESC'
): InvestigationResponse[] {
  return [...investigations].sort((a, b) => {
    let aVal = (a as any)[sortBy];
    let bVal = (b as any)[sortBy];

    // Handle null values
    if (aVal == null) aVal = '';
    if (bVal == null) bVal = '';

    // Compare
    let comparison = 0;
    if (aVal < bVal) comparison = -1;
    if (aVal > bVal) comparison = 1;

    return order === 'DESC' ? -comparison : comparison;
  });
}

/**
 * Filter investigations by status
 * 
 * @param investigations Array of investigations
 * @param status Status to filter by
 * @returns Filtered array
 */
export function filterByStatus(
  investigations: InvestigationResponse[],
  status: string
): InvestigationResponse[] {
  if (status === 'all' || !status) return investigations;
  return investigations.filter(inv => inv.status === status);
}

/**
 * Search investigations by multiple fields
 * 
 * @param investigations Array of investigations
 * @param searchTerm Search term (case-insensitive)
 * @returns Filtered array
 */
export function searchInvestigations(
  investigations: InvestigationResponse[],
  searchTerm: string
): InvestigationResponse[] {
  if (!searchTerm?.trim()) return investigations;

  const term = searchTerm.toLowerCase();
  return investigations.filter(inv =>
    (inv.claim_ref_no?.toLowerCase().includes(term)) ||
    (inv.clinic_name?.toLowerCase().includes(term)) ||
    (inv.findings?.toLowerCase().includes(term))
  );
}

/**
 * Calculate days since creation for display
 * 
 * @param createdAt ISO date string
 * @returns Number of days
 */
export function daysSinceCreation(createdAt: string): number {
  const created = new Date(createdAt);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - created.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Get status badge color
 * 
 * @param status Investigation status
 * @returns Color object with bg and text
 */
export function getStatusColor(status: string): { bg: string; text: string } {
  return STATUS_COLORS[status] || STATUS_COLORS['OPEN'];
}

/**
 * Get status priority
 * 
 * @param status Investigation status
 * @returns Priority number
 */
export function getStatusPriority(status: string): number {
  return INVESTIGATION_STATUS_PRIORITY[status as keyof typeof INVESTIGATION_STATUS_PRIORITY] || 99;
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
  return VALID_STATUS_TRANSITIONS[currentStatus]?.includes(newStatus) ?? false;
}

/**
 * Get remaining valid transitions for a status
 * 
 * @param status Current status
 * @returns Array of valid next statuses
 */
export function getValidNextStatuses(status: string): string[] {
  return VALID_STATUS_TRANSITIONS[status] || [];
}

/**
 * Format investigation for display purposes
 * Adds UI-specific computed fields
 * 
 * @param investigation Investigation data
 * @returns Enhanced investigation with display fields
 */
export function formatInvestigationForDisplay(investigation: InvestigationResponse): InvestigationResponse & {
  daysOld: number;
  statusColor: { bg: string; text: string };
  displayStatus: string;
} {
  const daysOld = daysSinceCreation(investigation.created_at);
  const statusColor = getStatusColor(investigation.status);
  const displayStatus = investigation.status.replace(/_/g, ' ');

  return {
    ...investigation,
    daysOld,
    statusColor,
    displayStatus
  };
}

/**
 * Batch format multiple investigations
 * 
 * @param investigations Array of investigations
 * @returns Array of formatted investigations
 */
export function formatInvestigationsForDisplay(investigations: InvestigationResponse[]) {
  return investigations.map(formatInvestigationForDisplay);
}
