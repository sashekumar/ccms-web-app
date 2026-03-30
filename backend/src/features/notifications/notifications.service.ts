/**
 * Notifications Log - Service
 * Business logic for notification log operations
 */

import { BaseService } from '../../core/base/base.service';
import { NotificationsRepository } from './notifications.repository';
import { NotificationLogEntity } from './entities/notifications.entity';
import {
  NotificationFilters,
  CreateNotificationDto,
  UpdateNotificationDto,
  NotificationsStatsResponse
} from './dto/notifications.dto';

export class NotificationsService extends BaseService<NotificationLogEntity> {
  private readonly notifRepo: NotificationsRepository;

  constructor() {
    const repo = new NotificationsRepository();
    super(repo);
    this.notifRepo = repo;
  }

  async getNotifications(filters: NotificationFilters, page: number = 1, limit: number = 10) {
    return this.notifRepo.getNotifications(filters, page, limit);
  }

  async createNotification(dto: CreateNotificationDto) {
    return this.notifRepo.createNotification(dto);
  }

  async updateNotification(log_id: bigint, dto: UpdateNotificationDto) {
    return this.notifRepo.updateNotification(log_id, dto);
  }

  async getStats(): Promise<NotificationsStatsResponse> {
    return this.notifRepo.getStats();
  }
}
