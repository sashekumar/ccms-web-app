import { Request, Response } from 'express';
import { DefermentMonitoringService } from './deferment-monitoring.service';
import { DefermentMonitoringFilters } from './dto/deferment-monitoring.dto';

export class DefermentMonitoringController {
  private service: DefermentMonitoringService;

  constructor() {
    this.service = new DefermentMonitoringService();
  }

  async getStats(req: Request, res: Response) {
    try {
      const stats = await this.service.getStats();
      res.json({ success: true, data: stats });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  }

  async getDefermentCases(req: Request, res: Response) {
    try {
      const filters: DefermentMonitoringFilters = req.body.filters || {};
      const page = req.body.page || 1;
      const limit = req.body.limit || 10;

      const result = await this.service.getDefermentCases(filters, page, limit);
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

  async getAdmissionDeferment(req: Request, res: Response) {
    try {
      const { admission_id } = req.params;
      const result = await this.service.getAdmissionDeferment(BigInt(admission_id));
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  }

  async updateDefermentCase(req: Request, res: Response) {
    try {
      const { admission_id } = req.params;
      const updated_by = (req as any).user?.userId?.toString() || 'system';
      await this.service.updateDefermentCase(
        BigInt(admission_id),
        req.body.deferment_status,
        updated_by,
        req.body.notes
      );
      const result = await this.service.getAdmissionDeferment(BigInt(admission_id));
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  }
}
