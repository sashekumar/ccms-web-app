/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  reporters: [
    'default',
    ['jest-allure2-reporter', {
      resultsDir: 'allure-results',
      usePath: true,
      testCase: {
        labels: {
          severity: 'normal',
          parent: null,
          suite: null,
          subSuite: null,
          epic: null,
          feature: null,
          story: null,
        },
      },
    }],
  ],
  collectCoverageFrom: [
    // Collect coverage from all TypeScript source files
    'src/**/*.ts',
    // Exclude test files, type definitions, and index files
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts',
    '!src/**/*.types.ts',
    '!src/**/index.ts',
    '!src/server.ts',
    '!src/app.ts',
    '!src/scripts/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 88,
      lines: 86,
      statements: 85,
    },
  },
  moduleFileExtensions: ['ts', 'js', 'json'],
  verbose: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  testTimeout: 30000, // 30 second timeout for all tests to handle slow operations
};
