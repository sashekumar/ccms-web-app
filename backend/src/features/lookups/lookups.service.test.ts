import { LookupsService } from './lookups.service';
import { LookupsRepository } from './lookups.repository';
import { 
  CreateLookupCategoryDto, 
  UpdateLookupCategoryDto, 
  LookupCategoryFilters,
  CreateLookupDto,
  UpdateLookupDto,
  LookupFilters,
  CreateLookupMetadataDto,
  UpdateLookupMetadataDto,
  LookupMetadataFilters
} from './lookups.types';

// Mock dependencies
jest.mock('./lookups.repository');

describe('LookupsService', () => {
  let service: LookupsService;
  let mockRepository: jest.Mocked<LookupsRepository>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRepository = {
      getLookupCategories: jest.fn(),
      getLookupCategoryById: jest.fn(),
      categoryNameExists: jest.fn(),
      createLookupCategory: jest.fn(),
      updateLookupCategory: jest.fn(),
      deleteLookupCategory: jest.fn(),
      getLookups: jest.fn(),
      getLookupById: jest.fn(),
      getLookupsByCategory: jest.fn(),
      lookupCodeExists: jest.fn(),
      createLookup: jest.fn(),
      updateLookup: jest.fn(),
      deleteLookup: jest.fn(),
      getNextSortOrder: jest.fn(),
      getLookupMetadata: jest.fn(),
      getLookupMetadataById: jest.fn(),
      createLookupMetadata: jest.fn(),
      updateLookupMetadata: jest.fn(),
      deleteLookupMetadata: jest.fn(),
      metadataKeyExists: jest.fn(),
    } as any;

    (LookupsRepository as jest.MockedClass<typeof LookupsRepository>).mockImplementation(() => mockRepository);

    service = new LookupsService();
  });

  // ========================================================================
  // LOOKUP CATEGORIES
  // ========================================================================

  describe('Lookup Categories', () => {
    describe('getLookupCategories', () => {
      it('should return paginated categories', async () => {
        const filters: LookupCategoryFilters = { page: 1, limit: 10 };
        const mockResult = {
          categories: [
            { category_id: 1, category_name: 'Test Category', description: null, is_active: true, lookup_count: 5 }
          ],
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1
        };

        mockRepository.getLookupCategories.mockResolvedValue(mockResult);

        const result = await service.getLookupCategories(filters);

        expect(result).toEqual(mockResult);
        expect(mockRepository.getLookupCategories).toHaveBeenCalledWith(filters);
      });
    });

    describe('getLookupCategoryById', () => {
      it('should return category by ID', async () => {
        const mockCategory = {
          category_id: 1,
          category_name: 'Test Category',
          description: null,
          is_active: true
        };
        
        mockRepository.getLookupCategoryById.mockResolvedValue(mockCategory);

        const result = await service.getLookupCategoryById(1);

        expect(result).toEqual(mockCategory);
        expect(mockRepository.getLookupCategoryById).toHaveBeenCalledWith(1);
      });

      it('should return null when category not found', async () => {
        mockRepository.getLookupCategoryById.mockResolvedValue(null);

        const result = await service.getLookupCategoryById(999);

        expect(result).toBeNull();
      });
    });

    describe('createLookupCategory', () => {
      const validDto: CreateLookupCategoryDto = {
        category_name: 'Test Category',
        is_active: true
      };

      it('should create category successfully', async () => {
        mockRepository.categoryNameExists.mockResolvedValue(false);
        mockRepository.createLookupCategory.mockResolvedValue(1);

        const result = await service.createLookupCategory(validDto, 'admin');

        expect(result).toBe(1);
        expect(mockRepository.categoryNameExists).toHaveBeenCalledWith('Test Category');
        expect(mockRepository.createLookupCategory).toHaveBeenCalledWith(
          'Test Category',
          undefined,
          true,
          'admin'
        );
      });

      it('should throw error when category name is too short', async () => {
        const invalidDto = { ...validDto, category_name: 'A' };

        await expect(service.createLookupCategory(invalidDto, 'admin'))
          .rejects
          .toThrow('Category name must be between 2 and 100 characters');
      });

      it('should throw error when category name is too long', async () => {
        const invalidDto = { ...validDto, category_name: 'A'.repeat(101) };

        await expect(service.createLookupCategory(invalidDto, 'admin'))
          .rejects
          .toThrow('Category name must be between 2 and 100 characters');
      });

      it('should check for duplicate category_name', async () => {
        mockRepository.categoryNameExists.mockResolvedValue(true);

        await expect(service.createLookupCategory(validDto, 'admin'))
          .rejects
          .toThrow('Category name already exists');

        expect(mockRepository.createLookupCategory).not.toHaveBeenCalled();
      });

      it('should default is_active to true when not provided', async () => {
        const dto = { category_name: 'Test Category' };
        mockRepository.categoryNameExists.mockResolvedValue(false);
        mockRepository.createLookupCategory.mockResolvedValue(1);

        await service.createLookupCategory(dto, 'admin');

        expect(mockRepository.createLookupCategory).toHaveBeenCalledWith(
          'Test Category',
          undefined,
          true,
          'admin'
        );
      });
    });

    describe('updateLookupCategory', () => {
      const validDto: UpdateLookupCategoryDto = {
        category_name: 'Updated Category'
      };

      it('should update category successfully', async () => {
        mockRepository.getLookupCategoryById.mockResolvedValue({ category_id: 1, category_name: 'Test Category' } as any);
        mockRepository.categoryNameExists.mockResolvedValue(false);
        mockRepository.updateLookupCategory.mockResolvedValue(undefined);

        await service.updateLookupCategory(1, validDto, 'admin');

        expect(mockRepository.updateLookupCategory).toHaveBeenCalledWith(
          1,
          'Updated Category',
          undefined,
          undefined,
          'admin'
        );
      });

      it('should throw error when category not found', async () => {
        mockRepository.getLookupCategoryById.mockResolvedValue(null);

        await expect(service.updateLookupCategory(999, validDto, 'admin'))
          .rejects
          .toThrow('Category not found');
      });

      it('should throw error when category name is too short', async () => {
        mockRepository.getLookupCategoryById.mockResolvedValue({ category_id: 1, category_name: 'Test Category' } as any);
        const invalidDto = { category_name: 'A' };

        await expect(service.updateLookupCategory(1, invalidDto, 'admin'))
          .rejects
          .toThrow('Category name must be between 2 and 100 characters');
      });

      it('should throw error when category name is too long', async () => {
        mockRepository.getLookupCategoryById.mockResolvedValue({ category_id: 1, category_name: 'Test Category' } as any);
        const invalidDto = { category_name: 'A'.repeat(101) };

        await expect(service.updateLookupCategory(1, invalidDto, 'admin'))
          .rejects
          .toThrow('Category name must be between 2 and 100 characters');
      });

      it('should check for duplicate category name', async () => {
        mockRepository.getLookupCategoryById.mockResolvedValue({ category_id: 1, category_name: 'Test Category' } as any);
        mockRepository.categoryNameExists.mockResolvedValue(true);

        await expect(service.updateLookupCategory(1, validDto, 'admin'))
          .rejects
          .toThrow('Category name already exists');
      });
    });

    describe('deleteLookupCategory', () => {
      it('should delete category successfully', async () => {
        mockRepository.getLookupCategoryById.mockResolvedValue({ category_id: 1, category_name: 'Test Category' } as any);
        mockRepository.deleteLookupCategory.mockResolvedValue(undefined);

        await service.deleteLookupCategory(1);

        expect(mockRepository.deleteLookupCategory).toHaveBeenCalledWith(1);
      });

      it('should throw error when category not found', async () => {
        mockRepository.getLookupCategoryById.mockResolvedValue(null);

        await expect(service.deleteLookupCategory(999))
          .rejects
          .toThrow('Category not found');
      });
    });

    describe('checkCategoryNameAvailability', () => {
      it('should return true when name is available', async () => {
        mockRepository.categoryNameExists.mockResolvedValue(false);

        const result = await service.checkCategoryNameAvailability('New Category');

        expect(result).toBe(true);
        expect(mockRepository.categoryNameExists).toHaveBeenCalledWith('New Category', undefined);
      });

      it('should return false when name exists', async () => {
        mockRepository.categoryNameExists.mockResolvedValue(true);

        const result = await service.checkCategoryNameAvailability('Existing Category');

        expect(result).toBe(false);
      });

      it('should exclude category ID when provided', async () => {
        mockRepository.categoryNameExists.mockResolvedValue(false);

        await service.checkCategoryNameAvailability('Category', 1);

        expect(mockRepository.categoryNameExists).toHaveBeenCalledWith('Category', 1);
      });
    });
  });

  // ========================================================================
  // LOOKUPS
  // ========================================================================

  describe('Lookups', () => {
    describe('getLookups', () => {
      it('should return paginated lookups', async () => {
        const filters: LookupFilters = { page: 1, limit: 10 };
        const mockResult = {
          lookups: [
            { lookup_id: 1, category_id: 1, category_name: 'Test', lookup_code: 'TEST001', lookup_value: 'Test Lookup', is_active: true, sort_order: 1, metadata_count: 0 }
          ],
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1
        };

        mockRepository.getLookups.mockResolvedValue(mockResult);

        const result = await service.getLookups(filters);

        expect(result).toEqual(mockResult);
        expect(mockRepository.getLookups).toHaveBeenCalledWith(filters);
      });
    });

    describe('getLookupById', () => {
      it('should return lookup by ID', async () => {
        const mockLookup = {
          lookup_id: 1,
          category_id: 1,
          lookup_code: 'TEST001',
          lookup_value: 'Test Lookup',
          is_active: true,
          sort_order: 1,
          created_at: new Date()
        };

        mockRepository.getLookupById.mockResolvedValue(mockLookup);

        const result = await service.getLookupById(1);

        expect(result).toEqual(mockLookup);
        expect(mockRepository.getLookupById).toHaveBeenCalledWith(1);
      });

      it('should return null when lookup not found', async () => {
        mockRepository.getLookupById.mockResolvedValue(null);

        const result = await service.getLookupById(999);

        expect(result).toBeNull();
      });
    });

    describe('getLookupsByCategory', () => {
      it('should return lookups by category', async () => {
        const mockLookups = [
          { lookup_id: 1, category_id: 1, lookup_code: 'TEST001', lookup_value: 'Test Value', is_active: true, sort_order: 1, created_at: new Date() }
        ];

        mockRepository.getLookupsByCategory.mockResolvedValue(mockLookups);

        const result = await service.getLookupsByCategory(1);

        expect(result).toEqual(mockLookups);
        expect(mockRepository.getLookupsByCategory).toHaveBeenCalledWith(1, undefined);
      });

      it('should filter by is_active when provided', async () => {
        const mockLookups = [
          { lookup_id: 1, category_id: 1, lookup_code: 'TEST001', lookup_value: 'Test Value', is_active: true, sort_order: 1, created_at: new Date() }
        ];

        mockRepository.getLookupsByCategory.mockResolvedValue(mockLookups);

        const result = await service.getLookupsByCategory(1, true);

        expect(result).toEqual(mockLookups);
        expect(mockRepository.getLookupsByCategory).toHaveBeenCalledWith(1, true);
      });
    });

    describe('createLookup', () => {
      const validDto: CreateLookupDto = {
        category_id: 1,
        lookup_code: 'TEST001',
        lookup_value: 'Test Value',
        sort_order: 1,
        is_active: true
      };

      it('should create lookup successfully', async () => {
        mockRepository.getLookupCategoryById.mockResolvedValue({ category_id: 1, category_name: 'Test Category' } as any);
        mockRepository.lookupCodeExists.mockResolvedValue(false);
        mockRepository.createLookup.mockResolvedValue(1);

        const result = await service.createLookup(validDto, 'admin');

        expect(result).toBe(1);
        expect(mockRepository.lookupCodeExists).toHaveBeenCalledWith(1, 'TEST001');
        expect(mockRepository.createLookup).toHaveBeenCalledWith(
          1,
          'TEST001',
          'Test Value',
          1,
          true,
          'admin'
        );
      });

      it('should create new category when new_category_name provided', async () => {
        const dto: CreateLookupDto = {
          new_category_name: 'New Category',
          lookup_code: 'TEST001',
          lookup_value: 'Test Value'
        };

        mockRepository.categoryNameExists.mockResolvedValue(false);
        mockRepository.createLookupCategory.mockResolvedValue(1);
        mockRepository.getLookupCategoryById.mockResolvedValue({ category_id: 1 } as any);
        mockRepository.lookupCodeExists.mockResolvedValue(false);
        mockRepository.getNextSortOrder.mockResolvedValue(1);
        mockRepository.createLookup.mockResolvedValue(1);

        const result = await service.createLookup(dto, 'admin');

        expect(result).toBe(1);
        expect(mockRepository.createLookupCategory).toHaveBeenCalled();
      });

      it('should throw error when neither category_id nor new_category_name provided', async () => {
        const dto: CreateLookupDto = {
          lookup_code: 'TEST001',
          lookup_value: 'Test Value'
        };

        await expect(service.createLookup(dto, 'admin'))
          .rejects
          .toThrow('Category ID or new category name is required');
      });

      it('should throw error when category not found', async () => {
        mockRepository.getLookupCategoryById.mockResolvedValue(null);

        await expect(service.createLookup(validDto, 'admin'))
          .rejects
          .toThrow('Category not found');
      });

      it('should throw error when lookup code is too short', async () => {
        mockRepository.getLookupCategoryById.mockResolvedValue({ category_id: 1, category_name: 'Test Category' } as any);
        const invalidDto = { ...validDto, lookup_code: 'A' };

        await expect(service.createLookup(invalidDto, 'admin'))
          .rejects
          .toThrow('Lookup code must be between 2 and 20 characters');
      });

      it('should throw error when lookup code is too long', async () => {
        mockRepository.getLookupCategoryById.mockResolvedValue({ category_id: 1, category_name: 'Test Category' } as any);
        const invalidDto = { ...validDto, lookup_code: 'A'.repeat(21) };

        await expect(service.createLookup(invalidDto, 'admin'))
          .rejects
          .toThrow('Lookup code must be between 2 and 20 characters');
      });

      it('should throw error when lookup value is empty', async () => {
        mockRepository.getLookupCategoryById.mockResolvedValue({ category_id: 1, category_name: 'Test Category' } as any);
        const invalidDto = { ...validDto, lookup_value: '' };

        await expect(service.createLookup(invalidDto, 'admin'))
          .rejects
          .toThrow('Lookup value must be between 1 and 255 characters');
      });

      it('should throw error when lookup value is too long', async () => {
        mockRepository.getLookupCategoryById.mockResolvedValue({ category_id: 1, category_name: 'Test Category' } as any);
        const invalidDto = { ...validDto, lookup_value: 'A'.repeat(256) };

        await expect(service.createLookup(invalidDto, 'admin'))
          .rejects
          .toThrow('Lookup value must be between 1 and 255 characters');
      });

      it('should check for duplicate lookup_code in same category', async () => {
        mockRepository.getLookupCategoryById.mockResolvedValue({ category_id: 1, category_name: 'Test Category' } as any);
        mockRepository.lookupCodeExists.mockResolvedValue(true);

        await expect(service.createLookup(validDto, 'admin'))
          .rejects
          .toThrow('Lookup code already exists in this category');

        expect(mockRepository.createLookup).not.toHaveBeenCalled();
      });

      it('should auto-calculate sort order when not provided', async () => {
        const dto = { ...validDto, sort_order: undefined };
        mockRepository.getLookupCategoryById.mockResolvedValue({ category_id: 1 } as any);
        mockRepository.lookupCodeExists.mockResolvedValue(false);
        mockRepository.getNextSortOrder.mockResolvedValue(10);
        mockRepository.createLookup.mockResolvedValue(1);

        await service.createLookup(dto, 'admin');

        expect(mockRepository.getNextSortOrder).toHaveBeenCalledWith(1);
        expect(mockRepository.createLookup).toHaveBeenCalledWith(1, 'TEST001', 'Test Value', 10, true, 'admin');
      });

      it('should default is_active to true when not provided', async () => {
        const dto = { ...validDto, is_active: undefined };
        mockRepository.getLookupCategoryById.mockResolvedValue({ category_id: 1 } as any);
        mockRepository.lookupCodeExists.mockResolvedValue(false);
        mockRepository.createLookup.mockResolvedValue(1);

        await service.createLookup(dto, 'admin');

        expect(mockRepository.createLookup).toHaveBeenCalledWith(1, 'TEST001', 'Test Value', 1, true, 'admin');
      });
    });

    describe('updateLookup', () => {
      const validDto: UpdateLookupDto = {
        lookup_value: 'Updated Value'
      };

      it('should update lookup successfully', async () => {
        mockRepository.getLookupById.mockResolvedValue({ lookup_id: 1, category_id: 1, lookup_code: 'TEST001', lookup_value: 'Test Value', sort_order: 1, is_active: true } as any);
        mockRepository.updateLookup.mockResolvedValue(undefined);

        await service.updateLookup(1, validDto, 'admin');

        expect(mockRepository.updateLookup).toHaveBeenCalledWith(
          1,
          undefined,
          undefined,
          'Updated Value',
          undefined,
          undefined,
          'admin'
        );
      });

      it('should throw error when lookup not found', async () => {
        mockRepository.getLookupById.mockResolvedValue(null);

        await expect(service.updateLookup(999, validDto, 'admin'))
          .rejects
          .toThrow('Lookup not found');
      });

      it('should validate category exists when changing category', async () => {
        const dto = { category_id: 2 };
        mockRepository.getLookupById.mockResolvedValue({ lookup_id: 1, category_id: 1 } as any);
        mockRepository.getLookupCategoryById.mockResolvedValue(null);

        await expect(service.updateLookup(1, dto, 'admin'))
          .rejects
          .toThrow('Category not found');
      });

      it('should throw error when lookup code is too short', async () => {
        mockRepository.getLookupById.mockResolvedValue({ lookup_id: 1, category_id: 1, lookup_code: 'TEST001', lookup_value: 'Test Value', sort_order: 1, is_active: true } as any);
        const invalidDto = { lookup_code: 'A' };

        await expect(service.updateLookup(1, invalidDto, 'admin'))
          .rejects
          .toThrow('Lookup code must be between 2 and 20 characters');
      });

      it('should throw error when lookup code is too long', async () => {
        mockRepository.getLookupById.mockResolvedValue({ lookup_id: 1, category_id: 1 } as any);
        const invalidDto = { lookup_code: 'A'.repeat(21) };

        await expect(service.updateLookup(1, invalidDto, 'admin'))
          .rejects
          .toThrow('Lookup code must be between 2 and 20 characters');
      });

      it('should check for duplicate lookup code when changing code', async () => {
        const dto = { lookup_code: 'TEST002' };
        mockRepository.getLookupById.mockResolvedValue({ lookup_id: 1, category_id: 1, lookup_code: 'TEST001' } as any);
        mockRepository.lookupCodeExists.mockResolvedValue(true);

        await expect(service.updateLookup(1, dto, 'admin'))
          .rejects
          .toThrow('Lookup code already exists in this category');
      });

      it('should throw error when lookup value is empty', async () => {
        mockRepository.getLookupById.mockResolvedValue({ lookup_id: 1, category_id: 1, lookup_value: 'Test Value', sort_order: 1, is_active: true } as any);
        const invalidDto = { lookup_value: '' };

        await expect(service.updateLookup(1, invalidDto, 'admin'))
          .rejects
          .toThrow('Lookup value must be between 1 and 255 characters');
      });

      it('should throw error when lookup value is too long', async () => {
        mockRepository.getLookupById.mockResolvedValue({ lookup_id: 1, category_id: 1 } as any);
        const invalidDto = { lookup_value: 'A'.repeat(256) };

        await expect(service.updateLookup(1, invalidDto, 'admin'))
          .rejects
          .toThrow('Lookup value must be between 1 and 255 characters');
      });
    });

    describe('deleteLookup', () => {
      it('should delete lookup successfully', async () => {
        mockRepository.getLookupById.mockResolvedValue({ lookup_id: 1, category_id: 1, lookup_code: 'TEST001', lookup_value: 'Test Value', sort_order: 1, is_active: true } as any);
        mockRepository.deleteLookup.mockResolvedValue(undefined);

        await service.deleteLookup(1);

        expect(mockRepository.deleteLookup).toHaveBeenCalledWith(1);
      });

      it('should throw error when lookup not found', async () => {
        mockRepository.getLookupById.mockResolvedValue(null);

        await expect(service.deleteLookup(999))
          .rejects
          .toThrow('Lookup not found');
      });
    });

    describe('checkLookupCodeAvailability', () => {
      it('should return true when code is available', async () => {
        mockRepository.lookupCodeExists.mockResolvedValue(false);

        const result = await service.checkLookupCodeAvailability(1, 'TEST001');

        expect(result).toBe(true);
        expect(mockRepository.lookupCodeExists).toHaveBeenCalledWith(1, 'TEST001', undefined);
      });

      it('should return false when code exists', async () => {
        mockRepository.lookupCodeExists.mockResolvedValue(true);

        const result = await service.checkLookupCodeAvailability(1, 'TEST001');

        expect(result).toBe(false);
      });

      it('should exclude lookup ID when provided', async () => {
        mockRepository.lookupCodeExists.mockResolvedValue(false);

        await service.checkLookupCodeAvailability(1, 'TEST001', 1);

        expect(mockRepository.lookupCodeExists).toHaveBeenCalledWith(1, 'TEST001', 1);
      });
    });
  });

  // ========================================================================
  // LOOKUP METADATA
  // ========================================================================

  describe('Lookup Metadata', () => {
    describe('getLookupMetadata', () => {
      it('should return paginated metadata', async () => {
        const filters: LookupMetadataFilters = { page: 1, limit: 10 };
        const mockResult = {
          metadata: [
            { 
              metadata_id: 1, 
              lookup_id: 1, 
              lookup_code: 'LKP001',
              lookup_value: 'Test Lookup',
              category_name: 'Test Category',
              metadata_key: 'key1', 
              metadata_value: 'value1' 
            }
          ],
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1
        };

        mockRepository.getLookupMetadata.mockResolvedValue(mockResult);

        const result = await service.getLookupMetadata(filters);

        expect(result).toEqual(mockResult);
        expect(mockRepository.getLookupMetadata).toHaveBeenCalledWith(filters);
      });
    });

    describe('getLookupMetadataById', () => {
      it('should return metadata by ID', async () => {
        const mockMetadata = { metadata_id: 1, lookup_id: 1, metadata_key: 'key1', metadata_value: 'value1' };
        mockRepository.getLookupMetadataById.mockResolvedValue(mockMetadata);

        const result = await service.getLookupMetadataById(1);

        expect(result).toEqual(mockMetadata);
      });

      it('should return null when not found', async () => {
        mockRepository.getLookupMetadataById.mockResolvedValue(null);

        const result = await service.getLookupMetadataById(999);

        expect(result).toBeNull();
      });
    });

    describe('createLookupMetadata', () => {
      const validDto: CreateLookupMetadataDto = {
        lookup_id: 1,
        metadata_key: 'key1',
        metadata_value: 'value1'
      };

      it('should create metadata successfully', async () => {
        mockRepository.getLookupById.mockResolvedValue({ lookup_id: 1 } as any);
        mockRepository.metadataKeyExists.mockResolvedValue(false);
        mockRepository.createLookupMetadata.mockResolvedValue(1);

        const result = await service.createLookupMetadata(validDto, 'admin');

        expect(result).toBe(1);
        expect(mockRepository.createLookupMetadata).toHaveBeenCalledWith(1, 'key1', 'value1', 'admin');
      });

      it('should throw error when lookup_id is missing', async () => {
        const dto = { ...validDto, lookup_id: undefined } as any;

        await expect(service.createLookupMetadata(dto, 'admin'))
          .rejects
          .toThrow('Lookup ID is required');
      });

      it('should throw error when lookup not found', async () => {
        mockRepository.getLookupById.mockResolvedValue(null);

        await expect(service.createLookupMetadata(validDto, 'admin'))
          .rejects
          .toThrow('Lookup not found');
      });

      it('should throw error when metadata_key is empty', async () => {
        mockRepository.getLookupById.mockResolvedValue({ lookup_id: 1 } as any);
        const dto = { ...validDto, metadata_key: '' };

        await expect(service.createLookupMetadata(dto, 'admin'))
          .rejects
          .toThrow('Metadata key must be between 1 and 100 characters');
      });

      it('should throw error when metadata_key is too long', async () => {
        mockRepository.getLookupById.mockResolvedValue({ lookup_id: 1 } as any);
        const dto = { ...validDto, metadata_key: 'A'.repeat(101) };

        await expect(service.createLookupMetadata(dto, 'admin'))
          .rejects
          .toThrow('Metadata key must be between 1 and 100 characters');
      });

      it('should throw error when metadata_value is empty', async () => {
        mockRepository.getLookupById.mockResolvedValue({ lookup_id: 1 } as any);
        const dto = { ...validDto, metadata_value: '' };

        await expect(service.createLookupMetadata(dto, 'admin'))
          .rejects
          .toThrow('Metadata value must be between 1 and 500 characters');
      });

      it('should throw error when metadata_value is too long', async () => {
        mockRepository.getLookupById.mockResolvedValue({ lookup_id: 1 } as any);
        const dto = { ...validDto, metadata_value: 'A'.repeat(501) };

        await expect(service.createLookupMetadata(dto, 'admin'))
          .rejects
          .toThrow('Metadata value must be between 1 and 500 characters');
      });

      it('should check for duplicate metadata_key', async () => {
        mockRepository.getLookupById.mockResolvedValue({ lookup_id: 1 } as any);
        mockRepository.metadataKeyExists.mockResolvedValue(true);

        await expect(service.createLookupMetadata(validDto, 'admin'))
          .rejects
          .toThrow('Metadata key already exists for this lookup');
      });
    });

    describe('updateLookupMetadata', () => {
      const validDto: UpdateLookupMetadataDto = {
        metadata_value: 'new value'
      };

      it('should update metadata successfully', async () => {
        mockRepository.getLookupMetadataById.mockResolvedValue({ metadata_id: 1, lookup_id: 1 } as any);
        mockRepository.updateLookupMetadata.mockResolvedValue(undefined);

        await service.updateLookupMetadata(1, validDto, 'admin');

        expect(mockRepository.updateLookupMetadata).toHaveBeenCalledWith(1, undefined, 'new value', 'admin');
      });

      it('should throw error when metadata not found', async () => {
        mockRepository.getLookupMetadataById.mockResolvedValue(null);

        await expect(service.updateLookupMetadata(999, validDto, 'admin'))
          .rejects
          .toThrow('Metadata not found');
      });

      it('should throw error when metadata_key is empty', async () => {
        mockRepository.getLookupMetadataById.mockResolvedValue({ metadata_id: 1, lookup_id: 1 } as any);
        const dto = { metadata_key: '' };

        await expect(service.updateLookupMetadata(1, dto, 'admin'))
          .rejects
          .toThrow('Metadata key must be between 1 and 100 characters');
      });

      it('should throw error when metadata_key is too long', async () => {
        mockRepository.getLookupMetadataById.mockResolvedValue({ metadata_id: 1, lookup_id: 1 } as any);
        const dto = { metadata_key: 'A'.repeat(101) };

        await expect(service.updateLookupMetadata(1, dto, 'admin'))
          .rejects
          .toThrow('Metadata key must be between 1 and 100 characters');
      });

      it('should check for duplicate metadata_key when changing key', async () => {
        mockRepository.getLookupMetadataById.mockResolvedValue({ metadata_id: 1, lookup_id: 1 } as any);
        mockRepository.metadataKeyExists.mockResolvedValue(true);
        const dto = { metadata_key: 'key2' };

        await expect(service.updateLookupMetadata(1, dto, 'admin'))
          .rejects
          .toThrow('Metadata key already exists for this lookup');
      });

      it('should throw error when metadata_value is empty', async () => {
        mockRepository.getLookupMetadataById.mockResolvedValue({ metadata_id: 1, lookup_id: 1 } as any);
        const dto = { metadata_value: '' };

        await expect(service.updateLookupMetadata(1, dto, 'admin'))
          .rejects
          .toThrow('Metadata value must be between 1 and 500 characters');
      });

      it('should throw error when metadata_value is too long', async () => {
        mockRepository.getLookupMetadataById.mockResolvedValue({ metadata_id: 1, lookup_id: 1 } as any);
        const dto = { metadata_value: 'A'.repeat(501) };

        await expect(service.updateLookupMetadata(1, dto, 'admin'))
          .rejects
          .toThrow('Metadata value must be between 1 and 500 characters');
      });
    });

    describe('deleteLookupMetadata', () => {
      it('should delete metadata successfully', async () => {
        mockRepository.getLookupMetadataById.mockResolvedValue({ metadata_id: 1 } as any);
        mockRepository.deleteLookupMetadata.mockResolvedValue(undefined);

        await service.deleteLookupMetadata(1, 'admin');

        expect(mockRepository.deleteLookupMetadata).toHaveBeenCalledWith(1, 'admin');
      });

      it('should throw error when metadata not found', async () => {
        mockRepository.getLookupMetadataById.mockResolvedValue(null);

        await expect(service.deleteLookupMetadata(999, 'admin'))
          .rejects
          .toThrow('Metadata not found');
      });
    });

    describe('checkMetadataKeyAvailability', () => {
      it('should return true when key is available', async () => {
        mockRepository.metadataKeyExists.mockResolvedValue(false);

        const result = await service.checkMetadataKeyAvailability(1, 'key1');

        expect(result).toBe(true);
        expect(mockRepository.metadataKeyExists).toHaveBeenCalledWith(1, 'key1', undefined);
      });

      it('should return false when key exists', async () => {
        mockRepository.metadataKeyExists.mockResolvedValue(true);

        const result = await service.checkMetadataKeyAvailability(1, 'key1');

        expect(result).toBe(false);
      });

      it('should exclude metadata ID when provided', async () => {
        mockRepository.metadataKeyExists.mockResolvedValue(false);

        await service.checkMetadataKeyAvailability(1, 'key1', 1);

        expect(mockRepository.metadataKeyExists).toHaveBeenCalledWith(1, 'key1', 1);
      });
    });
  });
});
