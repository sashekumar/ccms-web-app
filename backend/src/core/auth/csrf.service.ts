import crypto from 'crypto';

interface CsrfToken {
  token: string;
  timestamp: number;
}

/**
 * CSRF Token Service
 * Generates and validates CSRF tokens for login protection
 */
export class CsrfService {
  private static tokens = new Map<string, CsrfToken>();
  private static TOKEN_EXPIRY = 5 * 60 * 1000; // 5 minutes

  /**
   * Generate a new CSRF token
   */
  public static generateToken(): string {
    const token = crypto.randomBytes(32).toString('hex');
    
    this.tokens.set(token, {
      token,
      timestamp: Date.now()
    });

    // Cleanup expired tokens
    this.cleanupExpiredTokens();

    return token;
  }

  /**
   * Validate CSRF token
   */
  public static validateToken(token: string): boolean {
    const storedToken = this.tokens.get(token);

    if (!storedToken) {
      return false;
    }

    // Check if token has expired
    const isExpired = Date.now() - storedToken.timestamp > this.TOKEN_EXPIRY;
    
    if (isExpired) {
      this.tokens.delete(token);
      return false;
    }

    // Token is valid, remove it (one-time use)
    this.tokens.delete(token);
    return true;
  }

  /**
   * Cleanup expired tokens
   */
  private static cleanupExpiredTokens(): void {
    const now = Date.now();
    for (const [token, data] of this.tokens.entries()) {
      if (now - data.timestamp > this.TOKEN_EXPIRY) {
        this.tokens.delete(token);
      }
    }
  }
}
