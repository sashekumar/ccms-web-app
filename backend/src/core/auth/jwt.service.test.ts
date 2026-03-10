import { JwtService } from './jwt.service';
import { User, TokenPayload } from '../../features/auth/auth.types';
import jwt from 'jsonwebtoken';

describe('JwtService', () => {
  const mockUser: User = {
    user_id: 1,
    username: 'testuser',
    password_hash: 'hashed_password',
    full_name: 'Test User',
    is_active: true,
    last_login: new Date('2024-01-01')
  };

  describe('generateAccessToken', () => {
    it('should generate a valid access token', () => {
      const token = JwtService.generateAccessToken(mockUser);
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should include correct payload in access token', () => {
      const token = JwtService.generateAccessToken(mockUser);
      const decoded = jwt.decode(token) as TokenPayload;
      
      expect(decoded.userId).toBe(mockUser.user_id);
      expect(decoded.username).toBe(mockUser.username);
      expect(decoded.tokenType).toBe('access');
    });

    it('should set correct expiration for access token (15 minutes)', () => {
      const token = JwtService.generateAccessToken(mockUser);
      const decoded = jwt.decode(token) as any;
      
      const now = Math.floor(Date.now() / 1000);
      const expectedExpiry = now + (15 * 60); // 15 minutes
      
      expect(decoded.exp).toBeGreaterThan(now);
      expect(decoded.exp).toBeLessThanOrEqual(expectedExpiry + 5); // 5 second tolerance
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a valid refresh token', () => {
      const token = JwtService.generateRefreshToken(mockUser);
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    it('should include correct payload in refresh token', () => {
      const token = JwtService.generateRefreshToken(mockUser);
      const decoded = jwt.decode(token) as TokenPayload;
      
      expect(decoded.userId).toBe(mockUser.user_id);
      expect(decoded.username).toBe(mockUser.username);
      expect(decoded.tokenType).toBe('refresh');
    });

    it('should set correct expiration for refresh token (7 days)', () => {
      const token = JwtService.generateRefreshToken(mockUser);
      const decoded = jwt.decode(token) as any;
      
      const now = Math.floor(Date.now() / 1000);
      const expectedExpiry = now + (7 * 24 * 60 * 60); // 7 days
      
      expect(decoded.exp).toBeGreaterThan(now);
      expect(decoded.exp).toBeLessThanOrEqual(expectedExpiry + 5);
    });
  });

  describe('verifyToken', () => {
    it('should verify a valid token', () => {
      const token = JwtService.generateAccessToken(mockUser);
      const payload = JwtService.verifyToken(token);
      
      expect(payload.userId).toBe(mockUser.user_id);
      expect(payload.username).toBe(mockUser.username);
      expect(payload.tokenType).toBe('access');
    });

    it('should throw error for invalid token', () => {
      expect(() => {
        JwtService.verifyToken('invalid.token.here');
      }).toThrow('Invalid or expired token');
    });

    it('should throw error for expired token', () => {
      // Create a token that expires immediately
      const expiredToken = jwt.sign(
        { userId: 1, username: 'test', tokenType: 'access' },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '0s' }
      );

      // Wait a moment to ensure token is expired
      setTimeout(() => {
        expect(() => {
          JwtService.verifyToken(expiredToken);
        }).toThrow('Invalid or expired token');
      }, 100);
    });

    it('should throw error for tampered token', () => {
      const token = JwtService.generateAccessToken(mockUser);
      const tamperedToken = token.slice(0, -10) + 'tampered12';
      
      expect(() => {
        JwtService.verifyToken(tamperedToken);
      }).toThrow('Invalid or expired token');
    });
  });

  describe('decodeToken', () => {
    it('should decode a valid token without verification', () => {
      const token = JwtService.generateAccessToken(mockUser);
      const payload = JwtService.decodeToken(token);
      
      expect(payload).not.toBeNull();
      expect(payload?.userId).toBe(mockUser.user_id);
      expect(payload?.username).toBe(mockUser.username);
    });

    it('should return null for invalid token', () => {
      const payload = JwtService.decodeToken('invalid.token');
      expect(payload).toBeNull();
    });

    it('should decode expired token without verification', () => {
      const expiredToken = jwt.sign(
        { userId: 1, username: 'test', tokenType: 'access' },
        'any-secret',
        { expiresIn: '0s' }
      );
      
      const payload = JwtService.decodeToken(expiredToken);
      expect(payload).not.toBeNull();
      expect(payload?.userId).toBe(1);
    });
  });

  describe('Token Differences', () => {
    it('should generate different tokens for access and refresh', () => {
      const accessToken = JwtService.generateAccessToken(mockUser);
      const refreshToken = JwtService.generateRefreshToken(mockUser);
      
      expect(accessToken).not.toBe(refreshToken);
      
      const accessPayload = jwt.decode(accessToken) as TokenPayload;
      const refreshPayload = jwt.decode(refreshToken) as TokenPayload;
      
      expect(accessPayload.tokenType).toBe('access');
      expect(refreshPayload.tokenType).toBe('refresh');
    });
  });
});
