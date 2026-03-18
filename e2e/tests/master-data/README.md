# Master Data E2E Tests

This directory contains comprehensive end-to-end tests for all Master Data modules in the CCMS application.

## Overview

Master Data modules are fundamental reference data management components that support the core business operations of the Claims and Case Management System.

## Test Coverage

### 1. Banks Management (`banks-operations.spec.ts`)
Tests for bank master data management:
- **CREATE**: Create new bank records
- **READ**: Display and search banks
- **UPDATE**: Modify bank details
- **DELETE**: Remove bank records
- **VALIDATION**: Field validation and duplicate checking

**Test Data Fields:**
- `bank_code`: Unique bank identifier
- `bank_name`: Bank name
- `is_active`: Active status

### 2. Hospitals Management (`hospitals-operations.spec.ts`)
Tests for hospital/provider master data:
- **CREATE**: Register new hospitals
- **READ**: View hospital details
- **UPDATE**: Update hospital information
- **DELETE**: Remove hospital records
- **VALIDATION**: Required field validation

**Test Data Fields:**
- `hospital_code`: Unique hospital identifier
- `hospital_name`: Hospital name
- `hospital_type`: Type of hospital (Private/Government/etc.)
- `is_panel`: Panel hospital status

### 3. Clauses Management (`clauses-operations.spec.ts`)
Tests for policy clause management:
- **CREATE**: Add new clauses
- **READ**: Display clause details
- **UPDATE**: Modify clause text
- **DELETE**: Remove clauses
- **VALIDATION**: Required field validation

**Test Data Fields:**
- `clause_code`: Unique clause identifier
- `clause_text`: Clause description
- `clause_category`: Clause category
- `is_active`: Active status

### 4. Products Management (`products-operations.spec.ts`)
Tests for insurance product/policy management:
- **CREATE**: Create new products/plans
- **READ**: View product details
- **UPDATE**: Update product information
- **DELETE**: Remove products
- **VALIDATION**: Required field validation

**Test Data Fields:**
- `plan_code`: Unique plan identifier
- `plan_name`: Plan name
- `insurer_name`: Insurance provider
- `is_active`: Active status

### 5. Lookups Management (`lookups-operations.spec.ts`)
Tests for system lookup values:
- **CREATE**: Add new lookup values
- **READ**: Display lookup values
- **UPDATE**: Modify lookup values
- **DELETE**: Remove lookup values
- **VALIDATION**: Required field validation

**Test Data Fields:**
- `lookup_code`: Unique lookup identifier
- `lookup_value`: Display value
- `category`: Lookup category
- `display_order`: Sort order
- `is_active`: Active status

### 6. Members Management (`members-operations.spec.ts`)
Tests for policy holder (member) management:
- **CREATE**: Register new members
- **READ**: View member details
- **UPDATE**: Update member information
- **DELETE**: Remove member records
- **VALIDATION**: Required field validation

**Test Data Fields:**
- `full_name`: Member full name
- `ic_no`: National ID number
- `member_type`: Type of member (Principal/Dependent)
- `member_status`: Member status (Active/Inactive/etc.)

## Test Architecture

### Page Object Model
Each module follows the Page Object Model (POM) pattern with two page objects:
- **List Page**: Represents the data grid/list view
- **Form Page**: Represents the create/edit modal/form

Page objects are located in: `e2e/page-objects/master-data/`

### Test Pattern
All tests follow a consistent serial execution pattern:
```typescript
test.describe.serial('Module Management - CRUD Operations', () => {
  // 1. CREATE test
  // 2. VALIDATION tests
  // 3. READ test
  // 4. UPDATE test
  // 5. DELETE test
});
```

### Test Data Management
- Uses timestamp-based unique identifiers to avoid conflicts
- Pattern: `E2E_[MODULE]_${timestamp}`
- Ensures test isolation and prevents interference

### Delete Protection
All DELETE tests include fail-fast verification:
```typescript
const row = authenticatedPage.locator(`tr:has-text("${testCode}")`);
await expect(row).toBeVisible({ timeout: 10000 });
```
This ensures:
- Test fails immediately if CREATE didn't succeed
- No system data is accidentally deleted
- Clear error messages for debugging

## Running the Tests

### Run All Master Data Tests
```bash
cd e2e
npm run test:chromium -- tests/master-data
```

### Run Specific Module Tests
```bash
# Banks
npm run test:chromium -- tests/master-data/banks-operations.spec.ts

# Hospitals
npm run test:chromium -- tests/master-data/hospitals-operations.spec.ts

# Clauses
npm run test:chromium -- tests/master-data/clauses-operations.spec.ts

# Products
npm run test:chromium -- tests/master-data/products-operations.spec.ts

# Lookups
npm run test:chromium -- tests/master-data/lookups-operations.spec.ts

# Members
npm run test:chromium -- tests/master-data/members-operations.spec.ts
```

### Generate Reports
```bash
# Run tests and generate Allure report
npm test
npm run report:allure
```

## Prerequisites

- Frontend server running on `http://localhost:4200`
- Backend API running on `http://localhost:3000`
- Database with proper ACL permissions
- User with VIEW permissions for each module

## Required Permissions

Each module requires the Super Admin user to have VIEW permissions:
- `BANK_MGMT` - VIEW
- `HOSPITAL_MGMT` - VIEW
- `CLAUSE_MGMT` - VIEW
- `POLICY_MGMT` - VIEW (Products)
- `LOOKUP_MGMT` - VIEW
- `POLICY_HOLDERS` - VIEW (Members)

## Test Features

### ✅ Comprehensive Coverage
- All CRUD operations tested
- Validation scenarios covered
- Search functionality verified
- Error handling tested

### ✅ Isolation & Safety
- Timestamp-based unique identifiers
- Serial execution for data dependencies
- Fail-fast DELETE protection
- No system data corruption

### ✅ Maintainability
- Page Object Model for reusability
- Consistent test patterns
- Clear naming conventions
- Comprehensive documentation

### ✅ Debugging Support
- Clear test descriptions
- Descriptive locators
- Explicit wait strategies
- Screenshot on failure
- Video recording

## Troubleshooting

### Tests Fail with "Access Denied"
- Verify user has VIEW permissions for the module
- Check ACL configuration in database
- Ensure module-action mappings exist

### Tests Fail on DELETE
- Check if CREATE test passed
- Verify test data exists before DELETE
- Check for dialog handlers

### Tests Timeout
- Ensure frontend/backend servers are running
- Check network connectivity
- Verify page load performance
- Increase timeout values if needed

### Search Returns No Results
- Verify search functionality in UI
- Check debounce timing (500ms)
- Ensure test data was created successfully

## Best Practices

1. **Always run CREATE before DELETE** - Serial execution ensures order
2. **Use unique identifiers** - Timestamp-based codes prevent conflicts
3. **Verify before DELETE** - Fail-fast pattern prevents wrong data deletion
4. **Wait after search** - Allow debounce time (500ms)
5. **Handle dialogs** - Setup dialog handlers for confirmations
6. **Check permissions** - Ensure proper ACL configuration

## Future Enhancements

- [ ] Add bulk operation tests
- [ ] Test export/import functionality
- [ ] Add performance benchmarks
- [ ] Test concurrent user operations
- [ ] Add data integrity validation
- [ ] Test audit trail logging

## Related Documentation

- [E2E Testing Guide](../ALLURE-SETUP.md)
- [Page Object Base Class](../page-objects/base.page.ts)
- [Coding Standards](../../docs/coding-standards.md)
- [Permission Control System](../../docs/PERMISSION-CONTROL-SYSTEM.md)
