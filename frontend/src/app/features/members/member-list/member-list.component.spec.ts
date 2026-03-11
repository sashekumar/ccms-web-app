import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { MemberListComponent } from './member-list.component';
import { MemberService } from '../../../core/services/member.service';
import { LoggerService } from '../../../core/services/logger.service';
import { ToastService } from '../../../core/services/toast.service';
import { MemberListItem } from '../../../shared/models/member.model';
import { PERMISSIONS } from '../../../core/constants/permissions.constants';

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

  describe('Pagination Edge Cases', () => {
    beforeEach(() => {
      mockMemberService.getMembers.mockReturnValue(of(mockPaginatedResponse));
    });

    it('should handle single page scenario', () => {
      component.pagination = {
        page: 1,
        limit: 25,
        total: 10,
        totalPages: 1
      };

      const pages = component.getPageNumbers();

      expect(pages).toEqual([1]);
      expect(component.pagination.page).toBe(1);
    });

    it('should handle empty results pagination', () => {
      const emptyResponse = {
        ...mockPaginatedResponse,
        members: [],
        total: 0,
        totalPages: 0
      };
      mockMemberService.getMembers.mockReturnValue(of(emptyResponse));

      component.loadMembers();

      expect(component.pagination.totalPages).toBe(0);
      expect(component.members.length).toBe(0);
    });

    it('should handle last page with partial results', () => {
      component.pagination = {
        page: 4,
        limit: 25,
        total: 85,
        totalPages: 4
      };

      expect(component.getEndIndex()).toBe(85);
      expect(component.getStartIndex()).toBe(76);
    });

    it('should generate page numbers for less than 5 pages', () => {
      component.pagination = {
        page: 2,
        limit: 25,
        total: 75,
        totalPages: 3
      };

      const pages = component.getPageNumbers();

      expect(pages).toEqual([1, 2, 3]);
    });

    it('should generate page numbers at start boundary', () => {
      component.pagination = {
        page: 1,
        limit: 25,
        total: 200,
        totalPages: 8
      };

      const pages = component.getPageNumbers();

      expect(pages).toEqual([1, 2, 3, 4, 5]);
      expect(pages[0]).toBe(1);
    });

    it('should generate page numbers at end boundary', () => {
      component.pagination = {
        page: 8,
        limit: 25,
        total: 200,
        totalPages: 8
      };

      const pages = component.getPageNumbers();

      expect(pages).toEqual([4, 5, 6, 7, 8]);
      expect(pages[pages.length - 1]).toBe(8);
    });

    it('should center page numbers around current page', () => {
      component.pagination = {
        page: 5,
        limit: 25,
        total: 250,
        totalPages: 10
      };

      const pages = component.getPageNumbers();

      expect(pages).toEqual([3, 4, 5, 6, 7]);
      expect(pages[2]).toBe(component.pagination.page);
    });
  });

  describe('Filter Combinations', () => {
    beforeEach(() => {
      mockMemberService.getMembers.mockReturnValue(of(mockPaginatedResponse));
    });

    it('should filter by search and member type', () => {
      component.filters.search = 'John';
      component.filters.member_type = 'Principal';

      component.onFilterChange();

      expect(mockMemberService.getMembers).toHaveBeenCalledWith(
        expect.objectContaining({
          search: 'John',
          member_type: 'Principal',
          page: 1
        })
      );
    });

    it('should filter by search and status', () => {
      component.filters.search = 'Doe';
      component.filters.is_deleted = false;

      component.onFilterChange();

      expect(mockMemberService.getMembers).toHaveBeenCalledWith(
        expect.objectContaining({
          search: 'Doe',
          is_deleted: false,
          page: 1
        })
      );
    });

    it('should filter by member type and status', () => {
      component.filters.member_type = 'Dependent';
      component.filters.is_deleted = true;

      component.onFilterChange();

      expect(mockMemberService.getMembers).toHaveBeenCalledWith(
        expect.objectContaining({
          member_type: 'Dependent',
          is_deleted: true,
          page: 1
        })
      );
    });

    it('should apply all filters together', () => {
      component.filters = {
        search: 'Test',
        member_type: 'Principal',
        is_deleted: false,
        page: 1,
        limit: 50
      };

      component.onFilterChange();

      expect(mockMemberService.getMembers).toHaveBeenCalledWith(
        expect.objectContaining({
          search: 'Test',
          member_type: 'Principal',
          is_deleted: false,
          limit: 50
        })
      );
    });

    it('should clear member type filter', () => {
      component.filters.member_type = 'Principal';
      component.onFilterChange();

      component.filters.member_type = undefined;
      component.onFilterChange();

      expect(mockMemberService.getMembers).toHaveBeenLastCalledWith(
        expect.objectContaining({
          member_type: undefined
        })
      );
    });

    it('should reset page when changing limit', () => {
      component.filters.page = 3;
      component.filters.limit = 50;

      component.onFilterChange();

      expect(component.filters.page).toBe(1);
    });
  });

  describe('Error Scenarios', () => {
    it('should handle network timeout gracefully', () => {
      const timeoutError = { name: 'TimeoutError', message: 'Request timeout' };
      mockMemberService.getMembers.mockReturnValue(throwError(() => timeoutError));

      component.loadMembers();

      expect(component.loading).toBe(false);
      expect(mockToast.error).toHaveBeenCalledWith('Failed to load members');
    });

    it('should handle rapid filter changes', async () => {
      mockMemberService.getMembers.mockReturnValue(of(mockPaginatedResponse));

      component.filters.member_type = 'Principal';
      component.onFilterChange();

      component.filters.member_type = 'Dependent';
      component.onFilterChange();

      component.filters.member_type = 'Other';
      component.onFilterChange();

      // Should have called getMembers for each change
      expect(mockMemberService.getMembers).toHaveBeenCalledTimes(3);
    });

    it('should handle error during delete operation', () => {
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      const error = { error: { message: 'Cannot delete member' } };
      mockMemberService.deleteMember.mockReturnValue(throwError(() => error));

      component.deleteMember(mockMembers[0]);

      expect(component.loading).toBe(false);
      expect(mockToast.error).toHaveBeenCalledWith('Failed to delete member');
    });

    it('should handle error during restore operation', () => {
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      const error = { error: { message: 'Cannot restore member' } };
      mockMemberService.restoreMember.mockReturnValue(throwError(() => error));

      component.restoreMember(mockMembers[0]);

      expect(component.loading).toBe(false);
      expect(mockToast.error).toHaveBeenCalledWith('Failed to restore member');
    });

    it('should continue working after load error', () => {
      // First call fails
      mockMemberService.getMembers.mockReturnValueOnce(
        throwError(() => new Error('Network error'))
      );

      component.loadMembers();

      expect(component.loading).toBe(false);

      // Second call succeeds
      mockMemberService.getMembers.mockReturnValue(of(mockPaginatedResponse));

      component.loadMembers();

      expect(component.members.length).toBe(2);
      expect(component.loading).toBe(false);
    });
  });

  describe('Empty State Handling', () => {
    it('should handle empty results with active filters', () => {
      const emptyResponse = {
        ...mockPaginatedResponse,
        members: [],
        total: 0,
        totalPages: 0
      };
      mockMemberService.getMembers.mockReturnValue(of(emptyResponse));

      component.filters.search = 'NonexistentName';
      component.loadMembers();

      expect(component.members.length).toBe(0);
      expect(component.stats.total).toBe(0);
    });

    it('should handle empty results without filters', () => {
      const emptyResponse = {
        members: [],
        page: 1,
        limit: 25,
        total: 0,
        totalPages: 0,
        total_members: 0,
        active_members: 0,
        deleted_members: 0
      };
      mockMemberService.getMembers.mockReturnValue(of(emptyResponse));

      component.filters = {
        search: '',
        page: 1,
        limit: 25
      };
      component.loadMembers();

      expect(component.members.length).toBe(0);
      expect(component.stats.total).toBe(0);
      expect(component.stats.active).toBe(0);
      expect(component.stats.deleted).toBe(0);
    });

    it('should calculate stats for empty member list', () => {
      const emptyResponse = {
        members: [],
        page: 1,
        limit: 25,
        total: 0,
        totalPages: 0
      };
      mockMemberService.getMembers.mockReturnValue(of(emptyResponse));

      component.loadMembers();

      expect(component.stats.total).toBe(0);
      expect(component.stats.active).toBe(0);
      expect(component.stats.deleted).toBe(0);
    });
  });

  describe('Stats Calculation', () => {
    it('should use stats from API response when provided', () => {
      const responseWithStats = {
        ...mockPaginatedResponse,
        stats: {
          total_members: 150,
          active_members: 120,
          deleted_members: 30
        }
      };
      mockMemberService.getMembers.mockReturnValue(of(responseWithStats));

      component.loadMembers();

      expect(component.stats.total).toBe(150);
      expect(component.stats.active).toBe(120);
      expect(component.stats.deleted).toBe(30);
    });

    it('should calculate stats with only deleted members', () => {
      const deletedMembers = [
        { ...mockMembers[0], is_deleted: true },
        { ...mockMembers[1], is_deleted: true }
      ];
      const responseWithDeleted = {
        ...mockPaginatedResponse,
        members: deletedMembers
      };
      mockMemberService.getMembers.mockReturnValue(of(responseWithDeleted));

      component.loadMembers();

      expect(component.stats.active).toBe(0);
      expect(component.stats.deleted).toBe(2);
    });

    it('should calculate stats with mixed active and deleted members', () => {
      const mixedMembers = [
        { ...mockMembers[0], is_deleted: false },
        { ...mockMembers[1], is_deleted: true }
      ];
      const responseWithMixed = {
        ...mockPaginatedResponse,
        members: mixedMembers
      };
      mockMemberService.getMembers.mockReturnValue(of(responseWithMixed));

      component.loadMembers();

      expect(component.stats.active).toBe(1);
      expect(component.stats.deleted).toBe(1);
    });

    it('should fall back to total when stats are not provided', () => {
      const responseWithoutStats = {
        members: mockMembers,
        page: 1,
        limit: 25,
        total: 50,
        totalPages: 2
      };
      mockMemberService.getMembers.mockReturnValue(of(responseWithoutStats));

      component.loadMembers();

      expect(component.stats.total).toBe(50);
    });
  });

  describe('Search Functionality', () => {
    beforeEach(() => {
      mockMemberService.getMembers.mockReturnValue(of(mockPaginatedResponse));
      component.ngOnInit();
    });

    it('should handle search with special characters', async () => {
      component.onSearchChange('John\'s-Name');

      await new Promise(resolve => setTimeout(resolve, 350));

      expect(component.filters.search).toBe('John\'s-Name');
      expect(mockMemberService.getMembers).toHaveBeenCalledWith(
        expect.objectContaining({ search: 'John\'s-Name' })
      );
    });

    it('should handle search clear', async () => {
      component.onSearchChange('John');
      await new Promise(resolve => setTimeout(resolve, 350));

      component.onSearchChange('');
      await new Promise(resolve => setTimeout(resolve, 350));

      expect(component.filters.search).toBe('');
    });

    it('should debounce rapid search typing', async () => {
      const initialCallCount = mockMemberService.getMembers.mock.calls.length;
      mockMemberService.getMembers.mockClear();

      component.onSearchChange('J');
      await new Promise(resolve => setTimeout(resolve, 100));
      
      component.onSearchChange('Jo');
      await new Promise(resolve => setTimeout(resolve, 100));
      
      component.onSearchChange('Joh');
      await new Promise(resolve => setTimeout(resolve, 100));
      
      component.onSearchChange('John');

      // Wait for debounce
      await new Promise(resolve => setTimeout(resolve, 350));

      // Should call only once with final value after debounce
      expect(mockMemberService.getMembers).toHaveBeenCalledWith(
        expect.objectContaining({ search: 'John' })
      );
    });

    it('should reset page to 1 when searching', async () => {
      component.filters.page = 5;

      component.onSearchChange('Test');
      await new Promise(resolve => setTimeout(resolve, 350));

      expect(component.filters.page).toBe(1);
    });

    it('should handle search with numbers', async () => {
      component.onSearchChange('900101011234');

      await new Promise(resolve => setTimeout(resolve, 350));

      expect(component.filters.search).toBe('900101011234');
    });
  });

  describe('getInitials Edge Cases', () => {
    it('should handle names with multiple spaces', () => {
      expect(component.getInitials('John    Paul    Smith')).toBe('JP');
    });

    it('should handle names with leading/trailing spaces', () => {
      expect(component.getInitials('  John Doe  ')).toBe('JD');
    });

    it('should handle very long names', () => {
      expect(component.getInitials('Alexander Benjamin Christopher David')).toBe('AB');
    });

    it('should handle single character names', () => {
      expect(component.getInitials('A B')).toBe('AB');
    });

    it('should handle lowercase names', () => {
      expect(component.getInitials('john doe')).toBe('JD');
    });

    it('should handle names with special characters', () => {
      expect(component.getInitials('O\'Brien McDonald')).toBe('OM');
    });
  });

  describe('Component State Management', () => {
    beforeEach(() => {
      mockMemberService.getMembers.mockReturnValue(of(mockPaginatedResponse));
    });

    it('should maintain loading state during operations', () => {
      component.loading = false;

      component.loadMembers();

      expect(component.loading).toBe(false);
    });

    it('should allow multiple concurrent filter changes', () => {
      component.filters.member_type = 'Principal';
      component.onFilterChange();

      component.filters.is_deleted = false;
      component.onFilterChange();

      expect(mockMemberService.getMembers).toHaveBeenCalledTimes(2);
    });

    it('should preserve filters after successful operation', () => {
      component.filters = {
        search: 'John',
        member_type: 'Principal',
        is_deleted: false,
        page: 2,
        limit: 50
      };

      component.loadMembers();

      expect(component.filters.search).toBe('John');
      expect(component.filters.member_type).toBe('Principal');
      expect(component.filters.limit).toBe(50);
    });

    it('should update pagination after load', () => {
      const customResponse = {
        ...mockPaginatedResponse,
        page: 3,
        limit: 50,
        total: 200,
        totalPages: 4
      };
      mockMemberService.getMembers.mockReturnValue(of(customResponse));

      component.loadMembers();

      expect(component.pagination.page).toBe(3);
      expect(component.pagination.limit).toBe(50);
      expect(component.pagination.total).toBe(200);
      expect(component.pagination.totalPages).toBe(4);
    });
  });

  describe('Permission Constants', () => {
    it('should expose PERMISSIONS constant', () => {
      expect(component.PERMISSIONS).toBeDefined();
      expect(component.PERMISSIONS).toBe(PERMISSIONS.POLICY_HOLDERS);
    });
  });
});
