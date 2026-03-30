/**
 * Notifications Log - Data Transfer Objects
 * API request/response models for notification logs
 */

// ============================================================================
// FILTERS & SEARCH PARAMS
// ============================================================================

export interface NotificationFilters {
  claim_id?: bigint;
  member_id?: bigint;
  notification_type?: string;
  send_status?: string;
  sender?: string; // Filter by created_by
  recipient?: string;
  sent_after?: Date;
  sent_before?: Date;
  search?: string; // Full-text search on recipient_target or message_content
}

// ============================================================================
// CREATE / UPDATE DTOs
// ============================================================================

export interface CreateNotificationDto {
  claim_id?: bigint | null;
  member_id?: bigint | null;
  notification_type: string;
  recipient_target: string;
  message_content?: string | null;
  send_status: string;
  created_by: string;
}

export interface UpdateNotificationDto {
  send_status?: string;
  message_content?: string | null;
  recipient_target?: string;
}

// ============================================================================
// RESPONSE TYPES
// ============================================================================

export interface NotificationLogRecord {
  log_id: bigint;
  claim_id?: bigint | null;
  member_id?: bigint | null;
  notification_type: string;
  recipient_target: string;
  message_content?: string | null;
  send_status: string;
  sent_at: Date;
  created_by: string;
  created_at: Date;
}

export interface NotificationsStatsResponse {
  total_notifications: number;
  notifications_today: number;
  notifications_sent: number;
  notifications_failed: number;
  notifications_pending: number;
  top_notification_type: string | null;
  top_recipient: string | null;
}

export interface PaginatedNotificationResponse<T> {
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
