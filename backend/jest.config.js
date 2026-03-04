/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    // Only measure files that have test coverage
    'src/core/auth/jwt.service.ts',
    'src/core/utils/crypto.util.ts',
    'src/features/auth/auth.repository.ts',
    'src/features/auth/auth.service.ts',
    'src/middleware/auth.middleware.ts',
    'src/middleware/permission.middleware.ts',
    // Note: permissions.service.ts excluded until more methods are tested
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  moduleFileExtensions: ['ts', 'js', 'json'],
  verbose: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
};
