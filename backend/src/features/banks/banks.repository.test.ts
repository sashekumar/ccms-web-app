import { BanksRepository } from './banks.repository';
import { CreateBankDto, UpdateBankDto, BankFilters } from './banks.types';
import { connectionManager } from '../../core/database/connection-manager';
import sql from 'mssql';

// Mock the database service
jest.mock('../../core/database/connection-manager');

describe('BanksRepository', () => {
  let repository: BanksRepository;
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

    repository = new BanksRepository();
  });

  describe('getBanks', () => {
    it('should return paginated banks', async () => {
      const filters: BankFilters = { page: 1, limit: 10 };
      const mockCountResult = { recordset: [{ total: 1 }] };
      const mockBanksResult = {
        recordset: [
          { bank_id: 1, bank_code: 'BNK001', bank_name: 'Test Bank', is_active: true }
        ]
      };

      mockRequest.query
        .mockResolvedValueOnce(mockCountResult)
        .mockResolvedValueOnce(mockBanksResult);

      const result = await repository.getBanks(filters);

      expect(result.banks).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(1);
    });

    it('should apply search filter', async () => {
      const filters: BankFilters = { page: 1, limit: 10, search: 'Test' };
      mockRequest.query
        .mockResolvedValueOnce({ recordset: [{ total: 0 }] })
        .mockResolvedValueOnce({ recordset: [] });

      await repository.getBanks(filters);

      expect(mockRequest.input).toHaveBeenCalledWith('search', sql.NVarChar(200), '%Test%');
    });

    it('should apply is_active filter', async () => {
      const filters: BankFilters = { page: 1, limit: 10, is_active: true };
      mockRequest.query
        .mockResolvedValueOnce({ recordset: [{ total: 0 }] })
        .mockResolvedValueOnce({ recordset: [] });

      await repository.getBanks(filters);

      expect(mockRequest.input).toHaveBeenCalledWith('isActive', sql.Bit, true);
    });

    it('should apply sorting', async () => {
      const filters: BankFilters = { page: 1, limit: 1040, sort_by: 'bank_name', sort_order: 'ASC' };
      mockRequest.query
        .mockResolvedValueOnce({ recordset: [{ total: 0 }] })
        .mockResolvedValueOnce({ recordset: [] });

      await repository.getBanks(filters);

      expect(mockRequest.input).toHaveBeenCalledWith('offset', sql.Int, 0);
      expect(mockRequest.input).toHaveBeenCalledWith('limit', sql.Int, 1040);
    });
  });

  describe('getBankById', () => {
    it('should return bank by ID', async () => {
      const mockBank = { bank_id: 1, bank_code: 'BNK001', bank_name: 'Test Bank' };
      mockRequest.query.mockResolvedValueOnce({ recordset: [mockBank] });

      const result = await repository.getBankById(1);

      expect(result).toEqual(mockBank);
      expect(mockRequest.input).toHaveBeenCalledWith('id', 1);
    });

    it('should return null when bank not found', async () => {
      mockRequest.query.mockResolvedValueOnce({ recordset: [] });

      const result = await repository.getBankById(999);

      expect(result).toBeNull();
    });
  });

  describe('checkBankCodeExists', () => {
    it('should return true when bank_code exists', async () => {
      mockRequest.query.mockResolvedValueOnce({ recordset: [{ count: 1 }] });

      const result = await repository.bankCodeExists('BNK001');

      expect(result).toBe(true);
      expect(mockRequest.input).toHaveBeenCalledWith('bankCode', sql.VarChar(50), 'BNK001');
    });

    it('should return false when bank_code does not exist', async () => {
      mockRequest.query.mockResolvedValueOnce({ recordset: [{ count: 0 }] });

      const result = await repository.bankCodeExists('NONEXISTENT');

      expect(result).toBe(false);
    });

    it('should exclude current bank when updating', async () => {
      mockRequest.query.mockResolvedValueOnce({ recordset: [{ count: 0 }] });

      const result = await repository.bankCodeExists('BNK001', 1);

      expect(result).toBe(false);
      expect(mockRequest.input).toHaveBeenCalledWith('bankCode', sql.VarChar(50), 'BNK001');
      expect(mockRequest.input).toHaveBeenCalledWith('excludeBankId', sql.BigInt, 1);
    });
  });

  describe('createBank', () => {
    const validDto: CreateBankDto = {
      bank_code: 'BNK001',
      bank_name: 'Test Bank',
      is_active: true
    };

    it('should create bank successfully', async () => {
      const mockResult = { recordset: [{ bank_id: 1 }] };
      mockRequest.query.mockResolvedValueOnce(mockResult);

      const result = await repository.createBank(
        validDto.bank_code,
        validDto.bank_name,
        validDto.is_active ?? true,
        'admin'
      );

      expect(result).toBe(1);
      expect(mockRequest.input).toHaveBeenCalledWith('bankCode', sql.VarChar(50), 'BNK001');
      expect(mockRequest.input).toHaveBeenCalledWith('bankName', sql.NVarChar(255), 'Test Bank');
      expect(mockRequest.input).toHaveBeenCalledWith('isActive', sql.Bit, true);
      expect(mockRequest.input).toHaveBeenCalledWith('createdBy', sql.VarChar(50), 'admin');
    });
  });

  describe('updateBank', () => {
    const validDto: UpdateBankDto = {
      bank_name: 'Updated Bank Name'
    };

    it('should update bank successfully', async () => {
      mockRequest.query.mockResolvedValueOnce({ rowsAffected: [1] });

      await repository.updateBank(
        1,
        validDto.bank_code,
        validDto.bank_name,
        validDto.is_active,
        'admin'
      );

      expect(mockRequest.input).toHaveBeenCalledWith('bankId', sql.BigInt, 1);
      expect(mockRequest.input).toHaveBeenCalledWith('bankName', sql.NVarChar(255), 'Updated Bank Name');
      expect(mockRequest.input).toHaveBeenCalledWith('updatedBy', sql.VarChar(50), 'admin');
    });
  });

  describe('deleteBank', () => {
    it('should delete bank successfully', async () => {
      mockRequest.query.mockResolvedValueOnce({ rowsAffected: [1] });

      await repository.deleteBank(1);

      expect(mockRequest.input).toHaveBeenCalledWith('bankId', sql.BigInt, 1);
    });
  });
});
