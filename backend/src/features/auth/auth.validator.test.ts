import { loginSchema } from './auth.validator';

describe('Auth Validators', () => {
  describe('loginSchema', () => {
    it('should validate correct login credentials', () => {
      const validData = {
        username: 'testuser',
        password: 'password123'
      };

      const { error, value } = loginSchema.validate(validData);

      expect(error).toBeUndefined();
      expect(value).toEqual(validData);
    });

    it('should reject missing username', () => {
      const invalidData = {
        password: 'password123'
      };

      const { error } = loginSchema.validate(invalidData);

      expect(error).toBeDefined();
      expect(error?.message).toContain('required');
    });

    it('should reject missing password', () => {
      const invalidData = {
        username: 'testuser'
      };

      const { error } = loginSchema.validate(invalidData);

      expect(error).toBeDefined();
      expect(error?.message).toContain('required');
    });

    it('should reject username shorter than 3 characters', () => {
      const invalidData = {
        username: 'ab',
        password: 'password123'
      };

      const { error } = loginSchema.validate(invalidData);

      expect(error).toBeDefined();
      expect(error?.message).toContain('Username must be at least 3 characters');
    });

    it('should reject username longer than 50 characters', () => {
      const invalidData = {
        username: 'a'.repeat(51),
        password: 'password123'
      };

      const { error } = loginSchema.validate(invalidData);

      expect(error).toBeDefined();
      expect(error?.message).toContain('Username must not exceed 50 characters');
    });

    it('should reject password shorter than 6 characters', () => {
      const invalidData = {
        username: 'testuser',
        password: '12345'
      };

      const { error } = loginSchema.validate(invalidData);

      expect(error).toBeDefined();
      expect(error?.message).toContain('at least 6 characters');
    });

    it('should accept username with exactly 3 characters', () => {
      const validData = {
        username: 'abc',
        password: 'password123'
      };

      const { error } = loginSchema.validate(validData);

      expect(error).toBeUndefined();
    });

    it('should accept username with exactly 50 characters', () => {
      const validData = {
        username: 'a'.repeat(50),
        password: 'password123'
      };

      const { error } = loginSchema.validate(validData);

      expect(error).toBeUndefined();
    });

    it('should accept password with exactly 6 characters', () => {
      const validData = {
        username: 'testuser',
        password: '123456'
      };

      const { error } = loginSchema.validate(validData);

      expect(error).toBeUndefined();
    });

    it('should reject empty username string', () => {
      const invalidData = {
        username: '',
        password: 'password123'
      };

      const { error } = loginSchema.validate(invalidData);

      expect(error).toBeDefined();
      expect(error?.message).toContain('Username is required');
    });

    it('should reject empty password string', () => {
      const invalidData = {
        username: 'testuser',
        password: ''
      };

      const { error } = loginSchema.validate(invalidData);

      expect(error).toBeDefined();
      expect(error?.message).toContain('Password is required');
    });

    it('should handle both fields missing', () => {
      const invalidData = {};

      const { error } = loginSchema.validate(invalidData);

      expect(error).toBeDefined();
      expect(error?.message).toContain('required');
    });

    it('should not trim whitespace from username by default', () => {
      const dataWithSpaces = {
        username: '  testuser  ',
        password: 'password123'
      };

      const { error, value } = loginSchema.validate(dataWithSpaces);

      expect(error).toBeUndefined();
      expect(value.username).toBe('  testuser  ');
    });

    it('should not trim password (passwords can have spaces)', () => {
      const dataWithSpaces = {
        username: 'testuser',
        password: '  password123  '
      };

      const { error, value } = loginSchema.validate(dataWithSpaces);

      expect(error).toBeUndefined();
      expect(value.password).toBe('  password123  ');
    });
  });
});
