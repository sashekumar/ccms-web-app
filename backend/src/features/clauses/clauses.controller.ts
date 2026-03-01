import { Request, Response } from 'express';
import { ClausesService } from './clauses.service';
import { CreateClauseDto, UpdateClauseDto, ClauseFilters, GetClauseRequest } from './clauses.types';
import { ResponseUtil } from '../../core/utils/response.util';
import { getErrorMessage } from '../../core/utils/error.util';

export class ClausesController {
  private service: ClausesService;

  constructor() {
    this.service = new ClausesService();
  }

  /**
   * Get paginated list of clauses
   * POST /api/master/clauses/list
   * Body: { search?, isActive?, page?, limit?, sortBy?, sortOrder? }
   */
  public getClauses = async (req: Request, res: Response): Promise<void> => {
    try {
      // Accept both camelCase and snake_case from frontend
      const filters: ClauseFilters = {
        search: req.body.search,
        isActive: req.body.isActive ?? req.body.is_active,
        page: req.body.page || 1,
        limit: req.body.limit || 10,
        sortBy: req.body.sortBy ?? req.body.sort_by ?? 'clause_id',
        sortOrder: req.body.sortOrder ?? req.body.sort_order ?? 'DESC'
      };

      const result = await this.service.getClauses(filters);

      ResponseUtil.success(res, result, 'Clauses retrieved successfully');
    } catch (error: unknown) {
      ResponseUtil.error(res, 'Error fetching clauses', 500, getErrorMessage(error));
    }
  };

  /**
   * Get clause by ID
   * POST /api/master/clauses/get
   * Body: { clause_id }
   */
  public getClauseById = async (req: Request, res: Response): Promise<void> => {
    try {
      const request: GetClauseRequest = req.body;
      const clauseId = request.clause_id;

      if (!clauseId || isNaN(clauseId)) {
        ResponseUtil.error(res, 'Invalid clause ID', 400);
        return;
      }

      const clause = await this.service.getClauseById(clauseId);

      if (!clause) {
        ResponseUtil.notFound(res, 'Clause not found');
        return;
      }

      ResponseUtil.success(res, clause, 'Clause retrieved successfully');
    } catch (error: unknown) {
      ResponseUtil.error(res, 'Error fetching clause', 500, getErrorMessage(error));
    }
  };

  /**
   * Create new clause
   * POST /api/master/clauses/create
   * Body: { clause_code, clause_text, is_active?, legacy_config_id?, clause_category? }
   */
  public createClause = async (req: Request, res: Response): Promise<void> => {
    try {
      const dto: CreateClauseDto = req.body;

      if (!dto.clause_code || !dto.clause_text) {
        ResponseUtil.error(res, 'clause_code and clause_text are required', 400);
        return;
      }

      const clauseId = await this.service.createClause(dto);

      ResponseUtil.success(res, { clause_id: clauseId }, 'Clause created successfully', 201);
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);
      
      // Check for SQL Server UNIQUE constraint violations
      if (errorMessage.includes('UNIQUE KEY constraint') || errorMessage.includes('duplicate key')) {
        if (errorMessage.includes('clause_code')) {
          ResponseUtil.conflict(res, 'Clause code already exists');
        } else {
          ResponseUtil.conflict(res, 'Duplicate value detected');
        }
        return;
      }
      
      if (errorMessage === 'Clause code already exists') {
        ResponseUtil.conflict(res, errorMessage);
        return;
      }

      if (errorMessage.includes('must be')) {
        ResponseUtil.error(res, errorMessage, 400);
        return;
      }

      ResponseUtil.error(res, 'Error creating clause', 500, errorMessage);
    }
  };

  /**
   * Update clause
   * POST /api/master/clauses/update
   * Body: { clause_id, clause_code?, clause_text?, is_active? }
   */
  public updateClause = async (req: Request, res: Response): Promise<void> => {
    try {
      const clauseId = req.body.clause_id;
      const dto: UpdateClauseDto = {
        clause_code: req.body.clause_code,
        clause_text: req.body.clause_text,
        is_active: req.body.is_active
      };

      if (!clauseId || isNaN(clauseId)) {
        ResponseUtil.error(res, 'Invalid clause ID', 400);
        return;
      }

      await this.service.updateClause(clauseId, dto);

      ResponseUtil.success(res, null, 'Clause updated successfully');
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);
      
      if (errorMessage === 'Clause not found') {
        ResponseUtil.notFound(res, errorMessage);
        return;
      }

      // Check for SQL Server UNIQUE constraint violations
      if (errorMessage.includes('UNIQUE KEY constraint') || errorMessage.includes('duplicate key')) {
        if (errorMessage.includes('clause_code')) {
          ResponseUtil.conflict(res, 'Clause code already exists');
        } else {
          ResponseUtil.conflict(res, 'Duplicate value detected');
        }
        return;
      }

      if (errorMessage === 'Clause code already exists') {
        ResponseUtil.conflict(res, errorMessage);
        return;
      }

      if (errorMessage.includes('must be')) {
        ResponseUtil.error(res, errorMessage, 400);
        return;
      }

      ResponseUtil.error(res, 'Error updating clause', 500, errorMessage);
    }
  };

  /**
   * Delete clause (soft delete)
   * POST /api/master/clauses/delete
   * Body: { clause_id }
   */
  public deleteClause = async (req: Request, res: Response): Promise<void> => {
    try {
      const clauseId = req.body.clause_id;

      if (!clauseId || isNaN(clauseId)) {
        ResponseUtil.error(res, 'Invalid clause ID', 400);
        return;
      }

      await this.service.deleteClause(clauseId);

      ResponseUtil.success(res, null, 'Clause deleted successfully');
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);
      
      if (errorMessage === 'Clause not found') {
        ResponseUtil.notFound(res, errorMessage);
        return;
      }

      ResponseUtil.error(res, 'Error deleting clause', 500, errorMessage);
    }
  };

  /**
   * Check clause code availability
   * POST /api/master/clauses/check-code
   * Body: { clause_code, exclude_clause_id? }
   */
  public checkClauseCode = async (req: Request, res: Response): Promise<void> => {
    try {
      const { clause_code, exclude_clause_id } = req.body;

      const isAvailable = await this.service.checkClauseCodeAvailability(clause_code, exclude_clause_id);

      ResponseUtil.success(res, { available: isAvailable }, 'Clause code availability checked');
    } catch (error: unknown) {
      ResponseUtil.error(res, 'Error checking clause code', 500, getErrorMessage(error));
    }
  };
}
