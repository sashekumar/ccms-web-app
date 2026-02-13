export const jwtConfig = {
  secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  accessTokenExpiry: process.env.JWT_ACCESS_TOKEN_EXPIRY || '15m',
  refreshTokenExpiry: process.env.JWT_REFRESH_TOKEN_EXPIRY || '7d',
  algorithm: 'HS256' as const,
  issuer: process.env.JWT_ISSUER || 'ccms-api',
  audience: process.env.JWT_AUDIENCE || 'ccms-client'
};
