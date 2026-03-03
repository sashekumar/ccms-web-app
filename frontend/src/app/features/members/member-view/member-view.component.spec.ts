import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { MemberViewComponent } from './member-view.component';
import { MemberService } from '../../../core/services/member.service';
import { LoggerService } from '../../../core/services/logger.service';
import { ToastService } from '../../../core/services/toast.service';
import { Member, MemberAddress, MemberContact } from '../../../shared/models/member.model';

describe('MemberViewComponent', () => {
  let component: MemberViewComponent;
  let fixture: ComponentFixture<MemberViewComponent>;
  let mockMemberService: any;
  let mockRouter: any;
  let mockActivatedRoute: any;
  let mockLogger: any;
  let mockToast: any;

  const mockMember: Member = {
    member_id: '1',
    full_name: 'John Doe',
    ic_no: '900101011234',
    member_type: 'Principal',
    enrollment_date: '2024-01-01',
    is_deleted: false
  };

  beforeEach(async () => {
    mockMemberService = {
      getMemberById: vi.fn().mockReturnValue(of(mockMember)),
      getAddressesByMemberId: vi.fn().mockReturnValue(of([])),
      getContactsByMemberId: vi.fn().mockReturnValue(of([])),
      getPoliciesByMemberId: vi.fn().mockReturnValue(of([])),
      getDependentsByMemberId: vi.fn().mockReturnValue(of([])),
      getPECsByDependentId: vi.fn().mockReturnValue(of([])),
      createAddress: vi.fn().mockReturnValue(of('addr123')),
      updateAddress: vi.fn().mockReturnValue(of(void 0)),
      deleteAddress: vi.fn().mockReturnValue(of(void 0)),
      setPrimaryAddress: vi.fn().mockReturnValue(of(void 0)),
      createContact: vi.fn().mockReturnValue(of('contact123')),
      updateContact: vi.fn().mockReturnValue(of(void 0)),
      deleteContact: vi.fn().mockReturnValue(of(void 0)),
      setPrimaryContact: vi.fn().mockReturnValue(of(void 0))
    };

    mockRouter = {
      navigate: vi.fn()
    };

    mockActivatedRoute = {
      snapshot: {
        paramMap: {
          get: vi.fn().mockReturnValue('1')
        }
      }
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
      imports: [MemberViewComponent],
      providers: [
        { provide: MemberService, useValue: mockMemberService },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: LoggerService, useValue: mockLogger },
        { provide: ToastService, useValue: mockToast }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MemberViewComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should load member on initialization', () => {
      component.ngOnInit();

      expect(mockMemberService.getMemberById).toHaveBeenCalledWith('1');
      expect(component.member).toEqual(mockMember);
      expect(component.loading).toBe(false);
    });

    it('should handle missing member ID', () => {
      mockActivatedRoute.snapshot.paramMap.get.mockReturnValue(null);

      component.ngOnInit();

      expect(mockToast.error).toHaveBeenCalledWith('Invalid member ID');
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/members']);
    });

    it('should handle load error', () => {
      const error = new Error('Load failed');
      mockMemberService.getMemberById.mockReturnValue(throwError(() => error));

      component.ngOnInit();

      expect(mockLogger.error).toHaveBeenCalledWith('Error loading member:', error);
      expect(mockToast.error).toHaveBeenCalledWith('Failed to load member');
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/members']);
    });
  });

  describe('Navigation', () => {
    beforeEach(() => {
      component.member = mockMember;
    });

    it('should navigate back to list', () => {
      component.goBack();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/members']);
    });

    it('should navigate to edit page', () => {
      component.editMember();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/members/edit', '1']);
    });
  });

  describe('Tab Management', () => {
    beforeEach(() => {
      component.member = mockMember;
    });

    it('should change active tab', () => {
      component.onTabChange('addresses');

      expect(component.activeTab).toBe('addresses');
    });

    it('should lazy load addresses when tab is activated', () => {
      component.onTabChange('addresses');

      expect(mockMemberService.getAddressesByMemberId).toHaveBeenCalledWith('1');
    });

    it('should lazy load contacts when tab is activated', () => {
      component.onTabChange('contacts');

      expect(mockMemberService.getContactsByMemberId).toHaveBeenCalledWith('1');
    });

    it('should not reload data if already loaded', () => {
      component.addresses = [{ address_id: '1' } as MemberAddress];
      
      component.onTabChange('addresses');

      expect(mockMemberService.getAddressesByMemberId).not.toHaveBeenCalled();
    });
  });

  describe('Address Management', () => {
    beforeEach(() => {
      component.member = mockMember;
    });

    it('should show address form for new address', () => {
      component.showAddressFormDialog();

      expect(component.showAddressForm).toBe(true);
      expect(component.editingAddress).toBeNull();
    });

    it('should show address form for editing', () => {
      const address: MemberAddress = {
        member_id: '1',
        address_id: '1',
        address_type: 'Residential',
        street_line1: '123 Main St',
        city: 'KL',
        state: 'Selangor',
        postal_code: '50000',
        country: 'Malaysia',
        is_primary: false
      };

      component.showAddressFormDialog(address);

      expect(component.showAddressForm).toBe(true);
      expect(component.editingAddress).toEqual(address);
      expect(component.addressFormData.street_line1).toBe('123 Main St');
    });

    it('should create new address', () => {
      component.addressFormData = {
        member_id: '1',
        address_type: 'Residential',
        street_line1: '456 New St',
        city: 'KL',
        state: 'Selangor',
        postal_code: '50000',
        country: 'Malaysia'
      };

      const form = { invalid: false };
      component.saveAddress(form);

      expect(mockMemberService.createAddress).toHaveBeenCalled();
    });

    it('should update existing address', () => {
      component.editingAddress = { address_id: '1', member_id: '1' } as MemberAddress;
      component.addressFormData = {
        member_id: '1',
        street_line1: 'Updated St'
      };

      const form = { invalid: false };
      component.saveAddress(form);

      expect(mockMemberService.updateAddress).toHaveBeenCalled();
    });

    it('should set primary address', () => {
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      const address: MemberAddress = {
        member_id: '1',
        address_id: '1',
        address_type: 'Residential',
        street_line1: '123 Main St',
        city: 'KL',
        state: 'Selangor',
        postal_code: '50000',
        country: 'Malaysia',
        is_primary: false
      };

      component.setPrimaryAddress(address);

      expect(mockMemberService.setPrimaryAddress).toHaveBeenCalledWith('1');
    });

    it('should not set primary if already primary', () => {
      const address: MemberAddress = {
        member_id: '1',
        address_id: '1',
        address_type: 'Residential',
        street_line1: '123 Main St',
        city: 'KL',
        state: 'Selangor',
        postal_code: '50000',
        country: 'Malaysia',
        is_primary: true
      };

      component.setPrimaryAddress(address);

      expect(mockMemberService.setPrimaryAddress).not.toHaveBeenCalled();
    });

    it('should delete address', () => {
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      const address: MemberAddress = {
        member_id: '1',
        address_id: '1',
        address_type: 'Residential',
        street_line1: '123 Main St',
        city: 'KL',
        state: 'Selangor',
        postal_code: '50000',
        country: 'Malaysia',
        is_primary: false
      };

      component.deleteAddress(address);

      expect(mockMemberService.deleteAddress).toHaveBeenCalledWith('1');
    });

    it('should cancel address form', () => {
      component.showAddressForm = true;
      component.editingAddress = { address_id: '1', member_id: '1' } as MemberAddress;

      component.cancelAddressForm();

      expect(component.showAddressForm).toBe(false);
      expect(component.editingAddress).toBeNull();
    });
  });

  describe('Contact Management', () => {
    beforeEach(() => {
      component.member = mockMember;
      mockMemberService.createContact.mockReturnValue(of('contact123'));
      mockMemberService.updateContact.mockReturnValue(of(void 0));
      mockMemberService.deleteContact.mockReturnValue(of(void 0));
      mockMemberService.setPrimaryContact.mockReturnValue(of(void 0));
    });

    it('should show contact form for new contact', () => {
      component.showContactFormDialog();

      expect(component.showContactForm).toBe(true);
      expect(component.editingContact).toBeNull();
    });

    it('should create new contact', () => {
      component.contactFormData = {
        member_id: '1',
        contact_type: 'Email',
        contact_value: 'test@example.com',
        is_primary: false
      };

      const form = { invalid: false };
      component.saveContact(form);

      expect(mockMemberService.createContact).toHaveBeenCalled();
    });

    it('should set primary contact', () => {
      const contact: MemberContact = {
        member_id: '1',
        contact_id: '1',
        contact_type: 'Email',
        contact_value: 'test@example.com',
        is_primary: false
      };

      component.setPrimaryContact(contact);

      expect(mockMemberService.setPrimaryContact).toHaveBeenCalledWith('1');
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
