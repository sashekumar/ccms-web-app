import { Request, Response } from 'express';
import { LookupsController } from './lookups.controller';
import { LookupsService } from './lookups.service';
import { ResponseUtil } from '../../core/utils/response.util';

jest.mock('./lookups.service');
jest.mock('../../core/utils/response.util');

describe('LookupsController', () => {
  let controller: LookupsController;
  let mockService: jest.Mocked<LookupsService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    controller = new LookupsController();
    mockService = (controller as any).service as jest.Mocked<LookupsService>;
    
    mockRequest = { 
      body: {}, 
      params: {} as any,
      user: { userId: 1 }
    } as any;
    mockResponse = {};
    
    jest.clearAllMocks();
  });

  // ============================================================================
  // LOOKUP CATEGORIES
  // ============================================================================

  describe('getCategories', () => {
    it('should return paginated categories successfully', async () => {
      const mockResult = {
        categories: [{ category_id: 1, category_name: 'Gender', is_active: true }],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1
      };
      
      mockService.getLookupCategories.mockResolvedValue(mockResult as any);
      mockRequest.body = { page: 1, limit: 10 };

      await controller.getCategories(mockRequest as Request, mockResponse as Response);

      expect(mockService.getLookupCategories).toHaveBeenCalledWith({
        search: undefined,
        is_active: undefined,
        page: 1,
        limit: 10,
        sort_by: 'category_id',
        sort_order: 'DESC'
      });
      expect(ResponseUtil.success).toHaveBeenCalledWith(
        mockResponse,
        mockResult,
        'Categories retrieved successfully'
      );
    });

    it('should apply search filter', async () => {
      mockService.getLookupCategories.mockResolvedValue({ data: [], pagination: {} } as any);
      mockRequest.body = { search: 'Gender', page: 1, limit: 10 };

      await controller.getCategories(mockRequest as Request, mockResponse as Response);

      expect(mockService.getLookupCategories).toHaveBeenCalledWith(
        expect.objectContaining({ search: 'Gender' })
      );
    });

    it('should apply is_active filter', async () => {
      mockService.getLookupCategories.mockResolvedValue({ data: [], pagination: {} } as any);
      mockRequest.body = { is_active: true, page: 1, limit: 10 };

      await controller.getCategories(mockRequest as Request, mockResponse as Response);

      expect(mockService.getLookupCategories).toHaveBeenCalledWith(
        expect.objectContaining({ is_active: true })
      );
    });

    it('should use default pagination values', async () => {
      mockService.getLookupCategories.mockResolvedValue({ data: [], pagination: {} } as any);
      mockRequest.body = {};

      await controller.getCategories(mockRequest as Request, mockResponse as Response);

      expect(mockService.getLookupCategories).toHaveBeenCalledWith(
        expect.objectContaining({ page: 1, limit: 10, sort_by: 'category_id', sort_order: 'DESC' })
      );
    });

    it('should handle service errors', async () => {
      mockService.getLookupCategories.mockRejectedValue(new Error('Database error'));
      mockRequest.body = {};

      await controller.getCategories(mockRequest as Request, mockResponse as Response);

      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Error fetching categories',
        500,
        'Database error'
      );
    });
  });

  describe('getCategoryById', () => {
    it('should return category when found', async () => {
      const mockCategory = { category_id: 1, category_name: 'Gender', is_active: true };
      mockService.getLookupCategoryById.mockResolvedValue(mockCategory as any);
      mockRequest.body = { category_id: 1 };

      await controller.getCategoryById(mockRequest as Request, mockResponse as Response);

      expect(mockService.getLookupCategoryById).toHaveBeenCalledWith(1);
      expect(ResponseUtil.success).toHaveBeenCalledWith(
        mockResponse,
        mockCategory,
        'Category retrieved successfully'
      );
    });

    it('should return 400 for missing category_id', async () => {
      mockRequest.body = {};

      await controller.getCategoryById(mockRequest as Request, mockResponse as Response);

      expect(mockService.getLookupCategoryById).not.toHaveBeenCalled();
      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Invalid category ID',
        400
      );
    });

    it('should return 400 for invalid category_id', async () => {
      mockRequest.body = { category_id: 'invalid' };

      await controller.getCategoryById(mockRequest as Request, mockResponse as Response);

      expect(mockService.getLookupCategoryById).not.toHaveBeenCalled();
      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Invalid category ID',
        400
      );
    });

    it('should return 404 when category not found', async () => {
      mockService.getLookupCategoryById.mockResolvedValue(null);
      mockRequest.body = { category_id: 999 };

      await controller.getCategoryById(mockRequest as Request, mockResponse as Response);

      expect(mockService.getLookupCategoryById).toHaveBeenCalledWith(999);
      expect(ResponseUtil.notFound).toHaveBeenCalledWith(
        mockResponse,
        'Category not found'
      );
    });

    it('should handle service errors', async () => {
      mockService.getLookupCategoryById.mockRejectedValue(new Error('Query failed'));
      mockRequest.body = { category_id: 1 };

      await controller.getCategoryById(mockRequest as Request, mockResponse as Response);

      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Error fetching category',
        500,
        'Query failed'
      );
    });
  });

  describe('createCategory', () => {
    it('should create category successfully', async () => {
      mockService.createLookupCategory.mockResolvedValue(2);
      mockRequest.body = {
        category_name: 'Marital Status',
        description: 'Marital status options'
      };

      await controller.createCategory(mockRequest as Request, mockResponse as Response);

      expect(mockService.createLookupCategory).toHaveBeenCalledWith(mockRequest.body, '1');
      expect(ResponseUtil.success).toHaveBeenCalledWith(
        mockResponse,
        { category_id: 2 },
        'Category created successfully',
        201
      );
    });

    it('should return 400 when category_name is missing', async () => {
      mockRequest.body = { description: 'Test' };

      await controller.createCategory(mockRequest as Request, mockResponse as Response);

      expect(mockService.createLookupCategory).not.toHaveBeenCalled();
      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'category_name is required',
        400
      );
    });

    it('should return 409 when category name already exists', async () => {
      mockService.createLookupCategory.mockRejectedValue(new Error('Category name already exists'));
      mockRequest.body = { category_name: 'Gender' };

      await controller.createCategory(mockRequest as Request, mockResponse as Response);

      expect(ResponseUtil.conflict).toHaveBeenCalledWith(
        mockResponse,
        'Category name already exists'
      );
    });

    it('should return 409 for UNIQUE constraint violation on category_name', async () => {
      mockService.createLookupCategory.mockRejectedValue(
        new Error('UNIQUE KEY constraint violation on category_name')
      );
      mockRequest.body = { category_name: 'Gender' };

      await controller.createCategory(mockRequest as Request, mockResponse as Response);

      expect(ResponseUtil.conflict).toHaveBeenCalledWith(
        mockResponse,
        'Category name already exists'
      );
    });

    it('should return 409 for duplicate key error', async () => {
      mockService.createLookupCategory.mockRejectedValue(new Error('duplicate key violation'));
      mockRequest.body = { category_name: 'Gender' };

      await controller.createCategory(mockRequest as Request, mockResponse as Response);

      expect(ResponseUtil.conflict).toHaveBeenCalledWith(
        mockResponse,
        'Duplicate value detected'
      );
    });

    it('should return 400 for validation errors', async () => {
      mockService.createLookupCategory.mockRejectedValue(new Error('Category name must be at least 3 characters'));
      mockRequest.body = { category_name: 'AB' };

      await controller.createCategory(mockRequest as Request, mockResponse as Response);

      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Category name must be at least 3 characters',
        400
      );
    });

    it('should handle general service errors', async () => {
      mockService.createLookupCategory.mockRejectedValue(new Error('Database connection failed'));
      mockRequest.body = { category_name: 'Test' };

      await controller.createCategory(mockRequest as Request, mockResponse as Response);

      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Error creating category',
        500,
        'Database connection failed'
      );
    });
  });

  describe('updateCategory', () => {
    it('should update category successfully', async () => {
      mockService.updateLookupCategory.mockResolvedValue(undefined);
      mockRequest.body = {
        category_id: 1,
        category_name: 'Updated Gender',
        is_active: true
      };

      await controller.updateCategory(mockRequest as Request, mockResponse as Response);

      expect(mockService.updateLookupCategory).toHaveBeenCalledWith(
        1,
        { category_name: 'Updated Gender', description: undefined, is_active: true },
        '1'
      );
      expect(ResponseUtil.success).toHaveBeenCalledWith(
        mockResponse,
        null,
        'Category updated successfully'
      );
    });

    it('should return 400 for missing category_id', async () => {
      mockRequest.body = { category_name: 'Updated' };

      await controller.updateCategory(mockRequest as Request, mockResponse as Response);

      expect(mockService.updateLookupCategory).not.toHaveBeenCalled();
      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Invalid category ID',
        400
      );
    });

    it('should return 400 for invalid category_id', async () => {
      mockRequest.body = { category_id: 'invalid', category_name: 'Updated' };

      await controller.updateCategory(mockRequest as Request, mockResponse as Response);

      expect(mockService.updateLookupCategory).not.toHaveBeenCalled();
      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Invalid category ID',
        400
      );
    });

    it('should return 404 when category not found', async () => {
      mockService.updateLookupCategory.mockRejectedValue(new Error('Category not found'));
      mockRequest.body = { category_id: 999, category_name: 'Updated' };

      await controller.updateCategory(mockRequest as Request, mockResponse as Response);

      expect(ResponseUtil.notFound).toHaveBeenCalledWith(
        mockResponse,
        'Category not found'
      );
    });

    it('should return 409 when category name already exists', async () => {
      mockService.updateLookupCategory.mockRejectedValue(new Error('Category name already exists'));
      mockRequest.body = { category_id: 1, category_name: 'Gender' };

      await controller.updateCategory(mockRequest as Request, mockResponse as Response);

      expect(ResponseUtil.conflict).toHaveBeenCalledWith(
        mockResponse,
        'Category name already exists'
      );
    });

    it('should return 409 for UNIQUE constraint violation', async () => {
      mockService.updateLookupCategory.mockRejectedValue(
        new Error('UNIQUE KEY constraint violation on category_name')
      );
      mockRequest.body = { category_id: 1, category_name: 'Gender' };

      await controller.updateCategory(mockRequest as Request, mockResponse as Response);

      expect(ResponseUtil.conflict).toHaveBeenCalledWith(
        mockResponse,
        'Category name already exists'
      );
    });

    it('should handle service errors', async () => {
      mockService.updateLookupCategory.mockRejectedValue(new Error('Update failed'));
      mockRequest.body = { category_id: 1, category_name: 'Updated' };

      await controller.updateCategory(mockRequest as Request, mockResponse as Response);

      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Error updating category',
        500,
        'Update failed'
      );
    });
  });

  describe('deleteCategory', () => {
    it('should delete category successfully', async () => {
      mockService.deleteLookupCategory.mockResolvedValue(undefined);
      mockRequest.body = { category_id: 1 };

      await controller.deleteCategory(mockRequest as Request, mockResponse as Response);

      expect(mockService.deleteLookupCategory).toHaveBeenCalledWith(1);
      expect(ResponseUtil.success).toHaveBeenCalledWith(
        mockResponse,
        null,
        'Category deleted successfully'
      );
    });

    it('should return 400 for missing category_id', async () => {
      mockRequest.body = {};

      await controller.deleteCategory(mockRequest as Request, mockResponse as Response);

      expect(mockService.deleteLookupCategory).not.toHaveBeenCalled();
      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Invalid category ID',
        400
      );
    });

    it('should return 400 for invalid category_id', async () => {
      mockRequest.body = { category_id: 'invalid' };

      await controller.deleteCategory(mockRequest as Request, mockResponse as Response);

      expect(mockService.deleteLookupCategory).not.toHaveBeenCalled();
      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Invalid category ID',
        400
      );
    });

    it('should return 404 when category not found', async () => {
      mockService.deleteLookupCategory.mockRejectedValue(new Error('Category not found'));
      mockRequest.body = { category_id: 999 };

      await controller.deleteCategory(mockRequest as Request, mockResponse as Response);

      expect(ResponseUtil.notFound).toHaveBeenCalledWith(
        mockResponse,
        'Category not found'
      );
    });

    it('should handle service errors', async () => {
      mockService.deleteLookupCategory.mockRejectedValue(new Error('Delete failed'));
      mockRequest.body = { category_id: 1 };

      await controller.deleteCategory(mockRequest as Request, mockResponse as Response);

      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Error deleting category',
        500,
        'Delete failed'
      );
    });
  });

  describe('checkCategoryCode', () => {
    it('should return availability status', async () => {
      mockService.checkCategoryNameAvailability.mockResolvedValue(true);
      mockRequest.body = { category_code: 'NEW_CODE' };

      await controller.checkCategoryCode(mockRequest as Request, mockResponse as Response);

      expect(mockService.checkCategoryNameAvailability).toHaveBeenCalledWith('NEW_CODE', undefined);
      expect(ResponseUtil.success).toHaveBeenCalledWith(
        mockResponse,
        { available: true },
        'Category code availability checked'
      );
    });

    it('should exclude current category when checking', async () => {
      mockService.checkCategoryNameAvailability.mockResolvedValue(true);
      mockRequest.body = { category_code: 'CODE', exclude_category_id: 1 };

      await controller.checkCategoryCode(mockRequest as Request, mockResponse as Response);

      expect(mockService.checkCategoryNameAvailability).toHaveBeenCalledWith('CODE', 1);
    });

    it('should handle service errors', async () => {
      mockService.checkCategoryNameAvailability.mockRejectedValue(new Error('Query failed'));
      mockRequest.body = { category_code: 'CODE' };

      await controller.checkCategoryCode(mockRequest as Request, mockResponse as Response);

      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Error checking category code',
        500,
        'Query failed'
      );
    });
  });

  // ============================================================================
  // LOOKUPS
  // ============================================================================

  describe('getLookups', () => {
    it('should return paginated lookups successfully', async () => {
      const mockResult = {
        lookups: [{ lookup_id: 1, category_id: 1, lookup_code: 'M', lookup_value: 'Male', is_active: true }],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1
      };
      
      mockService.getLookups.mockResolvedValue(mockResult as any);
      mockRequest.body = { page: 1, limit: 10 };

      await controller.getLookups(mockRequest as Request, mockResponse as Response);

      expect(mockService.getLookups).toHaveBeenCalledWith({
        search: undefined,
        category_id: undefined,
        is_active: undefined,
        page: 1,
        limit: 10,
        sort_by: 'sort_order',
        sort_order: 'ASC'
      });
      expect(ResponseUtil.success).toHaveBeenCalledWith(
        mockResponse,
        mockResult,
        'Lookups retrieved successfully'
      );
    });

    it('should apply category_id filter', async () => {
      mockService.getLookups.mockResolvedValue({ data: [], pagination: {} } as any);
      mockRequest.body = { category_id: 1, page: 1, limit: 10 };

      await controller.getLookups(mockRequest as Request, mockResponse as Response);

      expect(mockService.getLookups).toHaveBeenCalledWith(
        expect.objectContaining({ category_id: 1 })
      );
    });

    it('should apply search filter', async () => {
      mockService.getLookups.mockResolvedValue({ data: [], pagination: {} } as any);
      mockRequest.body = { search: 'Male', page: 1, limit: 10 };

      await controller.getLookups(mockRequest as Request, mockResponse as Response);

      expect(mockService.getLookups).toHaveBeenCalledWith(
        expect.objectContaining({ search: 'Male' })
      );
    });

    it('should handle service errors', async () => {
      mockService.getLookups.mockRejectedValue(new Error('Database error'));
      mockRequest.body = {};

      await controller.getLookups(mockRequest as Request, mockResponse as Response);

      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Error fetching lookups',
        500,
        'Database error'
      );
    });
  });

  describe('getLookupById', () => {
    it('should return lookup when found', async () => {
      const mockLookup = { lookup_id: 1, lookup_code: 'M', lookup_value: 'Male' };
      mockService.getLookupById.mockResolvedValue(mockLookup as any);
      mockRequest.body = { lookup_id: 1 };

      await controller.getLookupById(mockRequest as Request, mockResponse as Response);

      expect(mockService.getLookupById).toHaveBeenCalledWith(1);
      expect(ResponseUtil.success).toHaveBeenCalledWith(
        mockResponse,
        mockLookup,
        'Lookup retrieved successfully'
      );
    });

    it('should return 400 for invalid lookup_id', async () => {
      mockRequest.body = { lookup_id: 'invalid' };

      await controller.getLookupById(mockRequest as Request, mockResponse as Response);

      expect(mockService.getLookupById).not.toHaveBeenCalled();
      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Invalid lookup ID',
        400
      );
    });

    it('should return 404 when lookup not found', async () => {
      mockService.getLookupById.mockResolvedValue(null);
      mockRequest.body = { lookup_id: 999 };

      await controller.getLookupById(mockRequest as Request, mockResponse as Response);

      expect(ResponseUtil.notFound).toHaveBeenCalledWith(
        mockResponse,
        'Lookup not found'
      );
    });

    it('should handle service errors', async () => {
      mockService.getLookupById.mockRejectedValue(new Error('Query failed'));
      mockRequest.body = { lookup_id: 1 };

      await controller.getLookupById(mockRequest as Request, mockResponse as Response);

      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Error fetching lookup',
        500,
        'Query failed'
      );
    });
  });

  describe('getLookupsByCategory', () => {
    it('should return lookups for category', async () => {
      const mockLookups = [
        { lookup_id: 1, lookup_code: 'M', lookup_value: 'Male' },
        { lookup_id: 2, lookup_code: 'F', lookup_value: 'Female' }
      ];
      mockService.getLookupsByCategory.mockResolvedValue(mockLookups as any);
      mockRequest.body = { category_id: 1 };

      await controller.getLookupsByCategory(mockRequest as Request, mockResponse as Response);

      expect(mockService.getLookupsByCategory).toHaveBeenCalledWith(1, undefined);
      expect(ResponseUtil.success).toHaveBeenCalledWith(
        mockResponse,
        mockLookups,
        'Lookups retrieved successfully'
      );
    });

    it('should filter by is_active', async () => {
      mockService.getLookupsByCategory.mockResolvedValue([]);
      mockRequest.body = { category_id: 1, is_active: true };

      await controller.getLookupsByCategory(mockRequest as Request, mockResponse as Response);

      expect(mockService.getLookupsByCategory).toHaveBeenCalledWith(1, true);
    });

    it('should return 400 for invalid category_id', async () => {
      mockRequest.body = { category_id: 'invalid' };

      await controller.getLookupsByCategory(mockRequest as Request, mockResponse as Response);

      expect(mockService.getLookupsByCategory).not.toHaveBeenCalled();
      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Invalid category ID',
        400
      );
    });

    it('should handle service errors', async () => {
      mockService.getLookupsByCategory.mockRejectedValue(new Error('Query failed'));
      mockRequest.body = { category_id: 1 };

      await controller.getLookupsByCategory(mockRequest as Request, mockResponse as Response);

      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Error fetching lookups by category',
        500,
        'Query failed'
      );
    });
  });

  describe('createLookup', () => {
    it('should create lookup successfully with existing category', async () => {
      mockService.createLookup.mockResolvedValue(3);
      mockRequest.body = {
        category_id: 1,
        lookup_code: 'O',
        lookup_value: 'Other'
      };

      await controller.createLookup(mockRequest as Request, mockResponse as Response);

      expect(mockService.createLookup).toHaveBeenCalledWith(mockRequest.body, '1');
      expect(ResponseUtil.success).toHaveBeenCalledWith(
        mockResponse,
        { lookup_id: 3 },
        'Lookup created successfully',
        201
      );
    });

    it('should create lookup with new category', async () => {
      mockService.createLookup.mockResolvedValue(3);
      mockRequest.body = {
        new_category_name: 'New Category',
        lookup_code: 'CODE',
        lookup_value: 'Value'
      };

      await controller.createLookup(mockRequest as Request, mockResponse as Response);

      expect(mockService.createLookup).toHaveBeenCalledWith(mockRequest.body, '1');
      expect(ResponseUtil.success).toHaveBeenCalledWith(
        mockResponse,
        { lookup_id: 3 },
        'Lookup created successfully',
        201
      );
    });

    it('should return 400 when neither category_id nor new_category_name provided', async () => {
      mockRequest.body = {
        lookup_code: 'CODE',
        lookup_value: 'Value'
      };

      await controller.createLookup(mockRequest as Request, mockResponse as Response);

      expect(mockService.createLookup).not.toHaveBeenCalled();
      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Either category_id or new_category_name is required, along with lookup_code and lookup_value',
        400
      );
    });

    it('should return 400 when lookup_code is missing', async () => {
      mockRequest.body = {
        category_id: 1,
        lookup_value: 'Value'
      };

      await controller.createLookup(mockRequest as Request, mockResponse as Response);

      expect(mockService.createLookup).not.toHaveBeenCalled();
      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Either category_id or new_category_name is required, along with lookup_code and lookup_value',
        400
      );
    });

    it('should return 409 for duplicate lookup code', async () => {
      mockService.createLookup.mockRejectedValue(
        new Error('UNIQUE KEY constraint violation on lookup_code')
      );
      mockRequest.body = {
        category_id: 1,
        lookup_code: 'M',
        lookup_value: 'Male'
      };

      await controller.createLookup(mockRequest as Request, mockResponse as Response);

      expect(ResponseUtil.conflict).toHaveBeenCalledWith(
        mockResponse,
        'Lookup code already exists for this category'
      );
    });

    it('should return 404 when category not found', async () => {
      mockService.createLookup.mockRejectedValue(new Error('Category not found'));
      mockRequest.body = {
        category_id: 999,
        lookup_code: 'CODE',
        lookup_value: 'Value'
      };

      await controller.createLookup(mockRequest as Request, mockResponse as Response);

      expect(ResponseUtil.notFound).toHaveBeenCalledWith(
        mockResponse,
        'Category not found'
      );
    });

    it('should handle service errors', async () => {
      mockService.createLookup.mockRejectedValue(new Error('Insert failed'));
      mockRequest.body = {
        category_id: 1,
        lookup_code: 'CODE',
        lookup_value: 'Value'
      };

      await controller.createLookup(mockRequest as Request, mockResponse as Response);

      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Error creating lookup',
        500,
        'Insert failed'
      );
    });
  });

  describe('updateLookup', () => {
    it('should update lookup successfully', async () => {
      mockService.updateLookup.mockResolvedValue(undefined);
      mockRequest.body = {
        lookup_id: 1,
        lookup_value: 'Updated Male',
        is_active: true
      };

      await controller.updateLookup(mockRequest as Request, mockResponse as Response);

      expect(mockService.updateLookup).toHaveBeenCalledWith(
        1,
        {
          category_id: undefined,
          lookup_code: undefined,
          lookup_value: 'Updated Male',
          sort_order: undefined,
          is_active: true
        },
        '1'
      );
      expect(ResponseUtil.success).toHaveBeenCalledWith(
        mockResponse,
        null,
        'Lookup updated successfully'
      );
    });

    it('should return 400 for invalid lookup_id', async () => {
      mockRequest.body = { lookup_id: 'invalid', lookup_value: 'Updated' };

      await controller.updateLookup(mockRequest as Request, mockResponse as Response);

      expect(mockService.updateLookup).not.toHaveBeenCalled();
      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Invalid lookup ID',
        400
      );
    });

    it('should return 404 when lookup not found', async () => {
      mockService.updateLookup.mockRejectedValue(new Error('Lookup not found'));
      mockRequest.body = { lookup_id: 999, lookup_value: 'Updated' };

      await controller.updateLookup(mockRequest as Request, mockResponse as Response);

      expect(ResponseUtil.notFound).toHaveBeenCalledWith(
        mockResponse,
        'Lookup not found'
      );
    });

    it('should return 409 for duplicate lookup code', async () => {
      mockService.updateLookup.mockRejectedValue(
        new Error('UNIQUE KEY constraint violation on lookup_code')
      );
      mockRequest.body = { lookup_id: 1, lookup_code: 'F' };

      await controller.updateLookup(mockRequest as Request, mockResponse as Response);

      expect(ResponseUtil.conflict).toHaveBeenCalledWith(
        mockResponse,
        'Lookup code already exists for this category'
      );
    });

    it('should handle service errors', async () => {
      mockService.updateLookup.mockRejectedValue(new Error('Update failed'));
      mockRequest.body = { lookup_id: 1, lookup_value: 'Updated' };

      await controller.updateLookup(mockRequest as Request, mockResponse as Response);

      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Error updating lookup',
        500,
        'Update failed'
      );
    });
  });

  describe('deleteLookup', () => {
    it('should delete lookup successfully', async () => {
      mockService.deleteLookup.mockResolvedValue(undefined);
      mockRequest.body = { lookup_id: 1 };

      await controller.deleteLookup(mockRequest as Request, mockResponse as Response);

      expect(mockService.deleteLookup).toHaveBeenCalledWith(1);
      expect(ResponseUtil.success).toHaveBeenCalledWith(
        mockResponse,
        null,
        'Lookup deleted successfully'
      );
    });

    it('should return 400 for invalid lookup_id', async () => {
      mockRequest.body = { lookup_id: 'invalid' };

      await controller.deleteLookup(mockRequest as Request, mockResponse as Response);

      expect(mockService.deleteLookup).not.toHaveBeenCalled();
      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Invalid lookup ID',
        400
      );
    });

    it('should return 404 when lookup not found', async () => {
      mockService.deleteLookup.mockRejectedValue(new Error('Lookup not found'));
      mockRequest.body = { lookup_id: 999 };

      await controller.deleteLookup(mockRequest as Request, mockResponse as Response);

      expect(ResponseUtil.notFound).toHaveBeenCalledWith(
        mockResponse,
        'Lookup not found'
      );
    });

    it('should handle service errors', async () => {
      mockService.deleteLookup.mockRejectedValue(new Error('Delete failed'));
      mockRequest.body = { lookup_id: 1 };

      await controller.deleteLookup(mockRequest as Request, mockResponse as Response);

      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Error deleting lookup',
        500,
        'Delete failed'
      );
    });
  });

  describe('checkLookupCode', () => {
    it('should return availability status', async () => {
      mockService.checkLookupCodeAvailability.mockResolvedValue(true);
      mockRequest.body = { category_id: 1, lookup_code: 'NEW' };

      await controller.checkLookupCode(mockRequest as Request, mockResponse as Response);

      expect(mockService.checkLookupCodeAvailability).toHaveBeenCalledWith(1, 'NEW', undefined);
      expect(ResponseUtil.success).toHaveBeenCalledWith(
        mockResponse,
        { available: true },
        'Lookup code availability checked'
      );
    });

    it('should exclude current lookup when checking', async () => {
      mockService.checkLookupCodeAvailability.mockResolvedValue(true);
      mockRequest.body = { category_id: 1, lookup_code: 'CODE', exclude_lookup_id: 5 };

      await controller.checkLookupCode(mockRequest as Request, mockResponse as Response);

      expect(mockService.checkLookupCodeAvailability).toHaveBeenCalledWith(1, 'CODE', 5);
    });

    it('should return 400 when category_id is missing', async () => {
      mockRequest.body = { lookup_code: 'CODE' };

      await controller.checkLookupCode(mockRequest as Request, mockResponse as Response);

      expect(mockService.checkLookupCodeAvailability).not.toHaveBeenCalled();
      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'category_id and lookup_code are required',
        400
      );
    });

    it('should return 400 when lookup_code is missing', async () => {
      mockRequest.body = { category_id: 1 };

      await controller.checkLookupCode(mockRequest as Request, mockResponse as Response);

      expect(mockService.checkLookupCodeAvailability).not.toHaveBeenCalled();
      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'category_id and lookup_code are required',
        400
      );
    });

    it('should handle service errors', async () => {
      mockService.checkLookupCodeAvailability.mockRejectedValue(new Error('Query failed'));
      mockRequest.body = { category_id: 1, lookup_code: 'CODE' };

      await controller.checkLookupCode(mockRequest as Request, mockResponse as Response);

      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Error checking lookup code',
        500,
        'Query failed'
      );
    });
  });

  // ============================================================================
  // LOOKUP METADATA
  // ============================================================================

  describe('getMetadata', () => {
    it('should return paginated metadata successfully', async () => {
      const mockResult = {
        data: [{ metadata_id: 1, lookup_id: 1, metadata_key: 'color', metadata_value: 'blue' }],
        pagination: { total: 1, page: 1, limit: 10, total_pages: 1 }
      };
      
      mockService.getLookupMetadata.mockResolvedValue(mockResult as any);
      mockRequest.body = { page: 1, limit: 10 };

      await controller.getMetadata(mockRequest as Request, mockResponse as Response);

      expect(mockService.getLookupMetadata).toHaveBeenCalledWith({
        search: undefined,
        lookup_id: undefined,
        page: 1,
        limit: 10,
        sort_by: 'metadata_id',
        sort_order: 'DESC'
      });
      expect(ResponseUtil.success).toHaveBeenCalledWith(
        mockResponse,
        mockResult,
        'Metadata retrieved successfully'
      );
    });

    it('should apply lookup_id filter', async () => {
      mockService.getLookupMetadata.mockResolvedValue({ data: [], pagination: {} } as any);
      mockRequest.body = { lookup_id: 1, page: 1, limit: 10 };

      await controller.getMetadata(mockRequest as Request, mockResponse as Response);

      expect(mockService.getLookupMetadata).toHaveBeenCalledWith(
        expect.objectContaining({ lookup_id: 1 })
      );
    });

    it('should handle service errors', async () => {
      mockService.getLookupMetadata.mockRejectedValue(new Error('Database error'));
      mockRequest.body = {};

      await controller.getMetadata(mockRequest as Request, mockResponse as Response);

      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Error fetching metadata',
        500,
        'Database error'
      );
    });
  });

  describe('getMetadataById', () => {
    it('should return metadata when found', async () => {
      const mockMetadata = { metadata_id: 1, metadata_key: 'color', metadata_value: 'blue' };
      mockService.getLookupMetadataById.mockResolvedValue(mockMetadata as any);
      mockRequest.body = { metadata_id: 1 };

      await controller.getMetadataById(mockRequest as Request, mockResponse as Response);

      expect(mockService.getLookupMetadataById).toHaveBeenCalledWith(1);
      expect(ResponseUtil.success).toHaveBeenCalledWith(
        mockResponse,
        mockMetadata,
        'Metadata retrieved successfully'
      );
    });

    it('should return 400 for invalid metadata_id', async () => {
      mockRequest.body = { metadata_id: 'invalid' };

      await controller.getMetadataById(mockRequest as Request, mockResponse as Response);

      expect(mockService.getLookupMetadataById).not.toHaveBeenCalled();
      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Invalid metadata ID',
        400
      );
    });

    it('should return 404 when metadata not found', async () => {
      mockService.getLookupMetadataById.mockResolvedValue(null);
      mockRequest.body = { metadata_id: 999 };

      await controller.getMetadataById(mockRequest as Request, mockResponse as Response);

      expect(ResponseUtil.notFound).toHaveBeenCalledWith(
        mockResponse,
        'Metadata not found'
      );
    });

    it('should handle service errors', async () => {
      mockService.getLookupMetadataById.mockRejectedValue(new Error('Query failed'));
      mockRequest.body = { metadata_id: 1 };

      await controller.getMetadataById(mockRequest as Request, mockResponse as Response);

      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Error fetching metadata',
        500,
        'Query failed'
      );
    });
  });

  describe('createMetadata', () => {
    it('should create metadata successfully', async () => {
      mockService.createLookupMetadata.mockResolvedValue(10);
      mockRequest.body = { lookup_id: 1, metadata_key: 'color', metadata_value: 'blue' };

      await controller.createMetadata(mockRequest as Request, mockResponse as Response);

      expect(mockService.createLookupMetadata).toHaveBeenCalledWith(mockRequest.body, '1');
      expect(ResponseUtil.success).toHaveBeenCalledWith(
        mockResponse,
        { metadata_id: 10 },
        'Metadata created successfully',
        201
      );
    });

    it('should return 400 for missing lookup_id', async () => {
      mockRequest.body = { metadata_key: 'color', metadata_value: 'blue' };

      await controller.createMetadata(mockRequest as Request, mockResponse as Response);

      expect(mockService.createLookupMetadata).not.toHaveBeenCalled();
      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'lookup_id, metadata_key, and metadata_value are required',
        400
      );
    });

    it('should return 400 for missing metadata_key', async () => {
      mockRequest.body = { lookup_id: 1, metadata_value: 'blue' };

      await controller.createMetadata(mockRequest as Request, mockResponse as Response);

      expect(mockService.createLookupMetadata).not.toHaveBeenCalled();
      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'lookup_id, metadata_key, and metadata_value are required',
        400
      );
    });

    it('should return 400 for missing metadata_value', async () => {
      mockRequest.body = { lookup_id: 1, metadata_key: 'color' };

      await controller.createMetadata(mockRequest as Request, mockResponse as Response);

      expect(mockService.createLookupMetadata).not.toHaveBeenCalled();
      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'lookup_id, metadata_key, and metadata_value are required',
        400
      );
    });

    it('should return 409 for duplicate metadata key', async () => {
      mockService.createLookupMetadata.mockRejectedValue(
        new Error('UNIQUE KEY constraint violation on metadata_key')
      );
      mockRequest.body = { lookup_id: 1, metadata_key: 'color', metadata_value: 'blue' };

      await controller.createMetadata(mockRequest as Request, mockResponse as Response);

      expect(ResponseUtil.conflict).toHaveBeenCalledWith(
        mockResponse,
        'Metadata key already exists for this lookup'
      );
    });

    it('should return 409 for duplicate key error', async () => {
      mockService.createLookupMetadata.mockRejectedValue(new Error('duplicate key error'));
      mockRequest.body = { lookup_id: 1, metadata_key: 'color', metadata_value: 'blue' };

      await controller.createMetadata(mockRequest as Request, mockResponse as Response);

      expect(ResponseUtil.conflict).toHaveBeenCalledWith(
        mockResponse,
        'Duplicate value detected'
      );
    });

    it('should return 409 when metadata key already exists', async () => {
      mockService.createLookupMetadata.mockRejectedValue(new Error('Metadata key already exists'));
      mockRequest.body = { lookup_id: 1, metadata_key: 'color', metadata_value: 'blue' };

      await controller.createMetadata(mockRequest as Request, mockResponse as Response);

      expect(ResponseUtil.conflict).toHaveBeenCalledWith(
        mockResponse,
        'Metadata key already exists'
      );
    });

    it('should return 404 when lookup not found', async () => {
      mockService.createLookupMetadata.mockRejectedValue(new Error('Lookup not found'));
      mockRequest.body = { lookup_id: 999, metadata_key: 'color', metadata_value: 'blue' };

      await controller.createMetadata(mockRequest as Request, mockResponse as Response);

      expect(ResponseUtil.notFound).toHaveBeenCalledWith(
        mockResponse,
        'Lookup not found'
      );
    });

    it('should return 400 for validation errors', async () => {
      mockRequest.body = { lookup_id: 1, metadata_key: '', metadata_value: 'blue' };

      await controller.createMetadata(mockRequest as Request, mockResponse as Response);

      expect(mockService.createLookupMetadata).not.toHaveBeenCalled();
      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'lookup_id, metadata_key, and metadata_value are required',
        400
      );
    });

    it('should handle service errors', async () => {
      mockService.createLookupMetadata.mockRejectedValue(new Error('Database error'));
      mockRequest.body = { lookup_id: 1, metadata_key: 'color', metadata_value: 'blue' };

      await controller.createMetadata(mockRequest as Request, mockResponse as Response);

      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Error creating metadata',
        500,
        'Database error'
      );
    });
  });

  describe('updateMetadata', () => {
    it('should update metadata successfully', async () => {
      mockService.updateLookupMetadata.mockResolvedValue(undefined);
      mockRequest.body = { metadata_id: 1, metadata_key: 'color', metadata_value: 'red' };

      await controller.updateMetadata(mockRequest as Request, mockResponse as Response);

      expect(mockService.updateLookupMetadata).toHaveBeenCalledWith(
        1,
        { metadata_key: 'color', metadata_value: 'red' },
        '1'
      );
      expect(ResponseUtil.success).toHaveBeenCalledWith(
        mockResponse,
        null,
        'Metadata updated successfully'
      );
    });

    it('should return 400 for invalid metadata_id', async () => {
      mockRequest.body = { metadata_id: 'invalid', metadata_key: 'color' };

      await controller.updateMetadata(mockRequest as Request, mockResponse as Response);

      expect(mockService.updateLookupMetadata).not.toHaveBeenCalled();
      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Invalid metadata ID',
        400
      );
    });

    it('should return 409 for duplicate metadata key', async () => {
      mockService.updateLookupMetadata.mockRejectedValue(
        new Error('UNIQUE KEY constraint violation on metadata_key')
      );
      mockRequest.body = { metadata_id: 1, metadata_key: 'color' };

      await controller.updateMetadata(mockRequest as Request, mockResponse as Response);

      expect(ResponseUtil.conflict).toHaveBeenCalledWith(
        mockResponse,
        'Metadata key already exists for this lookup'
      );
    });

    it('should return 404 when metadata not found', async () => {
      mockService.updateLookupMetadata.mockRejectedValue(new Error('Metadata not found'));
      mockRequest.body = { metadata_id: 999, metadata_key: 'color' };

      await controller.updateMetadata(mockRequest as Request, mockResponse as Response);

      expect(ResponseUtil.notFound).toHaveBeenCalledWith(
        mockResponse,
        'Metadata not found'
      );
    });

    it('should return 409 when metadata key already exists', async () => {
      mockService.updateLookupMetadata.mockRejectedValue(new Error('Metadata key already exists'));
      mockRequest.body = { metadata_id: 1, metadata_key: 'color' };

      await controller.updateMetadata(mockRequest as Request, mockResponse as Response);

      expect(ResponseUtil.conflict).toHaveBeenCalledWith(
        mockResponse,
        'Metadata key already exists'
      );
    });

    it('should return 400 for validation errors', async () => {
      mockService.updateLookupMetadata.mockRejectedValue(new Error('metadata_value must be provided'));
      mockRequest.body = { metadata_id: 1, metadata_value: '' };

      await controller.updateMetadata(mockRequest as Request, mockResponse as Response);

      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'metadata_value must be provided',
        400
      );
    });

    it('should handle service errors', async () => {
      mockService.updateLookupMetadata.mockRejectedValue(new Error('Update failed'));
      mockRequest.body = { metadata_id: 1, metadata_key: 'color' };

      await controller.updateMetadata(mockRequest as Request, mockResponse as Response);

      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Error updating metadata',
        500,
        'Update failed'
      );
    });
  });

  describe('deleteMetadata', () => {
    it('should delete metadata successfully', async () => {
      mockService.deleteLookupMetadata.mockResolvedValue(undefined);
      mockRequest.body = { metadata_id: 1 };

      await controller.deleteMetadata(mockRequest as Request, mockResponse as Response);

      expect(mockService.deleteLookupMetadata).toHaveBeenCalledWith(1, undefined);
      expect(ResponseUtil.success).toHaveBeenCalledWith(
        mockResponse,
        null,
        'Metadata deleted successfully'
      );
    });

    it('should return 400 for invalid metadata_id', async () => {
      mockRequest.body = { metadata_id: 'invalid' };

      await controller.deleteMetadata(mockRequest as Request, mockResponse as Response);

      expect(mockService.deleteLookupMetadata).not.toHaveBeenCalled();
      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Invalid metadata ID',
        400
      );
    });

    it('should return 404 when metadata not found', async () => {
      mockService.deleteLookupMetadata.mockRejectedValue(new Error('Metadata not found'));
      mockRequest.body = { metadata_id: 999 };

      await controller.deleteMetadata(mockRequest as Request, mockResponse as Response);

      expect(ResponseUtil.notFound).toHaveBeenCalledWith(
        mockResponse,
        'Metadata not found'
      );
    });

    it('should handle service errors', async () => {
      mockService.deleteLookupMetadata.mockRejectedValue(new Error('Delete failed'));
      mockRequest.body = { metadata_id: 1 };

      await controller.deleteMetadata(mockRequest as Request, mockResponse as Response);

      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Error deleting metadata',
        500,
        'Delete failed'
      );
    });
  });

  describe('checkMetadataKey', () => {
    it('should return availability status', async () => {
      mockService.checkMetadataKeyAvailability.mockResolvedValue(true);
      mockRequest.body = { lookup_id: 1, metadata_key: 'new_key' };

      await controller.checkMetadataKey(mockRequest as Request, mockResponse as Response);

      expect(mockService.checkMetadataKeyAvailability).toHaveBeenCalledWith(1, 'new_key', undefined);
      expect(ResponseUtil.success).toHaveBeenCalledWith(
        mockResponse,
        { available: true },
        'Metadata key availability checked'
      );
    });

    it('should exclude current metadata when checking', async () => {
      mockService.checkMetadataKeyAvailability.mockResolvedValue(true);
      mockRequest.body = { lookup_id: 1, metadata_key: 'color', exclude_metadata_id: 5 };

      await controller.checkMetadataKey(mockRequest as Request, mockResponse as Response);

      expect(mockService.checkMetadataKeyAvailability).toHaveBeenCalledWith(1, 'color', 5);
    });

    it('should handle service errors', async () => {
      mockService.checkMetadataKeyAvailability.mockRejectedValue(new Error('Query failed'));
      mockRequest.body = { lookup_id: 1, metadata_key: 'color' };

      await controller.checkMetadataKey(mockRequest as Request, mockResponse as Response);

      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Error checking metadata key',
        500,
        'Query failed'
      );
    });
  });
});
