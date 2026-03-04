import { CryptoUtil } from './crypto.util';

describe('CryptoUtil', () => {
  const testPassword = 'TestPassword123!';
  
  describe('hashPassword', () => {
    it('should hash a password successfully', async () => {
      const hash = await CryptoUtil.hashPassword(testPassword);
      
      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
      expect(hash).not.toBe(testPassword);
      expect(hash.length).toBeGreaterThan(0);
    });

    it('should generate bcrypt hash with correct format', async () => {
      const hash = await CryptoUtil.hashPassword(testPassword);
      
      // bcrypt hash starts with $2b$ (or $2a$) and has 60 characters
      expect(hash).toMatch(/^\$2[ab]\$\d{2}\$/);
      expect(hash.length).toBe(60);
    });

    it('should generate different hashes for same password', async () => {
      const hash1 = await CryptoUtil.hashPassword(testPassword);
      const hash2 = await CryptoUtil.hashPassword(testPassword);
      
      // Even same password should have different hashes due to salt
      expect(hash1).not.toBe(hash2);
    });

    it('should hash empty string', async () => {
      const hash = await CryptoUtil.hashPassword('');
      
      expect(hash).toBeDefined();
      expect(hash.length).toBe(60);
    });

    it('should hash long password', async () => {
      const longPassword = 'a'.repeat(100);
      const hash = await CryptoUtil.hashPassword(longPassword);
      
      expect(hash).toBeDefined();
      expect(hash.length).toBe(60);
    });

    it('should hash special characters', async () => {
      const specialPassword = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      const hash = await CryptoUtil.hashPassword(specialPassword);
      
      expect(hash).toBeDefined();
      expect(hash.length).toBe(60);
    });
  });

  describe('comparePassword', () => {
    it('should return true for matching password', async () => {
      const hash = await CryptoUtil.hashPassword(testPassword);
      const isMatch = await CryptoUtil.comparePassword(testPassword, hash);
      
      expect(isMatch).toBe(true);
    });

    it('should return false for non-matching password', async () => {
      const hash = await CryptoUtil.hashPassword(testPassword);
      const isMatch = await CryptoUtil.comparePassword('WrongPassword123!', hash);
      
      expect(isMatch).toBe(false);
    });

    it('should be case-sensitive', async () => {
      const hash = await CryptoUtil.hashPassword(testPassword);
      const isMatch = await CryptoUtil.comparePassword(testPassword.toLowerCase(), hash);
      
      expect(isMatch).toBe(false);
    });

    it('should return false for empty password against hash', async () => {
      const hash = await CryptoUtil.hashPassword(testPassword);
      const isMatch = await CryptoUtil.comparePassword('', hash);
      
      expect(isMatch).toBe(false);
    });

    it('should handle comparison with empty password hash', async () => {
      const emptyHash = await CryptoUtil.hashPassword('');
      const isMatch = await CryptoUtil.comparePassword('', emptyHash);
      
      expect(isMatch).toBe(true);
    });

    it('should return false for invalid hash format', async () => {
      const invalidHash = 'not-a-valid-bcrypt-hash';
      
      // bcrypt returns false for invalid hashes rather than throwing
      const isMatch = await CryptoUtil.comparePassword(testPassword, invalidHash);
      expect(isMatch).toBe(false);
    });

    it('should work with special characters', async () => {
      const specialPassword = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      const hash = await CryptoUtil.hashPassword(specialPassword);
      const isMatch = await CryptoUtil.comparePassword(specialPassword, hash);
      
      expect(isMatch).toBe(true);
    });
  });

  describe('Security Properties', () => {
    it('should use salt rounds (hashes should be slow)', async () => {
      const startTime = Date.now();
      await CryptoUtil.hashPassword(testPassword);
      const endTime = Date.now();
      
      // With 12 salt rounds, hashing should take at least some time
      // This is a rough check; actual time varies by hardware
      const duration = endTime - startTime;
      expect(duration).toBeGreaterThan(10); // Should take more than 10ms
    });

    it('should maintain consistency across multiple comparisons', async () => {
      const hash = await CryptoUtil.hashPassword(testPassword);
      
      const isMatch1 = await CryptoUtil.comparePassword(testPassword, hash);
      const isMatch2 = await CryptoUtil.comparePassword(testPassword, hash);
      const isMatch3 = await CryptoUtil.comparePassword(testPassword, hash);
      
      expect(isMatch1).toBe(true);
      expect(isMatch2).toBe(true);
      expect(isMatch3).toBe(true);
    });
  });
});
