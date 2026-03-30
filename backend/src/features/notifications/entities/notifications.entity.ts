/**
 * Notifications Log - Entity Definitions
 * Defines interfaces for notification log entities
 */

export interface NotificationLogEntity {
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
  updated_at?: Date | null;
  updated_by?: string | null;
}
