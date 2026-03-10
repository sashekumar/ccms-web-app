import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { validateRequest } from './validator.middleware';
import { ResponseUtil } from '../utils/response.util';

// Mock dependencies
jest.mock('../utils/response.util');

describe('validateRequest Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockRequest = {
      body: {},
      method: 'POST',
      path: '/api/test',
    };
    
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    
    mockNext = jest.fn();
  });

  describe('Valid requests', () => {
    it('should call next() for valid request body', () => {
      const schema = Joi.object({
        name: Joi.string().required(),
        email: Joi.string().email().required(),
      });

      mockRequest.body = {
        name: 'John Doe',
        email: 'john@example.com',
      };

      const middleware = validateRequest(schema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(ResponseUtil.validationError).not.toHaveBeenCalled();
    });

    it('should call next() when all fields are valid', () => {
      const schema = Joi.object({
        username: Joi.string().min(3).required(),
        password: Joi.string().min(8).required(),
        age: Joi.number().min(18),
      });

      mockRequest.body = {
        username: 'testuser',
        password: 'password123',
        age: 25,
      };

      const middleware = validateRequest(schema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(ResponseUtil.validationError).not.toHaveBeenCalled();
    });

    it('should allow optional fields to be omitted', () => {
      const schema = Joi.object({
        name: Joi.string().required(),
        nickname: Joi.string().optional(),
      });

      mockRequest.body = {
        name: 'John',
      };

      const middleware = validateRequest(schema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('Invalid requests', () => {
    it('should return validation error for missing required field', () => {
      const schema = Joi.object({
        name: Joi.string().required(),
      });

      mockRequest.body = {};

      const middleware = validateRequest(schema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(ResponseUtil.validationError).toHaveBeenCalledWith(
        mockResponse,
        expect.arrayContaining([expect.stringContaining('name')])
      );
    });

    it('should return validation error for invalid email format', () => {
      const schema = Joi.object({
        email: Joi.string().email().required(),
      });

      mockRequest.body = {
        email: 'invalid-email',
      };

      const middleware = validateRequest(schema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(ResponseUtil.validationError).toHaveBeenCalledWith(
        mockResponse,
        expect.arrayContaining([expect.stringContaining('email')])
      );
    });

    it('should return all validation errors when abortEarly is false', () => {
      const schema = Joi.object({
        name: Joi.string().required(),
        email: Joi.string().email().required(),
        age: Joi.number().min(18).required(),
      });

      mockRequest.body = {
        email: 'invalid',
        age: 15,
      };

      const middleware = validateRequest(schema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(ResponseUtil.validationError).toHaveBeenCalledWith(
        mockResponse,
        expect.any(Array)
      );
      
      const errors = (ResponseUtil.validationError as jest.Mock).mock.calls[0][1];
      expect(errors.length).toBeGreaterThan(1);
    });

    it('should return validation error for string length violation', () => {
      const schema = Joi.object({
        username: Joi.string().min(5).required(),
      });

      mockRequest.body = {
        username: 'abc',
      };

      const middleware = validateRequest(schema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(ResponseUtil.validationError).toHaveBeenCalled();
    });

    it('should return validation error for number range violation', () => {
      const schema = Joi.object({
        age: Joi.number().min(0).max(120).required(),
      });

      mockRequest.body = {
        age: 150,
      };

      const middleware = validateRequest(schema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(ResponseUtil.validationError).toHaveBeenCalled();
    });

    it('should return validation error for invalid data type', () => {
      const schema = Joi.object({
        age: Joi.number().required(),
      });

      mockRequest.body = {
        age: 'not-a-number',
      };

      const middleware = validateRequest(schema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(ResponseUtil.validationError).toHaveBeenCalled();
    });

    it('should handle array validation errors', () => {
      const schema = Joi.object({
        tags: Joi.array().items(Joi.string()).min(1).required(),
      });

      mockRequest.body = {
        tags: [],
      };

      const middleware = validateRequest(schema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(ResponseUtil.validationError).toHaveBeenCalled();
    });

    it('should handle nested object validation', () => {
      const schema = Joi.object({
        user: Joi.object({
          name: Joi.string().required(),
          email: Joi.string().email().required(),
        }).required(),
      });

      mockRequest.body = {
        user: {
          name: 'John',
        },
      };

      const middleware = validateRequest(schema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(ResponseUtil.validationError).toHaveBeenCalled();
    });
  });

  describe('Edge cases', () => {
    it('should handle empty request body', () => {
      const schema = Joi.object({
        name: Joi.string().required(),
      });

      mockRequest.body = {};

      const middleware = validateRequest(schema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(ResponseUtil.validationError).toHaveBeenCalled();
    });

    it('should allow empty body when schema allows it', () => {
      const schema = Joi.object({}).allow({});

      mockRequest.body = {};

      const middleware = validateRequest(schema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle null values appropriately', () => {
      const schema = Joi.object({
        optional: Joi.string().allow(null).optional(),
      });

      mockRequest.body = {
        optional: null,
      };

      const middleware = validateRequest(schema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should validate custom patterns', () => {
      const schema = Joi.object({
        phone: Joi.string().pattern(/^\d{3}-\d{3}-\d{4}$/).required(),
      });

      mockRequest.body = {
        phone: '123-456-7890',
      };

      const middleware = validateRequest(schema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should reject invalid custom patterns', () => {
      const schema = Joi.object({
        phone: Joi.string().pattern(/^\d{3}-\d{3}-\d{4}$/).required(),
      });

      mockRequest.body = {
        phone: '1234567890',
      };

      const middleware = validateRequest(schema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(ResponseUtil.validationError).toHaveBeenCalled();
    });

    it('should not call next after validation error', () => {
      const schema = Joi.object({
        email: Joi.string().email().required(),
      });

      mockRequest.body = {
        email: 'invalid',
      };

      const middleware = validateRequest(schema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(ResponseUtil.validationError).toHaveBeenCalled();
    });
  });

  describe('Complex schemas', () => {
    it('should validate complex schema with multiple rules', () => {
      const schema = Joi.object({
        username: Joi.string().alphanum().min(3).max(30).required(),
        password: Joi.string().min(8).required(),
        email: Joi.string().email().required(),
        birthYear: Joi.number().integer().min(1900).max(2023),
      });

      mockRequest.body = {
        username: 'validuser',
        password: 'validpass123',
        email: 'user@example.com',
        birthYear: 1990,
      };

      const middleware = validateRequest(schema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle schema with conditional validation', () => {
      const schema = Joi.object({
        hasAddress: Joi.boolean().required(),
        address: Joi.when('hasAddress', {
          is: true,
          then: Joi.string().required(),
          otherwise: Joi.string().optional(),
        }),
      });

      mockRequest.body = {
        hasAddress: true,
        address: '123 Main St',
      };

      const middleware = validateRequest(schema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });
});
