# 📋 CCMS Quick Reference Card

**Keep this open while coding!**

---

## 🎯 Before You Code

✅ Read [`docs/README.md`](./docs/README.md) first  
✅ Check relevant architecture doc ([frontend](./docs/frontend-architecture.md) or [backend](./docs/backend-architecture.md))  
✅ Review [coding standards](./docs/coding-standards.md)

---

## 🏗️ MVC Layer Rules

```
Request → Controller → Service → Repository → Database
                                              ↓
Response ← Controller ← Service ← Repository ← Database
```

**Never skip layers!**

---

## 🔒 Security Checklist

- [ ] Use QueryBuilder for ALL database queries (SQL injection prevention)
- [ ] Validate input at controller level
- [ ] Use JWT httpOnly cookies (not localStorage)
- [ ] Hash passwords with bcrypt (12 rounds)
- [ ] Add to blacklist on logout
- [ ] Use authenticate middleware on protected routes

---

## 📝 Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| **Frontend Files** | kebab-case | `user-profile.component.ts` |
| **Backend Files** | kebab-case | `user.controller.ts` |
| **Classes** | PascalCase + Suffix | `UserController`, `UserService` |
| **Functions** | camelCase + Verb | `getUser()`, `createClaim()` |
| **Variables** | camelCase | `userId`, `claimData` |
| **Constants** | UPPER_SNAKE_CASE | `MAX_RETRY_ATTEMPTS` |
| **Database Tables** | snake_case | `users`, `claim_details` |
| **Database Columns** | snake_case | `user_id`, `created_at` |
| **Observables** | $ suffix | `users$`, `claims$` |
| **Booleans** | is/has/can/should | `isActive`, `hasPermission` |

---

## 🗄️ Database Patterns

### ✅ Always Use QueryBuilder

```typescript
// ✅ CORRECT
await this.queryBuilder
  .select(['claim_id', 'amount'])
  .from('claims')
  .where('user_id', userId)
  .execute();

// ❌ WRONG - No raw SQL!
await database.query('SELECT * FROM claims WHERE user_id = ' + userId);
```

### ✅ Extend Base Classes

```typescript
// Repository
export class UserRepository extends BaseRepository<User> {
  constructor() {
    super('users', 'user_id');
  }
}

// Service
export class UserService extends BaseService<User> {
  constructor(private userRepository: UserRepository) {
    super(userRepository);
  }
}

// Controller
export class UserController extends BaseController {
  constructor(private userService: UserService) {
    super();
  }
}
```

---

## ⚡ Performance Checklist

- [ ] Add indexes on foreign keys
- [ ] Add indexes on WHERE/ORDER BY columns
- [ ] Select only needed columns (no SELECT *)
- [ ] Use cursor-based pagination for lists
- [ ] Prevent N+1 queries (use JOINs or batch loading)
- [ ] Cache reference data with Redis
- [ ] Invalidate cache on updates

---

## 🚀 Common Patterns

### Create Feature (Backend)

```
features/
  users/
    user.entity.ts          (Data model)
    user.repository.ts      (DB operations)
    user.service.ts         (Business logic)
    user.controller.ts      (HTTP handling)
    user.routes.ts          (Route definitions)
    user.validator.ts       (Input validation)
```

### Create Feature (Frontend)

```
features/
  users/
    users.component.ts      (Component)
    users.component.html    (Template)
    users.service.ts        (HTTP service)
    users.model.ts          (TypeScript interface)
```

---

## 🔐 Auth Middleware

```typescript
// Protect routes
router.get('/api/claims', 
  authenticate,           // ← Always use this
  claimController.getAll
);

// Access user from request
const userId = req.user.userId;
const role = req.user.role;
```

---

## 📦 Environment Variables

### Backend (.env - local only)
```bash
DB_HOST=localhost
DB_NAME=ccms
JWT_SECRET=your-secret-key
REDIS_HOST=localhost
```

### Frontend (environment.ts)
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api'
};
```

---

## 🐛 Common Mistakes to Avoid

❌ `SELECT * FROM table`  
✅ `SELECT column1, column2 FROM table`

❌ Controller → Repository directly  
✅ Controller → Service → Repository

❌ Raw SQL strings  
✅ QueryBuilder with parameters

❌ Token in localStorage  
✅ httpOnly cookie

❌ Forgetting to invalidate blacklist  
✅ Add to blacklist on logout

❌ OFFSET pagination for large data  
✅ Cursor-based pagination

❌ N+1 queries (loop + query each)  
✅ Single query with JOIN or batch load

---

## 📚 Documentation Links

- **[Documentation Index](./docs/README.md)**
- **[Frontend Architecture](./docs/frontend-architecture.md)**
- **[Backend Architecture](./docs/backend-architecture.md)**
- **[Coding Standards](./docs/coding-standards.md)**

---

## 🆘 Quick Commands

```bash
# Backend
npm run dev              # Start dev server
npm run build           # Compile TypeScript
npm run test            # Run tests

# Frontend
ng serve                # Start dev server
ng build --configuration uat     # Build for UAT
ng build --configuration production  # Build for production
```

---

**📌 Pin this file for quick reference!**

**Last Updated**: February 10, 2026
