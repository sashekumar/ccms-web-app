/**
 * Notifications Log - Frontend Model & Types
 * Defines TypeScript interfaces for frontend notification log operations
 */

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

export interface NotificationFilters {
  claim_id?: bigint;
  member_id?: bigint;
  notification_type?: string;
  send_status?: string;
  sender?: string;
  recipient?: string;
  sent_after?: string;
  sent_before?: string;
  search?: string;
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
