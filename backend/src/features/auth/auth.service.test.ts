import { AuthService } from './auth.service';
import { AuthRepository } from './auth.repository';
import { JwtService } from '../../core/auth/jwt.service';
import { CryptoUtil } from '../../core/utils/crypto.util';
import { User, LoginDto } from './auth.types';

// Mock dependencies
jest.mock('./auth.repository');
jest.mock('../../core/auth/jwt.service');
jest.mock('../../core/utils/crypto.util');

describe('AuthService', () => {
  let authService: AuthService;
  let mockAuthRepository: jest.Mocked<AuthRepository>;

  const mockUser: User = {
    user_id: 1,
    username: 'testuser',
    password_hash: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5kosgVu/vg3F6',
    full_name: 'Test User',
    is_active: true,
    last_login: new Date('2024-01-01')
  };

  const mockRoles = [
    { role_id: 1, role_name: 'Super Admin', role_code: 'SUPER_ADMIN' }
  ];

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Setup repository mock
    mockAuthRepository = {
      findByUsername: jest.fn(),
      updateLastLogin: jest.fn(),
      getUserRoles: jest.fn(),
      findById: jest.fn(),
    } as any;

    (AuthRepository as jest.MockedClass<typeof AuthRepository>).mockImplementation(
      () => mockAuthRepository
    );

    authService = new AuthService();
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      username: 'testuser',
      password: 'password123'
    };

    beforeEach(() => {
      mockAuthRepository.findByUsername.mockResolvedValue(mockUser);
      mockAuthRepository.getUserRoles.mockResolvedValue(mockRoles);
      mockAuthRepository.updateLastLogin.mockResolvedValue();
      (CryptoUtil.comparePassword as jest.Mock).mockResolvedValue(true);
      (JwtService.generateAccessToken as jest.Mock).mockReturnValue('access_token_123');
      (JwtService.generateRefreshToken as jest.Mock).mockReturnValue('refresh_token_456');
    });

    it('should login successfully with valid credentials', async () => {
      const result = await authService.login(loginDto);

      expect(result).toEqual({
        user: {
          user_id: mockUser.user_id,
          username: mockUser.username,
          full_name: mockUser.full_name,
          is_active: mockUser.is_active,
          last_login: mockUser.last_login,
          roles: mockRoles
        },
        accessToken: 'access_token_123',
        refreshToken: 'refresh_token_456'
      });
    });

    it('should call findByUsername with correct username', async () => {
      await authService.login(loginDto);

      expect(mockAuthRepository.findByUsername).toHaveBeenCalledWith('testuser');
      expect(mockAuthRepository.findByUsername).toHaveBeenCalledTimes(1);
    });

    it('should verify password correctly', async () => {
      await authService.login(loginDto);

      expect(CryptoUtil.comparePassword).toHaveBeenCalledWith(
        'password123',
        mockUser.password_hash
      );
    });

    it('should generate both access and refresh tokens', async () => {
      await authService.login(loginDto);

      expect(JwtService.generateAccessToken).toHaveBeenCalledWith(mockUser);
      expect(JwtService.generateRefreshToken).toHaveBeenCalledWith(mockUser);
    });

    it('should update last login timestamp', async () => {
      await authService.login(loginDto);

      expect(mockAuthRepository.updateLastLogin).toHaveBeenCalledWith(mockUser.user_id);
    });

    it('should fetch user roles', async () => {
      await authService.login(loginDto);

      expect(mockAuthRepository.getUserRoles).toHaveBeenCalledWith(mockUser.user_id);
    });

    it('should throw error when user not found', async () => {
      mockAuthRepository.findByUsername.mockResolvedValue(null);

      await expect(authService.login(loginDto)).rejects.toThrow(
        'Invalid username or password'
      );

      expect(CryptoUtil.comparePassword).not.toHaveBeenCalled();
    });

    it('should throw error when user is inactive', async () => {
      const inactiveUser = { ...mockUser, is_active: false };
      mockAuthRepository.findByUsername.mockResolvedValue(inactiveUser);

      await expect(authService.login(loginDto)).rejects.toThrow(
        'Account is inactive'
      );

      expect(CryptoUtil.comparePassword).not.toHaveBeenCalled();
    });

    it('should throw error when password is incorrect', async () => {
      (CryptoUtil.comparePassword as jest.Mock).mockResolvedValue(false);

      await expect(authService.login(loginDto)).rejects.toThrow(
        'Invalid username or password'
      );

      expect(JwtService.generateAccessToken).not.toHaveBeenCalled();
    });

    it('should not update last login if password is wrong', async () => {
      (CryptoUtil.comparePassword as jest.Mock).mockResolvedValue(false);

      await expect(authService.login(loginDto)).rejects.toThrow();

      expect(mockAuthRepository.updateLastLogin).not.toHaveBeenCalled();
    });
  });

  describe('getCurrentUser', () => {
    beforeEach(() => {
      mockAuthRepository.findById.mockResolvedValue(mockUser);
      mockAuthRepository.getUserRoles.mockResolvedValue(mockRoles);
    });

    it('should get current user by ID', async () => {
      const result = await authService.getCurrentUser(1);

      expect(result).toEqual({
        user_id: mockUser.user_id,
        username: mockUser.username,
        full_name: mockUser.full_name,
        is_active: mockUser.is_active,
        last_login: mockUser.last_login,
        roles: mockRoles
      });
    });

    it('should call findById with correct user ID', async () => {
      await authService.getCurrentUser(123);

      expect(mockAuthRepository.findById).toHaveBeenCalledWith(123);
    });

    it('should throw error when user not found', async () => {
      mockAuthRepository.findById.mockResolvedValue(null);

      await expect(authService.getCurrentUser(999)).rejects.toThrow('User not found');
    });

    it('should throw error when user is inactive', async () => {
      const inactiveUser = { ...mockUser, is_active: false };
      mockAuthRepository.findById.mockResolvedValue(inactiveUser);

      await expect(authService.getCurrentUser(1)).rejects.toThrow('Account is inactive');
    });

    it('should fetch user roles', async () => {
      await authService.getCurrentUser(1);

      expect(mockAuthRepository.getUserRoles).toHaveBeenCalledWith(1);
    });

    it('should return user without password hash', async () => {
      const result = await authService.getCurrentUser(1);

      expect(result).not.toHaveProperty('password_hash');
    });
  });

  describe('refreshToken', () => {
    const mockRefreshToken = 'valid_refresh_token';
    const mockTokenPayload = {
      userId: 1,
      username: 'testuser',
      tokenType: 'refresh' as const,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60
    };

    beforeEach(() => {
      (JwtService.verifyToken as jest.Mock).mockReturnValue(mockTokenPayload);
      mockAuthRepository.findById.mockResolvedValue(mockUser);
      (JwtService.generateAccessToken as jest.Mock).mockReturnValue('new_access_token');
    });

    it('should refresh access token successfully', async () => {
      const result = await authService.refreshToken(mockRefreshToken);

      expect(result).toEqual({
        accessToken: 'new_access_token'
      });
    });

    it('should verify the refresh token', async () => {
      await authService.refreshToken(mockRefreshToken);

      expect(JwtService.verifyToken).toHaveBeenCalledWith(mockRefreshToken);
    });

    it('should throw error if token type is not refresh', async () => {
      const accessTokenPayload = { ...mockTokenPayload, tokenType: 'access' as const };
      (JwtService.verifyToken as jest.Mock).mockReturnValue(accessTokenPayload);

      await expect(authService.refreshToken(mockRefreshToken)).rejects.toThrow(
        'Invalid or expired refresh token'
      );
    });

    it('should verify user exists', async () => {
      await authService.refreshToken(mockRefreshToken);

      expect(mockAuthRepository.findById).toHaveBeenCalledWith(mockTokenPayload.userId);
    });

    it('should throw error if user not found', async () => {
      mockAuthRepository.findById.mockResolvedValue(null);

      await expect(authService.refreshToken(mockRefreshToken)).rejects.toThrow(
        'Invalid or expired refresh token'
      );
    });

    it('should throw error if user is inactive', async () => {
      const inactiveUser = { ...mockUser, is_active: false };
      mockAuthRepository.findById.mockResolvedValue(inactiveUser);

      await expect(authService.refreshToken(mockRefreshToken)).rejects.toThrow(
        'Invalid or expired refresh token'
      );
    });

    it('should generate new access token', async () => {
      await authService.refreshToken(mockRefreshToken);

      expect(JwtService.generateAccessToken).toHaveBeenCalledWith(mockUser);
    });
  });
});
