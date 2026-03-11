import express, { Express } from 'express';
import request from 'supertest';
import { ClausesController } from './clauses.controller';
import { ClausesService } from './clauses.service';

// Mock ClausesService
jest.mock('./clauses.service');

describe('ClausesController', () => {
  let app: Express;
  let mockService: jest.Mocked<ClausesService>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create Express app
    app = express();
    app.use(express.json());

    // Mock service
    mockService = {
      getClauses: jest.fn(),
      getClauseById: jest.fn(),
      createClause: jest.fn(),
      updateClause: jest.fn(),
      deleteClause: jest.fn(),
    } as any;

    (ClausesService as jest.MockedClass<typeof ClausesService>).mockImplementation(() => mockService);

    // Setup routes
    const controller = new ClausesController();
    app.post('/api/master/clauses/list', controller.getClauses);
    app.post('/api/master/clauses/get', controller.getClauseById);
    app.post('/api/master/clauses/create', (req, res, next) => {
      (req as any).user = { userId: 1 };
      controller.createClause(req, res);
    });
    app.post('/api/master/clauses/update', (req, res, next) => {
      (req as any).user = { userId: 1 };
      controller.updateClause(req, res);
    });
    app.post('/api/master/clauses/delete', controller.deleteClause);
  });

  describe('POST /api/master/clauses/list', () => {
    it('should return paginated clauses', async () => {
      const mockResult = {
        clauses: [
          { clause_id: 1, clause_code: 'CLS001', clause_text: 'Test Clause', is_active: true }
        ],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1
      };

      mockService.getClauses.mockResolvedValue(mockResult);

      const response = await request(app)
        .post('/api/master/clauses/list')
        .send({ page: 1, limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockResult);
    }, 10000);

    it('should apply search filter', async () => {
      mockService.getClauses.mockResolvedValue({ clauses: [], total: 0, page: 1, limit: 10, totalPages: 0 });

      await request(app)
        .post('/api/master/clauses/list')
        .send({ search: 'Test', page: 1, limit: 10 });

      expect(mockService.getClauses).toHaveBeenCalledWith(
        expect.objectContaining({ search: 'Test' })
      );
    });

    it('should apply is_active filter', async () => {
      mockService.getClauses.mockResolvedValue({ clauses: [], total: 0, page: 1, limit: 10, totalPages: 0 });

      await request(app)
        .post('/api/master/clauses/list')
        .send({ is_active: true, page: 1, limit: 10 });

      expect(mockService.getClauses).toHaveBeenCalledWith(
        expect.objectContaining({ is_active: true })
      );
    });

    it('should handle errors', async () => {
      mockService.getClauses.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/api/master/clauses/list')
        .send({ page: 1, limit: 10 });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/master/clauses/get', () => {
    it('should return clause by ID', async () => {
      const mockClause = {
        clause_id: 1,
        clause_code: 'CLS001',
        clause_text: 'Test Clause',
        is_active: true
      };

      mockService.getClauseById.mockResolvedValue(mockClause);

      const response = await request(app)
        .post('/api/master/clauses/get')
        .send({ clause_id: 1 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockClause);
    });

    it('should return 404 when clause not found', async () => {
      mockService.getClauseById.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/master/clauses/get')
        .send({ clause_id: 999 });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should validate clause_id', async () => {
      const response = await request(app)
        .post('/api/master/clauses/get')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/master/clauses/create', () => {
    const validDto = {
      clause_code: 'CLS001',
      clause_text: 'Test Clause',
      is_active: true
    };

    it('should create clause successfully', async () => {
      mockService.createClause.mockResolvedValue(1);

      const response = await request(app)
        .post('/api/master/clauses/create')
        .send(validDto);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.clause_id).toBe(1);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/master/clauses/create')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should handle duplicate clause_code', async () => {
      mockService.createClause.mockRejectedValue(new Error('Clause code already exists'));

      const response = await request(app)
        .post('/api/master/clauses/create')
        .send(validDto);

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/master/clauses/update', () => {
    it('should update clause successfully', async () => {
      mockService.updateClause.mockResolvedValue(undefined);

      const response = await request(app)
        .post('/api/master/clauses/update')
        .send({
          clause_id: 1,
          clause_text: 'Updated Clause Text'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should validate clause_id', async () => {
      const response = await request(app)
        .post('/api/master/clauses/update')
        .send({ clause_text: 'Updated Text' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/master/clauses/delete', () => {
    it('should delete clause successfully', async () => {
      mockService.deleteClause.mockResolvedValue(undefined);

      const response = await request(app)
        .post('/api/master/clauses/delete')
        .send({ clause_id: 1 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should validate clause_id', async () => {
      const response = await request(app)
        .post('/api/master/clauses/delete')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });
});
