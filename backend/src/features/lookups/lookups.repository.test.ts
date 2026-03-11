import { LookupsRepository } from './lookups.repository';
import { 
  CreateLookupCategoryDto, 
  UpdateLookupCategoryDto, 
  LookupCategoryFilters,
  CreateLookupDto,
  UpdateLookupDto,
  LookupFilters
} from './lookups.types';
import { connectionManager } from '../../core/database/connection-manager';
import sql from 'mssql';

// Mock the database service
jest.mock('../../core/database/connection-manager');

describe('LookupsRepository', () => {
  let repository: LookupsRepository;
  let mockPool: any;
  let mockRequest: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock request
    mockRequest = {
      input: jest.fn().mockReturnThis(),
      query: jest.fn()
    };

    // Create mock pool
    mockPool = {
      request: jest.fn().mockReturnValue(mockRequest)
    };

    // Mock connectionManager
    (connectionManager.getPool as jest.Mock).mockResolvedValue(mockPool);

    repository = new LookupsRepository();
  });

  describe('Lookup Categories', () => {
    describe('getLookupCategories', () => {
      it('should return paginated categories', async () => {
        const filters: LookupCategoryFilters = { page: 1, limit: 10 };
        const mockCategories = [
          { category_id: 1, category_name: 'Test Category', is_active: true, lookup_count: 5 }
        ];

        mockRequest.query
          .mockResolvedValueOnce({ recordset: [{ total: 1 }] } as any)
          .mockResolvedValueOnce({ recordset: mockCategories } as any);

        const result = await repository.getLookupCategories(filters);

        expect(result).toEqual({
          categories: mockCategories,
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1
        });
      });

      it('should apply search filter', async () => {
        const filters: LookupCategoryFilters = { page: 1, limit: 10, search: 'Test' };
        mockRequest.query
          .mockResolvedValueOnce({ recordset: [{ total: 0 }] } as any)
          .mockResolvedValueOnce({ recordset: [] } as any);

        await repository.getLookupCategories(filters);

        expect(mockRequest.input).toHaveBeenCalledWith('search', sql.NVarChar(500), '%Test%');
        expect(mockRequest.input).toHaveBeenCalledWith('offset', sql.Int, 0);
        expect(mockRequest.input).toHaveBeenCalledWith('limit', sql.Int, 10);
      });

      it('should apply is_active filter', async () => {
        const filters: LookupCategoryFilters = { page: 1, limit: 10, is_active: true };
        mockRequest.query
          .mockResolvedValueOnce({ recordset: [{ total: 0 }] } as any)
          .mockResolvedValueOnce({ recordset: [] } as any);

        await repository.getLookupCategories(filters);

        expect(mockRequest.input).toHaveBeenCalledWith('isActive', sql.Bit, true);
        expect(mockRequest.input).toHaveBeenCalledWith('offset', sql.Int, 0);
        expect(mockRequest.input).toHaveBeenCalledWith('limit', sql.Int, 10);
      });
    });

    describe('getLookupCategoryById', () => {
      it('should return category by ID', async () => {
        const mockCategory = { category_id: 1, category_name: 'Test Category' };
        mockRequest.query.mockResolvedValueOnce({ recordset: [mockCategory] } as any);

        const result = await repository.getLookupCategoryById(1);

        expect(result).toEqual(mockCategory);
        expect(mockRequest.input).toHaveBeenCalledWith('categoryId', sql.BigInt, 1);
      });

      it('should return null when category not found', async () => {
        mockRequest.query.mockResolvedValueOnce({ recordset: [] } as any);

        const result = await repository.getLookupCategoryById(999);

        expect(result).toBeNull();
      });
    });

    describe('categoryNameExists', () => {
      it('should return true when category_name exists', async () => {
        mockRequest.query.mockResolvedValueOnce({ recordset: [{ count: 1 }] } as any);

        const result = await repository.categoryNameExists('Test Category');

        expect(result).toBe(true);
        expect(mockRequest.input).toHaveBeenCalledWith('categoryName', sql.NVarChar(100), 'Test Category');
      });

      it('should return false when category_name does not exist', async () => {
        mockRequest.query.mockResolvedValueOnce({ recordset: [{ count: 0 }] } as any);

        const result = await repository.categoryNameExists('Nonexistent');

        expect(result).toBe(false);
      });
    });

    describe('createLookupCategory', () => {
      it('should create category successfully', async () => {
        mockRequest.query.mockResolvedValueOnce({ recordset: [{ category_id: 1 }] } as any);

        const result = await repository.createLookupCategory('Test Category', 'Test Description', true, 'admin');

        expect(result).toBe(1);
        expect(mockRequest.input).toHaveBeenCalledWith('categoryName', sql.NVarChar(100), 'Test Category');
        expect(mockRequest.input).toHaveBeenCalledWith('description', sql.NVarChar(255), 'Test Description');
        expect(mockRequest.input).toHaveBeenCalledWith('isActive', sql.Bit, true);
        expect(mockRequest.input).toHaveBeenCalledWith('createdBy', sql.VarChar(50), 'admin');
      });
    });

    describe('updateLookupCategory', () => {
      it('should update category successfully', async () => {
        mockRequest.query.mockResolvedValueOnce({ rowsAffected: [1] } as any);

        await repository.updateLookupCategory(1, 'Updated Category', 'Updated Description', true, 'admin');

        expect(mockRequest.input).toHaveBeenCalledWith('categoryName', sql.NVarChar(100), 'Updated Category');
        expect(mockRequest.input).toHaveBeenCalledWith('description', sql.NVarChar(255), 'Updated Description');
        expect(mockRequest.input).toHaveBeenCalledWith('isActive', sql.Bit, true);
        expect(mockRequest.input).toHaveBeenCalledWith('updatedBy', sql.VarChar(50), 'admin');
        expect(mockRequest.input).toHaveBeenCalledWith('categoryId', sql.Int, 1);
      });
    });

    describe('deleteLookupCategory', () => {
      it('should delete category successfully', async () => {
        mockRequest.query.mockResolvedValueOnce({ rowsAffected: [1] } as any);

        await repository.deleteLookupCategory(1);

        expect(mockRequest.input).toHaveBeenCalledWith('categoryId', sql.Int, 1);
        expect(mockRequest.query).toHaveBeenCalledWith(
          expect.stringContaining('UPDATE ccms_m_lookup_categories')
        );
      });
    });
  });

  describe('Lookups', () => {
    describe('getLookups', () => {
      it('should return paginated lookups', async () => {
        const filters: LookupFilters = { page: 1, limit: 10 };
        const mockLookups = [
          { lookup_id: 1, lookup_code: 'TEST001', lookup_value: 'Test Value', is_active: true, category_id: 1, category_name: 'Test', sort_order: 1, metadata_count: 0 }
        ];

        mockRequest.query
          .mockResolvedValueOnce({ recordset: [{ total: 1 }] } as any)
          .mockResolvedValueOnce({ recordset: mockLookups } as any);

        const result = await repository.getLookups(filters);

        expect(result).toEqual({
          lookups: mockLookups,
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1
        });
      });

      it('should apply category_id filter', async () => {
        const filters: LookupFilters = { page: 1, limit: 10, category_id: 1 };
        mockRequest.query
          .mockResolvedValueOnce({ recordset: [{ total: 0 }] } as any)
          .mockResolvedValueOnce({ recordset: [] } as any);

        await repository.getLookups(filters);

        expect(mockRequest.input).toHaveBeenCalledWith('categoryId', sql.BigInt, 1);
        expect(mockRequest.input).toHaveBeenCalledWith('offset', sql.Int, 0);
        expect(mockRequest.input).toHaveBeenCalledWith('limit', sql.Int, 10);
      });

      it('should apply search filter', async () => {
        const filters: LookupFilters = { page: 1, limit: 10, search: 'Test' };
        mockRequest.query
          .mockResolvedValueOnce({ recordset: [{ total: 0 }] } as any)
          .mockResolvedValueOnce({ recordset: [] } as any);

        await repository.getLookups(filters);

        expect(mockRequest.input).toHaveBeenCalledWith('search', sql.NVarChar(500), '%Test%');
        expect(mockRequest.input).toHaveBeenCalledWith('offset', sql.Int, 0);
        expect(mockRequest.input).toHaveBeenCalledWith('limit', sql.Int, 10);
      });
    });

    describe('getLookupById', () => {
      it('should return lookup by ID', async () => {
        const mockLookup = { lookup_id: 1, lookup_code: 'TEST001', lookup_value: 'Test Value' };
        mockRequest.query.mockResolvedValueOnce({ recordset: [mockLookup] } as any);

        const result = await repository.getLookupById(1);

        expect(result).toEqual(mockLookup);
        expect(mockRequest.input).toHaveBeenCalledWith('lookupId', sql.BigInt, 1);
      });

      it('should return null when lookup not found', async () => {
        mockRequest.query.mockResolvedValueOnce({ recordset: [] } as any);

        const result = await repository.getLookupById(999);

        expect(result).toBeNull();
      });
    });

    describe('getLookupsByCategory', () => {
      it('should return lookups by category', async () => {
        const mockLookups = [
          { lookup_id: 1, lookup_code: 'TEST001', lookup_value: 'Test Value' }
        ];
        mockRequest.query.mockResolvedValueOnce({ recordset: mockLookups } as any);

        const result = await repository.getLookupsByCategory(1);

        expect(result).toEqual(mockLookups);
        expect(mockRequest.input).toHaveBeenCalledWith('categoryId', sql.Int, 1);
      });
    });

    describe('lookupCodeExists', () => {
      it('should return true when lookup_code exists in category', async () => {
        mockRequest.query.mockResolvedValueOnce({ recordset: [{ count: 1 }] } as any);

        const result = await repository.lookupCodeExists(1, 'TEST001');

        expect(result).toBe(true);
        expect(mockRequest.input).toHaveBeenCalledWith('categoryId', sql.BigInt, 1);
        expect(mockRequest.input).toHaveBeenCalledWith('lookupCode', sql.VarChar(50), 'TEST001');
      });

      it('should return false when lookup_code does not exist', async () => {
        mockRequest.query.mockResolvedValueOnce({ recordset: [{ count: 0 }] } as any);

        const result = await repository.lookupCodeExists(1, 'NONEXISTENT');

        expect(result).toBe(false);
      });

      it('should exclude current lookup when updating', async () => {
        mockRequest.query.mockResolvedValueOnce({ recordset: [{ count: 0 }] } as any);

        const result = await repository.lookupCodeExists(1, 'TEST001', 1);

        expect(result).toBe(false);
        expect(mockRequest.input).toHaveBeenCalledWith('excludeLookupId', sql.Int, 1);
      });
    });

    describe('createLookup', () => {
      it('should create lookup successfully', async () => {
        mockRequest.query.mockResolvedValueOnce({ recordset: [{ lookup_id: 1 }] } as any);

        const result = await repository.createLookup(1, 'TEST001', 'Test Value', 1, true, 'admin');

        expect(result).toBe(1);
        expect(mockRequest.input).toHaveBeenCalledWith('categoryId', sql.Int, 1);
        expect(mockRequest.input).toHaveBeenCalledWith('lookupCode', sql.VarChar(20), 'TEST001');
        expect(mockRequest.input).toHaveBeenCalledWith('lookupValue', sql.NVarChar(255), 'Test Value');
        expect(mockRequest.input).toHaveBeenCalledWith('sortOrder', sql.Int, 1);
        expect(mockRequest.input).toHaveBeenCalledWith('isActive', sql.Bit, true);
        expect(mockRequest.input).toHaveBeenCalledWith('createdBy', sql.VarChar(50), 'admin');
      });
    });

    describe('updateLookup', () => {
      it('should update lookup successfully', async () => {
        mockRequest.query.mockResolvedValueOnce({ rowsAffected: [1] } as any);

        await repository.updateLookup(1, undefined, undefined, 'Updated Value', undefined, undefined, 'admin');

        expect(mockRequest.input).toHaveBeenCalledWith('lookupValue', sql.NVarChar(255), 'Updated Value');
        expect(mockRequest.input).toHaveBeenCalledWith('updatedBy', sql.VarChar(50), 'admin');
        expect(mockRequest.input).toHaveBeenCalledWith('lookupId', sql.Int, 1);
      });
    });

    describe('deleteLookup', () => {
      it('should delete lookup successfully', async () => {
        mockRequest.query.mockResolvedValueOnce({ rowsAffected: [1] } as any);

        await repository.deleteLookup(1);

        expect(mockRequest.input).toHaveBeenCalledWith('lookupId', sql.Int, 1);
        expect(mockRequest.query).toHaveBeenCalledWith(
          expect.stringContaining('UPDATE ccms_m_lookups')
        );
      });
    });
  });
});
