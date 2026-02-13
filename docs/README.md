# 📚 CCMS Architecture Documentation

## ⚠️ MANDATORY READING - READ BEFORE ANY IMPLEMENTATION

**This folder contains the complete architectural documentation for the CCMS (Claims Management System) application. ALL developers and AI assistants MUST refer to these documents before implementing any features, fixes, or changes.**

---

## 📋 Documentation Index

### 1. [Frontend Architecture](./frontend-architecture.md)
**Purpose**: Complete Angular frontend architecture and implementation guidelines

**Read this before**:
- Creating any Angular components, services, or modules
- Implementing frontend features
- Setting up routing or state management
- Adding frontend utilities or guards
- Working on UI/UX implementation

**Key Topics**:
- Project structure and folder organization
- Component architecture and patterns
- Service layer and HTTP communication
- Routing and navigation strategy
- State management approach
- Form handling and validation
- Error handling and interceptors
- Frontend security practices
- Tailwind CSS styling guidelines

---

### 2. [Backend Architecture](./backend-architecture.md)
**Purpose**: Complete Node.js/Express backend architecture with database layer

**Read this before**:
- Creating any backend endpoints or APIs
- Implementing business logic or services
- Working with database queries
- Adding authentication or authorization
- Creating repositories or controllers
- Database schema changes
- Performance optimization
- Caching implementation

**Key Topics**:
- MVC architecture with strict layer isolation
- Database layer (Connection Manager, Query Builder, Transaction Manager)
- Database abstraction for technology independence
- SQL injection prevention strategies
- Base Repository, Service, and Controller patterns
- JWT authentication implementation (HS256, httpOnly cookies, Redis blacklist)
- Token revocation and security
- Query optimization and performance
- Indexing strategies and N+1 query prevention
- Pagination patterns (cursor-based)
- Connection pool management
- Caching strategies with Redis
- Monitoring and profiling
- Environment configuration

---

### 3. [Coding Standards](./coding-standards.md)
**Purpose**: Coding standards, best practices, and naming conventions

**Read this before**:
- Writing any code (frontend or backend)
- Creating new files or classes
- Naming variables, functions, or components
- Structuring code or folders
- Code reviews
- Database schema design

**Key Topics**:
- Universal naming conventions (applicable to both frontend and backend)
- TypeScript coding standards
- Angular-specific standards (components, services, modules)
- Backend-specific standards (controllers, repositories, routes)
- Database naming conventions (snake_case, prefixes)
- File naming patterns (kebab-case)
- API response structure
- Error handling patterns
- Code organization principles
- Testing standards
- Documentation requirements

---

## 🎯 How to Use This Documentation

### For Developers

1. **Before Starting Any Task**:
   - Read the relevant architecture document(s)
   - Understand the patterns and principles
   - Follow the established conventions
   - Use the provided base classes and utilities

2. **During Implementation**:
   - Refer back to examples and patterns
   - Follow naming conventions strictly
   - Maintain layer isolation (MVC)
   - Use commonized utilities and services

3. **Before Code Review**:
   - Verify compliance with coding standards
   - Check that architecture patterns are followed
   - Ensure no duplication of existing utilities

### For AI Assistants

**⚠️ CRITICAL INSTRUCTIONS**:

1. **ALWAYS read relevant documentation before generating code**:
   ```
   - Creating Angular component? → Read frontend-architecture.md
   - Creating API endpoint? → Read backend-architecture.md
   - Naming anything? → Read coding-standards.md
   - Database work? → Read backend-architecture.md (Database Layer + Performance)
   ```

2. **Follow Established Patterns**:
   - Use BaseRepository<T>, BaseService<T>, BaseController<T>
   - Use QueryBuilder for ALL database queries (SQL injection prevention)
   - Use ConnectionManager singleton for database connections
   - Follow JWT authentication patterns (httpOnly cookies, Redis blacklist)
   - Apply cursor-based pagination for lists
   - Implement proper error handling and validation

3. **Respect Architecture Decisions**:
   - Strict MVC layer isolation (Controller → Service → Repository → Database)
   - No direct database access from controllers
   - All queries through QueryBuilder (parameterized)
   - Database abstraction layer for technology independence
   - Single .env file for backend (local only)
   - Multiple environment files for frontend (environment.ts, environment.uat.ts, environment.prod.ts)

4. **Apply Naming Conventions**:
   - **Frontend**: Components (kebab-case files, PascalCase classes)
   - **Backend**: Controllers, Services, Repositories (kebab-case files, PascalCase classes with suffixes)
   - **Database**: Tables and columns (snake_case)
   - **Constants**: UPPER_SNAKE_CASE
   - **Observables**: $ suffix
   - See coding-standards.md for complete reference

5. **Performance Considerations**:
   - Check for N+1 query problems
   - Use proper indexing strategies
   - Implement caching where appropriate
   - Use cursor-based pagination for large datasets
   - Monitor connection pool utilization

---

## 🔄 Documentation Updates

**When to Update Documentation**:
- Major architectural decisions or changes
- New patterns or best practices adopted
- Technology stack changes
- Security implementation changes
- Performance optimization strategies

**How to Update**:
1. Make changes to the relevant .md file
2. Update the date at the top of the document
3. Add a changelog entry if significant
4. Notify the team of important changes

---

## 📊 Architecture Principles

### 1. **Commonization & Reusability**
- All database operations go through centralized layer
- Base classes for common patterns (Repository, Service, Controller)
- Shared utilities for common operations
- No duplication of logic

### 2. **Database Technology Independence**
- Database abstraction layer (IDatabase interface)
- QueryBuilder for all queries
- Easy migration between SQL Server, PostgreSQL, MySQL
- Change implementation in one place

### 3. **Security First**
- SQL injection prevention (parameterized queries only)
- JWT with httpOnly cookies (XSS protection)
- Token blacklist with Redis (immediate logout)
- Input validation at all layers
- CSRF protection (SameSite cookies)

### 4. **Layer Isolation**
- Controllers handle HTTP only
- Services contain business logic
- Repositories handle database only
- No layer skipping

### 5. **Type Safety**
- TypeScript strict mode enabled
- Explicit types for all functions
- Interfaces for all data structures
- Generic types where appropriate

### 6. **Performance Optimization**
- Connection pooling
- Query optimization and indexing
- Cursor-based pagination
- Redis caching
- N+1 query prevention
- Execution plan analysis

---

## 🚀 Quick Start Checklist

**Before implementing any feature**:

- [ ] Read the relevant architecture document(s)
- [ ] Understand the required patterns (Base classes, QueryBuilder, etc.)
- [ ] Check naming conventions in coding-standards.md
- [ ] Verify no duplication of existing utilities
- [ ] Understand security requirements
- [ ] Plan for performance (indexing, caching, pagination)
- [ ] Follow MVC layer isolation rules
- [ ] Use TypeScript strict typing

---

## 📞 Questions?

If you encounter scenarios not covered in these documents or need clarification:
1. Check all three documents thoroughly
2. Look for similar patterns in existing code
3. Consult with the team lead or architect
4. Update documentation once decision is made

---

## ⚖️ Priority Order

When conflicts or ambiguities arise:

1. **Security** - Always prioritize security
2. **Architecture** - Follow established patterns
3. **Performance** - Optimize for scale
4. **Standards** - Maintain consistency
5. **Pragmatism** - Balance ideals with delivery

---

**Last Updated**: February 10, 2026

**Maintained By**: CCMS Development Team
