# CCMS Backend API

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env` and update with your database credentials:

```env
DB_SERVER=localhost
DB_DATABASE=db_ccms
DB_USER=your_username
DB_PASSWORD=your_password
JWT_SECRET=your-secret-key-min-32-characters
```

### 3. Run Development Server
```bash
npm run dev
```

### 4. Build for Production
```bash
npm run build
npm start
```

## API Endpoints

### Authentication

#### POST /api/auth/login
Login with username and password. Sets httpOnly cookies.

**Request:**
```json
{
  "username": "your_username",
  "password": "your_password"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "userId": 1,
    "username": "john_doe",
    "fullName": "John Doe",
    "roleId": 1,
    "permissions": {}
  }
}
```

#### POST /api/auth/refresh
Refresh access token using refresh token. Automatically called by frontend when access token expires.

**Request:** No body required (uses refresh token from httpOnly cookie)

**Response:**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": null
}
```

**Note:** This endpoint automatically extends the user session. Frontend error interceptor calls this automatically on 401 errors, providing seamless 7-day authentication without user interruption.

#### POST /api/auth/logout
Logout and clear cookies. Requires authentication.

#### GET /api/auth/me
Get current user information. Requires authentication.

### Health Check

#### GET /api/health
Check API and database status.

## Architecture

Following layered architecture pattern:
- **Controllers**: HTTP request/response handling
- **Services**: Business logic
- **Repositories**: Database operations
- **Middleware**: Authentication, validation, errors

## Testing Login

1. Create a test user in database:
```sql
INSERT INTO ccms_users (username, password_hash, full_name, role_id, is_active)
VALUES ('testuser', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5kosgVu/vg3F6', 'Test User', 1, 1);
-- Password: password123
```

2. Test login endpoint:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"password123"}'
```

---

## Permission Control System

### Overview

Comprehensive RBAC (Role-Based Access Control) system with granular permission management.

### Features

- ✅ User management with CRUD operations
- ✅ Role management with permission assignment
- ✅ Module and action-based permissions
- ✅ Permission caching (5-minute TTL)
- ✅ Hierarchical role support (Super Admin bypass)
- ✅ Soft delete for data preservation
- ✅ Pagination and filtering

### New API Endpoints

#### Permissions
- `GET /api/permissions/check?moduleCode=MODULE&actionCode=ACTION` - Check permission
- `GET /api/permissions/user` - Get current user permissions
- `GET /api/permissions/user/:userId` - Get user permissions
- `POST /api/permissions/assign-role` - Assign role to user
- `DELETE /api/permissions/detach-role/:userId/:roleId` - Detach role
- `GET /api/permissions/user/:userId/roles` - Get user roles
- `POST /api/permissions/grant` - Grant permission to role
- `POST /api/permissions/revoke` - Revoke permission from role
- `POST /api/permissions/clear-cache` - Clear permission caches

#### Roles
- `GET /api/permissions/roles` - Get all roles
- `GET /api/permissions/roles/:roleId` - Get role by ID
- `GET /api/permissions/roles/:roleId/permissions` - Get role permissions
- `POST /api/permissions/roles` - Create role
- `PUT /api/permissions/roles/:roleId` - Update role
- `DELETE /api/permissions/roles/:roleId` - Delete role

#### Users
- `POST /api/users/list` - Get paginated user list (body: filters)
- `GET /api/users/:userId` - Get user by ID
- `POST /api/users` - Create user
- `PUT /api/users/:userId` - Update user
- `DELETE /api/users/:userId` - Soft delete user
- `POST /api/users/check-username` - Check username availability (body: {username, excludeUserId?})

### Database Setup

Run the permission control schema:
```bash
sqlcmd -S YOUR_SERVER -d db_ccms -i migrations/permission-control-schema.sql
```

This creates:
- 6 tables (roles, modules, actions, module_actions, role_permissions, user_roles)
- 2 views (vw_user_permissions, vw_role_permissions)
- 3 stored procedures (permission checks, role assignment)
- Seed data (9 roles, 14 modules, 17 actions)

### Permission Matrix

**Super Admin (role_id = 1):**
- Full access to all modules and actions
- Bypasses all permission checks
- Can delete users and modify system roles

**Admin (role_id = 2):**
- User management (CREATE, UPDATE, VIEW - no DELETE)
- User role assignment (ATTACH_ROLE, DETACH_ROLE)
- View-only access to all configuration modules

See [Permission Control Documentation](../docs/PERMISSION-CONTROL-SYSTEM.md) for complete details.

### Middleware Usage

**Authentication:**
```typescript
import { authenticateToken } from './middleware/auth.middleware';
router.get('/protected', authenticateToken, controller.method);
```

**Permission Check:**
```typescript
import { requirePermission } from './middleware/permission.middleware';
router.post('/users', requirePermission('USER_MANAGEMENT', 'CREATE'), controller.createUser);
```

### Dependencies Added

- `node-cache` - For permission caching

Install with: `npm install`

