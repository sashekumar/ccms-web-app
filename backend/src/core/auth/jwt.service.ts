import jwt, { SignOptions } from 'jsonwebtoken';
import { jwtConfig } from '../../config/jwt.config';
import { User, TokenPayload } from '../../features/auth/auth.types';

export class JwtService {
  /**
   * Generate access token (15 minutes)
   */
  public static generateAccessToken(user: User): string {
    const payload: TokenPayload = {
      userId: user.user_id,
      username: user.username,
      roleId: user.role_id,
      tokenType: 'access'
    };

    const options: SignOptions = {
      algorithm: 'HS256',
      expiresIn: '15m',
      issuer: jwtConfig.issuer,
      audience: jwtConfig.audience
    };

    return jwt.sign(payload, jwtConfig.secret, options);
  }

  /**
   * Generate refresh token (7 days)
   */
  public static generateRefreshToken(user: User): string {
    const payload: TokenPayload = {
      userId: user.user_id,
      username: user.username,
      roleId: user.role_id,
      tokenType: 'refresh'
    };

    const options: SignOptions = {
      algorithm: 'HS256',
      expiresIn: '7d',
      issuer: jwtConfig.issuer,
      audience: jwtConfig.audience
    };

    return jwt.sign(payload, jwtConfig.secret, options);
  }

  /**
   * Verify token
   */
  public static verifyToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, jwtConfig.secret, {
        algorithms: ['HS256'],
        issuer: jwtConfig.issuer,
        audience: jwtConfig.audience
      }) as TokenPayload;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  /**
   * Decode token without verification
   */
  public static decodeToken(token: string): TokenPayload | null {
    try {
      return jwt.decode(token) as TokenPayload;
    } catch (error) {
      return null;
    }
  }
}
