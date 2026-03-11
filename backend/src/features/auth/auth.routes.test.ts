import { Router } from 'express';
import router from './auth.routes';

describe('AuthRoutes', () => {
  describe('Route Registration', () => {
    it('should export a router', () => {
      expect(router).toBeDefined();
      expect(router).toBeInstanceOf(Function);
    });

    it('should have router.stack defined', () => {
      expect(router.stack).toBeDefined();
      expect(Array.isArray(router.stack)).toBe(true);
    });

    it('should have correct number of routes registered', () => {
      const routes = router.stack.filter((layer: any) => layer.route);
      expect(routes.length).toBe(5);
    });
  });

  describe('Public Routes', () => {
    it('should register GET /csrf-token', () => {
      const route = router.stack.find(
        (layer: any) => layer.route?.path === '/csrf-token' && layer.route?.methods?.get
      );
      expect(route).toBeDefined();
    });

    it('should register POST /login', () => {
      const route = router.stack.find(
        (layer: any) => layer.route?.path === '/login' && layer.route?.methods?.post
      );
      expect(route).toBeDefined();
    });

    it('should register POST /refresh', () => {
      const route = router.stack.find(
        (layer: any) => layer.route?.path === '/refresh' && layer.route?.methods?.post
      );
      expect(route).toBeDefined();
    });

    it('should have validation middleware on POST /login', () => {
      const route = router.stack.find(
        (layer: any) => layer.route?.path === '/login'
      );
      expect(route).toBeDefined();
      expect(route?.route?.stack.length).toBeGreaterThan(1); // Has middleware + handler
    });
  });

  describe('Protected Routes', () => {
    it('should register POST /logout', () => {
      const route = router.stack.find(
        (layer: any) => layer.route?.path === '/logout' && layer.route?.methods?.post
      );
      expect(route).toBeDefined();
    });

    it('should register GET /me', () => {
      const route = router.stack.find(
        (layer: any) => layer.route?.path === '/me' && layer.route?.methods?.get
      );
      expect(route).toBeDefined();
    });

    it('should have authentication middleware on POST /logout', () => {
      const route = router.stack.find(
        (layer: any) => layer.route?.path === '/logout'
      );
      expect(route).toBeDefined();
      expect(route?.route?.stack.length).toBeGreaterThan(1); // Has middleware + handler
    });

    it('should have authentication middleware on GET /me', () => {
      const route = router.stack.find(
        (layer: any) => layer.route?.path === '/me'
      );
      expect(route).toBeDefined();
      expect(route?.route?.stack.length).toBeGreaterThan(1); // Has middleware + handler
    });
  });
});
