/**
 * Audit Trail - Controller
 * Handles HTTP requests for audit trail operations
 */

import { Request, Response } from 'express';
import { AuditTrailService } from './audit-trail.service';
import { AuditLogFilters, AdmissionLogFilters } from './dto/audit-trail.dto';

export class AuditTrailController {
  private service: AuditTrailService;

  constructor() {
    this.service = new AuditTrailService();
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
  // AUDIT LOGS
  // ========================================================================

  async getAuditLogs(req: Request, res: Response) {
    try {
      const filters: AuditLogFilters = req.body.filters || {};
      const page = req.body.page || 1;
      const limit = req.body.limit || 10;

      const result = await this.service.getAuditLogs(filters, page, limit);
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

  async createAuditLog(req: Request, res: Response) {
    try {
      const dto = {
        ...req.body,
        changed_by: (req as any).user?.userId?.toString() || 'system'
      };

      const result = await this.service.createAuditLog(dto);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  }

  async updateAuditLog(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await this.service.updateAuditLog(BigInt(id), req.body);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  }

  // ========================================================================
  // ADMISSION LOGS
  // ========================================================================

  async getAdmissionLogs(req: Request, res: Response) {
    try {
      const filters: AdmissionLogFilters = req.body.filters || {};
      const page = req.body.page || 1;
      const limit = req.body.limit || 10;

      const result = await this.service.getAdmissionLogs(filters, page, limit);
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

  async createAdmissionLog(req: Request, res: Response) {
    try {
      const dto = {
        ...req.body,
        changed_by: (req as any).user?.userId?.toString() || 'system'
      };

      const result = await this.service.createAdmissionLog(dto);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  }

  async updateAdmissionLog(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await this.service.updateAdmissionLog(BigInt(id), req.body);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  }
}
