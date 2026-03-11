import { Router } from 'express';
import router from './members.routes';

describe('MembersRoutes', () => {
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
      expect(routes.length).toBe(37);
    });
  });

  describe('Members Routes', () => {
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

    it('should register POST /check-ic', () => {
      const route = router.stack.find(
        (layer: any) => layer.route?.path === '/check-ic' && layer.route?.methods?.post
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

    it('should register POST /:memberId/restore', () => {
      const route = router.stack.find(
        (layer: any) => layer.route?.path === '/:memberId/restore' && layer.route?.methods?.post
      );
      expect(route).toBeDefined();
    });
  });

  describe('Member Addresses Routes', () => {
    it('should register POST /:memberId/addresses/list', () => {
      const route = router.stack.find(
        (layer: any) => layer.route?.path === '/:memberId/addresses/list' && layer.route?.methods?.post
      );
      expect(route).toBeDefined();
    });

    it('should register POST /addresses/get', () => {
      const route = router.stack.find(
        (layer: any) => layer.route?.path === '/addresses/get' && layer.route?.methods?.post
      );
      expect(route).toBeDefined();
    });

    it('should register POST /addresses/create', () => {
      const route = router.stack.find(
        (layer: any) => layer.route?.path === '/addresses/create' && layer.route?.methods?.post
      );
      expect(route).toBeDefined();
    });

    it('should register PUT /addresses/:addressId', () => {
      const route = router.stack.find(
        (layer: any) => layer.route?.path === '/addresses/:addressId' && layer.route?.methods?.put
      );
      expect(route).toBeDefined();
    });

    it('should register DELETE /addresses/:addressId', () => {
      const route = router.stack.find(
        (layer: any) => layer.route?.path === '/addresses/:addressId' && layer.route?.methods?.delete
      );
      expect(route).toBeDefined();
    });

    it('should register POST /addresses/:addressId/set-primary', () => {
      const route = router.stack.find(
        (layer: any) => layer.route?.path === '/addresses/:addressId/set-primary' && layer.route?.methods?.post
      );
      expect(route).toBeDefined();
    });
  });

  describe('Member Contacts Routes', () => {
    it('should register POST /:memberId/contacts/list', () => {
      const route = router.stack.find(
        (layer: any) => layer.route?.path === '/:memberId/contacts/list' && layer.route?.methods?.post
      );
      expect(route).toBeDefined();
    });

    it('should register POST /contacts/get', () => {
      const route = router.stack.find(
        (layer: any) => layer.route?.path === '/contacts/get' && layer.route?.methods?.post
      );
      expect(route).toBeDefined();
    });

    it('should register POST /contacts/create', () => {
      const route = router.stack.find(
        (layer: any) => layer.route?.path === '/contacts/create' && layer.route?.methods?.post
      );
      expect(route).toBeDefined();
    });

    it('should register PUT /contacts/:contactId', () => {
      const route = router.stack.find(
        (layer: any) => layer.route?.path === '/contacts/:contactId' && layer.route?.methods?.put
      );
      expect(route).toBeDefined();
    });

    it('should register DELETE /contacts/:contactId', () => {
      const route = router.stack.find(
        (layer: any) => layer.route?.path === '/contacts/:contactId' && layer.route?.methods?.delete
      );
      expect(route).toBeDefined();
    });

    it('should register POST /contacts/:contactId/set-primary', () => {
      const route = router.stack.find(
        (layer: any) => layer.route?.path === '/contacts/:contactId/set-primary' && layer.route?.methods?.post
      );
      expect(route).toBeDefined();
    });
  });

  describe('Member Policies Routes', () => {
    it('should register POST /:memberId/policies/list', () => {
      const route = router.stack.find(
        (layer: any) => layer.route?.path === '/:memberId/policies/list' && layer.route?.methods?.post
      );
      expect(route).toBeDefined();
    });

    it('should register POST /policies/get', () => {
      const route = router.stack.find(
        (layer: any) => layer.route?.path === '/policies/get' && layer.route?.methods?.post
      );
      expect(route).toBeDefined();
    });

    it('should register POST /policies/check-policy-no', () => {
      const route = router.stack.find(
        (layer: any) => layer.route?.path === '/policies/check-policy-no' && layer.route?.methods?.post
      );
      expect(route).toBeDefined();
    });

    it('should register POST /policies/create', () => {
      const route = router.stack.find(
        (layer: any) => layer.route?.path === '/policies/create' && layer.route?.methods?.post
      );
      expect(route).toBeDefined();
    });

    it('should register PUT /policies/:policyId', () => {
      const route = router.stack.find(
        (layer: any) => layer.route?.path === '/policies/:policyId' && layer.route?.methods?.put
      );
      expect(route).toBeDefined();
    });

    it('should register DELETE /policies/:policyId', () => {
      const route = router.stack.find(
        (layer: any) => layer.route?.path === '/policies/:policyId' && layer.route?.methods?.delete
      );
      expect(route).toBeDefined();
    });
  });

  describe('Member Dependents Routes', () => {
    it('should register POST /:memberId/dependents/list', () => {
      const route = router.stack.find(
        (layer: any) => layer.route?.path === '/:memberId/dependents/list' && layer.route?.methods?.post
      );
      expect(route).toBeDefined();
    });

    it('should register POST /dependents/get', () => {
      const route = router.stack.find(
        (layer: any) => layer.route?.path === '/dependents/get' && layer.route?.methods?.post
      );
      expect(route).toBeDefined();
    });

    it('should register POST /dependents/create', () => {
      const route = router.stack.find(
        (layer: any) => layer.route?.path === '/dependents/create' && layer.route?.methods?.post
      );
      expect(route).toBeDefined();
    });

    it('should register PUT /dependents/:dependentId', () => {
      const route = router.stack.find(
        (layer: any) => layer.route?.path === '/dependents/:dependentId' && layer.route?.methods?.put
      );
      expect(route).toBeDefined();
    });

    it('should register DELETE /dependents/:dependentId', () => {
      const route = router.stack.find(
        (layer: any) => layer.route?.path === '/dependents/:dependentId' && layer.route?.methods?.delete
      );
      expect(route).toBeDefined();
    });

    it('should register POST /dependents/:dependentId/toggle-active', () => {
      const route = router.stack.find(
        (layer: any) => layer.route?.path === '/dependents/:dependentId/toggle-active' && layer.route?.methods?.post
      );
      expect(route).toBeDefined();
    });
  });

  describe('Member PEC Conditions Routes', () => {
    it('should register POST /dependents/:dependentId/pec/list', () => {
      const route = router.stack.find(
        (layer: any) => layer.route?.path === '/dependents/:dependentId/pec/list' && layer.route?.methods?.post
      );
      expect(route).toBeDefined();
    });

    it('should register POST /pec/get', () => {
      const route = router.stack.find(
        (layer: any) => layer.route?.path === '/pec/get' && layer.route?.methods?.post
      );
      expect(route).toBeDefined();
    });

    it('should register POST /pec/create', () => {
      const route = router.stack.find(
        (layer: any) => layer.route?.path === '/pec/create' && layer.route?.methods?.post
      );
      expect(route).toBeDefined();
    });

    it('should register PUT /pec/:pecId', () => {
      const route = router.stack.find(
        (layer: any) => layer.route?.path === '/pec/:pecId' && layer.route?.methods?.put
      );
      expect(route).toBeDefined();
    });

    it('should register DELETE /pec/:pecId', () => {
      const route = router.stack.find(
        (layer: any) => layer.route?.path === '/pec/:pecId' && layer.route?.methods?.delete
      );
      expect(route).toBeDefined();
    });

    it('should register POST /pec/:pecId/toggle-excluded', () => {
      const route = router.stack.find(
        (layer: any) => layer.route?.path === '/pec/:pecId/toggle-excluded' && layer.route?.methods?.post
      );
      expect(route).toBeDefined();
    });
  });
});
