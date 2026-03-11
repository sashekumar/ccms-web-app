import { Request, Response } from 'express';
import { ProductsService } from './products.service';
import { 
  ProductFilters, 
  CreateProductDto, 
  UpdateProductDto, 
  GetProductRequest,
  CheckPlanCodeRequest,
  ActivateProductRequest,
  DeactivateProductRequest
} from './products.types';
import { CreateProductLimitDto, UpdateProductLimitDto, GetProductLimitRequest } from './product-limits.types';
import { CreateProductCopayDto, UpdateProductCopayDto, GetProductCopayRequest } from './product-copay.types';
import { ResponseUtil } from '../../core/utils/response.util';
import { getErrorMessage } from '../../core/utils/error.util';

export class ProductsController {
  private service: ProductsService;

  constructor() {
    this.service = new ProductsService();
  }

  // ============================================================================
  // PRODUCTS
  // ============================================================================

  /**
   * Get paginated list of products
   * POST /api/products/list
   * Body: { search?, insurerName?, isActive?, page?, limit?, sortBy?, sortOrder? }
   */
  public getProducts = async (req: Request, res: Response): Promise<void> => {
    try {
      const filters: ProductFilters = {
        search: req.body.search,
        insurer_name: req.body.insurer_name,
        is_active: req.body.is_active,
        page: req.body.page ?? 1,
        limit: req.body.limit ?? 10,
        sort_by: req.body.sort_by ?? 'product_id',
        sort_order: req.body.sort_order ?? 'DESC'
      };

      const result = await this.service.getProducts(filters);

      ResponseUtil.success(res, result, 'Products retrieved successfully');
    } catch (error: unknown) {
      ResponseUtil.error(res, 'Error fetching products', 500, getErrorMessage(error));
    }
  };

  /**
   * Get product by ID
   * POST /api/products/get
   * Body: { product_id }
   */
  public getProductById = async (req: Request, res: Response): Promise<void> => {
    try {
      const request: GetProductRequest = req.body;
      const productId = request.product_id;

      if (!productId || isNaN(productId)) {
        ResponseUtil.error(res, 'Invalid product ID', 400);
        return;
      }

      const product = await this.service.getProductById(productId);

      if (!product) {
        ResponseUtil.notFound(res, 'Product not found');
        return;
      }

      ResponseUtil.success(res, product, 'Product retrieved successfully');
    } catch (error: unknown) {
      ResponseUtil.error(res, 'Error fetching product', 500, getErrorMessage(error));
    }
  };

  /**
   * Check if plan code exists
   * POST /api/products/check-code
   * Body: { plan_code, product_id? }
   */
  public checkPlanCode = async (req: Request, res: Response): Promise<void> => {
    try {
      const request: CheckPlanCodeRequest = req.body;
      const { plan_code, product_id } = request;

      if (!plan_code) {
        ResponseUtil.error(res, 'Plan code is required', 400);
        return;
      }

      const exists = await this.service.checkPlanCodeExists(plan_code, product_id);

      ResponseUtil.success(
        res,
        { exists, message: exists ? 'Plan code already exists' : 'Plan code is available' },
        'Plan code check completed'
      );
    } catch (error: unknown) {
      ResponseUtil.error(res, 'Error checking plan code', 500, getErrorMessage(error));
    }
  };

  /**
   * Create new product
   * POST /api/products/create
   * Body: { plan_code, plan_name?, insurer_name?, is_active?, legacy_product_id? }
   */
  public createProduct = async (req: Request, res: Response): Promise<void> => {
    try {
      const createdBy = (req as any).user?.userId?.toString();
      const dto: CreateProductDto = req.body;

      // Validate required fields
      if (!dto.plan_code) {
        ResponseUtil.error(res, 'Plan code is required', 400);
        return;
      }

      // Check if plan code already exists
      const exists = await this.service.checkPlanCodeExists(dto.plan_code);
      if (exists) {
        ResponseUtil.error(res, 'Plan code already exists', 400);
        return;
      }

      const productId = await this.service.createProduct(dto, createdBy);

      ResponseUtil.success(res, { product_id: productId }, 'Product created successfully', 201);
    } catch (error: unknown) {
      ResponseUtil.error(res, 'Error creating product', 500, getErrorMessage(error));
    }
  };

  /**
   * Update product
   * PUT /api/products/update
   * Body: { product_id, plan_code?, plan_name?, insurer_name?, is_active?, legacy_product_id? }
   */
  public updateProduct = async (req: Request, res: Response): Promise<void> => {
    try {
      const updatedBy = (req as any).user?.userId?.toString();
      const { product_id, ...dto }: UpdateProductDto & { product_id: number } = req.body;

      if (!product_id || isNaN(product_id)) {
        ResponseUtil.error(res, 'Invalid product ID', 400);
        return;
      }

      // Check if product exists
      const product = await this.service.getProductById(product_id);
      if (!product) {
        ResponseUtil.notFound(res, 'Product not found');
        return;
      }

      // If plan_code is being updated, check if it already exists
      if (dto.plan_code && dto.plan_code !== product.plan_code) {
        const exists = await this.service.checkPlanCodeExists(dto.plan_code, product_id);
        if (exists) {
          ResponseUtil.error(res, 'Plan code already exists', 400);
          return;
        }
      }

      const success = await this.service.updateProduct(product_id, dto, updatedBy);

      if (success) {
        ResponseUtil.success(res, { product_id }, 'Product updated successfully');
      } else {
        ResponseUtil.error(res, 'No changes made', 400);
      }
    } catch (error: unknown) {
      ResponseUtil.error(res, 'Error updating product', 500, getErrorMessage(error));
    }
  };

  /**
   * Delete product (deactivate)
   * POST /api/products/delete
   * Body: { product_id }
   */
  public deleteProduct = async (req: Request, res: Response): Promise<void> => {
    try {
      const { product_id } = req.body;

      if (!product_id || isNaN(product_id)) {
        ResponseUtil.error(res, 'Invalid product ID', 400);
        return;
      }

      const success = await this.service.deactivateProduct(product_id);

      if (success) {
        ResponseUtil.success(res, { product_id }, 'Product deactivated successfully');
      } else {
        ResponseUtil.notFound(res, 'Product not found');
      }
    } catch (error: unknown) {
      ResponseUtil.error(res, 'Error deleting product', 500, getErrorMessage(error));
    }
  };

  /**
   * Activate product
   * POST /api/products/:productId/activate
   * Params: { productId }
   */
  public activateProduct = async (req: Request, res: Response): Promise<void> => {
    try {
      const productId = parseInt(req.params.productId);

      if (isNaN(productId)) {
        ResponseUtil.error(res, 'Invalid product ID', 400);
        return;
      }

      const success = await this.service.activateProduct(productId);

      if (success) {
        ResponseUtil.success(res, { product_id: productId }, 'Product activated successfully');
      } else {
        ResponseUtil.notFound(res, 'Product not found');
      }
    } catch (error: unknown) {
      ResponseUtil.error(res, 'Error activating product', 500, getErrorMessage(error));
    }
  };

  /**
   * Deactivate product
   * POST /api/products/:productId/deactivate
   * Params: { productId }
   */
  public deactivateProduct = async (req: Request, res: Response): Promise<void> => {
    try {
      const productId = parseInt(req.params.productId);

      if (isNaN(productId)) {
        ResponseUtil.error(res, 'Invalid product ID', 400);
        return;
      }

      const success = await this.service.deactivateProduct(productId);

      if (success) {
        ResponseUtil.success(res, { product_id: productId }, 'Product deactivated successfully');
      } else {
        ResponseUtil.notFound(res, 'Product not found');
      }
    } catch (error: unknown) {
      ResponseUtil.error(res, 'Error deactivating product', 500, getErrorMessage(error));
    }
  };

  // ============================================================================
  // PRODUCT LIMITS
  // ============================================================================

  /**
   * Get all limits for a product
   * POST /api/products/:productId/limits/list
   * Params: { productId }
   */
  public getLimits = async (req: Request, res: Response): Promise<void> => {
    try {
      const productId = parseInt(req.params.productId);

      if (isNaN(productId)) {
        ResponseUtil.error(res, 'Invalid product ID', 400);
        return;
      }

      const limits = await this.service.getLimitsByProductId(productId);

      ResponseUtil.success(res, limits, 'Product limits retrieved successfully');
    } catch (error: unknown) {
      ResponseUtil.error(res, 'Error fetching limits', 500, getErrorMessage(error));
    }
  };

  /**
   * Get limit by ID
   * POST /api/products/:productId/limits/get
   * Body: { limit_id }
   */
  public getLimitById = async (req: Request, res: Response): Promise<void> => {
    try {
      const request: GetProductLimitRequest = req.body;
      const limitId = request.limit_id;

      if (!limitId || isNaN(limitId)) {
        ResponseUtil.error(res, 'Invalid limit ID', 400);
        return;
      }

      const limit = await this.service.getLimitById(limitId);

      if (!limit) {
        ResponseUtil.notFound(res, 'Product limit not found');
        return;
      }

      ResponseUtil.success(res, limit, 'Product limit retrieved successfully');
    } catch (error: unknown) {
      ResponseUtil.error(res, 'Error fetching limit', 500, getErrorMessage(error));
    }
  };

  /**
   * Create new product limit
   * POST /api/products/:productId/limits
   * Params: { productId }
   * Body: { limit_type?, limit_amount?, is_active?, legacy_product_limit_id? }
   */
  public createLimit = async (req: Request, res: Response): Promise<void> => {
    try {
      const createdBy = (req as any).user?.userId?.toString();
      const productId = parseInt(req.params.productId);

      if (isNaN(productId)) {
        ResponseUtil.error(res, 'Invalid product ID', 400);
        return;
      }

      const dto: CreateProductLimitDto = {
        ...req.body,
        product_id: productId
      };

      const limitId = await this.service.createLimit(dto, createdBy);

      ResponseUtil.success(res, { limit_id: limitId }, 'Product limit created successfully', 201);
    } catch (error: unknown) {
      ResponseUtil.error(res, 'Error creating limit', 500, getErrorMessage(error));
    }
  };

  /**
   * Update product limit
   * PUT /api/products/:productId/limits/:limitId
   * Params: { productId, limitId }
   * Body: { limit_type?, limit_amount?, is_active? }
   */
  public updateLimit = async (req: Request, res: Response): Promise<void> => {
    try {
      const updatedBy = (req as any).user?.userId?.toString();
      const limitId = parseInt(req.params.limitId);

      if (isNaN(limitId)) {
        ResponseUtil.error(res, 'Invalid limit ID', 400);
        return;
      }

      const dto: UpdateProductLimitDto = req.body;

      const success = await this.service.updateLimit(limitId, dto, updatedBy);

      if (success) {
        ResponseUtil.success(res, { limit_id: limitId }, 'Product limit updated successfully');
      } else {
        ResponseUtil.error(res, 'No changes made or limit not found', 400);
      }
    } catch (error: unknown) {
      ResponseUtil.error(res, 'Error updating limit', 500, getErrorMessage(error));
    }
  };

  /**
   * Delete product limit
   * DELETE /api/products/:productId/limits/:limitId
   * Params: { productId, limitId }
   */
  public deleteLimit = async (req: Request, res: Response): Promise<void> => {
    try {
      const limitId = parseInt(req.params.limitId);

      if (isNaN(limitId)) {
        ResponseUtil.error(res, 'Invalid limit ID', 400);
        return;
      }

      const success = await this.service.deleteLimit(limitId);

      if (success) {
        ResponseUtil.success(res, { limit_id: limitId }, 'Product limit deleted successfully');
      } else {
        ResponseUtil.notFound(res, 'Product limit not found');
      }
    } catch (error: unknown) {
      ResponseUtil.error(res, 'Error deleting limit', 500, getErrorMessage(error));
    }
  };

  // ============================================================================
  // PRODUCT COPAY
  // ============================================================================

  /**
   * Get all copay rules for a product
   * POST /api/products/:productId/copay/list
   * Params: { productId }
   */
  public getCopay = async (req: Request, res: Response): Promise<void> => {
    try {
      const productId = parseInt(req.params.productId);

      if (isNaN(productId)) {
        ResponseUtil.error(res, 'Invalid product ID', 400);
        return;
      }

      const copay = await this.service.getCopayByProductId(productId);

      ResponseUtil.success(res, copay, 'Product copay rules retrieved successfully');
    } catch (error: unknown) {
      ResponseUtil.error(res, 'Error fetching copay rules', 500, getErrorMessage(error));
    }
  };

  /**
   * Get copay by ID
   * POST /api/products/:productId/copay/get
   * Body: { copay_id }
   */
  public getCopayById = async (req: Request, res: Response): Promise<void> => {
    try {
      const request: GetProductCopayRequest = req.body;
      const copayId = request.copay_id;

      if (!copayId || isNaN(copayId)) {
        ResponseUtil.error(res, 'Invalid copay ID', 400);
        return;
      }

      const copay = await this.service.getCopayById(copayId);

      if (!copay) {
        ResponseUtil.notFound(res, 'Product copay rule not found');
        return;
      }

      ResponseUtil.success(res, copay, 'Product copay rule retrieved successfully');
    } catch (error: unknown) {
      ResponseUtil.error(res, 'Error fetching copay rule', 500, getErrorMessage(error));
    }
  };

  /**
   * Create new product copay rule
   * POST /api/products/:productId/copay
   * Params: { productId }
   * Body: { copay_type?, copay_value?, applies_to?, is_active?, legacy_product_copay_id? }
   */
  public createCopay = async (req: Request, res: Response): Promise<void> => {
    try {
      const createdBy = (req as any).user?.userId?.toString();
      const productId = parseInt(req.params.productId);

      if (isNaN(productId)) {
        ResponseUtil.error(res, 'Invalid product ID', 400);
        return;
      }

      const dto: CreateProductCopayDto = {
        ...req.body,
        product_id: productId
      };

      const copayId = await this.service.createCopay(dto, createdBy);

      ResponseUtil.success(res, { copay_id: copayId }, 'Product copay rule created successfully', 201);
    } catch (error: unknown) {
      ResponseUtil.error(res, 'Error creating copay rule', 500, getErrorMessage(error));
    }
  };

  /**
   * Update product copay rule
   * PUT /api/products/:productId/copay/:copayId
   * Params: { productId, copayId }
   * Body: { copay_type?, copay_value?, applies_to?, is_active? }
   */
  public updateCopay = async (req: Request, res: Response): Promise<void> => {
    try {
      const updatedBy = (req as any).user?.userId?.toString();
      const copayId = parseInt(req.params.copayId);

      if (isNaN(copayId)) {
        ResponseUtil.error(res, 'Invalid copay ID', 400);
        return;
      }

      const dto: UpdateProductCopayDto = req.body;

      const success = await this.service.updateCopay(copayId, dto, updatedBy);

      if (success) {
        ResponseUtil.success(res, { copay_id: copayId }, 'Product copay rule updated successfully');
      } else {
        ResponseUtil.error(res, 'No changes made or copay rule not found', 400);
      }
    } catch (error: unknown) {
      ResponseUtil.error(res, 'Error updating copay rule', 500, getErrorMessage(error));
    }
  };

  /**
   * Delete product copay rule
   * DELETE /api/products/:productId/copay/:copayId
   * Params: { productId, copayId }
   */
  public deleteCopay = async (req: Request, res: Response): Promise<void> => {
    try {
      const copayId = parseInt(req.params.copayId);

      if (isNaN(copayId)) {
        ResponseUtil.error(res, 'Invalid copay ID', 400);
        return;
      }

      const success = await this.service.deleteCopay(copayId);

      if (success) {
        ResponseUtil.success(res, { copay_id: copayId }, 'Product copay rule deleted successfully');
      } else {
        ResponseUtil.notFound(res, 'Product copay rule not found');
      }
    } catch (error: unknown) {
      ResponseUtil.error(res, 'Error deleting copay rule', 500, getErrorMessage(error));
    }
  };
}
