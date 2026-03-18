# Master Data Sub-forms E2E Tests

This directory contains end-to-end tests for **sub-forms** (related entities) of master data modules.

## Overview

Sub-forms are additional forms that manage related entities within a parent module. These tests verify CRUD operations for child entities that are accessed through tabs or sections in the parent entity's detail/view page.

## Test Coverage

### ✅ Member Sub-forms (5 test specs - COMPLETE)

#### 1. Member Addresses (`member-addresses.spec.ts`)
Tests address management for policy holders including:
- **Operations**: CREATE, READ, UPDATE, DELETE
- **Fields Tested**:
  - Address Type (Residential, Mailing, Business)
  - Address Line 1 & 2
  - City, State, Postcode
  - Country
  - Primary address flag
- **Validations**: Required fields, address type selection
- **Test Count**: 7 tests (including setup/cleanup)

**Key Features**:
- Multiple address types per member
- Primary address designation
- Complete address information

#### 2. Member Contacts (`member-contacts.spec.ts`)
Tests contact information management including:
- **Operations**: CREATE, READ, UPDATE, DELETE
- **Fields Tested**:
  - Contact Type (Mobile, Phone, Email, Fax)
  - Contact Value (phone number, email address)
  - Contact Name
  - Relationship
  - Primary contact flag
  - Emergency contact flag
- **Validations**: Required fields, contact type selection
- **Test Count**: 8 tests (including setup/cleanup)

**Key Features**:
- Multiple contact methods per member
- Primary contact designation
- Emergency contact flagging
- Phone and email validation

#### 3. Member Dependents (`member-dependents.spec.ts`)
Tests dependent/family member management including:
- **Operations**: CREATE, READ, UPDATE, DELETE
- **Fields Tested**:
  - Full Name
  - IC Number/NRIC
  - Relationship (Spouse, Child, Parent, Sibling)
  - Date of Birth
  - Gender
  - Active status
- **Validations**: Required fields, relationship selection
- **Test Count**: 8 tests (including setup/cleanup)

**Key Features**:
- Multiple dependents per member (spouse, children)
- Relationship tracking
- Age calculation from date of birth
- Active/inactive status management

#### 4. Member Policies (`member-policies.spec.ts`)
Tests policy assignment and coverage management including:
- **Operations**: CREATE, READ, UPDATE, DELETE
- **Fields Tested**:
  - Product/Plan Selection
  - Policy Number
  - Effective Date & Expiry Date
  - Policy Status (Active, Expired, Cancelled, etc.)
  - Premiupolicy-form.page.ts` - Policy assignment form interactions
- `member-pec-form.page.ts` - Pre-existing condition form interactions
- `member-m Amount
  - Coverage Amount (Sum Insured)
  - Remarks/Notes
- **Validations**: Required fields, date ranges, numeric amounts
- **Test Count**: 8 tests (including setup/cleanup)

**Key Features**:
- Multiple policy assignments per member
- Policy lifecycle tracking (activation, expiry)
- Premium and coverage amount tracking
- Status management for different policy states

#### 5. Member PEC - Pre-Existing Conditions (`member-pec.spec.ts`)
Tests medical history and pre-existing condition management including:
- **Operations**: CREATE, READ, UPDATE, DELETE
- **Fields Tested**:
  - Condition Name & Code (ICD-10)
  - Diagnosis Date
  - Severity Level (Mild, Moderate, Severe)
  - Status (Under Treatment, Recovering, Chronic, Resolved)
  - Description & Treatment details
  - Doctor Name & Hospital
  - Exclusion Flag (coverage exclusion)
- **Validations**: Required fields, severity and status selection
- **Test Count**: 9 tests (including setup/cleanup)

**Key Features**:
- Multiple PEC records per member
- Severity and status tracking
- Medical provider information
- Coverage exclusion management
- Condition history documentation

## Test Architecture

### Page Object Model

Each sub-form has dedicated page objects:
- `member-address-form.page.ts` - Address form interactions
- `member-contact-form.page.ts` - Contact form interactions
- `member-dependent-form.page.ts` - Dependent form interactions
- `member-view.page.ts` - Parent view page with tab navigation

### Test Pattern

```typescript
test.describe.serial('Sub-form - CRUD Operations', () => {
  // 1. SETUP: Create parent entity (member)
  // 2. CREATE: Add sub-entity
  // 3. VALIDATION: Test required fields
  // 4. READ: Verify display
  // 5. UPDATE: Edit sub-entity
  // 6. DELETE: Remove sub-entity
  // 7. CLEANUP: Delete parent entity
});
```

### Key Characteristics

- **Serial Execution**: Tests run sequentially to maintain data dependencies
- **Parent Entity Setup**: Each test suite creates a parent member
- **Tab Navigation**: Tests navigate to appropriate tabs in view page
- **Cleanup**: Tests clean up both child and parent entities
- **Timestamp-based Data**: Unique identifiers prevent conflicts

## Running the Tests

### Run All Master Data Tests
```bash
npm run test:master-data
```

### Run Main Master Data Tests (Banks, Hospitals, etc.)
```bash
npm run test:master-data:main
```

### Run Sub-form Tests Only
```bash
npm run test:master-data:subforms
```All Member Sub-forms (Addresses, Contacts, Dependents, Policies, PEC)
```bash
npm run test:master-data:members
```

### Run Specific Sub-form Test
```bash
# Member Addresses
npx playwright test tests/master-data/member-addresses.spec.ts --project=chromium

# Member Contacts
npx playwright test tests/master-data/member-contacts.spec.ts --project=chromium

# Member Dependents
npx playwright test tests/master-data/member-dependents.spec.ts --project=chromium

# Member Policies
npx playwright test tests/master-data/member-policies.spec.ts --project=chromium

# Member PEC (Pre-Existing Conditions)
npx playwright test tests/master-data/member-pec
# Member Dependents
npx playwright test tests/master-data/member-dependents.spec.ts --project=chromium
```

### Run with UI Mode (Interactive)
```bash
npx playwright test tests/master-data/member-addresses.spec.ts --project=chromium --ui
```

## Test Data

All tests use timestamp-based unique identifiers:
```typescript
const timestamp = Date.now();
const testMemberIc = `ADDR${timestamp}`; // For addresses test
const testDependentName = `E2E Dependent ${timestamp}`;
```

This ensures:
- ✅ No conflicts between test runs
- ✅ Easy identification of test data
- ✅ Proper cleanup verification

## Expected Results

### Success Criteria
- ✅ Member Policies**: ~50-65 seconds (tests policy assignments)
- **Member PEC**: ~55-75 seconds (tests multiple PEC records)
- **Total Member Sub-forms**: ~4-5.5ete successfully
- ✅ Form validations prevent invalid submissions
- ✅ Data persists correctly after creation/update
- ✅ Related entities display in parent view
- ✅ Deletion removes entities completely
- ✅ No orphaned test data after cleanup

### Execution Time
- **Member Addresses**: ~45-60 seconds
- **Member Contacts**: ~50-70 seconds (tests multiple contact types)
- **Member Dependents**: ~50-70 seconds (tests multiple dependents)
- **Total Sub-forms**: ~2.5-3 minutes

## Future Sub-form Tests

### Planned Implement
- [x] **Member Addresses** - ✅ Complete
- [x] **Member Contacts** - ✅ Complete
- [x] **Member Dependents** - ✅ Complete
- [x] **Member Policies** - ✅ Complete
- [x] **Member PEC** - ✅ Complete
- [ ] **Member Policies** - Policy assignments
- [ ] **Member PEC** - Pre-existing conditions

#### Hospital Sub-forms
- [ ] **Hospital Staff** - Staff members
- [ ] **Hospital Addresses** - Hospital locations
- [ ] **Hospital Contacts** - Contact persons
- [ ] **Hospital Fees** - Service fees
- [ ] **Hospital Codes** - Hospital coding systems

#### Product Sub-forms
- [ ] **Product Limits** - Coverage limits
- [ ] **Product Copay** - Co-payment rules

## Troubleshooting

### Common Issues

**Issue**: "Member not found" error
- **Cause**: Parent member creation failed in SETUP
- **Solution**: Check member creation permissions and form validation

**Issue**: "Tab not visible" error
- **Cause**: View page structure changed or loading incomplete
- **Solution**: Increase wait time after page load, verify tab selectors

**Issue**: Tests fail after first test
- **Cause**: Dialog confirmations not being accepted
- **Solution**: Ensure `authenticatedPage.on('dialog', ...)` is set before delete operations

**Issue**: Duplicate data errors
- **Cause**: Previous test data not cleaned up
- **Solution**: Run cleanup manually or check CLEANUP test passes

### Debug Mode

Run tests in debug mode to step through operations:
```bash
npx playwright test tests/master-data/member-addresses.spec.ts --debug
```

## Benefits of Sub-form Testing

1. **Comprehensive Coverage**: Tests complex relationships between entities
2. **Real-world Scenarios**: Mimics actual user workflows (create member → add address/contacts)
3. **Data Integrity**: Verifies parent-child relationships maintained correctly
4. **UI Navigation**: Tests tab-based navigation and multi-step forms
5. **Permission Testing**: Ensures sub-forms respect parent entity permissions

## Related Documentation

- [Master Data README](./README.md) - Main master data tests documentation
- [E2E Package.json](../../package.json) - Available npm scripts
- [Playwright Config](../../playwright.config.ts) - Test configuration
- [Coding Standards](../../../docs/coding-standards.md) - Project coding standards
5 | ✅ Complete |
| **Page Objects Created** | 6 | ✅ Complete |
| **Total Test Cases** | 40 | ✅ Complete |
| **CREATE Tests** | 7 | ✅ Complete |
| **UPDATE Tests** | 6 | ✅ Complete |
| **DELETE Tests** | 5 | ✅ Complete |
| **VALIDATION Tests** | 5 | ✅ Complete |
| **READ Tests** | 5 | ✅ Complete |
| **Member Sub-forms** | 5 of 5 | ✅ 100% Complete |
| **All Sub-forms Covered** | 5 of 10 | 🟡 50% |

**Current Progress**: 50% of planned sub-forms implemented (5/10)
**Member Module**: ✅ 100% Complete (All 5 sub-forms)
**Remaining**: 7 sub-forms ( |
| **READ Tests** | 3 | ✅ Complete |
| **Sub-forms Covered** | 3 of 10 | 🟡 30% |

**Current Progress**: 30% of planned sub-forms implemented (3/10)
**Remaining**: 7 sub-forms (2 Member + 5 Hospital + 2 Product)
