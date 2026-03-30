/**
 * Notifications Log - Controller
 * Handles HTTP requests for notification log operations
 */

import { Request, Response } from 'express';
import { NotificationsService } from './notifications.service';
import { NotificationFilters } from './dto/notifications.dto';

export class NotificationsController {
  private service: NotificationsService;

  constructor() {
    this.service = new NotificationsService();
  }

  // ========================================================================
  // STATISTICS
  // ========================================================================

  async getStats(req: Request, res: Response) {
    try {
      const stats = await this.service.getStats();
      res.json({ success: true, data: stats });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  }

  // ========================================================================
  // NOTIFICATION LOG OPERATIONS
  // ========================================================================

  async getNotifications(req: Request, res: Response) {
    try {
      const filters: NotificationFilters = req.body.filters || {};
      const page = req.body.page || 1;
      const limit = req.body.limit || 10;

      const result = await this.service.getNotifications(filters, page, limit);
      res.json({
        success: true,
        data: result.data,
        total: result.total,
        page,
        limit,
        pages: Math.ceil(result.total / limit)
      });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  }

  async createNotification(req: Request, res: Response) {
    try {
      const dto = {
        ...req.body,
        created_by: (req as any).user?.userId?.toString() || 'system'
      };

      const result = await this.service.createNotification(dto);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  }

  async updateNotification(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await this.service.updateNotification(BigInt(id), req.body);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  }
}
