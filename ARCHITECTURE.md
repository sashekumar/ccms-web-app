# 🏗️ CCMS Architecture Documentation

## ⚠️ IMPORTANT - READ FIRST

**All architectural documentation is located in the [`docs/`](./docs/) folder.**

## 📚 Documentation Structure

```
docs/
├── README.md                    ← Start here - Index and instructions
├── frontend-architecture.md     ← Angular frontend architecture
├── backend-architecture.md      ← Node.js/Express backend architecture
└── coding-standards.md          ← Coding standards and conventions
```

## 🚀 Quick Links

- **[Documentation Index](./docs/README.md)** - Start here for all documentation
- **[Frontend Architecture](./docs/frontend-architecture.md)** - Angular patterns and structure
- **[Backend Architecture](./docs/backend-architecture.md)** - Node.js/Express patterns, database layer, performance
- **[Coding Standards](./docs/coding-standards.md)** - Naming conventions and best practices

## ⚠️ Mandatory Reading

**Before implementing anything, read:**

1. **[docs/README.md](./docs/README.md)** - Understand how to use the documentation
2. **Relevant architecture document** - Frontend or Backend based on your task
3. **[docs/coding-standards.md](./docs/coding-standards.md)** - Follow naming conventions

## 🎯 Key Architecture Principles

1. **MVC Layer Isolation** - Controllers → Services → Repositories → Database
2. **Database Abstraction** - Technology-independent through IDatabase interface
3. **SQL Injection Prevention** - All queries through QueryBuilder (parameterized)
4. **Security First** - JWT httpOnly cookies, Redis blacklist, input validation
5. **Type Safety** - TypeScript strict mode, explicit types everywhere
6. **Commonization** - BaseRepository, BaseService, BaseController for reusability
7. **Performance** - Indexing, caching, pagination, N+1 prevention

## 🔐 Security Stack

- **Authentication**: JWT with HS256
- **Token Storage**: httpOnly cookies (XSS protection)
- **Token Revocation**: Redis blacklist (immediate logout)
- **SQL Injection**: QueryBuilder with parameterized queries
- **CSRF Protection**: SameSite=strict cookies
- **Password Hashing**: bcrypt with 12 salt rounds

## 🗄️ Technology Stack

### Frontend
- Angular (latest)
- TypeScript (strict mode)
- Tailwind CSS
- RxJS

### Backend
- Node.js v20.x
- Express.js
- TypeScript (strict mode)
- MS SQL Server
- Redis (caching & blacklist)

## 📖 For AI Assistants

**CRITICAL**: Before generating any code:

1. ✅ Read [`docs/README.md`](./docs/README.md) for instructions
2. ✅ Read relevant architecture document (frontend/backend)
3. ✅ Read [`docs/coding-standards.md`](./docs/coding-standards.md) for naming
4. ✅ Use established patterns (Base classes, QueryBuilder, etc.)
5. ✅ Follow MVC layer isolation strictly
6. ✅ Apply proper naming conventions
7. ✅ Consider performance (indexing, caching, pagination)

**DO NOT**:
- ❌ Create queries without QueryBuilder
- ❌ Skip layers (e.g., Controller → Repository directly)
- ❌ Duplicate existing utilities
- ❌ Ignore naming conventions
- ❌ Create N+1 query problems

## 📞 Need Help?

1. Check [`docs/README.md`](./docs/README.md) for documentation index
2. Search the relevant architecture document
3. Review coding standards for naming/patterns
4. Consult with team lead if still unclear

---

**For complete documentation, start here: [`docs/README.md`](./docs/README.md)**

**Last Updated**: February 10, 2026
