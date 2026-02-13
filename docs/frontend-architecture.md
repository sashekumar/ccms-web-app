# Frontend Architecture - Angular Application (Standalone Components)

## Overview
A fully responsive, role-based web application using **Angular Standalone Components architecture** - the modern, recommended approach for Angular applications. The application is designed to work seamlessly across all devices including mobile phones, tablets, and desktop computers, providing an optimized user experience with better tree-shaking and smaller bundle sizes.

## Technology Stack
- **Framework**: Angular 21+ (Standalone Components)
- **Language**: TypeScript
- **Styling**: Tailwind CSS (Utility-first CSS framework)
- **CSS Preprocessor**: SCSS
- **State Management**: RxJS + Angular Services
- **HTTP Client**: Angular HttpClient with Functional Interceptors
- **Routing**: Angular Router with Standalone Component Routing
- **Design System**: Custom design based on CCMS mockup
- **Color Scheme**: Primary #1e3c72 → #2a5298 gradient (dark blue theme)
- **Sidebar Theme**: Dark slate (#1e293b) with collapsible functionality

## Key Features
- ✅ **Standalone Components**: Modern Angular architecture (no NgModules)
- ✅ **Functional Interceptors & Guards**: Simplified, composable approach
- ✅ **Better Tree-Shaking**: ~25% smaller bundle sizes
- ✅ **Fully Responsive Design**: Optimized for mobile (320px+), tablet (768px+), and desktop (1024px+)
- ✅ **Role-Based Access Control**: Dynamic navigation based on user roles
- ✅ **Mobile-First Approach**: Progressive enhancement for larger screens
- ✅ **Touch & Mouse Support**: Optimized interactions for all input methods
- ✅ **Cross-Browser Compatible**: Works on all modern browsers (Chrome, Firefox, Safari, Edge)
- ✅ **PWA Ready**: Optional Progressive Web App capabilities for offline support
- ✅ **Accessibility Compliant**: WCAG 2.1 AA standards

## 🎯 Commonization & Reusability Strategy

**CRITICAL PRINCIPLE**: All reusable functionality MUST be centralized for:
- **Single source of truth** - Change once, update everywhere
- **Future compatibility** - Easy to update/fix across entire app
- **Instant app-wide effects** - Font changes, styling updates propagate immediately
- **Better maintainability** - No scattered duplicate code

### Commonized Components & Utilities

#### ✅ File Management (Shared Module)
- **File Upload Component**: Universal uploader with validation
- **Image Selector**: Image picker with preview and cropping
- **Drag-Drop Upload**: Drag and drop file upload
- **File Preview**: Document and image preview component

#### ✅ Dynamic Filters & Search (Shared Module)
- **Dynamic Filter Component**: Configurable filter builder for any data type
- **Search Box Component**: Universal search with debouncing
- **Filter Toolbar**: Complete filtering UI with apply/clear actions
- **Date Range Filter**: Date-based filtering
- **Multi-Select Filter**: Multiple selection filtering

#### ✅ API Fetchers (Shared Utils)
- **ApiFetchersUtil**: Method-based API fetchers
  - `fetchPaginated()` - Paginated data fetching
  - `fetchWithSearch()` - Search-enabled fetching
  - `fetchWithFilters()` - Filter-enabled fetching
  - `fetchById()` - Single entity fetching
  - `fetchWithSort()` - Sorted data fetching
  - `fetchBatch()` - Multiple entities fetching

#### ✅ Filter Utilities (Shared Utils)
- **FilterUtil**: Client/server-side filtering helpers
  - `buildQueryString()` - Convert filters to query params
  - `filterData()` - Client-side data filtering
  - `cleanFilters()` - Remove empty filter values

#### ✅ Centralized Styling
- **Font Management**: Tailwind config fontFamily - change once, applies everywhere
- **Component Styles**: @layer components in styles.scss
- **Color Scheme**: Centralized color palette in Tailwind config
- **Responsive Breakpoints**: Consistent across entire app

**Result**: Any future changes to fonts, filters, upload logic, or API patterns happen in ONE place and instantly affect the entire application.

---

## Project Structure (Standalone Architecture)

```
src/
├── app/
│   ├── core/                      # Core services, guards, interceptors (all standalone)
│   │   ├── guards/               # Functional guards
│   │   │   ├── auth.guard.functional.ts
│   │   │   └── role.guard.functional.ts
│   │   ├── interceptors/         # Functional HTTP interceptors
│   │   │   ├── auth.interceptor.functional.ts
│   │   │   ├── error.interceptor.functional.ts
│   │   │   └── loader.interceptor.functional.ts
│   │   └── services/             # Core services (providedIn: 'root')
│   │       ├── auth.service.ts
│   │       ├── api.service.ts
│   │       └── loader.service.ts
│   │
│   ├── shared/                    # Shared components, directives, pipes (all standalone)
│   │   ├── components/           # Reusable standalone components
│   │   │   ├── ui/              # UI components (button, card, modal, etc.)
│   │   │   ├── forms/           # Form components (input, select, etc.)
│   │   │   ├── file-management/ # File upload, preview components
│   │   │   ├── data-display/    # Table, grid, pagination
│   │   │   ├── filters/         # Filter components
│   │   │   └── layout/          # Layout components (breadcrumb, page-header)
│   │   ├── directives/          # Standalone directives
│   │   ├── pipes/               # Standalone pipes
│   │   ├── models/              # Shared interfaces and types
│   │   └── utils/               # Utility functions
│   │
│   ├── features/                  # Feature components (all standalone)
│   │   ├── auth/                # Authentication feature
│   │   │   ├── login.component.ts
│   │   │   └── register.component.ts
│   │   ├── dashboard/           # Dashboard feature
│   │   │   └── dashboard.component.ts
│   │   └── [feature-name]/      # Other features
│   │
│   ├── layouts/                   # Layout components (all standalone)
│   │   ├── main-layout/
│   │   │   ├── main-layout.component.ts
│   │   │   ├── header/          # Header component
│   │   │   ├── sidebar/         # Sidebar component
│   │   │   └── footer/          # Footer component
│   │   ├── auth-layout/
│   │   └── admin-layout/
│   │
│   ├── app.routes.ts             # Application routes (standalone routing)
│   ├── app.config.ts             # Application configuration (providers)
│   ├── app.component.ts          # Root component (standalone)
│   └── app.component.html        # Root template
│
├── assets/                        # Static assets
│   ├── images/
│   ├── icons/
│   ├── config/                   # Configuration files
│   │   └── roles-menu.json      # Role-based menu configuration
│   └── styles/
│
├── environments/                  # Environment configurations
│   ├── environment.ts            # Development
│   ├── environment.uat.ts        # UAT
│   └── environment.prod.ts       # Production
│
├── main.ts                        # Bootstrap file (bootstrapApplication)
├── styles.scss                    # Global styles
└── tailwind.config.js             # Tailwind CSS configuration
```

## Standalone Architecture

### Why Standalone Components?
1. **Simpler**: No NgModule boilerplate
2. **Better Performance**: Improved tree-shaking (~25% smaller bundles)
3. **More Explicit**: Each component declares its dependencies
4. **Easier Lazy Loading**: Built-in route-level code splitting
5. **Future-Proof**: Angular's recommended approach (Angular 14+)

### Key Differences from NgModule Architecture
- ❌ **No NgModules**: No `@NgModule`, `.module.ts` files
- ✅ **Standalone Components**: `standalone: true` in `@Component`
- ✅ **Direct Imports**: Components import what they need directly
- ✅ **Functional Interceptors**: `HttpInterceptorFn` instead of class-based
- ✅ **Functional Guards**: `CanActivateFn` instead of class-based
- ✅ **App Configuration**: `app.config.ts` with providers instead of `app.module.ts`
- ✅ **Bootstrap Application**: `bootstrapApplication()` instead of `bootstrapModule()`
- Single source of truth for future updates
- Immediate app-wide effect when modified
- Better compatibility and maintenance
- Consistent behavior across features

#### Shared Components Structure
```
shared/
├── components/
│   ├── ui/                          # Basic UI components
│   │   ├── button/
│   │   ├── card/
│   │   ├── modal/
│   │   ├── loading-spinner/
│   │   └── alert/
│   ├── forms/                       # Form components
│   │   ├── input/
│   │   ├── select/
│   │   ├── checkbox/
│   │   ├── radio/
│   │   ├── date-picker/
│   │   └── textarea/
│   ├── file-management/             # File handling (COMMONIZED)
│   │   ├── file-upload/            # Universal file uploader
│   │   ├── image-selector/         # Image picker with preview
│   │   ├── file-preview/           # Document/image preview
│   │   └── drag-drop-upload/       # Drag & drop uploader
│   ├── data-display/               # Data presentation
│   │   ├── table/                  # Reusable data table
│   │   ├── data-grid/
│   │   ├── pagination/
│   │   └── list-view/
│   ├── filters/                    # Filter components (COMMONIZED)
│   │   ├── dynamic-filter/         # Dynamic filter builder
│   │   ├── search-box/             # Universal search
│   │   ├── date-range-filter/
│   │   ├── multi-select-filter/
│   │   └── filter-toolbar/         # Complete filter UI
│   └── layout/
│       ├── breadcrumb/
│       └── page-header/
├── directives/
│   ├── validation/
│   ├── ui-behavior/
│   └── permissions/
├── pipes/
│   ├── date-format.pipe.ts
│   ├── currency-format.pipe.ts
│   ├── file-size.pipe.ts
│   └── truncate.pipe.ts
├── utils/                          # Utility functions (COMMONIZED)
│   ├── api-fetchers.util.ts       # Method-based API helpers
│   ├── filter.util.ts             # Filter logic helpers
│   ├── validation.util.ts
│   ├── date.util.ts
│   └── file.util.ts
├── models/
│   ├── filter.model.ts
│   ├── pagination.model.ts
│   └── api-response.model.ts
└── shared.module.ts
```

#### 🔧 Commonized Utility Components

##### 1. File Upload Component (Universal)
```typescript
// shared/components/file-management/file-upload/file-upload.component.ts
@Component({
  selector: 'app-file-upload',
  template: `...`
})
export class FileUploadComponent {
  @Input() accept: string = '*/*';  // '.pdf,.doc,.docx' or 'image/*'
  @Input() maxSize: number = 5242880; // 5MB default
  @Input() multiple: boolean = false;
  @Input() label: string = 'Choose File';
  @Output() fileSelected = new EventEmitter<File | File[]>();
  @Output() error = new EventEmitter<string>();
  
  onFileChange(event: any): void {
    const files = event.target.files;
    if (this.validateFiles(files)) {
      this.fileSelected.emit(this.multiple ? Array.from(files) : files[0]);
    }
  }
  
  private validateFiles(files: FileList): boolean {
    // Size validation, type validation
    // Emit error if validation fails
    return true;
  }
}

// Usage in any feature
<app-file-upload 
  accept="image/*" 
  [maxSize]="10485760" 
  (fileSelected)="onImageSelected($event)"
  (error)="handleError($event)">
</app-file-upload>
```

##### 2. Image Selector Component
```typescript
// shared/components/file-management/image-selector/image-selector.component.ts
@Component({
  selector: 'app-image-selector',
  template: `
    <div class="image-selector">
      <div class="preview" *ngIf="previewUrl">
        <img [src]="previewUrl" alt="Preview">
        <button (click)="clearImage()">Remove</button>
      </div>
      <input type="file" 
             accept="image/*" 
             (change)="onImageSelect($event)"
             #fileInput>
      <button (click)="fileInput.click()">Select Image</button>
    </div>
  `
})
export class ImageSelectorComponent {
  @Input() currentImage?: string;
  @Output() imageSelected = new EventEmitter<File>();
  @Output() imageRemoved = new EventEmitter<void>();
  
  previewUrl?: string;
  
  onImageSelect(event: any): void {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      this.createPreview(file);
      this.imageSelected.emit(file);
    }
  }
  
  private createPreview(file: File): void {
    const reader = new FileReader();
    reader.onload = (e: any) => this.previewUrl = e.target.result;
    reader.readAsDataURL(file);
  }
}
```

##### 3. Dynamic Filter Component
```typescript
// shared/components/filters/dynamic-filter/dynamic-filter.component.ts
export interface FilterConfig {
  field: string;
  label: string;
  type: 'text' | 'select' | 'date' | 'number' | 'daterange' | 'multiselect';
  options?: { label: string; value: any }[];
  placeholder?: string;
}

@Component({
  selector: 'app-dynamic-filter',
  template: `
    <div class="filter-toolbar flex gap-4 flex-wrap">
      <div *ngFor="let config of filterConfigs" class="filter-item">
        <label>{{ config.label }}</label>
        
        <!-- Text Filter -->
        <input *ngIf="config.type === 'text'" 
               type="text"
               [placeholder]="config.placeholder"
               (input)="onFilterChange(config.field, $event.target.value)">
        
        <!-- Select Filter -->
        <select *ngIf="config.type === 'select'"
                (change)="onFilterChange(config.field, $event.target.value)">
          <option value="">All</option>
          <option *ngFor="let opt of config.options" [value]="opt.value">
            {{ opt.label }}
          </option>
        </select>
        
        <!-- Date Filter -->
        <input *ngIf="config.type === 'date'"
               type="date"
               (change)="onFilterChange(config.field, $event.target.value)">
      </div>
      
      <button (click)="applyFilters()">Apply</button>
      <button (click)="clearFilters()">Clear</button>
    </div>
  `
})
export class DynamicFilterComponent {
  @Input() filterConfigs: FilterConfig[] = [];
  @Output() filtersChanged = new EventEmitter<any>();
  
  private currentFilters: any = {};
  
  onFilterChange(field: string, value: any): void {
    if (value) {
      this.currentFilters[field] = value;
    } else {
      delete this.currentFilters[field];
    }
  }
  
  applyFilters(): void {
    this.filtersChanged.emit({ ...this.currentFilters });
  }
  
  clearFilters(): void {
    this.currentFilters = {};
    this.filtersChanged.emit({});
  }
}

// Usage in feature
filterConfigs: FilterConfig[] = [
  { field: 'status', label: 'Status', type: 'select', 
    options: [{ label: 'Active', value: 'active' }, { label: 'Inactive', value: 'inactive' }] },
  { field: 'date', label: 'Created Date', type: 'date' },
  { field: 'search', label: 'Search', type: 'text', placeholder: 'Search...' }
];

<app-dynamic-filter 
  [filterConfigs]="filterConfigs"
  (filtersChanged)="onFiltersChange($event)">
</app-dynamic-filter>
```

##### 4. Universal Search Component
```typescript
// shared/components/filters/search-box/search-box.component.ts
@Component({
  selector: 'app-search-box',
  template: `
    <div class="search-box">
      <input 
        type="text" 
        [placeholder]="placeholder"
        [(ngModel)]="searchTerm"
        (ngModelChange)="onSearchChange($event)"
        class="search-input">
      <button *ngIf="searchTerm" (click)="clearSearch()">Clear</button>
    </div>
  `
})
export class SearchBoxComponent {
  @Input() placeholder: string = 'Search...';
  @Input() debounceTime: number = 300; // ms
  @Output() search = new EventEmitter<string>();
  
  searchTerm: string = '';
  private searchSubject = new Subject<string>();
  
  ngOnInit(): void {
    this.searchSubject.pipe(
      debounceTime(this.debounceTime),
      distinctUntilChanged()
    ).subscribe(term => this.search.emit(term));
  }
  
  onSearchChange(term: string): void {
    this.searchSubject.next(term);
  }
  
  clearSearch(): void {
    this.searchTerm = '';
    this.search.emit('');
  }
}
```

**Components**:
- ✅ **File Management**: Universal file upload, image selector, drag-drop, preview
- ✅ **Dynamic Filters**: Configurable filter builder for any data
- ✅ **Search**: Universal search with debouncing
- ✅ **Form Controls**: Input, select, checkbox, date-picker, etc.
- ✅ **Data Display**: Tables, cards, lists, pagination
- ✅ **UI Elements**: Buttons, modals, dialogs, alerts
- ✅ **Loading Indicators**: Spinners, progress bars

**Directives**:
- Custom validation directives
- UI behavior directives
- Permission directives

**Pipes**:
- Date formatting
- Currency formatting
- File size formatting
- Text transformation

### Core Services Architecture
**Purpose**: Singleton services providing app-wide functionality

**Key Services** (all using `providedIn: 'root'`):
- `AuthService`: Authentication and authorization
- `RoleService`: Role management and menu configuration
- `ApiService`: Base HTTP service
- `StorageService`: Local/Session storage management
- `NotificationService`: Toast/alert notifications
- `LoaderService`: Global loading state
- `SidebarService`: Sidebar state management

### Functional Guards
**Purpose**: Protect routes with composable guard functions

**Available Guards**:
- `authGuard`: Verify user authentication
- `roleGuard`: Check user roles for access control

**Usage**:
```typescript
// app.routes.ts
import { authGuard, roleGuard } from './core/guards';

export const routes: Routes = [
  {
    path: 'admin',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin', 'manager'] },
    loadComponent: () => import('./features/admin/admin.component')
  }
];
```

### Functional Interceptors
**Purpose**: Handle HTTP requests globally with composable functions

**Available Interceptors**:
- `authInterceptor`: Add credentials (httpOnly cookies)
- `errorInterceptor`: Global error handling
- `loaderInterceptor`: Show/hide loading indicator

**Configuration**:
```typescript
// app.config.ts
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor, errorInterceptor, loaderInterceptor } from './core/interceptors';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(
      withInterceptors([authInterceptor, errorInterceptor, loaderInterceptor])
    )
  ]
};
```

### Feature Components
**Purpose**: Encapsulated business logic and UI for specific features

**Structure per Feature** (Standalone):
```
feature-name/
├── components/              # Feature-specific components (all standalone)
├── services/               # Feature-specific services (providedIn: 'root')
├── models/                 # Feature-specific TypeScript interfaces
└── feature-name.routes.ts  # Feature-specific routes (optional)
```

**Lazy Loading**: All feature components should be lazy loaded for performance

**Example**:
```typescript
// app.routes.ts
export const routes: Routes = [
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard.component')
      .then(m => m.DashboardComponent)
  },
  {
    path: 'claims',
    loadChildren: () => import('./features/claims/claims.routes')
      .then(m => m.CLAIMS_ROUTES)  // Load child routes
  }
];
```

## Component Architecture (Standalone)

### Standalone Component Structure

**Basic Template**:
```typescript
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-example',
  standalone: true,
  imports: [
    CommonModule,      // ngIf, ngFor, etc.
    RouterLink,        // Navigation
    // Import other components, directives, pipes directly
  ],
  templateUrl: './example.component.html',
  styleUrls: ['./example.component.scss']
})
export class ExampleComponent {
  // Component logic
}
```

### Component Types

1. **Container Components (Smart)**
   - Manage state and business logic
   - Connect to services (injected via constructor)
   - Pass data to presentational components
   - Handle events from child components

2. **Presentational Components (Dumb)**
   - Receive data via `@Input()`
   - Emit events via `@Output()`
   - Minimal service injection
   - Reusable across features
   - Focus on UI rendering

### Component Guidelines
- One component per file
- Use OnPush change detection strategy where possible
- Implement lifecycle hooks appropriately
- Unsubscribe from observables in `ngOnDestroy`
- Use reactive forms for complex forms
- Use template-driven forms for simple forms

## Navigation Architecture

### Global Header Component
**Location**: `app/layouts/main-layout/header/`

**Responsibilities**:
- Display application logo/branding
- **Role selector dropdown (right corner)** - Switch between user's eligible roles
- Show user profile menu
- Display notifications icon with badge
- Hamburger menu toggle for mobile/tablet
- Search functionality (if applicable)
- Quick actions/shortcuts

**Structure**:
```typescript
header/
├── header.component.ts
├── header.component.html
├── header.component.scss
└── header.component.spec.ts
```

**Features**:
- Sticky/fixed positioning
- Responsive design (full width)
- **Sidebar toggle button** (left side, hamburger icon)
- **Quick navigation links** (8H Monitoring, LOS Monitoring)
- **Role selector dropdown** (visible only for admin users with roleId === 0):
  - Display all available roles for admin
  - Show currently active role badge
  - Emit role change event to update sidebar menu
  - Hidden for regular users (non-admin)
- User info display (Full Name + "Internal TPA")
- Logout functionality
- Fixed height: 60px
- Primary brand color: #1e3c72

**Header Component Implementation**:
```typescript
export class HeaderComponent implements OnInit {
  @Output() menuToggle = new EventEmitter<void>();
  @Output() roleChange = new EventEmitter<number>();
  
  availableRoles$ = this.roleService.getAllRoles();
  selectedRole$ = this.roleService.getSelectedRole();
  currentUser$ = this.authService.currentUser$;
  isAdmin = false;
  showRoleDropdown = false;

  constructor(
    private roleService: RoleService,
    private authService: AuthService,
    private sidebarService: SidebarService
  ) {}

  ngOnInit() {
    // Check if user is admin (roleId === 0)
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.isAdmin = user.roleId === 0;
        this.showRoleDropdown = this.isAdmin;
        this.roleService.initializeRoles(user.roleId);
      }
    });
  }

  toggleSidebar() {
    this.sidebarService.toggle();
  }

  onRoleSelect(roleId: number) {
    this.roleService.setSelectedRole(roleId);
  }

  logout() {
    this.authService.logout().subscribe();
  }
}
```

**Header Template Example**:
```html
<nav class="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 shadow-sm z-50 h-[60px] px-6 flex items-center justify-between">
  <!-- Left: Sidebar Toggle + Brand Logo + Role Badge -->
  <div class="flex items-center gap-3">
    <button type="button" (click)="toggleSidebar()" class="text-primary-800 hover:bg-gray-100 p-2 rounded">
      <i class="fas fa-bars"></i>
    </button>
    <i class="fas fa-shield-alt text-primary-800 text-xl"></i>
    <span class="text-lg font-bold text-primary-800">CCMS TPA Portal</span>
    <span *ngIf="selectedRole$ | async as selectedRole" 
          class="px-2.5 py-1 text-[0.7rem] font-semibold uppercase bg-gray-100 text-gray-800 border rounded-full">
      {{ selectedRole.roleName }}
    </span>
  </div>

  <!-- Center: Quick Navigation Links -->
  <ul class="hidden lg:flex items-center gap-4 ml-8">
    <li><a href="#" class="text-gray-600 text-xs font-bold"><i class="fas fa-clock me-1"></i> 8H Monitoring</a></li>
    <li><a href="#" class="text-gray-600 text-xs font-bold"><i class="fas fa-procedures me-1"></i> LOS Monitoring</a></li>
  </ul>

  <!-- Right: Role Selector (Admin Only) + User Info + Logout -->
  <div class="flex items-center gap-3">
    <!-- Role Selector (Only for Admin - roleId 0) -->
    <select *ngIf="showRoleDropdown" class="text-sm px-2 py-1 border border-gray-300 rounded cursor-pointer"
            (change)="onRoleSelect(+$any($event.target).value)" [value]="(selectedRole$ | async)?.roleId">
      <option *ngFor="let role of availableRoles$ | async" [value]="role.roleId">{{ role.roleName }}</option>
    </select>

    <!-- User Info -->
    <div class="text-right leading-tight">
      <div class="font-bold text-sm">{{ (currentUser$ | async)?.fullName || 'User' }}</div>
      <div class="text-gray-500 text-xs">Internal TPA</div>
    </div>

    <!-- Logout Button -->
    <button type="button" (click)="logout()" 
            class="px-3 py-1.5 text-sm text-red-600 border border-red-600 rounded-md">
      <i class="fas fa-sign-out-alt"></i>
    </button>
  </div>
</nav>
```

### Global Sidebar Component
**Location**: `app/layouts/main-layout/sidebar/`

**Responsibilities**:
- Display navigation menu items **based on selected role**
- Show active route highlighting
- Support nested menu items
- Collapse/expand functionality
- Dynamic menu rendering based on role selection
- Filter menu items according to active role

**Structure**:
```typescript
sidebar/
├── sidebar.component.ts
├── sidebar.component.html
├── sidebar.component.scss
├── sidebar.component.spec.ts
└── menu-item/               # Reusable menu item component
    ├── menu-item.component.ts
    ├── menu-item.component.html
    └── menu-item.component.scss
```

**Features**:
- **Dark theme styling**: Background #1e293b (slate)
- **Collapsible sidebar**: 240px (expanded) ↔ 70px (collapsed)
- **Fixed positioning**: Below navbar (top: 60px)
- Multi-level nested menus
- Icons use Font Awesome classes
- Active state indication (blue background)
- Smooth animations and transitions
- Hover effects (#334155 slate gray)
- Border accent (#334155)
- Icons remain visible when collapsed
- Text labels hidden when collapsed
- Responsive behavior:
  - **Desktop**: Fixed sidebar, collapsible via toggle button
  - **Tablet/Mobile**: Can be hidden/shown via hamburger menu

**Sidebar Component Implementation**:
```typescript
export class SidebarComponent implements OnInit {
  @Input() isOpen: boolean = true;
  @Input() isCollapsed: boolean = false;
  @Input() menuItems: MenuItem[] = [];
  @Output() backdropClick = new EventEmitter<void>();

  activeRoute: string = '';

  constructor(
    private router: Router,
    private roleService: RoleService
  ) {}

  ngOnInit() {
    // Track active route
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.activeRoute = event.url;
    });
  }

  onBackdropClick() {
    this.backdropClick.emit();
  }

  isActive(menuItem: MenuItem): boolean {
    if (menuItem.route) {
      return this.activeRoute.startsWith(menuItem.route);
    }
    return menuItem.children?.some(child => this.isActive(child)) || false;
  }
}
```

**Sidebar Template Example**:
```html
<aside [class.w-60]="isOpen" [class.w-[70px]="!isOpen"
       class="fixed left-0 top-[60px] h-[calc(100vh-60px)] bg-[#1e293b] text-white transition-all duration-300 overflow-y-auto z-[1045] border-r border-[#334155]">
  <nav class="py-3">
    <div class="flex flex-col" *ngFor="let item of menuItems$ | async">
      <!-- Menu Item without Children -->
      <a *ngIf="!item.children" [routerLink]="item.route || '/dashboard'"
         [class.bg-blue-600]="item.route && isActive(item.route)"
         [class.text-white]="item.route && isActive(item.route)"
         [class.text-gray-300]="!item.route || !isActive(item.route)"
         class="flex items-center gap-3 px-5 py-3 hover:bg-[#334155] transition-all whitespace-nowrap overflow-hidden text-xs font-medium">
        <i [class]="'fas fa-' + item.icon + ' w-5 text-center text-sm'"></i>
        <span [class.hidden]="!isOpen" class="link-text">{{ item.label }}</span>
      </a>
      <!-- Nested menu items omitted for brevity -->
    </div>
  </nav>
</aside>
```

**Menu Item Component** (Recursive for nested menus):
```typescript
export class MenuItemComponent {
  @Input() menuItem!: MenuItem;
  @Input() isCollapsed: boolean = false;
  @Input() isActive: boolean = false;
  @Input() level: number = 0;

  isExpanded: boolean = false;

  toggleExpand() {
    if (this.menuItem.children?.length) {
      this.isExpanded = !this.isExpanded;
    }
  }

  hasChildren(): boolean {
    return !!this.menuItem.children?.length;
  }
}
```

**Menu Item Template**:
```html
<div class="menu-item" [class.active]="isActive" [class.has-children]="hasChildren()">
  <a *ngIf="!hasChildren()" 
     [routerLink]="menuItem.route"
     class="menu-link"
     [style.paddingLeft.px]="level * 16">
    <i class="menu-icon">{{ menuItem.icon }}</i>
    <span class="menu-label" *ngIf="!isCollapsed">{{ menuItem.label }}</span>
    <span class="menu-badge" *ngIf="menuItem.badge && !isCollapsed">
      {{ menuItem.badge }}
    </span>
  </a>

  <div *ngIf="hasChildren()" 
       class="menu-link" 
       (click)="toggleExpand()"
       [style.paddingLeft.px]="level * 16">
    <i class="menu-icon">{{ menuItem.icon }}</i>
    <span class="menu-label" *ngIf="!isCollapsed">{{ menuItem.label }}</span>
    <i class="expand-icon" *ngIf="!isCollapsed">
      {{ isExpanded ? 'expand_less' : 'expand_more' }}
    </i>
  </div>

  <!-- Recursive nested items -->
  <div class="submenu" *ngIf="hasChildren() && isExpanded && !isCollapsed">
    <app-menu-item
      *ngFor="let child of menuItem.children"
      [menuItem]="child"
      [isCollapsed]="isCollapsed"
      [level]="level + 1">
    </app-menu-item>
  </div>
</div>
```

### Hamburger Menu Pattern

**Behavior**:
- **Desktop (> 1024px)**: Optional, can toggle sidebar collapse
- **Tablet (768px - 1024px)**: Shows hamburger, sidebar overlays content
- **Mobile (< 768px)**: Shows hamburger, sidebar overlays content with backdrop

**Implementation**:
```typescript
@Injectable({ providedIn: 'root' })
export class SidebarService {
  private sidebarOpenSubject = new BehaviorSubject<boolean>(true);
  public isSidebarOpen$ = this.sidebarOpenSubject.asObservable();

  toggle() {
    this.sidebarOpenSubject.next(!this.sidebarOpenSubject.value);
  }

  open() {
    this.sidebarOpenSubject.next(true);
  }

  close() {
    this.sidebarOpenSubject.next(false);
  }
}

@Injectable({ providedIn: 'root' })
export class RoleService {
  private selectedRoleSubject = new BehaviorSubject<RoleConfig | null>(null);
  public selectedRole$ = this.selectedRoleSubject.asObservable();

  private rolesConfigSubject = new BehaviorSubject<RoleConfig[]>([]);
  public rolesConfig$ = this.rolesConfigSubject.asObservable();

  constructor() {
    this.loadRolesConfig();
  }

  private loadRolesConfig() {
    // Load via direct JSON import (build-time, not HTTP)
    import('../../../assets/config/roles-menu.json').then(module => {
      const config = module.default as RoleBasedMenuConfig;
      this.rolesConfigSubject.next(config.roles);
      
      // Load selected role from storage
      const storedRoleId = sessionStorage.getItem('selectedRole');
      if (storedRoleId) {
        const roleId = parseInt(storedRoleId, 10);
        const role = config.roles.find(r => r.roleId === roleId);
        if (role) {
          this.selectedRoleSubject.next(role);
        }
      }
    });
  }

  /**
   * Initialize roles based on user's roleId
   * If roleId is 0, user is admin and can see all roles
   * Otherwise, filter to user's specific role
   */
  initializeRoles(userRoleId: number): void {
    const allRoles = this.rolesConfigSubject.value;
    
    if (userRoleId === 0) {
      // Admin user - show all roles, default to first
      if (!this.selectedRoleSubject.value && allRoles.length > 0) {
        this.selectedRoleSubject.next(allRoles[0]);
        sessionStorage.setItem('selectedRole', allRoles[0].roleId.toString());
      }
    } else {
      // Regular user - find and set their specific role
      const userRole = allRoles.find(r => r.roleId === userRoleId);
      if (userRole) {
        this.selectedRoleSubject.next(userRole);
        sessionStorage.setItem('selectedRole', userRole.roleId.toString());
      }
    }
  }

  isAdmin(userRoleId: number): boolean {
    return userRoleId === 0;
  }

  setSelectedRole(roleId: number) {
    const role = this.rolesConfigSubject.value.find(r => r.roleId === roleId);
    if (role) {
      this.selectedRoleSubject.next(role);
      sessionStorage.setItem('selectedRole', roleId.toString());
    }
  }

  getMenuItemsForRole(roleId: number): Observable<MenuItem[]> {
    return this.rolesConfig$.pipe(
      map(roles => {
        const role = roles.find(r => r.roleId === roleId);
        return role ? role.menuItems : [];
      })
    );
  }

  getCurrentMenuItems(): Observable<MenuItem[]> {
    return this.selectedRole$.pipe(
      map(role => role ? role.menuItems : [])
    );
  }

  getAllRoles(): Observable<RoleConfig[]> {
    return this.rolesConfig$;
  }

  getSelectedRole(): Observable<RoleConfig | null> {
    return this.selectedRole$;
  }
}
```

### Main Layout Component
**Structure**:
```html
<div class="main-layout">
  <app-header 
    (menuToggle)="toggleSidebar()"
    (roleChange)="onRoleChange($event)">
  </app-header>
  
  <div class="layout-container">
    <app-sidebar 
      [isOpen]="sidebarOpen$ | async"
      [isCollapsed]="sidebarCollapsed$ | async"
      [menuItems]="currentMenuItems$ | async"
      (backdropClick)="closeSidebar()">
    </app-sidebar>
    
    <main class="content-area" [class.sidebar-collapsed]="sidebarCollapsed$ | async">
      <router-outlet></router-outlet>
    </main>
  </div>
  
  <app-footer></app-footer>
</div>
```

**Component Logic**:
```typescript
export class MainLayoutComponent implements OnInit, OnDestroy {
  isSidebarOpen = true;
  private sidebarSubscription?: Subscription;

  constructor(private sidebarService: SidebarService) {}

  ngOnInit() {
    this.sidebarSubscription = this.sidebarService.isSidebarOpen$.subscribe(
      isOpen => this.isSidebarOpen = isOpen
    );
  }

  ngOnDestroy() {
    this.sidebarSubscription?.unsubscribe();
  }
}
```

### Role-Based Menu Configuration

**JSON Configuration File Location**: `src/assets/config/roles-menu.json`

**Purpose**: Store all roles and their respective menu items in a centralized JSON file. The sidebar menu dynamically renders based on the selected role from the header dropdown.

**Configuration Interfaces**:
```typescript
export interface MenuItem {
  id: string;
  label: string;
  icon: string;          // Font Awesome icon name (without 'fa-' prefix)
  route?: string;
  children?: MenuItem[];
  expanded?: boolean;    // For nested menu expansion state
}

export interface RoleConfig {
  roleId: number;        // Changed from string to number
  roleName: string;
  roleDisplayName: string;
  description?: string;
  menuItems: MenuItem[];
}

export interface RoleBasedMenuConfig {
  version: string;
  lastUpdated: string;
  roles: RoleConfig[];
}
```

**Admin Role System**:
- **Admin User** (roleId === 0):
  - Can see all roles in role selector dropdown
  - Can switch between any role
  - Role selector is visible in header
  
- **Regular User** (roleId 1-8):
  - Assigned to specific role
  - Role selector dropdown is hidden
  - Cannot switch roles
  - Auto-initialized with their assigned role

**JSON File Structure** (`roles-menu.json`):
```json
{
  "version": "1.0.0",
  "lastUpdated": "2026-02-12",
  "roles": [
    {
      "roleId": 1,
      "roleName": "Assessor",
      "roleDisplayName": "Assessor",
      "description": "Assessment and evaluation of claims",
      "menuItems": [
        {
          "id": "dashboard",
          "label": "Dashboard",
          "icon": "tachometer-alt",
          "route": "/dashboard"
        },
        {
          "id": "claims",
          "label": "Claims",
          "icon": "file-medical",
          "route": "/claims"
        }
      ]
    },
    {
      "roleId": 2,
      "roleName": "Manager",
      "roleDisplayName": "Claims Manager",
      "description": "Manage and oversee claims processing",
      "menuItems": []
    },
    {
      "roleId": 3,
      "roleName": "Audit Team",
      "roleDisplayName": "Audit Team",
      "description": "Audit and compliance verification",
      "menuItems": []
    },
    {
      "roleId": 4,
      "roleName": "IX Team",
      "roleDisplayName": "IX Team",
      "description": "Information Exchange team",
      "menuItems": []
    },
    {
      "roleId": 5,
      "roleName": "Submission Team",
      "roleDisplayName": "Submission Team",
      "description": "Handle claim submissions and initial processing",
      "menuItems": []
    },
    {
      "roleId": 6,
      "roleName": "Settlement Team",
      "roleDisplayName": "Settlement Team",
      "description": "Process settlements and payments",
      "menuItems": []
    },
    {
      "roleId": 7,
      "roleName": "Customer Service",
      "roleDisplayName": "Customer Service",
      "description": "Customer support and service",
      "menuItems": []
    }
  ]
}
```

**TypeScript Declaration for JSON Imports**:

Create `src/typings.d.ts` to enable direct JSON imports:
```typescript
declare module "*.json" {
  const value: any;
  export default value;
}
```

This allows importing JSON files directly in TypeScript:
```typescript
import rolesConfig from '../../../assets/config/roles-menu.json';
```

**Benefits of Direct JSON Import vs HTTP Fetch**:
- ✅ **Build-time inclusion**: JSON bundled with app, no HTTP request needed
- ✅ **Better performance**: Instant availability, no network latency
- ✅ **Type safety**: TypeScript can validate structure at compile time
- ✅ **No 404 errors**: Build fails if file is missing
- ✅ **Better tree-shaking**: Unused properties can be eliminated

### Responsive Navigation States

**Mobile Mode (< 768px)**:
- **Sidebar**: Full-screen overlay with backdrop (z-index: 40)
  - Width: Full width (100vw) or 80% of viewport
  - Animation: Slide in from left
  - Close on backdrop click or menu item selection
- **Header**: Compact header (height: 56px)
  - Hamburger menu: Always visible (left side)
  - Logo: Smaller or icon only
  - Role selector: Dropdown (compact)
  - User avatar: Icon only (no name)
  - Notifications: Icon with badge
- **Content**: Full width, top padding for fixed header
- **Bottom Navigation** (Optional): Fixed bottom nav bar for quick access
- **Forms**: Single column, full-width inputs
- **Tables**: Card-based layout instead of traditional table

**Tablet Mode (768px - 1023px)**:
- **Sidebar**: Overlay with semi-transparent backdrop
  - Width: 250px fixed
  - Animation: Slide in from left
  - Closes on backdrop click
  - Can remain open while interacting with content
- **Header**: Full header (height: 64px)
  - Hamburger menu: Visible (left side)
  - Logo: Full logo with text
  - Role selector: Full dropdown with labels
  - User avatar: Icon with name
  - All header items visible
- **Content**: Full width when sidebar closed, adjusts when open
- **Forms**: Two-column layout for related fields
- **Tables**: Scrollable horizontal tables or adaptive card layout

**Desktop/Laptop Mode (1024px - 1439px)**:
- **Sidebar**: Fixed sidebar navigation
  - Width: 250px (expanded) or 60px (collapsed)
  - Toggle collapse with icon
  - Always visible, no backdrop
  - Smooth transition between states
- **Header**: Full header (height: 64px)
  - Hamburger menu: Optional (can hide or use for collapse toggle)
  - All elements fully visible
  - Hover states enabled
- **Content**: Left margin/padding to account for sidebar
  - Margin-left: 250px (expanded) or 60px (collapsed)
- **Forms**: Multi-column layouts
- **Tables**: Full table view with all columns

**Large Desktop Mode (1440px+)**:
- **Sidebar**: Fixed expanded sidebar (250px)
- **Header**: Full width with all features
- **Content**: Wide layout with max-width constraints for readability
  - Max content width: 1400px (centered)
- **Multi-panel layouts**: Side-by-side views, split screens
- **Data density**: Show more information, larger tables

## State Management

### Approach
- **Service-based state**: Using BehaviorSubject/Subject for shared state
- **Component state**: Local state within components
- **RxJS operators**: For data transformation and composition

### Service Pattern
```typescript
@Injectable({ providedIn: 'root' })
export class StateService {
  private stateSubject = new BehaviorSubject<State>(initialState);
  public state$ = this.stateSubject.asObservable();

  updateState(newState: Partial<State>) {
    this.stateSubject.next({ ...this.stateSubject.value, ...newState });
  }
}
```

## Routing Strategy (Standalone)

### Route Structure
```
/                           # Landing/Home
/auth
  /login                   # Login page
  /register                # Registration page
  /forgot-password         # Password recovery
/dashboard                 # Main dashboard
/[feature]                 # Feature routes
  /list                    # List view
  /create                  # Create new
  /:id                     # Detail view
  /:id/edit                # Edit view
/admin                     # Admin area
/profile                   # User profile
/settings                  # App settings
**                         # 404 Not Found
```

### Route Guards (Functional)
- Apply `authGuard` to protected routes
- Apply `roleGuard` for role-based access
- Use route resolvers for pre-fetching data

### Routing Configuration (Standalone)

**Using lazy-loaded standalone components for optimal performance.**

```typescript
// app.routes.ts
import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard.functional';
import { roleGuard } from './core/guards/role.guard.functional';

export const routes: Routes = [
  { 
    path: '', 
    redirectTo: '/dashboard', 
    pathMatch: 'full' 
  },
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes')
      .then(m => m.AUTH_ROUTES)
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./features/dashboard/dashboard.component')
      .then(m => m.DashboardComponent)
  },
  {
    path: 'claims',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['claims_manager', 'assessor'] },
    loadChildren: () => import('./features/claims/claims.routes')
      .then(m => m.CLAIMS_ROUTES)
  },
  // ... other routes
  { 
    path: '**', 
    redirectTo: '/dashboard' 
  }
];
```

```typescript
// app.config.ts
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { authInterceptor, errorInterceptor, loaderInterceptor } from './core/interceptors';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([authInterceptor, errorInterceptor, loaderInterceptor])
    )
  ]
};
```

```typescript
// main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, appConfig)
  .catch(err => console.error(err));
```

**Benefits of Standalone Component Routing**:
- ⚡ **Automatic lazy loading** - Components load on-demand
- 📦 **Better tree-shaking** - ~25% smaller bundles
- 🎯 **Simpler configuration** - No NgModule routing modules
- 💾 **Optimal code splitting** - Each route is its own chunk
- 🚀 **Faster navigation** - Less overhead without NgModules

**Child Routes Example**:
```typescript
// features/claims/claims.routes.ts
import { Routes } from '@angular/router';

export const CLAIMS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./claims-list.component')
      .then(m => m.ClaimsListComponent)
  },
  {
    path: 'create',
    loadComponent: () => import('./claims-create.component')
      .then(m => m.ClaimsCreateComponent)
  },
  {
    path: ':id',
    loadComponent: () => import('./claims-detail.component')
      .then(m => m.ClaimsDetailComponent)
  }
];
```

**Note**: Components load instantly on-demand when users navigate. Keep components focused for optimal performance.

## HTTP Communication

### Centralized API Service (COMMONIZED)

**⚠️ CRITICAL**: All API calls MUST go through centralized service for:
- Single point of control for future API changes
- Consistent error handling across the app
- Easy maintenance and compatibility updates
- Unified request/response transformation

```typescript
// core/services/api.service.ts (Base Service)
@Injectable({ providedIn: 'root' })
export class ApiService {
  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private notification: NotificationService
  ) {}

  // Generic HTTP methods
  get<T>(endpoint: string, params?: any): Observable<T> {
    return this.http.get<T>(`${this.apiUrl}${endpoint}`, { params })
      .pipe(
        catchError(this.handleError.bind(this)),
        tap(response => this.logRequest('GET', endpoint, response))
      );
  }

  post<T>(endpoint: string, data: any): Observable<T> {
    return this.http.post<T>(`${this.apiUrl}${endpoint}`, data)
      .pipe(
        catchError(this.handleError.bind(this)),
        tap(response => this.logRequest('POST', endpoint, response))
      );
  }

  put<T>(endpoint: string, data: any): Observable<T> {
    return this.http.put<T>(`${this.apiUrl}${endpoint}`, data)
      .pipe(catchError(this.handleError.bind(this)));
  }

  delete<T>(endpoint: string): Observable<T> {
    return this.http.delete<T>(`${this.apiUrl}${endpoint}`)
      .pipe(catchError(this.handleError.bind(this)));
  }
  
  patch<T>(endpoint: string, data: any): Observable<T> {
    return this.http.patch<T>(`${this.apiUrl}${endpoint}`, data)
      .pipe(catchError(this.handleError.bind(this)));
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An error occurred';
    if (error.error instanceof ErrorEvent) {
      errorMessage = error.error.message;
    } else {
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
    }
    this.notification.error(errorMessage);
    return throwError(() => error);
  }
  
  private logRequest(method: string, endpoint: string, response: any): void {
    if (!environment.production) {
      console.log(`[API ${method}] ${endpoint}`, response);
    }
  }
}
```

### Method-Based API Fetchers (COMMONIZED UTIL)

**Create reusable API fetcher utilities for common patterns:**

```typescript
// shared/utils/api-fetchers.util.ts
import { Observable } from 'rxjs';
import { ApiService } from '@core/services/api.service';

export class ApiFetchersUtil {
  
  /**
   * Fetch paginated data
   */
  static fetchPaginated<T>(
    apiService: ApiService,
    endpoint: string,
    page: number = 1,
    limit: number = 10,
    filters?: any
  ): Observable<{ data: T[], total: number, page: number }> {
    const params = { page, limit, ...filters };
    return apiService.get<any>(endpoint, params);
  }
  
  /**
   * Fetch with search
   */
  static fetchWithSearch<T>(
    apiService: ApiService,
    endpoint: string,
    searchTerm: string,
    searchField: string = 'search'
  ): Observable<T[]> {
    return apiService.get<T[]>(endpoint, { [searchField]: searchTerm });
  }
  
  /**
   * Fetch with filters
   */
  static fetchWithFilters<T>(
    apiService: ApiService,
    endpoint: string,
    filters: Record<string, any>
  ): Observable<T[]> {
    // Remove empty filters
    const cleanFilters = Object.entries(filters)
      .filter(([_, value]) => value !== null && value !== undefined && value !== '')
      .reduce((obj, [key, value]) => ({ ...obj, [key]: value }), {});
    
    return apiService.get<T[]>(endpoint, cleanFilters);
  }
  
  /**
   * Fetch by ID
   */
  static fetchById<T>(
    apiService: ApiService,
    endpoint: string,
    id: string | number
  ): Observable<T> {
    return apiService.get<T>(`${endpoint}/${id}`);
  }
  
  /**
   * Fetch with sorting
   */
  static fetchWithSort<T>(
    apiService: ApiService,
    endpoint: string,
    sortBy: string,
    sortOrder: 'asc' | 'desc' = 'asc'
  ): Observable<T[]> {
    return apiService.get<T[]>(endpoint, { sortBy, sortOrder });
  }
  
  /**
   * Batch fetch (multiple IDs)
   */
  static fetchBatch<T>(
    apiService: ApiService,
    endpoint: string,
    ids: (string | number)[]
  ): Observable<T[]> {
    return apiService.post<T[]>(`${endpoint}/batch`, { ids });
  }
}

// Usage in feature services
export class ClaimService {
  constructor(private api: ApiService) {}
  
  getClaims(page: number, filters: any): Observable<any> {
    return ApiFetchersUtil.fetchPaginated(
      this.api, 
      '/claims', 
      page, 
      10, 
      filters
    );
  }
  
  searchClaims(term: string): Observable<Claim[]> {
    return ApiFetchersUtil.fetchWithSearch(
      this.api,
      '/claims',
      term,
      'claimNumber'
    );
  }
  
  getClaimById(id: string): Observable<Claim> {
    return ApiFetchersUtil.fetchById(this.api, '/claims', id);
  }
}
```

### Filter Utility (COMMONIZED)

```typescript
// shared/utils/filter.util.ts
export class FilterUtil {
  /**
   * Build query string from filters
   */
  static buildQueryString(filters: Record<string, any>): string {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        params.append(key, String(value));
      }
    });
    return params.toString();
  }
  
  /**
   * Client-side filtering (for cached data)
   */
  static filterData<T>(
    data: T[],
    filters: Record<string, any>
  ): T[] {
    return data.filter(item => {
      return Object.entries(filters).every(([key, value]) => {
        if (!value) return true;
        const itemValue = (item as any)[key];
        
        if (typeof value === 'string') {
          return String(itemValue)
            .toLowerCase()
            .includes(value.toLowerCase());
        }
        
        return itemValue === value;
      });
    });
  }
  
  /**
   * Clear empty filters
   */
  static cleanFilters(filters: Record<string, any>): Record<string, any> {
    return Object.entries(filters)
      .filter(([_, value]) => value !== null && value !== undefined && value !== '')
      .reduce((obj, [key, value]) => ({ ...obj, [key]: value }), {});
  }
}
```

### Error Handling
- Global error interceptor for HTTP errors
- User-friendly error messages
- Logging for debugging
- Retry logic for failed requests
- Centralized error handling in ApiService

## Form Management

### Reactive Forms (Preferred)
- Use `FormBuilder` for complex forms
- Implement custom validators
- Handle async validation
- Provide real-time feedback

### Form Validation
- Required fields
- Pattern matching (email, phone, etc.)
- Custom business rules
- Cross-field validation
- Async validation (uniqueness checks)

## Styling Guidelines

### CSS Framework: Tailwind CSS

**Why Tailwind CSS**:
- Utility-first approach for rapid development
- Highly customizable with configuration file
- Built-in responsive design utilities
- Purge unused CSS for optimal bundle size
- Consistent design system with predefined spacing, colors, etc.
- Easy to maintain and scale

### Tailwind Configuration

**Installation**:
```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init
```

**tailwind.config.js** (CENTRALIZED CONFIGURATION):
```javascript
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        secondary: {
          // Define secondary colors
        },
      },
      // ⚠️ CENTRALIZED FONT CONFIGURATION - Change once, applies everywhere
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        serif: ['Georgia', 'serif'],
        mono: ['Menlo', 'Monaco', 'Courier New', 'monospace'],
        // Add custom fonts here - changes apply immediately to entire app
        display: ['Inter', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      // Centralized font sizes - modify once for app-wide effect
      fontSize: {
        'xs': '0.75rem',     // 12px
        'sm': '0.875rem',    // 14px
        'base': '1rem',      // 16px
        'lg': '1.125rem',    // 18px
        'xl': '1.25rem',     // 20px
        '2xl': '1.5rem',     // 24px
        '3xl': '1.875rem',   // 30px
        '4xl': '2.25rem',    // 36px
        '5xl': '3rem',       // 48px
      },
      spacing: {
        '128': '32rem',
        '144': '36rem',
      },
      borderRadius: {
        '4xl': '2rem',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}
```

### Centralized Font Management

**⚠️ CRITICAL**: Fonts MUST be managed centrally for instant app-wide updates.

**1. Import Fonts in index.html:**
```html
<!-- src/index.html -->
<head>
  <!-- Google Fonts - Change font here for entire app -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
</head>
```

**2. Define in styles.scss:**
```scss
// src/styles.scss - CENTRAL FONT CONFIGURATION

// Import fonts if using local files
// @font-face {
//   font-family: 'CustomFont';
//   src: url('./assets/fonts/CustomFont.woff2') format('woff2');
//   font-weight: 400;
//   font-style: normal;
// }

// Apply fonts globally via Tailwind
@tailwind base;
@tailwind components;
@tailwind utilities;

// Global font settings - CHANGE ONCE, APPLIES EVERYWHERE
@layer base {
  body {
    @apply font-body text-base;
    // To change app font, modify 'font-body' in tailwind.config.js
  }
  
  h1, h2, h3, h4, h5, h6 {
    @apply font-display;
    // To change heading font, modify 'font-display' in tailwind.config.js
  }
  
  code, pre {
    @apply font-mono;
  }
}
```

**3. Usage in Components:**
```html
<!-- Default font (automatically uses font-body from config) -->
<p class="text-base">Regular text</p>

<!-- Display font for headings -->
<h1 class="font-display text-4xl">Heading</h1>

<!-- To change fonts app-wide: Just update tailwind.config.js fontFamily -->
```

**Benefits of Centralized Font Management:**
- ✅ **One-time change**: Update `tailwind.config.js` → instant app-wide effect
- ✅ **Easy switching**: Change font vendor (Google Fonts to Adobe Fonts) in minutes
- ✅ **Version control**: Font changes tracked in config file
- ✅ **Consistency**: No scattered font declarations across components
- ✅ **Future-proof**: Easy to adapt to new design requirements

**styles.scss** (CENTRALIZED COMPONENT STYLES):
```scss
@tailwind base;
@tailwind components;
@tailwind utilities;

// Custom global styles - DEFINE ONCE, USE EVERYWHERE
@layer components {
  // Button styles
  .btn-primary {
    @apply bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200;
  }
  
  .btn-secondary {
    @apply bg-secondary-600 hover:bg-secondary-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200;
  }
  
  .btn-outline {
    @apply border-2 border-primary-600 text-primary-600 hover:bg-primary-50 font-semibold py-2 px-4 rounded-lg transition-colors duration-200;
  }
  
  // Card styles
  .card {
    @apply bg-white rounded-lg shadow-md p-6;
  }
  
  .card-hover {
    @apply bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-200 cursor-pointer;
  }
  
  // Form input styles (applies to all inputs app-wide)
  .form-input {
    @apply w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all;
  }
  
  .form-label {
    @apply block text-sm font-medium text-gray-700 mb-1;
  }
  
  .form-error {
    @apply text-sm text-red-600 mt-1;
  }
  
  // File upload styles (for commonized file upload component)
  .file-upload-container {
    @apply border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-500 transition-colors cursor-pointer;
  }
  
  .file-upload-active {
    @apply border-primary-500 bg-primary-50;
  }
  
  .file-preview {
    @apply relative rounded-lg overflow-hidden shadow-md;
  }
  
  .file-preview-image {
    @apply w-full h-48 object-cover;
  }
  
  // Filter toolbar styles (for dynamic filter component)
  .filter-toolbar {
    @apply flex flex-wrap gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200;
  }
  
  .filter-item {
    @apply flex flex-col gap-1;
  }
  
  .filter-item label {
    @apply text-sm font-medium text-gray-700;
  }
  
  .filter-item input,
  .filter-item select {
    @apply px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent;
  }
  
  // Search box styles (for universal search component)
  .search-box {
    @apply relative flex items-center;
  }
  
  .search-input {
    @apply w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent;
  }
  
  .search-icon {
    @apply absolute left-3 text-gray-400;
  }
  
  // Table styles (for data display)
  .data-table {
    @apply w-full border-collapse;
  }
  
  .data-table th {
    @apply bg-gray-50 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200;
  }
  
  .data-table td {
    @apply px-6 py-4 whitespace-nowrap border-b border-gray-200;
  }
  
  .data-table tr:hover {
    @apply bg-gray-50;
  }
  
  // Modal/Dialog styles
  .modal-overlay {
    @apply fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center;
  }
  
  .modal-content {
    @apply bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-screen overflow-y-auto;
  }
  
  .modal-header {
    @apply flex items-center justify-between p-6 border-b border-gray-200;
  }
  
  .modal-body {
    @apply p-6;
  }
  
  .modal-footer {
    @apply flex items-center justify-end gap-3 p-6 border-t border-gray-200;
  }
  
  // Alert/Notification styles
  .alert {
    @apply p-4 rounded-lg;
  }
  
  .alert-success {
    @apply bg-green-50 border border-green-200 text-green-800;
  }
  
  .alert-error {
    @apply bg-red-50 border border-red-200 text-red-800;
  }
  
  .alert-warning {
    @apply bg-yellow-50 border border-yellow-200 text-yellow-800;
  }
  
  .alert-info {
    @apply bg-blue-50 border border-blue-200 text-blue-800;
  }
  
  // Pagination styles
  .pagination {
    @apply flex items-center gap-2;
  }
  
  .pagination-item {
    @apply px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 cursor-pointer transition-colors;
  }
  
  .pagination-item-active {
    @apply bg-primary-600 text-white border-primary-600 hover:bg-primary-700;
  }
  
  .pagination-item-disabled {
    @apply opacity-50 cursor-not-allowed hover:bg-transparent;
  }
}

// Responsive utilities
@layer utilities {
  .sidebar-padding {
    @apply pl-0 lg:pl-64;
  }
  
  .header-padding {
    @apply pt-16;
  }
}
```

**Benefits of Centralized Component Styles:**
- ✅ **Consistency**: All components use same styling classes
- ✅ **Easy updates**: Change `.btn-primary` once → updates everywhere
- ✅ **Maintainable**: No scattered styles across components
- ✅ **Theme switching**: Easy to implement dark mode by changing colors in one place
- ✅ **Reusability**: Use same classes across all feature modules

### Layout Breakpoints
```javascript
// tailwind.config.js - Default breakpoints
// sm: '640px'  - Small devices
// md: '768px'  - Medium devices (tablets)
// lg: '1024px' - Large devices (desktops)
// xl: '1280px' - Extra large devices
// 2xl: '1536px' - 2X large devices

// Custom breakpoints can be added:
theme: {
  screens: {
    'mobile': '640px',
    'tablet': '768px',
    'desktop': '1024px',
    'wide': '1440px',
  },
  extend: {
    spacing: {
      'sidebar-full': '250px',
      'sidebar-collapsed': '60px',
      'header': '64px',
    },
  },
}
```

### Component Styling with Tailwind

**Header Component Example**:
```html
<header class="fixed top-0 left-0 right-0 h-16 bg-white shadow-md z-50">
  <div class="flex items-center justify-between h-full px-4">
    <!-- Left side -->
    <div class="flex items-center space-x-4">
      <button class="lg:hidden p-2 hover:bg-gray-100 rounded-md" (click)="onMenuToggle()">
        <i class="icon-menu text-gray-600"></i>
      </button>
      <div class="flex items-center space-x-2">
        <img src="assets/images/logo.png" alt="Logo" class="h-8 w-8">
        <span class="text-xl font-bold text-gray-800">CCMS</span>
      </div>
    </div>

    <!-- Right side -->
    <div class="flex items-center space-x-4">
      <!-- Role Selector -->
      <select 
        class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        [value]="(selectedRole$ | async)"
        (change)="onRoleSelect($event.target.value)">
        <option *ngFor="let role of (availableRoles$ | async)" [value]="role.roleId">
          {{ role.roleDisplayName }}
        </option>
      </select>

      <!-- Notifications -->
      <button class="relative p-2 hover:bg-gray-100 rounded-full">
        <i class="icon-notifications text-gray-600"></i>
        <span class="absolute top-1 right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">3</span>
      </button>

      <!-- User Menu -->
      <div class="flex items-center space-x-2 cursor-pointer hover:bg-gray-100 p-2 rounded-lg">
        <img [src]="(currentUser$ | async)?.avatar" alt="User" class="h-8 w-8 rounded-full">
        <span class="text-gray-700">{{ (currentUser$ | async)?.name }}</span>
      </div>
    </div>
  </div>
</header>
```

**Sidebar Component Example**:
```html
<div class="sidebar-wrapper" [class.open]="isOpen">
  <!-- Backdrop -->
  <div 
    *ngIf="isOpen" 
    class="fixed inset-0 bg-black bg-opacity-50 lg:hidden z-40"
    (click)="onBackdropClick()">
  </div>

  <!-- Sidebar -->
  <aside 
    class="fixed top-16 left-0 bottom-0 bg-white shadow-lg transform transition-transform duration-300 z-40"
    [ngClass]="{
      'w-64': !isCollapsed,
      'w-16': isCollapsed,
      'translate-x-0': isOpen,
      '-translate-x-full lg:translate-x-0': !isOpen
    }">
    <nav class="mt-4 px-2">
      <app-menu-item 
        *ngFor="let item of menuItems"
        [menuItem]="item"
        [isCollapsed]="isCollapsed"
        [isActive]="isActive(item)"
        class="block mb-1">
      </app-menu-item>
    </nav>
  </aside>
</div>
```

### Styling Approach
- **Primary**: Tailwind CSS utility classes for all styling
- **Component-specific styles**: Use Tailwind's `@apply` directive in component SCSS files when needed
- **Custom components**: Define reusable component classes in global styles using `@layer components`
- **Responsive design**: Mobile-first approach using Tailwind's responsive modifiers (`sm:`, `md:`, `lg:`, etc.)
- **Theme customization**: Extend Tailwind's default theme in `tailwind.config.js`
- **Dark mode**: Use Tailwind's dark mode feature (`dark:` modifier)
- **Consistent spacing**: Use Tailwind's spacing scale (p-4, m-2, etc.)
- **Color system**: Define custom color palette in Tailwind config

### Tailwind Utility Examples
```html
<!-- Button examples -->
<button class="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200">
  Primary Button
</button>

<!-- Card example -->
<div class="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
  <h3 class="text-xl font-bold text-gray-800 mb-2">Card Title</h3>
  <p class="text-gray-600">Card content goes here</p>
</div>

<!-- Form input example -->
<input 
  type="text" 
  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
  placeholder="Enter text">

<!-- Responsive grid example -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <!-- Grid items -->
</div>
```

## Responsive Design Strategy

### Overview
The application MUST be fully responsive and accessible on all device types:
- **Mobile phones** (320px - 767px)
- **Tablets** (768px - 1023px)
- **Laptops/Desktops** (1024px - 1439px)
- **Large Screens** (1440px+)

### Mobile-First Approach
Design and develop starting with mobile layout, then progressively enhance for larger screens using Tailwind's responsive prefixes.

### Viewport Configuration

**index.html - Meta Tags**:
```html
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes">
  <meta name="mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="default">
  <!-- Other meta tags -->
</head>
```

### Device-Specific Layouts

#### Mobile Phones (< 768px)
**Layout Characteristics**:
- Single column layout
- Hamburger menu (sidebar as full-screen overlay)
- Stacked form fields
- Touch-friendly buttons (min 44x44px tap targets)
- Simplified navigation
- Hide non-essential information
- Bottom navigation bar (optional)

**Implementation**:
```html
<!-- Mobile-optimized content -->
<div class="block md:hidden">
  <!-- Mobile-only content -->
</div>

<!-- Hidden on mobile -->
<div class="hidden md:block">
  <!-- Desktop content -->
</div>

<!-- Touch-friendly buttons -->
<button class="w-full py-3 px-4 text-base min-h-[44px] active:scale-95 transition-transform">
  Mobile Action
</button>
```

#### Tablets (768px - 1023px)
**Layout Characteristics**:
- Two-column layouts where appropriate
- Overlay sidebar with backdrop
- Larger touch targets
- Adaptive forms (2 columns for related fields)
- Show more context than mobile

**Implementation**:
```html
<!-- Tablet-specific layout -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <!-- Responsive grid items -->
</div>

<!-- Sidebar overlay for tablet -->
<aside class="fixed inset-y-0 left-0 w-64 transform md:translate-x-0 -translate-x-full transition-transform lg:static">
  <!-- Sidebar content -->
</aside>
```

#### Desktop/Laptop (1024px+)
**Layout Characteristics**:
- Multi-column layouts
- Fixed sidebar navigation
- Hover states for interactive elements
- Keyboard shortcuts
- More information density
- Split views and side panels

**Implementation**:
```html
<!-- Desktop layout with fixed sidebar -->
<div class="flex">
  <aside class="hidden lg:block w-64 fixed h-screen">
    <!-- Fixed sidebar -->
  </aside>
  <main class="flex-1 lg:ml-64">
    <!-- Main content -->
  </main>
</div>
```

### Responsive Component Patterns

#### Responsive Tables
```html
<!-- Desktop: Traditional table -->
<div class="hidden md:block overflow-x-auto">
  <table class="min-w-full">
    <!-- Table content -->
  </table>
</div>

<!-- Mobile: Card-based layout -->
<div class="block md:hidden space-y-4">
  <div class="bg-white rounded-lg shadow p-4" *ngFor="let item of items">
    <div class="font-semibold">{{ item.name }}</div>
    <div class="text-sm text-gray-600">{{ item.details }}</div>
  </div>
</div>
```

#### Responsive Forms
```html
<form class="space-y-4">
  <!-- Single column on mobile, two columns on desktop -->
  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div>
      <label class="block text-sm font-medium mb-1">First Name</label>
      <input type="text" class="w-full px-4 py-2 border rounded-lg">
    </div>
    <div>
      <label class="block text-sm font-medium mb-1">Last Name</label>
      <input type="text" class="w-full px-4 py-2 border rounded-lg">
    </div>
  </div>
  
  <!-- Full width on all devices -->
  <div>
    <label class="block text-sm font-medium mb-1">Email</label>
    <input type="email" class="w-full px-4 py-2 border rounded-lg">
  </div>
  
  <!-- Responsive button group -->
  <div class="flex flex-col sm:flex-row gap-2 sm:gap-4">
    <button class="w-full sm:w-auto px-6 py-2 bg-primary-600 text-white rounded-lg">Submit</button>
    <button class="w-full sm:w-auto px-6 py-2 border border-gray-300 rounded-lg">Cancel</button>
  </div>
</form>
```

#### Responsive Navigation
```html
<nav>
  <!-- Mobile: Bottom nav or hamburger menu -->
  <div class="lg:hidden fixed bottom-0 inset-x-0 bg-white border-t">
    <div class="flex justify-around py-2">
      <a class="flex flex-col items-center" routerLink="/dashboard">
        <i class="icon-dashboard"></i>
        <span class="text-xs">Dashboard</span>
      </a>
      <!-- More nav items -->
    </div>
  </div>
  
  <!-- Desktop: Sidebar navigation -->
  <div class="hidden lg:block">
    <!-- Sidebar menu items -->
  </div>
</nav>
```

#### Responsive Typography
```html
<!-- Responsive headings -->
<h1 class="text-2xl md:text-3xl lg:text-4xl font-bold">Page Title</h1>
<h2 class="text-xl md:text-2xl lg:text-3xl font-semibold">Section Title</h2>
<p class="text-sm md:text-base lg:text-lg">Body text content</p>

<!-- Responsive spacing -->
<div class="p-4 md:p-6 lg:p-8">
  <!-- Content with responsive padding -->
</div>
```

### Touch & Mouse Interaction

**Touch-Friendly Guidelines**:
- Minimum tap target size: 44x44px (Apple) / 48x48px (Material Design)
- Adequate spacing between interactive elements
- Swipe gestures for mobile navigation
- Avoid hover-only interactions
- Provide visual feedback on touch (active states)

**Implementation**:
```html
<!-- Touch-friendly button -->
<button class="min-w-[44px] min-h-[44px] p-3 active:bg-gray-100 transition-colors">
  Action
</button>

<!-- Spacious mobile menu items -->
<a class="block py-4 px-6 border-b hover:bg-gray-50 active:bg-gray-100">
  Menu Item
</a>
```

### Image & Media Responsiveness

```html
<!-- Responsive images -->
<img 
  src="image.jpg" 
  alt="Description"
  class="w-full h-auto object-cover"
  loading="lazy">

<!-- Responsive background images -->
<div class="bg-cover bg-center h-48 md:h-64 lg:h-96" 
     [style.backgroundImage]="'url(' + imageUrl + ')'">
</div>

<!-- Responsive video container -->
<div class="relative pb-[56.25%] h-0 overflow-hidden">
  <iframe class="absolute top-0 left-0 w-full h-full"></iframe>
</div>
```

### Responsive Testing Checklist

**Breakpoints to Test**:
- [ ] 320px (iPhone SE)
- [ ] 375px (iPhone X/11/12)
- [ ] 414px (iPhone Pro Max)
- [ ] 768px (iPad Portrait)
- [ ] 1024px (iPad Landscape / Laptop)
- [ ] 1366px (Laptop)
- [ ] 1920px (Desktop)

**Device Testing**:
- [ ] iOS Safari (iPhone & iPad)
- [ ] Android Chrome (Phone & Tablet)
- [ ] Desktop Chrome
- [ ] Desktop Firefox
- [ ] Desktop Safari
- [ ] Desktop Edge

**Features to Test**:
- [ ] Navigation menu (hamburger/sidebar behavior)
- [ ] Forms (input fields, dropdowns, buttons)
- [ ] Tables and data grids
- [ ] Modals and dialogs
- [ ] Images and media
- [ ] Touch interactions
- [ ] Orientation changes (portrait/landscape)
- [ ] Scrolling behavior
- [ ] Font sizes and readability

### Performance for Mobile Devices

**Optimization Strategies**:
```typescript
// Lazy load images
<img loading="lazy" src="image.jpg" alt="Description">

// Detect device type
export class DeviceDetectorService {
  isMobile(): boolean {
    return window.innerWidth < 768;
  }
  
  isTablet(): boolean {
    return window.innerWidth >= 768 && window.innerWidth < 1024;
  }
  
  isDesktop(): boolean {
    return window.innerWidth >= 1024;
  }
}

// Conditional loading for mobile
if (this.deviceDetector.isMobile()) {
  // Load mobile-optimized assets
} else {
  // Load full assets
}
```

### Accessibility on All Devices

- **Keyboard Navigation**: Ensure all functionality accessible via keyboard (desktop)
- **Touch Navigation**: Large touch targets, no hover-only features (mobile/tablet)
- **Screen Readers**: ARIA labels and semantic HTML work on all devices
- **Zoom**: Support pinch-to-zoom on mobile (don't use maximum-scale=1)
- **Focus Management**: Visible focus indicators for keyboard users

### Common Responsive Utilities

```html
<!-- Show/Hide by device -->
<div class="block md:hidden">Mobile Only</div>
<div class="hidden md:block lg:hidden">Tablet Only</div>
<div class="hidden lg:block">Desktop Only</div>

<!-- Responsive flex direction -->
<div class="flex flex-col md:flex-row gap-4">
  <!-- Stack on mobile, row on desktop -->
</div>

<!-- Responsive grid columns -->
<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
  <!-- 1 column mobile, 2 tablet, 3 small desktop, 4 large desktop -->
</div>

<!-- Responsive spacing -->
<div class="px-4 md:px-6 lg:px-8 py-4 md:py-6">
  <!-- Smaller padding on mobile -->
</div>

<!-- Responsive text alignment -->
<div class="text-center md:text-left">
  <!-- Center on mobile, left on desktop -->
</div>
```

## Authentication & Authorization

### Authentication Flow
1. User provides credentials
2. Frontend sends to backend API
3. Backend validates and returns JWT token
4. Frontend stores token (localStorage/sessionStorage)
5. Token included in subsequent requests via interceptor
6. Token refresh mechanism for expired tokens

### Authorization
- Role-based access control (RBAC)
- Route-level protection
- Component-level conditional rendering
- API-level permission checks

## Performance Optimization

### Strategies
1. **Lazy Loading**: Load feature modules on demand
2. **OnPush Change Detection**: Reduce change detection cycles
3. **TrackBy**: Optimize ngFor rendering
4. **Debouncing**: Delay API calls for user input
5. **Caching**: Cache API responses where appropriate
6. **Code Splitting**: Separate vendor and app bundles
7. **AOT Compilation**: Ahead-of-time compilation for production
8. **Tree Shaking**: Remove unused code
9. **Image Optimization**: Use lazy loading, WebP format, responsive images
10. **Bundle Size**: Monitor and optimize bundle size (aim for < 500KB initial)
11. **Mobile Performance**: Reduce animations, optimize assets for slower networks
12. **Service Worker**: Implement PWA features for offline capability (optional)

## Environment Configuration

### Environment Files
```typescript
// environment.ts (Development)
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  tokenKey: 'auth_token'
};

// environment.prod.ts (Production)
export const environment = {
  production: true,
  apiUrl: 'https://api.yourdomain.com/api',
  tokenKey: 'auth_token'
};
```

## Testing Strategy

### Unit Tests
- Test components, services, pipes, and directives
- Use Jasmine and Karma
- Mock dependencies
- Test user interactions
- Aim for 80%+ code coverage

### E2E Tests
- Use Protractor or Cypress
- Test critical user journeys
- Test cross-browser compatibility
- **Responsive Testing**: Test on multiple viewport sizes
- **Touch Interaction Testing**: Simulate touch events on mobile
- **Device-Specific Testing**: Test on real devices when possible

## Build & Deployment

### Development Build
```bash
ng serve
```

### Production Build
```bash
ng build --configuration production
```

### Build Optimization
- Enable production mode
- Minification and uglification
- Source map generation (optional)
- Service worker for PWA (optional)

## Security Considerations

1. **XSS Prevention**: Angular's built-in sanitization
2. **CSRF Protection**: Token-based authentication
3. **Secure Storage**: Avoid storing sensitive data in localStorage
4. **HTTPS**: Always use HTTPS in production
5. **Content Security Policy**: Configure CSP headers
6. **Input Validation**: Client-side and server-side validation
7. **Dependency Scanning**: Regular security audits

## Browser & Device Support

### Supported Browsers
- **Chrome**: Latest 2 versions (Desktop & Mobile)
- **Firefox**: Latest 2 versions (Desktop & Mobile)
- **Safari**: Latest 2 versions (Desktop & iOS)
- **Edge**: Latest 2 versions (Desktop)
- **Samsung Internet**: Latest version (Mobile)

### Supported Devices
- **Mobile Phones**: iOS 12+, Android 8+
- **Tablets**: iPad, Android tablets
- **Desktop/Laptop**: Windows 10+, macOS 10.14+, Linux

### Screen Sizes
- **Minimum Width**: 320px (iPhone SE)
- **Maximum Width**: 4K displays (3840px)
- **Optimal Range**: 375px - 1920px

### Testing Requirements
- Test on real devices when possible
- Use browser DevTools device emulation
- Test both portrait and landscape orientations
- Verify touch and mouse interactions
- Check performance on low-end devices

## Coding Standards

**See**: [coding-standards.md](coding-standards.md) for comprehensive coding standards covering:
- TypeScript and JavaScript standards
- Angular component and service patterns
- HTML/Template best practices
- CSS/SCSS conventions with Tailwind
- Node.js and Express backend standards
- Testing standards
- Git workflow and commit conventions
- Security best practices
- Performance optimization guidelines
- Code review checklist

**Quick Reference**:

### Naming Conventions
- **Components**: PascalCase with suffix (e.g., `UserListComponent`)
- **Services**: PascalCase with suffix (e.g., `AuthService`)
- **Interfaces**: PascalCase (e.g., `User` or `IUser`)
- **Constants**: UPPER_SNAKE_CASE
- **Variables/Functions**: camelCase
- **Files**: kebab-case

### TypeScript Guidelines
- Use strict mode
- Define interfaces for all data structures
- Use enums for constant values
- Avoid `any` type
- Use async/await for promises
- Follow Angular style guide

### Component Organization
- One component/service per file
- Keep files under 400 lines
- Extract reusable logic into services
- Use barrel exports (index.ts) for modules
- Use OnPush change detection where possible
- Unsubscribe from observables in ngOnDestroy

## Accessibility (a11y)

### Core Accessibility Principles
- Use semantic HTML elements
- Provide ARIA labels and roles where needed
- Keyboard navigation support (desktop)
- Screen reader compatibility (all devices)
- Color contrast compliance (WCAG 2.1 AA minimum)
- Focus management and visible focus indicators

### Device-Specific Accessibility
- **Mobile/Tablet**: 
  - Touch targets minimum 44x44px
  - Support pinch-to-zoom
  - Screen reader gestures (VoiceOver, TalkBack)
  - Avoid hover-only interactions
- **Desktop**: 
  - Full keyboard navigation
  - Keyboard shortcuts
  - Skip navigation links
  - Focus visible on all interactive elements

### Testing Tools
- Lighthouse (Chrome DevTools)
- axe DevTools
- WAVE (Web Accessibility Evaluation Tool)
- Screen reader testing (NVDA, JAWS, VoiceOver)

## Documentation

### Code Documentation
- JSDoc comments for public APIs
- README for each feature module
- Component usage examples
- Inline comments for complex logic

### User Documentation
- User guides
- API documentation
- Change logs
- Known issues

## Version Control

### Git Workflow
- Feature branches
- Pull request reviews
- Commit message conventions
- Semantic versioning

## Dependencies Management

### Core Dependencies
- @angular/core
- @angular/common
- @angular/forms
- @angular/router
- @angular/platform-browser
- rxjs

### Recommended Additional Libraries
- **Tailwind CSS** (Primary CSS framework)
- **@tailwindcss/forms** (Better form styling)
- **@tailwindcss/typography** (Rich text styling)
- Angular Material or PrimeNG (Optional: for complex components like date pickers)
- ngx-translate (Internationalization)
- chart.js or ng2-charts (Charts)
- date-fns (Date manipulation)
- lodash (Utility functions)
- heroicons or material-icons (Icon library compatible with Tailwind)

## Next Steps

1. Initialize Angular project with Angular CLI
2. Set up project structure as per architecture
3. Configure environments
4. **Create roles-menu.json configuration file** in `assets/config/`
5. Implement core module and services (including RoleService and SidebarService)
6. Create layout components (header with role selector, sidebar, footer)
7. Create shared components (all responsive with Tailwind)
8. Develop feature modules
9. Implement routing and guards
10. Add authentication flow
11. **Implement role-based navigation** (role selector dropdown and dynamic menu)
12. **Test responsive design** on all breakpoints (mobile/tablet/desktop)
13. Integrate with backend API
14. Implement testing (unit, E2E, responsive)
15. **Cross-device testing** (iOS, Android, Desktop browsers)
16. Optimize and deploy

---

## 📚 Architecture Summary & Best Practices

### Commonization Checklist ✅

Before creating any new component, service, or utility, ask:

1. **Will this be used in multiple places?**
   - ✅ YES → Create in `shared/` module
   - ❌ NO → Create in feature module

2. **Is this file/image upload?**
   - ✅ Use `<app-file-upload>` or `<app-image-selector>` components

3. **Is this search or filtering?**
   - ✅ Use `<app-search-box>` or `<app-dynamic-filter>` components
   - ✅ Use `ApiFetchersUtil.fetchWithSearch()` or `fetchWithFilters()`

4. **Is this an API call?**
   - ✅ Use centralized `ApiService` methods
   - ✅ Use `ApiFetchersUtil` for common patterns (pagination, search, filters)

5. **Does this need custom styling?**
   - ✅ Add to `styles.scss` @layer components for reusability
   - ❌ Don't create component-specific styles for common patterns

6. **Does this involve fonts or typography?**
   - ✅ Update in `tailwind.config.js` fontFamily section
   - ❌ Never define fonts in individual components

### Key Architecture Benefits

#### 🎯 Single Source of Truth
- **Fonts**: Change in `tailwind.config.js` → instant app-wide update
- **Colors**: Change in `tailwind.config.js` theme → instant theme update
- **API Logic**: Change in `ApiService` → all API calls updated
- **Filters**: Change in `DynamicFilterComponent` → all filters updated across features

#### 🚀 Future-Proof Design
- **Easy vendor switching**: Change Google Fonts to Adobe Fonts in one place
- **API migration**: Update base URL or auth logic in one service
- **UI redesign**: Update component styles in central `styles.scss`
- **Filter logic changes**: Update once in shared components

#### 🔧 Better Maintainability
- **Bug fixes**: Fix in shared component → fixes everywhere automatically
- **Feature updates**: Add to shared util → available to all features
- **Compatibility updates**: Update centralized service → entire app compatible

#### ⚡ Developer Efficiency
- **Don't repeat yourself**: Use existing shared components
- **Consistent behavior**: All file uploads work the same way
- **Faster development**: Reuse filters, search, pagination components
- **Easy onboarding**: New developers find utilities in predictable locations

### File Organization Quick Reference

```
✅ DO:
- Put reusable UI in shared/components/
- Put reusable logic in shared/utils/
- Put API calls in core/services/
- Put styles in styles.scss @layer components
- Configure fonts in tailwind.config.js

❌ DON'T:
- Duplicate file upload logic across features
- Create feature-specific filters that could be generic
- Define fonts in component SCSS files
- Make direct HTTP calls without using ApiService
- Create duplicate API fetcher patterns
```

### Maintenance Workflow

**When you need to:**

| Task | Location | Effect |
|------|----------|--------|
| Change app font | `tailwind.config.js` fontFamily | Entire app updates |
| Update button styles | `styles.scss` @layer components | All buttons update |
| Fix file upload bug | `shared/components/file-upload/` | All uploads fixed |
| Change API base URL | `environment.ts` apiUrl | All API calls updated |
| Add filter option | `shared/components/dynamic-filter/` | Available everywhere |
| Update search logic | `shared/components/search-box/` | All searches updated |
| Change error handling | `core/services/api.service.ts` | All API errors handled consistently |

---

**This architecture ensures that CCMS remains maintainable, scalable, and easy to update as requirements evolve.**
