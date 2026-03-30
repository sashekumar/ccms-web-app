/**
 * Eight Hour Monitoring - Entity
 * Represents 8-hour monitoring check records
 */

export interface EightHourMonitoringEntity {
  monitoring_id: bigint;
  admission_id: bigint;
  check_time: Date;
  hours_elapsed: number;
  status: string;
  checked_by: string;
  notes?: string | null;
  next_check_due: Date;
  created_at: Date;
  created_by?: string | null;
  updated_at?: Date | null;
  updated_by?: string | null;
}
