import { Request, Response, NextFunction } from 'express';
import { errorHandler } from './error.middleware';
import { ResponseUtil } from '../utils/response.util';
import { logger } from '../utils/logger.util';

// Mock dependencies
jest.mock('../utils/response.util');
jest.mock('../utils/logger.util');

describe('errorHandler Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let originalNodeEnv: string | undefined;

  beforeEach(() => {
    jest.clearAllMocks();
    
    originalNodeEnv = process.env.NODE_ENV;
    
    mockRequest = {
      method: 'GET',
      path: '/api/test',
    };
    
    mockResponse = {
      statusCode: 200,
    };
    
    mockNext = jest.fn();
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  it('should handle error with default 500 status code', () => {
    const error = new Error('Test error');
    
    errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

    expect(logger.error).toHaveBeenCalledWith('Error:', error);
    expect(ResponseUtil.error).toHaveBeenCalledWith(
      mockResponse,
      'Test error',
      500,
      undefined
    );
  });

  it('should use existing status code if not 200', () => {
    const error = new Error('Validation error');
    mockResponse.statusCode = 400;
    
    errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

    expect(ResponseUtil.error).toHaveBeenCalledWith(
      mockResponse,
      'Validation error',
      400,
      undefined
    );
  });

  it('should use 500 status code when response status is 200', () => {
    const error = new Error('Server error');
    mockResponse.statusCode = 200;
    
    errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

    expect(ResponseUtil.error).toHaveBeenCalledWith(
      mockResponse,
      'Server error',
      500,
      undefined
    );
  });

  it('should include stack trace in development environment', () => {
    process.env.NODE_ENV = 'development';
    const error = new Error('Dev error');
    
    errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

    expect(ResponseUtil.error).toHaveBeenCalledWith(
      mockResponse,
      'Dev error',
      500,
      error.stack
    );
  });

  it('should not include stack trace in production environment', () => {
    process.env.NODE_ENV = 'production';
    const error = new Error('Prod error');
    
    errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

    expect(ResponseUtil.error).toHaveBeenCalledWith(
      mockResponse,
      'Prod error',
      500,
      undefined
    );
  });

  it('should handle error with custom status code 404', () => {
    const error = new Error('Not found');
    mockResponse.statusCode = 404;
    
    errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

    expect(ResponseUtil.error).toHaveBeenCalledWith(
      mockResponse,
      'Not found',
      404,
      undefined
    );
  });

  it('should handle error with custom status code 403', () => {
    const error = new Error('Forbidden');
    mockResponse.statusCode = 403;
    
    errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

    expect(ResponseUtil.error).toHaveBeenCalledWith(
      mockResponse,
      'Forbidden',
      403,
      undefined
    );
  });

  it('should handle error without message', () => {
    const error = new Error();
    
    errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

    expect(ResponseUtil.error).toHaveBeenCalledWith(
      mockResponse,
      'Internal server error',
      500,
      undefined
    );
  });

  it('should handle TypeError', () => {
    const error = new TypeError('Type error');
    mockResponse.statusCode = 400;
    
    errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

    expect(logger.error).toHaveBeenCalledWith('Error:', error);
    expect(ResponseUtil.error).toHaveBeenCalledWith(
      mockResponse,
      'Type error',
      400,
      undefined
    );
  });

  it('should handle ReferenceError', () => {
    const error = new ReferenceError('Reference error');
    
    errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

    expect(ResponseUtil.error).toHaveBeenCalledWith(
      mockResponse,
      'Reference error',
      500,
      undefined
    );
  });

  it('should handle custom error objects', () => {
    class CustomError extends Error {
      constructor(message: string) {
        super(message);
        this.name = 'CustomError';
      }
    }
    
    const error = new CustomError('Custom error message');
    
    errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

    expect(ResponseUtil.error).toHaveBeenCalledWith(
      mockResponse,
      'Custom error message',
      500,
      undefined
    );
  });

  it('should include stack trace with full error details in development', () => {
    process.env.NODE_ENV = 'development';
    const error = new Error('Detailed error');
    const originalStack = error.stack;
    
    errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

    expect(ResponseUtil.error).toHaveBeenCalledWith(
      mockResponse,
      'Detailed error',
      500,
      originalStack
    );
  });
});
