import { AuthRepository } from './auth.repository';
import { LoginDto, LoginResponse } from './auth.types';
import { JwtService } from '../../core/auth/jwt.service';
import { CryptoUtil } from '../../core/utils/crypto.util';

export class AuthService {
  private authRepository: AuthRepository;

  constructor() {
    this.authRepository = new AuthRepository();
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

    // Parse permissions
    let permissions = null;
    try {
      permissions = user.permissions_json ? JSON.parse(user.permissions_json) : null;
    } catch (error) {
      console.warn('Failed to parse permissions JSON:', error);
    }

    return {
      user: {
        userId: user.user_id,
        username: user.username,
        fullName: user.full_name,
        roleId: user.role_id,
        permissions
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

    let permissions = null;
    try {
      permissions = user.permissions_json ? JSON.parse(user.permissions_json) : null;
    } catch (error) {
      console.warn('Failed to parse permissions JSON:', error);
    }

    return {
      userId: user.user_id,
      username: user.username,
      fullName: user.full_name,
      roleId: user.role_id,
      permissions
    };
  }
}
