# CCMS Shared Components & Pipes Reference

**Purpose:** This document serves as a comprehensive guide for AI models and developers to understand all reusable components and pipes in the CCMS frontend architecture. Use this as a reference when integrating these components into feature screens.

---

## Table of Contents

1. [UI Components](#ui-components)
   - [Feedback Components](#feedback-components)
   - [Data Display Components](#data-display-components)
   - [Layout & Overlay Components](#layout--overlay-components)
   - [Form Control Components](#form-control-components)
2. [Directives](#directives)
3. [Custom Pipes](#custom-pipes)
4. [Integration Guidelines](#integration-guidelines)

---

## UI Components

### Feedback Components

#### ButtonComponent (`app-button`)
**Selector:** `<app-button>`  
**Module:** `standalone`

**Purpose:** Primary action button throughout the app with brand-consistent styling and flexible customization. Supports multiple visual variants, sizes, icons, and loading states.

**Key Inputs:**
- `variant` (string): `'primary' | 'secondary' | 'success' | 'warn' | 'danger' | 'ghost' | 'outline' | 'custom'` — Controls button style
- `size` (string): `'xs' | 'sm' | 'md' | 'lg' | 'xl'` — Controls button dimensions
- `rounded` (string): `'sm' | 'md' | 'lg' | 'full'` — Controls border radius (default: 'md')
- `disabled` (boolean): Disables the button when true
- `loading` (boolean): Shows spinner and hides text when true
- `iconLeft` (string): Font Awesome icon class (e.g., `'fas fa-plus'`)
- `iconRight` (string): Font Awesome icon class for right side
- `customBg` (string): Custom background colour (for `variant="custom"`)
- `customTextColor` (string): Custom text colour (for `variant="custom"`)
- `customClass` (string): Additional Tailwind classes (for `variant="custom"`)

**Key Outputs:**
- `(click)`: Standard click event

**Brand Gradient:** Primary buttons use `from-primary-800 to-primary-700` (navy gradient matching hospital/member/product management screens)

**Use Cases:**
- Primary CTAs (Submit, Save, Approve)
- Destructive actions (Delete, Reject)
- Form submission with loading state
- Icon-only toolbar buttons

---

#### AlertComponent (`app-alert`)
**Selector:** `<app-alert>`  
**Module:** `standalone`

**Purpose:** Dismissible alert/banner for success, error, warning, and info messages.

**Key Inputs:**
- `type` (string): `'success' | 'error' | 'warning' | 'info'` — Controls icon and colour
- `title` (string): Alert title/heading
- `dismissible` (boolean): Shows close button when true (default: true)

**Key Outputs:**
- `(dismissed)`: Emitted when user clicks close button

**Content Slot:** `<ng-content>` — Message text

**Use Cases:**
- Success confirmation after form submission
- Error messages from failed API calls
- Inline warnings or informational notices

---

#### LoadingSpinnerComponent (`app-loading-spinner`)
**Selector:** `<app-loading-spinner>`  
**Module:** `standalone`

**Purpose:** Animated SVG spinner for loading states.

**Key Inputs:**
- `size` (string): `'small' | 'medium' | 'large'` — Controls spinner dimensions
- `message` (string): Optional loading text below spinner

**Use Cases:**
- Data table loading state
- Form submission in progress
- API request pending state

---

#### ToggleComponent (`app-toggle`)
**Selector:** `<app-toggle>`  
**Module:** `standalone`

**Purpose:** Checkbox-style toggle with visual chip styling for binary state switches. Supports active (enabled) and inactive (disabled) states with animated transitions.

**Key Inputs:**
- `isActive` (boolean): Current toggle state (default: false)
- `loading` (boolean): Shows spinner and disables toggle while true (default: false)
- `disabled` (boolean): Disables toggle interaction when true (default: false)

**Key Outputs:**
- `(toggle)`: Emitted when toggle state changes, passes boolean value

**Visual Design:**
- **Active State:** `bg-green-100 text-green-800` with green dot on right side
- **Inactive State:** `bg-gray-100 text-gray-800` with gray dot on left side
- **Size:** 44px height × 24px width (fixed, designed for table cells and forms)
- **Transitions:** Smooth animation on state change
- **Loading State:** Shows spinner overlay, disables interaction

**Usage in DataTable:**
When using toggle column in data tables, the toggle column automatically emits `cellToggle` events:
```typescript
columns = [
  { key: 'is_active', label: 'Status', type: 'toggle' }
];

// Handle toggle in parent component
onCellToggle(event: any): void {
  const row = event.row;        // Full row data
  const newValue = event.newValue; // Boolean
  // Show confirmation or save immediately
}
```

**Standalone Usage:**
```html
<app-toggle
  [isActive]="user.is_active"
  [loading]="isSaving"
  [disabled]="!canEdit"
  (toggle)="onStatusToggle($event)"
></app-toggle>
```

**Use Cases:**
- User active/inactive status in tables
- Binary feature toggles in forms
- Enable/disable record switches
- Claim approval status (approved/rejected)
- Quick-action toggles in data displays

---

#### ToastComponent (`app-toast`)
**Selector:** `<app-toast>`  
**Module:** `standalone`

**Purpose:** Fixed top-right toast notification stack. Subscribes to `ToastService` to display success/error/warning/info messages.

**Integration:** Inject `ToastService` and call `showSuccess()`, `showError()`, `showWarning()`, `showInfo(message: string, duration?: number)`

**Use Cases:**
- Non-blocking user feedback
- Form submission confirmation
- Transient error notifications

---

### Data Display Components

#### BadgeComponent (`app-badge`)
**Selector:** `<app-badge>`  
**Module:** `standalone`

**Purpose:** Inline tag/label for status indicators, category tags, and labels.

**Key Inputs:**
- `variant` (string): `'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info'` — Controls colour
- `size` (string): `'xs' | 'sm' | 'md' | 'lg'` — Controls dimensions

**Content Slot:** `<ng-content>` — Badge text

**Use Cases:**
- Status indicators (Approved, Pending, Rejected)
- Category tags
- Count badges (e.g., "5 new items")

---

#### StatusBadgeComponent (`app-status-badge`)
**Selector:** `<app-status-badge>`  
**Module:** `standalone`

**Purpose:** Domain-aware status badge that automatically resolves CCMS status codes to human-readable labels and appropriate colours. Central registry of 40+ status codes with built-in colour mapping.

**Key Inputs:**
- `status` (string, required): CCMS status code (e.g., `'PENDING_APPROVAL'`, `'APPROVED'`, `'REJECTED'`, `'IN_PROGRESS'`, `'PAID'`, `'CANCELLED'`, `'DEFERRED'`)
- `label` (string, optional): Override the automatic label mapping. If not provided, uses the registry mapping
- `size` (string): `'xs' | 'sm' | 'md' | 'lg'` — Controls badge size (default: `'md'`)

**Internal Status Registry Examples:**
- `PENDING_APPROVAL` → `variant: 'warning'`, `label: 'Pending Approval'`
- `APPROVED` → `variant: 'success'`, `label: 'Approved'`
- `REJECTED` → `variant: 'danger'`, `label: 'Rejected'`
- `IN_PROGRESS` → `variant: 'primary'`, `label: 'In Progress'`
- `PAID` → `variant: 'success'`, `label: 'Paid'`
- `CANCELLED` → `variant: 'danger'`, `label: 'Cancelled'`
- More mappings available in component (20+ total)

**How It Works:** Pass a raw CCMS status code, and the component automatically looks it up in an internal registry to determine colour and display label. Fallback: if status not found in registry, displays the status as-is.

**Use Cases:**
- Claim status display in tables/lists
- Admission status indicators
- Payment status badges
- Investigation status tracking
- Any domain status that needs colour-coded visual feedback

---

#### CardComponent (`app-card`)
**Selector:** `<app-card>`  
**Module:** `standalone`

**Purpose:** White padded container with optional title header and subtle shadow. Used for grouping related content.

**Key Inputs:**
- `title` (string): Optional header title
- `border` (boolean): Show border instead of shadow (default: false)

**Content Slot:** `<ng-content>` — Card content

**Use Cases:**
- Feature grouping on dashboards
- Section containers in forms
- Information panels

---

### Layout & Overlay Components

#### ModalComponent (`app-modal`)
**Selector:** `<app-modal>`  
**Module:** `standalone`

**Purpose:** Backdrop overlay with centred modal panel. Provides standardised modal wrapper for dialogs, forms, and edit screens.

**Key Inputs:**
- `isOpen` (boolean): Controls modal visibility
- `title` (string): Modal header title
- `size` (string): `'sm' | 'md' | 'lg' | 'xl' | 'full'` — Controls modal width (default: `'md'`)
- `showFooter` (boolean): Display footer section (default: false)

**Key Outputs:**
- `(onClose)`: Emitted when user clicks backdrop or close button

**Content Slot:** `<ng-content>` — Modal body content

**Features:**
- Backdrop fade with opacity
- Centred flex layout (vertically and horizontally centred)
- Close button in header
- Responsive sizing
- Click outside to close

**Use Cases:**
- Edit record forms
- Delete confirmation dialogs
- Detail view panels
- Multi-step wizards

---

#### ConfirmDialogComponent (`app-confirm-dialog`)
**Selector:** `<app-confirm-dialog>`  
**Module:** `standalone`

**Purpose:** Reusable confirmation dialog for destructive or irreversible actions. Wraps `ModalComponent` internally with pre-built icon + buttons.

**Key Inputs:**
- `isOpen` (boolean): Controls dialog visibility
- `title` (string): Dialog header (default: `'Confirm Action'`)
- `message` (string): Body message asking user to confirm (default: `'Are you sure you want to proceed?'`)
- `variant` (string): `'danger' | 'warn' | 'primary'` — Controls icon and button colour
  - `danger`: Red icon (trash), red button — for delete/destructive actions
  - `warn`: Amber icon (alert), amber button — for caution/override actions
  - `primary`: Blue icon (check), brand button — for approvals/submissions
- `confirmLabel` (string): Confirm button text (default: `'Confirm'`)
- `cancelLabel` (string): Cancel button text (default: `'Cancel'`)

**Key Outputs:**
- `(confirmed)`: Emitted when user clicks confirm button
- `(cancelled)`: Emitted when user clicks cancel, close, or backdrop

**Structure:**
- Header with title
- Icon (colour-coded by variant)
- Message text
- Two-button footer (Cancel + Confirm)

**Use Cases:**
- Delete confirmation: `variant="danger"`, `title="Delete User"`, `confirmLabel="Delete"`
- Override approval: `variant="warn"`, `title="Override Approval"`, `confirmLabel="Override"`
- Claim approval: `variant="primary"`, `title="Approve Claim"`, `confirmLabel="Approve"`

---

#### TabsComponent (`app-tabs`)
**Selector:** `<app-tabs>`  
**Module:** `standalone`

**Purpose:** Simple tab navigation bar with active-index control.

**Key Inputs:**
- `activeIndex` (number): Currently active tab index (default: 0)
- `tabs` (array): Array of tab objects with `label` and `id`

**Key Outputs:**
- `(activeIndexChange)`: Emitted when user clicks a tab

**Content Slot:** `<ng-content>` — Tab content (or use `[tabs]` input for header-only)

**Use Cases:**
- Feature navigation (Status/Milestones/Durations tabs)
- Detail view secondary sections
- Multi-view dashboards

---

#### ProgressBarComponent (`app-progress-bar`)
**Selector:** `<app-progress-bar>`  
**Module:** `standalone`

**Purpose:** Horizontal percentage bar for showing progress towards a goal.

**Key Inputs:**
- `percentage` (number): Progress percentage (0–100)
- `theme` (string): `'blue' | 'green' | 'red' | 'yellow' | 'purple'` — Colour theme
- `showLabel` (boolean): Display percentage text (default: true)
- `height` (string): `'sm' | 'md' | 'lg'` — Bar height (default: `'md'`)

**Use Cases:**
- KPI progress display
- Claims processed percentage
- Load/capacity indicators

---

#### TooltipComponent (`app-tooltip`)
**Selector:** `<app-tooltip>`  
**Module:** `standalone`

**Purpose:** CSS-based tooltip on hover.

**Key Inputs:**
- `text` (string): Tooltip text
- `position` (string): `'top' | 'bottom' | 'left' | 'right'` — Tooltip position

**Content Slot:** `<ng-content>` — Element to hover over

**Use Cases:**
- Icon help text
- Field descriptions
- Action explanations

---

### Form Control Components

#### DropdownComponent (`app-dropdown`)
**Selector:** `<app-dropdown>`  
**Module:** `standalone`

**Purpose:** Searchable select dropdown with ControlValueAccessor integration. Auto-enables search bar when item count > 10.

**Key Inputs:**
- `options` (array): Array of `DropdownOption` objects with `value`, `label`, and optional `disabled`
- `placeholder` (string): Placeholder text
- `disabled` (boolean): Disables dropdown when true
- `clearable` (boolean): Show clear button (default: false)
- `label` (string): Label above dropdown
- `hint` (string): Helper text below dropdown
- `error` (string): Error message (shows red state)

**Key Outputs:**
- `(valueChange)`: Emitted when selection changes

**ControlValueAccessor:** Integrates with `[(ngModel)]` and reactive forms

**Features:**
- Auto-enable search for lists > 10 items
- Disabled option support
- Clearable selection
- Accessible keyboard navigation

**Use Cases:**
- Hospital selection
- Status filtering
- Role/permission selection
- Lookup data selection

---

#### DatePickerComponent (`app-date-picker`)
**Selector:** `<app-date-picker>`  
**Module:** `standalone`

**Purpose:** Flexible date/time picker with 6 operating modes.

**Key Inputs:**
- `mode` (string): `'date' | 'date-time' | 'month' | 'time' | 'date-range' | 'range-time'` — Picker mode
- `timeFormat` (string): `'12h' | '24h'` — Time display format (default: `'24h'`)
- `placeholder` (string): Placeholder text
- `label` (string): Label above picker
- `disabled` (boolean): Disables picker when true
- `min` (Date): Minimum selectable date
- `max` (Date): Maximum selectable date

**Key Outputs:**
- `(valueChange)`: Emitted when selection changes
- `(selectedDate)`: Emitted with selected Date object

**ControlValueAccessor:** Integrates with `[(ngModel)]` and reactive forms

**Use Cases:**
- Admission date selection
- Date range filtering (claims by date range)
- Time-based scheduling
- Time-only selection for monitoring records

---

#### TextInputComponent (`app-text-input`)
**Selector:** `<app-text-input>`  
**Module:** `standalone`

**Purpose:** Typed text input with built-in validation and **special POS-style currency formatting**.

**Key Inputs:**
- `inputType` (string): `'string' | 'number' | 'integer' | 'decimal' | 'currency'` — Input type with automatic validation
  - `string`: Basic text (default)
  - `number`: Accepts positive/negative numbers with decimals
  - `integer`: Whole numbers only (0-9, +, -)
  - `decimal`: Numbers with up to 2 decimal places
  - `currency`: **Special POS-style formatter** (see below)
- `label` (string): Label above input
- `placeholder` (string): Placeholder text
- `disabled` (boolean): Disables input when true
- `required` (boolean): Marks field as required
- `hint` (string): Helper text below input
- `error` (string): Error message (shows red state)
- `decimalPlaces` (number): Max decimal places for decimal/currency types (default: 2)
- `maxLength` (number): Max character length (0 = unlimited)
- `debounceMs` (number): Debounce emit time in milliseconds (optional)
- `dateFormat` (string, for date inputs): Format string for display

**Key Outputs:**
- `(valueChange)`: Emitted when input changes
- `(blur)`: Emitted on blur
- `(enter)`: Emitted when Enter key pressed

**ControlValueAccessor:** Integrates with `[(ngModel)]` and reactive forms

**Special Currency Input Behavior:**
When `inputType="currency"`, input operates like a **POS terminal or ATM machine** (right-to-left digit accumulation):
- User types `5` → displays `RM 0.05` (5 cents)
- User types `0` → displays `RM 0.50` (50 cents)
- User types `0` → displays `RM 5.00` (500 cents = 5 ringgit)
- User types `0` → displays `RM 50.00`
- User types `0` → displays `RM 500.00`
- **Backspace removes rightmost digit**, reverting `RM 500.00` to `RM 50.00`
- **Impossible to type > 2 decimal places** — the decimal point never moves; digits push from right to left
- Form stores raw numeric value: `500.00` (for backend use)
- Uses `CurrencyMyrPipe` internally for display formatting

**Use Cases:**
- Claim amount entry
- Payment amount input
- Financial transaction amounts
- Quantity/price entry

---

#### InputComponent (`app-input`)
**Selector:** `<app-input>`  
**Module:** `standalone`

**Purpose:** Earlier, simpler ControlValueAccessor input component that integrates all 3 custom pipes. **Note:** `TextInputComponent` is the recommended form input for new features; this is kept for backward compatibility but superseded.

**Key Inputs:**
- `type`: `'text' | 'email' | 'password' | 'number' | 'tel' | 'currency' | 'date' | 'status'` — Input type
- `label`, `placeholder`, `disabled`, `required`, `error`, `hint`: Standard form field inputs
- `dateFormat`: For `type="date"`
- `currencyDecimals`: For `type="currency"`

**Key Features:**
- Currency inputs auto-format with `CurrencyMyrPipe` to `RM 1,234.50`
- Date inputs auto-format with `DateMalayPipe` to `DD MMM YYYY`
- Status inputs display as read-only transformed labels with `StatusLabelPipe`

---

#### FileUploadComponent (`app-file-upload`)
**Selector:** `<app-file-upload>`  
**Module:** `standalone`

**Purpose:** Drag-and-drop file upload component with progress tracking, file validation, image preview support, and automatic integration with the backend upload service. Handles single or multiple file uploads with customizable file type restrictions.

**Key Inputs:**
- `folder` (string): Backend folder where files will be stored (e.g., `'claim-documents'`, `'member-photos'`, `'investigation-files'`)
- `label` (string): Display label above the upload zone (default: `'Upload File'`)
- `hint` (string): Helper text below the label explaining what files are accepted
- `allowedExtensions` (string array): List of permitted file extensions without dots (e.g., `['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png']`)
- `maxFileSize` (number): Maximum file size in bytes (default: 10485760 = 10 MB)
- `multiple` (boolean): Allow selecting/uploading multiple files when true (default: true)
- `showPreview` (boolean): Display thumbnail/preview for image files (default: true)
- `required` (boolean): Mark field as required (default: false)
- `disabled` (boolean): Disable the component when true (default: false)
- `autoUpload` (boolean): Automatically start upload when files are selected (default: true)

**Key Outputs:**
- `(uploadStart)`: Emitted when user selects a file, passes the File object
- `(uploadProgress)`: Emitted repeatedly during upload with progress percentage (0-100) and file name
- `(uploadComplete)`: Emitted when upload finishes successfully, includes file object and server response with URL, original filename, and relative path
- `(uploadError)`: Emitted if upload fails due to network error or server error, includes file object and error message
- `(fileSelected)`: Emitted when file picker or drag-drop completes file selection

**How It Works:**

**File Selection:**
Users can select files in two ways: (1) click the "browse" link to open a native file picker, or (2) drag files directly onto the drag-drop zone. The component validates each file immediately:
- Checks if file extension is in the allowed list
- Checks if file size exceeds the maximum size limit
- If validation fails, shows red error message below the file name; no upload occurs
- If validation passes and autoUpload is true, begins upload automatically

**Upload Process:**
When upload starts, the file enters the "uploading" state and a progress bar appears. The progress bar width animates from 0% to 100% as the server reports upload progress via HTTP progress events. During upload, the user can click a "Cancel" button to abort the request.

**Upload Completion:**
When the server responds with success, the component transition to "success" state with a checkmark icon. The server response includes the permanent URL where the file is stored, which is passed to the parent component via the `uploadComplete` event. The user can click "Download" to retrieve the file or "Remove" to delete it from the list.

**Error Handling:**
If upload fails (network error, server error, file too large on server side), the component shows an error message in red. The user can click "Retry" to attempt the upload again, or "Remove" to delete from the list.

**Image Preview:**
When `showPreview` is true and the uploaded file is an image, a thumbnail is generated and displayed before the filename. This allows users to visually confirm they selected the correct image before upload completes.

**Customization by Use Case:**
The component is designed to be reusable for different parts of the system by changing the `folder`, `allowedExtensions`, and `maxFileSize` inputs:
- Claims upload: folder `'claim-documents'`, extensions `['pdf', 'doc', 'docx']`
- Medical records: folder `'mq-responses'`, extensions `['pdf', 'jpg', 'png']`
- Profile photos: folder `'member-photos'`, extensions `['jpg', 'jpeg', 'png']`, maxFileSize `5242880` (5 MB), `showPreview` true
- Investigation files: folder `'investigation-files'`, extensions `['pdf', 'doc', 'docx', 'jpg', 'png', 'jpeg']`
- Generic documents: folder `'uploads'`, extensions `['pdf', 'doc', 'docx', 'xls', 'xlsx']`

**Backend Integration:**
The component wraps the existing `UploadService`, which sends files via HTTP POST to `POST /common/upload` with form data containing the file and target folder. The server uses Multer middleware to validate files, enforce a 10 MB limit, and store in `/public/uploads/{folder}/`. The server response includes the stored filename, original filename, file size, MIME type, and public URL.

**Use Cases:**
- Claim document submission (medical reports, receipts, forms)
- Member profile photo upload
- Investigation documentation (notes, photos, supplementary files)
- MQ system responses and approvals
- Generic document repository uploads (invoices, contracts, spreadsheets)

---

### Data Display Components

#### DataTableComponent (`app-data-table`)
**Selector:** `<app-data-table>`  
**Module:** `standalone`

**Purpose:** Full-featured data table with typed columns, built-in filtering, pagination, sorting, stats cards, and row actions. Designed for enterprise data display.

**Key Inputs:**
- `data` (array): Array of row objects
- `columns` (array): Array of `DataTableColumn` objects defining table structure
- `stats` (array, optional): Array of `DataTableStat` objects showing KPI cards above table
- `filters` (array, optional): Array of `DataTableFilter` objects enabling filter row
- `actions` (array, optional): Array of `DataTableAction` objects for row action buttons
- `pagination` (object, optional): `DataTablePagination` config for page controls
- `sort` (object, optional): `DataTableSort` config for column sorting
- `loading` (boolean): Shows spinner while data loads
- `allowRowClick` (boolean): Enable row click events (default: true)

**DataTableColumn structure:**
```typescript
{
  key: string;           // Data property path (e.g., 'user.name')
  label: string;         // Column header text
  type?: string;         // 'text' | 'badge' | 'currency' | 'date' | 'status' | 'number' | 'boolean' | 'toggle' | 'actions' | 'custom'
  sortable?: boolean;    // Enable sorting on this column
  width?: string;        // CSS width (e.g., '200px')
  dateFormat?: string;   // Format for 'date' type
}
```

**Column Types:**
- `text`: Plain text (default)
- `badge`: Uses `app-badge` component with variant lookup
- `status`: Uses `app-status-badge` with auto colour/label resolution
- `currency`: Auto-formats with `CurrencyMyrPipe`
- `date`: Auto-formats with `DateMalayPipe`
- `number`: Right-aligned numeric display
- `boolean`: Yes/No or checkmark display
- `toggle`: Uses `app-toggle` component with active/inactive states (NEW)
- `custom`: Custom template via `<ng-content>`
- `actions`: Row action buttons

**Key Outputs:**
- `(rowClick)`: Emitted when row is clicked with row data
- `(filterChange)`: Emitted when filters change
- `(pageChange)`: Emitted when page changes
- `(actionClick)`: Emitted when action button clicked
- `(cellToggle)`: Emitted when toggle column is toggled, passes `{ row, newValue: boolean }` (NEW)

**Row Actions with Permission Support:**
```typescript
interface DataTableAction {
  id: string;              // Action identifier (e.g., 'edit', 'delete')
  title: string;           // Display label (e.g., 'Edit', 'Delete')
  iconPath: string;        // SVG path d attribute ONLY (not full <path> element)
  color: string;           // Icon colour (e.g., 'blue', 'red', 'indigo')
  permission?: string;     // Optional permission key (e.g., 'USER_MANAGEMENT.DELETE')
}
```

When `permission` is specified, the action button only displays if the user has that permission (checked via `HasPermissionDirective`). This prevents unauthorized users from seeing restricted actions.

**Features:**
- Server-side or client-side data loading
- Built-in filter row (dropdown/date/text filters)
- Pagination controls
- Colspan stat cards above table
- Column sorting
- Row selection
- Toggle column type for binary state switches (NEW)
- Permission-based action visibility (NEW)
- Loading state with spinner
- Empty state handling
- Responsive design

**Use Cases:**
- Claim tracking list with status and amount columns
- User management with role badges
- Financial dashboard with currency formatting
- Investigation list with date ranges and status filters

---

## Directives

### HasPermissionDirective (`*hasPermission`)
**Selector:** `*hasPermission`  
**Module:** `standalone`

**Purpose:** Structural directive for conditionally rendering elements based on user permissions. Prevents unauthorized UI elements from displaying to users lacking the required permission.

**Syntax:**
```html
<!-- Single permission string -->
<button *hasPermission="'MODULE.ACTION'">
  Delete
</button>

<!-- Array format for module + action -->
<button *hasPermission="['USER_MANAGEMENT', 'DELETE']">
  Delete User
</button>
```

**How It Works:**
The directive checks the user's permission context (via `PermissionService` or equivalent) against the provided permission code:
- If permission exists → element renders normally
- If permission missing → element is removed from DOM (not just hidden)

**Permission Naming Convention:**
- Format: `MODULE_CODE.ACTION_CODE`
- Examples:
  - `USER_MANAGEMENT.VIEW` — Can view users
  - `USER_MANAGEMENT.CREATE` — Can create users
  - `USER_MANAGEMENT.UPDATE` — Can edit users
  - `USER_MANAGEMENT.DELETE` — Can delete users
  - `ROLE_MANAGEMENT.ASSIGN_ROLE` — Can assign roles to users
  - `HOSPITAL_MGMT.MANAGE_ADDRESS` — Can manage hospital addresses

**DataTable Integration:**
When defining row actions in DataTableComponent, include the `permission` field:
```typescript\nrowActions: DataTableAction[] = [\n  {\n    id: 'edit',\n    title: 'Edit',\n    iconPath: 'M11 5H6a2 2 0 00-2 2v11...',\n    color: 'indigo',\n    permission: 'USER_MANAGEMENT.UPDATE'  // Action hidden if user lacks permission\n  },\n  {\n    id: 'delete',\n    title: 'Delete',\n    iconPath: 'M19 7l-.867 12.142A2...',\n    color: 'red',\n    permission: 'USER_MANAGEMENT.DELETE'  // Action hidden if user lacks permission\n  }\n];\n```\n\n**Use Cases:**\n- Hide delete buttons from non-admin users\n- Show edit option only to authorized roles\n- Hide sensitive actions based on user permissions\n- Control button visibility in data tables\n- Restrict access to form actions\n\n---\n\n## Custom Pipes\n\n### CurrencyMyrPipe (`currencyMyr`)
**Syntax:** `{{ value | currencyMyr[:decimals] }}`

**Purpose:** Formats numeric values as Malaysian Ringgit with proper thousands separators and decimal places.

**Inputs:**
- `value` (number | string | null | undefined): The value to format
- `decimals` (number, optional): Number of decimal places (default: 2)

**Output:** Formatted string

**Examples:**
- `{{ 1234.5 | currencyMyr }}` → `RM 1,234.50`
- `{{ 1000000 | currencyMyr }}` → `RM 1,000,000.00`
- `{{ 99 | currencyMyr:0 }}` → `RM 99`
- `{{ null | currencyMyr }}` → `—` (em dash for null)

**Implementation:** Uses browser's `Intl.NumberFormat('en-MY')` API for locale-aware formatting.

**Use Cases:**
- Display claim amounts in tables
- Show payment advice amounts
- Format financial statements
- Budget/ceiling displays

---

### DateMalayPipe (`dateMalay`)
**Syntax:** `{{ date | dateMalay[:format] }}`

**Purpose:** Formats dates in Malaysian style with support for 4 format variations.

**Inputs:**
- `date` (Date | string | number | null | undefined): The date to format (ISO string, timestamp, or Date object)
- `format` (string, optional): Format template (default: `'DD/MM/YYYY'`)

**Supported Formats:**
- `'DD/MM/YYYY'` → `25/03/2026`
- `'DD MMM YYYY'` → `25 Mar 2026` (month abbreviated)
- `'DD/MM/YYYY HH:mm'` → `25/03/2026 14:30`
- `'DD MMM YYYY HH:mm'` → `25 Mar 2026 14:30`

**Output:** Formatted string

**Examples:**
- `{{ dateValue | dateMalay }}` → `25/03/2026`
- `{{ dateValue | dateMalay:'DD MMM YYYY' }}` → `25 Mar 2026`
- `{{ null | dateMalay }}` → `—` (em dash for null)

**Implementation:** Custom date parser and formatter (not Angular's `DatePipe`).

**Use Cases:**
- Display admission dates
- Show claim submission dates
- Format date ranges in reports
- Time-stamped event logs (e.g., audit trail)

---

### StatusLabelPipe (`statusLabel`)
**Syntax:** `{{ statusCode | statusLabel }}`

**Purpose:** Converts CCMS SNAKE_CASE status codes to human-readable Title Case labels.

**Inputs:**
- `value` (string | null | undefined): Status code in SNAKE_CASE format

**Output:** Formatted Title Case string

**Examples:**
- `{{ 'PENDING_APPROVAL' | statusLabel }}` → `Pending Approval`
- `{{ 'IN_PROGRESS' | statusLabel }}` → `In Progress`
- `{{ 'APPROVED' | statusLabel }}` → `Approved`
- `{{ null | statusLabel }}` → `''` (empty string for null)

**Implementation:** Splits on underscore, titlecases each word, joins with spaces.

**Use Cases:**
- Display raw enum status values as human text
- Show status options in dropdowns
- Label status columns (in conjunction with `StatusBadgeComponent`)

---

## Integration Guidelines

### 1. **When to Use Which Component**

| Need | Component |
|---|---|
| **Primary action button** | `ButtonComponent` with appropriate variant |
| **Status indicator** | `StatusBadgeComponent` (auto colour/label resolve) |
| **Generic label/tag** | `BadgeComponent` with variant |
| **Binary state toggle** | `ToggleComponent` (NEW - for on/off, active/inactive) |
| **Confirmation before action** | `ConfirmDialogComponent` with appropriate variant |
| **Generic modal/dialog** | `ModalComponent` |
| **Data table display** | `DataTableComponent` with typed columns |
| **Dropdown selection** | `DropdownComponent` |
| **Date/time selection** | `DatePickerComponent` with appropriate mode |
| **Text/number input** | `TextInputComponent` with appropriate type |
| **Currency amount entry** | `TextInputComponent` with `inputType="currency"` |
| **Loading feedback** | `LoadingSpinnerComponent` or button `[loading]="true"` |
| **Success/error message** | Use `ToastService` (non-blocking) or `AlertComponent` (in-page) |
| **Page title section** | Manual title styling (no shared component yet) |
| **KPI card display** | Manual card styling (no shared component yet) |

### 2. **Import Pattern**

All UI components and pipes are exported from their respective barrels:

```typescript
// Import UI components
import {
  ButtonComponent,
  ModalComponent,
  DataTableComponent,
  TextInputComponent,
  DropdownComponent,
  DatePickerComponent,
  ConfirmDialogComponent,
  StatusBadgeComponent,
  ToggleComponent,  // NEW: Binary state toggle
  // ... other components
} from '@shared/components/ui';

// Import pipes
import {
  CurrencyMyrPipe,
  DateMalayPipe,
  StatusLabelPipe,
} from '@shared/pipes';
```

### 3. **Styling & Theming**

All components use **Tailwind CSS** with the custom **primary colour scheme:**
- `from-primary-800` = `#1e3c72` (dark navy)
- `to-primary-700` = `#2a5298` (brand blue)
- Brand buttons use gradient: `from-primary-800 to-primary-700`

Override at component level using `customClass` inputs (e.g., ButtonComponent's `customBg`, `customTextColor`).

### 4. **Form Integration**

All form control components (`TextInputComponent`, `DropdownComponent`, `DatePickerComponent`) implement Angular's `ControlValueAccessor` interface, enabling seamless integration with:
- Template-driven forms: `[(ngModel)]`
- Reactive forms: `formControl` / `formGroup`

Example:
```typescript
// Reactive form
const control = new FormControl('');
control.valueChanges.subscribe(value => console.log(value));

// Template
<app-text-input [formControl]="control" label="Amount" inputType="currency"></app-text-input>
```

### 5. **Data Table Column Configuration**

Define columns with typed column definitions:

```typescript
columns: DataTableColumn[] = [
  { key: 'id', label: 'ID', sortable: true, width: '100px' },
  { key: 'name', label: 'Name', type: 'text', sortable: true },
  { key: 'status', label: 'Status', type: 'status', sortable: false },
  { key: 'amount', label: 'Amount', type: 'currency' },
  { key: 'createdAt', label: 'Created', type: 'date', dateFormat: 'DD MMM YYYY' },
];
```

The `type` field determines rendering; `status` type auto-resolves colours and labels.

### 6. **Pipe Usage in Templates**

Pipes are available in all templates once imported in the component:

```html
<!-- Currency formatting -->
<td>{{ row.amount | currencyMyr }}</td>

<!-- Date formatting -->
<td>{{ row.createdAt | dateMalay:'DD MMM YYYY' }}</td>

<!-- Status label conversion -->
<td>{{ row.raw_status_code | statusLabel }}</td>
```

### 7. **Status Badge Colour Mapping**

The `StatusBadgeComponent` has a built-in registry covering 40+ CCMS status codes. Common mappings:

| Status Code | Colour | Label |
|---|---|---|
| `PENDING_APPROVAL` | warning/yellow | Pending Approval |
| `APPROVED` | success/green | Approved |
| `REJECTED` | danger/red | Rejected |
| `IN_PROGRESS` | primary/blue | In Progress |
| `PAID` | success/green | Paid |
| `CANCELLED` | danger/red | Cancelled |
| `DEFERRED` | warning/orange | Deferred |

Pass the raw status code; the component handles the rest:
```html
<app-status-badge [status]="row.claim_status"></app-status-badge>
```

---

## Architecture Benefits

✅ **Consistency:** All screens use the same buttons, modals, tables  
✅ **Reusability:** 3,000+ lines of duplicated code prevented through shared components  
✅ **Maintainability:** Brand changes (e.g., colour scheme) apply globally  
✅ **Accessibility:** Built-in keyboard navigation, ARIA labels, focus management  
✅ **Type Safety:** Full TypeScript interfaces for all component inputs/outputs  
✅ **Performance:** Pure pipes, lazy-loaded components, ControlValueAccessor optimization  

---

## Next Steps for Integration

When integrating these components into new screens:

1. Identify the UI patterns needed (data table? modals? forms?)
2. Import the appropriate components from `@shared/components/ui`
3. Import pipes from `@shared/pipes` if formatting is needed
4. Use the typed inputs/outputs documented above
5. Refer back to this guide for colour mappings, variants, and use cases

For AI assistants: This document should be your primary reference for understanding the component API and architectural patterns. Refer to it when suggesting component usage in feature implementations.

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.2 | 27 Mar 2026 | Added `ToggleComponent` for binary state switches; Enhanced `DataTableComponent` with toggle column type and permission-based action visibility; Added `HasPermissionDirective` documentation with permission naming conventions |
| 1.1 | — | Enhanced component documentation with use cases and integration patterns |
| 1.0 | — | Initial shared components reference document |
