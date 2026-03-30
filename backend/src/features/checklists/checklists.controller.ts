/**
 * Checklists - Controller
 * Handles HTTP requests for checklists operations
 */

import { Request, Response } from 'express';
import { ChecklistsService } from './checklists.service';
import { ChecklistFilters } from './dto/checklists.dto';

export class ChecklistsController {
  private service: ChecklistsService;

  constructor() {
    this.service = new ChecklistsService();
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
  // CHECKLISTS
  // ========================================================================

  async getChecklists(req: Request, res: Response) {
    try {
      const filters: ChecklistFilters = req.body.filters || {};
      const page = req.body.page || 1;
      const limit = req.body.limit || 10;

      const result = await this.service.getChecklists(filters, page, limit);
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

  async getClaimChecklists(req: Request, res: Response) {
    try {
      const { claim_id } = req.params;
      const result = await this.service.getClaimChecklists(BigInt(claim_id));
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  }

  async createChecklist(req: Request, res: Response) {
    try {
      const dto = {
        ...req.body,
        updated_by: (req as any).user?.userId?.toString() || 'system'
      };

      const result = await this.service.createChecklist(dto);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  }

  async updateChecklist(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const dto = {
        ...req.body,
        updated_by: (req as any).user?.userId?.toString() || 'system'
      };

      const result = await this.service.updateChecklist(BigInt(id), dto);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  }

  async deleteChecklist(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await this.service.deleteChecklist(BigInt(id));
      res.json({ success: true, data: { deleted: result } });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  }
}
