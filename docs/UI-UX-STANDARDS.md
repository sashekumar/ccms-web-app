# UI/UX Standards & Custom Components Guide

> **Document Version:** 1.2  
> **Last Updated:** 27 March 2026  
> **Scope:** CCMS Web Application (Angular 17+ Standalone Components)

---

## Table of Contents

1. [Core Principles](#core-principles)
2. [Design System](#design-system)
3. [Custom Components Inventory](#custom-components-inventory)
4. [Spacing & Layout Standards](#spacing--layout-standards)
5. [Form Standards](#form-standards)
6. [Data Table Standards](#data-table-standards)
7. [Dialog & Modal Standards](#dialog--modal-standards)
8. [Notification Standards](#notification-standards)
9. [Permission & Authorization](#permission--authorization)
10. [Component Integration Examples](#component-integration-examples)
11. [Checklist for Module Conversion](#checklist-for-module-conversion)

---

## Core Principles

### 1. **Tailwind CSS Only**
- All styling must use **Tailwind CSS classes exclusively**
- **NO manual CSS** files (.scss, .css) for spacing, colors, or layout
- Exception: Component-specific styles in separate `.scss` files are allowed for complex animations or pseudo-elements only, NOT for spacing/layout
- Use Tailwind's utility classes for all responsive design

### 2. **Standalone Components**
- All components must be **standalone** (`standalone: true`)
- Import dependencies directly in component's `imports: []` array
- No NgModule usage

### 3. **No Hardcoded Alerts**
- No inline `<app-alert>` components in templates
- All notifications must go through **ToastService** exclusively
- Confirmation flows use `ConfirmDialogComponent` (not alerts)

### 4. **Permission-Driven UI**
- All sensitive actions require permission checks via `*hasPermission` directive
- Hide buttons/features if user lacks permission (don't disable)
- Never allow backend call if permission not granted

### 5. **Consistent Spacing & Hierarchy**
- Follow established spacing scale (see Spacing Standards section)
- Maintain visual hierarchy through consistent margin/padding
- Group related elements with whitespace

---

## Design System

### Colors

| Usage | Tailwind Class | Hex | Purpose |
|-------|---|---|---|
| Primary CTA | `bg-[#1e3c72]` / `hover:bg-[#2a5298]` | #1e3c72 | Main action buttons |
| Success | `bg-green-100` / `text-green-800` | — | Success states, badges |
| Danger | `bg-red-100` / `text-red-600` | — | Destructive actions |
| Warning | `bg-orange-100` / `text-orange-600` | — | Warnings, expiration alerts |
| Info | `bg-blue-50` / `text-blue-700` | — | Helpful messages |
| Neutral | `bg-gray-*` / `text-gray-*` | — | Disabled, inactive states |

### Typography

| Element | Class | Usage |
|---------|-------|-------|
| Page Title | `text-3xl font-bold text-gray-900` | Section headers |
| Card Title | `text-xl font-semibold text-gray-900` | Card headers |
| Form Label | `text-sm font-medium text-gray-700` | Form field labels |
| Body Text | `text-sm text-gray-700` | Standard text |
| Hint/Helper | `text-xs text-gray-500` | Form hints, secondary info |
| Error | `text-xs text-red-600` | Error messages |

### Border & Shadow

| Element | Class | Usage |
|---------|-------|-------|
| Input Border | `border border-gray-300` | Form inputs, dropdowns |
| Card Shadow | `shadow` or `shadow-lg` | Card elevation |
| Focus Ring | `focus:ring-2 focus:ring-primary-200` | Form focus states |

---

## Custom Components Inventory

### 1. **DataTableComponent**

**Location:** `frontend/src/app/shared/components/ui/data-table/`

**Purpose:** Display tabular data with built-in filtering, sorting, pagination, and row-level actions

**Key Interfaces:**
```typescript
interface DataTableColumn {
  key: string;
  label: string;
  type?: 'text' | 'badge' | 'toggle' | 'status' | 'avatar' | 'date' | 'number' | 'currency' | 'tags';
  sortable?: boolean;
  badgeMap?: Record<any, { label: string; color: BadgeColor }>;
  avatarSubKey?: string;
  format?: string; // for date/number formatting
}

interface DataTableAction {
  id: string;
  title: string;
  iconPath: string; // SVG path d attribute only (NOT full <path> element)
  color: 'blue' | 'indigo' | 'red' | 'purple' | 'green' | 'gray' | 'yellow';
  permission?: string; // e.g., 'USER_MANAGEMENT.UPDATE' (optional)
}

interface DataTablePagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
```

**Usage:**
```html
<app-data-table
  [rows]="dataList"
  [columns]="columnConfig"
  [rowActions]="actionButtons"
  [pagination]="paginationState"
  [loading]="isLoading"
  (rowAction)="onActionClick($event)"
  (filterChange)="onFilterChange($event)"
  (cellToggle)="onCellToggle($event)"
></app-data-table>
```

**Component Requirements:**
- Must import `HasPermissionDirective` if using action permissions
- Each action in `rowActions` must include `permission` field for security
- Implement handlers: `onActionClick()`, `onFilterChange()`, `onCellToggle()`

---

### 2. **ToggleComponent**

**Location:** `frontend/src/app/shared/components/ui/toggle/`

**Purpose:** Chip-style binary toggle for active/inactive states. Used in data tables and standalone forms.

**Key Inputs:**
- `isActive` (boolean): Current toggle state (default: `false`)
- `loading` (boolean): Shows spinner, disables interaction while `true` (default: `false`)
- `disabled` (boolean): Prevents toggle interaction when `true` (default: `false`)

**Key Outputs:**
- `(toggle)`: Emits the new boolean value when the user clicks

**Visual Design:**
- **Active State:** `bg-green-100 text-green-800` — green dot on right
- **Inactive State:** `bg-gray-100 text-gray-800` — gray dot on left
- **Fixed Size:** 44px wide × 24px tall (do NOT attempt to resize via classes)

**Usage in DataTable (recommended):**
```typescript
// Declare column as toggle type
columns: DataTableColumn[] = [
  { key: 'is_active', label: 'Status', type: 'toggle' }
];

// Handle toggle in parent
onCellToggle(event: any): void {
  const row = event.row;           // Full row object
  const newValue = event.newValue; // Boolean — the new desired state
  // Always show a confirmation dialog before saving
  this.pendingToggle = { row, newValue };
  this.showToggleConfirm = true;
}
```

**Standalone Usage:**
```html
<app-toggle
  [isActive]="record.is_active"
  [loading]="isSaving"
  [disabled]="!canEdit"
  (toggle)="onStatusToggle($event)"
></app-toggle>
```

#### **🤖 AI Agent Decision Rule: When to Use Toggle vs Badge**

This rule applies when an AI agent is generating a DataTable column configuration. **Choose based on whether the column value is actionable (user can change it):**

| Column Type | Example Properties | Column Type to Use | Reason |
|---|---|---|---|
| **Boolean status — user can toggle** | `is_active`, `is_enabled`, `is_deleted`, `is_verified`, `is_approved` | **`'toggle'`** | User needs to change the state; interactive control required |
| **Boolean type/category — read-only** | `is_system_role`, `is_premium_user`, `is_external_system` | **`'badge'`** | Describes what the thing IS, not changeable in this context |
| **Categorical status** | `claim_status`, `request_state`, `payment_method` | **`'status'` or `'badge'`** | Use `'status'` if predefined system codes; `'badge'` if generic labels |
| **Multi-value flags** | `permissions`, `tags`, `features` | **`'tags'`** | Array of items, not a single state |

**Key Rule for AI Agents:**
- **If the boolean column name contains "active", "enabled", "disabled", or "status"** AND it represents something the user can change in that table → **Use `type: 'toggle'`**
- **If the boolean column is a property descriptor** (e.g., `is_system_role`, `is_internal`) → **Use `type: 'badge'`**

**Example: CORRECT Toggle Implementation**
```typescript
columns: DataTableColumn[] = [
  { key: 'role_name', label: 'Role Name', sortable: true },
  { key: 'is_active', label: 'Status', type: 'toggle' }  // ✅ Boolean action column
];

onCellToggle(event: { row: Role; column: DataTableColumn; newValue: boolean }): void {
  this.pendingToggle = event;
  this.showToggleConfirm = true;  // 🔒 Always require confirmation for state changes
}
```

**Example: WRONG (as badge, should be toggle)**
```typescript
// ❌ INCORRECT — is_active should use toggle, not badge
columns: DataTableColumn[] = [
  { 
    key: 'is_active', 
    label: 'Status', 
    type: 'badge',  // WRONG
    badgeMap: { true: { label: 'Active', color: 'green' }, ... }
  }
];
```

---

### 3. **DropdownComponent**

**Location:** `frontend/src/app/shared/components/ui/dropdown/`

**Purpose:** Searchable select dropdown with auto-search for >10 options

**Interface:**
```typescript
interface DropdownOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}
```

**Usage:**
```html
<app-dropdown
  [(ngModel)]="selectedValue"
  label="Select Option"
  placeholder="-- Choose one --"
  [options]="optionsList"
  [searchThreshold]="10"
  [clearable]="true"
  [required]="true"
  [disabled]="isLoading"
  [error]="validationError"
  hint="Select a valid option"
></app-dropdown>
```

**Key Points:**
- Do NOT include placeholder as an option in the `options` array—use the `placeholder` input
- Auto-shows search box when options exceed `searchThreshold` (default: 10)
- Supports `ngModel` and reactive forms via `ControlValueAccessor`

---

### 4. **ConfirmDialogComponent**

**Location:** `frontend/src/app/shared/components/ui/confirm-dialog/`

**Purpose:** Modal confirmation for destructive actions

**Variants:** `'danger'` | `'warn'` | `'primary'`

**Usage:**
```html
<!-- Delete Confirmation -->
<app-confirm-dialog
  [isOpen]="showDeleteConfirm"
  title="Delete Item"
  message="Are you sure you want to delete this? This action cannot be undone."
  variant="danger"
  confirmLabel="Delete"
  cancelLabel="Cancel"
  (confirmed)="onConfirmDelete()"
  (cancelled)="onCancelDelete()"
></app-confirm-dialog>

<!-- Status Change Confirmation -->
<app-confirm-dialog
  [isOpen]="showStatusConfirm"
  [title]="'Deactivate User?' | titlecase"
  [message]="'User ' + userName + ' will be disabled from login.'"
  [variant]="isActivating ? 'primary' : 'warn'"
  (confirmed)="onConfirmStatusChange()"
  (cancelled)="cancelStatusChange()"
></app-confirm-dialog>
```

**Important:** Always set `[isOpen]` to `false` in both success and error handlers to close the dialog.

---

### 5. **TextInputComponent**

**Location:** `frontend/src/app/shared/components/ui/text-input/`

**Purpose:** Reusable form input field for text, email, password, etc.

**Usage:**
```html
<app-text-input
  formControlName="email"
  label="Email Address"
  placeholder="user@example.com"
  inputType="email"
  [error]="getFieldError('email')"
  [required]="true"
  [disabled]="isLoading"
  [maxLength]="120"
  hint="We'll never share your email"
></app-text-input>
```

**Standard Height:** `h-[36px]` (36 pixels)

---

### 6. **ButtonComponent**

**Location:** `frontend/src/app/shared/components/ui/button/`

**Purpose:** Reusable button with variants, sizes, icon support, and loading state

**Variants:**
- `'primary'` — Brand navy gradient (main CTAs)
- `'secondary'` — Neutral secondary action
- `'success'` — Green (approve/confirm actions)
- `'warn'` — Amber (caution actions)
- `'danger'` — Red (destructive actions)
- `'ghost'` — Transparent with hover background
- `'outline'` — Bordered, no fill
- `'custom'` — Use `customBg`, `customTextColor`, `customClass` inputs

**Sizes:** `'xs'` | `'sm'` | `'md'` | `'lg'` | `'xl'`

**Key Inputs:**
- `variant` (string): Visual style (default: `'primary'`)
- `size` (string): Button dimensions (default: `'md'`)
- `loading` (boolean): Shows spinner, disables button
- `disabled` (boolean): Disables button
- `iconLeft` (string): Font Awesome class left of label (e.g. `'fas fa-save'`)
- `iconRight` (string): Font Awesome class right of label
- `type` (string): `'button'` | `'submit'` | `'reset'` (default: `'button'`)

**Usage:**
```html
<!-- Primary CTA -->
<app-button variant="primary" size="md" [loading]="isSaving" type="submit" iconLeft="fas fa-save">
  Save Changes
</app-button>

<!-- Destructive action -->
<app-button variant="danger" size="sm" (click)="onDelete()">
  Delete
</app-button>

<!-- Cancel / Secondary -->
<app-button variant="outline" type="button" (click)="goBack()">
  Cancel
</app-button>
```

**Important:** Never apply margin/spacing classes directly on `<app-button>`. Wrap in a `<div>` instead:
```html
<!-- CORRECT -->
<div class="mt-6">
  <app-button variant="primary">Save</app-button>
</div>

<!-- WRONG — spacing will not apply -->
<app-button class="mt-6" variant="primary">Save</app-button>
```

---

### 7. **BadgeComponent**

**Location:** `frontend/src/app/shared/components/ui/badge/`

**Purpose:** Small label/tag for categorizing or labeling data

**Usage:**
```html
<app-badge variant="primary" size="sm">
  {{ roleCode }}
</app-badge>
```

---

### 8. **CardComponent**

**Location:** `frontend/src/app/shared/components/ui/card/`

**Purpose:** White padded container with optional title header and subtle shadow for grouping content

**Key Inputs:**
- `title` (string): Optional header title
- `border` (boolean): Show border instead of shadow (default: `false`)

**Usage:**
```html
<app-card title="Section Title">
  <div class="space-y-6">
    <!-- Content here -->
  </div>
</app-card>
```

---

### 9. **StatusBadgeComponent**

**Location:** `frontend/src/app/shared/components/ui/status-badge/`

**Purpose:** Domain-aware status badge that automatically resolves CCMS status codes to human-readable labels and colour-coded variants. Covers 40+ system status codes — no manual label or colour mapping required.

**Key Inputs:**
- `status` (string): CCMS status code e.g. `'PENDING_APPROVAL'`, `'APPROVED'`, `'REJECTED'`
- `label` (string, optional): Override the auto-resolved label
- `size` (string): `'xs' | 'sm' | 'md' | 'lg'` (default: `'md'`)

**Common Status Codes:**
| Code | Colour | Display Label |
|------|--------|---------------|
| `PENDING_APPROVAL` | warning/yellow | Pending Approval |
| `APPROVED` | success/green | Approved |
| `REJECTED` | danger/red | Rejected |
| `IN_PROGRESS` | primary/blue | In Progress |
| `PAID` | success/green | Paid |
| `CANCELLED` | danger/red | Cancelled |
| `DEFERRED` | warning/orange | Deferred |

**Usage:**
```html
<!-- Auto-resolves colour and label from status code -->
<app-status-badge [status]="row.claim_status"></app-status-badge>

<!-- Override the display label -->
<app-status-badge [status]="row.status" label="Custom Label"></app-status-badge>
```

**Usage in DataTable:**
```typescript
columns: DataTableColumn[] = [
  { key: 'claim_status', label: 'Status', type: 'status' }
];
```

---

### 10. **DatePickerComponent**

**Location:** `frontend/src/app/shared/components/ui/date-picker/`

**Purpose:** Flexible date/time picker with 6 operating modes. Implements `ControlValueAccessor` for reactive and template-driven forms.

**Key Inputs:**
- `mode` (string): Picker mode — `'date'` | `'date-time'` | `'month'` | `'time'` | `'date-range'` | `'range-time'`
- `label` (string): Label above the picker
- `placeholder` (string): Placeholder text
- `timeFormat` (string): `'12h'` | `'24h'` (default: `'24h'`)
- `disabled` (boolean): Disables the picker
- `min` (Date): Minimum selectable date
- `max` (Date): Maximum selectable date

**Key Outputs:**
- `(valueChange)`: Emits when value changes
- `(selectedDate)`: Emits the selected `Date` object

**Usage:**
```html
<!-- Single date -->
<app-date-picker
  [(ngModel)]="selectedDate"
  mode="date"
  label="Admission Date"
  placeholder="Select date"
></app-date-picker>

<!-- Date range for filtering -->
<app-date-picker
  [(ngModel)]="dateRange"
  mode="date-range"
  label="Date Range"
></app-date-picker>

<!-- Date + time -->
<app-date-picker
  formControlName="appointmentDate"
  mode="date-time"
  timeFormat="12h"
  label="Appointment Date & Time"
></app-date-picker>
```

**Wrapping Rule:** Like all form components, wrap in `<div class="mb-4">` for correct form field spacing.

---

### 11. **HasPermissionDirective**

**Location:** `frontend/src/app/shared/directives/permissions/has-permission.directive.ts`

**Purpose:** Structural directive that removes elements from the DOM entirely when the user lacks the required permission. The element is hidden at the DOM level — not just visually.

**Import:**
```typescript
import { HasPermissionDirective } from '../../shared/directives/permissions/has-permission.directive';
```

**Syntax:**
```html
<!-- Single dot-notation string -->
<button *hasPermission="'USER_MANAGEMENT.DELETE'">Delete</button>

<!-- Array form: [MODULE, ACTION] -->
<button *hasPermission="['USER_MANAGEMENT', 'UPDATE']">Edit</button>
```

**Rules:**
- Only ONE structural directive per element (Angular restriction)
- When combining with `*ngIf`, use an `<ng-container>` wrapper:
```html
<!-- CORRECT: separate elements -->
<ng-container *ngIf="someCondition">
  <button *hasPermission="'USER_MANAGEMENT.DELETE'">Delete</button>
</ng-container>

<!-- WRONG: two structural directives on one element -->
<button *ngIf="canShow" *hasPermission="'USER_MANAGEMENT.DELETE'">Delete</button>
```

**See also:** [Permission & Authorization](#permission--authorization) section for naming conventions.

---

## Spacing & Layout Standards

### Spacing Scale

| Utility | Pixels | Usage |
|---------|--------|-------|
| `mb-1` | 4px | Minimal spacing (label to input) |
| `mb-2` | 8px | Small spacing |
| `mb-4` | 16px | **Standard form field spacing** |
| `mb-6` | 24px | Large section spacing |
| `gap-2` | 8px | Tight item spacing |
| `gap-3` | 12px | Standard gap between items |
| `gap-6` | 24px | **Standard card spacing** |
| `p-4` | 16px | Card padding |
| `px-6 py-4` | — | Section padding |

### Form Field Spacing

```html
<!-- Each form field should have margin-bottom -->
<div class="mb-4">
  <app-text-input ... ></app-text-input>
</div>

<!-- Form actions need top margin for separation -->
<div class="mt-6 flex justify-end gap-3">
  <app-button>Cancel</app-button>
  <app-button variant="primary">Save</app-button>
</div>
```

### Card Content Spacing

```html
<!-- Use space-y-6 for consistent vertical spacing in cards -->
<app-card>
  <div class="space-y-6">
    <!-- content items automatically spaced -->
  </div>
</app-card>
```

### Button Grouping

```html
<!-- Horizontal button groups use gap-3 -->
<div class="flex gap-3">
  <app-button>Cancel</app-button>
  <app-button variant="primary">Save</app-button>
</div>

<!-- Or flex-end for right-aligned -->
<div class="flex justify-end gap-3">
  ...
</div>
```

### Page Layout

```html
<div class="min-h-screen bg-gray-50 p-6">
  <!-- Header section with margin -->
  <div class="mb-6">
    <h1 class="text-3xl font-bold">Page Title</h1>
    <p class="mt-1 text-sm text-gray-600">Description</p>
  </div>

  <!-- Main content, max-width for readability -->
  <div class="mx-auto max-w-4xl">
    <app-card>...</app-card>
  </div>
</div>
```

---

## Form Standards

### Form Structure

```typescript
// Component
userForm: FormGroup;

constructor(private fb: FormBuilder) {
  this.userForm = this.fb.group({
    username: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    is_active: [true]
  });
}

getFieldError(fieldName: string): string {
  const control = this.userForm.get(fieldName);
  if (!control || !control.errors || !control.touched) return '';
  
  if (control.errors['required']) return 'This field is required';
  if (control.errors['minlength']) return `Minimum ${control.errors['minlength'].requiredLength} characters`;
  if (control.errors['email']) return 'Invalid email address';
  return 'Invalid';
}
```

### Form Template Pattern

```html
<form [formGroup]="userForm" (ngSubmit)="onSubmit()">
  <!-- Text inputs with margin -->
  <div class="mb-4">
    <app-text-input
      formControlName="username"
      label="Username"
      [error]="getFieldError('username')"
      [required]="true"
    ></app-text-input>
  </div>

  <!-- Checkbox with flex alignment -->
  <div class="mb-6 flex items-center py-2.5">
    <input type="checkbox" formControlName="is_active" class="h-4 w-4" />
    <label class="ml-2 text-sm font-medium">Active User</label>
  </div>

  <!-- Actions with top margin -->
  <div class="mt-6 flex justify-end gap-3">
    <app-button type="button" (click)="goBack()">Cancel</app-button>
    <app-button variant="primary" type="submit" [loading]="loading">Save</app-button>
  </div>
</form>
```

### Validation & Error Handling

- Display validation errors **only after field is touched**
- Use `[error]` binding on form inputs
- Show single error per field (first validation rule that fails)
- For form-level errors, use ToastService, not inline alerts

---

## Data Table Standards

### Column Configuration

```typescript
columns: DataTableColumn[] = [
  { key: 'username', label: 'Username', sortable: true },
  { key: 'email', label: 'Email', sortable: true },
  { key: 'is_active', label: 'Status', type: 'toggle' },
  { key: 'created_at', label: 'Created', type: 'date', format: 'DD MMM YYYY' },
  { key: 'role_code', label: 'Role', type: 'badge', badgeMap: {
      'ADMIN': { label: 'Administrator', color: 'red' },
      'USER': { label: 'User', color: 'blue' }
    }
  }
];
```

### Row Actions with Permissions

```typescript
rowActions: DataTableAction[] = [
  { 
    id: 'view', 
    title: 'View', 
    iconPath: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z...',
    color: 'blue',
    permission: 'MODULE.VIEW'
  },
  { 
    id: 'edit', 
    title: 'Edit', 
    iconPath: 'M11 5H6a2 2 0 00-2 2v11...',
    color: 'indigo',
    permission: 'MODULE.UPDATE'
  },
  { 
    id: 'delete', 
    title: 'Delete', 
    iconPath: 'M19 7l-.867 12.142A2...',
    color: 'red',
    permission: 'MODULE.DELETE'
  }
];
```

**Important:** 
- `iconPath` must contain **only the SVG path `d` attribute value**, NOT the full `<path>` element
- Always include `permission` field for security
- Icon paths should be consistent across the application

### Action Handlers

```typescript
onRowAction(event: any): void {
  const actionId = event.action; // String: 'view', 'edit', 'delete'
  const row = event.row;          // Full row data
  
  switch (actionId) {
    case 'view':
      this.router.navigate(['/detail', row.id]);
      break;
    case 'edit':
      this.router.navigate(['/edit', row.id]);
      break;
    case 'delete':
      this.showDeleteConfirm(row);
      break;
  }
}

onCellToggle(event: any): void {
  const row = event.row;
  const newValue = event.newValue; // Boolean
  
  // Show confirmation for status changes
  this.pendingToggle = { row, newValue };
  this.showToggleConfirm = true;
}
```

### Pagination

```typescript
pagination: DataTablePagination = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0
};

onFilterChange(filterState: any): void {
  // filterState includes: page, limit, sortBy, sortDir, and custom filters
  this.loadData(filterState);
}
```

---

## Dialog & Modal Standards

### Deletion Confirmation

```html
<app-confirm-dialog
  [isOpen]="showDeleteConfirm"
  title="Delete Item"
  [message]="'Are you sure you want to delete &quot;' + itemName + '&quot;? This action cannot be undone.'"
  variant="danger"
  confirmLabel="Delete"
  cancelLabel="Cancel"
  (confirmed)="confirmDelete()"
  (cancelled)="cancelDelete()"
></app-confirm-dialog>
```

```typescript
confirmDelete(): void {
  this.service.delete(this.itemId).subscribe({
    next: () => {
      this.showDeleteConfirm = false; // ← IMPORTANT: Close dialog
      this.toast.success('Item deleted successfully');
      this.loadList();
    },
    error: (err) => {
      this.showDeleteConfirm = false; // ← Close even on error
      this.toast.error('Failed to delete item');
    }
  });
}

cancelDelete(): void {
  this.showDeleteConfirm = false;
  // Optional: reset selected item
}
```

### Status Change Confirmation

```html
<app-confirm-dialog
  [isOpen]="showStatusConfirm"
  title="Change Status"
  [message]="'This will ' + (newStatus ? 'activate' : 'deactivate') + ' the ' + itemType + '.'"
  [variant]="newStatus ? 'primary' : 'warn'"
  (confirmed)="confirmStatusChange()"
  (cancelled)="cancelStatusChange()"
></app-confirm-dialog>
```

---

## Notification Standards

### Toast Service Usage

```typescript
import { ToastService } from '../../../core/services/toast.service';

constructor(private toast: ToastService) {}

// Success
this.toast.success('User created successfully');

// Error
this.toast.error(`Failed to update: ${error.message}`);

// Warning
this.toast.warning('This action is irreversible');

// Info
this.toast.info('No results found');
```

### When to Use Toasts

| Scenario | Use | Don't Use |
|----------|-----|----------|
| Action completed successfully | Toast ✓ | Alert ✗ |
| Request failed | Toast ✓ | Alert ✗ |
| Confirm destructive action | Confirm Dialog ✓ | Toast ✗ |
| Form validation error | Form [error] binding ✓ | Toast ✗ |
| General informational message | Toast ✓ | Alert ✗ |

### NEVER Use Inline Alerts

```typescript
// ✗ DON'T DO THIS
template = `
  <app-alert *ngIf="errorMessage" [message]="errorMessage"></app-alert>
`;

// ✓ DO THIS INSTEAD
onError(error): void {
  this.toast.error(error.message);
}
```

---

## Permission & Authorization

### HasPermission Directive Usage

```html
<!-- Hide element if user lacks permission -->
<button
  *hasPermission="'USER_MANAGEMENT.DELETE'"
  (click)="deleteUser()"
>
  Delete User
</button>

<!-- Array format for module + action -->
<button
  *hasPermission="['USER_MANAGEMENT', 'UPDATE']"
  (click)="editUser()"
>
  Edit User
</button>
```

### In DataTable Actions

```typescript
rowActions: DataTableAction[] = [
  {
    id: 'edit',
    title: 'Edit',
    iconPath: '...',
    color: 'indigo',
    permission: 'USER_MANAGEMENT.UPDATE'  // ← Always include
  },
  {
    id: 'delete',
    title: 'Delete',
    iconPath: '...',
    color: 'red',
    permission: 'USER_MANAGEMENT.DELETE'  // ← Always include
  }
];
```

### Permission Naming Convention

```
MODULE_CODE.ACTION_CODE

Examples:
- USER_MANAGEMENT.VIEW
- USER_MANAGEMENT.CREATE
- USER_MANAGEMENT.UPDATE
- USER_MANAGEMENT.DELETE
- HOSPITAL_MGMT.MANAGE_ADDRESS
- ROLE_MANAGEMENT.ASSIGN_ROLE
```

---

## Component Integration Examples

### Complete User List Module Example

```typescript
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DataTableComponent } from '../../shared/components/ui/data-table/data-table.component';
import { ConfirmDialogComponent } from '../../shared/components/ui/confirm-dialog/confirm-dialog.component';
import { ButtonComponent } from '../../shared/components/ui/button/button.component';
import { HasPermissionDirective } from '../../shared/directives/permissions/has-permission.directive';
import { ToastService } from '../../core/services/toast.service';

type DataTableColumn = /* ... */;
type DataTableAction = /* ... */;

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [
    CommonModule,
    DataTableComponent,
    ConfirmDialogComponent,
    ButtonComponent,
    HasPermissionDirective
  ],
  template: `
    <div class="min-h-screen bg-gray-50 p-6">
      <!-- Header -->
      <div class="mb-6 flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">Users</h1>
          <p class="mt-1 text-sm text-gray-600">Manage user accounts and roles</p>
        </div>
        <app-button
          *hasPermission="'USER_MANAGEMENT.CREATE'"
          variant="primary"
          (click)="openCreateModal()"
        >
          Create User
        </app-button>
      </div>

      <!-- Data Table -->
      <app-data-table
        [rows]="users"
        [columns]="columns"
        [rowActions]="rowActions"
        [pagination]="pagination"
        [loading]="loading"
        (rowAction)="onRowAction($event)"
        (filterChange)="onFilterChange($event)"
      ></app-data-table>

      <!-- Delete Confirm Dialog -->
      <app-confirm-dialog
        [isOpen]="showDeleteConfirm"
        title="Delete User"
        message="Are you sure?"
        variant="danger"
        (confirmed)="confirmDelete()"
        (cancelled)="cancelDelete()"
      ></app-confirm-dialog>
    </div>
  `
})
export class UserListComponent implements OnInit {
  users: any[] = [];
  loading = false;
  showDeleteConfirm = false;
  userToDelete: any = null;

  columns: DataTableColumn[] = [
    { key: 'username', label: 'Username', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    { key: 'is_active', label: 'Status', type: 'toggle' },
    { key: 'created_at', label: 'Created', type: 'date' }
  ];

  rowActions: DataTableAction[] = [
    { id: 'view', title: 'View', iconPath: '...', color: 'blue', permission: 'USER_MANAGEMENT.VIEW' },
    { id: 'edit', title: 'Edit', iconPath: '...', color: 'indigo', permission: 'USER_MANAGEMENT.UPDATE' },
    { id: 'delete', title: 'Delete', iconPath: '...', color: 'red', permission: 'USER_MANAGEMENT.DELETE' }
  ];

  pagination = { page: 1, limit: 10, total: 0, totalPages: 0 };

  constructor(
    private userService: any,
    private router: Router,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    this.userService.getUsers().subscribe({
      next: (resp) => {
        this.users = resp.data;
        this.pagination = resp.pagination;
        this.loading = false;
      },
      error: (err) => {
        this.toast.error('Failed to load users');
        this.loading = false;
      }
    });
  }

  onRowAction(event: any): void {
    const actionId = event.action;
    const row = event.row;

    switch (actionId) {
      case 'view':
        this.router.navigate(['/users/view', row.id]);
        break;
      case 'edit':
        this.router.navigate(['/users/edit', row.id]);
        break;
      case 'delete':
        this.userToDelete = row;
        this.showDeleteConfirm = true;
        break;
    }
  }

  confirmDelete(): void {
    this.userService.deleteUser(this.userToDelete.id).subscribe({
      next: () => {
        this.showDeleteConfirm = false;
        this.toast.success('User deleted successfully');
        this.loadUsers();
      },
      error: (err) => {
        this.showDeleteConfirm = false;
        this.toast.error('Failed to delete user');
      }
    });
  }

  cancelDelete(): void {
    this.showDeleteConfirm = false;
  }

  onFilterChange(filterState: any): void {
    this.loadUsers();
  }

  openCreateModal(): void {
    this.router.navigate(['/users/create']);
  }
}
```

---

## Checklist for Module Conversion

Use this checklist when converting a new module to use these custom components:

### Pre-Implementation
- [ ] Review this standards document
- [ ] Identify all pages/components in the module
- [ ] Map existing data structures to DataTableColumn interface
- [ ] List all user actions and determine required permissions
- [ ] Audit all current Alert components (remove them)

### Component Selection & Setup
- [ ] Use DataTableComponent for all data listing pages
- [ ] Use TextInputComponent for all text/number/currency form inputs
- [ ] Use DropdownComponent for select inputs (replace native `<select>`)
- [ ] Use DatePickerComponent for date, time, or date-range selections
- [ ] Use ConfirmDialogComponent for delete/destructive actions
- [ ] Use ToggleComponent for boolean toggles in forms/tables
- [ ] Use StatusBadgeComponent for CCMS status code columns (type: `'status'`)
- [ ] Use ButtonComponent for all buttons (no `<button>` elements directly)
- [ ] Import HasPermissionDirective in all components that have secured actions

### Styling & Layout
- [ ] Apply `min-h-screen bg-gray-50 p-6` to page wrapper
- [ ] Use `mb-6` between header and content
- [ ] Use `mx-auto max-w-4xl` for content max-width
- [ ] Use `space-y-6` in cards for section spacing
- [ ] Use `mb-4` for form field spacing
- [ ] Use `mt-6` for form actions
- [ ] Use `flex justify-end gap-3` for button groups
- [ ] Verify all colors use Tailwind utilities only (no custom CSS)

### Forms
- [ ] Create FormGroup with proper validators
- [ ] Implement getFieldError() method
- [ ] Add `[required]` and `[error]` bindings to inputs
- [ ] Add loading states to submit buttons
- [ ] Wrap each form field in `<div class="mb-4">`
- [ ] Add `mt-6` div around form actions
- [ ] Replace all `<app-alert>` with ToastService calls

### Data Tables
- [ ] Define column configuration matching template
- [ ] Use `type: 'status'` for CCMS status code columns (auto-resolves colour/label)
- [ ] Use `type: 'toggle'` for boolean columns (fires `cellToggle` event)
- [ ] Use `type: 'currency'` for monetary amount columns (auto-formats with `CurrencyMyrPipe`)
- [ ] Use `type: 'date'` for date columns (auto-formats with `DateMalayPipe`)
- [ ] Define row actions with `permission` field on every action
- [ ] Implement onRowAction() handler using `event.action` (string) and `event.row`
- [ ] Implement onCellToggle() handler if toggle columns are present
- [ ] Extract SVG path `d` value only for iconPath (not full `<path>` element)
- [ ] Add onFilterChange handler
- [ ] Bind `[loading]` to show spinner during data load
- [ ] Set pagination state object (`page`, `limit`, `total`, `totalPages`)

### Dialogs & Confirmations
- [ ] Add confirmation dialog for every delete action
- [ ] Close dialog in **both** success and error handlers
- [ ] Use appropriate variant (danger/warn/primary)
- [ ] Always set message dynamically with item name

### Notifications
- [ ] Replace all inline alerts with ToastService
- [ ] Remove successMessage/errorMessage properties from components
- [ ] Remove `<app-alert>` elements from templates
- [ ] Call `this.toast.success/error/warning/info()` on actions

### Permissions
- [ ] Add `*hasPermission` directive to all sensitive buttons
- [ ] Add `permission` field to all DataTableActions
- [ ] Implement permission-based routes
- [ ] Test that hidden buttons don't appear without permission

### Testing & QA
- [ ] Build completes without errors: `ng build`
- [ ] No unused component imports
- [ ] No inline CSS or `style="..."` attributes
- [ ] All Tailwind classes present in final build
- [ ] Responsive design works (test on mobile, tablet)
- [ ] Permission checks working (test with different roles)
- [ ] Dialogs close properly after confirm/cancel
- [ ] Toasts display for all success/error scenarios
- [ ] No console errors or warnings

### Documentation
- [ ] Update component README.md with usage examples
- [ ] Document any custom permission keys used
- [ ] Add comments for non-obvious logic
- [ ] Update related documentation

---

## Common Patterns & Anti-Patterns

### ✓ DO: Wrap Components in Divs for Styling

```html
<!-- GOOD: Apply spacing via wrapper -->
<div class="mt-6">
  <app-button>Save</app-button>
</div>

<!-- BAD: Trying to apply class directly to component -->
<app-button class="mt-6">Save</app-button>
```

### ✓ DO: Close Dialogs in Both Success & Error

```typescript
// GOOD
this.service.delete(id).subscribe({
  next: () => {
    this.dialogOpen = false;
    this.toast.success('Deleted');
  },
  error: (err) => {
    this.dialogOpen = false; // ← Important!
    this.toast.error('Failed');
  }
});

// BAD: Dialog stays open on error
this.service.delete(id).subscribe({
  next: () => {
    this.dialogOpen = false;
  }
  // error handler missing!
});
```

### ✓ DO: Use Null for Dropdown No-Selection

```typescript
// GOOD
selectedRoleId: number | null = null;

// BAD: Using 0 as "no selection"
selectedRoleId: number = 0;
```

### ✓ DO: Extract SVG Path Data Only

```typescript
// GOOD: Just the d attribute value
iconPath: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z'

// BAD: Full SVG element
iconPath: '<path stroke-linecap="round" ... d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />'
```

### ✓ DO: Use HasPermission Directive Properly

```html
<!-- GOOD: Single directive per element -->
<button *hasPermission="'USER_MANAGEMENT.DELETE'">Delete</button>

<!-- GOOD: Wrap when multiple directives needed -->
<ng-container *ngIf="condition">
  <button *hasPermission="'USER_MANAGEMENT.UPDATE'">Edit</button>
</ng-container>

<!-- BAD: Multiple structural directives on same element -->
<button *ngIf="canEdit" *hasPermission="'USER_MANAGEMENT.UPDATE'">Edit</button>
```

### ✗ DON'T: Mix Toast and Alerts

```typescript
// BAD: Both notification methods
this.errorMessage = 'Form invalid';
this.toast.error('Form invalid');

// GOOD: Toast only
this.toast.error('Form invalid');
```

---

## Performance Considerations

1. **DataTable with Large Datasets**
   - Always implement server-side pagination
   - Don't load all rows at once
   - Set reasonable `limit` (default: 10)

2. **Memory Leaks Prevention**
   ```typescript
   import { Subject, takeUntil } from 'rxjs';
   
   private destroy$ = new Subject<void>();
   
   ngOnInit(): void {
     this.service.getData()
       .pipe(takeUntil(this.destroy$))
       .subscribe(...);
   }
   
   ngOnDestroy(): void {
     this.destroy$.next();
     this.destroy$.complete();
   }
   ```

3. **Change Detection**
   - Use `trackBy` in `*ngFor` loops
   - Use `OnPush` change detection when appropriate
   ```html
   <div *ngFor="let item of items; trackBy: trackByFn">...</div>
   ```

---

## Accessibility Standards

1. **Form Labels**
   - Always include `<label>` with `for` attribute
   - Mark required fields with asterisk: `<span class="text-red-500">*</span>`

2. **Buttons**
   - Use semantic `type="button"` for non-submit
   - Include `[disabled]` instead of disabling via CSS

3. **Dialog Focus**
   - Focus first input/button when dialog opens
   - Return focus to trigger element when closed

4. **Color Contrast**
   - Ensure 4.5:1 ratio for text (WCAG AA)
   - Don't rely on color alone for meaning

---

## Testing Guidelines

### Unit Tests
- Test component inputs/outputs
- Test permission directive behavior
- Test error handling

### E2E Tests
- Test complete user flows (create → read → update → delete)
- Test permission blocking
- Test dialog confirm/cancel
- Test form validation

### Manual Testing
- Cross-browser (Chrome, Firefox, Safari, Edge)
- Responsive (mobile, tablet, desktop)
- Different user roles
- Slow network (throttle in DevTools)

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.2 | 27 Mar 2026 | Enhanced `ToggleComponent` with full inputs/outputs spec; Expanded `ButtonComponent` variants (secondary, success, warn, custom); Added `StatusBadgeComponent` to inventory; Added `DatePickerComponent` to inventory; Added `HasPermissionDirective` as standalone inventory item with import path, syntax, and structural directive rules; Updated module conversion checklist with toggle, status, currency, date column guidance |
| 1.0 | 27 Mar 2026 | Initial standards document (User Management baseline) |

---

## Questions & Feedback

For questions or to update this document:
- Review the actual component implementations in `frontend/src/app/shared/components/`
- Check existing modules for patterns
- Ask prior to starting new module conversions

**For Module Conversion Requests:**

Present this document to any AI model with:
> "I want to convert [MODULE] to use our custom components. Follow the UI/UX Standards document located at `docs/UI-UX-STANDARDS.md`. Implement all components, spacing, permission checks, and toast notifications according to the standards. Use the User Management module as your reference implementation."
