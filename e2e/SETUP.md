# E2E Tests Setup Guide

## Prerequisites

- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **Docker**: For test database
- **Backend**: Running on port 3000
- **Frontend**: Running on port 4200

## Installation Steps

### 1. Navigate to E2E Directory
```powershell
cd d:\CCMS\src\ccms-web-app\e2e
```

### 2. Install Dependencies
```powershell
npm install
```

### 3. Install Playwright Browsers
```powershell
npm run install:browsers
```

This will download Chromium, Firefox, and WebKit browsers for testing.

### 4. Setup Environment Variables
```powershell
# Copy the example file
Copy-Item .env.example .env

# Edit .env with your configuration (if needed)
notepad .env
```

### 5. Start Test Database
```powershell
npm run db:up
```

Wait about 30 seconds for the database to initialize. You can check the logs:
```powershell
npm run db:logs
```

### 6. Verify Database is Running
```powershell
# Check if container is running
docker ps

# Should see: ccms-test-db
```

### 7. Start Backend Server
In a new terminal:
```powershell
cd ..\backend
npm run dev
```

### 8. Start Frontend Server
In another new terminal:
```powershell
cd ..\frontend
npm start
```

### 9. Run E2E Tests
```powershell
# Back in e2e directory
cd ..\e2e

# Run all tests
npm test

# Or run specific test suite
npm run test:auth
```

## Running Tests

### Run All Tests
```powershell
npm test
```

### Run Tests in Headed Mode (See Browser)
```powershell
npm run test:headed
```

### Run Tests in Debug Mode
```powershell
npm run test:debug
```

### Run Tests in Specific Browser
```powershell
npm run test:chromium
npm run test:firefox
npm run test:webkit
```

### Run Mobile Tests
```powershell
npm run test:mobile
```

### Run Specific Test Suite
```powershell
npm run test:auth      # Authentication tests
npm run test:users     # User management tests
npm run test:roles     # Role management tests
```

### Run Test UI Mode (Interactive)
```powershell
npm run test:ui
```

### View Test Report
```powershell
npm run report
```

## Database Management

### Start Database
```powershell
npm run db:up
```

### Stop Database
```powershell
npm run db:down
```

### Restart Database
```powershell
npm run db:restart
```

### View Database Logs
```powershell
npm run db:logs
```

### Connect to Database
You can connect to the test database using SQL Server Management Studio:
- **Server**: localhost,1434
- **Database**: ccms_test
- **Authentication**: SQL Server Authentication
- **Login**: sa
- **Password**: YourStrong@Passw0rd

## Troubleshooting

### Tests Fail with "Cannot connect to server"

**Cause**: Backend or frontend not running

**Solution**:
```powershell
# Check if backend is running
curl http://localhost:3000/health

# Check if frontend is running
curl http://localhost:4200

# Start them if not running
```

### Database Connection Errors

**Cause**: Database container not running or not initialized

**Solution**:
```powershell
# Restart database
npm run db:down
npm run db:up

# Wait 30 seconds for initialization
Start-Sleep -Seconds 30

# Check logs
npm run db:logs
```

### Port Already in Use

**Cause**: Another application is using port 1434, 3000, or 4200

**Solution**:
```powershell
# Find what's using the port (example for port 3000)
netstat -ano | findstr :3000

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

### Playwright Browsers Not Installed

**Cause**: Browsers not downloaded

**Solution**:
```powershell
npm run install:browsers
```

### Tests Are Flaky

**Cause**: Network issues or slow response times

**Solution**:
1. Increase timeout in `playwright.config.ts`
2. Run tests with fewer workers: `npx playwright test --workers=1`
3. Check backend/frontend logs for errors

### Cannot Find Module Errors

**Cause**: TypeScript path aliases not configured

**Solution**:
```powershell
# Reinstall dependencies
Remove-Item node_modules -Recurse -Force
Remove-Item package-lock.json -Force
npm install
```

## Best Practices

### 1. Keep Tests Independent
Each test should be able to run independently. Don't rely on test execution order.

### 2. Use Page Objects
Always use Page Objects instead of direct selectors in tests.

### 3. Use Helpers for Common Actions
Use AuthHelper, DatabaseHelper, etc. for common operations.

### 4. Clean Up Test Data
Always clean up test data in `afterEach` or `afterAll` hooks.

### 5. Use Meaningful Test Names
Test names should clearly describe what is being tested.

### 6. Use Test Data Factory
Use TestDataFactory for generating test data instead of hardcoding.

### 7. Wait for Elements
Always wait for elements to be visible/loaded before interacting.

### 8. Use Assertions
Always assert expected outcomes, don't just check for no errors.

## Writing New Tests

### 1. Create Test File
```powershell
# Example: user CRUD tests
New-Item -Path "tests/users/user-crud.spec.ts" -ItemType File
```

### 2. Import Required Dependencies
```typescript
import { test, expect } from '@playwright/test';
import { LoginPage } from '../../page-objects/login.page';
import { AuthHelper } from '../../helpers/auth.helper';
import { TestDataFactory } from '../../helpers/test-data.factory';
```

### 3. Write Test Structure
```typescript
test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Setup
  });

  test('should do something', async ({ page }) => {
    // Test implementation
  });

  test.afterEach(async () => {
    // Cleanup
  });
});
```

### 4. Run Your New Tests
```powershell
npx playwright test tests/users/user-crud.spec.ts
```

## CI/CD Integration

Tests automatically run on:
- Pull requests
- Commits to main branch
- Nightly builds

See `.github/workflows/e2e-tests.yml` for CI configuration.

## Performance Tips

### Speed Up Tests

1. **Use API for Setup**: Use ApiHelper to create test data instead of UI
2. **Parallel Execution**: Tests run in parallel by default
3. **Skip Login UI**: Use `AuthHelper.quickAuth()` for faster authentication
4. **Selective Testing**: Run only the tests you need during development

### Example: Fast Authentication
```typescript
// ❌ Slow: Login via UI every time
test('should do something', async ({ page }) => {
  await AuthHelper.loginAsAdmin(page);
  // Test logic...
});

// ✅ Fast: Use API login
test('should do something', async ({ page }) => {
  await AuthHelper.quickAuth(page, 'admin');
  // Test logic...
});
```

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Page Object Model Guide](https://playwright.dev/docs/pom)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [CI/CD Setup](https://playwright.dev/docs/ci)

## Support

For issues or questions:
1. Check this guide first
2. Review Playwright documentation
3. Check backend/frontend logs
4. Ask team for help

## Next Steps

After successful setup:
1. ✅ Run authentication tests: `npm run test:auth`
2. ✅ Review test results and reports
3. ✅ Write tests for users module
4. ✅ Write tests for roles module
5. ✅ Add more test coverage
