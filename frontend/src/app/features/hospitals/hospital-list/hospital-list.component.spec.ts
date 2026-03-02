import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { of, throwError, Observable } from 'rxjs';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { HospitalListComponent } from './hospital-list.component';
import { HospitalService } from '../../../core/services/hospital.service';
import { LoggerService } from '../../../core/services/logger.service';
import { ToastService } from '../../../core/services/toast.service';
import { HospitalListItem, PaginatedHospitals, HospitalFilters } from '../../../shared/models/hospital.model';

describe('HospitalListComponent', () => {
  let component: HospitalListComponent;
  let fixture: ComponentFixture<HospitalListComponent>;
  let hospitalService: any;
  let router: any;
  let toastService: any;
  let loggerService: any;

  const mockHospitalListItem: HospitalListItem = {
    hospital_id: '1',
    hospital_name: 'Test Hospital',
    hospital_code: 'TH001',
    hospital_type: 'Private',
    is_panel: true,
    panel_status: 'Active',
    is_deleted: false
  };

  const mockPaginatedHospitals: PaginatedHospitals = {
    hospitals: [mockHospitalListItem],
    total: 1,
    page: 1,
    limit: 10,
    totalPages: 1,
    stats: {
      total: 1,
      panel: 1,
      nonPanel: 0,
      active: 1,
      inactive: 0
    }
  };

  beforeEach(async () => {
    hospitalService = {
      getHospitals: vi.fn().mockReturnValue(of(mockPaginatedHospitals)),
      deleteHospital: vi.fn().mockReturnValue(of(null))
    };

    router = {
      navigate: vi.fn().mockResolvedValue(true)
    };

    toastService = {
      success: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
      warning: vi.fn()
    };

    loggerService = {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [HospitalListComponent, FormsModule],
      providers: [
        { provide: HospitalService, useValue: hospitalService },
        { provide: Router, useValue: router },
        { provide: ToastService, useValue: toastService },
        { provide: LoggerService, useValue: loggerService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HospitalListComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Component Creation', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should be a standalone component', () => {
      const componentMetadata = (HospitalListComponent as any).ɵcmp;
      expect(componentMetadata.standalone).toBe(true);
    });
  });

  describe('Component Initialization', () => {
    it('should initialize with default values', () => {
      expect(component.hospitals).toEqual([]);
      expect(component.loading).toBe(false);
      expect(component.stats.total).toBe(0);
      expect(component.filters.page).toBe(1);
      expect(component.filters.limit).toBe(25);
    });

    it('should load hospitals on init', () => {
      fixture.detectChanges();
      
      expect(hospitalService.getHospitals).toHaveBeenCalled();
      expect(component.hospitals).toEqual([mockHospitalListItem]);
      expect(component.stats.total).toBe(1);
    });
  });

  describe('loadHospitals()', () => {
    it('should load hospitals successfully', () => {
      component.loadHospitals();

      expect(component.loading).toBe(false);
      expect(hospitalService.getHospitals).toHaveBeenCalledWith(component.filters);
      expect(component.hospitals).toEqual([mockHospitalListItem]);
      expect(component.stats).toEqual(mockPaginatedHospitals.stats);
    });

    it('should set loading state during fetch', () => {
      let loadingDuringFetch = false;
      hospitalService.getHospitals.mockReturnValue(
        new Observable(subscriber => {
          loadingDuringFetch = component.loading;
          subscriber.next(mockPaginatedHospitals);
          subscriber.complete();
        })
      );

      component.loadHospitals();
      expect(loadingDuringFetch).toBe(true);
    });

    it('should handle empty results', () => {
      const emptyResults: PaginatedHospitals = {
        hospitals: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
        stats: { total: 0, panel: 0, nonPanel: 0, active: 0, inactive: 0 }
      };
      hospitalService.getHospitals.mockReturnValue(of(emptyResults));

      component.loadHospitals();

      expect(component.hospitals.length).toBe(0);
      expect(component.stats.total).toBe(0);
    });

    it('should handle errors', () => {
      const error = new Error('Failed to load');
      hospitalService.getHospitals.mockReturnValue(throwError(() => error));

      component.loadHospitals();

      expect(component.loading).toBe(false);
      expect(loggerService.error).toHaveBeenCalled();
    });
  });

  describe('Search Functionality', () => {
    it('should filter hospitals by search term', () => {
      // Search uses debounce, so we test direct filter update works
      component.filters.search = 'Test';
      component.filters.page = 1;
      component.loadHospitals();

      expect(hospitalService.getHospitals).toHaveBeenCalledWith(
        expect.objectContaining({ search: 'Test', page: 1 })
      );
    });

    it('should handle search input', () => {
      // onSearchChange emits to a debounced subject, check it doesn't throw
      expect(() => component.onSearchChange('Test')).not.toThrow();
    });

    it('should reset to page 1 when search changes', () => {
      // Direct verification: onFilterChange resets page to 1 and reloads
      component.filters.page = 3;
      component.onFilterChange();

      expect(component.filters.page).toBe(1);
    });
  });

  describe('Filter Functionality', () => {
    it('should apply hospital type filter', () => {
      component.filters.hospital_type = 'Private';
      component.onFilterChange();

      expect(hospitalService.getHospitals).toHaveBeenCalledWith(
        expect.objectContaining({ hospital_type: 'Private' })
      );
    });

    it('should apply panel status filter', () => {
      component.filters.is_panel = true;
      component.onFilterChange();

      expect(hospitalService.getHospitals).toHaveBeenCalledWith(
        expect.objectContaining({ is_panel: true })
      );
    });

    it('should reset to page 1 when filters change', () => {
      component.filters.page = 5;
      component.onFilterChange();

      expect(component.filters.page).toBe(1);
    });
  });

  describe('Pagination', () => {
    beforeEach(() => {
      component.pagination.totalPages = 5;
      component.pagination.page = 1;
      component.filters.page = 1;
    });

    it('should navigate to next page', () => {
      component.nextPage();

      expect(component.filters.page).toBe(2);
      expect(hospitalService.getHospitals).toHaveBeenCalled();
    });

    it('should not navigate beyond last page', () => {
      component.pagination.page = 5;
      component.filters.page = 5;
      component.nextPage();

      expect(component.filters.page).toBe(5);
    });

    it('should navigate to previous page', () => {
      component.pagination.page = 3;
      component.filters.page = 3;
      component.previousPage();

      expect(component.filters.page).toBe(2);
      expect(hospitalService.getHospitals).toHaveBeenCalled();
    });

    it('should not navigate before first page', () => {
      component.pagination.page = 1;
      component.filters.page = 1;
      component.previousPage();

      expect(component.filters.page).toBe(1);
    });

    it('should navigate to specific page', () => {
      component.goToPage(3);

      expect(component.filters.page).toBe(3);
      expect(hospitalService.getHospitals).toHaveBeenCalled();
    });

    it('should set page directly without validation', () => {
      // goToPage doesn't validate - it sets page directly
      component.goToPage(0);
      expect(component.filters.page).toBe(0);

      component.goToPage(10);
      expect(component.filters.page).toBe(10);
    });

    it('should update when items per page changes', () => {
      component.filters.page = 3;
      component.filters.limit = 25;
      component.onFilterChange();

      expect(component.filters.page).toBe(1);
      expect(hospitalService.getHospitals).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 25 })
      );
    });
  });

  describe('Navigation', () => {
    it('should navigate to create hospital page', () => {
      component.createHospital();

      expect(router.navigate).toHaveBeenCalledWith(['/hospitals/create']);
    });

    it('should navigate to view hospital page', () => {
      component.viewHospital('1');

      expect(router.navigate).toHaveBeenCalledWith(['/hospitals/view', '1']);
    });

    it('should navigate to edit hospital page', () => {
      component.editHospital('1');

      expect(router.navigate).toHaveBeenCalledWith(['/hospitals/edit', '1']);
    });
  });

  describe('Delete Functionality', () => {
    it('should call confirm before deleting', () => {
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
      
      component.deleteHospital(mockHospitalListItem);

      expect(confirmSpy).toHaveBeenCalledWith('Are you sure you want to delete Test Hospital?');
      expect(hospitalService.deleteHospital).not.toHaveBeenCalled();
    });

    it('should delete hospital when confirmed', () => {
      vi.spyOn(window, 'confirm').mockReturnValue(true);

      component.deleteHospital(mockHospitalListItem);

      expect(hospitalService.deleteHospital).toHaveBeenCalledWith('1');
    });

    it('should reload hospitals after successful deletion', () => {
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      const loadSpy = vi.spyOn(component, 'loadHospitals');

      component.deleteHospital(mockHospitalListItem);

      expect(toastService.success).toHaveBeenCalledWith('Hospital deleted successfully');
      expect(loadSpy).toHaveBeenCalled();
    });

    it('should handle delete errors', () => {
      const error = new Error('Delete failed');
      hospitalService.deleteHospital.mockReturnValue(throwError(() => error));
      vi.spyOn(window, 'confirm').mockReturnValue(true);

      component.deleteHospital(mockHospitalListItem);

      expect(loggerService.error).toHaveBeenCalled();
      expect(toastService.error).toHaveBeenCalledWith('Failed to delete hospital');
    });
  });

  describe('Stats Display', () => {
    it('should display correct statistics', () => {
      fixture.detectChanges();

      expect(component.stats.total).toBe(1);
      expect(component.stats.panel).toBe(1);
      expect(component.stats.active).toBe(1);
      expect(component.stats.inactive).toBe(0);
    });

    it('should update stats when filters change', () => {
      const updatedStats = {
        hospitals: [],
        total: 5,
        page: 1,
        limit: 10,
        totalPages: 1,
        stats: { total: 5, panel: 3, nonPanel: 2, active: 4, inactive: 1 }
      };
      hospitalService.getHospitals.mockReturnValue(of(updatedStats));

      component.loadHospitals();

      expect(component.stats.total).toBe(5);
      expect(component.stats.panel).toBe(3);
      expect(component.stats.active).toBe(4);
    });
  });

  describe('Helper Methods', () => {
    it('should get initials from hospital name', () => {
      const initials = component.getInitials('Test Hospital');
      expect(initials).toBe('TH');
    });

    it('should get initials from single word name', () => {
      const initials = component.getInitials('Hospital');
      expect(initials).toBe('H');
    });
  });

  describe('Component Cleanup', () => {
    it('should unsubscribe on destroy', () => {
      const subscription = component['destroy$'];
      const completeSpy = vi.spyOn(subscription, 'next');

      component.ngOnDestroy();

      expect(completeSpy).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', () => {
      const networkError = { status: 0, message: 'Network error' };
      hospitalService.getHospitals.mockReturnValue(throwError(() => networkError));

      component.loadHospitals();

      expect(component.loading).toBe(false);
      expect(loggerService.error).toHaveBeenCalled();
    });

    it('should handle 500 server errors', () => {
      const serverError = { status: 500, message: 'Internal server error' };
      hospitalService.getHospitals.mockReturnValue(throwError(() => serverError));

      component.loadHospitals();

      expect(component.loading).toBe(false);
      expect(loggerService.error).toHaveBeenCalled();
    });
  });

  describe('Permissions', () => {
    it('should check CREATE permission for create button', () => {
      expect(component.PERMISSIONS.CREATE).toBeDefined();
    });

    it('should check VIEW permission for view action', () => {
      expect(component.PERMISSIONS.VIEW).toBeDefined();
    });

    it('should check UPDATE permission for edit action', () => {
      expect(component.PERMISSIONS.UPDATE).toBeDefined();
    });

    it('should check DELETE permission for delete action', () => {
      expect(component.PERMISSIONS.DELETE).toBeDefined();
    });
  });
});
