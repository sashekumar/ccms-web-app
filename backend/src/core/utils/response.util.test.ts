import { Response } from 'express';
import { ResponseUtil } from './response.util';

describe('ResponseUtil', () => {
  let mockResponse: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    
    mockResponse = {
      status: mockStatus,
      json: mockJson
    };
  });

  describe('success', () => {
    it('should send success response with default status 200', () => {
      const data = { id: 1, name: 'Test' };
      
      ResponseUtil.success(mockResponse as Response, data);

      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data,
        message: undefined
      });
    });

    it('should send success response with custom status', () => {
      const data = { id: 1 };
      
      ResponseUtil.success(mockResponse as Response, data, 'Created', 201);

      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data,
        message: 'Created'
      });
    });

    it('should include message when provided', () => {
      const data = ['item1', 'item2'];
      
      ResponseUtil.success(mockResponse as Response, data, 'Items retrieved successfully');

      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data,
        message: 'Items retrieved successfully'
      });
    });

    it('should handle null data', () => {
      ResponseUtil.success(mockResponse as Response, null);

      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: null,
        message: undefined
      });
    });

    it('should handle array data', () => {
      const data = [1, 2, 3, 4, 5];
      
      ResponseUtil.success(mockResponse as Response, data);

      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data,
        message: undefined
      });
    });
  });

  describe('error', () => {
    it('should send error response with default status 500', () => {
      const message = 'Internal server error';
      
      ResponseUtil.error(mockResponse as Response, message);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message,
        error: undefined
      });
    });

    it('should send error response with custom status', () => {
      const message = 'Bad request';
      
      ResponseUtil.error(mockResponse as Response, message, 400);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message,
        error: undefined
      });
    });

    it('should include detailed error when provided', () => {
      const message = 'Database error';
      const error = 'Connection timeout';
      
      ResponseUtil.error(mockResponse as Response, message, 500, error);

      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message,
        error
      });
    });
  });

  describe('paginated', () => {
    it('should send paginated response', () => {
      const data = [{ id: 1 }, { id: 2 }];
      const page = 2;
      const limit = 10;
      const total = 100;
      
      ResponseUtil.paginated(mockResponse as Response, data, page, limit, total);

      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data,
        pagination: {
          page: 2,
          limit: 10,
          total: 100,
          totalPages: 10
        },
        message: undefined
      });
    });

    it('should calculate totalPages correctly', () => {
      const data = [{ id: 1 }];
      
      ResponseUtil.paginated(mockResponse as Response, data, 1, 10, 25);

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          pagination: expect.objectContaining({
            totalPages: 3
          })
        })
      );
    });

    it('should handle single page (totalPages = 1)', () => {
      const data = [{ id: 1 }];
      
      ResponseUtil.paginated(mockResponse as Response, data, 1, 10, 5);

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          pagination: expect.objectContaining({
            totalPages: 1
          })
        })
      );
    });

    it('should include message when provided', () => {
      const data = [{ id: 1 }];
      
      ResponseUtil.paginated(mockResponse as Response, data, 1, 10, 10, 'Users retrieved');

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Users retrieved'
        })
      );
    });

    it('should handle empty data array', () => {
      ResponseUtil.paginated(mockResponse as Response, [], 1, 10, 0);

      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0
        },
        message: undefined
      });
    });
  });

  describe('validationError', () => {
    it('should send validation error response', () => {
      const errors = ['Username is required', 'Password must be at least 8 characters'];
      
      ResponseUtil.validationError(mockResponse as Response, errors);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: 'Validation failed',
        errors
      });
    });

    it('should handle single error', () => {
      const errors = ['Invalid email format'];
      
      ResponseUtil.validationError(mockResponse as Response, errors);

      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: 'Validation failed',
        errors
      });
    });

    it('should handle empty errors array', () => {
      ResponseUtil.validationError(mockResponse as Response, []);

      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: 'Validation failed',
        errors: []
      });
    });
  });

  describe('unauthorized', () => {
    it('should send unauthorized response with default message', () => {
      ResponseUtil.unauthorized(mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(401);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: 'Unauthorized'
      });
    });

    it('should send unauthorized response with custom message', () => {
      ResponseUtil.unauthorized(mockResponse as Response, 'Invalid token');

      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid token'
      });
    });
  });

  describe('forbidden', () => {
    it('should send forbidden response with default message', () => {
      ResponseUtil.forbidden(mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(403);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: 'Forbidden'
      });
    });

    it('should send forbidden response with custom message', () => {
      ResponseUtil.forbidden(mockResponse as Response, 'Access denied');

      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: 'Access denied'
      });
    });
  });

  describe('notFound', () => {
    it('should send not found response with default message', () => {
      ResponseUtil.notFound(mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: 'Resource not found'
      });
    });

    it('should send not found response with custom message', () => {
      ResponseUtil.notFound(mockResponse as Response, 'User not found');

      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: 'User not found'
      });
    });
  });

  describe('conflict', () => {
    it('should send conflict response', () => {
      const message = 'Username already exists';
      
      ResponseUtil.conflict(mockResponse as Response, message);

      expect(mockStatus).toHaveBeenCalledWith(409);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message
      });
    });
  });
});
