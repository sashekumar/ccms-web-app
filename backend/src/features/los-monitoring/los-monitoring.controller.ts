import { Request, Response } from 'express';
import { LOSMonitoringService } from './los-monitoring.service';
import { LOSMonitoringFilters } from './dto/los-monitoring.dto';

export class LOSMonitoringController {
  private service: LOSMonitoringService;

  constructor() {
    this.service = new LOSMonitoringService();
  }

  async getStats(req: Request, res: Response) {
    try {
      const stats = await this.service.getStats();
      res.json({ success: true, data: stats });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  }

  async getLOSAlerts(req: Request, res: Response) {
    try {
      const filters: LOSMonitoringFilters = req.body.filters || {};
      const page = req.body.page || 1;
      const limit = req.body.limit || 10;

      const result = await this.service.getLOSAlerts(filters, page, limit);
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

  async getAdmissionLOSAlerts(req: Request, res: Response) {
    try {
      const { admission_id } = req.params;
      const result = await this.service.getAdmissionLOSAlerts(BigInt(admission_id));
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  }

  async createLOSAlert(req: Request, res: Response) {
    try {
      const result = await this.service.createLOSAlert(req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  }

  async updateLOSAlert(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const dto = {
        ...req.body,
        acknowledged_by: (req as any).user?.userId?.toString() || 'system'
      };
      const result = await this.service.updateLOSAlert(BigInt(id), dto);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  }
}
