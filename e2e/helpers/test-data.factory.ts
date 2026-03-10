import { faker } from '@faker-js/faker';

/**
 * Test Data Factory - Generate consistent test data
 * 
 * Following coding-standards.md principles:
 * - REUSABILITY: Test data generation used across all tests
 * - COMMONIZATION: Centralized test data creation
 * - DRY: No duplicate test data in tests
 * 
 * Uses Faker.js for realistic test data generation.
 */

export class TestDataFactory {
  /**
   * Create test user data
   * @param overrides - Override specific fields
   */
  static createUser(overrides?: Partial<{
    email: string;
    username: string;
    password: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    isActive: boolean;
  }>) {
    const firstName = overrides?.firstName || faker.person.firstName();
    const lastName = overrides?.lastName || faker.person.lastName();
    const username = overrides?.username || faker.internet.userName({ firstName, lastName });

    return {
      email: overrides?.email || faker.internet.email({ firstName, lastName }).toLowerCase(),
      username: username.toLowerCase(),
      password: overrides?.password || 'Test@123',
      firstName,
      lastName,
      phoneNumber: overrides?.phoneNumber || faker.phone.number(),
      isActive: overrides?.isActive ?? true,
    };
  }

  /**
   * Create multiple test users
   * @param count - Number of users to create
   */
  static createUsers(count: number) {
    return Array.from({ length: count }, () => this.createUser());
  }

  /**
   * Create test role data
   * @param overrides - Override specific fields
   */
  static createRole(overrides?: Partial<{
    roleName: string;
    roleCode: string;
    description: string;
    isActive: boolean;
  }>) {
    const roleName = overrides?.roleName || `${faker.company.buzzAdjective()} ${faker.person.jobTitle()}`;
    const roleCode = overrides?.roleCode || 
      roleName.toUpperCase().replace(/\s+/g, '_').replace(/[^A-Z_]/g, '');

    return {
      roleName,
      roleCode,
      description: overrides?.description || faker.lorem.sentence(),
      isActive: overrides?.isActive ?? true,
    };
  }

  /**
   * Create multiple test roles
   * @param count - Number of roles to create
   */
  static createRoles(count: number) {
    return Array.from({ length: count }, () => this.createRole());
  }

  /**
   * Create admin user data
   */
  static createAdminUser(overrides?: Partial<ReturnType<typeof TestDataFactory.createUser>>) {
    return this.createUser({
      ...overrides,
      email: overrides?.email || `admin.${faker.string.alphanumeric(8)}@test.com`,
      username: overrides?.username || `admin_${faker.string.alphanumeric(6)}`,
    });
  }

  /**
   * Create regular user data
   */
  static createRegularUser(overrides?: Partial<ReturnType<typeof TestDataFactory.createUser>>) {
    return this.createUser({
      ...overrides,
      email: overrides?.email || `user.${faker.string.alphanumeric(8)}@test.com`,
      username: overrides?.username || `user_${faker.string.alphanumeric(6)}`,
    });
  }

  /**
   * Create test claim data (for future use)
   * @param overrides - Override specific fields
   */
  static createClaim(overrides?: Partial<{
    claimNumber: string;
    claimantName: string;
    claimType: string;
    claimAmount: number;
    status: string;
    description: string;
  }>) {
    return {
      claimNumber: overrides?.claimNumber || `CLM-${faker.string.numeric(8)}`,
      claimantName: overrides?.claimantName || faker.person.fullName(),
      claimType: overrides?.claimType || faker.helpers.arrayElement(['Medical', 'Dental', 'Disability', 'Life']),
      claimAmount: overrides?.claimAmount || parseFloat(faker.finance.amount({ min: 100, max: 50000, dec: 2 })),
      status: overrides?.status || faker.helpers.arrayElement(['Pending', 'Approved', 'Rejected', 'In Review']),
      description: overrides?.description || faker.lorem.paragraph(),
    };
  }

  /**
   * Create test member data (for future use)
   * @param overrides - Override specific fields
   */
  static createMember(overrides?: Partial<{
    memberNumber: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    email: string;
    phoneNumber: string;
    address: string;
    membershipType: string;
  }>) {
    return {
      memberNumber: overrides?.memberNumber || `MEM-${faker.string.numeric(8)}`,
      firstName: overrides?.firstName || faker.person.firstName(),
      lastName: overrides?.lastName || faker.person.lastName(),
      dateOfBirth: overrides?.dateOfBirth || faker.date.birthdate({ min: 18, max: 80, mode: 'age' }).toISOString().split('T')[0],
      email: overrides?.email || faker.internet.email().toLowerCase(),
      phoneNumber: overrides?.phoneNumber || faker.phone.number(),
      address: overrides?.address || faker.location.streetAddress(true),
      membershipType: overrides?.membershipType || faker.helpers.arrayElement(['Individual', 'Family', 'Corporate']),
    };
  }

  /**
   * Create test permission data
   * @param overrides - Override specific fields
   */
  static createPermission(overrides?: Partial<{
    moduleName: string;
    moduleCode: string;
    actionName: string;
    actionCode: string;
  }>) {
    const moduleName = overrides?.moduleName || faker.company.buzzNoun();
    const moduleCode = overrides?.moduleCode || 
      moduleName.toUpperCase().replace(/\s+/g, '_');

    const actionName = overrides?.actionName || faker.helpers.arrayElement(['View', 'Create', 'Edit', 'Delete']);
    const actionCode = overrides?.actionCode || actionName.toUpperCase();

    return {
      moduleName,
      moduleCode,
      actionName,
      actionCode,
    };
  }

  /**
   * Generate random string
   * @param length - String length
   */
  static randomString(length: number = 10): string {
    return faker.string.alphanumeric(length);
  }

  /**
   * Generate random email
   */
  static randomEmail(): string {
    return faker.internet.email().toLowerCase();
  }

  /**
   * Generate random username
   */
  static randomUsername(): string {
    return faker.internet.userName().toLowerCase();
  }

  /**
   * Generate random phone number
   */
  static randomPhone(): string {
    return faker.phone.number();
  }

  /**
   * Generate random date
   * @param options - Date generation options
   */
  static randomDate(options?: { min?: Date; max?: Date }): Date {
    return faker.date.between({ 
      from: options?.min || new Date(2020, 0, 1), 
      to: options?.max || new Date() 
    });
  }

  /**
   * Generate unique test email
   * @param prefix - Email prefix
   */
  static uniqueEmail(prefix: string = 'test'): string {
    return `${prefix}.${faker.string.alphanumeric(8)}@test.com`;
  }

  /**
   * Generate unique test username
   * @param prefix - Username prefix
   */
  static uniqueUsername(prefix: string = 'test'): string {
    return `${prefix}_${faker.string.alphanumeric(8)}`;
  }

  /**
   * Generate random password (strong)
   */
  static randomPassword(): string {
    const password = faker.internet.password({ length: 12 });
    return `${password}@123`; // Ensure it meets password requirements
  }

  /**
   * Generate weak password (for testing validation)
   */
  static weakPassword(): string {
    return faker.internet.password({ length: 5 });
  }

  /**
   * Generate invalid email (for testing validation)
   */
  static invalidEmail(): string {
    return faker.lorem.word(); // Just a word, not an email
  }
}
