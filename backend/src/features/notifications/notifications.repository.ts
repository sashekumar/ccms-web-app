/**
 * Notifications Log - Repository
 * Database operations for notification logs
 */

import sql from 'mssql';
import { connectionManager } from '../../core/database/connection-manager';
import { BaseRepository } from '../../core/base/base.repository';
import { DB_TABLES } from '../../core/constants';
import { NotificationLogEntity } from './entities/notifications.entity';
import {
  NotificationFilters,
  CreateNotificationDto,
  UpdateNotificationDto,
  NotificationLogRecord,
  NotificationsStatsResponse
} from './dto/notifications.dto';

export class NotificationsRepository extends BaseRepository<NotificationLogEntity> {
  constructor() {
    super(DB_TABLES.NOTIFICATIONS_LOG, 'log_id', false);
  }

  // ========================================================================
  // NOTIFICATION LOG OPERATIONS
  // ========================================================================

  async getNotifications(
    filters: NotificationFilters,
    page: number = 1,
    limit: number = 10
  ): Promise<{ data: NotificationLogRecord[]; total: number }> {
    const pool = await connectionManager.getPool();
    const request = pool.request();
    const offset = (page - 1) * limit;
    const where: string[] = [];

    if (filters.claim_id !== undefined) {
      where.push('claim_id = @claim_id');
      request.input('claim_id', sql.BigInt, filters.claim_id);
    }
    if (filters.member_id !== undefined) {
      where.push('member_id = @member_id');
      request.input('member_id', sql.BigInt, filters.member_id);
    }
    if (filters.notification_type) {
      where.push('notification_type = @notification_type');
      request.input('notification_type', sql.VarChar(50), filters.notification_type);
    }
    if (filters.send_status) {
      where.push('send_status = @send_status');
      request.input('send_status', sql.VarChar(50), filters.send_status);
    }
    if (filters.sender) {
      where.push('created_by = @created_by');
      request.input('created_by', sql.VarChar(50), filters.sender);
    }
    if (filters.recipient) {
      where.push('recipient_target = @recipient_target');
      request.input('recipient_target', sql.NVarChar(255), filters.recipient);
    }
    if (filters.sent_after) {
      where.push('sent_at >= @sent_after');
      request.input('sent_after', sql.DateTime2, new Date(filters.sent_after));
    }
    if (filters.sent_before) {
      where.push('sent_at <= @sent_before');
      request.input('sent_before', sql.DateTime2, new Date(filters.sent_before));
    }
    if (filters.search) {
      where.push('(recipient_target LIKE @search OR message_content LIKE @search)');
      request.input('search', sql.NVarChar(255), `%${filters.search}%`);
    }

    const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

    const countResult = await request.query(`
      SELECT COUNT(*) as total FROM ${DB_TABLES.NOTIFICATIONS_LOG} ${whereClause}
    `);
    const total = countResult.recordset[0]?.total || 0;

    request.input('offset', sql.Int, offset);
    request.input('limit', sql.Int, limit);

    const result = await request.query(`
      SELECT
        log_id, claim_id, member_id, notification_type, recipient_target,
        message_content, send_status, sent_at, created_by, created_at
      FROM ${DB_TABLES.NOTIFICATIONS_LOG}
      ${whereClause}
      ORDER BY sent_at DESC
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
    `);

    return {
      data: result.recordset as NotificationLogRecord[],
      total
    };
  }

  async createNotification(dto: CreateNotificationDto): Promise<NotificationLogEntity> {
    const pool = await connectionManager.getPool();
    const request = pool.request();

    request.input('claim_id', sql.BigInt, dto.claim_id || null);
    request.input('member_id', sql.BigInt, dto.member_id || null);
    request.input('notification_type', sql.VarChar(50), dto.notification_type);
    request.input('recipient_target', sql.NVarChar(255), dto.recipient_target);
    request.input('message_content', sql.NVarChar(sql.MAX), dto.message_content || null);
    request.input('send_status', sql.VarChar(50), dto.send_status);
    request.input('created_by', sql.VarChar(50), dto.created_by);

    const result = await request.query(`
      INSERT INTO ${DB_TABLES.NOTIFICATIONS_LOG}
        (claim_id, member_id, notification_type, recipient_target, message_content, send_status, sent_at, created_by, created_at)
      VALUES
        (@claim_id, @member_id, @notification_type, @recipient_target, @message_content, @send_status, GETDATE(), @created_by, GETDATE())
      SELECT *
      FROM ${DB_TABLES.NOTIFICATIONS_LOG}
      WHERE log_id = SCOPE_IDENTITY()
    `);

    return result.recordset[0] || { log_id: 0n } as NotificationLogEntity;
  }

  async updateNotification(log_id: bigint, dto: UpdateNotificationDto): Promise<NotificationLogEntity> {
    const pool = await connectionManager.getPool();
    const request = pool.request();

    request.input('log_id', sql.BigInt, log_id);
    if (dto.send_status !== undefined) {
      request.input('send_status', sql.VarChar(50), dto.send_status);
    }
    if (dto.message_content !== undefined) {
      request.input('message_content', sql.NVarChar(sql.MAX), dto.message_content);
    }
    if (dto.recipient_target !== undefined) {
      request.input('recipient_target', sql.NVarChar(255), dto.recipient_target);
    }

    const updates: string[] = [];
    if (dto.send_status !== undefined) updates.push('send_status = @send_status');
    if (dto.message_content !== undefined) updates.push('message_content = @message_content');
    if (dto.recipient_target !== undefined) updates.push('recipient_target = @recipient_target');
    if (updates.length === 0) return { log_id: 0n } as NotificationLogEntity;

    updates.push('updated_at = GETDATE()');
    updates.push("updated_by = 'system'");

    const result = await request.query(`
      UPDATE ${DB_TABLES.NOTIFICATIONS_LOG}
      SET ${updates.join(', ')}
      WHERE log_id = @log_id
      SELECT *
      FROM ${DB_TABLES.NOTIFICATIONS_LOG}
      WHERE log_id = @log_id
    `);

    return result.recordset[0] || { log_id: 0n } as NotificationLogEntity;
  }

  // ========================================================================
  // STATISTICS
  // ========================================================================

  async getStats(): Promise<NotificationsStatsResponse> {
    const pool = await connectionManager.getPool();
    const request = pool.request();

    const result = await request.query(`
      SELECT
        (SELECT COUNT(*) FROM ${DB_TABLES.NOTIFICATIONS_LOG}) as total_notifications,
        (SELECT COUNT(*) FROM ${DB_TABLES.NOTIFICATIONS_LOG} WHERE CAST(sent_at AS DATE) = CAST(GETDATE() AS DATE)) as notifications_today,
        (SELECT COUNT(*) FROM ${DB_TABLES.NOTIFICATIONS_LOG} WHERE send_status = 'SENT') as notifications_sent,
        (SELECT COUNT(*) FROM ${DB_TABLES.NOTIFICATIONS_LOG} WHERE send_status = 'FAILED') as notifications_failed,
        (SELECT COUNT(*) FROM ${DB_TABLES.NOTIFICATIONS_LOG} WHERE send_status = 'PENDING') as notifications_pending,
        (SELECT TOP 1 notification_type FROM ${DB_TABLES.NOTIFICATIONS_LOG} GROUP BY notification_type ORDER BY COUNT(*) DESC) as top_notification_type,
        (SELECT TOP 1 recipient_target FROM ${DB_TABLES.NOTIFICATIONS_LOG} GROUP BY recipient_target ORDER BY COUNT(*) DESC) as top_recipient
    `);

    return result.recordset[0] || {
      total_notifications: 0,
      notifications_today: 0,
      notifications_sent: 0,
      notifications_failed: 0,
      notifications_pending: 0,
      top_notification_type: null,
      top_recipient: null
    };
  }
}
