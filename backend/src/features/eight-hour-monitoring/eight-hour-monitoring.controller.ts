import { Request, Response } from 'express';
import { EightHourMonitoringService } from './eight-hour-monitoring.service';
import { EightHourMonitoringFilters } from './dto/eight-hour-monitoring.dto';

export class EightHourMonitoringController {
  private service: EightHourMonitoringService;

  constructor() {
    this.service = new EightHourMonitoringService();
  }

  async getStats(req: Request, res: Response) {
    try {
      const stats = await this.service.getStats();
      res.json({ success: true, data: stats });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  }

  async getMonitoringChecks(req: Request, res: Response) {
    try {
      const filters: EightHourMonitoringFilters = req.body.filters || {};
      const page = req.body.page || 1;
      const limit = req.body.limit || 10;

      const result = await this.service.getMonitoringChecks(filters, page, limit);
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

  async getAdmissionMonitoringChecks(req: Request, res: Response) {
    try {
      const { admission_id } = req.params;
      const result = await this.service.getAdmissionMonitoringChecks(BigInt(admission_id));
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  }

  async createMonitoringCheck(req: Request, res: Response) {
    try {
      const dto = {
        ...req.body,
        checked_by: (req as any).user?.userId?.toString() || 'system'
      };
      const result = await this.service.createMonitoringCheck(dto);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  }

  async updateMonitoringCheck(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const dto = {
        ...req.body,
        checked_by: (req as any).user?.userId?.toString() || 'system'
      };
      const result = await this.service.updateMonitoringCheck(BigInt(id), dto);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  }
}
