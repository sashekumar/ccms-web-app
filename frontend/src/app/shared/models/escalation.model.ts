/**
 * Escalation Data Models
 * 
 * Frontend interfaces for escalation-related DTOs and responses
 */

export interface CreateEscalationDto {
  claim_id: number;
  source_id: number;
  nature_id: number;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  remarks?: string;
}

export interface UpdateEscalationDto {
  status?: 'UNASSIGNED' | 'ASSIGNED' | 'RESOLVED' | 'CLOSED';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  assigned_to?: number;
  deadline?: string;
  remarks?: string;
}

export interface AddEscalationUpdateDto {
  update_text: string;
  escalation_type: 'INTERNAL_NOTE' | 'STATUS_CHANGE' | 'ACTION_TAKEN';
  remarks?: string;
}

export interface CloseEscalationDto {
  remarks: string;
  resolution_notes?: string;
}

export interface EscalationUpdate {
  id: number;
  escalation_id: number;
  update_text: string;
  escalation_type: string;
  remarks?: string;
  created_by: number;
  created_at: string;
}

export interface EscalationSource {
  id: number;
  source_name: string;
  description?: string;
}

export interface EscalationNature {
  id: number;
  nature_name: string;
  description?: string;
}

export interface EscalationResponse {
  id: number;
  claim_id: number;
  source_id: number;
  source_name?: string;
  nature_id: number;
  nature_name?: string;
  status: 'UNASSIGNED' | 'ASSIGNED' | 'RESOLVED' | 'CLOSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  assigned_to?: number;
  assigned_to_name?: string;
  deadline?: string;
  remarks?: string;
  created_by: number;
  created_at: string;
  updated_at?: string;
  closed_at?: string;
  updates?: EscalationUpdate[];
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
