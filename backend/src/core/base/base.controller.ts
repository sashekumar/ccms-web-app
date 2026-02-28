import { Request, Response, NextFunction } from 'express';
import { BaseService } from './base.service';
import { QueryOptions } from './base.repository';
import { ResponseUtil } from '../utils/response.util';
import { getErrorMessage } from '../utils/error.util';

/**
 * Base Controller Pattern
 * Provides common HTTP handlers for CRUD operations
 * All feature controllers should extend this class
 * 
 * @template T - The entity type this controller works with
 */
export abstract class BaseController<T> {
  protected service: BaseService<T>;

  /**
   * @param service - The service instance for this controller
   */
  constructor(service: BaseService<T>) {
    this.service = service;
  }

  /**
   * Get all records
   * GET /resource or POST /resource/list
   */
  public getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { page, limit, sortBy, sortOrder, ...filters } = req.body || req.query;

      const options: QueryOptions = {
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
        sortBy: sortBy as string,
        sortOrder: (sortOrder as 'ASC' | 'DESC') || 'DESC',
        filters
      };

      const records = await this.service.getAll(options);

      ResponseUtil.success(res, records);
    } catch (error: unknown) {
      ResponseUtil.error(res, 'Error fetching records', 500, getErrorMessage(error));
    }
  };

  /**
   * Get single record by ID
   * GET /resource/:id
   */
  public getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const record = await this.service.getById(id);

      ResponseUtil.success(res, record);
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);
      
      if (errorMessage.includes('not found')) {
        ResponseUtil.error(res, errorMessage, 404);
      } else {
        ResponseUtil.error(res, 'Error fetching record', 500, errorMessage);
      }
    }
  };

  /**
   * Create new record
   * POST /resource
   */
  public create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const record = await this.service.create(req.body);

      ResponseUtil.success(res, record, 'Record created successfully', 201);
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);
      
      // Check for validation errors
      if (errorMessage.includes('must be') || errorMessage.includes('required') || errorMessage.includes('already exists')) {
        ResponseUtil.error(res, errorMessage, 400);
      } else {
        ResponseUtil.error(res, 'Error creating record', 500, errorMessage);
      }
    }
  };

  /**
   * Update record
   * PUT /resource/:id
   */
  public update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const record = await this.service.update(id, req.body);

      ResponseUtil.success(res, record, 'Record updated successfully');
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);
      
      if (errorMessage.includes('not found')) {
        ResponseUtil.error(res, errorMessage, 404);
      } else if (errorMessage.includes('must be') || errorMessage.includes('required')) {
        ResponseUtil.error(res, errorMessage, 400);
      } else {
        ResponseUtil.error(res, 'Error updating record', 500, errorMessage);
      }
    }
  };

  /**
   * Delete record (soft delete)
   * DELETE /resource/:id
   */
  public delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      await this.service.delete(id);

      ResponseUtil.success(res, null, 'Record deleted successfully');
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);
      
      if (errorMessage.includes('not found')) {
        ResponseUtil.error(res, errorMessage, 404);
      } else {
        ResponseUtil.error(res, 'Error deleting record', 500, errorMessage);
      }
    }
  };

  /**
   * Count records
   * GET /resource/count
   */
  public count = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const filters = req.query;
      const total = await this.service.count(filters as Record<string, unknown>);

      ResponseUtil.success(res, { total });
    } catch (error: unknown) {
      ResponseUtil.error(res, 'Error counting records', 500, getErrorMessage(error));
    }
  };
}
