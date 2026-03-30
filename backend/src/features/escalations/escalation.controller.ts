import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../core/base/base.controller';
import { ResponseUtil } from '../../core/utils/response.util';
import { EscalationService } from './escalation.service';
import { Escalation } from './entities/escalation.entity';

export class EscalationController extends BaseController<Escalation> {
  protected service: EscalationService;

  constructor() {
    const service = new EscalationService();
    super(service);
    this.service = service;
  }

  /**
   * POST /api/escalations
   * List escalations with pagination and filters
   */
  public getEscalations = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const filters = {
        page: req.body.page ? parseInt(req.body.page as string, 10) : 1,
        limit: req.body.pageSize ? parseInt(req.body.pageSize as string, 10) : 10,
        status: req.body.status as string | undefined,
        priority: req.body.priority as string | undefined,
        source_id: req.body.source_id ? parseInt(req.body.source_id as string, 10) : undefined,
        assigned_to: req.body.assigned_to as string | undefined,
        search: req.body.search as string | undefined
      };

      const result = await this.service.getEscalations(filters);
      ResponseUtil.paginated(
        res,
        result.escalations,
        result.page,
        result.limit,
        result.total,
        'Escalations retrieved successfully'
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/escalations/:id
   * Get escalation by ID
   */
  public getEscalationById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        throw new Error('Invalid escalation ID');
      }

      const escalation = await this.service.getEscalationById(id);
      ResponseUtil.success(res, escalation, 'Escalation retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * PUT /api/escalations/:id
   * Assign, update priority, or change status
   */
  public updateEscalation = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        throw new Error('Invalid escalation ID');
      }

      const userId = (req as any).user?.userId?.toString() || 'SYSTEM';
      const updated = await this.service.updateEscalation(id, req.body, userId);
      ResponseUtil.success(res, updated, 'Escalation updated successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/escalations/:id/assign
   * Assign escalation to an officer
   */
  public assignEscalation = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        throw new Error('Invalid escalation ID');
      }

      const { assigned_to } = req.body;
      if (!assigned_to || !assigned_to.trim()) {
        throw new Error('assigned_to is required');
      }

      const userId = (req as any).user?.userId?.toString() || 'SYSTEM';
      const updated = await this.service.updateEscalation(
        id,
        { assigned_to, status: 'ASSIGNED' },
        userId
      );

      ResponseUtil.success(res, updated, 'Escalation assigned successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/escalations/:id/updates
   * Add update/remark to escalation
   */
  public addEscalationUpdate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        throw new Error('Invalid escalation ID');
      }

      const { update_description, remarks } = req.body;
      if (!update_description || !update_description.trim()) {
        throw new Error('update_description is required');
      }

      const userId = (req as any).user?.userId?.toString() || 'SYSTEM';
      await this.service.addEscalationUpdate(id, { update_description, remarks }, userId);

      ResponseUtil.success(res, null, 'Escalation update added successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/escalations/:id/updates
   * Get all updates for an escalation
   */
  public getEscalationUpdates = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        throw new Error('Invalid escalation ID');
      }

      const updates = await this.service.getEscalationUpdates(id);
      ResponseUtil.success(res, updates, 'Escalation updates retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/escalations/:id/close
   * Close an escalation
   */
  public closeEscalation = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        throw new Error('Invalid escalation ID');
      }

      const userId = (req as any).user?.userId?.toString() || 'SYSTEM';
      const closed = await this.service.closeEscalation(id, req.body, userId);

      ResponseUtil.success(res, closed, 'Escalation closed successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/escalations/lookups/sources
   */
  public getEscalationSources = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const sources = await this.service.getEscalationSources();
      ResponseUtil.success(res, sources, 'Escalation sources retrieved');
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/escalations/lookups/natures
   */
  public getEscalationNatures = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const natures = await this.service.getEscalationNatures();
      ResponseUtil.success(res, natures, 'Escalation natures retrieved');
    } catch (error) {
      next(error);
    }
  };
}
