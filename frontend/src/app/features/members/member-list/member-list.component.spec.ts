import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { MemberListComponent } from './member-list.component';
import { MemberService } from '../../../core/services/member.service';
import { LoggerService } from '../../../core/services/logger.service';
import { ToastService } from '../../../core/services/toast.service';
import { MemberListItem } from '../../../shared/models/member.model';

describe('MemberListComponent', () => {
  let component: MemberListComponent;
  let fixture: ComponentFixture<MemberListComponent>;
  let mockMemberService: any;
  let mockRouter: any;
  let mockLogger: any;
  let mockToast: any;

  const mockMembers: MemberListItem[] = [
    {
      member_id: '1',
      full_name: 'John Doe',
      ic_no: '900101011234',
      member_type: 'Principal',
      enrollment_date: '2024-01-01',
      is_deleted: false
    },
    {
      member_id: '2',
      full_name: 'Jane Doe',
      ic_no: '900202021234',
      member_type: 'Dependent',
      enrollment_date: '2024-01-02',
      is_deleted: false
    }
  ];

  const mockPaginatedResponse = {
    members: mockMembers,
    page: 1,
    limit: 25,
    total: 2,
    totalPages: 1,
    total_members: 2,
    active_members: 2,
    deleted_members: 0
  };

  beforeEach(async () => {
    mockMemberService = {
      getMembers: vi.fn().mockReturnValue(of(mockPaginatedResponse)),
      deleteMember: vi.fn().mockReturnValue(of(void 0)),
      restoreMember: vi.fn().mockReturnValue(of(void 0))
    };

    mockRouter = {
      navigate: vi.fn()
    };

    mockLogger = {
      info: vi.fn(),
      error: vi.fn()
    };

    mockToast = {
      success: vi.fn(),
      error: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [MemberListComponent],
      providers: [
        { provide: MemberService, useValue: mockMemberService },
        { provide: Router, useValue: mockRouter },
        { provide: LoggerService, useValue: mockLogger },
        { provide: ToastService, useValue: mockToast }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MemberListComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should load members on initialization', () => {
      mockMemberService.getMembers.mockReturnValue(of(mockPaginatedResponse));

      component.ngOnInit();

      expect(mockMemberService.getMembers).toHaveBeenCalledWith(component.filters);
      expect(component.members).toEqual(mockMembers);
      expect(component.loading).toBe(false);
    });

    it('should setup search debouncing', async () => {
      // Verify that onSearchChange updates the search filter via debouncing
      component.ngOnInit();

      // Trigger search changes
      component.onSearchChange('John');
      // Immediately check - should not have updated yet (debouncing)
      expect(component.filters.search).toBe('');

      // Wait for debounce time
      await new Promise(resolve => setTimeout(resolve, 350));
      
      // After debounce, filter should be updated
      expect(component.filters.search).toBe('John');
    });
  });

  describe('loadMembers', () => {
    it('should load members successfully', () => {
      mockMemberService.getMembers.mockReturnValue(of(mockPaginatedResponse));

      component.loadMembers();

      expect(component.loading).toBe(false);
      expect(component.members).toEqual(mockMembers);
      expect(component.stats.total).toBe(2);
      expect(component.stats.active).toBe(2);
      expect(component.stats.deleted).toBe(0);
    });

    it('should handle load error', () => {
      const error = new Error('Load failed');
      mockMemberService.getMembers.mockReturnValue(throwError(() => error));

      component.loadMembers();

      expect(component.loading).toBe(false);
      expect(mockLogger.error).toHaveBeenCalledWith('Error loading members:', error);
      expect(mockToast.error).toHaveBeenCalledWith('Failed to load members');
    });

    it('should calculate stats from members when not provided', () => {
      const responseWithoutStats = {
        ...mockPaginatedResponse,
        total_members: undefined,
        active_members: undefined,
        deleted_members: undefined
      };
      mockMemberService.getMembers.mockReturnValue(of(responseWithoutStats));

      component.loadMembers();

      expect(component.stats.total).toBe(2);
      expect(component.stats.active).toBe(2);
      expect(component.stats.deleted).toBe(0);
    });
  });

  describe('onSearchChange', () => {
    it('should trigger search subject', () => {
      vi.spyOn(component['searchSubject$'], 'next');

      component.onSearchChange('test');

      expect(component['searchSubject$'].next).toHaveBeenCalledWith('test');
    });
  });

  describe('onFilterChange', () => {
    it('should reset page to 1 and reload members', () => {
      mockMemberService.getMembers.mockReturnValue(of(mockPaginatedResponse));
      component.filters.page = 3;

      component.onFilterChange();

      expect(component.filters.page).toBe(1);
      expect(mockMemberService.getMembers).toHaveBeenCalled();
    });
  });

  describe('Navigation', () => {
    it('should navigate to create member page', () => {
      component.createMember();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/members/create']);
    });

    it('should navigate to view member page', () => {
      component.viewMember('1');

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/members', '1']);
    });

    it('should navigate to edit member page', () => {
      component.editMember('1');

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/members', '1', 'edit']);
    });
  });

  describe('deleteMember', () => {
    beforeEach(() => {
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      mockMemberService.deleteMember.mockReturnValue(of(void 0));
      mockMemberService.getMembers.mockReturnValue(of(mockPaginatedResponse));
    });

    it('should delete member successfully', () => {
      const member = mockMembers[0];

      component.deleteMember(member);

      expect(window.confirm).toHaveBeenCalledWith(`Are you sure you want to delete ${member.full_name}?`);
      expect(mockMemberService.deleteMember).toHaveBeenCalledWith(member.member_id);
      expect(mockToast.success).toHaveBeenCalledWith('Member deleted successfully');
      expect(mockMemberService.getMembers).toHaveBeenCalled();
    });

    it('should not delete if not confirmed', () => {
      (window.confirm as any).mockReturnValue(false);

      component.deleteMember(mockMembers[0]);

      expect(mockMemberService.deleteMember).not.toHaveBeenCalled();
    });

    it('should handle delete error', () => {
      const error = new Error('Delete failed');
      mockMemberService.deleteMember.mockReturnValue(throwError(() => error));

      component.deleteMember(mockMembers[0]);

      expect(component.loading).toBe(false);
      expect(mockLogger.error).toHaveBeenCalledWith('Error deleting member:', error);
      expect(mockToast.error).toHaveBeenCalledWith('Failed to delete member');
    });
  });

  describe('restoreMember', () => {
    beforeEach(() => {
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      mockMemberService.restoreMember.mockReturnValue(of(void 0));
      mockMemberService.getMembers.mockReturnValue(of(mockPaginatedResponse));
    });

    it('should restore member successfully', () => {
      const member = { ...mockMembers[0], is_deleted: true };

      component.restoreMember(member);

      expect(window.confirm).toHaveBeenCalledWith(`Are you sure you want to restore ${member.full_name}?`);
      expect(mockMemberService.restoreMember).toHaveBeenCalledWith(member.member_id);
      expect(mockToast.success).toHaveBeenCalledWith('Member restored successfully');
      expect(mockMemberService.getMembers).toHaveBeenCalled();
    });

    it('should not restore if not confirmed', () => {
      (window.confirm as any).mockReturnValue(false);

      component.restoreMember({ ...mockMembers[0], is_deleted: true });

      expect(mockMemberService.restoreMember).not.toHaveBeenCalled();
    });

    it('should handle restore error', () => {
      const error = new Error('Restore failed');
      mockMemberService.restoreMember.mockReturnValue(throwError(() => error));

      component.restoreMember(mockMembers[0]);

      expect(component.loading).toBe(false);
      expect(mockLogger.error).toHaveBeenCalledWith('Error restoring member:', error);
      expect(mockToast.error).toHaveBeenCalledWith('Failed to restore member');
    });
  });

  describe('getInitials', () => {
    it('should return initials for full name', () => {
      expect(component.getInitials('John Doe')).toBe('JD');
    });

    it('should handle single name', () => {
      expect(component.getInitials('John')).toBe('JO');
    });

    it('should handle empty name', () => {
      expect(component.getInitials('')).toBe('??');
    });

    it('should limit to 2 characters', () => {
      expect(component.getInitials('John Paul Smith')).toBe('JP');
    });
  });

  describe('Pagination', () => {
    beforeEach(() => {
      mockMemberService.getMembers.mockReturnValue(of(mockPaginatedResponse));
      component.pagination = {
        page: 2,
        limit: 25,
        total: 100,
        totalPages: 4
      };
      component.filters.page = 2; // Sync filters.page with pagination.page
    });

    it('should go to previous page', () => {
      component.previousPage();

      expect(component.filters.page).toBe(1);
      expect(mockMemberService.getMembers).toHaveBeenCalled();
    });

    it('should not go below page 1', () => {
      component.pagination.page = 1;
      component.filters.page = 1; // Sync filters with pagination

      component.previousPage();

      expect(component.filters.page).toBe(1);
    });

    it('should go to next page', () => {
      component.nextPage();

      expect(component.filters.page).toBe(3);
      expect(mockMemberService.getMembers).toHaveBeenCalled();
    });

    it('should not exceed total pages', () => {
      component.pagination.page = 4;
      component.filters.page = 4; // Sync filters with pagination

      component.nextPage();

      expect(component.filters.page).toBe(4);
    });

    it('should go to specific page', () => {
      component.goToPage(3);

      expect(component.filters.page).toBe(3);
      expect(mockMemberService.getMembers).toHaveBeenCalled();
    });

    it('should generate page numbers correctly', () => {
      const pages = component.getPageNumbers();

      expect(pages.length).toBeLessThanOrEqual(5);
      expect(pages).toContain(component.pagination.page);
    });

    it('should calculate start index correctly', () => {
      expect(component.getStartIndex()).toBe(26); // (2-1)*25 + 1
    });

    it('should calculate end index correctly', () => {
      expect(component.getEndIndex()).toBe(50); // min(2*25, 100)
    });

    it('should not exceed total for end index', () => {
      component.pagination.page = 4;
      component.pagination.total = 90;

      expect(component.getEndIndex()).toBe(90); // min(4*25, 90) = 90
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete destroy subject', () => {
      vi.spyOn(component['destroy$'], 'next');
      vi.spyOn(component['destroy$'], 'complete');

      component.ngOnDestroy();

      expect(component['destroy$'].next).toHaveBeenCalled();
      expect(component['destroy$'].complete).toHaveBeenCalled();
    });
  });
});
