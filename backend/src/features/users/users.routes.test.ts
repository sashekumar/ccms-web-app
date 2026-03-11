import { Router } from 'express';
import router from './users.routes';

describe('UsersRoutes', () => {
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
      expect(routes.length).toBe(6);
    });
  });

  describe('User Management Routes', () => {
    it('should register POST /list', () => {
      const route = router.stack.find(
        (layer: any) => layer.route?.path === '/list' && layer.route?.methods?.post
      );
      expect(route).toBeDefined();
    });

    it('should register POST /check-username', () => {
      const route = router.stack.find(
        (layer: any) => layer.route?.path === '/check-username' && layer.route?.methods?.post
      );
      expect(route).toBeDefined();
    });

    it('should register GET /:userId', () => {
      const route = router.stack.find(
        (layer: any) => layer.route?.path === '/:userId' && layer.route?.methods?.get
      );
      expect(route).toBeDefined();
    });

    it('should register POST /', () => {
      const route = router.stack.find(
        (layer: any) => layer.route?.path === '/' && layer.route?.methods?.post
      );
      expect(route).toBeDefined();
    });

    it('should register PUT /:userId', () => {
      const route = router.stack.find(
        (layer: any) => layer.route?.path === '/:userId' && layer.route?.methods?.put
      );
      expect(route).toBeDefined();
    });

    it('should register DELETE /:userId', () => {
      const route = router.stack.find(
        (layer: any) => layer.route?.path === '/:userId' && layer.route?.methods?.delete
      );
      expect(route).toBeDefined();
    });

    it('should have permission middleware on POST /list', () => {
      const route = router.stack.find(
        (layer: any) => layer.route?.path === '/list'
      );
      expect(route).toBeDefined();
      expect(route?.route?.stack.length).toBeGreaterThan(1);
    });

    it('should have permission middleware on GET /:userId', () => {
      const route = router.stack.find(
        (layer: any) => layer.route?.path === '/:userId' && layer.route?.methods?.get
      );
      expect(route).toBeDefined();
      expect(route?.route?.stack.length).toBeGreaterThan(1);
    });

    it('should have permission middleware on POST /', () => {
      const route = router.stack.find(
        (layer: any) => layer.route?.path === '/' && layer.route?.methods?.post
      );
      expect(route).toBeDefined();
      expect(route?.route?.stack.length).toBeGreaterThan(1);
    });

    it('should have permission middleware on PUT /:userId', () => {
      const route = router.stack.find(
        (layer: any) => layer.route?.path === '/:userId' && layer.route?.methods?.put
      );
      expect(route).toBeDefined();
      expect(route?.route?.stack.length).toBeGreaterThan(1);
    });

    it('should have permission middleware on DELETE /:userId', () => {
      const route = router.stack.find(
        (layer: any) => layer.route?.path === '/:userId' && layer.route?.methods?.delete
      );
      expect(route).toBeDefined();
      expect(route?.route?.stack.length).toBeGreaterThan(1);
    });
  });
});
