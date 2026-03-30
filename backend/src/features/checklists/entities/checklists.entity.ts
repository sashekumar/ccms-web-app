/**
 * Checklists - Entity Definitions
 * Defines interfaces for checklist entities
 */

export interface ChecklistEntity {
  checklist_id: bigint;
  legacy_checklist_id?: string | null;
  claim_id: bigint;
  checklist_type?: string | null;
  check_key: string;
  check_value?: string | null;
  updated_by: string;
  updated_at: Date;
  created_at: Date;
  created_by?: string | null;
}
