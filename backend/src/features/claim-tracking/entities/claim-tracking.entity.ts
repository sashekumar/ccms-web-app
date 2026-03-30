/**
 * Claim Tracking Entities
 * Represents the 3 claim SLA/tracking tables in v7 schema.
 */

export interface ClaimStatusLogEntity {
  log_id: number;
  legacy_status_log_id?: string;
  claim_id: number;
  old_status?: string;
  new_status?: string;
  changed_by?: string;
  changed_at?: Date;
  notes?: string;
  created_at?: Date;
  created_by?: string;
  updated_at?: Date;
  updated_by?: string;
}

export interface ClaimMilestoneEntity {
  milestone_id: number;
  legacy_milestone_id?: string;
  claim_id: number;
  milestone_name?: string;
  milestone_date?: Date;
  created_by?: string;
  created_at?: Date;
  updated_at?: Date;
  updated_by?: string;
}

export interface ClaimDurationEntity {
  duration_id: number;
  legacy_duration_id?: string;
  claim_id: number;
  start_date?: Date;
  end_date?: Date;
  duration_days?: number;
  status?: string;
  created_at?: Date;
  created_by?: string;
  updated_at?: Date;
  updated_by?: string;
}
