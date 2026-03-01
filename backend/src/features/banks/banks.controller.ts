import { Request, Response } from 'express';
import { BanksService } from './banks.service';
import { CreateBankDto, UpdateBankDto, BankFilters, GetBankRequest } from './banks.types';
import { ResponseUtil } from '../../core/utils/response.util';
import { getErrorMessage } from '../../core/utils/error.util';

export class BanksController {
  private service: BanksService;

  constructor() {
    this.service = new BanksService();
  }

  /**
   * Get paginated list of banks
   * POST /api/master/banks/list
   * Body: { search?, isActive?, page?, limit?, sortBy?, sortOrder? }
   */
  public getBanks = async (req: Request, res: Response): Promise<void> => {
    try {
      // Accept both camelCase and snake_case from frontend
      const filters: BankFilters = {
        search: req.body.search,
        isActive: req.body.isActive ?? req.body.is_active,
        page: req.body.page || 1,
        limit: req.body.limit || 10,
        sortBy: req.body.sortBy ?? req.body.sort_by ?? 'bank_id',
        sortOrder: req.body.sortOrder ?? req.body.sort_order ?? 'DESC'
      };

      const result = await this.service.getBanks(filters);

      ResponseUtil.success(res, result, 'Banks retrieved successfully');
    } catch (error: unknown) {
      ResponseUtil.error(res, 'Error fetching banks', 500, getErrorMessage(error));
    }
  };

  /**
   * Get bank by ID
   * POST /api/master/banks/get
   * Body: { bank_id }
   */
  public getBankById = async (req: Request, res: Response): Promise<void> => {
    try {
      const request: GetBankRequest = req.body;
      const bankId = request.bank_id;

      if (!bankId || isNaN(bankId)) {
        ResponseUtil.error(res, 'Invalid bank ID', 400);
        return;
      }

      const bank = await this.service.getBankById(bankId);

      if (!bank) {
        ResponseUtil.notFound(res, 'Bank not found');
        return;
      }

      ResponseUtil.success(res, bank, 'Bank retrieved successfully');
    } catch (error: unknown) {
      ResponseUtil.error(res, 'Error fetching bank', 500, getErrorMessage(error));
    }
  };

  /**
   * Create new bank
   * POST /api/master/banks/create
   * Body: { bank_code, bank_name, legacy_bank_id?, is_active? }
   */
  public createBank = async (req: Request, res: Response): Promise<void> => {
    try {
      const dto: CreateBankDto = req.body;

      if (!dto.bank_code || !dto.bank_name) {
        ResponseUtil.error(res, 'bank_code and bank_name are required', 400);
        return;
      }

      const bankId = await this.service.createBank(dto);

      ResponseUtil.success(res, { bank_id: bankId }, 'Bank created successfully', 201);
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);
      
      // Check for SQL Server UNIQUE constraint violations
      if (errorMessage.includes('UNIQUE KEY constraint') || errorMessage.includes('duplicate key')) {
        if (errorMessage.includes('bank_code') || errorMessage.includes('59827C')) {
          ResponseUtil.conflict(res, 'Bank code already exists');
        } else if (errorMessage.includes('bank_name')) {
          ResponseUtil.conflict(res, 'Bank name already exists');
        } else {
          ResponseUtil.conflict(res, 'Duplicate value detected');
        }
        return;
      }
      
      if (errorMessage === 'Bank code already exists') {
        ResponseUtil.conflict(res, errorMessage);
        return;
      }

      if (errorMessage.includes('must be')) {
        ResponseUtil.error(res, errorMessage, 400);
        return;
      }

      ResponseUtil.error(res, 'Error creating bank', 500, errorMessage);
    }
  };

  /**
   * Update bank
   * POST /api/master/banks/update
   * Body: { bank_id, bank_code?, bank_name?, is_active? }
   */
  public updateBank = async (req: Request, res: Response): Promise<void> => {
    try {
      const bankId = req.body.bank_id;
      const dto: UpdateBankDto = {
        bank_code: req.body.bank_code,
        bank_name: req.body.bank_name,
        is_active: req.body.is_active
      };

      if (!bankId || isNaN(bankId)) {
        ResponseUtil.error(res, 'Invalid bank ID', 400);
        return;
      }

      await this.service.updateBank(bankId, dto);

      ResponseUtil.success(res, null, 'Bank updated successfully');
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);
      
      if (errorMessage === 'Bank not found') {
        ResponseUtil.notFound(res, errorMessage);
        return;
      }

      // Check for SQL Server UNIQUE constraint violations
      if (errorMessage.includes('UNIQUE KEY constraint') || errorMessage.includes('duplicate key')) {
        if (errorMessage.includes('bank_code') || errorMessage.includes('59827C')) {
          ResponseUtil.conflict(res, 'Bank code already exists');
        } else if (errorMessage.includes('bank_name')) {
          ResponseUtil.conflict(res, 'Bank name already exists');
        } else {
          ResponseUtil.conflict(res, 'Duplicate value detected');
        }
        return;
      }

      if (errorMessage === 'Bank code already exists') {
        ResponseUtil.conflict(res, errorMessage);
        return;
      }

      if (errorMessage.includes('must be')) {
        ResponseUtil.error(res, errorMessage, 400);
        return;
      }

      ResponseUtil.error(res, 'Error updating bank', 500, errorMessage);
    }
  };

  /**
   * Delete bank (soft delete)
   * POST /api/master/banks/delete
   * Body: { bank_id }
   */
  public deleteBank = async (req: Request, res: Response): Promise<void> => {
    try {
      const bankId = req.body.bank_id;

      if (!bankId || isNaN(bankId)) {
        ResponseUtil.error(res, 'Invalid bank ID', 400);
        return;
      }

      await this.service.deleteBank(bankId);

      ResponseUtil.success(res, null, 'Bank deleted successfully');
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);
      
      if (errorMessage === 'Bank not found') {
        ResponseUtil.notFound(res, errorMessage);
        return;
      }

      ResponseUtil.error(res, 'Error deleting bank', 500, errorMessage);
    }
  };

  /**
   * Check bank code availability
   * POST /api/master/banks/check-code
   * Body: { bank_code, exclude_bank_id? }
   */
  public checkBankCode = async (req: Request, res: Response): Promise<void> => {
    try {
      const { bank_code, exclude_bank_id } = req.body;

      const isAvailable = await this.service.checkBankCodeAvailability(bank_code, exclude_bank_id);

      ResponseUtil.success(res, { available: isAvailable }, 'Bank code availability checked');
    } catch (error: unknown) {
      ResponseUtil.error(res, 'Error checking bank code', 500, getErrorMessage(error));
    }
  };
}
