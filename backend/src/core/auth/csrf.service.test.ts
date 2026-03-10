import { CsrfService } from './csrf.service';

describe('CsrfService', () => {
  beforeEach(() => {
    // Clear tokens before each test
    (CsrfService as any).tokens.clear();
  });

  afterEach(() => {
    // Restore original TOKEN_EXPIRY if modified
    (CsrfService as any).TOKEN_EXPIRY = 5 * 60 * 1000;
  });

  describe('generateToken', () => {
    it('should generate a valid token', () => {
      const token = CsrfService.generateToken();

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBe(64); // 32 bytes = 64 hex characters
    });

    it('should generate unique tokens', () => {
      const token1 = CsrfService.generateToken();
      const token2 = CsrfService.generateToken();
      const token3 = CsrfService.generateToken();

      expect(token1).not.toBe(token2);
      expect(token2).not.toBe(token3);
      expect(token1).not.toBe(token3);
    });

    it('should store token in tokens map', () => {
      const token = CsrfService.generateToken();
      const tokens = (CsrfService as any).tokens;

      expect(tokens.has(token)).toBe(true);
      expect(tokens.get(token)).toHaveProperty('token', token);
      expect(tokens.get(token)).toHaveProperty('timestamp');
    });

    it('should store current timestamp with token', () => {
      const beforeTime = Date.now();
      const token = CsrfService.generateToken();
      const afterTime = Date.now();
      
      const tokens = (CsrfService as any).tokens;
      const storedToken = tokens.get(token);

      expect(storedToken.timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(storedToken.timestamp).toBeLessThanOrEqual(afterTime);
    });

    it('should cleanup expired tokens when generating new token', () => {
      // Set a very short expiry for testing
      (CsrfService as any).TOKEN_EXPIRY = 100; // 100ms

      const token1 = CsrfService.generateToken();
      
      // Wait for token to expire
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          const token2 = CsrfService.generateToken();
          
          const tokens = (CsrfService as any).tokens;
          expect(tokens.has(token1)).toBe(false); // Expired token cleaned up
          expect(tokens.has(token2)).toBe(true);  // New token exists
          
          resolve();
        }, 150);
      });
    });
  });

  describe('validateToken', () => {
    it('should validate a valid token', () => {
      const token = CsrfService.generateToken();
      const isValid = CsrfService.validateToken(token);

      expect(isValid).toBe(true);
    });

    it('should return false for non-existent token', () => {
      const isValid = CsrfService.validateToken('non-existent-token');

      expect(isValid).toBe(false);
    });

    it('should remove token after successful validation (one-time use)', () => {
      const token = CsrfService.generateToken();
      
      const firstValidation = CsrfService.validateToken(token);
      expect(firstValidation).toBe(true);

      const secondValidation = CsrfService.validateToken(token);
      expect(secondValidation).toBe(false);
    });

    it('should return false for expired token', () => {
      // Set very short expiry
      (CsrfService as any).TOKEN_EXPIRY = 100; // 100ms

      const token = CsrfService.generateToken();

      return new Promise<void>((resolve) => {
        setTimeout(() => {
          const isValid = CsrfService.validateToken(token);
          expect(isValid).toBe(false);
          resolve();
        }, 150);
      });
    });

    it('should remove expired token after validation attempt', () => {
      // Set very short expiry
      (CsrfService as any).TOKEN_EXPIRY = 100; // 100ms

      const token = CsrfService.generateToken();

      return new Promise<void>((resolve) => {
        setTimeout(() => {
          CsrfService.validateToken(token);
          
          const tokens = (CsrfService as any).tokens;
          expect(tokens.has(token)).toBe(false);
          resolve();
        }, 150);
      });
    });

    it('should handle empty string token', () => {
      const isValid = CsrfService.validateToken('');

      expect(isValid).toBe(false);
    });

    it('should handle null/undefined token gracefully', () => {
      const isValidNull = CsrfService.validateToken(null as any);
      const isValidUndefined = CsrfService.validateToken(undefined as any);

      expect(isValidNull).toBe(false);
      expect(isValidUndefined).toBe(false);
    });

    it('should validate multiple tokens independently', () => {
      const token1 = CsrfService.generateToken();
      const token2 = CsrfService.generateToken();
      const token3 = CsrfService.generateToken();

      const isValid1 = CsrfService.validateToken(token1);
      expect(isValid1).toBe(true);

      const isValid2 = CsrfService.validateToken(token2);
      expect(isValid2).toBe(true);

      // token1 should now be invalid (already used)
      const isValid1Again = CsrfService.validateToken(token1);
      expect(isValid1Again).toBe(false);

      // token3 should still be valid
      const isValid3 = CsrfService.validateToken(token3);
      expect(isValid3).toBe(true);
    });
  });

  describe('Token Expiry', () => {
    it('should use 5 minute expiry by default', () => {
      const expiry = (CsrfService as any).TOKEN_EXPIRY;
      expect(expiry).toBe(5 * 60 * 1000);
    });

    it('should keep token valid within expiry period', () => {
      // Set 1 second expiry
      (CsrfService as any).TOKEN_EXPIRY = 1000;

      const token = CsrfService.generateToken();

      return new Promise<void>((resolve) => {
        setTimeout(() => {
          const isValid = CsrfService.validateToken(token);
          expect(isValid).toBe(true);
          resolve();
        }, 500); // Check after 500ms (within 1 second expiry)
      });
    });

    it('should invalidate token after expiry period', () => {
      // Set very short expiry
      (CsrfService as any).TOKEN_EXPIRY = 100;

      const token = CsrfService.generateToken();

      return new Promise<void>((resolve) => {
        setTimeout(() => {
          const isValid = CsrfService.validateToken(token);
          expect(isValid).toBe(false);
          resolve();
        }, 150); // Check after 150ms (beyond 100ms expiry)
      });
    });
  });

  describe('Token Storage', () => {
    it('should store multiple tokens', () => {
      const token1 = CsrfService.generateToken();
      const token2 = CsrfService.generateToken();
      const token3 = CsrfService.generateToken();

      const tokens = (CsrfService as any).tokens;
      expect(tokens.size).toBe(3);
      expect(tokens.has(token1)).toBe(true);
      expect(tokens.has(token2)).toBe(true);
      expect(tokens.has(token3)).toBe(true);
    });

    it('should cleanup only expired tokens', () => {
      // Set short expiry
      (CsrfService as any).TOKEN_EXPIRY = 200;

      const token1 = CsrfService.generateToken();

      return new Promise<void>((resolve) => {
        setTimeout(() => {
          // token1 should be expired now
          const token2 = CsrfService.generateToken(); // This triggers cleanup
          
          const tokens = (CsrfService as any).tokens;
          expect(tokens.has(token1)).toBe(false); // Expired, cleaned up
          expect(tokens.has(token2)).toBe(true);  // Fresh token
          resolve();
        }, 250);
      });
    });
  });

  describe('Security Properties', () => {
    it('should generate cryptographically random tokens', () => {
      const tokens = new Set();
      const iterations = 100;

      for (let i = 0; i < iterations; i++) {
        tokens.add(CsrfService.generateToken());
      }

      // All tokens should be unique
      expect(tokens.size).toBe(iterations);
    });

    it('should enforce one-time use of tokens', () => {
      const token = CsrfService.generateToken();

      // First use should succeed
      expect(CsrfService.validateToken(token)).toBe(true);

      // Subsequent uses should fail
      expect(CsrfService.validateToken(token)).toBe(false);
      expect(CsrfService.validateToken(token)).toBe(false);
    });

    it('should not validate similar but different tokens', () => {
      const token = CsrfService.generateToken();
      const similarToken = token.slice(0, -1) + 'x'; // Change last character

      expect(CsrfService.validateToken(similarToken)).toBe(false);
    });
  });
});
