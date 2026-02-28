import { Response } from 'express';

/**
 * Standard API response format
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  errors?: string[];
}

/**
 * Paginated response format
 */
export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  message?: string;
}

/**
 * Response Utility
 * Provides consistent response formatting across all controllers
 * Eliminates duplicate response formatting code
 */
export class ResponseUtil {
  /**
   * Send success response
   * 
   * @param res - Express response object
   * @param data - Response data
   * @param message - Optional success message
   * @param statusCode - HTTP status code (default: 200)
   */
  static success<T>(
    res: Response,
    data: T,
    message?: string,
    statusCode: number = 200
  ): Response {
    const response: ApiResponse<T> = {
      success: true,
      data,
      message
    };

    return res.status(statusCode).json(response);
  }

  /**
   * Send error response
   * 
   * @param res - Express response object
   * @param message - Error message
   * @param statusCode - HTTP status code (default: 500)
   * @param error - Optional detailed error information
   */
  static error(
    res: Response,
    message: string,
    statusCode: number = 500,
    error?: string
  ): Response {
    const response: ApiResponse = {
      success: false,
      message,
      error
    };

    return res.status(statusCode).json(response);
  }

  /**
   * Send paginated response
   * 
   * @param res - Express response object
   * @param data - Array of data items
   * @param page - Current page number
   * @param limit - Items per page
   * @param total - Total number of items
   * @param message - Optional success message
   */
  static paginated<T>(
    res: Response,
    data: T[],
    page: number,
    limit: number,
    total: number,
    message?: string
  ): Response {
    const response: PaginatedResponse<T> = {
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      message
    };

    return res.status(200).json(response);
  }

  /**
   * Send validation error response
   * 
   * @param res - Express response object
   * @param errors - Array of validation error messages
   */
  static validationError(
    res: Response,
    errors: string[]
  ): Response {
    const response: ApiResponse = {
      success: false,
      message: 'Validation failed',
      errors
    };

    return res.status(400).json(response);
  }

  /**
   * Send unauthorized response
   * 
   * @param res - Express response object
   * @param message - Optional custom message
   */
  static unauthorized(
    res: Response,
    message: string = 'Unauthorized'
  ): Response {
    const response: ApiResponse = {
      success: false,
      message
    };

    return res.status(401).json(response);
  }

  /**
   * Send forbidden response
   * 
   * @param res - Express response object
   * @param message - Optional custom message
   */
  static forbidden(
    res: Response,
    message: string = 'Forbidden'
  ): Response {
    const response: ApiResponse = {
      success: false,
      message
    };

    return res.status(403).json(response);
  }

  /**
   * Send not found response
   * 
   * @param res - Express response object
   * @param message - Optional custom message
   */
  static notFound(
    res: Response,
    message: string = 'Resource not found'
  ): Response {
    const response: ApiResponse = {
      success: false,
      message
    };

    return res.status(404).json(response);
  }

  /**
   * Send conflict response
   * 
   * @param res - Express response object
   * @param message - Conflict message
   */
  static conflict(
    res: Response,
    message: string
  ): Response {
    const response: ApiResponse = {
      success: false,
      message
    };

    return res.status(409).json(response);
  }
}
