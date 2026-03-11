import request from 'supertest';
import express, { Express } from 'express';
import { BanksController } from './banks.controller';
import { BanksService } from './banks.service';

// Mock dependencies
jest.mock('./banks.service');

describe('BanksController Integration Tests', () => {
  let app: Express;
  let banksController: BanksController;
  let mockBanksService: jest.Mocked<BanksService>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create Express app
    app = express();
    app.use(express.json());

    // Mock BanksService
    mockBanksService = {
      getBanks: jest.fn(),
      getBankById: jest.fn(),
      createBank: jest.fn(),
      updateBank: jest.fn(),
      deleteBank: jest.fn(),
    } as any;

    (BanksService as jest.MockedClass<typeof BanksService>).mockImplementation(() => mockBanksService);

    // Initialize controller and setup routes
    banksController = new BanksController();
    
    app.post('/api/master/banks/list', banksController.getBanks);
    app.post('/api/master/banks/get', banksController.getBankById);
    app.post('/api/master/banks/create', (req, res) => {
      req.user = { userId: 1, username: 'admin', roles: [] } as any;
      banksController.createBank(req, res);
    });
    app.post('/api/master/banks/update', (req, res) => {
      req.user = { userId: 1, username: 'admin', roles: [] } as any;
      banksController.updateBank(req, res);
    });
    app.post('/api/master/banks/delete', (req, res) => {
      req.user = { userId: 1, username: 'admin', roles: [] } as any;
      banksController.deleteBank(req, res);
    });
  });

  describe('POST /api/master/banks/list', () => {
    const mockBanksResult = {
      banks: [
        { bank_id: 1, bank_code: 'BNK001', bank_name: 'Test Bank 1', is_active: true },
        { bank_id: 2, bank_code: 'BNK002', bank_name: 'Test Bank 2', is_active: true }
      ],
      total: 2,
      page: 1,
      limit: 10,
      totalPages: 1
    };

    it('should return paginated list of banks', async () => {
      mockBanksService.getBanks.mockResolvedValue(mockBanksResult);

      const response = await request(app)
        .post('/api/master/banks/list')
        .send({})
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockBanksResult);
      expect(mockBanksService.getBanks).toHaveBeenCalled();
    }, 10000);

    it('should apply search filter', async () => {
      mockBanksService.getBanks.mockResolvedValue(mockBanksResult);

      await request(app)
        .post('/api/master/banks/list')
        .send({ search: 'Test' })
        .expect(200);

      expect(mockBanksService.getBanks).toHaveBeenCalledWith(
        expect.objectContaining({ search: 'Test' })
      );
    });

    it('should apply is_active filter', async () => {
      mockBanksService.getBanks.mockResolvedValue(mockBanksResult);

      await request(app)
        .post('/api/master/banks/list')
        .send({ is_active: true })
        .expect(200);

      expect(mockBanksService.getBanks).toHaveBeenCalledWith(
        expect.objectContaining({ is_active: true })
      );
    });

    it('should handle errors', async () => {
      mockBanksService.getBanks.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/api/master/banks/list')
        .send({})
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Error fetching banks');
    });
  });

  describe('POST /api/master/banks/get', () => {
    const mockBank = {
      bank_id: 1,
      bank_code: 'BNK001',
      bank_name: 'Test Bank',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: 'admin',
      updated_by: null
    };

    it('should return bank by ID', async () => {
      mockBanksService.getBankById.mockResolvedValue(mockBank);

      const response = await request(app)
        .post('/api/master/banks/get')
        .send({ bank_id: 1 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockBank);
      expect(mockBanksService.getBankById).toHaveBeenCalledWith(1);
    });

    it('should return 404 when bank not found', async () => {
      mockBanksService.getBankById.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/master/banks/get')
        .send({ bank_id: 999 })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not found');
    });

    it('should validate bank_id parameter', async () => {
      const response = await request(app)
        .post('/api/master/banks/get')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid bank ID');
    });
  });

  describe('POST /api/master/banks/create', () => {
    it('should create new bank', async () => {
      mockBanksService.createBank.mockResolvedValue(1);

      const response = await request(app)
        .post('/api/master/banks/create')
        .send({
          bank_code: 'BNK001',
          bank_name: 'Test Bank',
          is_active: true
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.bank_id).toBe(1);
      expect(mockBanksService.createBank).toHaveBeenCalledWith(
        expect.objectContaining({
          bank_code: 'BNK001',
          bank_name: 'Test Bank'
        }),
        '1'
      );
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/master/banks/create')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('required');
    });

    it('should handle duplicate bank code', async () => {
      mockBanksService.createBank.mockRejectedValue(new Error('Bank code already exists'));

      const response = await request(app)
        .post('/api/master/banks/create')
        .send({
          bank_code: 'BNK001',
          bank_name: 'Test Bank'
        });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/master/banks/update', () => {
    it('should update bank', async () => {
      mockBanksService.updateBank.mockResolvedValue(undefined);

      const response = await request(app)
        .post('/api/master/banks/update')
        .send({
          bank_id: 1,
          bank_name: 'Updated Bank Name'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockBanksService.updateBank).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ bank_name: 'Updated Bank Name' }),
        '1'
      );
    });

    it('should validate bank_id', async () => {
      const response = await request(app)
        .post('/api/master/banks/update')
        .send({ bank_name: 'Updated' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid bank ID');
    });
  });

  describe('POST /api/master/banks/delete', () => {
    it('should delete bank', async () => {
      mockBanksService.deleteBank.mockResolvedValue(undefined);

      const response = await request(app)
        .post('/api/master/banks/delete')
        .send({ bank_id: 1 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockBanksService.deleteBank).toHaveBeenCalledWith(1);
    });

    it('should validate bank_id', async () => {
      const response = await request(app)
        .post('/api/master/banks/delete')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});
