# Coding Standards - CCMS Web Application

## Overview
This document defines the coding standards, best practices, and conventions for the CCMS (Claims & Case Management System) web application across **both frontend (Angular) and backend (Node.js/Express)**. **The primary focus is on three core principles: REUSABILITY, MODULARIZATION, and COMMONIZATION to minimize code duplication, maximize maintainability, reduce bundle size, and achieve a lean, efficient application.**

### Technology Stack Covered
- **Frontend**: Angular, TypeScript, Tailwind CSS, RxJS
- **Backend**: Node.js, Express.js, TypeScript, MS SQL Server

### Document Structure
1. **Part I: Universal Principles** - Core principles applicable to both frontend and backend
2. **Part II: Frontend Standards** - Angular-specific coding standards and patterns
3. **Part III: Backend Standards** - Node.js/Express-specific coding standards and patterns
4. **Part IV: Testing & Quality** - Testing strategies for both frontend and backend
5. **Part V: Performance & Bundle Optimization** - Optimization for both layers

---

# PART I: UNIVERSAL PRINCIPLES
*Applicable to both Frontend and Backend*

---

## 🎯 THREE PILLARS OF CLEAN CODE

### 1️⃣ REUSABILITY - Write Once, Use Everywhere
- **Reduces bundle size** by 40-60% through code sharing
- **Eliminates duplicate code** across modules and components
- **Faster development** - write once, use everywhere
- **Easier maintenance** - fix bugs in one place
- **Consistent behavior** across the application

### 2️⃣ MODULARIZATION - Organize by Domain
- **Clear boundaries** between different business domains
- **Independent modules** that can be developed/tested separately
- **Lazy loading** - load only what's needed
- **Team scalability** - multiple teams can work in parallel
- **Code isolation** - changes don't ripple across unrelated areas

### 3️⃣ COMMONIZATION - Identify & Extract Common Patterns
- **Shared functionality** consolidated in one place
- **Common modules** for cross-cutting concerns
- **Pattern recognition** - spot similarities early
- **Standardization** - consistent approach to common problems
- **App thinning** - smaller, faster, more efficient application

---

## 🧱 MODULARIZATION STRATEGY

### Module Architecture

```
src/app/
├── core/                      # Singleton services, app-wide (imported once)
│   ├── services/
│   ├── guards/
│   ├── interceptors/
│   └── core.module.ts
│
├── shared/                    # Reusable components/pipes/directives (imported everywhere)
│   ├── components/
│   ├── pipes/
│   ├── directives/
│   ├── models/
│   ├── utils/
│   └── shared.module.ts
│
├── common/                    # Common business logic shared across features
│   ├── services/              # Common services (not singleton)
│   ├── components/            # Common business components
│   ├── models/                # Common domain models
│   └── common.module.ts
│
├── features/                  # Feature modules (lazy loaded)
│   ├── claims/                # Claims feature module
│   │   ├── components/
│   │   ├── services/
│   │   ├── models/
│   │   ├── claims-routing.module.ts
│   │   └── claims.module.ts
│   │
│   ├── users/                 # Users feature module
│   │   ├── components/
│   │   ├── services/
│   │   ├── models/
│   │   ├── users-routing.module.ts
│   │   └── users.module.ts
│   │
│   └── [other-features]/
│
└── app.module.ts              # Root module (imports core & shared only)
```

### Module Types & Their Purpose

#### 🔵 Core Module (Singleton)
**Purpose**: App-wide singleton services, loaded once
**Import**: Only in `AppModule`
**Contains**:
- Authentication service
- API service
- Logger service
- Global state services
- HTTP interceptors
- Route guards

```typescript
// ✅ GOOD: Core module structure
@NgModule({
  imports: [
    CommonModule,
    HttpClientModule
  ],
  providers: [
    AuthService,        // Singleton
    ApiService,         // Singleton
    LoggerService,      // Singleton
    RoleService,        // Singleton
    SidebarService,     // Singleton
    // Guards
    AuthGuard,
    RoleGuard,
    // Interceptors
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true }
  ]
})
export class CoreModule {
  // Prevent re-import
  constructor(@Optional() @SkipSelf() parentModule: CoreModule) {
    if (parentModule) {
      throw new Error('CoreModule is already loaded. Import it in AppModule only.');
    }
  }
}
```

#### 🟪 Shared Module (Reusable UI)
**Purpose**: Reusable UI components, pipes, directives
**Import**: In every feature module that needs them
**Contains**:
- Dumb/presentational components
- Pipes (formatting, transformation)
- Directives (behavior, styling)
- UI utilities

```typescript
// ✅ GOOD: Shared module structure
@NgModule({
  declarations: [
    // Components
    ButtonComponent,
    CardComponent,
    ModalComponent,
    TableComponent,
    PaginationComponent,
    LoadingSpinnerComponent,
    // Pipes
    PhonePipe,
    DateFormatPipe,
    FileSizePipe,
    TruncatePipe,
    // Directives
    HighlightDirective,
    LoadingDirective,
    TooltipDirective
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule
  ],
  exports: [
    // Export Angular modules
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    // Export all declarations
    ButtonComponent,
    CardComponent,
    ModalComponent,
    TableComponent,
    PaginationComponent,
    LoadingSpinnerComponent,
    PhonePipe,
    DateFormatPipe,
    FileSizePipe,
    TruncatePipe,
    HighlightDirective,
    LoadingDirective,
    TooltipDirective
  ]
})
export class SharedModule {}
```

#### 🟢 Common Module (Shared Business Logic)
**Purpose**: Common business logic shared across features
**Import**: In feature modules that need common business functionality
**Contains**:
- Common business components (claim status badge, user avatar, etc.)
- Common business services (not singleton)
- Common domain models
- Common validators

```typescript
// ✅ GOOD: Common module structure
@NgModule({
  declarations: [
    // Common business components
    ClaimStatusBadgeComponent,     // Used in multiple features
    UserAvatarComponent,            // Used in multiple features
    DocumentPreviewComponent,       // Used in multiple features
    StatusTimelineComponent         // Used in multiple features
  ],
  imports: [
    CommonModule,
    SharedModule  // Import shared UI components
  ],
  exports: [
    ClaimStatusBadgeComponent,
    UserAvatarComponent,
    DocumentPreviewComponent,
    StatusTimelineComponent
  ]
})
export class CommonModule {}
```

#### 🟡 Feature Modules (Domain-Specific)
**Purpose**: Encapsulate specific business features
**Import**: Lazy loaded via routing
**Contains**:
- Feature-specific components
- Feature-specific services
- Feature-specific models
- Feature routing

```typescript
// ✅ GOOD: Feature module structure (Claims)
@NgModule({
  declarations: [
    ClaimsListComponent,
    ClaimDetailsComponent,
    ClaimCreateComponent,
    ClaimEditComponent
  ],
  imports: [
    SharedModule,      // Reusable UI
    CommonModule,      // Common business logic
    ClaimsRoutingModule
  ],
  providers: [
    ClaimService       // Feature-specific service
  ]
})
export class ClaimsModule {}
```

### When to Create a New Module

```typescript
// 🚨 ASK THESE QUESTIONS:

// 1. Is this a distinct business domain?
// YES -> Create feature module
// NO  -> Add to existing feature

// 2. Is this reusable UI with no business logic?
// YES -> Add to shared module
// NO  -> Continue

// 3. Is this business logic used across multiple features?
// YES -> Add to common module
// NO  -> Add to specific feature module

// 4. Is this a singleton service needed app-wide?
// YES -> Add to core module
// NO  -> Add to feature module
```

---

## 🔄 COMMONIZATION PATTERNS

### Identifying What Should Be Common

#### Rule of Three
**If you use something in 3+ places, make it common.**

```typescript
// ❌ BAD: Same logic in multiple features
// features/claims/claim.utils.ts
export function formatClaimId(id: string): string {
  return `CLM-${id.padStart(8, '0')}`;
}

// features/users/user.utils.ts
export function formatUserId(id: string): string {
  return `USR-${id.padStart(8, '0')}`;
}

// features/documents/document.utils.ts
export function formatDocumentId(id: string): string {
  return `DOC-${id.padStart(8, '0')}`;
}

// ✅ GOOD: Single common utility
// shared/utils/id-formatter.util.ts
export class IdFormatter {
  static format(id: string, prefix: string, length: number = 8): string {
    return `${prefix}-${id.padStart(length, '0')}`;
  }
  
  static formatClaimId(id: string): string {
    return this.format(id, 'CLM');
  }
  
  static formatUserId(id: string): string {
    return this.format(id, 'USR');
  }
  
  static formatDocumentId(id: string): string {
    return this.format(id, 'DOC');
  }
}

// Use everywhere
import { IdFormatter } from '@shared/utils/id-formatter.util';
const claimId = IdFormatter.formatClaimId('123');
```

### Common Component Extraction

```typescript
// ❌ BAD: Similar components in different features
// features/claims/components/claim-status.component.ts
@Component({
  selector: 'app-claim-status',
  template: `
    <span class="px-3 py-1 rounded-full text-sm" [ngClass]="getStatusClass()">
      {{ status }}
    </span>
  `
})
export class ClaimStatusComponent {
  @Input() status!: string;
  
  getStatusClass(): string {
    switch(this.status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }
}

// features/users/components/user-status.component.ts
@Component({
  selector: 'app-user-status',
  template: `
    <span class="px-3 py-1 rounded-full text-sm" [ngClass]="getStatusClass()">
      {{ status }}
    </span>
  `
})
export class UserStatusComponent {
  @Input() status!: string;
  
  getStatusClass(): string {
    switch(this.status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-yellow-100 text-yellow-800';
      case 'blocked': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }
}

// ✅ GOOD: Generic status badge component in common/shared
// common/components/status-badge/status-badge.component.ts
@Component({
  selector: 'app-status-badge',
  template: `
    <span 
      class="px-3 py-1 rounded-full text-sm font-medium"
      [ngClass]="badgeClasses">
      {{ label || status }}
    </span>
  `
})
export class StatusBadgeComponent {
  @Input() status!: string;
  @Input() label?: string;
  @Input() variant: 'success' | 'warning' | 'danger' | 'info' | 'default' = 'default';
  @Input() customClass?: string;
  
  get badgeClasses(): string {
    if (this.customClass) return this.customClass;
    
    const variants = {
      success: 'bg-green-100 text-green-800',
      warning: 'bg-yellow-100 text-yellow-800',
      danger: 'bg-red-100 text-red-800',
      info: 'bg-blue-100 text-blue-800',
      default: 'bg-gray-100 text-gray-800'
    };
    
    return variants[this.variant];
  }
}

// Use everywhere with different mappings
<app-status-badge [status]="claim.status" [variant]="getVariant(claim.status)"></app-status-badge>
<app-status-badge [status]="user.status" [variant]="getVariant(user.status)"></app-status-badge>
```

### Common Service Patterns

```typescript
// ✅ GOOD: Common data service for similar entities
// common/services/entity-list.service.ts
export abstract class EntityListService<T> {
  protected filters$ = new BehaviorSubject<any>({});
  protected sortBy$ = new BehaviorSubject<string>('created_at');
  protected sortOrder$ = new BehaviorSubject<'asc' | 'desc'>('desc');
  protected page$ = new BehaviorSubject<number>(1);
  
  // Common filtering logic
  setFilter(filters: any): void {
    this.filters$.next(filters);
    this.page$.next(1); // Reset to first page
  }
  
  // Common sorting logic
  setSort(column: string, order: 'asc' | 'desc'): void {
    this.sortBy$.next(column);
    this.sortOrder$.next(order);
  }
  
  // Common pagination logic
  setPage(page: number): void {
    this.page$.next(page);
  }
  
  // Derived state
  getQueryParams(): Observable<QueryParams> {
    return combineLatest([
      this.filters$,
      this.sortBy$,
      this.sortOrder$,
      this.page$
    ]).pipe(
      map(([filters, sortBy, sortOrder, page]) => ({
        ...filters,
        sortBy,
        sortOrder,
        page
      }))
    );
  }
}

// Use in feature services
export class ClaimListService extends EntityListService<Claim> {
  constructor(private claimApi: ClaimApiService) {
    super();
  }
  
  getClaims(): Observable<Claim[]> {
    return this.getQueryParams().pipe(
      switchMap(params => this.claimApi.getClaims(params))
    );
  }
}

export class UserListService extends EntityListService<User> {
  constructor(private userApi: UserApiService) {
    super();
  }
  
  getUsers(): Observable<User[]> {
    return this.getQueryParams().pipe(
      switchMap(params => this.userApi.getUsers(params))
    );
  }
}
```

---

## Golden Rules of Reusability, Modularization & Commonization

1. **NEVER copy-paste code** - If you're copying, you're doing it wrong
2. **Extract before duplicating** - See it twice? Make it reusable
3. **Think component library** - Build reusable building blocks
4. **Modularize by domain** - Clear boundaries between features
5. **Common module for shared business logic** - Don't duplicate in features
6. **Shared module for UI** - Reusable presentational components
7. **Core module for singletons** - App-wide services imported once
8. **Lazy load features** - Load only what's needed
9. **One source of truth** - Single location for each piece of logic
10. **Rule of three** - Used 3+ times? Make it common

---

## 📝 NAMING CONVENTIONS - UNIVERSAL STANDARDS

### General Naming Principles

**Core Rules:**
1. **Be Descriptive**: Names should clearly indicate purpose
2. **Be Consistent**: Use same patterns throughout codebase
3. **Be Concise**: Long enough to be clear, short enough to be practical
4. **Avoid Abbreviations**: Unless universally understood (ID, URL, API, etc.)
5. **Use Domain Language**: Use terms familiar to business stakeholders

### Acceptable Abbreviations

```typescript
// ✅ GOOD: Universally understood abbreviations
ID, URL, API, HTTP, JSON, XML, DB, SQL
JWT, Auth, Config, Env, Req, Res
Msg, Err, Temp, Async, Sync, Init

// ❌ BAD: Unclear abbreviations
usrMgr (user manager?)
clmSrv (claim service?)
procDta (process data?)

// ✅ GOOD: Write full words
userManager
claimService
processData
```

### Boolean Naming

```typescript
// ✅ GOOD: Use is/has/can/should prefixes for booleans
isActive: boolean
isLoading: boolean
isValid: boolean
hasPermission: boolean
hasError: boolean
canEdit: boolean
canDelete: boolean
shouldUpdate: boolean
shouldValidate: boolean

// ❌ BAD: Ambiguous boolean names
active: boolean        // Use isActive
loading: boolean       // Use isLoading
permission: boolean    // Use hasPermission

// ✅ GOOD: Boolean functions/methods
function isValidEmail(email: string): boolean
function hasAccess(user: User): boolean
function canApprove(claim: Claim): boolean
```

### Array/Collection Naming

```typescript
// ✅ GOOD: Plural for arrays/collections
const users: User[]
const claims: Claim[]
const documents: Document[]

// ✅ GOOD: Descriptive collection names
const activeUsers: User[]
const pendingClaims: Claim[]
const rejectedDocuments: Document[]

// ❌ BAD: Singular for arrays
const user: User[]     // Should be users
const claim: Claim[]   // Should be claims
```

### Function/Method Naming

```typescript
// ✅ GOOD: Verb-first for actions
function getUser(id: string): User
function createClaim(data: ClaimData): Claim
function updateStatus(id: string, status: string): void
function deleteDocument(id: string): void
function validateInput(input: string): boolean
function calculateTotal(items: Item[]): number

// ✅ GOOD: Specific action verbs
fetch, retrieve, load     // Getting data
create, add, insert       // Creating new
update, modify, change    // Updating existing
delete, remove, destroy   // Removing
validate, check, verify   // Validation
calculate, compute        // Computation
format, transform         // Transformation
handle, process           // Processing

// ❌ BAD: Vague function names
function data()           // What about data?
function doStuff()        // Too vague
function process()        // Process what?

// ✅ GOOD: Clear and specific
function getUserData()
function processPayment()
function handleSubmission()
```

### Variable Naming

```typescript
// ✅ GOOD: Descriptive variable names
const userName = 'John Doe';
const claimAmount = 1000;
const startDate = new Date();
const maxRetryCount = 3;

// ✅ GOOD: Context-specific names
const userEmail = user.email;
const claimStatus = claim.status;
const totalAmount = calculateTotal(items);

// ❌ BAD: Single letter variables (except in loops)
const x = getUserData();  // What is x?
const temp = calculate(); // Temporary what?

// ✅ GOOD: Exception for loop counters
for (let i = 0; i < items.length; i++) {
  // i is acceptable in loops
}

// ✅ BETTER: Use descriptive names even in loops
for (let index = 0; index < users.length; index++) {
  const user = users[index];
}

// ✅ BEST: Use forEach/map with descriptive names
users.forEach(user => {
  console.log(user.name);
});
```

### Constants Naming

```typescript
// ✅ GOOD: UPPER_SNAKE_CASE for constants
const MAX_RETRY_ATTEMPTS = 3;
const API_BASE_URL = 'https://api.example.com';
const DEFAULT_PAGE_SIZE = 10;
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;

// ✅ GOOD: Group related constants
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500
} as const;

export const CLAIM_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  IN_REVIEW: 'in_review'
} as const;

// ✅ GOOD: Use enums for related constants
export enum UserRole {
  ADMIN = 'admin',
  ASSESSOR = 'assessor',
  CUSTOMER_SERVICE = 'customer_service',
  VIEWER = 'viewer'
}
```

### Class Naming

```typescript
// ✅ GOOD: PascalCase for classes
export class User { }
export class ClaimService { }
export class AuthGuard { }
export class DateFormatter { }

// ✅ GOOD: Descriptive class names
export class UserRepository { }
export class ClaimValidator { }
export class EmailNotificationService { }
export class JwtTokenManager { }

// ❌ BAD: Vague or abbreviated class names
export class Mgr { }           // What manager?
export class Handler { }       // What handler?
export class Utils { }         // Too generic
```

### Interface/Type Naming

```typescript
// ✅ GOOD: PascalCase for interfaces (with or without 'I' prefix)
export interface User { }
export interface IUser { }     // Both acceptable
export interface ClaimData { }
export interface ApiResponse<T> { }

// ✅ GOOD: Descriptive interface names
export interface CreateUserDto { }
export interface UpdateClaimRequest { }
export interface PaginationOptions { }
export interface AuthToken { }

// ✅ GOOD: Use 'I' prefix for consistency (optional)
export interface IUserService { }
export interface IAuthGuard { }

// ✅ GOOD: Type aliases
export type UserId = string;
export type ClaimStatus = 'pending' | 'approved' | 'rejected';
export type ApiResult<T> = { success: boolean; data: T; error?: string };
```

### Enum Naming

```typescript
// ✅ GOOD: PascalCase for enum name, UPPER_SNAKE_CASE for values
export enum ClaimStatus {
  PENDING = 'pending',
  IN_REVIEW = 'in_review',
  APPROVED = 'approved',
  REJECTED = 'rejected'
}

export enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE'
}

// ✅ GOOD: Use singular for enum names
export enum UserRole { }       // Not UserRoles
export enum PaymentMethod { }  // Not PaymentMethods
```

### Observable Naming (RxJS)

```typescript
// ✅ GOOD: Use $ suffix for observables
users$: Observable<User[]>
loading$: Observable<boolean>
error$: Observable<string | null>
currentUser$: Observable<User | null>

// ✅ GOOD: Subject naming
private destroy$ = new Subject<void>();
private userSubject$ = new BehaviorSubject<User | null>(null);

// ❌ BAD: No $ suffix for observables
users: Observable<User[]>     // Add $ suffix
loading: Observable<boolean>  // Add $ suffix
```

### Event Handler Naming

```typescript
// ✅ GOOD: Use 'on' prefix for event handlers
onSubmit(): void { }
onClick(): void { }
onUserSelect(user: User): void { }
onStatusChange(status: string): void { }

// ✅ GOOD: Use 'handle' prefix (alternative)
handleSubmit(): void { }
handleClick(): void { }
handleUserSelect(user: User): void { }

// ❌ BAD: Vague event handler names
submit(): void { }      // Use onSubmit or handleSubmit
click(): void { }       // Use onClick or handleClick
```

### Async Function Naming

```typescript
// ✅ GOOD: Indicate async operations clearly
async function fetchUsers(): Promise<User[]> { }
async function loadUserData(id: string): Promise<User> { }
async function saveUser(user: User): Promise<void> { }

// ✅ GOOD: Use async/await with clear names
async getUserById(id: string): Promise<User> { }
async createClaim(data: ClaimData): Promise<Claim> { }
async updateStatus(id: string, status: string): Promise<void> { }

// ❌ BAD: Not indicating async nature
function getUsers(): Promise<User[]> { }  // Consider: async or fetchUsers
```

### Test Naming

```typescript
// ✅ GOOD: Descriptive test names
describe('UserService', () => {
  describe('getUser', () => {
    it('should return user when ID exists', () => { });
    it('should throw error when ID does not exist', () => { });
    it('should return null when user is deleted', () => { });
  });

  describe('createUser', () => {
    it('should create user with valid data', () => { });
    it('should throw validation error with invalid email', () => { });
    it('should hash password before saving', () => { });
  });
});

// ✅ GOOD: Test pattern: should + action + condition
it('should return empty array when no users exist', () => { });
it('should sort users by name in ascending order', () => { });
it('should throw error when database is unreachable', () => { });
```

### Package/Module Naming

```typescript
// ✅ GOOD: Kebab-case for file/folder names
user-service.ts
auth-guard.ts
claim-validator.ts
user-management/
claim-processing/

// ✅ GOOD: Consistent naming across related files
user.model.ts
user.service.ts
user.controller.ts
user.repository.ts
user.validator.ts
user.types.ts
```

### Configuration Naming

```typescript
// ✅ GOOD: Clear configuration names
export const databaseConfig = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '1433'),
  database: process.env.DB_NAME
};

export const jwtConfig = {
  secret: process.env.JWT_SECRET,
  expiresIn: process.env.JWT_EXPIRY || '1h'
};

// ✅ GOOD: Environment variable naming (UPPER_SNAKE_CASE)
DB_HOST=localhost
DB_PORT=1433
DB_USER=admin
JWT_SECRET=your-secret-key
API_BASE_URL=https://api.example.com
```

### Error Naming

```typescript
// ✅ GOOD: Error class naming (end with Error)
export class ValidationError extends Error { }
export class NotFoundError extends Error { }
export class UnauthorizedError extends Error { }
export class DatabaseError extends Error { }

// ✅ GOOD: Descriptive error names
export class UserNotFoundError extends NotFoundError { }
export class InvalidEmailError extends ValidationError { }
export class TokenExpiredError extends UnauthorizedError { }
```

### Naming by Context

#### Frontend (Angular) Specific
```typescript
// Components: descriptive name + .component
user-list.component.ts
claim-details.component.ts

// Services: purpose + .service
auth.service.ts
user.service.ts
notification.service.ts

// Guards: purpose + .guard
auth.guard.ts
role.guard.ts

// Pipes: transformation + .pipe
date-format.pipe.ts
currency.pipe.ts

// Directives: behavior + .directive
highlight.directive.ts
tooltip.directive.ts
```

#### Backend (Node.js) Specific
```typescript
// Controllers: entity + .controller
user.controller.ts
claim.controller.ts

// Services: entity + .service
user.service.ts
claim.service.ts

// Repositories: entity + .repository
user.repository.ts
claim.repository.ts

// Middleware: purpose + .middleware
auth.middleware.ts
validation.middleware.ts
error.middleware.ts

// Routes: entity + .routes
user.routes.ts
claim.routes.ts

// Validators: entity + .validator
user.validator.ts
claim.validator.ts
```

#### Database Naming
```sql
-- ✅ GOOD: Table names (plural, snake_case)
users
claims
user_roles
claim_documents

-- ✅ GOOD: Column names (singular, snake_case)
user_id
email
first_name
last_name
created_at
updated_at

-- ✅ GOOD: Foreign key naming
user_id (references users)
claim_id (references claims)
role_id (references roles)

-- ✅ GOOD: Index naming
idx_users_email
idx_claims_status
idx_users_created_at

-- ✅ GOOD: Constraint naming
pk_users (primary key)
fk_claims_user_id (foreign key)
uq_users_email (unique constraint)
ck_claims_amount (check constraint)
```

---

## Naming Convention Summary Table

| Type | Convention | Example |
|------|-----------|---------|
| **Classes** | PascalCase | `UserService`, `ClaimController` |
| **Interfaces** | PascalCase | `User`, `IUser`, `ClaimData` |
| **Types** | PascalCase | `UserId`, `ClaimStatus` |
| **Enums** | PascalCase | `UserRole`, `ClaimStatus` |
| **Variables** | camelCase | `userName`, `claimId` |
| **Functions** | camelCase | `getUser`, `createClaim` |
| **Constants** | UPPER_SNAKE_CASE | `MAX_RETRY`, `API_URL` |
| **Booleans** | camelCase + prefix | `isActive`, `hasPermission`, `canEdit` |
| **Observables** | camelCase + $ | `users$`, `loading$` |
| **Event Handlers** | camelCase + on/handle | `onClick`, `handleSubmit` |
| **Private Props** | camelCase + _ prefix | `_internalState` (optional) |
| **Files (TS/JS)** | kebab-case | `user-service.ts`, `auth-guard.ts` |
| **Folders** | kebab-case | `user-management/`, `claim-processing/` |
| **DB Tables** | snake_case (plural) | `users`, `user_roles` |
| **DB Columns** | snake_case | `user_id`, `first_name` |
| **Environment Vars** | UPPER_SNAKE_CASE | `DB_HOST`, `JWT_SECRET` |

---

# PART II: FRONTEND STANDARDS (Angular)
*Angular-specific coding standards, patterns, and best practices*

---

## DRY (Don't Repeat Yourself) - Mandatory Practice

### Identifying Code Duplication

```typescript
// ❌ BAD: Duplicate code in multiple components
// Component A
export class UserListComponent {
  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US');
  }
}

// Component B
export class ClaimListComponent {
  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US');
  }
}

// ✅ GOOD: Create shared utility
// utils/date-formatter.ts
export class DateFormatter {
  static formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US');
  }
  
  static formatDateTime(date: string): string {
    return new Date(date).toLocaleString('en-US');
  }
}

// Use in components
import { DateFormatter } from '@/utils/date-formatter';
const formatted = DateFormatter.formatDate(date);
```

### Extract Common Logic

```typescript
// ❌ BAD: Duplicate API error handling in every service
export class UserService {
  getUsers(): Observable<User[]> {
    return this.http.get<User[]>('/api/users').pipe(
      catchError(error => {
        console.error('Error:', error);
        this.notification.showError('Failed to load users');
        return of([]);
      })
    );
  }
}

export class ClaimService {
  getClaims(): Observable<Claim[]> {
    return this.http.get<Claim[]>('/api/claims').pipe(
      catchError(error => {
        console.error('Error:', error);
        this.notification.showError('Failed to load claims');
        return of([]);
      })
    );
  }
}

// ✅ GOOD: Create base service with common error handling
export abstract class BaseApiService<T> {
  constructor(
    protected http: HttpClient,
    protected notification: NotificationService,
    protected endpoint: string
  ) {}
  
  protected handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed:`, error);
      this.notification.showError(`Failed to ${operation}`);
      return of(result as T);
    };
  }
  
  getAll(): Observable<T[]> {
    return this.http.get<T[]>(this.endpoint).pipe(
      catchError(this.handleError<T[]>('fetch data', []))
    );
  }
  
  getById(id: string): Observable<T> {
    return this.http.get<T>(`${this.endpoint}/${id}`).pipe(
      catchError(this.handleError<T>('fetch item'))
    );
  }
}

// Use in specific services
export class UserService extends BaseApiService<User> {
  constructor(http: HttpClient, notification: NotificationService) {
    super(http, notification, '/api/users');
  }
}

export class ClaimService extends BaseApiService<Claim> {
  constructor(http: HttpClient, notification: NotificationService) {
    super(http, notification, '/api/claims');
  }
}
```

---

## Reusable Component Architecture

### Shared Components Library

Create a comprehensive shared components library for all reusable UI elements:

```
src/app/shared/components/
├── forms/
│   ├── input/                    # Reusable input field
│   ├── select/                   # Reusable select dropdown
│   ├── date-picker/              # Reusable date picker
│   ├── checkbox/                 # Reusable checkbox
│   └── file-upload/              # Reusable file upload
├── data-display/
│   ├── table/                    # Reusable data table
│   ├── card/                     # Reusable card component
│   ├── list/                     # Reusable list component
│   └── badge/                    # Reusable badge
├── layout/
│   ├── modal/                    # Reusable modal dialog
│   ├── drawer/                   # Reusable side drawer
│   ├── accordion/                # Reusable accordion
│   └── tabs/                     # Reusable tabs
├── feedback/
│   ├── loading-spinner/          # Reusable loading indicator
│   ├── progress-bar/             # Reusable progress bar
│   ├── alert/                    # Reusable alert message
│   └── tooltip/                  # Reusable tooltip
└── buttons/
    ├── primary-button/           # Reusable primary button
    ├── secondary-button/         # Reusable secondary button
    └── icon-button/              # Reusable icon button
```

### Example: Creating Reusable Components

```typescript
// ❌ BAD: Creating specific components for each use case
@Component({
  selector: 'app-user-submit-button',
  template: '<button class="px-4 py-2 bg-blue-600 text-white rounded">Submit User</button>'
})
export class UserSubmitButtonComponent {}

@Component({
  selector: 'app-claim-submit-button',
  template: '<button class="px-4 py-2 bg-blue-600 text-white rounded">Submit Claim</button>'
})
export class ClaimSubmitButtonComponent {}

// ✅ GOOD: Create ONE generic reusable button
@Component({
  selector: 'app-button',
  template: `
    <button 
      [type]="type"
      [disabled]="disabled || loading"
      [ngClass]="buttonClasses"
      (click)="handleClick($event)"
      class="px-4 py-2 rounded-lg font-medium transition-colors duration-200"
      [class.opacity-50]="disabled"
      [class.cursor-not-allowed]="disabled">
      <span *ngIf="loading" class="mr-2">
        <i class="icon-spinner animate-spin"></i>
      </span>
      <ng-content></ng-content>
    </button>
  `
})
export class ButtonComponent {
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() variant: 'primary' | 'secondary' | 'danger' = 'primary';
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() disabled: boolean = false;
  @Input() loading: boolean = false;
  @Output() clicked = new EventEmitter<MouseEvent>();
  
  get buttonClasses(): string {
    const variants = {
      primary: 'bg-primary-600 hover:bg-primary-700 text-white',
      secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800',
      danger: 'bg-red-600 hover:bg-red-700 text-white'
    };
    
    const sizes = {
      sm: 'text-sm px-3 py-1.5',
      md: 'text-base px-4 py-2',
      lg: 'text-lg px-6 py-3'
    };
    
    return `${variants[this.variant]} ${sizes[this.size]}`;
  }
  
  handleClick(event: MouseEvent): void {
    if (!this.disabled && !this.loading) {
      this.clicked.emit(event);
    }
  }
}

// Use everywhere with different content
<app-button variant="primary" (clicked)="submitUser()">Submit User</app-button>
<app-button variant="primary" (clicked)="submitClaim()">Submit Claim</app-button>
<app-button variant="secondary" (clicked)="cancel()">Cancel</app-button>
<app-button variant="danger" (clicked)="delete()" [loading]="deleting">Delete</app-button>
```

---

## Utility Functions & Helper Services

### Create Centralized Utilities

```typescript
// src/app/shared/utils/array.utils.ts
export class ArrayUtils {
  static groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
    return array.reduce((result, item) => {
      const group = String(item[key]);
      result[group] = result[group] || [];
      result[group].push(item);
      return result;
    }, {} as Record<string, T[]>);
  }
  
  static unique<T>(array: T[], key?: keyof T): T[] {
    if (key) {
      return array.filter((item, index, self) => 
        index === self.findIndex(t => t[key] === item[key])
      );
    }
    return [...new Set(array)];
  }
  
  static sortBy<T>(array: T[], key: keyof T, order: 'asc' | 'desc' = 'asc'): T[] {
    return [...array].sort((a, b) => {
      const aVal = a[key];
      const bVal = b[key];
      const comparison = aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      return order === 'asc' ? comparison : -comparison;
    });
  }
}

// src/app/shared/utils/string.utils.ts
export class StringUtils {
  static capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }
  
  static truncate(str: string, length: number, suffix = '...'): string {
    return str.length > length ? str.substring(0, length) + suffix : str;
  }
  
  static slugify(str: string): string {
    return str
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}

// src/app/shared/utils/validation.utils.ts
export class ValidationUtils {
  static isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
  
  static isValidPhone(phone: string): boolean {
    return /^[\d\s()+-]+$/.test(phone);
  }
  
  static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}
```

### Use Utilities Throughout Application

```typescript
// ❌ BAD: Duplicate validation in multiple components
if (email.includes('@') && email.includes('.')) {
  // valid
}

// ✅ GOOD: Use utility
import { ValidationUtils } from '@/utils/validation.utils';
if (ValidationUtils.isValidEmail(email)) {
  // valid
}
```

---

## Code Reuse Patterns

### 1. Composition over Duplication

```typescript
// ❌ BAD: Creating similar components with slight differences
@Component({
  selector: 'app-user-card',
  template: `
    <div class="card">
      <img [src]="user.avatar">
      <h3>{{ user.name }}</h3>
      <p>{{ user.email }}</p>
    </div>
  `
})
export class UserCardComponent {
  @Input() user!: User;
}

@Component({
  selector: 'app-claim-card',
  template: `
    <div class="card">
      <h3>{{ claim.id }}</h3>
      <p>{{ claim.status }}</p>
      <p>{{ claim.amount }}</p>
    </div>
  `
})
export class ClaimCardComponent {
  @Input() claim!: Claim;
}

// ✅ GOOD: Create generic card with content projection
@Component({
  selector: 'app-card',
  template: `
    <div class="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div class="card-header" *ngIf="hasHeader">
        <ng-content select="[card-header]"></ng-content>
      </div>
      <div class="card-body">
        <ng-content></ng-content>
      </div>
      <div class="card-footer" *ngIf="hasFooter">
        <ng-content select="[card-footer]"></ng-content>
      </div>
    </div>
  `
})
export class CardComponent {
  hasHeader = false;
  hasFooter = false;
  
  ngAfterContentInit() {
    // Detect if slots are filled
  }
}

// Use for any content
<app-card>
  <div card-header>
    <img [src]="user.avatar">
  </div>
  <h3>{{ user.name }}</h3>
  <p>{{ user.email }}</p>
  <div card-footer>
    <button>View Profile</button>
  </div>
</app-card>

<app-card>
  <h3>{{ claim.id }}</h3>
  <p>{{ claim.status }}</p>
  <p>{{ claim.amount }}</p>
</app-card>
```

### 2. Directives for Reusable Behavior

```typescript
// ✅ GOOD: Create reusable directives for common behaviors

// Highlight directive
@Directive({
  selector: '[appHighlight]'
})
export class HighlightDirective {
  @Input() highlightColor = 'yellow';
  
  @HostListener('mouseenter') onMouseEnter() {
    this.highlight(this.highlightColor);
  }
  
  @HostListener('mouseleave') onMouseLeave() {
    this.highlight('');
  }
  
  private highlight(color: string) {
    this.el.nativeElement.style.backgroundColor = color;
  }
  
  constructor(private el: ElementRef) {}
}

// Loading state directive
@Directive({
  selector: '[appLoading]'
})
export class LoadingDirective {
  @Input() set appLoading(loading: boolean) {
    if (loading) {
      this.showLoading();
    } else {
      this.hideLoading();
    }
  }
  
  private showLoading() {
    this.renderer.setStyle(this.el.nativeElement, 'opacity', '0.5');
    this.renderer.setStyle(this.el.nativeElement, 'pointer-events', 'none');
  }
  
  private hideLoading() {
    this.renderer.removeStyle(this.el.nativeElement, 'opacity');
    this.renderer.removeStyle(this.el.nativeElement, 'pointer-events');
  }
  
  constructor(private el: ElementRef, private renderer: Renderer2) {}
}

// Use anywhere
<div appHighlight highlightColor="lightblue">Hover me</div>
<button [appLoading]="isSubmitting">Submit</button>
```

### 3. Pipes for Reusable Transformations

```typescript
// Create reusable pipes instead of methods in components

// ✅ GOOD: Phone number pipe
@Pipe({ name: 'phone' })
export class PhonePipe implements PipeTransform {
  transform(value: string): string {
    if (!value) return '';
    const cleaned = value.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    return match ? `(${match[1]}) ${match[2]}-${match[3]}` : value;
  }
}

// ✅ GOOD: File size pipe
@Pipe({ name: 'fileSize' })
export class FileSizePipe implements PipeTransform {
  transform(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }
}

// ✅ GOOD: Time ago pipe
@Pipe({ name: 'timeAgo' })
export class TimeAgoPipe implements PipeTransform {
  transform(value: Date | string): string {
    const date = new Date(value);
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
  }
}

// Use in templates
{{ phone | phone }}
{{ fileSize | fileSize }}
{{ date | timeAgo }}
```

---

## General Principles

### Code Quality (Priority Order)
1. **REUSABILITY** ⭐⭐⭐ - MOST IMPORTANT: Never duplicate code
2. **Maintainability**: Easy to modify and extend
3. **Readability**: Easy to read and understand
4. **Testability**: Easy to test
5. **Performance**: Optimized and efficient
6. **Security**: Follow security best practices

### SOLID Principles
- **S**ingle Responsibility Principle - Each class/function does ONE thing
- **O**pen/Closed Principle - Open for extension, closed for modification
- **L**iskov Substitution Principle - Subtypes must be substitutable
- **I**nterface Segregation Principle - Many specific interfaces > one general
- **D**ependency Inversion Principle - Depend on abstractions, not concretions

---

## 📦 App Thinning Strategies

### Goal: Minimize Bundle Size & Maximize Performance

### 1. Lazy Loading Modules

```typescript
// ✅ GOOD: Lazy load feature modules
const routes: Routes = [
  {
    path: 'dashboard',
    loadChildren: () => import('./dashboard/dashboard.module').then(m => m.DashboardModule)
  },
  {
    path: 'claims',
    loadChildren: () => import('./claims/claims.module').then(m => m.ClaimsModule)
  },
  {
    path: 'users',
    loadChildren: () => import('./users/users.module').then(m => m.UsersModule)
  }
];

// ❌ BAD: Importing everything in root module
import { DashboardModule } from './dashboard/dashboard.module';
import { ClaimsModule } from './claims/claims.module';
import { UsersModule } from './users/users.module';
```

### 2. Shared Module for Common Code

```typescript
// shared/shared.module.ts
// Import once, use everywhere
@NgModule({
  declarations: [
    // Reusable components
    ButtonComponent,
    CardComponent,
    ModalComponent,
    TableComponent,
    InputComponent,
    // Reusable pipes
    PhonePipe,
    FileSizePipe,
    TimeAgoPipe,
    // Reusable directives
    HighlightDirective,
    LoadingDirective
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule
  ],
  exports: [
    // Export everything for reuse
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ButtonComponent,
    CardComponent,
    ModalComponent,
    TableComponent,
    InputComponent,
    PhonePipe,
    FileSizePipe,
    TimeAgoPipe,
    HighlightDirective,
    LoadingDirective
  ]
})
export class SharedModule {}

// Use in feature modules
@NgModule({
  imports: [SharedModule], // Get all shared components/pipes/directives
  declarations: [ClaimListComponent]
})
export class ClaimsModule {}
```

### 3. Tree Shaking - Remove Unused Code

```typescript
// ✅ GOOD: Import only what you need
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';

// ❌ BAD: Importing entire library
import * as _ from 'lodash'; // Entire lodash in bundle!

// ✅ GOOD: Import specific function
import debounce from 'lodash/debounce'; // Only debounce in bundle

// ✅ GOOD: Use ES6 modules for tree shaking
import { format } from 'date-fns'; // Only format function
```

### 4. Code Splitting

```typescript
// ✅ GOOD: Split large components
// Before: Large component (500 lines)
@Component({
  selector: 'app-claim-details',
  templateUrl: './claim-details.component.html' // 500 lines
})

// After: Split into smaller components
@Component({
  selector: 'app-claim-details',
  template: `
    <app-claim-header [claim]="claim"></app-claim-header>
    <app-claim-timeline [events]="claim.events"></app-claim-timeline>
    <app-claim-documents [documents]="claim.documents"></app-claim-documents>
    <app-claim-comments [comments]="claim.comments"></app-claim-comments>
  `
})
```

### 5. Optimize Dependencies

```json
// package.json - Keep it lean
{
  "dependencies": {
    // ✅ GOOD: Only necessary dependencies
    "@angular/core": "^17.0.0",
    "@angular/common": "^17.0.0",
    "rxjs": "^7.8.0"
  },
  "devDependencies": {
    // Development dependencies don't go in production bundle
    "@angular/cli": "^17.0.0",
    "typescript": "^5.0.0"
  }
}

// ❌ BAD: Installing entire UI libraries when you need one component
// Instead of: npm install @angular/material (entire library)
// Consider: Build your own simple component
```

### 6. Remove Dead Code

```typescript
// ❌ BAD: Keeping unused imports and code
import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import * as moment from 'moment';

export class MyComponent {
  // Unused properties
  private oldData: any;
  
  // Dead methods
  private deprecatedMethod() {
    // No longer called
  }
}

// ✅ GOOD: Remove everything unused
import { Component, OnInit } from '@angular/core'; // Only what's needed

export class MyComponent implements OnInit {
  // Only active code
}
```

### 7. Production Build Optimizations

```bash
# ✅ GOOD: Production build with optimizations
ng build --configuration production

# Enables:
# - Ahead-of-Time (AOT) compilation
# - Minification
# - Tree shaking
# - Dead code elimination
# - Bundle optimization
```

### 8. No Preloading Strategy (Better Launch Performance)

**For optimal initial load performance, do NOT preload any modules.**

```typescript
// ✅ RECOMMENDED: No preloading for best launch performance
import { NoPreloading, RouterModule } from '@angular/router';

RouterModule.forRoot(routes, {
  preloadingStrategy: NoPreloading  // Default - load only on demand
});

// ❌ AVOID: PreloadAllModules hurts initial performance
// This loads all lazy modules in background, increasing initial load time
// import { PreloadAllModules } from '@angular/router';
// RouterModule.forRoot(routes, {
//   preloadingStrategy: PreloadAllModules  // DON'T USE
// });

// ❌ AVOID: Custom preloading also impacts launch performance
// Even selective preloading delays initial interactivity
// export class SelectivePreloadStrategy implements PreloadingStrategy {
//   preload(route: Route, load: () => Observable<any>): Observable<any> {
//     return route.data?.['preload'] ? load() : of(null);
//   }
// }
```

**Why No Preloading?**
- **Faster initial load**: Application becomes interactive quicker
- **Lower bandwidth usage**: Only loads what user actually needs
- **Better mobile experience**: Crucial for users on slow connections
- **Improved Core Web Vitals**: Better Time to Interactive (TTI) and First Input Delay (FID)
- **Load on demand**: Modules load only when user navigates to them

**Best Practice**:
- Keep feature modules small and focused
- Use lazy loading for all feature modules
- Let users navigate naturally - modules load fast enough on demand
- Monitor actual navigation patterns to optimize module size

### 9. Analyze Bundle Size

```bash
# ✅ GOOD: Analyze your bundle
ng build --stats-json
npx webpack-bundle-analyzer dist/ccms-web-app/stats.json

# Identify:
# - Large dependencies
# - Duplicate code
# - Unnecessary imports
```

### Bundle Size Targets
- **Initial bundle**: < 500KB (gzipped)
- **Lazy modules**: < 200KB each (gzipped)
- **Total app**: < 2MB (gzipped)

---

## Frontend Standards (Angular + TypeScript)

### TypeScript Standards

#### General TypeScript Rules
```typescript
// ✅ GOOD: Use strict mode
// Enable in tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true
  }
}

// ✅ GOOD: Define interfaces for all data structures
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

// ❌ BAD: Avoid using 'any' type
const user: any = {}; // BAD

// ✅ GOOD: Use proper types
const user: User = {
  id: '1',
  name: 'John Doe',
  email: 'john@example.com',
  role: UserRole.ADMIN
};

// ✅ GOOD: Use enums for constant values
export enum UserRole {
  ASSESSOR = 'assessor',
  CLAIMS_MANAGER = 'claims_manager',
  AUDIT_TEAM = 'audit_team',
  IX_TEAM = 'ix_team',
  SUBMISSION_TEAM = 'submission_team',
  SETTLEMENT_TEAM = 'settlement_team',
  CUSTOMER_SERVICE = 'customer_service'
}

// ✅ GOOD: Use async/await instead of promises
async getUserData(id: string): Promise<User> {
  try {
    const response = await this.http.get<User>(`/api/users/${id}`).toPromise();
    return response;
  } catch (error) {
    this.handleError(error);
    throw error;
  }
}

// ✅ GOOD: Use type guards
function isUser(obj: any): obj is User {
  return obj && typeof obj.id === 'string' && typeof obj.email === 'string';
}
```

#### Type Safety
```typescript
// ✅ GOOD: Use strict null checks
let value: string | null = null;
if (value !== null) {
  console.log(value.toUpperCase());
}

// ✅ GOOD: Use optional chaining
const userName = user?.profile?.name ?? 'Unknown';

// ✅ GOOD: Use union types appropriately
type Status = 'pending' | 'approved' | 'rejected';

// ✅ GOOD: Use generics for reusable components
export class DataService<T> {
  getAll(): Observable<T[]> {
    return this.http.get<T[]>(this.endpoint);
  }
}
```

### Angular Component Standards

#### Component Structure
```typescript
// ✅ GOOD: Component structure
import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserListComponent implements OnInit, OnDestroy {
  // Inputs
  @Input() users: User[] = [];
  @Input() loading: boolean = false;
  
  // Outputs
  @Output() userSelected = new EventEmitter<User>();
  @Output() userDeleted = new EventEmitter<string>();
  
  // Public properties
  filteredUsers: User[] = [];
  searchTerm: string = '';
  
  // Private properties
  private destroy$ = new Subject<void>();
  
  constructor(
    private userService: UserService,
    private notificationService: NotificationService
  ) {}
  
  ngOnInit(): void {
    this.loadUsers();
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  // Public methods
  onUserClick(user: User): void {
    this.userSelected.emit(user);
  }
  
  // Private methods
  private loadUsers(): void {
    this.userService.getUsers()
      .pipe(takeUntil(this.destroy$))
      .subscribe(users => {
        this.filteredUsers = users;
      });
  }
}
```

#### Component Best Practices
```typescript
// ✅ GOOD: Use OnPush change detection for performance
changeDetection: ChangeDetectionStrategy.OnPush

// ✅ GOOD: Unsubscribe from observables
private destroy$ = new Subject<void>();

ngOnDestroy(): void {
  this.destroy$.next();
  this.destroy$.complete();
}

// OR use takeUntilDestroyed (Angular 16+)
this.service.getData()
  .pipe(takeUntilDestroyed())
  .subscribe();

// ✅ GOOD: Use trackBy for ngFor
trackByUserId(index: number, user: User): string {
  return user.id;
}

// In template
<div *ngFor="let user of users; trackBy: trackByUserId">
```

#### Smart vs Dumb Components
```typescript
// ✅ GOOD: Smart (Container) Component
// - Has injected services
// - Manages state
// - Handles business logic
@Component({
  selector: 'app-user-container',
  template: `
    <app-user-list
      [users]="users$ | async"
      [loading]="loading$ | async"
      (userSelected)="onUserSelected($event)">
    </app-user-list>
  `
})
export class UserContainerComponent {
  users$ = this.userService.getUsers();
  loading$ = this.loadingService.loading$;
  
  constructor(
    private userService: UserService,
    private loadingService: LoadingService
  ) {}
  
  onUserSelected(user: User): void {
    // Handle business logic
  }
}

// ✅ GOOD: Dumb (Presentational) Component
// - Only @Input and @Output
// - No injected services
// - Pure presentation logic
@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserListComponent {
  @Input() users: User[] = [];
  @Input() loading: boolean = false;
  @Output() userSelected = new EventEmitter<User>();
  
  onUserClick(user: User): void {
    this.userSelected.emit(user);
  }
}
```

### Angular Service Standards

```typescript
// ✅ GOOD: Service structure
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root' // Singleton service
})
export class UserService {
  private readonly apiUrl = environment.apiUrl;
  private usersSubject = new BehaviorSubject<User[]>([]);
  
  public users$ = this.usersSubject.asObservable();
  
  constructor(
    private http: HttpClient,
    private errorHandler: ErrorHandlerService
  ) {}
  
  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/users`).pipe(
      map(users => this.transformUsers(users)),
      catchError(error => this.errorHandler.handle(error))
    );
  }
  
  getUserById(id: string): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/users/${id}`).pipe(
      catchError(error => this.errorHandler.handle(error))
    );
  }
  
  updateUser(id: string, user: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/users/${id}`, user).pipe(
      catchError(error => this.errorHandler.handle(error))
    );
  }
  
  private transformUsers(users: any[]): User[] {
    return users.map(user => this.mapToUser(user));
  }
  
  private mapToUser(data: any): User {
    return {
      id: data.id,
      name: data.name,
      email: data.email,
      role: data.role
    };
  }
}
```

### RxJS Best Practices

```typescript
// ✅ GOOD: Use appropriate operators
import { map, filter, debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';

// Search with debounce
this.searchControl.valueChanges.pipe(
  debounceTime(300),
  distinctUntilChanged(),
  switchMap(term => this.searchService.search(term))
).subscribe(results => {
  this.results = results;
});

// ✅ GOOD: Use switchMap for dependent calls
this.userService.getUser(userId).pipe(
  switchMap(user => this.roleService.getRole(user.roleId))
).subscribe(role => {
  this.role = role;
});

// ✅ GOOD: Combine multiple observables
combineLatest([
  this.users$,
  this.roles$,
  this.permissions$
]).pipe(
  map(([users, roles, permissions]) => {
    return this.processData(users, roles, permissions);
  })
).subscribe();

// ✅ GOOD: Handle errors gracefully
this.http.get<User[]>('/api/users').pipe(
  catchError(error => {
    console.error('Error loading users:', error);
    return of([]); // Return empty array as fallback
  })
).subscribe();
```

### Naming Conventions

> **Note**: For comprehensive naming conventions applicable to both frontend and backend, see the **Universal Naming Conventions** section in Part I.

This section covers Angular-specific naming patterns.

#### File Naming
```
// Components
user-list.component.ts
user-list.component.html
user-list.component.scss
user-list.component.spec.ts

// Services
auth.service.ts
user.service.ts
api.service.ts

// Models/Interfaces
user.model.ts
claim.interface.ts

// Guards
auth.guard.ts
role.guard.ts

// Pipes
date-format.pipe.ts
currency.pipe.ts

// Directives
highlight.directive.ts
```

#### TypeScript Naming (Angular Context)
```typescript
// Components (PascalCase + Component suffix)
export class UserListComponent { }
export class ClaimDetailsComponent { }

// Services (PascalCase + Service suffix)
export class AuthService { }
export class UserService { }

// Guards (PascalCase + Guard suffix)
export class AuthGuard { }
export class RoleGuard { }

// Pipes (PascalCase + Pipe suffix)
@Pipe({ name: 'dateFormat' })
export class DateFormatPipe { }

// Directives (PascalCase + Directive suffix)
@Directive({ selector: '[appHighlight]' })
export class HighlightDirective { }

// Interfaces (PascalCase)
export interface IUser { }
export interface User { } // Also acceptable

// Enums (PascalCase)
export enum UserRole { }
export enum ClaimStatus { }

// Constants (UPPER_SNAKE_CASE)
export const API_BASE_URL = 'https://api.example.com';
export const MAX_RETRY_ATTEMPTS = 3;

// Variables and Functions (camelCase)
let userName: string;
const userCount: number;
function getUserData(): User { }

// Private properties (camelCase with _ prefix - optional)
private _internalState: any;
private destroy$: Subject<void>;

// Observable properties (camelCase with $ suffix)
users$: Observable<User[]>;
loading$: Observable<boolean>;

// Selectors (kebab-case in quotes)
@Component({
  selector: 'app-user-list'  // Prefix with 'app-'
})

// Pipe names (camelCase in quotes)
@Pipe({
  name: 'dateFormat'
})

// Directive selectors (camelCase with square brackets)
@Directive({
  selector: '[appHighlight]'  // Prefix with 'app'
})
```

### HTML/Template Standards

```html
<!-- ✅ GOOD: Use semantic HTML -->
<header class="app-header">
  <nav class="main-nav">
    <a routerLink="/dashboard">Dashboard</a>
  </nav>
</header>

<main class="content">
  <section class="user-section">
    <article class="user-card">
      <!-- Content -->
    </article>
  </section>
</main>

<!-- ✅ GOOD: Use Angular directives properly -->
<div *ngIf="users$ | async as users">
  <div *ngFor="let user of users; trackBy: trackByUserId">
    {{ user.name }}
  </div>
</div>

<!-- ✅ GOOD: Use Tailwind CSS classes -->
<button 
  class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
  (click)="onSubmit()">
  Submit
</button>

<!-- ✅ GOOD: Accessibility attributes -->
<button 
  type="button"
  aria-label="Close dialog"
  [attr.aria-expanded]="isOpen"
  (click)="close()">
  <i class="icon-close" aria-hidden="true"></i>
</button>

<!-- ✅ GOOD: Form with validation -->
<form [formGroup]="userForm" (ngSubmit)="onSubmit()">
  <div class="form-group">
    <label for="email">Email</label>
    <input 
      id="email"
      type="email" 
      formControlName="email"
      [class.error]="email.invalid && email.touched">
    <span class="error-message" *ngIf="email.errors?.['required'] && email.touched">
      Email is required
    </span>
  </div>
</form>
```

### CSS/SCSS Standards (with Tailwind)

```scss
// ✅ GOOD: Use Tailwind utilities first
<div class="flex items-center justify-between p-4 bg-white rounded-lg shadow-md">

// ✅ GOOD: Custom component styles when needed
@layer components {
  .btn-primary {
    @apply px-4 py-2 bg-primary-600 text-white rounded-lg;
    @apply hover:bg-primary-700 transition-colors duration-200;
    @apply disabled:opacity-50 disabled:cursor-not-allowed;
  }
  
  .card {
    @apply bg-white rounded-lg shadow-md p-6;
    @apply hover:shadow-lg transition-shadow duration-200;
  }
}

// ✅ GOOD: Component-specific styles (use :host)
:host {
  display: block;
  
  .user-card {
    @apply bg-white rounded-lg p-4;
    
    &__header {
      @apply font-bold text-lg mb-2;
    }
    
    &__content {
      @apply text-gray-600;
    }
  }
}

// ❌ BAD: Avoid deep nesting
.nav {
  .item {
    .link {
      .icon { } // Too deep
    }
  }
}

// ✅ GOOD: Keep nesting shallow
.nav-item {
  @apply flex items-center;
}

.nav-link {
  @apply text-gray-700 hover:text-primary-600;
}

.nav-icon {
  @apply mr-2;
}
```

---

---

# PART III: BACKEND STANDARDS (Node.js + Express)
*Node.js/Express-specific coding standards, patterns, and best practices*

---

## 🎯 Backend Architecture Principles

### Technology Stack
- **Runtime**: Node.js (LTS version)
- **Framework**: Express.js
- **Language**: TypeScript (strict mode)
- **Database**: MS SQL Server
- **ORM/Query Builder**: Use parameterized queries for SQL injection prevention

### Backend Core Principles
1. **Reusability**: Base classes, middleware, utilities
2. **Modularization**: Feature-based folder structure
3. **Commonization**: Shared services, validators, utilities
4. **Type Safety**: Strict TypeScript throughout
5. **Security First**: Parameterized queries, validation, authentication

---

## Backend Reusability Patterns

### Backend Reusability Principles

**Same rules apply**: Never duplicate code, create reusable services, middleware, and utilities.

#### 1. Base Repository Pattern

```typescript
// ❌ BAD: Duplicate CRUD operations in every service
export class UserService {
  async findAll() {
    return await db.query('SELECT * FROM users');
  }
  async findById(id: string) {
    return await db.query('SELECT * FROM users WHERE id = @id', { id });
  }
  async create(data: any) {
    return await db.query('INSERT INTO users...', data);
  }
}

export class ClaimService {
  async findAll() {
    return await db.query('SELECT * FROM claims');
  }
  async findById(id: string) {
    return await db.query('SELECT * FROM claims WHERE id = @id', { id });
  }
  async create(data: any) {
    return await db.query('INSERT INTO claims...', data);
  }
}

// ✅ GOOD: Create generic base repository
export abstract class BaseRepository<T> {
  constructor(protected tableName: string) {}
  
  async findAll(options?: QueryOptions): Promise<T[]> {
    const { page = 1, limit = 10, orderBy = 'created_at', order = 'DESC' } = options || {};
    const offset = (page - 1) * limit;
    
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE deleted_at IS NULL
      ORDER BY ${orderBy} ${order}
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
    `;
    
    const result = await db.query(query, { offset, limit });
    return result.recordset;
  }
  
  async findById(id: string): Promise<T | null> {
    const query = `SELECT * FROM ${this.tableName} WHERE id = @id AND deleted_at IS NULL`;
    const result = await db.query(query, { id });
    return result.recordset[0] || null;
  }
  
  async create(data: Partial<T>): Promise<T> {
    const columns = Object.keys(data).join(', ');
    const values = Object.keys(data).map(k => `@${k}`).join(', ');
    const query = `INSERT INTO ${this.tableName} (${columns}) OUTPUT INSERTED.* VALUES (${values})`;
    const result = await db.query(query, data);
    return result.recordset[0];
  }
  
  async update(id: string, data: Partial<T>): Promise<T> {
    const setClause = Object.keys(data).map(k => `${k} = @${k}`).join(', ');
    const query = `UPDATE ${this.tableName} SET ${setClause} OUTPUT INSERTED.* WHERE id = @id`;
    const result = await db.query(query, { ...data, id });
    return result.recordset[0];
  }
  
  async delete(id: string): Promise<void> {
    const query = `UPDATE ${this.tableName} SET deleted_at = GETDATE() WHERE id = @id`;
    await db.query(query, { id });
  }
}

// Use in specific repositories
export class UserRepository extends BaseRepository<User> {
  constructor() {
    super('users');
  }
  
  // Add user-specific methods only
  async findByEmail(email: string): Promise<User | null> {
    const query = `SELECT * FROM users WHERE email = @email AND deleted_at IS NULL`;
    const result = await db.query(query, { email });
    return result.recordset[0] || null;
  }
}

export class ClaimRepository extends BaseRepository<Claim> {
  constructor() {
    super('claims');
  }
  
  // Add claim-specific methods only
  async findByStatus(status: string): Promise<Claim[]> {
    const query = `SELECT * FROM claims WHERE status = @status AND deleted_at IS NULL`;
    const result = await db.query(query, { status });
    return result.recordset;
  }
}
```

#### 2. Reusable Middleware

```typescript
// ✅ GOOD: Create reusable middleware
// middleware/validate-id.middleware.ts
export const validateId = (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  if (!id || !isValidUUID(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format'
    });
  }
  next();
};

// middleware/pagination.middleware.ts
export const paginationMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  
  req.pagination = {
    page: Math.max(1, page),
    limit: Math.min(100, Math.max(1, limit))
  };
  
  next();
};

// middleware/role-check.middleware.ts
export const requireRole = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }
    next();
  };
};

// Use everywhere
router.get('/users/:id', 
  authMiddleware,
  validateId,
  userController.getUserById
);

router.get('/claims',
  authMiddleware,
  requireRole('claims_manager', 'admin'),
  paginationMiddleware,
  claimController.getClaims
);
```

#### 3. Reusable Utility Functions

```typescript
// utils/response.util.ts
export class ResponseUtil {
  static success<T>(res: Response, data: T, message?: string, statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      data,
      message
    });
  }
  
  static error(res: Response, message: string, statusCode = 500, errors?: any[]) {
    return res.status(statusCode).json({
      success: false,
      message,
      errors
    });
  }
  
  static paginated<T>(res: Response, data: T[], page: number, limit: number, total: number) {
    return res.status(200).json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  }
}

// Use in controllers
export class UserController {
  async getUsers(req: Request, res: Response) {
    const users = await this.userService.getUsers();
    return ResponseUtil.success(res, users, 'Users retrieved successfully');
  }
  
  async getUserById(req: Request, res: Response) {
    const user = await this.userService.getUserById(req.params.id);
    if (!user) {
      return ResponseUtil.error(res, 'User not found', 404);
    }
    return ResponseUtil.success(res, user);
  }
}
```

#### 4. Shared Validation Schemas

```typescript
// validators/common.validators.ts
export const commonValidators = {
  id: Joi.string().uuid().required(),
  email: Joi.string().email().required(),
  phone: Joi.string().pattern(/^[\d\s()+-]+$/).required(),
  date: Joi.date().iso().required(),
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10)
  })
};

// validators/user.validator.ts
export const createUserSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: commonValidators.email, // Reuse
  phone: commonValidators.phone, // Reuse
  role: Joi.string().valid(...Object.values(UserRole)).required()
});

export const updateUserSchema = Joi.object({
  name: Joi.string().min(2).max(100),
  email: commonValidators.email,  // Reuse
  phone: commonValidators.phone   // Reuse
});
```

### Project Structure
```
backend/
├── src/
│   ├── config/           # Configuration files
│   ├── controllers/      # Route controllers
│   ├── services/         # Business logic
│   ├── repositories/     # Database repositories (with BaseRepository)
│   ├── models/           # Database models
│   ├── routes/           # API routes
│   ├── middleware/       # Custom middleware (reusable)
│   ├── utils/            # Utility functions (reusable)
│   ├── types/            # TypeScript types/interfaces
│   ├── validators/       # Input validation (reusable schemas)
│   └── app.ts            # Express app setup
├── tests/                # Test files
└── package.json
```

---

## 🧱 Backend Modularization Strategy

### Feature-Based Organization

Instead of organizing by technical layers, organize by business features for better modularity:

```
backend/
├── src/
│   ├── core/                    # Core/shared functionality
│   │   ├── config/
│   │   │   ├── database.config.ts
│   │   │   ├── app.config.ts
│   │   │   └── env.config.ts
│   │   ├── middleware/          # Global middleware
│   │   │   ├── auth.middleware.ts
│   │   │   ├── error.middleware.ts
│   │   │   └── logger.middleware.ts
│   │   ├── utils/               # Global utilities
│   │   │   ├── response.util.ts
│   │   │   ├── logger.util.ts
│   │   │   └── crypto.util.ts
│   │   └── base/                # Base classes
│   │       ├── base.repository.ts
│   │       ├── base.controller.ts
│   │       └── base.service.ts
│   │
│   ├── common/                  # Shared business logic
│   │   ├── validators/
│   │   │   ├── common.validators.ts   # Reusable validators
│   │   │   ├── pagination.validator.ts
│   │   │   └── id.validator.ts
│   │   ├── middleware/
│   │   │   ├── validate-id.middleware.ts
│   │   │   ├── pagination.middleware.ts
│   │   │   └── role-check.middleware.ts
│   │   ├── types/               # Common types
│   │   │   ├── pagination.types.ts
│   │   │   ├── response.types.ts
│   │   │   └── query.types.ts
│   │   └── errors/              # Custom errors
│   │       ├── app.error.ts
│   │       ├── validation.error.ts
│   │       └── not-found.error.ts
│   │
│   ├── features/                # Feature modules
│   │   ├── auth/                # Auth feature
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.repository.ts
│   │   │   ├── auth.routes.ts
│   │   │   ├── auth.validator.ts
│   │   │   ├── auth.types.ts
│   │   │   └── auth.middleware.ts
│   │   │
│   │   ├── users/               # Users feature
│   │   │   ├── users.controller.ts
│   │   │   ├── users.service.ts
│   │   │   ├── users.repository.ts
│   │   │   ├── users.routes.ts
│   │   │   ├── users.validator.ts
│   │   │   └── users.types.ts
│   │   │
│   │   ├── claims/              # Claims feature
│   │   │   ├── claims.controller.ts
│   │   │   ├── claims.service.ts
│   │   │   ├── claims.repository.ts
│   │   │   ├── claims.routes.ts
│   │   │   ├── claims.validator.ts
│   │   │   └── claims.types.ts
│   │   │
│   │   └── [other-features]/
│   │
│   ├── database/                # Database layer
│   │   ├── connection.ts
│   │   ├── transaction.ts
│   │   └── migrations/
│   │
│   ├── app.ts                   # App setup
│   └── server.ts                # Server entry point
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── fixtures/
│
└── package.json
```

### Backend Module Types

#### 🔵 Core Module
**Purpose**: Foundation layer, app-wide utilities
**Contains**:
- Configuration management
- Global middleware
- Base classes (BaseRepository, BaseController, BaseService)
- Core utilities (logger, response formatter, crypto)
- Database connection setup

```typescript
// core/base/base.repository.ts
export abstract class BaseRepository<T> {
  constructor(protected tableName: string) {}
  
  async findAll(options?: QueryOptions): Promise<T[]> { /* ... */ }
  async findById(id: string): Promise<T | null> { /* ... */ }
  async create(data: Partial<T>): Promise<T> { /* ... */ }
  async update(id: string, data: Partial<T>): Promise<T> { /* ... */ }
  async delete(id: string): Promise<void> { /* ... */ }
}

// core/utils/response.util.ts
export class ResponseUtil {
  static success<T>(res: Response, data: T, message?: string) { /* ... */ }
  static error(res: Response, message: string, statusCode: number) { /* ... */ }
  static paginated<T>(res: Response, data: T[], pagination: Pagination) { /* ... */ }
}
```

#### 🟪 Common Module
**Purpose**: Shared business logic across features
**Contains**:
- Common validators (pagination, IDs, emails)
- Common middleware (role check, validate ID, pagination)
- Common types/interfaces
- Custom error classes

```typescript
// common/validators/common.validators.ts
export const commonValidators = {
  id: Joi.string().uuid().required(),
  email: Joi.string().email().required(),
  phone: Joi.string().pattern(/^[\d\s()+-]+$/).required(),
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10)
  })
};

// common/middleware/role-check.middleware.ts
export const requireRole = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    next();
  };
};
```

#### 🟢 Feature Modules
**Purpose**: Encapsulate business domains
**Contains** (per feature):
- Controller (HTTP handlers)
- Service (business logic)
- Repository (data access)
- Routes (API endpoints)
- Validators (feature-specific validation)
- Types (feature-specific types)

```typescript
// features/users/users.module.ts
import { Router } from 'express';
import { UserController } from './users.controller';
import { UserService } from './users.service';
import { UserRepository } from './users.repository';
import { authMiddleware } from '@/core/middleware/auth.middleware';
import { requireRole } from '@/common/middleware/role-check.middleware';

const userRepository = new UserRepository();
const userService = new UserService(userRepository);
const userController = new UserController(userService);

const router = Router();

// Feature-specific routes
router.get('/', authMiddleware, userController.getUsers);
router.get('/:id', authMiddleware, userController.getUserById);
router.post('/', authMiddleware, requireRole('admin'), userController.createUser);
router.put('/:id', authMiddleware, requireRole('admin'), userController.updateUser);
router.delete('/:id', authMiddleware, requireRole('admin'), userController.deleteUser);

export default router;
```

### Backend Commonization Rules

```typescript
// ❌ BAD: Duplicate response formatting in every controller
export class UserController {
  async getUsers(req: Request, res: Response) {
    const users = await this.userService.getUsers();
    return res.status(200).json({
      success: true,
      data: users,
      message: 'Users retrieved successfully'
    });
  }
}

export class ClaimController {
  async getClaims(req: Request, res: Response) {
    const claims = await this.claimService.getClaims();
    return res.status(200).json({
      success: true,
      data: claims,
      message: 'Claims retrieved successfully'
    });
  }
}

// ✅ GOOD: Use ResponseUtil from core
export class UserController {
  async getUsers(req: Request, res: Response) {
    const users = await this.userService.getUsers();
    return ResponseUtil.success(res, users, 'Users retrieved successfully');
  }
}

export class ClaimController {
  async getClaims(req: Request, res: Response) {
    const claims = await this.claimService.getClaims();
    return ResponseUtil.success(res, claims, 'Claims retrieved successfully');
  }
}
```

---

### Node.js/Express Standards

> **Note**: For comprehensive naming conventions applicable to both frontend and backend, see the **Universal Naming Conventions** section in Part I.

#### Backend Naming Conventions

**File Naming (kebab-case):**
```
// Controllers
user.controller.ts
claim.controller.ts
auth.controller.ts

// Services
user.service.ts
claim.service.ts
notification.service.ts

// Repositories
user.repository.ts
claim.repository.ts
base.repository.ts

// Middleware
auth.middleware.ts
validation.middleware.ts
error.middleware.ts
rate-limit.middleware.ts

// Routes
user.routes.ts
claim.routes.ts
index.routes.ts

// Validators
user.validator.ts
claim.validator.ts
common.validators.ts

// Utilities
response.util.ts
logger.util.ts
crypto.util.ts

// Types/Interfaces
user.types.ts
claim.types.ts
common.types.ts
```

**Class/Interface Naming (PascalCase):**
```typescript
// Controllers (PascalCase + Controller suffix)
export class UserController { }
export class ClaimController { }
export class AuthController { }

// Services (PascalCase + Service suffix)
export class UserService { }
export class ClaimService { }
export class EmailService { }

// Repositories (PascalCase + Repository suffix)
export class UserRepository extends BaseRepository<User> { }
export class ClaimRepository extends BaseRepository<Claim> { }

// Middleware (camelCase for functions)
export const authMiddleware = (req, res, next) => { };
export const validateRequest = (schema) => (req, res, next) => { };

// Utilities (PascalCase for classes, camelCase for functions)
export class ResponseUtil { }
export class Logger { }
export function formatDate(date: Date): string { }

// Interfaces/Types (PascalCase)
export interface User { }
export interface CreateUserDto { }
export interface ApiResponse<T> { }
export type UserId = string;
```

**Route Naming:**
```typescript
// ✅ GOOD: RESTful route naming
router.get('/users', userController.getUsers);           // GET /api/users
router.get('/users/:id', userController.getUserById);    // GET /api/users/123
router.post('/users', userController.createUser);        // POST /api/users
router.put('/users/:id', userController.updateUser);     // PUT /api/users/123
router.delete('/users/:id', userController.deleteUser);  // DELETE /api/users/123

// ✅ GOOD: Nested resources
router.get('/users/:userId/claims', claimController.getUserClaims);
router.get('/claims/:claimId/documents', documentController.getClaimDocuments);

// ✅ GOOD: Custom actions (use verbs in URL)
router.post('/users/:id/activate', userController.activateUser);
router.post('/claims/:id/approve', claimController.approveClaim);
router.post('/claims/:id/reject', claimController.rejectClaim);
```

**Database Naming (snake_case):**
```sql
-- Tables (plural, snake_case)
users
claims
user_roles
claim_documents
claim_status_history

-- Columns (singular, snake_case)
id
user_id
email
first_name
last_name
created_at
updated_at
is_deleted
deleted_at

-- Indexes (idx_ prefix)
idx_users_email
idx_claims_user_id
idx_claims_status
idx_claims_created_at

-- Foreign Keys (fk_ prefix)
fk_claims_user_id
fk_claim_documents_claim_id
fk_user_roles_user_id

-- Primary Keys (pk_ prefix)
pk_users
pk_claims

-- Unique Constraints (uq_ prefix)
uq_users_email
uq_claims_reference_number
```

**Environment Variables (UPPER_SNAKE_CASE):**
```bash
# Application
NODE_ENV=development
PORT=3000
API_VERSION=v1

# Database
DB_HOST=localhost
DB_PORT=1433
DB_USER=admin
DB_PASSWORD=secret
DB_NAME=ccms_db

# JWT
JWT_SECRET=your-secret-key
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```

**API Response Naming:**
```typescript
// ✅ GOOD: Consistent response structure
{
  "success": true,
  "data": { /* ... */ },
  "message": "User created successfully"
}

{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [/* ... */]
  }
}

// ✅ GOOD: Paginated response
{
  "success": true,
  "data": [/* ... */],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

---

### Controller Structure

```typescript
// ✅ GOOD: Controller structure
import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/user.service';
import { AppError } from '../utils/app-error';

export class UserController {
  constructor(private userService: UserService) {}
  
  async getUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page = 1, limit = 10 } = req.query;
      
      const users = await this.userService.getUsers({
        page: Number(page),
        limit: Number(limit)
      });
      
      res.status(200).json({
        success: true,
        data: users,
        pagination: {
          page: Number(page),
          limit: Number(limit)
        }
      });
    } catch (error) {
      next(error);
    }
  }
  
  async getUserById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const user = await this.userService.getUserById(id);
      
      if (!user) {
        throw new AppError('User not found', 404);
      }
      
      res.status(200).json({
        success: true,
        data: user
      });
    } catch (error) {
      next(error);
    }
  }
  
  async createUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userData = req.body;
      const newUser = await this.userService.createUser(userData);
      
      res.status(201).json({
        success: true,
        data: newUser,
        message: 'User created successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}
```

```typescript
// ✅ GOOD: Service structure
import { User } from '../models/user.model';
import { UserRepository } from '../repositories/user.repository';
import { AppError } from '../utils/app-error';

export class UserService {
  constructor(private userRepository: UserRepository) {}
  
  async getUsers(options: PaginationOptions): Promise<User[]> {
    return await this.userRepository.findAll(options);
  }
  
  async getUserById(id: string): Promise<User | null> {
    return await this.userRepository.findById(id);
  }
  
  async createUser(userData: CreateUserDto): Promise<User> {
    // Validate data
    await this.validateUserData(userData);
    
    // Check if user exists
    const existingUser = await this.userRepository.findByEmail(userData.email);
    if (existingUser) {
      throw new AppError('User with this email already exists', 409);
    }
    
    // Hash password
    const hashedPassword = await this.hashPassword(userData.password);
    
    // Create user
    const user = await this.userRepository.create({
      ...userData,
      password: hashedPassword
    });
    
    return user;
  }
  
  private async validateUserData(data: CreateUserDto): Promise<void> {
    // Validation logic
  }
  
  private async hashPassword(password: string): Promise<string> {
    // Password hashing logic
    return password;
  }
}
```

```typescript
// ✅ GOOD: Route structure
import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { createUserSchema } from '../validators/user.validator';

const router = Router();
const userController = new UserController();

// Public routes
router.post('/users/register', 
  validateRequest(createUserSchema),
  userController.createUser.bind(userController)
);

// Protected routes
router.use(authMiddleware);

router.get('/users', 
  userController.getUsers.bind(userController)
);

router.get('/users/:id', 
  userController.getUserById.bind(userController)
);

router.put('/users/:id',
  validateRequest(updateUserSchema),
  userController.updateUser.bind(userController)
);

router.delete('/users/:id',
  userController.deleteUser.bind(userController)
);

export default router;
```

### Error Handling

```typescript
// ✅ GOOD: Custom error class
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public isOperational: boolean = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

// ✅ GOOD: Global error handler middleware
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
    return;
  }
  
  // Unhandled errors
  console.error('Unhandled Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
};

// Usage
app.use(errorHandler);
```

### Input Validation

```typescript
// ✅ GOOD: Using Joi or Zod for validation
import Joi from 'joi';

export const createUserSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  role: Joi.string().valid(...Object.values(UserRole)).required()
});

// Validation middleware
export const validateRequest = (schema: Joi.Schema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });
    
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      
      res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
      return;
    }
    
    req.body = value;
    next();
  };
};
```

### Database Best Practices (MS SQL)

```typescript
// ✅ GOOD: Use parameterized queries
async getUserById(id: string): Promise<User | null> {
  const query = `
    SELECT id, name, email, role, created_at, updated_at
    FROM users
    WHERE id = @userId AND deleted_at IS NULL
  `;
  
  const result = await this.db.query(query, {
    userId: id
  });
  
  return result.recordset[0] || null;
}

// ✅ GOOD: Use transactions for multiple operations
async transferFunds(fromUserId: string, toUserId: string, amount: number): Promise<void> {
  const transaction = new sql.Transaction();
  
  try {
    await transaction.begin();
    
    // Deduct from sender
    await transaction.request()
      .input('userId', sql.VarChar, fromUserId)
      .input('amount', sql.Decimal, amount)
      .query('UPDATE accounts SET balance = balance - @amount WHERE user_id = @userId');
    
    // Add to receiver
    await transaction.request()
      .input('userId', sql.VarChar, toUserId)
      .input('amount', sql.Decimal, amount)
      .query('UPDATE accounts SET balance = balance + @amount WHERE user_id = @userId');
    
    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

// ❌ BAD: SQL injection vulnerability
const query = `SELECT * FROM users WHERE email = '${email}'`; // NEVER DO THIS

// ✅ GOOD: Use parameterized queries
const query = `SELECT * FROM users WHERE email = @email`;
```

---

---

# PART IV: TESTING & QUALITY ASSURANCE
*Testing standards for both frontend and backend*

---

## Testing Standards

### Unit Tests (Frontend)

```typescript
// ✅ GOOD: Component test
describe('UserListComponent', () => {
  let component: UserListComponent;
  let fixture: ComponentFixture<UserListComponent>;
  let userService: jasmine.SpyObj<UserService>;
  
  beforeEach(async () => {
    const userServiceSpy = jasmine.createSpyObj('UserService', ['getUsers']);
    
    await TestBed.configureTestingModule({
      declarations: [UserListComponent],
      providers: [
        { provide: UserService, useValue: userServiceSpy }
      ]
    }).compileComponents();
    
    fixture = TestBed.createComponent(UserListComponent);
    component = fixture.componentInstance;
    userService = TestBed.inject(UserService) as jasmine.SpyObj<UserService>;
  });
  
  it('should create', () => {
    expect(component).toBeTruthy();
  });
  
  it('should load users on init', () => {
    const mockUsers: User[] = [
      { id: '1', name: 'John', email: 'john@test.com', role: 'user' }
    ];
    userService.getUsers.and.returnValue(of(mockUsers));
    
    component.ngOnInit();
    
    expect(userService.getUsers).toHaveBeenCalled();
    expect(component.users).toEqual(mockUsers);
  });
  
  it('should emit user selected event', () => {
    const mockUser: User = { id: '1', name: 'John', email: 'john@test.com', role: 'user' };
    spyOn(component.userSelected, 'emit');
    
    component.onUserClick(mockUser);
    
    expect(component.userSelected.emit).toHaveBeenCalledWith(mockUser);
  });
});
```

### Unit Tests (Backend)

```typescript
// ✅ GOOD: Service test
describe('UserService', () => {
  let userService: UserService;
  let userRepository: jest.Mocked<UserRepository>;
  
  beforeEach(() => {
    userRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    } as any;
    
    userService = new UserService(userRepository);
  });
  
  describe('getUserById', () => {
    it('should return user when found', async () => {
      const mockUser: User = {
        id: '1',
        name: 'John Doe',
        email: 'john@test.com',
        role: UserRole.USER
      };
      
      userRepository.findById.mockResolvedValue(mockUser);
      
      const result = await userService.getUserById('1');
      
      expect(result).toEqual(mockUser);
      expect(userRepository.findById).toHaveBeenCalledWith('1');
    });
    
    it('should return null when user not found', async () => {
      userRepository.findById.mockResolvedValue(null);
      
      const result = await userService.getUserById('999');
      
      expect(result).toBeNull();
    });
  });
});
```

---

## Documentation Standards

### Code Comments

```typescript
/**
 * Retrieves user data by ID
 * 
 * @param id - The unique identifier of the user
 * @returns Promise resolving to User object or null if not found
 * @throws {AppError} When database connection fails
 * 
 * @example
 * const user = await userService.getUserById('123');
 */
async getUserById(id: string): Promise<User | null> {
  // Implementation
}

// ✅ GOOD: Explain complex logic
// Calculate settlement amount based on claim type and coverage percentage
// Formula: (claim_amount * coverage_percentage) - deductible
const settlementAmount = (claim.amount * claim.coveragePercentage / 100) - claim.deductible;

// ❌ BAD: Don't state the obvious
// Set name variable
const name = user.name; // Unnecessary comment
```

### README Documentation

```markdown
# Component/Module Name

## Overview
Brief description of what this component/module does.

## Usage
\`\`\`typescript
// Example usage
import { ComponentName } from './component-name';

const component = new ComponentName();
component.doSomething();
\`\`\`

## API

### Inputs
- `property1: type` - Description
- `property2: type` - Description

### Outputs
- `event1: EventEmitter<type>` - Description

### Methods
- `methodName(param: type): returnType` - Description

## Examples
Provide practical examples

## Notes
Any important notes or gotchas
```

---

## Git Standards

### Branch Naming
```
feature/user-authentication
bugfix/login-error-handling
hotfix/security-patch
refactor/user-service
chore/update-dependencies
```

### Commit Messages
```
feat: add user authentication module
fix: resolve login error on mobile devices
docs: update API documentation
style: format code according to standards
refactor: simplify user service logic
test: add unit tests for auth service
chore: update dependencies to latest versions
```

### Commit Message Format
```
<type>(<scope>): <subject>

<body>

<footer>
```

Example:
```
feat(auth): add JWT token refresh mechanism

- Implement token refresh endpoint
- Add automatic token renewal before expiration
- Update auth interceptor to handle refresh

Closes #123
```

---

---

# PART V: SECURITY, PERFORMANCE & CODE QUALITY
*Cross-cutting concerns for both frontend and backend*

---

## Security Standards

### Authentication & Authorization
```typescript
// ✅ GOOD: Hash passwords
import bcrypt from 'bcrypt';

const hashedPassword = await bcrypt.hash(password, 10);

// ✅ GOOD: Use JWT securely
const token = jwt.sign(
  { userId: user.id, role: user.role },
  process.env.JWT_SECRET!,
  { expiresIn: '1h' }
);

// ✅ GOOD: Validate input
const sanitized = validator.escape(userInput);

// ❌ BAD: Never store plain text passwords
// ❌ BAD: Never hardcode secrets
const secret = 'my-secret-key'; // NEVER DO THIS
```

### Data Protection
```typescript
// ✅ GOOD: Sanitize user input
import DOMPurify from 'dompurify';

const sanitizedHtml = DOMPurify.sanitize(userHtml);

// ✅ GOOD: Use environment variables for secrets
const apiKey = process.env.API_KEY;

// ✅ GOOD: Implement rate limiting
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api', limiter);
```

---

## Performance Standards

### Frontend Optimization
```typescript
// ✅ GOOD: Lazy load modules
const routes: Routes = [
  {
    path: 'users',
    loadChildren: () => import('./users/users.module').then(m => m.UsersModule)
  }
];

// ✅ GOOD: Use OnPush change detection
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush
})

// ✅ GOOD: Debounce expensive operations
this.searchControl.valueChanges.pipe(
  debounceTime(300),
  distinctUntilChanged()
).subscribe();

// ✅ GOOD: Use trackBy in ngFor
<div *ngFor="let item of items; trackBy: trackById">
```

### Backend Optimization
```typescript
// ✅ GOOD: Use database indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_claims_status ON claims(status);

// ✅ GOOD: Implement caching
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 600 }); // 10 minutes

// ✅ GOOD: Use connection pooling
const pool = new sql.ConnectionPool({
  max: 10,
  min: 0,
  idleTimeoutMillis: 30000
});

// ✅ GOOD: Paginate large datasets
async getUsers(page: number, limit: number) {
  const offset = (page - 1) * limit;
  return await this.db.query(
    'SELECT * FROM users OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY',
    { offset, limit }
  );
}
```

---

## Code Review Checklist

### 🎯 REUSABILITY (Check First - Most Critical)
- [ ] **Zero code duplication** - No copy-pasted code
- [ ] **Reusable components used** - Not creating new when one exists
- [ ] **Common logic extracted** - Into services/utilities/pipes
- [ ] **Shared module updated** - New reusable code properly exported
- [ ] **Generic implementation** - Component/function is flexible for reuse
- [ ] **No unnecessary dependencies** - Only essential packages added
- [ ] **Bundle size impact** - Checked that size hasn't increased unnecessarily

### General
- [ ] Code follows project standards and conventions
- [ ] No hardcoded values (use configuration)
- [ ] Proper error handling implemented
- [ ] Code is readable and well-documented
- [ ] No console.log statements in production code
- [ ] All TODOs are tracked

### Functionality
- [ ] Code works as intended
- [ ] Edge cases are handled
- [ ] Input validation is implemented
- [ ] Error messages are user-friendly

### Testing
- [ ] Unit tests are written and passing
- [ ] Test coverage is adequate (>80%)
- [ ] Integration tests for critical paths

### Security
- [ ] No security vulnerabilities
- [ ] Sensitive data is not exposed
- [ ] Input is sanitized
- [ ] Authentication/authorization is properly implemented

### Performance
- [ ] No unnecessary database queries
- [ ] Efficient algorithms used
- [ ] Large datasets are paginated
- [ ] Caching is implemented where appropriate

### **Reusability (CRITICAL)** ⭐
- [ ] **No duplicate code** - Checked for similar code elsewhere
- [ ] **Extracted common logic** into shared services/utilities
- [ ] **Used existing shared components** before creating new ones
- [ ] **Created reusable components** if pattern will be used again
- [ ] **Added to shared module** if component/pipe/directive is reusable
- [ ] **Followed DRY principles** throughout

---

## 📋 Reusability Checklist (Use Before Every Commit)

### Before Writing New Code
1. [ ] **Search first**: Does this code/component already exist?
2. [ ] **Can I reuse?**: Can I use an existing component/service/utility?
3. [ ] **Will I need this again?**: If yes, make it reusable from the start

### When Writing Code
4. [ ] **Extract immediately**: Don't wait to refactor duplicates
5. [ ] **Think generic**: Can this be more flexible/reusable?
6. [ ] **Use composition**: Combine existing components instead of creating new

### After Writing Code
7. [ ] **Review for patterns**: Did I repeat any logic?
8. [ ] **Check bundle size**: Did I add unnecessary dependencies?
9. [ ] **Document reusable code**: Add usage examples for shared code

### Before Pull Request
10. [ ] **No copy-paste**: Zero duplicated code blocks
11. [ ] **Shared module updated**: New reusable items exported
12. [ ] **Utility functions created**: Common logic extracted
13. [ ] **Bundle analyzed**: No unnecessary increase in size

---

## Summary

Following these coding standards ensures:

### **PRIMARY GOAL - REUSABILITY** 🎯
- **40-60% smaller bundle size** through code sharing
- **Zero code duplication** across the application
- **Single source of truth** for all common functionality
- **Faster development** through component library approach
- **Easier maintenance** with centralized logic

### Additional Benefits
- **Consistency** across the codebase
- **Maintainability** for future development
- **Quality** in delivered features
- **Security** in application
- **Performance** optimization
- **Collaboration** efficiency

---

## 🚫 Anti-Patterns to AVOID

### Never Do This:
```typescript
// ❌ Copy-pasting code
// ❌ Creating similar components with slight differences
// ❌ Duplicating utility functions
// ❌ Not checking if something already exists
// ❌ Importing entire libraries for one function
// ❌ Creating feature-specific components when generic would work
// ❌ Keeping unused dependencies
// ❌ Hard-coding values that could be configuration
```

### Always Do This:
```typescript
// ✅ Search for existing solutions first
// ✅ Extract common logic immediately
// ✅ Create generic, reusable components
// ✅ Use shared utilities
// ✅ Import only what you need
// ✅ Think "component library"
// ✅ Remove unused code/dependencies
// ✅ Use configuration over hard-coding
```

---

## 📏 Measuring Success

### Code Reusability Metrics
- **Shared Component Usage**: Target 70%+ of UI using shared components
- **Code Duplication**: Target < 5% duplicate code
- **Bundle Size**: 
  - Initial: < 500KB (gzipped)
  - Per Module: < 200KB (gzipped)
- **Utility Coverage**: 80%+ common operations use shared utilities
- **Shared Module Size**: Should grow over time as more reusable code is added

### Regular Audits
- **Weekly**: Review new code for duplication
- **Monthly**: Analyze bundle size and identify optimization opportunities
- **Quarterly**: Refactor and consolidate similar patterns

---

## 🎓 Key Takeaways

### Frontend (Angular) Focus
- **Modularize by domain** - Feature modules, lazy loading
- **Shared components** - Build once, use everywhere
- **Common business logic** - Extract to common module
- **Utilities & pipes** - Reusable transformations

### Backend (Node.js/Express) Focus
- **Feature-based structure** - Organize by business domain
- **Base classes** - BaseRepository, BaseController
- **Common middleware** - Authentication, validation, error handling
- **Utilities** - ResponseUtil, error handling, logging

### Universal Mantras

> **"Write once, use everywhere. If you're writing it twice, you're doing it wrong."**

> **"The best code is reusable code. The best architecture is one that maximizes reusability."**

> **"Before you write, search. Before you search, think reusable."**

> **"Modularize by domain, commonize by pattern, reuse by design."**

---

## 📚 Document Summary

This coding standards document covers:
- ✅ **Frontend Standards**: Angular, TypeScript, Components, Services, State Management
- ✅ **Backend Standards**: Node.js, Express, Repository Pattern, Middleware, API Design
- ✅ **Universal Principles**: Reusability, Modularization, Commonization
- ✅ **Testing**: Unit tests, integration tests for both layers
- ✅ **Security**: Authentication, authorization, data protection
- ✅ **Performance**: Bundle optimization (frontend), API optimization (backend)

---

**All developers working on frontend (Angular) or backend (Node.js/Express) must adhere to these standards. Regular code reviews will ensure compliance with emphasis on REUSABILITY, MODULARIZATION, and COMMONIZATION above all else.**
