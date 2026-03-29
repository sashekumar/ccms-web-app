import { Router } from 'express';
import router from './products.routes';

describe('ProductsRoutes', () => {
  describe('Route Registration', () => {
    it('should export a router', () => {
      expect(router).toBeDefined();
      expect(router).toBeInstanceOf(Function);
    });

    it('should have router.stack defined', () => {
      expect(router.stack).toBeDefined();
      expect(Array.isArray(router.stack)).toBe(true);
    });

    it('should have authentication middleware applied to all routes', () => {
      const globalMiddleware = router.stack.filter((layer: any) => !layer.route && layer.name !== '<anonymous>');
      expect(globalMiddleware.length).toBeGreaterThan(0);
    });

    it('should have correct number of routes registered', () => {
      const routes = router.stack.filter((layer: any) => layer.route);
      expect(routes.length).toBe(23);
    });
  });

  describe('Products Management Routes', () => {
    it('should register POST /list', () => {
      const route = router.stack.find(
        (layer: any) => layer.route?.path === '/list' && layer.route?.methods?.post
      );
      expect(route).toBeDefined();
    });

    it('should register POST /get', () => {
      const route = router.stack.find(
        (layer: any) => layer.route?.path === '/get' && layer.route?.methods?.post
      );
      expect(route).toBeDefined();
    });

    it('should register POST /create', () => {
      const route = router.stack.find(
        (layer: any) => layer.route?.path === '/create' && layer.route?.methods?.post
      );
      expect(route).toBeDefined();
    });

    it('should register PUT /update', () => {
      const route = router.stack.find(
        (layer: any) => layer.route?.path === '/update' && layer.route?.methods?.put
      );
      expect(route).toBeDefined();
    });

    it('should register POST /delete', () => {
      const route = router.stack.find(
        (layer: any) => layer.route?.path === '/delete' && layer.route?.methods?.post
      );
      expect(route).toBeDefined();
    });

    it('should register POST /:productId/activate', () => {
      const route = router.stack.find(
        (layer: any) => layer.route?.path === '/:productId/activate' && layer.route?.methods?.post
      );
      expect(route).toBeDefined();
    });

    it('should register POST /:productId/deactivate', () => {
      const route = router.stack.find(
        (layer: any) => layer.route?.path === '/:productId/deactivate' && layer.route?.methods?.post
      );
      expect(route).toBeDefined();
    });

    it('should register POST /check-code', () => {
      const route = router.stack.find(
        (layer: any) => layer.route?.path === '/check-code' && layer.route?.methods?.post
      );
      expect(route).toBeDefined();
    });
  });

  describe('Product Limits Routes', () => {
    it('should register POST /:productId/limits/list', () => {
      const route = router.stack.find(
        (layer: any) => layer.route?.path === '/:productId/limits/list' && layer.route?.methods?.post
      );
      expect(route).toBeDefined();
    });

    it('should register POST /:productId/limits/get', () => {
      const route = router.stack.find(
        (layer: any) => layer.route?.path === '/:productId/limits/get' && layer.route?.methods?.post
      );
      expect(route).toBeDefined();
    });

    it('should register POST /:productId/limits', () => {
      const route = router.stack.find(
        (layer: any) => layer.route?.path === '/:productId/limits' && layer.route?.methods?.post
      );
      expect(route).toBeDefined();
    });

    it('should register PUT /:productId/limits/:limitId', () => {
      const route = router.stack.find(
        (layer: any) => layer.route?.path === '/:productId/limits/:limitId' && layer.route?.methods?.put
      );
      expect(route).toBeDefined();
    });

    it('should register DELETE /:productId/limits/:limitId', () => {
      const route = router.stack.find(
        (layer: any) => layer.route?.path === '/:productId/limits/:limitId' && layer.route?.methods?.delete
      );
      expect(route).toBeDefined();
    });
  });

  describe('Product Copay Routes', () => {
    it('should register POST /:productId/copay/list', () => {
      const route = router.stack.find(
        (layer: any) => layer.route?.path === '/:productId/copay/list' && layer.route?.methods?.post
      );
      expect(route).toBeDefined();
    });

    it('should register POST /:productId/copay/get', () => {
      const route = router.stack.find(
        (layer: any) => layer.route?.path === '/:productId/copay/get' && layer.route?.methods?.post
      );
      expect(route).toBeDefined();
    });

    it('should register POST /:productId/copay', () => {
      const route = router.stack.find(
        (layer: any) => layer.route?.path === '/:productId/copay' && layer.route?.methods?.post
      );
      expect(route).toBeDefined();
    });

    it('should register PUT /:productId/copay/:copayId', () => {
      const route = router.stack.find(
        (layer: any) => layer.route?.path === '/:productId/copay/:copayId' && layer.route?.methods?.put
      );
      expect(route).toBeDefined();
    });

    it('should register DELETE /:productId/copay/:copayId', () => {
      const route = router.stack.find(
        (layer: any) => layer.route?.path === '/:productId/copay/:copayId' && layer.route?.methods?.delete
      );
      expect(route).toBeDefined();
    });
  });

  describe('Middleware Verification', () => {
    it('should have permission middleware on POST /create', () => {
      const route = router.stack.find(
        (layer: any) => layer.route?.path === '/create'
      );
      expect(route).toBeDefined();
      expect(route?.route?.stack.length).toBeGreaterThan(1);
    });

    it('should have permission middleware on PUT /update', () => {
      const route = router.stack.find(
        (layer: any) => layer.route?.path === '/update'
      );
      expect(route).toBeDefined();
      expect(route?.route?.stack.length).toBeGreaterThan(1);
    });

    it('should have permission middleware on POST /delete', () => {
      const route = router.stack.find(
        (layer: any) => layer.route?.path === '/delete'
      );
      expect(route).toBeDefined();
      expect(route?.route?.stack.length).toBeGreaterThan(1);
    });
  });
});
