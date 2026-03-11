import { Router } from 'express';
import router from './permissions.routes';

describe('PermissionsRoutes', () => {
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
      expect(routes.length).toBe(33);
    });
  });

  describe('Permission Check Routes', () => {
    it('should register GET /check', () => {
      const route = router.stack.find(
        (layer: any) => layer.route?.path === '/check' && layer.route?.methods?.get
      );
      expect(route).toBeDefined();
    });

    it('should register GET /user', () => {
      const route = router.stack.find(
        (layer: any) => layer.route?.path === '/user' && layer.route?.methods?.get
      );
      expect(route).toBeDefined();
    });

    it('should register GET /user/:userId', () => {
      const route = router.stack.find(
        (layer: any) => layer.route?.path === '/user/:userId' && layer.route?.methods?.get
      );
      expect(route).toBeDefined();
    });
  });

  describe('Role Assignment Routes', () => {
    it('should register POST /assign-role', () => {
      const route = router.stack.find(
        (layer: any) => layer.route?.path === '/assign-role' && layer.route?.methods?.post
      );
      expect(route).toBeDefined();
    });

    it('should register DELETE /detach-role/:userId/:roleId', () => {
      const route = router.stack.find(
        (layer: any) => layer.route?.path === '/detach-role/:userId/:roleId' && layer.route?.methods?.delete
      );
      expect(route).toBeDefined();
    });

    it('should register GET /user/:userId/roles', () => {
      const route = router.stack.find(
        (layer: any) => layer.route?.path === '/user/:userId/roles' && layer.route?.methods?.get
      );
      expect(route).toBeDefined();
    });
  });

  describe('Permission Grant/Revoke Routes', () => {
    it('should register POST /grant', () => {
      const route = router.stack.find(
        (layer: any) => layer.route?.path === '/grant' && layer.route?.methods?.post
      );
      expect(route).toBeDefined();
    });

    it('should register POST /revoke', () => {
      const route = router.stack.find(
        (layer: any) => layer.route?.path === '/revoke' && layer.route?.methods?.post
      );
      expect(route).toBeDefined();
    });

    it('should register POST /clear-cache', () => {
      const route = router.stack.find(
        (layer: any) => layer.route?.path === '/clear-cache' && layer.route?.methods?.post
      );
      expect(route).toBeDefined();
    });
  });

  describe('Role Management Routes', () => {
    it('should register POST /roles/list', () => {
      const route = router.stack.find(
        (layer: any) => layer.route?.path === '/roles/list' && layer.route?.methods?.post
      );
      expect(route).toBeDefined();
    });

    it('should register POST /roles/get', () => {
      const route = router.stack.find(
        (layer: any) => layer.route?.path === '/roles/get' && layer.route?.methods?.post
      );
      expect(route).toBeDefined();
    });

    it('should register POST /roles/permissions', () => {
      const route = router.stack.find(
        (layer: any) => layer.route?.path === '/roles/permissions' && layer.route?.methods?.post
      );
      expect(route).toBeDefined();
    });

    it('should register POST /roles/permissions-matrix', () => {
      const route = router.stack.find(
        (layer: any) => layer.route?.path === '/roles/permissions-matrix' && layer.route?.methods?.post
      );
      expect(route).toBeDefined();
    });

    it('should register POST /roles/create', () => {
      const route = router.stack.find(
        (layer: any) => layer.route?.path === '/roles/create' && layer.route?.methods?.post
      );
      expect(route).toBeDefined();
    });

    it('should register POST /roles/update', () => {
      const route = router.stack.find(
        (layer: any) => layer.route?.path === '/roles/update' && layer.route?.methods?.post
      );
      expect(route).toBeDefined();
    });

    it('should register POST /roles/delete', () => {
      const route = router.stack.find(
        (layer: any) => layer.route?.path === '/roles/delete' && layer.route?.methods?.post
      );
      expect(route).toBeDefined();
    });
  });

  describe('Module Management Routes', () => {
    it('should register POST /modules/list', () => {
      const route = router.stack.find(
        (layer: any) => layer.route?.path === '/modules/list' && layer.route?.methods?.post
      );
      expect(route).toBeDefined();
    });

    it('should register POST /modules/create', () => {
      const route = router.stack.find(
        (layer: any) => layer.route?.path === '/modules/create' && layer.route?.methods?.post
      );
      expect(route).toBeDefined();
    });

    it('should register POST /modules/update', () => {
      const route = router.stack.find(
        (layer: any) => layer.route?.path === '/modules/update' && layer.route?.methods?.post
      );
      expect(route).toBeDefined();
    });

    it('should register POST /modules/delete', () => {
      const route = router.stack.find(
        (layer: any) => layer.route?.path === '/modules/delete' && layer.route?.methods?.post
      );
      expect(route).toBeDefined();
    });
  });

  describe('Action Management Routes', () => {
    it('should register POST /actions/list', () => {
      const route = router.stack.find(
        (layer: any) => layer.route?.path === '/actions/list' && layer.route?.methods?.post
      );
      expect(route).toBeDefined();
    });

    it('should register POST /actions/create', () => {
      const route = router.stack.find(
        (layer: any) => layer.route?.path === '/actions/create' && layer.route?.methods?.post
      );
      expect(route).toBeDefined();
    });

    it('should register POST /actions/update', () => {
      const route = router.stack.find(
        (layer: any) => layer.route?.path === '/actions/update' && layer.route?.methods?.post
      );
      expect(route).toBeDefined();
    });

    it('should register POST /actions/delete', () => {
      const route = router.stack.find(
        (layer: any) => layer.route?.path === '/actions/delete' && layer.route?.methods?.post
      );
      expect(route).toBeDefined();
    });
  });

  describe('Module-Action Management Routes', () => {
    it('should register POST /module-actions/list', () => {
      const route = router.stack.find(
        (layer: any) => layer.route?.path === '/module-actions/list' && layer.route?.methods?.post
      );
      expect(route).toBeDefined();
    });

    it('should register POST /module-actions/create', () => {
      const route = router.stack.find(
        (layer: any) => layer.route?.path === '/module-actions/create' && layer.route?.methods?.post
      );
      expect(route).toBeDefined();
    });

    it('should register POST /module-actions/update', () => {
      const route = router.stack.find(
        (layer: any) => layer.route?.path === '/module-actions/update' && layer.route?.methods?.post
      );
      expect(route).toBeDefined();
    });

    it('should register POST /module-actions/delete', () => {
      const route = router.stack.find(
        (layer: any) => layer.route?.path === '/module-actions/delete' && layer.route?.methods?.post
      );
      expect(route).toBeDefined();
    });
  });

  describe('Category Management Routes', () => {
    it('should register GET /categories', () => {
      const route = router.stack.find(
        (layer: any) => layer.route?.path === '/categories' && layer.route?.methods?.get
      );
      expect(route).toBeDefined();
    });

    it('should register GET /categories/:categoryId', () => {
      const route = router.stack.find(
        (layer: any) => layer.route?.path === '/categories/:categoryId' && layer.route?.methods?.get
      );
      expect(route).toBeDefined();
    });

    it('should register POST /categories', () => {
      const route = router.stack.find(
        (layer: any) => layer.route?.path === '/categories' && layer.route?.methods?.post
      );
      expect(route).toBeDefined();
    });

    it('should register PUT /categories/:categoryId', () => {
      const route = router.stack.find(
        (layer: any) => layer.route?.path === '/categories/:categoryId' && layer.route?.methods?.put
      );
      expect(route).toBeDefined();
    });

    it('should register DELETE /categories/:categoryId', () => {
      const route = router.stack.find(
        (layer: any) => layer.route?.path === '/categories/:categoryId' && layer.route?.methods?.delete
      );
      expect(route).toBeDefined();
    });
  });
});
