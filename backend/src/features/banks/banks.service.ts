import { BanksRepository } from './banks.repository';
import { CreateBankDto, UpdateBankDto, BankFilters, PaginatedBanks, Bank } from './banks.types';
import { BaseService } from '../../core/base/base.service';

export class BanksService extends BaseService<Bank> {
  protected repository: BanksRepository;

  constructor() {
    const repository = new BanksRepository();
    super(repository);
    this.repository = repository;
  }

  /**
   * Get paginated list of banks
   */
  public async getBanks(filters: BankFilters): Promise<PaginatedBanks> {
    return await this.repository.getBanks(filters);
  }

  /**
   * Get bank by ID
   */
  public async getBankById(bankId: number): Promise<Bank | null> {
    return await this.repository.getBankById(bankId);
  }

  /**
   * Validate GUID format
   */
  private isValidGuid(guid: string): boolean {
    const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return guidRegex.test(guid);
  }

  /**
   * Create new bank
   */
  public async createBank(dto: CreateBankDto, createdBy: string): Promise<number> {
    // Validate bank code
    if (!dto.bank_code || dto.bank_code.length < 2 || dto.bank_code.length > 50) {
      throw new Error('Bank code must be between 2 and 50 characters');
    }

    // Validate bank name
    if (!dto.bank_name || dto.bank_name.length < 2 || dto.bank_name.length > 255) {
      throw new Error('Bank name must be between 2 and 255 characters');
    }

    // Check if bank code exists
    const exists = await this.repository.bankCodeExists(dto.bank_code);
    if (exists) {
      throw new Error('Bank code already exists');
    }

    // Create bank
    const bankId = await this.repository.createBank(
      dto.bank_code,
      dto.bank_name,
      dto.is_active !== undefined ? dto.is_active : true,
      createdBy
    );

    return bankId;
  }

  /**
   * Update bank
   */
  public async updateBank(bankId: number, dto: UpdateBankDto, updatedBy: string): Promise<void> {
    // Check if bank exists
    const bank = await this.repository.getBankById(bankId);
    if (!bank) {
      throw new Error('Bank not found');
    }

    // Validate bank code if being updated
    if (dto.bank_code !== undefined) {
      if (dto.bank_code.length < 2 || dto.bank_code.length > 50) {
        throw new Error('Bank code must be between 2 and 50 characters');
      }

      // Check if bank code already exists (excluding current bank)
      const exists = await this.repository.bankCodeExists(dto.bank_code, bankId);
      if (exists) {
        throw new Error('Bank code already exists');
      }
    }

    // Validate bank name if being updated
    if (dto.bank_name !== undefined && (dto.bank_name.length < 2 || dto.bank_name.length > 255)) {
      throw new Error('Bank name must be between 2 and 255 characters');
    }

    await this.repository.updateBank(
      bankId,
      dto.bank_code,
      dto.bank_name,
      dto.is_active,
      updatedBy
    );
  }

  /**
   * Delete bank (soft delete)
   */
  public async deleteBank(bankId: number): Promise<void> {
    // Check if bank exists
    const bank = await this.repository.getBankById(bankId);
    if (!bank) {
      throw new Error('Bank not found');
    }

    await this.repository.deleteBank(bankId);
  }

  /**
   * Check if bank code is available
   */
  public async checkBankCodeAvailability(bankCode: string, excludeBankId?: number): Promise<boolean> {
    const exists = await this.repository.bankCodeExists(bankCode, excludeBankId);
    return !exists;
  }
}
