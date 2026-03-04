import { getErrorMessage, isError } from './error.util';

describe('ErrorUtil', () => {
  describe('getErrorMessage', () => {
    it('should extract message from Error instance', () => {
      const error = new Error('Test error message');
      
      const result = getErrorMessage(error);

      expect(result).toBe('Test error message');
    });

    it('should handle string errors', () => {
      const error = 'Simple error string';
      
      const result = getErrorMessage(error);

      expect(result).toBe('Simple error string');
    });

    it('should extract message from object with message property', () => {
      const error = { message: 'Object error message' };
      
      const result = getErrorMessage(error);

      expect(result).toBe('Object error message');
    });

    it('should handle unknown error types', () => {
      const error = { code: 500, status: 'error' };
      
      const result = getErrorMessage(error);

      expect(result).toBe('An unknown error occurred');
    });

    it('should handle null error', () => {
      const result = getErrorMessage(null);

      expect(result).toBe('An unknown error occurred');
    });

    it('should handle undefined error', () => {
      const result = getErrorMessage(undefined);

      expect(result).toBe('An unknown error occurred');
    });

    it('should handle number errors', () => {
      const result = getErrorMessage(404);

      expect(result).toBe('An unknown error occurred');
    });

    it('should handle boolean errors', () => {
      const result = getErrorMessage(false);

      expect(result).toBe('An unknown error occurred');
    });

    it('should convert non-string message to string', () => {
      const error = { message: 123 };
      
      const result = getErrorMessage(error);

      expect(result).toBe('123');
    });

    it('should handle TypeError instances', () => {
      const error = new TypeError('Type error occurred');
      
      const result = getErrorMessage(error);

      expect(result).toBe('Type error occurred');
    });

    it('should handle RangeError instances', () => {
      const error = new RangeError('Range error occurred');
      
      const result = getErrorMessage(error);

      expect(result).toBe('Range error occurred');
    });

    it('should handle custom Error subclasses', () => {
      class CustomError extends Error {
        constructor(message: string) {
          super(message);
          this.name = 'CustomError';
        }
      }
      
      const error = new CustomError('Custom error occurred');
      
      const result = getErrorMessage(error);

      expect(result).toBe('Custom error occurred');
    });
  });

  describe('isError', () => {
    it('should return true for Error instances', () => {
      const error = new Error('Test error');
      
      const result = isError(error);

      expect(result).toBe(true);
    });

    it('should return true for TypeError instances', () => {
      const error = new TypeError('Type error');
      
      const result = isError(error);

      expect(result).toBe(true);
    });

    it('should return true for RangeError instances', () => {
      const error = new RangeError('Range error');
      
      const result = isError(error);

      expect(result).toBe(true);
    });

    it('should return true for custom Error subclasses', () => {
      class CustomError extends Error {}
      const error = new CustomError('Custom error');
      
      const result = isError(error);

      expect(result).toBe(true);
    });

    it('should return false for string errors', () => {
      const result = isError('error string');

      expect(result).toBe(false);
    });

    it('should return false for objects with message property', () => {
      const result = isError({ message: 'error' });

      expect(result).toBe(false);
    });

    it('should return false for null', () => {
      const result = isError(null);

      expect(result).toBe(false);
    });

    it('should return false for undefined', () => {
      const result = isError(undefined);

      expect(result).toBe(false);
    });

    it('should return false for numbers', () => {
      const result = isError(404);

      expect(result).toBe(false);
    });

    it('should return false for boolean', () => {
      const result = isError(true);

      expect(result).toBe(false);
    });
  });
});
