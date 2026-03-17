import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../core/base/base.controller';
import { ResponseUtil } from '../../core/utils/response.util';
import { ClaimsService } from './claims.service';
import { Claim, ClaimFilters } from './entities/claim.entity';
import { updateClaimSchema } from './claims.validator';

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

      const userId = (req as any).user?.user_id?.toString() || 'SYSTEM';

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

      const userId = (req as any).user?.user_id?.toString() || 'SYSTEM';

      await this.service.deleteClaim(id, userId);
      ResponseUtil.success(res, null, 'Claim deleted successfully');
    } catch (error) {
      next(error);
    }
  };
}
