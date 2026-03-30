/**
 * Deferment Monitoring - Entity
 * Represents deferred claims (admission data with escalation tracking)
 */

export interface DefermentMonitoringEntity {
  admission_id: bigint;
  claim_id: bigint;
  member_id: bigint;
  deferment_status: string;
  deferment_reason?: string | null;
  expected_resolution_date?: Date | null;
  escalation_id?: bigint | null;
  escalation_status?: string | null;
  escalated_to?: string | null;
  last_updated_by: string;
  updated_at: Date;
  created_at: Date;
}
