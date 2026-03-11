import { Router } from 'express';
import router from './hospitals.routes';

describe('HospitalsRoutes', () => {
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
      expect(routes.length).toBe(26);
    });
  });

  describe('Hospital Management Routes', () => {
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

    it('should register POST /check-code', () => {
      const route = router.stack.find(
        (layer: any) => layer.route?.path === '/check-code' && layer.route?.methods?.post
      );
      expect(route).toBeDefined();
    });
  });

  describe('Hospital Addresses Routes', () => {
    it('should register POST /:hospitalId/addresses/list', () => {
      const route = router.stack.find(
        (layer: any) => layer.route?.path === '/:hospitalId/addresses/list' && layer.route?.methods?.post
      );
      expect(route).toBeDefined();
    });

    it('should register POST /:hospitalId/addresses', () => {
      const route = router.stack.find(
        (layer: any) => layer.route?.path === '/:hospitalId/addresses' && layer.route?.methods?.post
      );
      expect(route).toBeDefined();
    });

    it('should register PUT /:hospitalId/addresses/:addressId', () => {
      const route = router.stack.find(
        (layer: any) => layer.route?.path === '/:hospitalId/addresses/:addressId' && layer.route?.methods?.put
      );
      expect(route).toBeDefined();
    });

    it('should register DELETE /:hospitalId/addresses/:addressId', () => {
      const route = router.stack.find(
        (layer: any) => layer.route?.path === '/:hospitalId/addresses/:addressId' && layer.route?.methods?.delete
      );
      expect(route).toBeDefined();
    });
  });

  describe('Hospital Codes Routes', () => {
    it('should register POST /:hospitalId/codes/list', () => {
      const route = router.stack.find(
        (layer: any) => layer.route?.path === '/:hospitalId/codes/list' && layer.route?.methods?.post
      );
      expect(route).toBeDefined();
    });

    it('should register POST /:hospitalId/codes', () => {
      const route = router.stack.find(
        (layer: any) => layer.route?.path === '/:hospitalId/codes' && layer.route?.methods?.post
      );
      expect(route).toBeDefined();
    });

    it('should register PUT /:hospitalId/codes/:codeId', () => {
      const route = router.stack.find(
        (layer: any) => layer.route?.path === '/:hospitalId/codes/:codeId' && layer.route?.methods?.put
      );
      expect(route).toBeDefined();
    });

    it('should register DELETE /:hospitalId/codes/:codeId', () => {
      const route = router.stack.find(
        (layer: any) => layer.route?.path === '/:hospitalId/codes/:codeId' && layer.route?.methods?.delete
      );
      expect(route).toBeDefined();
    });
  });

  describe('Hospital Staff Routes', () => {
    it('should register POST /:hospitalId/staff/list', () => {
      const route = router.stack.find(
        (layer: any) => layer.route?.path === '/:hospitalId/staff/list' && layer.route?.methods?.post
      );
      expect(route).toBeDefined();
    });

    it('should register POST /:hospitalId/staff', () => {
      const route = router.stack.find(
        (layer: any) => layer.route?.path === '/:hospitalId/staff' && layer.route?.methods?.post
      );
      expect(route).toBeDefined();
    });

    it('should register PUT /:hospitalId/staff/:staffId', () => {
      const route = router.stack.find(
        (layer: any) => layer.route?.path === '/:hospitalId/staff/:staffId' && layer.route?.methods?.put
      );
      expect(route).toBeDefined();
    });

    it('should register DELETE /:hospitalId/staff/:staffId', () => {
      const route = router.stack.find(
        (layer: any) => layer.route?.path === '/:hospitalId/staff/:staffId' && layer.route?.methods?.delete
      );
      expect(route).toBeDefined();
    });
  });

  describe('Staff Contacts Routes', () => {
    it('should register POST /:hospitalId/staff/:staffId/contacts/list', () => {
      const route = router.stack.find(
        (layer: any) => layer.route?.path === '/:hospitalId/staff/:staffId/contacts/list' && layer.route?.methods?.post
      );
      expect(route).toBeDefined();
    });

    it('should register POST /:hospitalId/staff/:staffId/contacts', () => {
      const route = router.stack.find(
        (layer: any) => layer.route?.path === '/:hospitalId/staff/:staffId/contacts' && layer.route?.methods?.post
      );
      expect(route).toBeDefined();
    });

    it('should register PUT /:hospitalId/staff/:staffId/contacts/:contactId', () => {
      const route = router.stack.find(
        (layer: any) => layer.route?.path === '/:hospitalId/staff/:staffId/contacts/:contactId' && layer.route?.methods?.put
      );
      expect(route).toBeDefined();
    });

    it('should register DELETE /:hospitalId/staff/:staffId/contacts/:contactId', () => {
      const route = router.stack.find(
        (layer: any) => layer.route?.path === '/:hospitalId/staff/:staffId/contacts/:contactId' && layer.route?.methods?.delete
      );
      expect(route).toBeDefined();
    });
  });

  describe('Fee Schedules Routes', () => {
    it('should register POST /:hospitalId/fees/list', () => {
      const route = router.stack.find(
        (layer: any) => layer.route?.path === '/:hospitalId/fees/list' && layer.route?.methods?.post
      );
      expect(route).toBeDefined();
    });

    it('should register POST /:hospitalId/fees', () => {
      const route = router.stack.find(
        (layer: any) => layer.route?.path === '/:hospitalId/fees' && layer.route?.methods?.post
      );
      expect(route).toBeDefined();
    });

    it('should register PUT /:hospitalId/fees/:feeId', () => {
      const route = router.stack.find(
        (layer: any) => layer.route?.path === '/:hospitalId/fees/:feeId' && layer.route?.methods?.put
      );
      expect(route).toBeDefined();
    });

    it('should register DELETE /:hospitalId/fees/:feeId', () => {
      const route = router.stack.find(
        (layer: any) => layer.route?.path === '/:hospitalId/fees/:feeId' && layer.route?.methods?.delete
      );
      expect(route).toBeDefined();
    });
  });
});
