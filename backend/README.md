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
