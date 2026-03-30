import { Component, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  DropdownComponent,
  DropdownOption,
} from '../../shared/components/ui/dropdown/dropdown.component';
import { DatePickerComponent } from '../../shared/components/ui/date-picker/date-picker.component';
import { TextInputComponent } from '../../shared/components/ui/text-input/text-input.component';
import { ButtonComponent } from '../../shared/components/ui/button/button.component';
import { AlertComponent } from '../../shared/components/ui/alert/alert.component';
import { ProgressBarComponent } from '../../shared/components/ui/progress-bar/progress-bar.component';
import { CardComponent } from '../../shared/components/ui/card/card.component';
import { BadgeComponent } from '../../shared/components/ui/badge/badge.component';
import { StatusBadgeComponent } from '../../shared/components/ui/status-badge/status-badge.component';
import { ModalComponent } from '../../shared/components/ui/modal/modal.component';
import { ConfirmDialogComponent } from '../../shared/components/ui/confirm-dialog/confirm-dialog.component';
import { FileUploadComponent } from '../../shared/components/ui/file-upload/file-upload.component';
import { CurrencyMyrPipe } from '../../shared/pipes/currency-myr.pipe';
import { DateMalayPipe } from '../../shared/pipes/date-malay.pipe';
import { StatusLabelPipe } from '../../shared/pipes/status-label.pipe';
import { TabsComponent } from '../../shared/components/ui/tabs/tabs.component';
import { ToastService } from '../../core/services/toast.service';
import { LoadingSpinnerComponent } from '../../shared/components/ui/loading-spinner/loading-spinner.component';
import {
  DataTableComponent,
  DataTableColumn,
  DataTableFilter,
  DataTableAction,
  DataTableStat,
  DataTableSort,
  DataTablePagination,
  DataTableFilterState,
} from '../../shared/components/ui/data-table/data-table.component';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: [],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    DropdownComponent,
    DatePickerComponent,
    TextInputComponent,
    ButtonComponent,
    AlertComponent,
    ProgressBarComponent,
    CardComponent,
    BadgeComponent,
    StatusBadgeComponent,
    ModalComponent,
    ConfirmDialogComponent,
    FileUploadComponent,
    TabsComponent,
    LoadingSpinnerComponent,
    DataTableComponent,
    CurrencyMyrPipe,
    DateMalayPipe,
    StatusLabelPipe,
  ],
  providers: [ToastService],
})
export class DashboardComponent implements OnInit {
  // ── Demo dataset: small list (no search bar rendered) ──────────────────
  statusOptions: DropdownOption[] = [
    { value: 'draft', label: 'Draft' },
    { value: 'pending', label: 'Pending Review' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'completed', label: 'Completed' },
  ];

  // ── Demo dataset: large list (search bar auto-enabled > 10 items) ───────
  hospitalOptions: DropdownOption[] = [
    { value: 'hkl', label: 'Hospital Kuala Lumpur (HKL)' },
    { value: 'ppum', label: 'Pusat Perubatan Universiti Malaya (PPUM)' },
    { value: 'hukm', label: 'Hospital Universiti Kebangsaan Malaysia (HUKM)' },
    { value: 'serdang', label: 'Hospital Serdang' },
    { value: 'ampang', label: 'Hospital Ampang' },
    { value: 'putrajaya', label: 'Hospital Putrajaya' },
    { value: 'selayang', label: 'Hospital Selayang' },
    { value: 'sg_buloh', label: 'Hospital Sungai Buloh' },
    { value: 'sultanah_johor', label: 'Hospital Sultanah Aminah Johor Bahru' },
    { value: 'sultanah_muar', label: 'Hospital Sultanah Fatimah Muar' },
    { value: 'tuanku_jaafar', label: 'Hospital Tuanku Jaafar Seremban' },
    { value: 'perdana', label: 'Hospital Perdana Kota Bharu' },
    { value: 'rpz2', label: 'Hospital Raja Perempuan Zainab II' },
    { value: 'sultanah_alor', label: 'Hospital Sultanah Bahiyah Alor Setar' },
    { value: 'queen_elizabeth', label: 'Hospital Queen Elizabeth Kota Kinabalu' },
    { value: 'sarawak', label: 'Hospital Umum Sarawak' },
  ];

  // ── Demo dataset: options with a disabled entry ──────────────────────────
  roleOptions: DropdownOption[] = [
    { value: 'admin', label: 'System Administrator' },
    { value: 'processor', label: 'Claims Processor' },
    { value: 'approver', label: 'Claims Approver' },
    { value: 'auditor', label: 'Auditor' },
    { value: 'readonly', label: 'Read-only Viewer (deprecated)', disabled: true },
  ];

  // ── Bound values (dropdown) ──────────────────────────────────────────────
  selectedStatus: DropdownOption | null = null;
  selectedHospital: DropdownOption | null = null;
  selectedRole: DropdownOption | null = null;
  selectedClearable: DropdownOption | null = null;

  // ── Bound values (text input) ────────────────────────────────────────────
  textStringValue: string = '';
  textNumberValue: string = '';
  textIntegerValue: string = '';
  textDecimalValue: string = '';
  textCurrencyValue: string = '';

  // ── Bound values (date picker) ───────────────────────────────────────────
  admissionDate: string = '';
  incidentDateTime: string = '';
  claimMonth: string = '';
  currentTime: string = '';
  dateRange: string = '';
  dateOfBirthRange: string = '';
  time24: string = '';
  time12: string = '';

  // ── Min/Max dates for date picker demos ───────────────────────────────────
  minDate: Date;
  maxDate: Date;
  dischargeMinDate: Date;

  // ── Modal state ──────────────────────────────────────────────────────────
  isModalOpen: boolean = false;

  // ── Progress bar demo ────────────────────────────────────────────────────
  progress: number = 45;
  progressSmall: number = 25;
  progressLarge: number = 75;

  // ── Tabs demo ────────────────────────────────────────────────────────────
  activeTab: number = 0;
  tabItems: any[] = [
    { id: 1, label: 'Overview', content: 'This is the overview tab with summary information.' },
    { id: 2, label: 'Details', content: 'Detailed information and specifications go here.' },
    { id: 3, label: 'Settings', content: 'Configuration and settings panel.' },
  ];

  // ── Loading spinner demo ─────────────────────────────────────────────────
  isLoading: boolean = false;
  loadingSize: 'sm' | 'md' | 'lg' = 'md';

  // ── Badge colors demo ────────────────────────────────────────────────────
  badgeColors = ['green', 'red', 'blue', 'yellow', 'purple', 'gray'];

  // ── ConfirmDialog demo ───────────────────────────────────────────────────
  confirmOpen = false;
  confirmVariant: 'danger' | 'warn' | 'primary' = 'danger';
  confirmTitle = 'Delete Record';
  confirmMessage = 'This will permanently remove the record. This cannot be undone.';
  lastConfirmResult = '';

  // ── StatusBadge demo ─────────────────────────────────────────────────────
  demoStatuses = [
    'APPROVED', 'PENDING', 'PENDING_APPROVAL', 'PENDING_MQ',
    'REJECTED', 'CANCELLED', 'IN_PROGRESS', 'PROCESSING',
    'ASSIGNED', 'UNASSIGNED', 'RESOLVED', 'CLOSED',
    'ACTIVE', 'INACTIVE', 'EXPIRED', 'OPEN',
    'COMPLETED', 'DEFERRED', 'PAID', 'MQ_RESPONDED',
  ];

  // ── Pipes demo ───────────────────────────────────────────────────────────
  pipeDemoAmounts = [0, 99, 1234.5, 9999999.99, null];
  pipeDemoDates   = ['2026-01-01', '2026-03-25T14:30:00', null];
  pipeDemoStatuses = ['PENDING_APPROVAL', 'IN_PROGRESS', 'CLAIM_SUBMITTED', 'ACTIVE', null];

  // ── Event log ─────────────────────────────────────────────────────────────
  eventLog: string[] = [];

  // ── DataTable: static config ───────────────────────────────────────────
  private readonly allTableUsers = [
    { id: 1,  full_name: 'Ahmad Fadzillah bin Razak',    username: 'ahmad.fadzillah',   email: 'ahmad.fadzillah@ccms.gov.my',   is_active: true,  department: 'IT',      roles: [{ role_name: 'System Admin' }, { role_name: 'Processor' }], joined: '2024-01-15' },
    { id: 2,  full_name: 'Siti Nurhaliza bte Hassan',    username: 'siti.nurhaliza',    email: 'siti.nurhaliza@ccms.gov.my',    is_active: true,  department: 'Finance', roles: [{ role_name: 'Approver' }],                                  joined: '2024-02-20' },
    { id: 3,  full_name: 'Mohd Rizal bin Ibrahim',       username: 'mohd.rizal',        email: 'mohd.rizal@ccms.gov.my',        is_active: false, department: 'Audit',   roles: [{ role_name: 'Auditor' }],                                   joined: '2024-03-05' },
    { id: 4,  full_name: 'Nurul Ain bte Zainal',         username: 'nurul.ain',         email: 'nurul.ain@ccms.gov.my',         is_active: true,  department: 'Claims',  roles: [{ role_name: 'Processor' }],                                 joined: '2024-03-10' },
    { id: 5,  full_name: 'Haziq bin Ibrahim',            username: 'haziq.ibrahim',     email: 'haziq.ibrahim@ccms.gov.my',     is_active: true,  department: 'IT',      roles: [{ role_name: 'System Admin' }],                              joined: '2024-04-01' },
    { id: 6,  full_name: 'Fatimah bte Ismail',           username: 'fatimah.ismail',    email: 'fatimah.ismail@ccms.gov.my',    is_active: true,  department: 'Finance', roles: [{ role_name: 'Approver' }, { role_name: 'Auditor' }],         joined: '2024-04-15' },
    { id: 7,  full_name: 'Khairul Anwar bin Yusof',      username: 'khairul.anwar',     email: 'khairul.anwar@ccms.gov.my',     is_active: false, department: 'Claims',  roles: [{ role_name: 'Processor' }],                                 joined: '2024-05-02' },
    { id: 8,  full_name: 'Rohani bte Othman',            username: 'rohani.othman',     email: 'rohani.othman@ccms.gov.my',     is_active: true,  department: 'Audit',   roles: [{ role_name: 'Auditor' }],                                   joined: '2024-05-20' },
    { id: 9,  full_name: 'Syafiq bin Mohamad',           username: 'syafiq.mohamad',    email: 'syafiq.mohamad@ccms.gov.my',    is_active: true,  department: 'Claims',  roles: [{ role_name: 'Processor' }, { role_name: 'Approver' }],       joined: '2024-06-01' },
    { id: 10, full_name: 'Azizah bte Rahman',            username: 'azizah.rahman',     email: 'azizah.rahman@ccms.gov.my',     is_active: false, department: 'Finance', roles: [{ role_name: 'Approver' }],                                  joined: '2024-06-15' },
    { id: 11, full_name: 'Zulkifli bin Abdullah',        username: 'zulkifli.abdullah', email: 'zulkifli.abdullah@ccms.gov.my', is_active: true,  department: 'IT',      roles: [{ role_name: 'System Admin' }],                              joined: '2024-07-08' },
    { id: 12, full_name: 'Haslindah bte Kassim',         username: 'haslindah.kassim',  email: 'haslindah.kassim@ccms.gov.my',  is_active: true,  department: 'Claims',  roles: [{ role_name: 'Processor' }],                                 joined: '2024-07-20' },
  ];

  tableColumns: DataTableColumn[] = [
    { key: 'full_name',  label: 'User',       type: 'avatar', avatarSubKey: 'username', avatarSubPrefix: '@', sortable: true },
    { key: 'email',      label: 'Email',       sortable: true },
    { key: 'department', label: 'Department',  sortable: true },
    { key: 'is_active',  label: 'Status',      type: 'badge', badgeMap: {
        'true':  { label: 'Active',   color: 'green' },
        'false': { label: 'Inactive', color: 'gray'  },
      },
    },
    { key: 'roles',  label: 'Roles',  type: 'tags', tagLabelKey: 'role_name', tagColor: 'blue' },
    { key: 'joined', label: 'Joined', type: 'date', sortable: true },
  ];

  tableFilters: DataTableFilter[] = [
    { key: 'search',     label: 'Search',     type: 'search', placeholder: 'Search by name, username or email…' },
    { key: 'status',     label: 'Status',     type: 'select', placeholder: 'All statuses', options: [
        { value: 'true',  label: 'Active'   },
        { value: 'false', label: 'Inactive' },
      ],
    },
    { key: 'department', label: 'Department', type: 'select', placeholder: 'All departments', options: [
        { value: 'IT',      label: 'IT'      },
        { value: 'Finance', label: 'Finance' },
        { value: 'Claims',  label: 'Claims'  },
        { value: 'Audit',   label: 'Audit'   },
      ],
    },
  ];

  demoFilters: DataTableFilter[] = [
    { key: 'search',      label: 'Text Search',      type: 'search', placeholder: 'Search text…',              inputType: 'string' },
    { key: 'amount',      label: 'Amount (Currency)', type: 'search', placeholder: 'e.g., 1000.50',             inputType: 'currency', decimalPlaces: 2 },
    { key: 'quantity',    label: 'Quantity (Integer)', type: 'search', placeholder: 'e.g., 5',                  inputType: 'integer' },
    { key: 'weight',      label: 'Weight (Decimal)',   type: 'search', placeholder: 'e.g., 75.50 kg',           inputType: 'decimal', decimalPlaces: 2 },
    { key: 'price',       label: 'Price (Number)',     type: 'search', placeholder: 'e.g., 99.99',              inputType: 'number' },
  ];

  tableActions: DataTableAction[] = [
    { id: 'view',   title: 'View',   color: 'blue',   iconPath: 'M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z' },
    { id: 'edit',   title: 'Edit',   color: 'indigo', iconPath: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' },
    { id: 'delete', title: 'Delete', color: 'red',    iconPath: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' },
  ];

  tableStats: DataTableStat[] = [
    { label: 'Total Users',    value: 12, iconBg: 'bg-blue-100',   iconColor: 'text-blue-600',   iconPath: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
    { label: 'Active Users',   value:  9, iconBg: 'bg-green-100',  iconColor: 'text-green-600',  iconPath: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
    { label: 'Inactive Users', value:  3, iconBg: 'bg-gray-100',   iconColor: 'text-gray-500',   iconPath: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z' },
    { label: 'Roles Defined',  value:  4, iconBg: 'bg-purple-100', iconColor: 'text-purple-600', iconPath: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
  ];

  tableRows: any[] = [];
  tablePagination: DataTablePagination = { page: 1, limit: 5, total: 12, totalPages: 3 };

  constructor(private toast: ToastService) {
    // Set date ranges: -30 days to +30 days from today
    const today = new Date();
    this.minDate = new Date(today);
    this.minDate.setDate(today.getDate() - 30);

    this.maxDate = new Date(today);
    this.maxDate.setDate(today.getDate() + 30);

    // Discharge min: must be at least 1 day from today
    this.dischargeMinDate = new Date(today);
    this.dischargeMinDate.setDate(today.getDate() + 1);
  }

  ngOnInit(): void {
    this.onTableFilterChange({ page: 1, limit: 5 });
  }

  // ── Dropdown handlers ────────────────────────────────────────────────────

  onStatusChange(option: DropdownOption | null): void {
    this.selectedStatus = option;
    this.log(`[Status] → ${option ? `"${option.label}" (${option.value})` : 'cleared'}`);
  }

  onHospitalChange(option: DropdownOption | null): void {
    this.selectedHospital = option;
    this.log(`[Hospital] → ${option ? `"${option.label}"` : 'cleared'}`);
  }

  onRoleChange(option: DropdownOption | null): void {
    this.selectedRole = option;
    this.log(`[Role] → ${option ? `"${option.label}"` : 'cleared'}`);
  }

  onClearableChange(option: DropdownOption | null): void {
    this.selectedClearable = option;
    this.log(`[Clearable] → ${option ? `"${option.label}"` : 'cleared'}`);
  }

  onDropdownOpened(): void {
    this.log('Dropdown opened');
  }

  onDropdownClosed(): void {
    this.log('Dropdown closed');
  }

  onSearchChanged(term: string): void {
    if (term) this.log(`[Search] → "${term}"`);
  }

  // ── Date picker handlers ─────────────────────────────────────────────────

  onAdmissionDateChange(value: any): void {
    this.admissionDate = value;
    this.log(`[Admission Date] → ${value ? `"${value}"` : 'cleared'}`);
  }

  onIncidentDateTimeChange(value: any): void {
    this.incidentDateTime = value;
    this.log(`[Incident DateTime] → ${value ? `"${value}"` : 'cleared'}`);
  }

  onClaimMonthChange(value: any): void {
    this.claimMonth = value;
    this.log(`[Claim Month] → ${value ? `"${value}"` : 'cleared'}`);
  }

  onTimeChange(value: any): void {
    this.currentTime = value;
    this.log(`[Time] → ${value ? `"${value}"` : 'cleared'}`);
  }

  onDateRangeChange(value: any): void {
    this.dateRange = value;
    this.log(`[Date Range] → ${value ? `"${value}"` : 'cleared'}`);
  }

  onDateOfBirthRangeChange(value: any): void {
    this.dateOfBirthRange = value;
    this.log(`[DOB Range] → ${value ? `"${value}"` : 'cleared'}`);
  }

  onTime24Change(value: any): void {
    this.time24 = value;
    this.log(`[Time 24-hr] → ${value ? `"${value}"` : 'cleared'}`);
  }

  onTime12Change(value: any): void {
    this.time12 = value;
    this.log(`[Time 12h] → ${value ? `"${value}"` : 'cleared'}`);
  }

  onDatePickerOpened(): void {
    this.log('Date picker opened');
  }

  onDatePickerClosed(): void {
    this.log('Date picker closed');
  }

  // ── DataTable handlers ───────────────────────────────────────────────────

  onTableFilterChange(state: DataTableFilterState): void {
    let filtered = [...this.allTableUsers];

    const search = state['search'];
    if (search) {
      const q = String(search).toLowerCase();
      filtered = filtered.filter(u =>
        u.full_name.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
      );
    }

    const statusFilter = state['status'];
    if (statusFilter !== undefined && statusFilter !== null) {
      const active = statusFilter === 'true';
      filtered = filtered.filter(u => u.is_active === active);
    }

    const deptFilter = state['department'];
    if (deptFilter) {
      filtered = filtered.filter(u => u.department === deptFilter);
    }

    // Column sort
    const sortBy = state['sortBy'] as string | undefined;
    const sortDir = state['sortDir'] as 'asc' | 'desc' | undefined;
    if (sortBy) {
      const dir = sortDir === 'desc' ? -1 : 1;
      filtered = [...filtered].sort((a: any, b: any) => {
        const av = a[sortBy] ?? '';
        const bv = b[sortBy] ?? '';
        if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
        return String(av).localeCompare(String(bv), undefined, { sensitivity: 'base' }) * dir;
      });
    }

    const page = (state['page'] as number) ?? 1;
    const limit = (state['limit'] as number) ?? 5;
    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const start = (page - 1) * limit;

    this.tableRows = filtered.slice(start, start + limit);
    this.tablePagination = { page, limit, total, totalPages };
    const sortLabel = sortBy ? ` │ sort: ${sortBy} ${sortDir}` : '';
    this.log(`[Data Table] ${total} result(s), page ${page}/${totalPages}${sortLabel}`);
  }

  onTableSortChange(sort: DataTableSort | null): void {
    this.log(sort ? `[Data Table] sort → ${sort.column} ${sort.direction}` : '[Data Table] sort cleared');
  }

  onTableRowAction(event: { action: string; row: any }): void {
    this.log(`[Data Table] ${event.action} → #${event.row.id}: ${event.row.full_name}`);
  }

  onTableCreate(): void {
    this.log('[Data Table] "Add User" clicked');
  }

  // ── Button handlers ──────────────────────────────────────────────────────

  onButtonClick(variant: string): void {
    this.toast.success(`Button clicked: ${variant} variant`);
    this.log(`[Button] clicked → "${variant}" variant`);
  }

  onModalOpen(): void {
    this.isModalOpen = true;
    this.log('[Modal] opened');
  }

  onModalClose(): void {
    this.isModalOpen = false;
    this.log('[Modal] closed');
  }

  openModal(): void {
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
  }

  // ── Text input handlers ──────────────────────────────────────────────────

  onTextInputChange(value: string, type: string): void {
    this.log(`[TextInput] ${type} → "${value}"`);
  }

  // ── Progress handlers ────────────────────────────────────────────────────

  increaseProgress(): void {
    if (this.progress < 100) {
      this.progress += 10;
      this.log(`[ProgressBar] increased to ${this.progress}%`);
    }
  }

  decreaseProgress(): void {
    if (this.progress > 0) {
      this.progress -= 10;
      this.log(`[ProgressBar] decreased to ${this.progress}%`);
    }
  }

  // ── Loading spinner handlers ─────────────────────────────────────────────

  toggleLoading(): void {
    this.isLoading = !this.isLoading;
    this.log(`[LoadingSpinner] ${this.isLoading ? 'started' : 'stopped'}`);
  }

  // ── Toast notification handlers ──────────────────────────────────────────

  showSuccessToast(): void {
    this.toast.success('Operation completed successfully!');
    this.log('[Toast] success notification shown');
  }

  showErrorToast(): void {
    this.toast.error('An error occurred while processing your request.');
    this.log('[Toast] error notification shown');
  }

  showWarningToast(): void {
    this.toast.warning('Please review the information before proceeding.');
    this.log('[Toast] warning notification shown');
  }

  showInfoToast(): void {
    this.toast.info('This is informational content.');
    this.log('[Toast] info notification shown');
  }

  // ── ConfirmDialog handlers ────────────────────────────────────────────────

  openConfirm(variant: 'danger' | 'warn' | 'primary'): void {
    const configs = {
      danger:  { title: 'Delete Record',   message: 'This will permanently remove the record and all related data. This cannot be undone.' },
      warn:    { title: 'Override Limit',  message: 'You are about to override the approved claim limit. This action will be logged.' },
      primary: { title: 'Approve Claim',   message: 'Approving this claim will notify the claimant and initiate payment processing.' },
    };
    this.confirmVariant = variant;
    this.confirmTitle   = configs[variant].title;
    this.confirmMessage = configs[variant].message;
    this.confirmOpen    = true;
    this.log(`[ConfirmDialog] opened (${variant})`);
  }

  onConfirmed(): void {
    this.confirmOpen     = false;
    this.lastConfirmResult = `✓ Confirmed (${this.confirmVariant})`;
    this.log(`[ConfirmDialog] confirmed (${this.confirmVariant})`);
  }

  onCancelled(): void {
    this.confirmOpen     = false;
    this.lastConfirmResult = `✗ Cancelled`;
    this.log('[ConfirmDialog] cancelled');
  }

  // ── File upload handlers ──────────────────────────────────────────────────

  onFileUploadComplete(event: any, type: string): void {
    if (event && event.file && event.response) {
      this.toast.success(`${type} uploaded successfully!`);
      this.log(`[FileUpload] ${type} → "${event.file.name}" uploaded (${event.response.fileName})`);
    }
  }

  onFileUploadError(event: any, type: string): void {
    if (event && event.file && event.error) {
      this.toast.error(`Error uploading ${type}: ${event.error}`);
      this.log(`[FileUpload] ${type} → Error: ${event.error} (${event.file.name})`);
    }
  }

  private log(message: string): void {
    const time = new Date().toLocaleTimeString('en-MY', { hour12: false });
    this.eventLog.unshift(`${time}  ${message}`);
    if (this.eventLog.length > 10) this.eventLog.pop();
  }
}
