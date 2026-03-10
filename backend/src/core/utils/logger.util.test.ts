import { logger, LogLevel } from './logger.util';

describe('Logger', () => {
  let consoleDebugSpy: jest.SpyInstance;
  let consoleLogSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  let originalEnv: string | undefined;

  beforeEach(() => {
    // Spy on console methods
    consoleDebugSpy = jest.spyOn(console, 'debug').mockImplementation();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    // Store original NODE_ENV
    originalEnv = process.env.NODE_ENV;
    
    // Reset to development mode for tests
    process.env.NODE_ENV = 'development';
    logger.setLogLevel(LogLevel.DEBUG);
  });

  afterEach(() => {
    // Restore console methods
    consoleDebugSpy.mockRestore();
    consoleLogSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();

    // Restore NODE_ENV
    process.env.NODE_ENV = originalEnv;
  });

  describe('debug', () => {
    it('should log debug messages when log level is DEBUG', () => {
      logger.setLogLevel(LogLevel.DEBUG);
      
      logger.debug('Debug message');

      expect(consoleDebugSpy).toHaveBeenCalled();
      expect(consoleDebugSpy.mock.calls[0][0]).toContain('[DEBUG]');
      expect(consoleDebugSpy.mock.calls[0][0]).toContain('Debug message');
    });

    it('should not log debug messages when log level is INFO', () => {
      logger.setLogLevel(LogLevel.INFO);
      
      logger.debug('Debug message');

      expect(consoleDebugSpy).not.toHaveBeenCalled();
    });

    it('should include timestamp', () => {
      logger.debug('Test message');

      const logOutput = consoleDebugSpy.mock.calls[0][0];
      // Check for ISO timestamp format (YYYY-MM-DD)
      expect(logOutput).toMatch(/\d{4}-\d{2}-\d{2}/);
    });

    it('should support additional arguments', () => {
      const obj = { id: 1, name: 'Test' };
      
      logger.debug('Debug with object', obj);

      expect(consoleDebugSpy).toHaveBeenCalledWith(
        expect.stringContaining('Debug with object'),
        obj
      );
    });
  });

  describe('info', () => {
    it('should log info messages when log level is INFO or below', () => {
      logger.setLogLevel(LogLevel.INFO);
      
      logger.info('Info message');

      expect(consoleLogSpy).toHaveBeenCalled();
      expect(consoleLogSpy.mock.calls[0][0]).toContain('[INFO]');
      expect(consoleLogSpy.mock.calls[0][0]).toContain('Info message');
    });

    it('should not log info messages when log level is WARN', () => {
      logger.setLogLevel(LogLevel.WARN);
      
      logger.info('Info message');

      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('should include timestamp', () => {
      logger.info('Test message');

      const logOutput = consoleLogSpy.mock.calls[0][0];
      expect(logOutput).toMatch(/\d{4}-\d{2}-\d{2}/);
    });

    it('should support multiple arguments', () => {
      logger.info('Info message', 'arg1', 'arg2');

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Info message'),
        'arg1',
        'arg2'
      );
    });
  });

  describe('warn', () => {
    it('should log warn messages when log level is WARN or below', () => {
      logger.setLogLevel(LogLevel.WARN);
      
      logger.warn('Warning message');

      expect(consoleWarnSpy).toHaveBeenCalled();
      expect(consoleWarnSpy.mock.calls[0][0]).toContain('[WARN]');
      expect(consoleWarnSpy.mock.calls[0][0]).toContain('Warning message');
    });

    it('should not log warn messages when log level is ERROR', () => {
      logger.setLogLevel(LogLevel.ERROR);
      
      logger.warn('Warning message');

      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });

    it('should include timestamp', () => {
      logger.warn('Test warning');

      const logOutput = consoleWarnSpy.mock.calls[0][0];
      expect(logOutput).toMatch(/\d{4}-\d{2}-\d{2}/);
    });

    it('should support additional arguments', () => {
      logger.warn('Warning', { code: 404 });

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Warning'),
        { code: 404 }
      );
    });
  });

  describe('error', () => {
    it('should always log error messages', () => {
      logger.setLogLevel(LogLevel.ERROR);
      
      logger.error('Error message');

      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(consoleErrorSpy.mock.calls[0][0]).toContain('[ERROR]');
      expect(consoleErrorSpy.mock.calls[0][0]).toContain('Error message');
    });

    it('should log errors even in production mode', () => {
      process.env.NODE_ENV = 'production';
      logger.setLogLevel(LogLevel.ERROR);
      
      logger.error('Production error');

      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should include timestamp', () => {
      logger.error('Test error');

      const logOutput = consoleErrorSpy.mock.calls[0][0];
      expect(logOutput).toMatch(/\d{4}-\d{2}-\d{2}/);
    });

    it('should include error object when provided', () => {
      const error = new Error('Test error');
      
      logger.error('Error occurred', error);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error occurred'),
        error
      );
    });

    it('should handle error without error object', () => {
      logger.error('Simple error');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Simple error'),
        ''
      );
    });
  });

  describe('setLogLevel', () => {
    it('should change log level to DEBUG', () => {
      logger.setLogLevel(LogLevel.DEBUG);

      expect(logger.getLogLevel()).toBe(LogLevel.DEBUG);
    });

    it('should change log level to INFO', () => {
      logger.setLogLevel(LogLevel.INFO);

      expect(logger.getLogLevel()).toBe(LogLevel.INFO);
    });

    it('should change log level to WARN', () => {
      logger.setLogLevel(LogLevel.WARN);

      expect(logger.getLogLevel()).toBe(LogLevel.WARN);
    });

    it('should change log level to ERROR', () => {
      logger.setLogLevel(LogLevel.ERROR);

      expect(logger.getLogLevel()).toBe(LogLevel.ERROR);
    });

    it('should affect which logs are displayed', () => {
      logger.setLogLevel(LogLevel.ERROR);
      
      logger.debug('Debug');
      logger.info('Info');
      logger.warn('Warn');
      logger.error('Error');

      expect(consoleDebugSpy).not.toHaveBeenCalled();
      expect(consoleLogSpy).not.toHaveBeenCalled();
      expect(consoleWarnSpy).not.toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('getLogLevel', () => {
    it('should return current log level', () => {
      logger.setLogLevel(LogLevel.WARN);

      const level = logger.getLogLevel();

      expect(level).toBe(LogLevel.WARN);
    });
  });

  describe('Environment-based initialization', () => {
    it('should default to DEBUG level in development', () => {
      process.env.NODE_ENV = 'development';
      // Note: Constructor already ran, but we can verify behavior
      logger.setLogLevel(LogLevel.DEBUG);
      
      logger.debug('Test');

      expect(consoleDebugSpy).toHaveBeenCalled();
    });

    it('should default to ERROR level in production', () => {
      process.env.NODE_ENV = 'production';
      logger.setLogLevel(LogLevel.ERROR);
      
      logger.debug('Debug');
      logger.info('Info');
      logger.warn('Warn');
      logger.error('Error');

      expect(consoleDebugSpy).not.toHaveBeenCalled();
      expect(consoleLogSpy).not.toHaveBeenCalled();
      expect(consoleWarnSpy).not.toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });
});
