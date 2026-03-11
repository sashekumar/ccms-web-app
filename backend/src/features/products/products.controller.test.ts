import express, { Express } from 'express';
import request from 'supertest';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

// Mock ProductsService
jest.mock('./products.service');

describe('ProductsController', () => {
  let app: Express;
  let mockService: jest.Mocked<ProductsService>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create Express app
    app = express();
    app.use(express.json());

    // Mock service
    mockService = {
      getProducts: jest.fn(),
      getProductById: jest.fn(),
      checkPlanCodeExists: jest.fn(),
      createProduct: jest.fn(),
      updateProduct: jest.fn(),
      activateProduct: jest.fn(),
      deactivateProduct: jest.fn(),
    } as any;

    (ProductsService as jest.MockedClass<typeof ProductsService>).mockImplementation(() => mockService);

    // Setup routes
    const controller = new ProductsController();
    app.post('/api/products/list', controller.getProducts);
    app.post('/api/products/get', controller.getProductById);
    app.post('/api/products/check-code', controller.checkPlanCode);
    app.post('/api/products/create', (req, res) => {
      (req as any).user = { userId: 1 };
      controller.createProduct(req, res);
    });
    app.post('/api/products/update', (req, res) => {
      (req as any).user = { userId: 1 };
      controller.updateProduct(req, res);
    });
    app.post('/api/products/:productId/activate', (req, res) => {
      (req as any).user = { userId: 1 };
      controller.activateProduct(req, res);
    });
    app.post('/api/products/:productId/deactivate', (req, res) => {
      (req as any).user = { userId: 1 };
      controller.deactivateProduct(req, res);
    });
  });

  describe('POST /api/products/list', () => {
    it('should return paginated products', async () => {
      const mockResult = {
        data: [
          { product_id: 1, plan_code: 'PLN001', plan_name: 'Test Plan', is_active: true }
        ],
        pagination: { total: 1, page: 1, limit: 10, totalPages: 1 }
      };

      mockService.getProducts.mockResolvedValue(mockResult);

      const response = await request(app)
        .post('/api/products/list')
        .send({ page: 1, limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockResult);
    }, 30000);

    it('should apply search filter', async () => {
      const mockResult = { data: [], pagination: { total: 0, page: 1, limit: 10, totalPages: 0 } };
      mockService.getProducts.mockResolvedValue(mockResult);

      await request(app)
        .post('/api/products/list')
        .send({ search: 'Test', page: 1, limit: 10 });

      expect(mockService.getProducts).toHaveBeenCalledWith(
        expect.objectContaining({ search: 'Test' })
      );
    });

    it('should apply insurer_name filter', async () => {
      const mockResult = { data: [], pagination: { total: 0, page: 1, limit: 10, totalPages: 0 } };
      mockService.getProducts.mockResolvedValue(mockResult);

      await request(app)
        .post('/api/products/list')
        .send({ insurer_name: 'Test Insurer', page: 1, limit: 10 });

      expect(mockService.getProducts).toHaveBeenCalledWith(
        expect.objectContaining({ insurer_name: 'Test Insurer' })
      );
    });

    it('should handle errors', async () => {
      mockService.getProducts.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/api/products/list')
        .send({ page: 1, limit: 10 });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/products/get', () => {
    it('should return product by ID', async () => {
      const mockProduct = {
        product_id: 1,
        plan_code: 'PLN001',
        plan_name: 'Test Plan',
        is_active: true
      };

      mockService.getProductById.mockResolvedValue(mockProduct);

      const response = await request(app)
        .post('/api/products/get')
        .send({ product_id: 1 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockProduct);
    });

    it('should return 404 when product not found', async () => {
      mockService.getProductById.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/products/get')
        .send({ product_id: 999 });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should validate product_id', async () => {
      const response = await request(app)
        .post('/api/products/get')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/products/check-code', () => {
    it('should check if plan_code exists', async () => {
      mockService.checkPlanCodeExists.mockResolvedValue(false);

      const response = await request(app)
        .post('/api/products/check-code')
        .send({ plan_code: 'PLN001' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.exists).toBe(false);
    });

    it('should validate plan_code', async () => {
      const response = await request(app)
        .post('/api/products/check-code')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/products/create', () => {
    const validDto = {
      plan_code: 'PLN001',
      plan_name: 'Test Plan',
      is_active: true
    };

    it('should create product successfully', async () => {
      mockService.createProduct.mockResolvedValue(1);

      const response = await request(app)
        .post('/api/products/create')
        .send(validDto);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.product_id).toBe(1);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/products/create')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should handle duplicate plan_code', async () => {
      mockService.checkPlanCodeExists.mockResolvedValue(true);

      const response = await request(app)
        .post('/api/products/create')
        .send(validDto);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/products/update', () => {
    it('should update product successfully', async () => {
      mockService.getProductById.mockResolvedValue({ product_id: 1, plan_code: 'PLN001', plan_name: 'Test Plan', is_active: true } as any);
      mockService.updateProduct.mockResolvedValue(true);

      const response = await request(app)
        .post('/api/products/update')
        .send({
          product_id: 1,
          plan_name: 'Updated Plan Name'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should validate product_id', async () => {
      const response = await request(app)
        .post('/api/products/update')
        .send({ plan_name: 'Updated Name' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/products/activate', () => {
    it('should activate product successfully', async () => {
      mockService.activateProduct.mockResolvedValue(true);

      const response = await request(app)
        .post('/api/products/1/activate');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should validate product_id', async () => {
      const response = await request(app)
        .post('/api/products/invalid/activate');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/products/deactivate', () => {
    it('should deactivate product successfully', async () => {
      mockService.deactivateProduct.mockResolvedValue(true);

      const response = await request(app)
        .post('/api/products/1/deactivate');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should validate product_id', async () => {
      const response = await request(app)
        .post('/api/products/invalid/deactivate');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });
});
