/**
 * LOS Alerts - Entity
 * Represents Length of Stay alert records
 */

export interface LOSAlertEntity {
  alert_id: bigint;
  admission_id: bigint;
  alert_level: number;
  triggered_at: Date;
  current_los: number;
  threshold_days: number;
  status: string;
  acknowledged_by?: string | null;
  acknowledged_at?: Date | null;
  notes?: string | null;
  created_at: Date;
  created_by?: string | null;
  updated_at?: Date | null;
  updated_by?: string | null;
}
