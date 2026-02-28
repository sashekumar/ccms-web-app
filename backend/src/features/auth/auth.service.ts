import { AuthRepository } from './auth.repository';
import { LoginDto, LoginResponse, User } from './auth.types';
import { JwtService } from '../../core/auth/jwt.service';
import { CryptoUtil } from '../../core/utils/crypto.util';
import { BaseService } from '../../core/base/base.service';

export class AuthService extends BaseService<User> {
  private authRepository: AuthRepository;

  constructor() {
    const authRepository = new AuthRepository();
    super(authRepository);
    this.authRepository = authRepository;
  }

  /**
   * Login - Authenticate user and generate tokens
   */
  public async login(loginDto: LoginDto): Promise<{ 
    user: LoginResponse['user']; 
    accessToken: string; 
    refreshToken: string 
  }> {
    // Find user by username
    const user = await this.authRepository.findByUsername(loginDto.username);

    if (!user) {
      throw new Error('Invalid username or password');
    }

    // Check if user is active
    if (!user.is_active) {
      throw new Error('Account is inactive');
    }

    // Verify password
    const isValidPassword = await CryptoUtil.comparePassword(
      loginDto.password,
      user.password_hash
    );

    if (!isValidPassword) {
      throw new Error('Invalid username or password');
    }

    // Generate tokens
    const accessToken = JwtService.generateAccessToken(user);
    const refreshToken = JwtService.generateRefreshToken(user);

    // Update last login
    await this.authRepository.updateLastLogin(user.user_id);

    // Get user roles
    const roles = await this.authRepository.getUserRoles(user.user_id);

    return {
      user: {
        user_id: user.user_id,
        username: user.username,
        full_name: user.full_name,
        is_active: user.is_active,
        last_login: user.last_login,
        roles: roles
      },
      accessToken,
      refreshToken
    };
  }

  /**
   * Get current user by ID
   */
  public async getCurrentUser(userId: number): Promise<LoginResponse['user']> {
    const user = await this.authRepository.findById(userId);

    if (!user) {
      throw new Error('User not found');
    }

    if (!user.is_active) {
      throw new Error('Account is inactive');
    }

    // Get user roles
    const roles = await this.authRepository.getUserRoles(userId);

    return {
      user_id: user.user_id,
      username: user.username,
      full_name: user.full_name,
      is_active: user.is_active,
      last_login: user.last_login,
      roles: roles
    };
  }

  /**
   * Refresh access token using refresh token
   */
  public async refreshToken(refreshToken: string): Promise<{ 
    accessToken: string; 
    refreshToken: string 
  }> {
    try {
      // Verify refresh token
      const payload = JwtService.verifyToken(refreshToken);

      // Check if it's actually a refresh token
      if (payload.tokenType !== 'refresh') {
        throw new Error('Invalid token type');
      }

      // Get user from database
      const user = await this.authRepository.findById(payload.userId);

      if (!user) {
        throw new Error('User not found');
      }

      if (!user.is_active) {
        throw new Error('Account is inactive');
      }

      // Generate new tokens
      const newAccessToken = JwtService.generateAccessToken(user);
      const newRefreshToken = JwtService.generateRefreshToken(user);

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken
      };
    } catch (error) {
      throw new Error('Invalid or expired refresh token');
    }
  }
}
