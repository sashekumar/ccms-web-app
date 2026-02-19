# CCMS Permission Control System

## Overview

The Permission Control System is a comprehensive Role-Based Access Control (RBAC) implementation that provides granular security control over application features and data access. It supports:

- **Multi-role assignments**: Users can have multiple active roles simultaneously
- **Module categorization**: Organize features into logical groups for better navigation
- **Flexible permissions**: Combine modules with actions for fine-grained access control
- **Expiring roles**: Assign temporary access with automatic expiration
- **System audit**: Track who assigned permissions and when

## Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│                        Permission Flow                              │
└────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  Users   │───▶│  Roles   │───▶│ Module   │───▶│  Access  │───▶│ UI/API   │
│          │    │          │    │ Actions  │    │  Control │    │  Guard   │
└──────────┘    └──────────┘    └──────────┘    └──────────┘    └──────────┘
      │              │               │                │                │
      │              │               │                │                │
      ▼              ▼               ▼                ▼                ▼
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│ Multiple │    │  Role    │    │ Module-  │    │ Granted  │    │ Dynamic  │
│  Roles   │    │Permissions│   │ Actions  │    │ Denied   │    │  Menu    │
└──────────┘    └──────────┘    └──────────┘    └──────────┘    └──────────┘

┌────────────────────────────────────────────────────────────────────┐
│                      Category-Based Menu                            │
└────────────────────────────────────────────────────────────────────┘
                                   │
              ┌────────────────────┼────────────────────┐
              ▼                    ▼                    ▼
        ┌──────────┐         ┌──────────┐        ┌──────────┐
        │Dashboard │         │ System   │        │ Business │
        │(No       │         │  Admin   │        │ Modules  │
        │Category) │         │ Category │        │ Category │
        └──────────┘         └──────────┘        └──────────┘
              │                    │                    │
              │                    ▼                    ▼
              │              ┌──────────┐        ┌──────────┐
              │              │  Users   │        │  Claims  │
              │              │  Roles   │        │ Members  │
              │              │ Modules  │        │Hospitals │
              │              │ Actions  │        │  etc.    │
              │              └──────────┘        └──────────┘
              │
              └─────▶ Top-level menu item (display_order: 1)
```

## Database Schema

### Entity Relationship

```
ccms_categories                ccms_roles
    │                              │
    │ (1:N)                        │ (1:N)
    │                              │
    └──▶ ccms_modules ◀────(N:1)───┘
              │                    │
              │ (1:N)              │
              │                    │
              ▼                    │
    ccms_module_actions            │
              │                    │
              │ (1:N)              │ (N:N)
              │                    │
              └──────▶ ccms_role_permissions
                            │
                            │ (N:N)
                            │
                            ▼
                      ccms_user_roles ◀──── ccms_users
                            │
                            │ (N:1)
                            │
                            ▼
                       ccms_roles
    
    ccms_actions ────(1:N)───▶ ccms_module_actions
```

### Core Tables

#### 1. ccms_categories
**Purpose:** Groups related modules in the navigation menu  
**Example:** 'System Administration' contains User, Role, Module Management

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| category_id | BIGINT | PK, IDENTITY | Unique identifier |
| category_name | NVARCHAR(100) | NOT NULL, UNIQUE | Display name (e.g., 'System Administration') |
| category_code | NVARCHAR(50) | NOT NULL, UNIQUE | Programmatic identifier (e.g., 'SYSTEM_ADMIN') |
| description | NVARCHAR(500) | NULL | Category purpose |
| icon | NVARCHAR(50) | NULL | FontAwesome icon class (e.g., 'cog') |
| display_order | INT | NOT NULL, DEFAULT 0 | Menu ordering (lower = appears first) |
| is_active | BIT | NOT NULL, DEFAULT 1 | 0=Hidden from menu |
| created_at | DATETIME2 | NOT NULL, DEFAULT GETDATE() | Record creation timestamp |
| updated_at | DATETIME2 | NULL | Last modification timestamp |

**Indexes:**
- `idx_ccms_categories_code` on category_code
- `idx_ccms_categories_active` on is_active
- `idx_ccms_categories_order` on display_order

---

#### 2. ccms_roles
**Purpose:** Stores system and business roles for RBAC  
**Note:** role_id=1 is Super Admin (system role, cannot be deleted)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| role_id | BIGINT | PK, IDENTITY | Unique identifier (1: Super Admin, 2+: Other roles) |
| role_name | NVARCHAR(100) | NOT NULL, UNIQUE | Display name (e.g., 'Super Admin', 'Manager') |
| role_code | NVARCHAR(50) | NOT NULL, UNIQUE | Programmatic identifier (e.g., 'SUPER_ADMIN') |
| description | NVARCHAR(500) | NULL | Role purpose and responsibilities |
| is_system_role | BIT | NOT NULL, DEFAULT 0 | 1=Protected system role (cannot be deleted) |
| is_active | BIT | NOT NULL, DEFAULT 1 | 0=Deactivated (role assignments become inactive) |
| created_at | DATETIME2 | NOT NULL, DEFAULT GETDATE() | Record creation timestamp |
| updated_at | DATETIME2 | NULL | Last modification timestamp |
| created_by | VARCHAR(50) | NULL | Username of creator |
| updated_by | VARCHAR(50) | NULL | Username of last modifier |

**Indexes:**
- `idx_ccms_roles_code` on role_code
- `idx_ccms_roles_active` on is_active

---

#### 3. ccms_modules
**Purpose:** Application features/pages that can be secured with permissions  
**Note:** Modules with category_id=NULL appear as top-level menu items (e.g., Dashboard)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| module_id | BIGINT | PK, IDENTITY | Unique identifier |
| module_name | NVARCHAR(100) | NOT NULL, UNIQUE | Display name (e.g., 'User Management') |
| module_code | NVARCHAR(50) | NOT NULL, UNIQUE | Programmatic identifier (e.g., 'USER_MANAGEMENT') |
| description | NVARCHAR(500) | NULL | Module purpose and functionality |
| category_id | BIGINT | FK, NULL | FK to ccms_categories (NULL = uncategorized/top-level) |
| icon | NVARCHAR(50) | NULL | FontAwesome icon class (e.g., 'users', 'shield-alt') |
| route | NVARCHAR(200) | NULL | Frontend route path (e.g., '/admin/users') |
| display_order | INT | NOT NULL, DEFAULT 0 | Menu ordering within category (lower = appears first) |
| is_active | BIT | NOT NULL, DEFAULT 1 | 0=Hidden from menu and permission checks |
| created_at | DATETIME2 | NOT NULL, DEFAULT GETDATE() | Record creation timestamp |
| updated_at | DATETIME2 | NULL | Last modification timestamp |

**Foreign Keys:**
- `fk_ccms_modules_category` → ccms_categories(category_id)

**Indexes:**
- `idx_ccms_modules_code` on module_code
- `idx_ccms_modules_active` on is_active
- `idx_ccms_modules_category` on category_id

---

#### 4. ccms_actions
**Purpose:** Generic operations that can be performed (VIEW, CREATE, UPDATE, DELETE, etc.)  
**Note:** Actions are reusable across modules via ccms_module_actions bridge table

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| action_id | BIGINT | PK, IDENTITY | Unique identifier |
| action_name | NVARCHAR(100) | NOT NULL, UNIQUE | Display name (e.g., 'View', 'Create', 'Delete') |
| action_code | NVARCHAR(50) | NOT NULL, UNIQUE | Programmatic identifier (e.g., 'VIEW', 'CREATE') |
| description | NVARCHAR(500) | NULL | Action purpose |
| is_active | BIT | NOT NULL, DEFAULT 1 | 0=Action unavailable system-wide |
| created_at | DATETIME2 | NOT NULL, DEFAULT GETDATE() | Record creation timestamp |
| updated_at | DATETIME2 | NULL | Last modification timestamp |

**Indexes:**
- `idx_ccms_actions_code` on action_code
- `idx_ccms_actions_active` on is_active

---

#### 5. ccms_module_actions (Bridge Table)
**Purpose:** Links actions to specific modules with optional custom labels  
**Example:** Module='User Management' + Action='CREATE' = 'Create User' permission

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| module_action_id | BIGINT | PK, IDENTITY | Unique identifier |
| module_id | BIGINT | FK, NOT NULL | FK to ccms_modules |
| action_id | BIGINT | FK, NOT NULL | FK to ccms_actions |
| action_label | NVARCHAR(200) | NULL | Custom display label (e.g., 'Create New User') |
| is_active | BIT | NOT NULL, DEFAULT 1 | 0=Permission unavailable for assignment |
| created_at | DATETIME2 | NOT NULL, DEFAULT GETDATE() | Record creation timestamp |

**Foreign Keys:**
- `fk_ccms_module_actions_module` → ccms_modules(module_id) ON DELETE CASCADE
- `fk_ccms_module_actions_action` → ccms_actions(action_id) ON DELETE CASCADE

**Constraints:**
- `uq_ccms_module_actions` UNIQUE (module_id, action_id) - One action per module

**Indexes:**
- `idx_ccms_module_actions_module` on module_id
- `idx_ccms_module_actions_action` on action_id
- `idx_ccms_module_actions_active` on is_active

---

#### 6. ccms_role_permissions (Bridge Table)
**Purpose:** Assigns specific module-action permissions to roles  
**Example:** Role='Super Admin' has permission for 'User Management.CREATE'

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| permission_id | BIGINT | PK, IDENTITY | Unique identifier |
| role_id | BIGINT | FK, NOT NULL | FK to ccms_roles |
| module_action_id | BIGINT | FK, NOT NULL | FK to ccms_module_actions |
| granted | BIT | NOT NULL, DEFAULT 1 | 1=Permission granted, 0=Explicit denial |
| created_at | DATETIME2 | NOT NULL, DEFAULT GETDATE() | When permission was assigned |
| created_by | VARCHAR(50) | NULL | Username who assigned permission |

**Foreign Keys:**
- `fk_ccms_role_permissions_role` → ccms_roles(role_id) ON DELETE CASCADE
- `fk_ccms_role_permissions_module_action` → ccms_module_actions(module_action_id) ON DELETE CASCADE

**Constraints:**
- `uq_ccms_role_permissions` UNIQUE (role_id, module_action_id) - One permission per role-action

**Indexes:**
- `idx_ccms_role_permissions_role` on role_id
- `idx_ccms_role_permissions_module_action` on module_action_id
- `idx_ccms_role_permissions_granted` on granted

---

#### 7. ccms_user_roles (Bridge Table)
**Purpose:** Assigns roles to users (many-to-many relationship)  
**Note:** Users can have multiple active roles; permissions are combined

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| user_role_id | BIGINT | PK, IDENTITY | Unique identifier |
| user_id | BIGINT | FK, NOT NULL | FK to ccms_users |
| role_id | BIGINT | FK, NOT NULL | FK to ccms_roles |
| is_active | BIT | NOT NULL, DEFAULT 1 | 0=Assignment suspended (permissions removed) |
| assigned_at | DATETIME2 | NOT NULL, DEFAULT GETDATE() | When role was assigned to user |
| assigned_by | VARCHAR(50) | NULL | Username who performed assignment |
| expires_at | DATETIME2 | NULL | Optional expiration (NULL = permanent) |

**Foreign Keys:**
- `fk_ccms_user_roles_user` → ccms_users(user_id) ON DELETE CASCADE
- `fk_ccms_user_roles_role` → ccms_roles(role_id) ON DELETE CASCADE

**Constraints:**
- `uq_ccms_user_roles` UNIQUE (user_id, role_id) - One assignment per user-role pair

**Indexes:**
- `idx_ccms_user_roles_user` on user_id
- `idx_ccms_user_roles_role` on role_id
- `idx_ccms_user_roles_active` on is_active
- `idx_ccms_user_roles_expires` on expires_at

---

### Utility Views

#### vw_user_permissions
**Purpose:** Flattened view of all active permissions for each user  
**Usage:** Check user permissions, build dynamic menus, permission-based UI

**Columns:**
- user_id, username, full_name
- role_id, role_name, role_code
- module_id, module_name, module_code, module_icon, module_route, module_display_order
- category_id, category_name, category_code, category_icon, category_display_order
- action_id, action_name, action_code
- module_action_id, action_label
- permission_id, granted
- role_active, role_expires_at

**Filters:**
- Only active users, roles, modules, actions, module-actions
- Only granted permissions
- Excludes expired role assignments

---

#### vw_role_permissions
**Purpose:** Summary of all permissions assigned to each role  
**Usage:** Role management UI, permission audit reports

**Columns:**
- role_id, role_name, role_code
- module_id, module_name, module_code
- action_id, action_name, action_code
- module_action_id
- permission_key (e.g., 'USER_MANAGEMENT.CREATE')
- permission_label (e.g., 'Create User')
- granted

---

### Stored Procedures

#### sp_check_user_permission
**Purpose:** Fast permission check for a specific user, module, and action  
**Usage:** Backend middleware, API endpoint guards

**Parameters:**
- @user_id BIGINT
- @module_code NVARCHAR(50)
- @action_code NVARCHAR(50)

**Returns:** 1 row if granted, 0 rows if denied

---

#### sp_get_user_permissions_json
**Purpose:** Returns all permissions for a user in JSON format  
**Usage:** Frontend menu building, permission caching

**Parameters:**
- @user_id BIGINT

**Returns:** JSON array of modules with nested actions

---

#### sp_assign_role_to_user
**Purpose:** Assigns a role to a user with optional expiration  
**Usage:** User role management, temporary access grants

**Parameters:**
- @user_id BIGINT
- @role_id BIGINT
- @assigned_by VARCHAR(50)
- @expires_at DATETIME2 (optional)

**Returns:** Status ('SUCCESS' or 'ERROR') and message

## Installation Steps

### Prerequisites
- SQL Server 2019 or later
- Database `db_ccms` created
- Core schema installed: `ccms_new_schema_2026_v3.sql` (for ccms_users table)

### Step 1: Run Permission Control Schema

```powershell
# From project root directory
sqlcmd -S localhost,1433 -U sa -P YOUR_PASSWORD -d db_ccms -C -i "migrations\permission-control-schema.sql"
```

**What it creates:**
- 7 tables: roles, categories, modules, actions, module_actions, role_permissions, user_roles
- 2 views: vw_user_permissions, vw_role_permissions
- 3 stored procedures: sp_check_user_permission, sp_get_user_permissions_json, sp_assign_role_to_user
- Seed data:
  - 1 Category: System Administration
  - 1 Role: Super Admin (full system access)
  - 9 Modules: Dashboard + 8 Permission Management modules
  - 17 Actions: VIEW, CREATE, UPDATE, DELETE, APPROVE, etc.
  - 33 Module-Action combinations
  - Super Admin permissions for all modules

### Step 2: Run Users Seed Data

```powershell
sqlcmd -S localhost,1433 -U sa -P YOUR_PASSWORD -d db_ccms -C -i "migrations\users-seed-data.sql"
```

**What it creates:**
- Super Admin user account (username: `admin`, password: `Password123!`)
- Auto-assigns Super Admin role to admin user
- Validates setup with user and role assignment queries

**⚠️ IMPORTANT:** Change the default password immediately after first login!

### Step 3: Verify Installation

```sql
-- Check categories
SELECT * FROM ccms_categories ORDER BY display_order;

-- Check modules with categories
SELECT 
    m.module_name,
    m.module_code,
    m.display_order,
    c.category_name,
    m.route,
    m.icon
FROM ccms_modules m
LEFT JOIN ccms_categories c ON m.category_id = c.category_id
ORDER BY 
    CASE WHEN m.category_id IS NULL THEN 0 ELSE 1 END,  -- Uncategorized first
    c.display_order,
    m.display_order;

-- Check Super Admin role
SELECT * FROM ccms_roles WHERE role_code = 'SUPER_ADMIN';

-- Check Super Admin permissions
SELECT 
    r.role_name,
    m.module_name,
    a.action_name,
    permission_key,
    permission_label
FROM vw_role_permissions
WHERE role_code = 'SUPER_ADMIN'
ORDER BY module_code, action_code;

-- Check admin user role assignment
SELECT 
    u.username,
    u.full_name,
    r.role_name,
    ur.is_active,
    ur.assigned_at,
    ur.expires_at
FROM ccms_user_roles ur
INNER JOIN ccms_users u ON ur.user_id = u.user_id
INNER JOIN ccms_roles r ON ur.role_id = r.role_id
WHERE u.username = 'admin';

-- Check admin user permissions
SELECT COUNT(*) AS permission_count
FROM vw_user_permissions
WHERE username = 'admin';
```

### Step 4: Test Login

1. Start the application (backend + frontend)
2. Navigate to login page
3. Login with:
   - **Username:** `admin`
   - **Password:** `Password123!`
4. Verify Super Admin menu access:
   - Dashboard (top-level)
   - System Administration (category)
     - User Management
     - Role Management
     - Category Management
     - Module Management
     - Action Management
     - Module Action Management
     - Role Permission Management
     - User Role Assignment

### Step 5: Change Default Password

1. Navigate to User Management
2. Edit admin user
3. Set a strong password
4. Save changes

---

### Database Migration from Existing System

If you have an existing system with roles in `ccms_users.role_id`:

```sql
-- Step 1: Identify unique roles in old system
SELECT DISTINCT role_id, COUNT(*) AS user_count
FROM ccms_users
WHERE role_id IS NOT NULL
GROUP BY role_id
ORDER BY role_id;

-- Step 2: Create corresponding roles in new system
-- (Manually create via Role Management UI or insert into ccms_roles)

-- Step 3: Migrate user role assignments
INSERT INTO ccms_user_roles (user_id, role_id, assigned_by, is_active)
SELECT 
    user_id,
    CASE 
        WHEN role_id = 1 THEN 1  -- Super Admin
        -- Map other role_ids to new ccms_roles.role_id
        ELSE role_id
    END AS new_role_id,
    'MIGRATION',
    1
FROM ccms_users
WHERE role_id IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM ccms_user_roles ur 
      WHERE ur.user_id = ccms_users.user_id
  );

-- Step 4: Verify migration
SELECT 
    u.username,
    u.full_name,
    u.role_id AS old_role_id,
    r.role_name AS new_role
FROM ccms_users u
LEFT JOIN ccms_user_roles ur ON u.user_id = ur.user_id
LEFT JOIN ccms_roles r ON ur.role_id = r.role_id
WHERE u.role_id IS NOT NULL
ORDER BY u.user_id;
```

## Permission Matrix

### Default System Configuration

After installation, the system includes:

**1 Role:**
- Super Admin (role_id=1) - Full system access

**9 Modules:**
1. Dashboard (uncategorized, display_order=1)
2. User Management (System Administration, display_order=10)
3. Role Management (System Administration, display_order=20)
4. Category Management (System Administration, display_order=25)
5. Module Management (System Administration, display_order=30)
6. Action Management (System Administration, display_order=40)
7. Module Action Management (System Administration, display_order=50)
8. Role Permission Management (System Administration, display_order=60)
9. User Role Assignment (System Administration, display_order=70)

**17 Actions:**
- VIEW, CREATE, UPDATE, DELETE (Core CRUD)
- APPROVE, REJECT, SUBMIT (Workflow)
- EXPORT, IMPORT, PRINT (Data operations)
- AUDIT, ASSIGN, SETTLE, REOPEN (Specialized)
- COMMENT, ATTACH_ROLE, DETACH_ROLE (Management)

---

### Super Admin Permissions

Super Admin has full access to all permission control modules:

| Module | VIEW | CREATE | UPDATE | DELETE | Special Actions |
|--------|:----:|:------:|:------:|:------:|:----------------|
| **Dashboard** | ✅ | - | - | - | - |
| **User Management** | ✅ | ✅ | ✅ | ✅ | - |
| **Role Management** | ✅ | ✅ | ✅ | ✅ | - |
| **Category Management** | ✅ | ✅ | ✅ | ✅ | - |
| **Module Management** | ✅ | ✅ | ✅ | ✅ | - |
| **Action Management** | ✅ | ✅ | ✅ | ✅ | - |
| **Module Action Management** | ✅ | ✅ | ✅ | ✅ | - |
| **Role Permission Management** | ✅ | ✅ | ✅ | ✅ | - |
| **User Role Assignment** | ✅ | ✅ | ✅ | ✅ | ATTACH_ROLE, DETACH_ROLE |

**Total Permissions:** 33 module-action combinations

---

### Permission Codes Reference

#### Module Codes
```
DASHBOARD
USER_MANAGEMENT
ROLE_MANAGEMENT
CATEGORY_MANAGEMENT
MODULE_MANAGEMENT
ACTION_MANAGEMENT
MODULE_ACTION_MANAGEMENT
ROLE_PERMISSION_MANAGEMENT
USER_ROLE_ASSIGNMENT
```

#### Action Codes
```
VIEW        - View/Read access to module
CREATE      - Create new records
UPDATE      - Update existing records
DELETE      - Delete records
APPROVE     - Approve pending items
REJECT      - Reject pending items
SUBMIT      - Submit for review
EXPORT      - Export data
IMPORT      - Import data
PRINT       - Print documents
AUDIT       - Audit trail access
ASSIGN      - Assign tasks to users
SETTLE      - Settle/finalize transactions
REOPEN      - Reopen closed items
COMMENT     - Add comments/notes
ATTACH_ROLE - Attach/assign role to user
DETACH_ROLE - Detach/remove role from user
```

#### Permission Key Format
Permission keys follow the format: `MODULE_CODE.ACTION_CODE`

**Examples:**
- `USER_MANAGEMENT.CREATE` - Permission to create users
- `ROLE_MANAGEMENT.VIEW` - Permission to view roles
- `USER_ROLE_ASSIGNMENT.ATTACH_ROLE` - Permission to assign roles to users

---

### Creating Business Roles

After initial setup, you can create business-specific roles with customized permissions:

**Example: Claims Manager Role**

1. **Create Role:**
   ```sql
   INSERT INTO ccms_roles (role_name, role_code, description, is_system_role)
   VALUES ('Claims Manager', 'CLAIMS_MANAGER', 'Manages claim processing workflow', 0);
   ```

2. **Assign Permissions:**
   ```sql
   -- Get role_id
   DECLARE @roleId BIGINT = (SELECT role_id FROM ccms_roles WHERE role_code = 'CLAIMS_MANAGER');
   
   -- Assign VIEW permission for Dashboard
   INSERT INTO ccms_role_permissions (role_id, module_action_id, granted, created_by)
   SELECT @roleId, module_action_id, 1, 'SYSTEM'
   FROM ccms_module_actions ma
   INNER JOIN ccms_modules m ON ma.module_id = m.module_id
   INNER JOIN ccms_actions a ON ma.action_id = a.action_id
   WHERE m.module_code = 'DASHBOARD' AND a.action_code = 'VIEW';
   ```

3. **Assign to Users:**
   ```sql
   EXEC sp_assign_role_to_user 
       @user_id = 5,
       @role_id = @roleId,
       @assigned_by = 'admin',
       @expires_at = NULL;
   ```

---

### Permission Checking Examples

#### Quick Permission Checks

```sql
-- Check if user has specific permission
EXEC sp_check_user_permission 
    @user_id = 1,
    @module_code = 'USER_MANAGEMENT',
    @action_code = 'DELETE';

-- Get all permissions for a user
SELECT 
    module_code,
    action_code,
    permission_key,
    permission_label
FROM vw_user_permissions
WHERE username = 'admin'
ORDER BY module_code, action_code;

-- Check which users have a specific permission
SELECT DISTINCT
    username,
    full_name,
    role_name
FROM vw_user_permissions
WHERE module_code = 'USER_MANAGEMENT'
  AND action_code = 'DELETE'
ORDER BY username;

-- View permissions by role
SELECT 
    role_code,
    permission_key,
    permission_label
FROM vw_role_permissions
ORDER BY role_code, module_code, action_code;
```

## Usage Guide

### Backend Implementation

#### 1. Permission Check Middleware

```typescript
// middleware/permission.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { PermissionsService } from '../features/permissions/permissions.service';

export function requirePermission(moduleCode: string, actionCode: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?.userId;
      
      if (!userId) {
        return res.status(401).json({ 
          success: false, 
          message: 'Unauthorized' 
        });
      }
      
      const permissionService = new PermissionsService();
      const hasPermission = await permissionService.checkUserPermission(
        userId, 
        moduleCode, 
        actionCode
      );
      
      if (!hasPermission) {
        return res.status(403).json({ 
          success: false, 
          message: 'Insufficient permissions' 
        });
      }
      
      next();
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: 'Error checking permissions' 
      });
    }
  };
}
```

#### 2. Permission Service

```typescript
// features/permissions/permissions.service.ts
export class PermissionsService {
  async checkUserPermission(
    userId: number, 
    moduleCode: string, 
    actionCode: string
  ): Promise<boolean> {
    const result = await pool.request()
      .input('userId', sql.BigInt, userId)
      .input('moduleCode', sql.NVarChar(50), moduleCode)
      .input('actionCode', sql.NVarChar(50), actionCode)
      .execute('sp_check_user_permission');
    
    return result.recordset.length > 0;
  }
  
  async getUserPermissionsFormatted(userId: number): Promise<any> {
    // Returns structured menu data with categories
    const permissions = await this.repository.getUserPermissionsFormatted(userId);
    return permissions;
  }
}
```

#### 3. Route Protection

```typescript
// features/users/users.routes.ts
import { requirePermission } from '../../middleware/permission.middleware';

router.post('/list', 
  requirePermission('USER_MANAGEMENT', 'VIEW'), 
  controller.getUsers
);

router.post('/create', 
  requirePermission('USER_MANAGEMENT', 'CREATE'), 
  controller.createUser
);

router.put('/:id', 
  requirePermission('USER_MANAGEMENT', 'UPDATE'), 
  controller.updateUser
);

router.delete('/:id', 
  requirePermission('USER_MANAGEMENT', 'DELETE'), 
  controller.deleteUser
);
```

---

### Frontend Implementation

#### 1. Permission Service

```typescript
// services/permission.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class PermissionService {
  private apiUrl = '/api/permissions';
  private permissionsSubject = new BehaviorSubject<any>(null);
  public permissions$ = this.permissionsSubject.asObservable();
  
  constructor(private http: HttpClient) {}
  
  // Load user permissions on login
  loadUserPermissions(userId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/user/${userId}`)
      .pipe(
        tap(permissions => this.permissionsSubject.next(permissions)),
        map(response => response)
      );
  }
  
  // Check if user has specific permission
  hasPermission(moduleCode: string, actionCode: string): boolean {
    const permissions = this.permissionsSubject.value;
    if (!permissions) return false;
    
    return permissions.some((p: any) => 
      p.module_code === moduleCode && 
      p.action_code === actionCode
    );
  }
  
  // Check permission reactive
  hasPermission$(moduleCode: string, actionCode: string): Observable<boolean> {
    return this.permissions$.pipe(
      map(permissions => {
        if (!permissions) return false;
        return permissions.some((p: any) => 
          p.module_code === moduleCode && 
          p.action_code === actionCode
        );
      })
    );
  }
}
```

#### 2. Permission Directive

```typescript
// directives/has-permission.directive.ts
import { Directive, Input, TemplateRef, ViewContainerRef, OnInit } from '@angular/core';
import { PermissionService } from '../services/permission.service';

@Directive({
  selector: '[hasPermission]',
  standalone: true
})
export class HasPermissionDirective implements OnInit {
  @Input() hasPermission!: string; // Format: 'MODULE_CODE.ACTION_CODE'
  
  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private permissionService: PermissionService
  ) {}
  
  ngOnInit() {
    const [moduleCode, actionCode] = this.hasPermission.split('.');
    
    this.permissionService.hasPermission$(moduleCode, actionCode)
      .subscribe(hasPermission => {
        if (hasPermission) {
          this.viewContainer.createEmbeddedView(this.templateRef);
        } else {
          this.viewContainer.clear();
        }
      });
  }
}
```

#### 3. Route Guard

```typescript
// guards/permission.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router } from '@angular/router';
import { PermissionService } from '../services/permission.service';

@Injectable({
  providedIn: 'root'
})
export class PermissionGuard implements CanActivate {
  constructor(
    private permissionService: PermissionService,
    private router: Router
  ) {}
  
  canActivate(route: ActivatedRouteSnapshot): boolean {
    const requiredPermission = route.data['permission'] as string;
    
    if (!requiredPermission) {
      return true; // No permission required
    }
    
    const [moduleCode, actionCode] = requiredPermission.split('.');
    
    if (this.permissionService.hasPermission(moduleCode, actionCode)) {
      return true;
    }
    
    this.router.navigate(['/unauthorized']);
    return false;
  }
}
```

#### 4. Template Usage

```html
<!-- Hide/show elements based on permission -->
<button *hasPermission="'USER_MANAGEMENT.CREATE'" 
        (click)="createUser()"
        class="btn btn-primary">
  Create User
</button>

<!-- Disable button if no permission -->
<button [disabled]="!(hasCreatePermission$ | async)"
        (click)="createUser()">
  Create User
</button>

<!-- Multiple permission checks -->
<div *hasPermission="'USER_MANAGEMENT.VIEW'">
  <table>
    <!-- User list -->
  </table>
  
  <button *hasPermission="'USER_MANAGEMENT.UPDATE'" 
          (click)="editUser()">
    Edit
  </button>
  
  <button *hasPermission="'USER_MANAGEMENT.DELETE'" 
          (click)="deleteUser()">
    Delete
  </button>
</div>

<!-- Route configuration with guard -->
<!-- app.routes.ts -->
const routes: Routes = [
  {
    path: 'admin/users',
    component: UserManagementComponent,
    canActivate: [PermissionGuard],
    data: { permission: 'USER_MANAGEMENT.VIEW' }
  }
];
```

---

### Dynamic Menu Building

```typescript
// services/menu.service.ts
export class MenuService {
  buildMenuFromPermissions(permissions: any[]): MenuItem[] {
    const menuItems: MenuItem[] = [];
    
    // Group by category
    const categories = new Map<number, CategoryMenuItem>();
    const uncategorized: MenuItem[] = [];
    
    permissions.forEach(perm => {
      if (perm.action_code !== 'VIEW') return; // Only VIEW permissions show in menu
      
      if (!perm.category_id) {
        // Uncategorized module (e.g., Dashboard)
        uncategorized.push({
          id: perm.module_code,
          label: perm.module_name,
          icon: perm.module_icon,
          route: perm.module_route,
          displayOrder: perm.module_display_order
        });
      } else {
        // Categorized module
        if (!categories.has(perm.category_id)) {
          categories.set(perm.category_id, {
            id: perm.category_code,
            label: perm.category_name,
            icon: perm.category_icon,
            displayOrder: perm.category_display_order,
            modules: []
          });
        }
        
        categories.get(perm.category_id)!.modules.push({
          id: perm.module_code,
          label: perm.module_name,
          icon: perm.module_icon,
          route: perm.module_route,
          displayOrder: perm.module_display_order
        });
      }
    });
    
    // Sort and combine
    uncategorized.sort((a, b) => a.displayOrder - b.displayOrder);
    
    const categoryItems = Array.from(categories.values())
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map(cat => ({
        ...cat,
        modules: cat.modules.sort((a, b) => a.displayOrder - b.displayOrder)
      }));
    
    return [...uncategorized, ...categoryItems];
  }
}
```

## API Endpoints

### Permission Management

#### Get User Permissions (Formatted)
```http
GET /api/permissions/user/:userId/formatted
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "categories": [
      {
        "category_code": "SYSTEM_ADMIN",
        "category_name": "System Administration",
        "category_icon": "cog",
        "display_order": 100,
        "modules": [
          {
            "module_code": "USER_MANAGEMENT",
            "module_name": "User Management",
            "module_route": "/admin/users",
            "icon": "users",
            "display_order": 10,
            "actions": [
              {"action_code": "VIEW", "action_name": "View"},
              {"action_code": "CREATE", "action_name": "Create"}
            ]
          }
        ]
      }
    ],
    "uncategorized_modules": [
      {
        "module_code": "DASHBOARD",
        "module_name": "Dashboard",
        "module_route": "/dashboard",
        "icon": "tachometer-alt",
        "display_order": 1,
        "actions": [
          {"action_code": "VIEW", "action_name": "View"}
        ]
      }
    ]
  }
}
```

#### Check Permission
```http
POST /api/permissions/check
Authorization: Bearer <token>
Content-Type: application/json

Body:
{
  "moduleCode": "USER_MANAGEMENT",
  "actionCode": "CREATE"
}

Response:
{
  "success": true,
  "data": {
    "hasPermission": true
  }
}
```

---

### User Management

#### List Users (Paginated)
```http
POST /api/users/list
Authorization: Bearer <token>
Permission: USER_MANAGEMENT.VIEW

Body:
{
  "page": 1,
  "limit": 10,
  "search": "john",
  "isActive": true,
  "roleId": 1,
  "sortBy": "user_id",
  "sortOrder": "DESC"
}

Response:
{
  "success": true,
  "data": {
    "users": [...],
    "total": 50,
    "page": 1,
    "limit": 10,
    "totalPages": 5
  }
}
```

#### Get User Details
```http
GET /api/users/:id
Authorization: Bearer <token>
Permission: USER_MANAGEMENT.VIEW

Response:
{
  "success": true,
  "data": {
    "user": {...},
    "roles": [...]
  }
}
```

#### Create User
```http
POST /api/users/create
Authorization: Bearer <token>
Permission: USER_MANAGEMENT.CREATE

Body:
{
  "username": "newuser",
  "password": "SecurePass123!",
  "fullName": "John Doe",
  "isActive": true
}
```

#### Update User
```http
POST /api/users/update
Authorization: Bearer <token>
Permission: USER_MANAGEMENT.UPDATE

Body:
{
  "userId": 5,
  "fullName": "John Updated",
  "isActive": true,
  "password": "NewPassword123!" // Optional
}
```

#### Delete User (Soft Delete)
```http
POST /api/users/delete
Authorization: Bearer <token>
Permission: USER_MANAGEMENT.DELETE

Body:
{
  "userId": 5
}
```

---

### Role Management

#### List All Roles
```http
POST /api/permissions/roles/list
Authorization: Bearer <token>
Permission: ROLE_MANAGEMENT.VIEW

Response:
{
  "success": true,
  "data": [
    {
      "role_id": 1,
      "role_name": "Super Admin",
      "role_code": "SUPER_ADMIN",
      "description": "Full system access",
      "is_system_role": true,
      "is_active": true
    }
  ]
}
```

#### Get Role by ID
```http
GET /api/permissions/roles/:id
Authorization: Bearer <token>
Permission: ROLE_MANAGEMENT.VIEW

Response:
{
  "success": true,
  "data": {
    "role": {...},
    "permissions": [...]
  }
}
```

#### Create Role
```http
POST /api/permissions/roles/create
Authorization: Bearer <token>
Permission: ROLE_MANAGEMENT.CREATE

Body:
{
  "roleName": "Claims Manager",
  "roleCode": "CLAIMS_MANAGER",
  "description": "Manages claim processing"
}
```

#### Update Role
```http
POST /api/permissions/roles/update
Authorization: Bearer <token>
Permission: ROLE_MANAGEMENT.UPDATE

Body:
{
  "roleId": 5,
  "roleName": "Updated Name",
  "description": "Updated description",
  "isActive": true
}
```

#### Delete Role
```http
POST /api/permissions/roles/delete
Authorization: Bearer <token>
Permission: ROLE_MANAGEMENT.DELETE

Body:
{
  "roleId": 5
}
```

---

### Module Management

#### List All Modules
```http
POST /api/permissions/modules/list
Authorization: Bearer <token>
Permission: MODULE_MANAGEMENT.VIEW

Response:
{
  "success": true,
  "data": [
    {
      "module_id": 1,
      "module_name": "User Management",
      "module_code": "USER_MANAGEMENT",
      "category_id": 1,
      "category_name": "System Administration",
      "icon": "users",
      "route": "/admin/users",
      "display_order": 10,
      "is_active": true
    }
  ]
}
```

#### Create Module
```http
POST /api/permissions/modules/create
Authorization: Bearer <token>
Permission: MODULE_MANAGEMENT.CREATE

Body:
{
  "moduleName": "Claims Management",
  "moduleCode": "CLAIMS_MANAGEMENT",
  "description": "Manage insurance claims",
  "categoryId": 2,
  "icon": "file-medical",
  "route": "/claims",
  "displayOrder": 10
}
```

#### Update Module
```http
POST /api/permissions/modules/update
Authorization: Bearer <token>
Permission: MODULE_MANAGEMENT.UPDATE

Body:
{
  "moduleId": 10,
  "moduleName": "Updated Name",
  "categoryId": 2,
  "displayOrder": 15,
  "isActive": true
}
```

---

### Category Management

#### List All Categories
```http
GET /api/permissions/categories
Authorization: Bearer <token>
Permission: CATEGORY_MANAGEMENT.VIEW

Response:
{
  "success": true,
  "data": [
    {
      "category_id": 1,
      "category_name": "System Administration",
      "category_code": "SYSTEM_ADMIN",
      "icon": "cog",
      "display_order": 100,
      "is_active": true
    }
  ]
}
```

#### Create Category
```http
POST /api/permissions/categories
Authorization: Bearer <token>
Permission: CATEGORY_MANAGEMENT.CREATE

Body:
{
  "categoryName": "Claims Management",
  "categoryCode": "CLAIMS_MGT",
  "description": "Claim processing modules",
  "icon": "file-medical",
  "displayOrder": 50
}
```

#### Update Category
```http
PUT /api/permissions/categories/:id
Authorization: Bearer <token>
Permission: CATEGORY_MANAGEMENT.UPDATE

Body:
{
  "categoryName": "Updated Name",
  "displayOrder": 55,
  "isActive": true
}
```

---

### User Role Assignment

#### Assign Role to User
```http
POST /api/permissions/user-roles/assign
Authorization: Bearer <token>
Permission: USER_ROLE_ASSIGNMENT.ATTACH_ROLE

Body:
{
  "userId": 5,
  "roleId": 3,
  "expiresAt": "2026-12-31T23:59:59" // Optional
}
```

#### Revoke Role from User
```http
POST /api/permissions/user-roles/revoke
Authorization: Bearer <token>
Permission: USER_ROLE_ASSIGNMENT.DETACH_ROLE

Body:
{
  "userId": 5,
  "roleId": 3
}
```

#### Get User Roles
```http
GET /api/permissions/user-roles/:userId
Authorization: Bearer <token>
Permission: USER_ROLE_ASSIGNMENT.VIEW

Response:
{
  "success": true,
  "data": [
    {
      "user_role_id": 1,
      "role_id": 1,
      "role_name": "Super Admin",
      "is_active": true,
      "assigned_at": "2026-01-15T10:30:00",
      "assigned_by": "admin",
      "expires_at": null
    }
  ]
}
```

---

### Role Permission Management

#### Grant Permission to Role
```http
POST /api/permissions/grant
Authorization: Bearer <token>
Permission: ROLE_PERMISSION_MANAGEMENT.CREATE

Body:
{
  "roleId": 3,
  "moduleActionId": 5
}
```

#### Revoke Permission from Role
```http
POST /api/permissions/revoke
Authorization: Bearer <token>
Permission: ROLE_PERMISSION_MANAGEMENT.DELETE

Body:
{
  "roleId": 3,
  "moduleActionId": 5
}
```

## Security Considerations

### 1. Defense in Depth
- **Backend:** Every API endpoint protected by permission middleware
- **Frontend:** UI elements hidden/disabled based on permissions (UX layer)
- **Database:** Views enforce active status checks automatically
- **Token:** JWT includes minimal user data; full permissions loaded per request

### 2. Role Hierarchy
- Super Admin (role_id=1) has complete system access
- System roles (is_system_role=1) cannot be deleted
- Role deactivation (is_active=0) immediately revokes all user permissions
- Soft delete on users preserves audit trail

### 3. Permission Granularity
- Module-Action pairs provide fine-grained control
- Explicit grant (granted=1) vs implicit deny (no record)
- Support for explicit denial (granted=0) if needed
- Category-based organization doesn't affect permission logic

### 4. Audit Trail
- All role assignments tracked with `assigned_by` and `assigned_at`
- All permission grants logged with `created_by` and `created_at`
- Soft delete preserves historical data
- User role history maintained even after deactivation

### 5. Temporary Access
- `expires_at` field in ccms_user_roles for time-limited access
- Automatic exclusion from vw_user_permissions when expired
- No manual cleanup required
- Can be extended by updating expires_at

### 6. Token Management
JWT payload should be minimal:
```json
{
  "userId": 1,
  "username": "admin",
  "roles": [1],
  "exp": 1735689600
}
```

Load full permissions from database on each authenticated request:
- Ensures real-time permission changes
- Cache results per session/request for performance
- Invalidate cache on role/permission changes

### 7. Multi-Role Support
- Users can have multiple active roles
- Permissions are **UNION** of all assigned roles
- No role priority/hierarchy in permission calculation
- Best practice: Assign single role matching job function

### 8. Session Validation
```typescript
// Middleware example
async function validateSession(req, res, next) {
  const user = await getUser(req.token.userId);
  
  if (!user || !user.is_active) {
    return res.status(401).json({ message: 'Invalid session' });
  }
  
  // Check if any active roles exist
  const activeRoles = await getUserActiveRoles(user.user_id);
  
  if (activeRoles.length === 0) {
    return res.status(403).json({ message: 'No active roles' });
  }
  
  next();
}
```

---

## Performance Optimization

### 1. Database Indexing
All critical fields indexed:
- `role_code`, `module_code`, `action_code` (lookups)
- `user_id`, `role_id` (joins)
- `is_active` flags (filters)
- `expires_at` (date comparisons)

### 2. Caching Strategy

#### Backend Cache
```typescript
class PermissionCache {
  private cache = new Map<string, { data: any, expires: number }>();
  private TTL = 300000; // 5 minutes
  
  get(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && cached.expires > Date.now()) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }
  
  set(key: string, data: any): void {
    this.cache.set(key, {
      data,
      expires: Date.now() + this.TTL
    });
  }
  
  invalidate(pattern?: string): void {
    if (pattern) {
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }
}

// Usage
const permCache = new PermissionCache();

async getUserPermissions(userId: number) {
  const key = `user_perms_${userId}`;
  let perms = permCache.get(key);
  
  if (!perms) {
    perms = await loadFromDatabase(userId);
    permCache.set(key, perms);
  }
  
  return perms;
}

// Invalidate on changes
async updateRolePermissions(roleId: number) {
  await database.updatePermissions(roleId);
  permCache.invalidate(`role_${roleId}`);
}
```

#### Frontend Cache
```typescript
// Permission service with replay subject
private permissionsSubject = new ReplaySubject<Permission[]>(1);

// Load once on login, reuse throughout session
loadPermissions(userId: number) {
  this.http.get(`/api/permissions/user/${userId}/formatted`)
    .subscribe(perms => this.permissionsSubject.next(perms));
}

// All components share same cached data
getPermissions$(): Observable<Permission[]> {
  return this.permissionsSubject.asObservable();
}
```

### 3. Query Optimization

Views (`vw_user_permissions`, `vw_role_permissions`) pre-join all necessary tables:
- Eliminates N+1 queries
- Single database round-trip for full permission set
- Filtered at database level (is_active, expires_at)

### 4. Connection Pooling
Use connection pooling for database access:
```typescript
const pool = new sql.ConnectionPool({
  server: 'localhost',
  database: 'db_ccms',
  pool: {
    max: 10,
    min: 2,
    idleTimeoutMillis: 30000
  }
});
```

---

## Testing Checklist

### Database Tests
- [ ] All tables created successfully
- [ ] All foreign keys functioning
- [ ] All indexes created and used
- [ ] Views return correct filtered data
- [ ] Stored procedures execute without errors
- [ ] Seed data inserted with correct relationships
- [ ] Category navigation displays properly

### Backend Tests
- [ ] Permission middleware blocks unauthorized access
- [ ] Permission check returns correct results
- [ ] Role assignment/revocation works
- [ ] Multiple role support functions correctly
- [ ] Expired roles excluded from permissions
- [ ] Permission cache invalidates on updates
- [ ] Audit logs created for all changes

### Frontend Tests
- [ ] Login loads user permissions
- [ ] Menu built correctly with categories
- [ ] Dashboard appears first (uncategorized)
- [ ] System Administration category shows all modules
- [ ] Modules within categories properly ordered
- [ ] Permission directive hides unauthorized elements
- [ ] Route guard blocks unauthorized navigation
- [ ] Permission checks reactive to changes
- [ ] Logout clears permission cache

### Integration Tests
- [ ] Super Admin sees all modules and actions
- [ ] Users with no roles see only public pages
- [ ] Role deactivation immediately affects users
- [ ] Permission grant/revoke applies in real-time
- [ ] Module deactivation hides from all users
- [ ] Category ordering reflects in menu
- [ ] Module display_order respected within categories

---

## Troubleshooting

### Issue: Foreign Key Constraint Error
**Symptom:** Error inserting into ccms_user_roles  
**Cause:** User doesn't exist or role doesn't exist  
**Solution:**
```sql
-- Verify user exists
SELECT * FROM ccms_users WHERE user_id = ?;

-- Verify role exists
SELECT * FROM ccms_roles WHERE role_id = ?;
```

### Issue: Permission Check Always Returns False
**Symptom:** User can't access modules despite having role  
**Diagnosis Checklist:**
```sql
-- 1. Check user has active role
SELECT * FROM ccms_user_roles 
WHERE user_id = ? AND is_active = 1;

-- 2. Check role is active
SELECT * FROM ccms_roles 
WHERE role_id = ? AND is_active = 1;

-- 3. Check role has permissions
SELECT * FROM vw_role_permissions 
WHERE role_id = ? AND module_code = ?;

-- 4. Check full permission chain
SELECT * FROM vw_user_permissions 
WHERE user_id = ? AND module_code = ? AND action_code = ?;

-- 5. Check for expiration
SELECT *, 
       CASE WHEN expires_at IS NULL THEN 'Permanent'
            WHEN expires_at > GETDATE() THEN 'Active'
            ELSE 'Expired' END AS status
FROM ccms_user_roles WHERE user_id = ?;
```

### Issue: Menu Not Showing Modules
**Symptom:** Empty menu after login  
**Solutions:**
```sql
-- Check user has VIEW permissions
SELECT * FROM vw_user_permissions 
WHERE user_id = ? AND action_code = 'VIEW';

-- Check modules are active
SELECT * FROM ccms_modules WHERE is_active = 0;

-- Check categories exist
SELECT m.*, c.category_name
FROM ccms_modules m
LEFT JOIN ccms_categories c ON m.category_id = c.category_id;
```

### Issue: Category Not Appearing in Menu
**Symptom:** Category modules missing from navigation  
**Solutions:**
```sql
-- Check category is active
SELECT * FROM ccms_categories WHERE is_active = 1;

-- Check modules assigned to category
SELECT * FROM ccms_modules WHERE category_id = ?;

-- Check display order
SELECT * FROM ccms_categories ORDER BY display_order;
```

### Issue: Incorrect Menu Order
**Symptom:** Modules appearing in wrong order  
**Solutions:**
```sql
-- Check display orders
SELECT 
    module_name,
    category_id,
    display_order,
    CASE WHEN category_id IS NULL THEN 'Uncategorized' ELSE 'Categorized' END AS type
FROM ccms_modules
ORDER BY 
    CASE WHEN category_id IS NULL THEN 0 ELSE 1 END,
    display_order;

-- Fix display orders
UPDATE ccms_modules SET display_order = 1 WHERE module_code = 'DASHBOARD';
UPDATE ccms_modules SET display_order = 25 WHERE module_code = 'CATEGORY_MANAGEMENT';
```

### Issue: Performance Degradation
**Symptom:** Slow permission checks  
**Solutions:**
1. Check index usage:
```sql
-- View execution plan
SET STATISTICS IO ON;
SELECT * FROM vw_user_permissions WHERE user_id = 1;
SET STATISTICS IO OFF;
```

2. Implement caching (see Performance Optimization)

3. Monitor database connections:
```sql
SELECT 
    login_name,
    COUNT(*) as connection_count
FROM sys.dm_exec_sessions
WHERE is_user_process = 1
GROUP BY login_name;
```

---

## Best Practices

### 1. Role Design
- Create roles based on job functions, not individual users
- Use descriptive names: "Claims Manager" not "Manager2"
- Document role purpose in description field
- Limit number of roles to reduce complexity

### 2. Permission Assignment
- **Principle of Least Privilege**: Grant minimum required permissions
- Avoid giving everyone Super Admin access
- Use categories to group related modules logically
- Review permissions quarterly

### 3. Module Organization
- Keep Dashboard uncategorized (quick access)
- Group admin modules under "System Administration"
- Use display_order strategically (10, 20, 30... for easy reordering)
- Assign meaningful icons to improve UX

### 4. Maintenance
- Regular audits of user role assignments
- Remove unused roles and modules
- Update descriptions when functionality changes
- Test permission changes in staging before production

### 5. Development Workflow
```
1. Design: Plan module structure and categories
2. Database: Create modules, actions, module-actions
3. Backend: Implement protected routes
4. Frontend: Add route guards and UI controls
5. Test: Verify permission enforcement
6. Deploy: Update production with migrations
```

---

## Changelog

### Version 2.0.0 (2026-02-20)
- ✅ Added category-based menu organization
- ✅ Updated Category Management display order (25 before Module Management)
- ✅ Improved SQL schema with detailed column comments
- ✅ Enhanced documentation with complete examples
- ✅ Added performance optimization strategies
- ✅ Expanded troubleshooting guide

### Version 1.0.0 (2026-02-18)
- Initial release
- 1 system role: Super Admin
- 9 modules (1 Dashboard + 8 Permission Management)
- 17 actions
- Complete CRUD operations for Super Admin
- User role assignment functionality
