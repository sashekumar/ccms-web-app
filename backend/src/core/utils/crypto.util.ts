import bcrypt from 'bcrypt';

export class CryptoUtil {
  private static SALT_ROUNDS = 12;

  /**
   * Hash password
   */
  public static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  /**
   * Compare password with hash
   */
  public static async comparePassword(
    password: string,
    hash: string
  ): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}
