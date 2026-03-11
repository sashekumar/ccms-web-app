import { BanksService } from './banks.service';
import { BanksRepository } from './banks.repository';
import { CreateBankDto, UpdateBankDto, BankFilters } from './banks.types';

// Mock dependencies
jest.mock('./banks.repository');

describe('BanksService', () => {
  let service: BanksService;
  let mockRepository: jest.Mocked<BanksRepository>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock BanksRepository
    mockRepository = {
      getBanks: jest.fn(),
      getBankById: jest.fn(),
      bankCodeExists: jest.fn(),
      createBank: jest.fn(),
      updateBank: jest.fn(),
      deleteBank: jest.fn(),
    } as any;

    (BanksRepository as jest.MockedClass<typeof BanksRepository>).mockImplementation(() => mockRepository);

    service = new BanksService();
  });

  describe('getBanks', () => {
    it('should return paginated banks', async () => {
      const filters: BankFilters = { page: 1, limit: 10 };
      const mockResult = {
        banks: [
          { bank_id: 1, bank_code: 'BNK001', bank_name: 'Test Bank', is_active: true }
        ],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1
      };

      mockRepository.getBanks.mockResolvedValue(mockResult);

      const result = await service.getBanks(filters);

      expect(result).toEqual(mockResult);
      expect(mockRepository.getBanks).toHaveBeenCalledWith(filters);
    });
  });

  describe('getBankById', () => {
    it('should return bank by ID', async () => {
      const mockBank = {
        bank_id: 1,
        bank_code: 'BNK001',
        bank_name: 'Test Bank',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
        created_by: 'admin',
        updated_by: null
      };

      mockRepository.getBankById.mockResolvedValue(mockBank);

      const result = await service.getBankById(1);

      expect(result).toEqual(mockBank);
      expect(mockRepository.getBankById).toHaveBeenCalledWith(1);
    });

    it('should return null when bank not found', async () => {
      mockRepository.getBankById.mockResolvedValue(null);

      const result = await service.getBankById(999);

      expect(result).toBeNull();
    });
  });

  describe('createBank', () => {
    const validDto: CreateBankDto = {
      bank_code: 'BNK001',
      bank_name: 'Test Bank',
      is_active: true
    };

    it('should create bank successfully', async () => {
      mockRepository.bankCodeExists.mockResolvedValue(false);
      mockRepository.createBank.mockResolvedValue(1);

      const result = await service.createBank(validDto, 'admin');

      expect(result).toBe(1);
      expect(mockRepository.bankCodeExists).toHaveBeenCalledWith('BNK001');
      expect(mockRepository.createBank).toHaveBeenCalledWith('BNK001', 'Test Bank', true, 'admin');
    });

    it('should validate bank_code length', async () => {
      const invalidDto = { ...validDto, bank_code: 'A' };

      await expect(service.createBank(invalidDto, 'admin'))
        .rejects
        .toThrow('Bank code must be between 2 and 50 characters');
    });

    it('should validate bank_name length', async () => {
      const invalidDto = { ...validDto, bank_name: 'A' };

      await expect(service.createBank(invalidDto, 'admin'))
        .rejects
        .toThrow('Bank name must be between 2 and 255 characters');
    });

    it('should check for duplicate bank_code', async () => {
      mockRepository.bankCodeExists.mockResolvedValue(true);

      await expect(service.createBank(validDto, 'admin'))
        .rejects
        .toThrow('Bank code already exists');

      expect(mockRepository.createBank).not.toHaveBeenCalled();
    });
  });

  describe('updateBank', () => {
    const validDto: UpdateBankDto = {
      bank_name: 'Updated Bank Name'
    };

    it('should update bank successfully', async () => {
      mockRepository.getBankById.mockResolvedValue({ bank_id: 1, bank_code: 'BNK001', bank_name: 'Test Bank', is_active: true, created_by: 'admin' } as any);
      mockRepository.updateBank.mockResolvedValue(undefined);

      await service.updateBank(1, validDto, 'admin');

      expect(mockRepository.updateBank).toHaveBeenCalledWith(1, undefined, 'Updated Bank Name', undefined, 'admin');
    });

    it('should validate bank_code length if provided', async () => {
      mockRepository.getBankById.mockResolvedValue({ bank_id: 1, bank_code: 'BNK001', bank_name: 'Test Bank', is_active: true, created_by: 'admin' } as any);
      const invalidDto = { bank_code: 'A' };

      await expect(service.updateBank(1, invalidDto, 'admin'))
        .rejects
        .toThrow('Bank code must be between 2 and 50 characters');
    });

    it('should validate bank_name length if provided', async () => {
      mockRepository.getBankById.mockResolvedValue({ bank_id: 1, bank_code: 'BNK001', bank_name: 'Test Bank', is_active: true, created_by: 'admin' } as any);
      const invalidDto = { bank_name: 'A' };

      await expect(service.updateBank(1, invalidDto, 'admin'))
        .rejects
        .toThrow('Bank name must be between 2 and 255 characters');
    });
  });

  describe('deleteBank', () => {
    it('should delete bank successfully', async () => {
      mockRepository.getBankById.mockResolvedValue({ bank_id: 1, bank_code: 'BNK001', bank_name: 'Test Bank', is_active: true, created_by: 'admin' } as any);
      mockRepository.deleteBank.mockResolvedValue(undefined);

      await service.deleteBank(1);

      expect(mockRepository.deleteBank).toHaveBeenCalledWith(1);
    });
  });
});
