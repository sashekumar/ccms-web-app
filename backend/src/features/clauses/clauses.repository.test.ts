import { ClausesRepository } from './clauses.repository';
import { CreateClauseDto, UpdateClauseDto, ClauseFilters } from './clauses.types';
import { connectionManager } from '../../core/database/connection-manager';
import sql from 'mssql';

// Mock the database service
jest.mock('../../core/database/connection-manager');

describe('ClausesRepository', () => {
  let repository: ClausesRepository;
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

    repository = new ClausesRepository();
  });

  describe('getClauses', () => {
    it('should return paginated clauses', async () => {
      const filters: ClauseFilters = { page: 1, limit: 10 };
      const mockClauses = [
        { clause_id: 1, clause_code: 'CLS001', clause_text: 'Test Clause', is_active: true }
      ];

      mockRequest.query
        .mockResolvedValueOnce({ recordset: [{ total: 1 }] })
        .mockResolvedValueOnce({ recordset: mockClauses });

      const result = await repository.getClauses(filters);

      expect(result).toEqual({
        clauses: mockClauses,
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1
      });
    });

    it('should apply search filter', async () => {
      const filters: ClauseFilters = { page: 1, limit: 10, search: 'Test' };
      mockRequest.query
        .mockResolvedValueOnce({ recordset: [{ total: 0 }] })
        .mockResolvedValueOnce({ recordset: [] });

      await repository.getClauses(filters);

      expect(mockRequest.input).toHaveBeenCalledWith('search', sql.NVarChar(sql.MAX), '%Test%');
      expect(mockRequest.input).toHaveBeenCalledWith('offset', sql.Int, 0);
      expect(mockRequest.input).toHaveBeenCalledWith('limit', sql.Int, 10);
    });

    it('should apply is_active filter', async () => {
      const filters: ClauseFilters = { page: 1, limit: 10, is_active: true };
      mockRequest.query
        .mockResolvedValueOnce({ recordset: [{ total: 0 }] })
        .mockResolvedValueOnce({ recordset: [] });

      await repository.getClauses(filters);

      expect(mockRequest.input).toHaveBeenCalledWith('isActive', sql.Bit, true);
      expect(mockRequest.input).toHaveBeenCalledWith('offset', sql.Int, 0);
      expect(mockRequest.input).toHaveBeenCalledWith('limit', sql.Int, 10);
    });

    it('should apply sorting', async () => {
      const filters: ClauseFilters = { page: 1, limit: 10, sort_by: 'clause_code', sort_order: 'ASC' };
      mockRequest.query
        .mockResolvedValueOnce({ recordset: [{ total: 0 }] })
        .mockResolvedValueOnce({ recordset: [] });

      await repository.getClauses(filters);

      expect(mockRequest.query).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY clause_code ASC')
      );
    });
  });

  describe('getClauseById', () => {
    it('should return clause by ID', async () => {
      const mockClause = { clause_id: 1, clause_code: 'CLS001', clause_text: 'Test Clause' };
      mockRequest.query.mockResolvedValueOnce({ recordset: [mockClause] });

      const result = await repository.getClauseById(1);

      expect(result).toEqual(mockClause);
      expect(mockRequest.input).toHaveBeenCalledWith('id', 1);
    });

    it('should return null when clause not found', async () => {
      mockRequest.query.mockResolvedValueOnce({ recordset: [] });

      const result = await repository.getClauseById(999);

      expect(result).toBeNull();
    });
  });

  describe('checkClauseCodeExists', () => {
    it('should return true when clause_code exists', async () => {
      mockRequest.query.mockResolvedValueOnce({ recordset: [{ count: 1 }] });

      const result = await repository.clauseCodeExists('CLS001');

      expect(result).toBe(true);
      expect(mockRequest.input).toHaveBeenCalledWith('clauseCode', sql.VarChar(50), 'CLS001');
    });

    it('should return false when clause_code does not exist', async () => {
      mockRequest.query.mockResolvedValueOnce({ recordset: [{ count: 0 }] });

      const result = await repository.clauseCodeExists('NONEXISTENT');

      expect(result).toBe(false);
    });

    it('should exclude current clause when updating', async () => {
      mockRequest.query.mockResolvedValueOnce({ recordset: [{ count: 0 }] });

      const result = await repository.clauseCodeExists('CLS001', 1);

      expect(result).toBe(false);
      expect(mockRequest.input).toHaveBeenCalledWith('clauseCode', sql.VarChar(50), 'CLS001');
      expect(mockRequest.input).toHaveBeenCalledWith('excludeClauseId', sql.BigInt, 1);
    });
  });

  describe('createClause', () => {
    const validDto: CreateClauseDto = {
      clause_code: 'CLS001',
      clause_text: 'Test Clause',
      is_active: true
    };

    it('should create clause successfully', async () => {
      mockRequest.query.mockResolvedValueOnce({ recordset: [{ clause_id: 1 }] });

      const result = await repository.createClause(
        validDto.clause_code,
        validDto.clause_text,
        validDto.is_active ?? true,
        'admin',
        validDto.clause_category
      );

      expect(result).toBe(1);
      expect(mockRequest.input).toHaveBeenCalledWith('clauseCode', sql.VarChar(20), 'CLS001');
      expect(mockRequest.input).toHaveBeenCalledWith('clauseText', sql.NVarChar(sql.MAX), 'Test Clause');
      expect(mockRequest.input).toHaveBeenCalledWith('isActive', sql.Bit, true);
      expect(mockRequest.input).toHaveBeenCalledWith('createdBy', sql.VarChar(50), 'admin');
    });
  });

  describe('updateClause', () => {
    const validDto: UpdateClauseDto = {
      clause_text: 'Updated Clause Text'
    };

    it('should update clause successfully', async () => {
      mockRequest.query.mockResolvedValueOnce({ rowsAffected: [1] });

      await repository.updateClause(
        1,
        validDto.clause_code,
        validDto.clause_text,
        validDto.is_active,
        'admin'
      );

      expect(mockRequest.input).toHaveBeenCalledWith('clauseText', sql.NVarChar(sql.MAX), 'Updated Clause Text');
      expect(mockRequest.input).toHaveBeenCalledWith('updatedBy', sql.VarChar(50), 'admin');
      expect(mockRequest.input).toHaveBeenCalledWith('clauseId', sql.BigInt, 1);
    });
  });

  describe('deleteClause', () => {
    it('should delete clause successfully', async () => {
      mockRequest.query.mockResolvedValueOnce({ rowsAffected: [1] });

      await repository.deleteClause(1);

      expect(mockRequest.input).toHaveBeenCalledWith('clauseId', sql.BigInt, 1);
    });
  });
});
