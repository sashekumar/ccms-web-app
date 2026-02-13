# Frontend Structure - Angular Application

## 📁 Complete Directory Structure

```
frontend/
├── src/
│   ├── app/
│   │   │
│   │   ├── core/                           # Core Module (Singleton Services)
│   │   │   ├── guards/                     # Route guards
│   │   │   │   ├── auth.guard.ts          # Authentication guard
│   │   │   │   ├── role.guard.ts          # Role-based access guard
│   │   │   │   └── unsaved-changes.guard.ts
│   │   │   │
│   │   │   ├── interceptors/               # HTTP interceptors
│   │   │   │   ├── auth.interceptor.ts    # Add JWT token to requests
│   │   │   │   ├── error.interceptor.ts   # Global error handling
│   │   │   │   └── loader.interceptor.ts  # Show/hide loader
│   │   │   │
│   │   │   ├── services/                   # Core singleton services
│   │   │   │   ├── auth.service.ts        # Authentication & authorization
│   │   │   │   ├── role.service.ts        # Role management & menu config
│   │   │   │   ├── api.service.ts         # Base HTTP service
│   │   │   │   ├── storage.service.ts     # Local/Session storage
│   │   │   │   ├── notification.service.ts # Toast/alert notifications
│   │   │   │   ├── loader.service.ts      # Global loading state
│   │   │   │   └── sidebar.service.ts     # Sidebar state management
│   │   │   │
│   │   │   └── core.module.ts
│   │   │
│   │   ├── shared/                         # Shared Module (Reusable Components)
│   │   │   │
│   │   │   ├── components/                 # Shared components
│   │   │   │   │
│   │   │   │   ├── ui/                     # Basic UI components
│   │   │   │   │   ├── button/
│   │   │   │   │   │   ├── button.component.ts
│   │   │   │   │   │   ├── button.component.html
│   │   │   │   │   │   └── button.component.scss
│   │   │   │   │   ├── card/
│   │   │   │   │   │   ├── card.component.ts
│   │   │   │   │   │   ├── card.component.html
│   │   │   │   │   │   └── card.component.scss
│   │   │   │   │   ├── modal/              # Reusable modal
│   │   │   │   │   ├── loading-spinner/    # Loading indicator
│   │   │   │   │   └── alert/              # Alert messages
│   │   │   │   │
│   │   │   │   ├── forms/                  # Form components
│   │   │   │   │   ├── input/
│   │   │   │   │   │   ├── input.component.ts
│   │   │   │   │   │   ├── input.component.html
│   │   │   │   │   │   └── input.component.scss
│   │   │   │   │   ├── select/             # Dropdown select
│   │   │   │   │   ├── checkbox/           # Checkbox input
│   │   │   │   │   ├── radio/              # Radio buttons
│   │   │   │   │   ├── date-picker/        # Date picker
│   │   │   │   │   └── textarea/           # Textarea input
│   │   │   │   │
│   │   │   │   ├── file-management/        # File handling (COMMONIZED)
│   │   │   │   │   ├── file-upload/        # Universal file uploader
│   │   │   │   │   │   ├── file-upload.component.ts
│   │   │   │   │   │   ├── file-upload.component.html
│   │   │   │   │   │   └── file-upload.component.scss
│   │   │   │   │   ├── image-selector/     # Image picker with preview
│   │   │   │   │   ├── file-preview/       # Document/image preview
│   │   │   │   │   └── drag-drop-upload/   # Drag & drop uploader
│   │   │   │   │
│   │   │   │   ├── data-display/           # Data presentation
│   │   │   │   │   ├── table/              # Reusable data table
│   │   │   │   │   │   ├── table.component.ts
│   │   │   │   │   │   ├── table.component.html
│   │   │   │   │   │   └── table.component.scss
│   │   │   │   │   ├── data-grid/          # Grid view
│   │   │   │   │   ├── pagination/         # Pagination controls
│   │   │   │   │   └── list-view/          # List view
│   │   │   │   │
│   │   │   │   ├── filters/                # Filter components (COMMONIZED)
│   │   │   │   │   ├── dynamic-filter/     # Dynamic filter builder
│   │   │   │   │   │   ├── dynamic-filter.component.ts
│   │   │   │   │   │   ├── dynamic-filter.component.html
│   │   │   │   │   │   └── dynamic-filter.component.scss
│   │   │   │   │   ├── search-box/         # Universal search
│   │   │   │   │   ├── date-range-filter/  # Date range filtering
│   │   │   │   │   ├── multi-select-filter/ # Multi-select filter
│   │   │   │   │   └── filter-toolbar/     # Complete filter UI
│   │   │   │   │
│   │   │   │   └── layout/                 # Layout components
│   │   │   │       ├── breadcrumb/         # Breadcrumb navigation
│   │   │   │       └── page-header/        # Page header with title
│   │   │   │
│   │   │   ├── directives/                 # Custom directives
│   │   │   │   ├── validation/
│   │   │   │   │   ├── email-validator.directive.ts
│   │   │   │   │   ├── phone-validator.directive.ts
│   │   │   │   │   └── pattern-validator.directive.ts
│   │   │   │   ├── ui-behavior/
│   │   │   │   │   ├── auto-focus.directive.ts
│   │   │   │   │   ├── click-outside.directive.ts
│   │   │   │   │   └── tooltip.directive.ts
│   │   │   │   └── permissions/
│   │   │   │       ├── has-permission.directive.ts
│   │   │   │       └── has-role.directive.ts
│   │   │   │
│   │   │   ├── pipes/                      # Custom pipes
│   │   │   │   ├── date-format.pipe.ts     # Custom date formatting
│   │   │   │   ├── currency-format.pipe.ts # Currency formatting
│   │   │   │   ├── file-size.pipe.ts       # File size formatting
│   │   │   │   ├── truncate.pipe.ts        # Text truncation
│   │   │   │   ├── safe-html.pipe.ts       # Sanitize HTML
│   │   │   │   └── highlight.pipe.ts       # Text highlighting
│   │   │   │
│   │   │   ├── utils/                      # Utility functions (COMMONIZED)
│   │   │   │   ├── api-fetchers.util.ts    # Method-based API helpers
│   │   │   │   ├── filter.util.ts          # Filter logic helpers
│   │   │   │   ├── validation.util.ts      # Validation helpers
│   │   │   │   ├── date.util.ts            # Date manipulation
│   │   │   │   ├── file.util.ts            # File handling utilities
│   │   │   │   ├── string.util.ts          # String manipulation
│   │   │   │   └── array.util.ts           # Array utilities
│   │   │   │
│   │   │   ├── models/                     # Shared interfaces & types
│   │   │   │   ├── filter.model.ts         # Filter-related interfaces
│   │   │   │   ├── pagination.model.ts     # Pagination interfaces
│   │   │   │   ├── api-response.model.ts   # API response types
│   │   │   │   ├── user.model.ts           # User interfaces
│   │   │   │   └── common.model.ts         # Common shared types
│   │   │   │
│   │   │   └── shared.module.ts            # Shared module definition
│   │   │
│   │   ├── features/                       # Feature Modules
│   │   │   │
│   │   │   ├── auth/                       # Authentication feature
│   │   │   │   ├── login/
│   │   │   │   │   ├── login.component.ts
│   │   │   │   │   ├── login.component.html
│   │   │   │   │   └── login.component.scss
│   │   │   │   ├── register/
│   │   │   │   ├── forgot-password/
│   │   │   │   ├── reset-password/
│   │   │   │   ├── auth.service.ts
│   │   │   │   ├── auth-routing.module.ts
│   │   │   │   └── auth.module.ts
│   │   │   │
│   │   │   ├── dashboard/                  # Dashboard feature
│   │   │   │   ├── dashboard.component.ts
│   │   │   │   ├── dashboard.component.html
│   │   │   │   ├── dashboard.component.scss
│   │   │   │   ├── dashboard.service.ts
│   │   │   │   ├── dashboard-routing.module.ts
│   │   │   │   └── dashboard.module.ts
│   │   │   │
│   │   │   └── [feature-name]/             # Other features (claims, policies, etc.)
│   │   │       ├── components/
│   │   │       ├── services/
│   │   │       ├── models/
│   │   │       ├── [feature]-routing.module.ts
│   │   │       └── [feature].module.ts
│   │   │
│   │   ├── layouts/                        # Layout Components
│   │   │   │
│   │   │   ├── main-layout/                # Main application layout
│   │   │   │   ├── main-layout.component.ts
│   │   │   │   ├── main-layout.component.html
│   │   │   │   ├── main-layout.component.scss
│   │   │   │   │
│   │   │   │   ├── header/                 # Global header
│   │   │   │   │   ├── header.component.ts
│   │   │   │   │   ├── header.component.html
│   │   │   │   │   └── header.component.scss
│   │   │   │   │
│   │   │   │   ├── sidebar/                # Global sidebar
│   │   │   │   │   ├── sidebar.component.ts
│   │   │   │   │   ├── sidebar.component.html
│   │   │   │   │   └── sidebar.component.scss
│   │   │   │   │
│   │   │   │   └── footer/                 # Global footer
│   │   │   │       ├── footer.component.ts
│   │   │   │       ├── footer.component.html
│   │   │   │       └── footer.component.scss
│   │   │   │
│   │   │   ├── auth-layout/                # Authentication pages layout
│   │   │   │   ├── auth-layout.component.ts
│   │   │   │   ├── auth-layout.component.html
│   │   │   │   └── auth-layout.component.scss
│   │   │   │
│   │   │   └── admin-layout/               # Admin pages layout
│   │   │       ├── admin-layout.component.ts
│   │   │       ├── admin-layout.component.html
│   │   │       └── admin-layout.component.scss
│   │   │
│   │   ├── app-routing.module.ts           # Root routing configuration
│   │   ├── app.component.ts                # Root component
│   │   ├── app.component.html              # Root template
│   │   ├── app.component.scss              # Root styles
│   │   └── app.module.ts                   # Root module
│   │
│   ├── assets/                             # Static Assets
│   │   ├── images/                         # Image files
│   │   │   ├── logo.png
│   │   │   ├── logo-small.png
│   │   │   └── placeholder.png
│   │   │
│   │   ├── icons/                          # Icon files
│   │   │   ├── favicon.ico
│   │   │   └── app-icons/
│   │   │
│   │   ├── config/                         # Configuration files
│   │   │   └── roles-menu.json            # Role-based menu configuration
│   │   │
│   │   └── styles/                         # Additional style files
│   │       ├── _variables.scss             # SCSS variables
│   │       ├── _mixins.scss                # SCSS mixins
│   │       └── _responsive.scss            # Responsive utilities
│   │
│   ├── environments/                       # Environment Configuration
│   │   ├── environment.ts                  # Development environment
│   │   ├── environment.uat.ts              # UAT environment
│   │   └── environment.prod.ts             # Production environment
│   │
│   ├── styles.scss                         # Global styles (Tailwind imports)
│   ├── index.html                          # Main HTML file
│   └── main.ts                             # Application entry point
│
├── tailwind.config.js                      # Tailwind CSS configuration
├── angular.json                            # Angular CLI configuration
├── tsconfig.json                           # TypeScript configuration
├── tsconfig.app.json                       # App-specific TypeScript config
├── package.json                            # NPM dependencies
└── README.md                               # Frontend documentation
```

---

## 📋 Module Organization

### Core Module (`core/`)
**Purpose**: Singleton services and app-wide functionality loaded once

**Includes**:
- Authentication & authorization services
- HTTP interceptors
- Route guards
- Global state management
- API base service

**Import**: Only in `AppModule`

---

### Shared Module (`shared/`)
**Purpose**: Reusable components, directives, pipes, and utilities

**Includes**:
- UI components (buttons, cards, modals)
- Form controls (inputs, selects, date pickers)
- File management (upload, preview, image selector)
- Data display (tables, grids, pagination)
- Filters (dynamic filters, search, toolbar)
- Custom directives and pipes
- Utility functions

**Import**: In all feature modules that need shared functionality

---

### Features Modules (`features/`)
**Purpose**: Self-contained feature modules with lazy loading

**Structure**:
```
feature-name/
├── components/             # Feature-specific components
├── services/              # Feature-specific services
├── models/                # Feature-specific models
├── [feature]-routing.module.ts
└── [feature].module.ts
```

**Examples**:
- `auth/` - Login, register, password reset
- `dashboard/` - Main dashboard
- `claims/` - Claims management
- `policies/` - Policy management
- `users/` - User management

---

### Layouts (`layouts/`)
**Purpose**: Different page layouts for different sections

**Layouts**:
- **Main Layout**: Header + Sidebar + Content + Footer (authenticated users)
- **Auth Layout**: Centered content (login, register)
- **Admin Layout**: Admin-specific layout with additional panels

---

## 🎨 Styling Strategy

### Tailwind CSS
- **Primary framework**: Utility-first CSS
- **Configuration**: `tailwind.config.js`
- **Custom classes**: Defined in `styles.scss` using `@layer components`

### SCSS
- **Global styles**: `styles.scss`
- **Variables**: `assets/styles/_variables.scss`
- **Mixins**: `assets/styles/_mixins.scss`
- **Component styles**: Component-specific `.scss` files

### Responsive Design
- **Mobile-first**: Design for mobile, enhance for larger screens
- **Breakpoints**: 
  - Mobile: 320px - 767px
  - Tablet: 768px - 1023px
  - Desktop: 1024px+

---

## 🔄 Data Flow

```
Component → Service → HTTP Client → API → Backend
    ↓                                           ↓
  View  ←  Component  ←  Service  ←  HTTP  ←  Response
```

**Interceptor Flow**:
```
Request → AuthInterceptor (add token) → LoaderInterceptor (show loader) → API
Response → ErrorInterceptor (handle errors) → LoaderInterceptor (hide loader) → Component
```

---

## 🚀 Key Principles

1. **Single Responsibility**: Each component/service has one clear purpose
2. **DRY (Don't Repeat Yourself)**: Reuse shared components and utilities
3. **Lazy Loading**: Feature modules loaded on demand
4. **Type Safety**: Strong TypeScript typing throughout
5. **Responsive First**: Mobile-first design approach
6. **Accessibility**: WCAG 2.1 AA compliance
7. **Performance**: OnPush change detection where appropriate
8. **Security**: No sensitive data in frontend, token handling via httpOnly cookies

---

## 📦 Component Categories

### Smart Components (Container Components)
- Located in feature modules
- Handle business logic
- Communicate with services
- Manage state
- Pass data to presentational components

### Presentational Components (Dumb Components)
- Located in shared module
- Receive data via `@Input()`
- Emit events via `@Output()`
- No direct service injection
- Reusable across features

---

## 🔐 Security Implementation

1. **Route Guards**: Protect routes based on authentication and roles
2. **HTTP Interceptors**: Add JWT tokens automatically
3. **Error Handling**: Centralized error handling with logging
4. **CORS**: Configured on backend, frontend sends credentials
5. **XSS Protection**: Angular sanitization + DomSanitizer when needed
6. **Role-Based Access**: Dynamic UI based on user permissions

---

## 📱 Responsive Components

All components should support:
- Touch events (mobile)
- Mouse events (desktop)
- Keyboard navigation (accessibility)
- Screen readers (ARIA labels)

Use Tailwind responsive classes:
```html
<div class="w-full md:w-1/2 lg:w-1/3">
  <!-- Responsive layout -->
</div>
```

---

## 🧪 Testing Strategy

```
component.spec.ts        # Unit tests for components
service.spec.ts          # Unit tests for services
e2e/                     # End-to-end tests
```

---

## 📖 Documentation References

- **Architecture**: See `/docs/frontend-architecture.md` for complete architecture details
- **Coding Standards**: See `/docs/coding-standards.md` for naming conventions
- **API Integration**: See `/docs/backend-architecture.md` for API specifications

---

**Last Updated**: February 10, 2026
