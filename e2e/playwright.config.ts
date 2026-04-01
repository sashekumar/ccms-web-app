import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for CCMS E2E Tests
 * 
 * Following coding-standards.md principles:
 * - REUSABILITY: Shared configuration across all tests
 * - MODULARIZATION: Separate projects for different browsers
 * - COMMONIZATION: Common settings in one place
 * 
 * @see https://playwright.dev/docs/test-configuration
 */

// Environment configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:4200';
const API_URL = process.env.API_URL || 'http://localhost:3000';

// Detect if running in headed or UI mode (for sequential execution)
const isHeadedOrUI = process.argv.includes('--headed') || 
                     process.argv.includes('--ui') || 
                     process.argv.includes('--debug');

export default defineConfig({
  // Test directory
  testDir: './tests',
  
  // Test file pattern
  testMatch: '**/*.spec.ts',
  
  // Maximum time one test can run (30 seconds)
  timeout: 30 * 1000,
  
  // Expect timeout for assertions (5 seconds)
  expect: {
    timeout: 5000,
  },
  
  // Run tests in files in parallel
  fullyParallel: true,
  
  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,
  
  // Retry on CI only
  retries: process.env.CI ? 2 : 0,
  
  // Opt out of parallel tests on CI (for stability)
  // Use 1 worker for headed/UI/debug modes to see tests sequentially
  workers: process.env.CI ? 1 : (isHeadedOrUI ? 1 : 5),
  
  // Reporter to use
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['allure-playwright', { outputFolder: 'allure-results' }],
    ['list'], // Console output
  ],
  
  // Shared settings for all projects
  use: {
    // Base URL for navigation
    baseURL: BASE_URL,
    
    // Collect trace on first retry of a failing test
    trace: 'on-first-retry',
    
    // Screenshot on failure
    screenshot: 'on',
    
    // Video on failure
    video: 'on',
    
    // Maximum time each action can take (10 seconds)
    actionTimeout: 10000,
    
    // Navigation timeout (30 seconds)
    navigationTimeout: 30000,
    
    // Extra HTTP headers
    extraHTTPHeaders: {
      'Accept-Language': 'en-US',
    },
  },

  // Global setup and teardown  
  // globalSetup: require.resolve('./global-setup'),
  // globalTeardown: require.resolve('./global-teardown'),

  // Configure projects for major browsers
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
      },
    },

    {
      name: 'firefox',
      use: { 
        ...devices['Desktop Firefox'],
        viewport: { width: 1920, height: 1080 },
      },
    },

    {
      name: 'webkit',
      use: { 
        ...devices['Desktop Safari'],
        viewport: { width: 1920, height: 1080 },
      },
    },

    // Mobile viewports
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },

    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 12'] },
    },

    // Tablet viewports
    {
      name: 'tablet',
      use: { 
        ...devices['iPad Pro'],
      },
    },
  ],

  // Run local dev server before starting tests
  // Commented out for development - start backend and frontend manually
  // Uncomment for CI/CD pipeline
  // webServer: [
  //   {
  //     command: 'cd ../backend && npm run dev',
  //     url: API_URL,
  //     timeout: 120 * 1000,
  //     reuseExistingServer: !process.env.CI,
  //     stdout: 'pipe',
  //     stderr: 'pipe',
  //   },
  //   {
  //     command: 'cd ../frontend && npm start',
  //     url: BASE_URL,
  //     timeout: 120 * 1000,
  //     reuseExistingServer: !process.env.CI,
  //     stdout: 'pipe',
  //     stderr: 'pipe',
  //   },
  // ],
});
