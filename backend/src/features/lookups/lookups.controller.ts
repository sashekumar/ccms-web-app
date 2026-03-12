import { Request, Response } from 'express';
import { LookupsService } from './lookups.service';
import {
  CreateLookupCategoryDto,
  UpdateLookupCategoryDto,
  LookupCategoryFilters,
  GetLookupCategoryRequest,
  CreateLookupDto,
  UpdateLookupDto,
  LookupFilters,
  GetLookupRequest,
  GetLookupsByCategoryRequest,
  CreateLookupMetadataDto,
  UpdateLookupMetadataDto,
  LookupMetadataFilters,
  GetLookupMetadataRequest
} from './lookups.types';
import { ResponseUtil } from '../../core/utils/response.util';
import { getErrorMessage } from '../../core/utils/error.util';

export class LookupsController {
  private service: LookupsService;

  constructor() {
    this.service = new LookupsService();
  }

  // ========================================================================
  // LOOKUP CATEGORIES
  // ========================================================================

  /**
   * Get paginated list of lookup categories
   * POST /api/master/lookups/categories/list
   */
  public getCategories = async (req: Request, res: Response): Promise<void> => {
    try {
      const filters: LookupCategoryFilters = {
        search: req.body.search,
        is_active: req.body.is_active,
        page: req.body.page || 1,
        limit: req.body.limit || 10,
        sort_by: req.body.sort_by ?? 'category_id',
        sort_order: req.body.sort_order ?? 'DESC'
      };

      const result = await this.service.getLookupCategories(filters);

      ResponseUtil.success(res, result, 'Categories retrieved successfully');
    } catch (error: unknown) {
      ResponseUtil.error(res, 'Error fetching categories', 500, getErrorMessage(error));
    }
  };

  /**
   * Get lookup category by ID
   * POST /api/master/lookups/categories/get
   */
  public getCategoryById = async (req: Request, res: Response): Promise<void> => {
    try {
      const request: GetLookupCategoryRequest = req.body;
      const categoryId = request.category_id;

      if (!categoryId || isNaN(categoryId)) {
        ResponseUtil.error(res, 'Invalid category ID', 400);
        return;
      }

      const category = await this.service.getLookupCategoryById(categoryId);

      if (!category) {
        ResponseUtil.notFound(res, 'Category not found');
        return;
      }

      ResponseUtil.success(res, category, 'Category retrieved successfully');
    } catch (error: unknown) {
      ResponseUtil.error(res, 'Error fetching category', 500, getErrorMessage(error));
    }
  };

  /**
   * Create new lookup category
   * POST /api/master/lookups/categories/create
   */
  public createCategory = async (req: Request, res: Response): Promise<void> => {
    try {
      const createdBy = (req as any).user?.userId?.toString();
      const dto: CreateLookupCategoryDto = req.body;

      if (!dto.category_name) {
        ResponseUtil.error(res, 'category_name is required', 400);
        return;
      }

      const categoryId = await this.service.createLookupCategory(dto, createdBy);

      ResponseUtil.success(res, { category_id: categoryId }, 'Category created successfully', 201);
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);

      // Check for SQL Server UNIQUE constraint violations
      if (errorMessage.includes('UNIQUE KEY constraint') || errorMessage.includes('duplicate key')) {
        if (errorMessage.includes('category_name')) {
          ResponseUtil.conflict(res, 'Category name already exists');
        } else {
          ResponseUtil.conflict(res, 'Duplicate value detected');
        }
        return;
      }

      if (errorMessage === 'Category name already exists') {
        ResponseUtil.conflict(res, errorMessage);
        return;
      }

      if (errorMessage.includes('must be')) {
        ResponseUtil.error(res, errorMessage, 400);
        return;
      }

      ResponseUtil.error(res, 'Error creating category', 500, errorMessage);
    }
  };

  /**
   * Update lookup category
   * POST /api/master/lookups/categories/update
   */
  public updateCategory = async (req: Request, res: Response): Promise<void> => {
    try {
      const updatedBy = (req as any).user?.userId?.toString();
      const categoryId = req.body.category_id;
      const dto: UpdateLookupCategoryDto = {
        category_name: req.body.category_name,
        description: req.body.description,
        is_active: req.body.is_active
      };

      if (!categoryId || isNaN(categoryId)) {
        ResponseUtil.error(res, 'Invalid category ID', 400);
        return;
      }

      await this.service.updateLookupCategory(categoryId, dto, updatedBy);

      ResponseUtil.success(res, null, 'Category updated successfully');
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);

      // Check for SQL Server UNIQUE constraint violations
      if (errorMessage.includes('UNIQUE KEY constraint') || errorMessage.includes('duplicate key')) {
        if (errorMessage.includes('category_name')) {
          ResponseUtil.conflict(res, 'Category name already exists');
        } else {
          ResponseUtil.conflict(res, 'Duplicate value detected');
        }
        return;
      }

      if (errorMessage === 'Category not found') {
        ResponseUtil.notFound(res, errorMessage);
        return;
      }

      if (errorMessage === 'Category name already exists') {
        ResponseUtil.conflict(res, errorMessage);
        return;
      }

      if (errorMessage.includes('must be')) {
        ResponseUtil.error(res, errorMessage, 400);
        return;
      }

      ResponseUtil.error(res, 'Error updating category', 500, errorMessage);
    }
  };

  /**
   * Delete lookup category (soft delete)
   * POST /api/master/lookups/categories/delete
   */
  public deleteCategory = async (req: Request, res: Response): Promise<void> => {
    try {
      const categoryId = req.body.category_id;

      if (!categoryId || isNaN(categoryId)) {
        ResponseUtil.error(res, 'Invalid category ID', 400);
        return;
      }

      await this.service.deleteLookupCategory(categoryId);

      ResponseUtil.success(res, null, 'Category deleted successfully');
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);

      if (errorMessage === 'Category not found') {
        ResponseUtil.notFound(res, errorMessage);
        return;
      }

      ResponseUtil.error(res, 'Error deleting category', 500, errorMessage);
    }
  };

  /**
   * Check category code availability
   * POST /api/master/lookups/categories/check-code
   */
  public checkCategoryCode = async (req: Request, res: Response): Promise<void> => {
    try {
      const { category_code, exclude_category_id } = req.body;

      const isAvailable = await this.service.checkCategoryNameAvailability(category_code, exclude_category_id);

      ResponseUtil.success(res, { available: isAvailable }, 'Category code availability checked');
    } catch (error: unknown) {
      ResponseUtil.error(res, 'Error checking category code', 500, getErrorMessage(error));
    }
  };

  // ========================================================================
  // LOOKUPS
  // ========================================================================

  /**
   * Get paginated list of lookups
   * POST /api/master/lookups/list
   */
  public getLookups = async (req: Request, res: Response): Promise<void> => {
    try {
      const filters: LookupFilters = {
        search: req.body.search,
        category_id: req.body.category_id,
        is_active: req.body.is_active,
        page: req.body.page || 1,
        limit: req.body.limit || 10,
        sort_by: req.body.sort_by ?? 'sort_order',
        sort_order: req.body.sort_order ?? 'ASC'
      };

      const result = await this.service.getLookups(filters);

      ResponseUtil.success(res, result, 'Lookups retrieved successfully');
    } catch (error: unknown) {
      ResponseUtil.error(res, 'Error fetching lookups', 500, getErrorMessage(error));
    }
  };

  /**
   * Get lookup by ID
   * POST /api/master/lookups/get
   */
  public getLookupById = async (req: Request, res: Response): Promise<void> => {
    try {
      const request: GetLookupRequest = req.body;
      const lookupId = request.lookup_id;

      if (!lookupId || isNaN(lookupId)) {
        ResponseUtil.error(res, 'Invalid lookup ID', 400);
        return;
      }

      const lookup = await this.service.getLookupById(lookupId);

      if (!lookup) {
        ResponseUtil.notFound(res, 'Lookup not found');
        return;
      }

      ResponseUtil.success(res, lookup, 'Lookup retrieved successfully');
    } catch (error: unknown) {
      ResponseUtil.error(res, 'Error fetching lookup', 500, getErrorMessage(error));
    }
  };

  /**
   * Get lookups by category
   * POST /api/master/lookups/by-category
   */
  public getLookupsByCategory = async (req: Request, res: Response): Promise<void> => {
    try {
      const request: GetLookupsByCategoryRequest = req.body;
      const categoryId = request.category_id;

      if (!categoryId || isNaN(categoryId)) {
        ResponseUtil.error(res, 'Invalid category ID', 400);
        return;
      }

      const lookups = await this.service.getLookupsByCategory(categoryId, request.is_active);

      ResponseUtil.success(res, lookups, 'Lookups retrieved successfully');
    } catch (error: unknown) {
      ResponseUtil.error(res, 'Error fetching lookups by category', 500, getErrorMessage(error));
    }
  };

  /**
   * Get lookups by category name (For dropdowns - Auth required, no specific permission)
   * POST /api/master/lookups/by-category-name
   */
  public getLookupsByCategoryName = async (req: Request, res: Response): Promise<void> => {
    try {
      const { category_name } = req.body;

      if (!category_name || typeof category_name !== 'string') {
        ResponseUtil.error(res, 'category_name is required', 400);
        return;
      }

      const lookups = await this.service.getLookupsByCategoryName(category_name.toUpperCase(), true);

      ResponseUtil.success(res, lookups, 'Lookups retrieved successfully');
    } catch (error: unknown) {
      ResponseUtil.error(res, 'Error fetching lookups by category name', 500, getErrorMessage(error));
    }
  };

  /**
   * Create new lookup
   * POST /api/master/lookups/create
   */
  public createLookup = async (req: Request, res: Response): Promise<void> => {
    try {
      const createdBy = (req as any).user?.userId?.toString();
      const dto: CreateLookupDto = req.body;

      if ((!dto.category_id && !dto.new_category_name) || !dto.lookup_code || !dto.lookup_value) {
        ResponseUtil.error(res, 'Either category_id or new_category_name is required, along with lookup_code and lookup_value', 400);
        return;
      }

      const lookupId = await this.service.createLookup(dto, createdBy);

      ResponseUtil.success(res, { lookup_id: lookupId }, 'Lookup created successfully', 201);
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);

      // Check for SQL Server UNIQUE constraint violations
      if (errorMessage.includes('UNIQUE KEY constraint') || errorMessage.includes('duplicate key')) {
        if (errorMessage.includes('lookup_code')) {
          ResponseUtil.conflict(res, 'Lookup code already exists for this category');
        } else {
          ResponseUtil.conflict(res, 'Duplicate value detected');
        }
        return;
      }

      if (errorMessage.includes('already exists')) {
        ResponseUtil.conflict(res, errorMessage);
        return;
      }

      if (errorMessage.includes('not found')) {
        ResponseUtil.notFound(res, errorMessage);
        return;
      }

      if (errorMessage.includes('must be') || errorMessage.includes('required')) {
        ResponseUtil.error(res, errorMessage, 400);
        return;
      }

      ResponseUtil.error(res, 'Error creating lookup', 500, errorMessage);
    }
  };

  /**
   * Update lookup
   * POST /api/master/lookups/update
   */
  public updateLookup = async (req: Request, res: Response): Promise<void> => {
    try {
      const updatedBy = (req as any).user?.userId?.toString();
      const lookupId = req.body.lookup_id;
      const dto: UpdateLookupDto = {
        category_id: req.body.category_id,
        lookup_code: req.body.lookup_code,
        lookup_value: req.body.lookup_value,
        sort_order: req.body.sort_order,
        is_active: req.body.is_active
      };

      if (!lookupId || isNaN(lookupId)) {
        ResponseUtil.error(res, 'Invalid lookup ID', 400);
        return;
      }

      await this.service.updateLookup(lookupId, dto, updatedBy);

      ResponseUtil.success(res, null, 'Lookup updated successfully');
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);

      // Check for SQL Server UNIQUE constraint violations
      if (errorMessage.includes('UNIQUE KEY constraint') || errorMessage.includes('duplicate key')) {
        if (errorMessage.includes('lookup_code')) {
          ResponseUtil.conflict(res, 'Lookup code already exists for this category');
        } else {
          ResponseUtil.conflict(res, 'Duplicate value detected');
        }
        return;
      }

      if (errorMessage.includes('not found')) {
        ResponseUtil.notFound(res, errorMessage);
        return;
      }

      if (errorMessage.includes('already exists')) {
        ResponseUtil.conflict(res, errorMessage);
        return;
      }

      if (errorMessage.includes('must be') || errorMessage.includes('cannot be')) {
        ResponseUtil.error(res, errorMessage, 400);
        return;
      }

      ResponseUtil.error(res, 'Error updating lookup', 500, errorMessage);
    }
  };

  /**
   * Delete lookup (soft delete)
   * POST /api/master/lookups/delete
   */
  public deleteLookup = async (req: Request, res: Response): Promise<void> => {
    try {
      const lookupId = req.body.lookup_id;

      if (!lookupId || isNaN(lookupId)) {
        ResponseUtil.error(res, 'Invalid lookup ID', 400);
        return;
      }

      await this.service.deleteLookup(lookupId);

      ResponseUtil.success(res, null, 'Lookup deleted successfully');
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);

      if (errorMessage === 'Lookup not found') {
        ResponseUtil.notFound(res, errorMessage);
        return;
      }

      ResponseUtil.error(res, 'Error deleting lookup', 500, errorMessage);
    }
  };

  /**
   * Check lookup code availability
   * POST /api/master/lookups/check-code
   */
  public checkLookupCode = async (req: Request, res: Response): Promise<void> => {
    try {
      const { category_id, lookup_code, exclude_lookup_id } = req.body;

      if (!category_id || !lookup_code) {
        ResponseUtil.error(res, 'category_id and lookup_code are required', 400);
        return;
      }

      const isAvailable = await this.service.checkLookupCodeAvailability(category_id, lookup_code, exclude_lookup_id);

      ResponseUtil.success(res, { available: isAvailable }, 'Lookup code availability checked');
    } catch (error: unknown) {
      ResponseUtil.error(res, 'Error checking lookup code', 500, getErrorMessage(error));
    }
  };

  // ========================================================================
  // LOOKUP METADATA
  // ========================================================================

  /**
   * Get paginated list of lookup metadata
   * POST /api/master/lookups/metadata/list
   */
  public getMetadata = async (req: Request, res: Response): Promise<void> => {
    try {
      const filters: LookupMetadataFilters = {
        search: req.body.search,
        lookup_id: req.body.lookup_id,
        page: req.body.page || 1,
        limit: req.body.limit || 10,
        sort_by: req.body.sort_by ?? 'metadata_id',
        sort_order: req.body.sort_order ?? 'DESC'
      };

      const result = await this.service.getLookupMetadata(filters);

      ResponseUtil.success(res, result, 'Metadata retrieved successfully');
    } catch (error: unknown) {
      ResponseUtil.error(res, 'Error fetching metadata', 500, getErrorMessage(error));
    }
  };

  /**
   * Get lookup metadata by ID
   * POST /api/master/lookups/metadata/get
   */
  public getMetadataById = async (req: Request, res: Response): Promise<void> => {
    try {
      const request: GetLookupMetadataRequest = req.body;
      const metadataId = request.metadata_id;

      if (!metadataId || isNaN(metadataId)) {
        ResponseUtil.error(res, 'Invalid metadata ID', 400);
        return;
      }

      const metadata = await this.service.getLookupMetadataById(metadataId);

      if (!metadata) {
        ResponseUtil.notFound(res, 'Metadata not found');
        return;
      }

      ResponseUtil.success(res, metadata, 'Metadata retrieved successfully');
    } catch (error: unknown) {
      ResponseUtil.error(res, 'Error fetching metadata', 500, getErrorMessage(error));
    }
  };

  /**
   * Create new lookup metadata
   * POST /api/master/lookups/metadata/create
   */
  public createMetadata = async (req: Request, res: Response): Promise<void> => {
    try {
      const createdBy = (req as any).user?.userId?.toString();
      const dto: CreateLookupMetadataDto = req.body;

      if (!dto.lookup_id || !dto.metadata_key || !dto.metadata_value) {
        ResponseUtil.error(res, 'lookup_id, metadata_key, and metadata_value are required', 400);
        return;
      }

      const metadataId = await this.service.createLookupMetadata(dto, createdBy);

      ResponseUtil.success(res, { metadata_id: metadataId }, 'Metadata created successfully', 201);
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);

      // Check for SQL Server UNIQUE constraint violations
      if (errorMessage.includes('UNIQUE KEY constraint') || errorMessage.includes('duplicate key')) {
        if (errorMessage.includes('metadata_key')) {
          ResponseUtil.conflict(res, 'Metadata key already exists for this lookup');
        } else {
          ResponseUtil.conflict(res, 'Duplicate value detected');
        }
        return;
      }

      if (errorMessage.includes('already exists')) {
        ResponseUtil.conflict(res, errorMessage);
        return;
      }

      if (errorMessage.includes('not found')) {
        ResponseUtil.notFound(res, errorMessage);
        return;
      }

      if (errorMessage.includes('must be') || errorMessage.includes('required')) {
        ResponseUtil.error(res, errorMessage, 400);
        return;
      }

      ResponseUtil.error(res, 'Error creating metadata', 500, errorMessage);
    }
  };

  /**
   * Update lookup metadata
   * POST /api/master/lookups/metadata/update
   */
  public updateMetadata = async (req: Request, res: Response): Promise<void> => {
    try {
      const updatedBy = (req as any).user?.userId?.toString();
      const metadataId = req.body.metadata_id;
      const dto: UpdateLookupMetadataDto = {
        metadata_key: req.body.metadata_key,
        metadata_value: req.body.metadata_value
      };

      if (!metadataId || isNaN(metadataId)) {
        ResponseUtil.error(res, 'Invalid metadata ID', 400);
        return;
      }

      await this.service.updateLookupMetadata(metadataId, dto, updatedBy);

      ResponseUtil.success(res, null, 'Metadata updated successfully');
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);

      // Check for SQL Server UNIQUE constraint violations
      if (errorMessage.includes('UNIQUE KEY constraint') || errorMessage.includes('duplicate key')) {
        if (errorMessage.includes('metadata_key')) {
          ResponseUtil.conflict(res, 'Metadata key already exists for this lookup');
        } else {
          ResponseUtil.conflict(res, 'Duplicate value detected');
        }
        return;
      }

      if (errorMessage === 'Metadata not found') {
        ResponseUtil.notFound(res, errorMessage);
        return;
      }

      if (errorMessage.includes('already exists')) {
        ResponseUtil.conflict(res, errorMessage);
        return;
      }

      if (errorMessage.includes('must be')) {
        ResponseUtil.error(res, errorMessage, 400);
        return;
      }

      ResponseUtil.error(res, 'Error updating metadata', 500, errorMessage);
    }
  };

  /**
   * Delete lookup metadata (soft delete)
   * POST /api/master/lookups/metadata/delete
   */
  public deleteMetadata = async (req: Request, res: Response): Promise<void> => {
    try {
      const deletedBy = (req as any).user.username;
      const metadataId = req.body.metadata_id;

      if (!metadataId || isNaN(metadataId)) {
        ResponseUtil.error(res, 'Invalid metadata ID', 400);
        return;
      }

      await this.service.deleteLookupMetadata(metadataId, deletedBy);

      ResponseUtil.success(res, null, 'Metadata deleted successfully');
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);

      if (errorMessage === 'Metadata not found') {
        ResponseUtil.notFound(res, errorMessage);
        return;
      }

      ResponseUtil.error(res, 'Error deleting metadata', 500, errorMessage);
    }
  };

  /**
   * Check metadata key availability
   * POST /api/master/lookups/metadata/check-key
   */
  public checkMetadataKey = async (req: Request, res: Response): Promise<void> => {
    try {
      const { lookup_id, metadata_key, exclude_metadata_id } = req.body;

      if (!lookup_id || !metadata_key) {
        ResponseUtil.error(res, 'lookup_id and metadata_key are required', 400);
        return;
      }

      const isAvailable = await this.service.checkMetadataKeyAvailability(lookup_id, metadata_key, exclude_metadata_id);

      ResponseUtil.success(res, { available: isAvailable }, 'Metadata key availability checked');
    } catch (error: unknown) {
      ResponseUtil.error(res, 'Error checking metadata key', 500, getErrorMessage(error));
    }
  };
}
