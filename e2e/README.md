# E2E Tests - CCMS Web Application

## Overview
End-to-end (E2E) tests for the complete CCMS application stack:
- **Frontend**: Angular (Port 4200)
- **Backend**: Express API (Port 3000)  
- **Database**: MS SQL Server (Test instance)

## Technology Stack
- **Playwright**: Browser automation framework
- **TypeScript**: Type-safe test code
- **Docker Compose**: Isolated test database environment

## Directory Structure
```
e2e/
├── README.md                    # This file
├── playwright.config.ts         # Playwright configuration
├── global-setup.ts             # Global test setup
├── global-teardown.ts          # Global test teardown
├── tsconfig.json               # TypeScript configuration for E2E
├── page-objects/               # Page Object Model (POM)
│   ├── base.page.ts           # Base page class
│   ├── login.page.ts          # Login page
│   ├── dashboard.page.ts      # Dashboard page
│   ├── users/                 # User management pages
│   │   ├── user-list.page.ts
│   │   └── user-form.page.ts
│   └── roles/                 # Role management pages
│       ├── role-list.page.ts
│       └── role-form.page.ts
│
├── tests/                      # Test suites
│   ├── auth/                  # Authentication tests
│   │   ├── login.spec.ts
│   │   ├── logout.spec.ts
│   │   └── password-reset.spec.ts
│   ├── users/                 # User management tests
│   │   ├── user-crud.spec.ts
│   │   └── user-search.spec.ts
│   ├── roles/                 # Role management tests
│   │   ├── role-crud.spec.ts
│   │   └── role-permissions.spec.ts
│   └── workflows/             # Complete business workflows
│       └── user-role-flow.spec.ts
│
├── helpers/                    # Test helpers
│   ├── auth.helper.ts         # Authentication utilities
│   ├── database.helper.ts     # Database seeding/cleanup
│   ├── api.helper.ts          # Direct API calls
│   └── test-data.factory.ts  # Test data generation
│
├── fixtures/                   # Test data fixtures
│   ├── users.json
│   ├── roles.json
│   └── permissions.json
│
└── docker/                     # Docker setup
    ├── docker-compose.yml     # Test database container
    └── init-db.sql           # Database initialization script
```

## Key Principles (Following coding-standards.md)

### 1. REUSABILITY
- **Page Objects**: Reusable page representations
- **Helpers**: Common test utilities shared across tests
- **Fixtures**: Reusable test data
- **No duplicate test logic**: Extract common flows

### 2. MODULARIZATION  
- **Tests by feature**: Organized by business domain (auth, users, roles)
- **Page Objects by module**: Separate pages for each feature
- **Independent test suites**: Can run separately

### 3. COMMONIZATION
- **Base Page**: Common page methods (click, type, wait)
- **Auth Helper**: Shared authentication logic
- **Database Helper**: Common DB operations
- **Test Data Factory**: Consistent test data generation

## Running Tests

### Prerequisites
```bash
# Start test database
docker-compose -f e2e/docker/docker-compose.yml up -d

# Start backend (from backend/)
npm run dev

# Start frontend (from frontend/)
npm start
```

### Run All E2E Tests
```bash
npx playwright test
```

### Run Specific Suite
```bash
npx playwright test tests/auth
npx playwright test tests/users
```

### Run in Headed Mode (see browser)
```bash
npx playwright test --headed
```

### Run in Debug Mode
```bash
npx playwright test --debug
```

### Run Specific Browser
```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

## Test Writing Guidelines

### 1. Use Page Object Model
```typescript
// ❌ BAD: Direct selectors in test
test('should login', async ({ page }) => {
  await page.goto('http://localhost:4200/login');
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');
});

// ✅ GOOD: Use Page Object
test('should login', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login('test@example.com', 'password123');
  await loginPage.expectLoginSuccess();
});
```

### 2. Use Test Helpers
```typescript
// ❌ BAD: Duplicate authentication in every test
test('should create user', async ({ page }) => {
  await page.goto('http://localhost:4200/login');
  await page.fill('input[name="email"]', 'admin@example.com');
  await page.fill('input[name="password"]', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard');
  // Now test user creation...
});

// ✅ GOOD: Use auth helper
test('should create user', async ({ page }) => {
  await AuthHelper.loginAsAdmin(page);
  // Now test user creation...
});
```

### 3. Use Test Data Factory
```typescript
// ❌ BAD: Hardcoded test data
const user = {
  email: 'test@example.com',
  username: 'testuser',
  firstName: 'Test',
  lastName: 'User'
};

// ✅ GOOD: Use factory
const user = TestDataFactory.createUser({
  email: 'test@example.com' // Override specific fields
});
```

### 4. Clean Up After Tests
```typescript
test.afterEach(async () => {
  // Clean up test data
  await DatabaseHelper.cleanupTestData();
});
```

## Test Organization

### Naming Conventions
- **Test files**: `*.spec.ts`
- **Page Objects**: `*.page.ts`
- **Helpers**: `*.helper.ts`
- **Fixtures**: `*.json`

### Test Structure
```typescript
test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Setup for each test
  });

  test('should perform action successfully', async ({ page }) => {
    // Arrange
    const data = TestDataFactory.createUser();
    
    // Act
    const userPage = new UserFormPage(page);
    await userPage.createUser(data);
    
    // Assert
    await userPage.expectUserCreated(data.email);
  });

  test.afterEach(async () => {
    // Cleanup after each test
  });
});
```

## CI/CD Integration

Tests run automatically on:
- Pull requests
- Commits to main branch
- Nightly builds

See `.github/workflows/e2e-tests.yml` for CI configuration.

## Debugging Tests

### Visual Debugging
```bash
npx playwright test --debug
```

### Trace Viewer
```bash
npx playwright test --trace on
npx playwright show-trace trace.zip
```

### Screenshots on Failure
Automatically captured in `test-results/` directory.

## Best Practices

1. **Test Real User Flows**: Test complete workflows, not just individual pages
2. **Independent Tests**: Each test should run independently
3. **Stable Selectors**: Use data-testid attributes, not brittle CSS selectors
4. **Wait for Content**: Always wait for elements/network requests
5. **Clean State**: Start each test with clean database state
6. **Meaningful Assertions**: Assert on visible user outcomes
7. **Fast Tests**: Use API helpers to set up state quickly
8. **No Flaky Tests**: Fix intermittent failures immediately

## Performance Targets

- **Individual Test**: < 30 seconds
- **Full Suite**: < 15 minutes
- **Parallel Execution**: Max 4 workers

## Coverage Goals

- **Critical Paths**: 100% E2E coverage
- **User Management**: All CRUD operations
- **Role Management**: All CRUD + permissions
- **Authentication**: Login, logout, password reset
- **Authorization**: Permission checks, role-based access

## Troubleshooting

### Tests Timeout
- Check if backend/frontend are running
- Verify database is accessible
- Check for network issues

### Database Connection Failed
```bash
# Restart test database
docker-compose -f e2e/docker/docker-compose.yml restart
```

### Port Conflicts
- Frontend should use port 4200
- Backend should use port 3000
- Test DB should use port 1434

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Page Object Model Guide](https://playwright.dev/docs/pom)
- [Best Practices](https://playwright.dev/docs/best-practices)
