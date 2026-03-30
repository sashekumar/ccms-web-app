export interface Escalation {
  esc_id: number;
  legacy_escalation_id?: string | null;
  claim_id: number;
  source_id?: number | null;
  nature_id?: number | null;
  assigned_to?: string | null;
  status?: string | null;
  priority?: string | null;
  created_at?: Date;
  created_by?: string | null;
  closed_at?: Date | null;
  updated_at?: Date | null;
  updated_by?: string | null;
  // Joined fields (from SELECT JOIN)
  claim_ref_no?: string;
  source_code?: string;
  source_description?: string;
  nature_code?: string;
  nature_description?: string;
}

export interface EscalationSource {
  source_id: number;
  source_code: string;
  source_description: string;
  is_active: boolean;
}

export interface EscalationNature {
  nature_id: number;
  nature_code: string;
  nature_description: string;
  is_active: boolean;
}

export interface EscalationUpdate {
  update_id: number;
  esc_id: number;
  update_description: string;
  updated_by: string;
  updated_at: Date;
  remarks?: string | null;
  created_at: Date;
  created_by?: string | null;
}

export interface EscalationFilters {
  page?: number;
  limit?: number;
  status?: string;
  priority?: string;
  source_id?: number;
  assigned_to?: string;
  search?: string;
}
