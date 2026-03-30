export interface DefermentRequest {
  deferment_id: bigint;
  admission_id: bigint;
  requested_by: string;
  request_date: Date;
  deferment_reason: string;
  original_settlement_date: Date;
  proposed_settlement_date: Date;
  status: string;
  approved_by?: string | null;
  approval_date?: Date | null;
  comments?: string | null;
  updated_at: Date;
  created_at: Date;
}

export interface DefermentFilters {
  admission_id?: bigint;
  requested_by?: string;
  status?: string;
  approved_by?: string;
  created_after?: string;
  created_before?: string;
  search?: string;
}

export interface DefermentStatsResponse {
  total_deferments: number;
  pending_approval: number;
  approved_deferments: number;
  rejected_deferments: number;
  average_deferment_days: number;
  earliest_approval_date: string;
  latest_approval_date: string;
}

export interface PaginatedDefermentResponse<T> {
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
