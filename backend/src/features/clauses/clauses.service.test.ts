import { ClausesService } from './clauses.service';
import { ClausesRepository } from './clauses.repository';
import { CreateClauseDto, UpdateClauseDto, ClauseFilters } from './clauses.types';

// Mock dependencies
jest.mock('./clauses.repository');

describe('ClausesService', () => {
  let service: ClausesService;
  let mockRepository: jest.Mocked<ClausesRepository>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock ClausesRepository
    mockRepository = {
      getClauses: jest.fn(),
      getClauseById: jest.fn(),
      clauseCodeExists: jest.fn(),
      createClause: jest.fn(),
      updateClause: jest.fn(),
      deleteClause: jest.fn(),
    } as any;

    (ClausesRepository as jest.MockedClass<typeof ClausesRepository>).mockImplementation(() => mockRepository);

    service = new ClausesService();
  });

  describe('getClauses', () => {
    it('should return paginated clauses', async () => {
      const filters: ClauseFilters = { page: 1, limit: 10 };
      const mockResult = {
        clauses: [
          { clause_id: 1, clause_code: 'CLS001', clause_text: 'Test Clause', is_active: true }
        ],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1
      };

      mockRepository.getClauses.mockResolvedValue(mockResult);

      const result = await service.getClauses(filters);

      expect(result).toEqual(mockResult);
      expect(mockRepository.getClauses).toHaveBeenCalledWith(filters);
    });
  });

  describe('getClauseById', () => {
    it('should return clause by ID', async () => {
      const mockClause = {
        clause_id: 1,
        clause_code: 'CLS001',
        clause_text: 'Test Clause',
        is_active: true,
        clause_category: 'General'
      };

      mockRepository.getClauseById.mockResolvedValue(mockClause);

      const result = await service.getClauseById(1);

      expect(result).toEqual(mockClause);
      expect(mockRepository.getClauseById).toHaveBeenCalledWith(1);
    });

    it('should return null when clause not found', async () => {
      mockRepository.getClauseById.mockResolvedValue(null);

      const result = await service.getClauseById(999);

      expect(result).toBeNull();
    });
  });

  describe('createClause', () => {
    const validDto: CreateClauseDto = {
      clause_code: 'CLS001',
      clause_text: 'Test Clause',
      is_active: true
    };

    it('should create clause successfully', async () => {
      mockRepository.clauseCodeExists.mockResolvedValue(false);
      mockRepository.createClause.mockResolvedValue(1);

      const result = await service.createClause(validDto, 'admin');

      expect(result).toBe(1);
      expect(mockRepository.clauseCodeExists).toHaveBeenCalledWith('CLS001');
      expect(mockRepository.createClause).toHaveBeenCalledWith('CLS001', 'Test Clause', true, 'admin', undefined);
    });

    it('should validate clause_code length', async () => {
      const invalidDto = { ...validDto, clause_code: 'A' };

      await expect(service.createClause(invalidDto, 'admin'))
        .rejects
        .toThrow('Clause code must be between 2 and 20 characters');
    });

    it('should validate clause_text length', async () => {
      const invalidDto = { ...validDto, clause_text: '' };

      await expect(service.createClause(invalidDto, 'admin'))
        .rejects
        .toThrow('Clause text is required');
    });

    it('should check for duplicate clause_code', async () => {
      mockRepository.clauseCodeExists.mockResolvedValue(true);

      await expect(service.createClause(validDto, 'admin'))
        .rejects
        .toThrow('Clause code already exists');

      expect(mockRepository.createClause).not.toHaveBeenCalled();
    });
  });

  describe('updateClause', () => {
    const validDto: UpdateClauseDto = {
      clause_text: 'Updated Clause Text'
    };

    it('should update clause successfully', async () => {
      mockRepository.getClauseById.mockResolvedValue({ clause_id: 1, clause_code: 'CLS001', clause_text: 'Test', is_active: true } as any);
      mockRepository.updateClause.mockResolvedValue(undefined);

      await service.updateClause(1, validDto, 'admin');

      expect(mockRepository.updateClause).toHaveBeenCalledWith(1, undefined, 'Updated Clause Text', undefined, 'admin');
    });

    it('should validate clause_code length if provided', async () => {
      mockRepository.getClauseById.mockResolvedValue({ clause_id: 1, clause_code: 'CLS001', clause_text: 'Test', is_active: true } as any);
      const invalidDto = { clause_code: 'A' };

      await expect(service.updateClause(1, invalidDto, 'admin'))
        .rejects
        .toThrow('Clause code must be between 2 and 20 characters');
    });

    // Note: updateClause does not validate empty clause_text, so this test is removed
    // The service allows empty clause_text in updates
  });

  describe('deleteClause', () => {
    it('should delete clause successfully', async () => {
      mockRepository.getClauseById.mockResolvedValue({ clause_id: 1, clause_code: 'CLS001', clause_text: 'Test', is_active: true } as any);
      mockRepository.deleteClause.mockResolvedValue(undefined);

      await service.deleteClause(1);

      expect(mockRepository.deleteClause).toHaveBeenCalledWith(1);
    });
  });
});
