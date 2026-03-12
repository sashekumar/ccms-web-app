import { Router } from 'express';
import router from './lookups.routes';

describe('LookupsRoutes', () => {
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
      expect(routes.length).toBe(20);
    });
  });

  describe('Lookup Categories Routes', () => {
    it('should register POST /categories/list', () => {
      const route = router.stack.find(
        (layer: any) => layer.route?.path === '/categories/list' && layer.route?.methods?.post
      );
      expect(route).toBeDefined();
    });

    it('should register POST /categories/get', () => {
      const route = router.stack.find(
        (layer: any) => layer.route?.path === '/categories/get' && layer.route?.methods?.post
      );
      expect(route).toBeDefined();
    });

    it('should register POST /categories/create', () => {
      const route = router.stack.find(
        (layer: any) => layer.route?.path === '/categories/create' && layer.route?.methods?.post
      );
      expect(route).toBeDefined();
    });

    it('should register PUT /categories/update', () => {
      const route = router.stack.find(
        (layer: any) => layer.route?.path === '/categories/update' && layer.route?.methods?.put
      );
      expect(route).toBeDefined();
    });

    it('should register POST /categories/delete', () => {
      const route = router.stack.find(
        (layer: any) => layer.route?.path === '/categories/delete' && layer.route?.methods?.post
      );
      expect(route).toBeDefined();
    });

    it('should register POST /categories/check-code', () => {
      const route = router.stack.find(
        (layer: any) => layer.route?.path === '/categories/check-code' && layer.route?.methods?.post
      );
      expect(route).toBeDefined();
    });
  });

  describe('Lookups Routes', () => {
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

    it('should register POST /by-category', () => {
      const route = router.stack.find(
        (layer: any) => layer.route?.path === '/by-category' && layer.route?.methods?.post
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

    it('should register POST /check-code', () => {
      const route = router.stack.find(
        (layer: any) => layer.route?.path === '/check-code' && layer.route?.methods?.post
      );
      expect(route).toBeDefined();
    });
  });

  describe('Lookup Metadata Routes', () => {
    it('should register POST /metadata/list', () => {
      const route = router.stack.find(
        (layer: any) => layer.route?.path === '/metadata/list' && layer.route?.methods?.post
      );
      expect(route).toBeDefined();
    });

    it('should register POST /metadata/get', () => {
      const route = router.stack.find(
        (layer: any) => layer.route?.path === '/metadata/get' && layer.route?.methods?.post
      );
      expect(route).toBeDefined();
    });

    it('should register POST /metadata/create', () => {
      const route = router.stack.find(
        (layer: any) => layer.route?.path === '/metadata/create' && layer.route?.methods?.post
      );
      expect(route).toBeDefined();
    });

    it('should register PUT /metadata/update', () => {
      const route = router.stack.find(
        (layer: any) => layer.route?.path === '/metadata/update' && layer.route?.methods?.put
      );
      expect(route).toBeDefined();
    });

    it('should register POST /metadata/delete', () => {
      const route = router.stack.find(
        (layer: any) => layer.route?.path === '/metadata/delete' && layer.route?.methods?.post
      );
      expect(route).toBeDefined();
    });

    it('should register POST /metadata/check-key', () => {
      const route = router.stack.find(
        (layer: any) => layer.route?.path === '/metadata/check-key' && layer.route?.methods?.post
      );
      expect(route).toBeDefined();
    });
  });

  describe('Middleware Verification', () => {
    it('should have permission middleware on category management routes', () => {
      const route = router.stack.find(
        (layer: any) => layer.route?.path === '/categories/create'
      );
      expect(route).toBeDefined();
      expect(route?.route?.stack.length).toBeGreaterThan(1);
    });

    it('should have permission middleware on lookup management routes', () => {
      const route = router.stack.find(
        (layer: any) => layer.route?.path === '/create'
      );
      expect(route).toBeDefined();
      expect(route?.route?.stack.length).toBeGreaterThan(1);
    });

    it('should have permission middleware on metadata management routes', () => {
      const route = router.stack.find(
        (layer: any) => layer.route?.path === '/metadata/create'
      );
      expect(route).toBeDefined();
      expect(route?.route?.stack.length).toBeGreaterThan(1);
    });
  });
});
