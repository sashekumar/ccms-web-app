export interface LOSAlertRecord {
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
  updated_at: Date;
  created_at: Date;
}

export interface LOSMonitoringFilters {
  admission_id?: bigint;
  alert_level?: number;
  status?: string;
  acknowledged_by?: string;
  triggered_after?: string;
  triggered_before?: string;
  search?: string;
}

export interface LOSMonitoringStatsResponse {
  total_active_alerts: number;
  level_1_alerts: number;
  level_2_alerts: number;
  level_3_alerts: number;
  acknowledged_alerts: number;
  pending_alerts: number;
  average_los: number;
  highest_los: number;
}

export interface PaginatedLOSMonitoringResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}
