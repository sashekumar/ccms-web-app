/**
 * Monitoring models for 8-Hour Monitoring and LOS Alerts
 */

export interface LOSAlert {
  alert_id: number;
  admission_id: number;
  alert_level: number;
  triggered_at: Date | string;
  current_los: number;
  threshold_days: number;
  status: string;
  notes?: string;
  acknowledged_by?: string;
  acknowledged_at?: Date | string;
  
  // Joined data
  claim_ref_no?: string;
  member_name?: string;
  hospital_name?: string;
  admission_status?: string;
}

export interface AcknowledgeAlertDto {
  alert_id: number;
  notes?: string;
}

export interface EightHourCheck {
  monitoring_id: number;
  admission_id: number;
  check_time: Date | string;
  hours_elapsed: number;
  status: string;
  checked_by?: string;
  notes?: string;
  next_check_due?: Date | string;
  
  // Joined data
  claim_ref_no?: string;
  member_name?: string;
  hospital_name?: string;
  admission_status?: string;
}

export interface RecordCheckDto {
  admission_id: number;
  status: string;  // 'STABLE' | 'REQUIRES_ATTENTION' | 'CRITICAL'
  notes?: string;
}

export interface MonitoringFilters {
  admissionStatus?: string;
  alertLevel?: number;
  alertStatus?: string;
  hospitalId?: number;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface PaginatedLOSAlerts {
  alerts: LOSAlert[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface Paginated8HMChecks {
  checks: EightHourCheck[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
