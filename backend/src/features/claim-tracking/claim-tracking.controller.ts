import { Request, Response } from 'express';
import { ClaimTrackingService } from './claim-tracking.service';
import { ResponseUtil } from '../../core/utils/response.util';

export class ClaimTrackingController {
  private readonly service: ClaimTrackingService;

  constructor() {
    this.service = new ClaimTrackingService();
  }

  // POST /claim-tracking/stats
  getStats = async (req: Request, res: Response): Promise<void> => {
    try {
      const stats = await this.service.getStats();
      ResponseUtil.success(res, stats, 'Claim tracking statistics retrieved');
    } catch {
      ResponseUtil.error(res, 'Failed to retrieve claim tracking statistics', 500);
    }
  };

  // POST /claim-tracking/history/:claimId
  getClaimHistory = async (req: Request, res: Response): Promise<void> => {
    try {
      const claimId = parseInt(req.params['claimId']);
      const history = await this.service.getClaimHistory(claimId);
      ResponseUtil.success(res, history, 'Claim history retrieved');
    } catch {
      ResponseUtil.error(res, 'Failed to retrieve claim history', 500);
    }
  };

  // POST /claim-tracking/status-log
  getStatusLogs = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.service.getStatusLogs(req.body || {});
      ResponseUtil.success(res, result, 'Status log records retrieved');
    } catch {
      ResponseUtil.error(res, 'Failed to retrieve status log records', 500);
    }
  };

  // POST /claim-tracking/status-log/create
  createStatusLog = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.userId?.toString() || 'system';
      const id = await this.service.createStatusLog(req.body, userId);
      ResponseUtil.success(res, { log_id: id }, 'Status log entry created');
    } catch {
      ResponseUtil.error(res, 'Failed to create status log entry', 500);
    }
  };

  // PUT /claim-tracking/status-log/:id
  updateStatusLog = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params['id']);
      const userId = (req as any).user?.userId?.toString() || 'system';
      await this.service.updateStatusLog(id, req.body, userId);
      ResponseUtil.success(res, null, 'Status log entry updated');
    } catch {
      ResponseUtil.error(res, 'Failed to update status log entry', 500);
    }
  };

  // POST /claim-tracking/milestones
  getMilestones = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.service.getMilestones(req.body || {});
      ResponseUtil.success(res, result, 'Milestone records retrieved');
    } catch {
      ResponseUtil.error(res, 'Failed to retrieve milestone records', 500);
    }
  };

  // POST /claim-tracking/milestones/create
  createMilestone = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.userId?.toString() || 'system';
      const id = await this.service.createMilestone(req.body, userId);
      ResponseUtil.success(res, { milestone_id: id }, 'Milestone created');
    } catch {
      ResponseUtil.error(res, 'Failed to create milestone', 500);
    }
  };

  // PUT /claim-tracking/milestones/:id
  updateMilestone = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params['id']);
      const userId = (req as any).user?.userId?.toString() || 'system';
      await this.service.updateMilestone(id, req.body, userId);
      ResponseUtil.success(res, null, 'Milestone updated');
    } catch {
      ResponseUtil.error(res, 'Failed to update milestone', 500);
    }
  };

  // POST /claim-tracking/durations
  getDurations = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.service.getDurations(req.body || {});
      ResponseUtil.success(res, result, 'Duration records retrieved');
    } catch {
      ResponseUtil.error(res, 'Failed to retrieve duration records', 500);
    }
  };

  // POST /claim-tracking/durations/create
  createDuration = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.userId?.toString() || 'system';
      const id = await this.service.createDuration(req.body, userId);
      ResponseUtil.success(res, { duration_id: id }, 'Duration record created');
    } catch {
      ResponseUtil.error(res, 'Failed to create duration record', 500);
    }
  };

  // PUT /claim-tracking/durations/:id
  updateDuration = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params['id']);
      const userId = (req as any).user?.userId?.toString() || 'system';
      await this.service.updateDuration(id, req.body, userId);
      ResponseUtil.success(res, null, 'Duration record updated');
    } catch {
      ResponseUtil.error(res, 'Failed to update duration record', 500);
    }
  };
}
