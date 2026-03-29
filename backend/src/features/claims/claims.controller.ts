import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../core/base/base.controller';
import { ResponseUtil } from '../../core/utils/response.util';
import { ClaimsService } from './claims.service';
import { Claim, ClaimFilters } from './entities/claim.entity';
import { createClaimSchema, updateClaimSchema } from './claims.validator';

export class ClaimsController extends BaseController<Claim> {
  protected service: ClaimsService;

  constructor() {
    const service = new ClaimsService();
    super(service);
    this.service = service;
  }

  /**
   * POST /api/claims/list
   * Handles complex filtering requiring body payload
   */
  public getClaims = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const filters: ClaimFilters = req.body;
      const result = await this.service.getClaims(filters);
      ResponseUtil.paginated(
        res, 
        result.data, 
        result.meta.page, 
        result.meta.limit, 
        result.meta.total, 
        'Claims retrieved successfully'
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/claims/:id
   */
  public getClaimById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        throw new Error('Invalid claim ID');
      }

      const claim = await this.service.getClaimById(id);
      ResponseUtil.success(res, claim, 'Claim retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * PUT /api/claims/:id
   */
  public updateClaim = async (req: Request, res: Response, next: NextFunction) => {
    try {
       const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        throw new Error('Invalid claim ID');
      }

      const { error, value } = updateClaimSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
      if (error) {
        throw new Error('Validation Error: ' + error.details.map(d => d.message).join(', '));
      }

      const userId = (req as any).user?.userId?.toString() || 'SYSTEM';

      const updatedClaim = await this.service.updateClaim(id, value, userId);
      ResponseUtil.success(res, updatedClaim, 'Claim updated successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /api/claims/:id
   */
  public deleteClaim = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        throw new Error('Invalid claim ID');
      }

      const userId = (req as any).user?.userId?.toString() || 'SYSTEM';

      await this.service.deleteClaim(id, userId);
      ResponseUtil.success(res, null, 'Claim deleted successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/claims
   * Create a new reimbursement claim
   */
  public createClaim = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { error, value } = createClaimSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
      if (error) {
        throw new Error('Validation Error: ' + error.details.map((d: any) => d.message).join(', '));
      }

      const userId = (req as any).user?.userId?.toString() || 'SYSTEM';
      const claim = await this.service.createClaim(value, userId);
      ResponseUtil.success(res, claim, 'Reimbursement claim created successfully');
    } catch (error) {
      next(error);
    }
  };

  // ============================================================================
  // CLAIM EXPENSES
  // ============================================================================

  /**
   * GET /api/claims/:id/expenses
   */
  public getClaimExpenses = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const claimId = parseInt(req.params.id, 10);
      if (isNaN(claimId)) throw new Error('Invalid claim ID');

      const expenses = await this.service.getClaimExpenses(claimId);
      ResponseUtil.success(res, expenses, 'Claim expenses retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/claims/:id/expenses
   */
  public addClaimExpense = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const claimId = parseInt(req.params.id, 10);
      if (isNaN(claimId)) throw new Error('Invalid claim ID');

      const userId = (req as any).user?.userId?.toString() || 'SYSTEM';
      const result = await this.service.addClaimExpense(claimId, req.body, userId);
      ResponseUtil.success(res, result, 'Expense added successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * PUT /api/claims/:id/expenses/:expenseId
   */
  public updateClaimExpense = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const claimId = parseInt(req.params.id, 10);
      const expenseId = parseInt(req.params.expenseId, 10);
      if (isNaN(claimId) || isNaN(expenseId)) throw new Error('Invalid ID');

      const userId = (req as any).user?.userId?.toString() || 'SYSTEM';
      await this.service.updateClaimExpense(claimId, expenseId, req.body, userId);
      ResponseUtil.success(res, null, 'Expense updated successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /api/claims/:id/expenses/:expenseId
   */
  public deleteClaimExpense = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const claimId = parseInt(req.params.id, 10);
      const expenseId = parseInt(req.params.expenseId, 10);
      if (isNaN(claimId) || isNaN(expenseId)) throw new Error('Invalid ID');

      await this.service.deleteClaimExpense(claimId, expenseId);
      ResponseUtil.success(res, null, 'Expense deleted successfully');
    } catch (error) {
      next(error);
    }
  };

  // ============================================================================
  // CLAIM DOCUMENTS
  // ============================================================================

  /**
   * GET /api/claims/:id/documents
   */
  public getClaimDocuments = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const claimId = parseInt(req.params.id, 10);
      if (isNaN(claimId)) throw new Error('Invalid claim ID');

      const documents = await this.service.getClaimDocuments(claimId);
      ResponseUtil.success(res, documents, 'Claim documents retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/claims/:id/documents
   */
  public addClaimDocument = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const claimId = parseInt(req.params.id, 10);
      if (isNaN(claimId)) throw new Error('Invalid claim ID');

      const userId = (req as any).user?.userId?.toString() || 'SYSTEM';
      const result = await this.service.addClaimDocument(claimId, req.body, userId);
      ResponseUtil.success(res, result, 'Document added successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * PUT /api/claims/:id/documents/:docId
   */
  public updateClaimDocument = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const claimId = parseInt(req.params.id, 10);
      const docId = parseInt(req.params.docId, 10);
      if (isNaN(claimId) || isNaN(docId)) throw new Error('Invalid ID');

      const userId = (req as any).user?.userId?.toString() || 'SYSTEM';
      await this.service.updateClaimDocument(claimId, docId, req.body, userId);
      ResponseUtil.success(res, null, 'Document updated successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /api/claims/:id/documents/:docId
   */
  public deleteClaimDocument = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const claimId = parseInt(req.params.id, 10);
      const docId = parseInt(req.params.docId, 10);
      if (isNaN(claimId) || isNaN(docId)) throw new Error('Invalid ID');

      const userId = (req as any).user?.userId?.toString() || 'SYSTEM';
      await this.service.deleteClaimDocument(claimId, docId, userId);
      ResponseUtil.success(res, null, 'Document deleted successfully');
    } catch (error) {
      next(error);
    }
  };
}
