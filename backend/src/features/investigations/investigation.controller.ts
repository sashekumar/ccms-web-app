import { Request, Response } from 'express';
import { InvestigationService } from './investigation.service';
import { InvestigationFilters } from './dto/investigation.dto';
import { ResponseUtil } from '../../core/utils/response.util';
import { getErrorMessage } from '../../core/utils/error.util';
import { logger } from '../../core/utils/logger.util';

/**
 * Investigation Controller
 * Handles HTTP requests for medical investigation case management
 * 
 * Permissions Required:
 * - INVESTIGATIONS.VIEW: View investigation cases
 * - INVESTIGATIONS.UPDATE: Update investigation status, add requests/calls
 */
export class InvestigationController {
  private service: InvestigationService;

  constructor() {
    this.service = new InvestigationService();
  }

  /**
   * Get investigations with filters
   * POST /api/investigations
   * Permission: INVESTIGATIONS.VIEW
   * Body: InvestigationFilters
   */
  public getInvestigations = async (req: Request, res: Response): Promise<void> => {
    try {
      const filters: InvestigationFilters = {
        status: req.body.status,
        claimId: req.body.claim_id,
        clinicId: req.body.clinic_id,
        page: req.body.page ?? 1,
        limit: req.body.limit ?? 10,
        sortBy: req.body.sortBy ?? 'created_at',
        sortOrder: req.body.sortOrder ?? 'DESC',
        searchTerm: req.body.searchTerm
      };

      const result = await this.service.getInvestigations(filters);
      ResponseUtil.success(res, result, 'Investigations retrieved successfully');
    } catch (error: unknown) {
      logger.error('Error fetching investigations:', error);
      ResponseUtil.error(res, 'Error fetching investigations', 500, getErrorMessage(error));
    }
  };

  /**
   * Get investigation by ID
   * POST /api/investigations/:id
   * Permission: INVESTIGATIONS.VIEW
   * Body: {}
   */
  public getInvestigationById = async (req: Request, res: Response): Promise<void> => {
    try {
      const ixId = parseInt(req.params.id);
      if (isNaN(ixId)) {
        ResponseUtil.error(res, 'Invalid investigation ID', 400);
        return;
      }

      const investigation = await this.service.getInvestigationById(ixId);
      ResponseUtil.success(res, investigation, 'Investigation retrieved successfully');
    } catch (error: unknown) {
      const errorMsg = getErrorMessage(error);
      if (errorMsg.includes('not found')) {
        ResponseUtil.error(res, errorMsg, 404);
      } else {
        ResponseUtil.error(res, 'Error fetching investigation', 500, errorMsg);
      }
    }
  };

  /**
   * Create investigation
   * POST /api/investigations/create
   * Permission: INVESTIGATIONS.UPDATE
   * Body: CreateInvestigationDto
   */
  public createInvestigation = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.userId?.toString() || 'system';

      if (!req.body.claim_id || isNaN(req.body.claim_id)) {
        ResponseUtil.error(res, 'Claim ID is required and must be numeric', 400);
        return;
      }

      const investigation = await this.service.createInvestigation(req.body, userId);
      ResponseUtil.success(res, investigation, 'Investigation created successfully', 201);
    } catch (error: unknown) {
      const errorMsg = getErrorMessage(error);
      ResponseUtil.error(
        res,
        errorMsg.includes('already exists') ? 'Investigation already exists for this claim' : 'Error creating investigation',
        errorMsg.includes('already exists') ? 409 : 500,
        errorMsg
      );
    }
  };

  /**
   * Update investigation status
   * PUT /api/investigations/:id
   * Permission: INVESTIGATIONS.UPDATE
   * Body: UpdateInvestigationDto
   */
  public updateInvestigation = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.userId?.toString() || 'system';
      const ixId = parseInt(req.params.id);

      if (isNaN(ixId)) {
        ResponseUtil.error(res, 'Invalid investigation ID', 400);
        return;
      }

      const investigation = await this.service.updateInvestigation(ixId, req.body, userId);
      ResponseUtil.success(res, investigation, 'Investigation updated successfully');
    } catch (error: unknown) {
      const errorMsg = getErrorMessage(error);
      ResponseUtil.error(
        res,
        'Error updating investigation',
        errorMsg.includes('not found') ? 404 : errorMsg.includes('Invalid') ? 400 : 500,
        errorMsg
      );
    }
  };

  /**
   * Add investigation request
   * POST /api/investigations/:id/requests
   * Permission: INVESTIGATIONS.UPDATE
   * Body: CreateInvestigationRequestDto
   */
  public addInvestigationRequest = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.userId?.toString() || 'system';
      const ixId = parseInt(req.params.id);

      if (isNaN(ixId)) {
        ResponseUtil.error(res, 'Invalid investigation ID', 400);
        return;
      }

      if (!req.body.request_type || !req.body.requested_from || !req.body.expected_date) {
        ResponseUtil.error(res, 'request_type, requested_from, and expected_date are required', 400);
        return;
      }

      const requestData = { ix_id: ixId, ...req.body };
      const result = await this.service.addInvestigationRequest(requestData, userId);
      ResponseUtil.success(res, result, 'Investigation request created successfully', 201);
    } catch (error: unknown) {
      logger.error('Error adding investigation request:', error);
      ResponseUtil.error(res, 'Error adding investigation request', 500, getErrorMessage(error));
    }
  };

  /**
   * Update investigation request status
   * PUT /api/investigations/requests/:requestId
   * Permission: INVESTIGATIONS.UPDATE
   * Body: UpdateInvestigationRequestDto
   */
  public updateInvestigationRequest = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.userId?.toString() || 'system';
      const requestId = parseInt(req.params.requestId);

      if (isNaN(requestId)) {
        ResponseUtil.error(res, 'Invalid request ID', 400);
        return;
      }

      await this.service.updateInvestigationRequest(requestId, req.body, userId);
      ResponseUtil.success(res, null, 'Investigation request updated successfully');
    } catch (error: unknown) {
      logger.error('Error updating investigation request:', error);
      ResponseUtil.error(res, 'Error updating investigation request', 500, getErrorMessage(error));
    }
  };

  /**
   * Add call log
   * POST /api/investigations/:id/calls
   * Permission: INVESTIGATIONS.UPDATE
   * Body: CreateInvestigationCallLogDto
   */
  public addCallLog = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.userId?.toString() || 'system';
      const ixId = parseInt(req.params.id);

      if (isNaN(ixId)) {
        ResponseUtil.error(res, 'Invalid investigation ID', 400);
        return;
      }

      if (!req.body.called_party || !req.body.call_duration || !req.body.call_notes) {
        ResponseUtil.error(res, 'called_party, call_duration, and call_notes are required', 400);
        return;
      }

      const callLogData = { ix_id: ixId, ...req.body };
      const result = await this.service.addCallLog(callLogData, userId);
      ResponseUtil.success(res, result, 'Call log created successfully', 201);
    } catch (error: unknown) {
      logger.error('Error adding call log:', error);
      ResponseUtil.error(res, 'Error adding call log', 500, getErrorMessage(error));
    }
  };

  /**
   * Get investigation requests
   * POST /api/investigations/:id/requests/list
   * Permission: INVESTIGATIONS.VIEW
   * Body: {}
   */
  public getInvestigationRequests = async (req: Request, res: Response): Promise<void> => {
    try {
      const ixId = parseInt(req.params.id);
      if (isNaN(ixId)) {
        ResponseUtil.error(res, 'Invalid investigation ID', 400);
        return;
      }

      const requests = await this.service.getInvestigationRequests(ixId);
      ResponseUtil.success(res, requests, 'Investigation requests retrieved successfully');
    } catch (error: unknown) {
      logger.error('Error fetching investigation requests:', error);
      ResponseUtil.error(res, 'Error fetching investigation requests', 500, getErrorMessage(error));
    }
  };

  /**
   * Get call logs
   * POST /api/investigations/:id/calls/list
   * Permission: INVESTIGATIONS.VIEW
   * Body: {}
   */
  public getCallLogs = async (req: Request, res: Response): Promise<void> => {
    try {
      const ixId = parseInt(req.params.id);
      if (isNaN(ixId)) {
        ResponseUtil.error(res, 'Invalid investigation ID', 400);
        return;
      }

      const callLogs = await this.service.getInvestigationCallLogs(ixId);
      ResponseUtil.success(res, callLogs, 'Call logs retrieved successfully');
    } catch (error: unknown) {
      logger.error('Error fetching call logs:', error);
      ResponseUtil.error(res, 'Error fetching call logs', 500, getErrorMessage(error));
    }
  };

  /**
   * Get investigation statistics
   * POST /api/investigations/stats
   * Permission: INVESTIGATIONS.VIEW
   * Body: {}
   */
  public getStats = async (req: Request, res: Response): Promise<void> => {
    try {
      const stats = await this.service.getInvestigationStats();
      ResponseUtil.success(res, stats, 'Investigation statistics retrieved successfully');
    } catch (error: unknown) {
      logger.error('Error fetching investigation statistics:', error);
      ResponseUtil.error(res, 'Error fetching investigation statistics', 500, getErrorMessage(error));
    }
  };

  /**
   * Close investigation
   * PUT /api/investigations/:id/close
   * Permission: INVESTIGATIONS.UPDATE
   * Body: CloseInvestigationDto
   */
  public closeInvestigation = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.userId?.toString() || 'system';
      const ixId = parseInt(req.params.id);

      if (isNaN(ixId)) {
        ResponseUtil.error(res, 'Invalid investigation ID', 400);
        return;
      }

      if (!req.body.status || !req.body.final_findings || req.body.is_pec_found === undefined) {
        ResponseUtil.error(res, 'status, final_findings, and is_pec_found are required', 400);
        return;
      }

      const investigation = await this.service.closeInvestigation(ixId, req.body, userId);
      ResponseUtil.success(res, investigation, 'Investigation closed successfully');
    } catch (error: unknown) {
      logger.error('Error closing investigation:', error);
      ResponseUtil.error(res, 'Error closing investigation', 500, getErrorMessage(error));
    }
  };
}
