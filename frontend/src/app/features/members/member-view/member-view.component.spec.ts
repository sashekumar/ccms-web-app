import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError, Subject } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { MemberViewComponent } from './member-view.component';
import { MemberService } from '../../../core/services/member.service';
import { LoggerService } from '../../../core/services/logger.service';
import { ToastService } from '../../../core/services/toast.service';
import { Member, MemberAddress, MemberContact } from '../../../shared/models/member.model';
import { PermissionService } from '../../../core/services/permission.service';

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
      setPrimaryContact: vi.fn().mockReturnValue(of(void 0)),
      createPolicy: vi.fn().mockReturnValue(of('policy123')),
      updatePolicy: vi.fn().mockReturnValue(of(void 0)),
      deletePolicy: vi.fn().mockReturnValue(of(void 0)),
      createDependent: vi.fn().mockReturnValue(of('dep123')),
      updateDependent: vi.fn().mockReturnValue(of(void 0)),
      deleteDependent: vi.fn().mockReturnValue(of(void 0)),
      toggleDependentActive: vi.fn().mockReturnValue(of(void 0)),
      createPEC: vi.fn().mockReturnValue(of('pec123')),
      updatePEC: vi.fn().mockReturnValue(of(void 0)),
      deletePEC: vi.fn().mockReturnValue(of(void 0)),
      togglePECExcluded: vi.fn().mockReturnValue(of(void 0))
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
        { provide: ToastService, useValue: mockToast },
        { provide: PermissionService, useValue: {
          hasPermission: vi.fn().mockReturnValue(of(true)),
          userPermissions$: of(null)
        }}
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

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/members', '1', 'edit']);
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
    });

    it('should load contacts when tab is activated', () => {
      component.onTabChange('contacts');

      expect(mockMemberService.getContactsByMemberId).toHaveBeenCalledWith('1');
      expect(component.loadingContacts).toBe(false);
    });

    it('should handle error when loading contacts', () => {
      const error = new Error('Load contacts failed');
      mockMemberService.getContactsByMemberId.mockReturnValue(throwError(() => error));

      component.loadContacts();

      expect(mockLogger.error).toHaveBeenCalledWith('Error loading contacts:', error);
      expect(mockToast.error).toHaveBeenCalledWith('Failed to load contacts');
      expect(component.loadingContacts).toBe(false);
    });

    it('should show contact form for new contact', () => {
      component.showContactFormDialog();

      expect(component.showContactForm).toBe(true);
      expect(component.editingContact).toBeNull();
    });

    it('should show contact form for editing with populated data', () => {
      const contact: MemberContact = {
        member_id: '1',
        contact_id: '1',
        contact_type: 'Email',
        contact_value: 'test@example.com',
        is_primary: true
      };

      component.showContactFormDialog(contact);

      expect(component.showContactForm).toBe(true);
      expect(component.editingContact).toEqual(contact);
      expect(component.contactFormData.contact_type).toBe('Email');
      expect(component.contactFormData.contact_value).toBe('test@example.com');
      expect(component.contactFormData.is_primary).toBe(true);
    });

    it('should create new contact successfully', () => {
      component.contactFormData = {
        member_id: '1',
        contact_type: 'Email',
        contact_value: 'new@example.com',
        is_primary: false
      };

      const form = { invalid: false };
      component.saveContact(form);

      expect(mockMemberService.createContact).toHaveBeenCalledWith(
        expect.objectContaining({
          member_id: '1',
          contact_type: 'Email',
          contact_value: 'new@example.com'
        })
      );
      expect(mockToast.success).toHaveBeenCalledWith('Contact created successfully');
    });

    it('should handle error when creating contact', () => {
      const error = new Error('Create failed');
      mockMemberService.createContact.mockReturnValue(throwError(() => error));
      component.contactFormData = {
        member_id: '1',
        contact_type: 'Email',
        contact_value: 'test@example.com'
      };

      const form = { invalid: false };
      component.saveContact(form);

      expect(mockLogger.error).toHaveBeenCalledWith('Error creating contact:', error);
      expect(mockToast.error).toHaveBeenCalledWith('Failed to create contact');
    });

    it('should update existing contact successfully', () => {
      component.editingContact = {
        contact_id: '1',
        member_id: '1',
        contact_type: 'Email',
        contact_value: 'old@example.com',
        is_primary: false
      };
      component.contactFormData = {
        contact_type: 'Email',
        contact_value: 'updated@example.com'
      };

      const form = { invalid: false };
      component.saveContact(form);

      expect(mockMemberService.updateContact).toHaveBeenCalledWith('1', expect.objectContaining({
        contact_type: 'Email',
        contact_value: 'updated@example.com'
      }));
      expect(mockToast.success).toHaveBeenCalledWith('Contact updated successfully');
    });

    it('should handle error when updating contact', () => {
      const error = new Error('Update failed');
      mockMemberService.updateContact.mockReturnValue(throwError(() => error));
      component.editingContact = { contact_id: '1', member_id: '1' } as MemberContact;
      component.contactFormData = { contact_value: 'test@example.com' };

      const form = { invalid: false };
      component.saveContact(form);

      expect(mockLogger.error).toHaveBeenCalledWith('Error updating contact:', error);
      expect(mockToast.error).toHaveBeenCalledWith('Failed to update contact');
    });

    it('should not save contact if form is invalid', () => {
      component.contactFormData = { contact_value: 'test@example.com' };

      const form = { invalid: true };
      component.saveContact(form);

      expect(mockMemberService.createContact).not.toHaveBeenCalled();
      expect(mockMemberService.updateContact).not.toHaveBeenCalled();
    });

    it('should not save contact if member is null', () => {
      component.member = null;
      component.contactFormData = { contact_value: 'test@example.com' };

      const form = { invalid: false };
      component.saveContact(form);

      expect(mockMemberService.createContact).not.toHaveBeenCalled();
      expect(mockMemberService.updateContact).not.toHaveBeenCalled();
    });

    it('should set primary contact successfully', () => {
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      const contact: MemberContact = {
        member_id: '1',
        contact_id: '1',
        contact_type: 'Email',
        contact_value: 'test@example.com',
        is_primary: false
      };

      component.setPrimaryContact(contact);

      expect(mockMemberService.setPrimaryContact).toHaveBeenCalledWith('1');
      expect(mockToast.success).toHaveBeenCalledWith('Primary contact updated');
    });

    it('should not set primary contact if already primary', () => {
      const contact: MemberContact = {
        member_id: '1',
        contact_id: '1',
        contact_type: 'Email',
        contact_value: 'test@example.com',
        is_primary: true
      };

      component.setPrimaryContact(contact);

      expect(mockMemberService.setPrimaryContact).not.toHaveBeenCalled();
    });

    it('should not set primary contact if user cancels confirmation', () => {
      vi.spyOn(window, 'confirm').mockReturnValue(false);
      const contact: MemberContact = {
        member_id: '1',
        contact_id: '1',
        contact_type: 'Email',
        contact_value: 'test@example.com',
        is_primary: false
      };

      component.setPrimaryContact(contact);

      expect(mockMemberService.setPrimaryContact).not.toHaveBeenCalled();
    });

    it('should handle error when setting primary contact', () => {
      const error = new Error('Set primary failed');
      mockMemberService.setPrimaryContact.mockReturnValue(throwError(() => error));
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      const contact: MemberContact = {
        member_id: '1',
        contact_id: '1',
        contact_type: 'Email',
        contact_value: 'test@example.com',
        is_primary: false
      };

      component.setPrimaryContact(contact);

      expect(mockLogger.error).toHaveBeenCalledWith('Error setting primary contact:', error);
      expect(mockToast.error).toHaveBeenCalledWith('Failed to set primary contact');
    });

    it('should delete contact successfully', () => {
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      const contact: MemberContact = {
        member_id: '1',
        contact_id: '1',
        contact_type: 'Email',
        contact_value: 'test@example.com',
        is_primary: false
      };

      component.deleteContact(contact);

      expect(mockMemberService.deleteContact).toHaveBeenCalledWith('1');
      expect(mockToast.success).toHaveBeenCalledWith('Contact deleted successfully');
    });

    it('should not delete contact if user cancels confirmation', () => {
      vi.spyOn(window, 'confirm').mockReturnValue(false);
      const contact: MemberContact = {
        member_id: '1',
        contact_id: '1',
        contact_type: 'Email',
        contact_value: 'test@example.com',
        is_primary: false
      };

      component.deleteContact(contact);

      expect(mockMemberService.deleteContact).not.toHaveBeenCalled();
    });

    it('should handle error when deleting contact', () => {
      const error = new Error('Delete failed');
      mockMemberService.deleteContact.mockReturnValue(throwError(() => error));
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      const contact: MemberContact = {
        member_id: '1',
        contact_id: '1',
        contact_type: 'Email',
        contact_value: 'test@example.com',
        is_primary: false
      };

      component.deleteContact(contact);

      expect(mockLogger.error).toHaveBeenCalledWith('Error deleting contact:', error);
      expect(mockToast.error).toHaveBeenCalledWith('Failed to delete contact');
    });

    it('should cancel contact form and reset state', () => {
      component.showContactForm = true;
      component.editingContact = { contact_id: '1', member_id: '1' } as MemberContact;
      component.contactFormData = { contact_value: 'test@example.com' };

      component.cancelContactForm();

      expect(component.showContactForm).toBe(false);
      expect(component.editingContact).toBeNull();
      expect(component.contactFormData.contact_type).toBe('');
      expect(component.contactFormData.contact_value).toBe('');
    });

    it('should reset contact form with default values', () => {
      component.contactFormData = {
        contact_type: 'Phone',
        contact_value: 'test@example.com',
        is_primary: true
      };

      component.resetContactForm();

      expect(component.contactFormData.contact_type).toBe('');
      expect(component.contactFormData.contact_value).toBe('');
      expect(component.contactFormData.is_primary).toBe(false);
    });
  });

  describe('Policy Management', () => {
    beforeEach(() => {
      component.member = mockMember;
    });

    it('should load policies when tab is activated', () => {
      component.onTabChange('policies');

      expect(mockMemberService.getPoliciesByMemberId).toHaveBeenCalledWith('1');
      expect(component.loadingPolicies).toBe(false);
    });

    it('should not reload policies if already loaded', () => {
      component.policies = [{ policy_id: '1' } as any];

      component.onTabChange('policies');

      expect(mockMemberService.getPoliciesByMemberId).not.toHaveBeenCalled();
    });

    it('should handle error when loading policies', () => {
      const error = new Error('Load policies failed');
      mockMemberService.getPoliciesByMemberId.mockReturnValue(throwError(() => error));

      component.loadPolicies();

      expect(mockLogger.error).toHaveBeenCalledWith('Error loading policies:', error);
      expect(mockToast.error).toHaveBeenCalledWith('Failed to load policies');
      expect(component.loadingPolicies).toBe(false);
    });

    it('should show policy form for new policy', () => {
      component.showPolicyFormDialog();

      expect(component.showPolicyForm).toBe(true);
      expect(component.editingPolicy).toBeNull();
    });

    it('should show policy form for editing with populated data', () => {
      const policy: any = {
        policy_id: '1',
        member_id: '1',
        product_id: 'prod1',
        policy_no: 'POL123',
        effective_date: '2024-01-01',
        expiry_date: '2024-12-31'
      };

      component.showPolicyFormDialog(policy);

      expect(component.showPolicyForm).toBe(true);
      expect(component.editingPolicy).toEqual(policy);
      expect(component.policyFormData.product_id).toBe('prod1');
      expect(component.policyFormData.policy_no).toBe('POL123');
    });

    it('should create new policy successfully', () => {
      component.policyFormData = {
        member_id: '1',
        product_id: 'prod1',
        policy_no: 'POL456',
        effective_date: '2024-01-01'
      };

      const form = { invalid: false };
      component.savePolicy(form);

      expect(mockMemberService.createPolicy).toHaveBeenCalledWith(
        expect.objectContaining({
          member_id: '1',
          product_id: 'prod1',
          policy_no: 'POL456'
        })
      );
      expect(mockToast.success).toHaveBeenCalledWith('Policy created successfully');
    });

    it('should handle error when creating policy', () => {
      const error = new Error('Create failed');
      mockMemberService.createPolicy.mockReturnValue(throwError(() => error));
      component.policyFormData = {
        member_id: '1',
        product_id: 'prod1',
        policy_no: 'POL456'
      };

      const form = { invalid: false };
      component.savePolicy(form);

      expect(mockLogger.error).toHaveBeenCalledWith('Error creating policy:', error);
      expect(mockToast.error).toHaveBeenCalledWith('Failed to create policy');
    });

    it('should update existing policy successfully', () => {
      component.editingPolicy = {
        policy_id: '1',
        member_id: '1',
        product_id: 'prod1',
        policy_no: 'POL123'
      } as any;
      component.policyFormData = {
        product_id: 'prod2',
        policy_no: 'POL123-UPDATED'
      };

      const form = { invalid: false };
      component.savePolicy(form);

      expect(mockMemberService.updatePolicy).toHaveBeenCalledWith('1', expect.objectContaining({
        product_id: 'prod2',
        policy_no: 'POL123-UPDATED'
      }));
      expect(mockToast.success).toHaveBeenCalledWith('Policy updated successfully');
    });

    it('should handle error when updating policy', () => {
      const error = new Error('Update failed');
      mockMemberService.updatePolicy.mockReturnValue(throwError(() => error));
      component.editingPolicy = { policy_id: '1' } as any;
      component.policyFormData = { policy_no: 'POL123' };

      const form = { invalid: false };
      component.savePolicy(form);

      expect(mockLogger.error).toHaveBeenCalledWith('Error updating policy:', error);
      expect(mockToast.error).toHaveBeenCalledWith('Failed to update policy');
    });

    it('should not save policy if form is invalid', () => {
      component.policyFormData = { policy_no: 'POL123' };

      const form = { invalid: true };
      component.savePolicy(form);

      expect(mockMemberService.createPolicy).not.toHaveBeenCalled();
      expect(mockMemberService.updatePolicy).not.toHaveBeenCalled();
    });

    it('should not save policy if member is null', () => {
      component.member = null;
      component.policyFormData = { policy_no: 'POL123' };

      const form = { invalid: false };
      component.savePolicy(form);

      expect(mockMemberService.createPolicy).not.toHaveBeenCalled();
      expect(mockMemberService.updatePolicy).not.toHaveBeenCalled();
    });

    it('should delete policy successfully', () => {
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      const policy: any = {
        policy_id: '1',
        member_id: '1',
        product_id: 'prod1',
        policy_no: 'POL123'
      };

      component.deletePolicy(policy);

      expect(mockMemberService.deletePolicy).toHaveBeenCalledWith('1');
      expect(mockToast.success).toHaveBeenCalledWith('Policy deleted successfully');
    });

    it('should not delete policy if user cancels confirmation', () => {
      vi.spyOn(window, 'confirm').mockReturnValue(false);
      const policy: any = {
        policy_id: '1',
        member_id: '1'
      };

      component.deletePolicy(policy);

      expect(mockMemberService.deletePolicy).not.toHaveBeenCalled();
    });

    it('should handle error when deleting policy', () => {
      const error = new Error('Delete failed');
      mockMemberService.deletePolicy.mockReturnValue(throwError(() => error));
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      const policy: any = {
        policy_id: '1',
        member_id: '1'
      };

      component.deletePolicy(policy);

      expect(mockLogger.error).toHaveBeenCalledWith('Error deleting policy:', error);
      expect(mockToast.error).toHaveBeenCalledWith('Failed to delete policy');
    });

    it('should cancel policy form and reset state', () => {
      component.showPolicyForm = true;
      component.editingPolicy = { policy_id: '1' } as any;
      component.policyFormData = { policy_no: 'POL123' };

      component.cancelPolicyForm();

      expect(component.showPolicyForm).toBe(false);
      expect(component.editingPolicy).toBeNull();
      expect(component.policyFormData.policy_no).toBe('');
    });

    it('should reset policy form with default values', () => {
      component.policyFormData = {
        product_id: 'prod1',
        policy_no: 'POL123',
        effective_date: '2024-01-01'
      };

      component.resetPolicyForm();

      expect(component.policyFormData.policy_no).toBe('');
      expect(component.policyFormData.product_id).toBe('');
      expect(component.policyFormData.effective_date).toBeUndefined();
    });
  });

  describe('Dependent Management', () => {
    beforeEach(() => {
      component.member = mockMember;
    });

    it('should load dependents when tab is activated', () => {
      component.onTabChange('dependents');

      expect(mockMemberService.getDependentsByMemberId).toHaveBeenCalledWith('1');
      expect(component.loadingDependents).toBe(false);
    });

    it('should not reload dependents if already loaded', () => {
      component.dependents = [{ dependent_id: '1' } as any];

      component.onTabChange('dependents');

      expect(mockMemberService.getDependentsByMemberId).not.toHaveBeenCalled();
    });

    it('should handle error when loading dependents', () => {
      const error = new Error('Load dependents failed');
      mockMemberService.getDependentsByMemberId.mockReturnValue(throwError(() => error));

      component.loadDependents();

      expect(mockLogger.error).toHaveBeenCalledWith('Error loading dependents:', error);
      expect(mockToast.error).toHaveBeenCalledWith('Failed to load dependents');
      expect(component.loadingDependents).toBe(false);
    });

    it('should show dependent form for new dependent', () => {
      component.showDependentFormDialog();

      expect(component.showDependentForm).toBe(true);
      expect(component.editingDependent).toBeNull();
    });

    it('should show dependent form for editing with populated data', () => {
      const dependent: any = {
        dependent_id: '1',
        principal_member_id: '1',
        full_name: 'Jane Doe',
        ic_no: '950101011234',
        relationship_id: 1,
        dob: '1995-01-01',
        is_active: true
      };

      component.showDependentFormDialog(dependent);

      expect(component.showDependentForm).toBe(true);
      expect(component.editingDependent).toEqual(dependent);
      expect(component.dependentFormData.full_name).toBe('Jane Doe');
      expect(component.dependentFormData.ic_no).toBe('950101011234');
    });

    it('should create new dependent successfully', () => {
      component.dependentFormData = {
        principal_member_id: '1',
        full_name: 'New Dependent',
        ic_no: '000101011234',
        relationship_id: 1,
        is_active: true
      };

      const form = { invalid: false };
      component.saveDependent(form);

      expect(mockMemberService.createDependent).toHaveBeenCalledWith(
        expect.objectContaining({
          principal_member_id: '1',
          full_name: 'New Dependent'
        })
      );
      expect(mockToast.success).toHaveBeenCalledWith('Dependent created successfully');
    });

    it('should handle error when creating dependent', () => {
      const error = new Error('Create failed');
      mockMemberService.createDependent.mockReturnValue(throwError(() => error));
      component.dependentFormData = {
        principal_member_id: '1',
        full_name: 'New Dependent'
      };

      const form = { invalid: false };
      component.saveDependent(form);

      expect(mockLogger.error).toHaveBeenCalledWith('Error creating dependent:', error);
      expect(mockToast.error).toHaveBeenCalledWith('Failed to create dependent');
    });

    it('should update existing dependent successfully', () => {
      component.editingDependent = {
        dependent_id: '1',
        principal_member_id: '1',
        full_name: 'Old Name',
        is_active: true
      } as any;
      component.dependentFormData = {
        full_name: 'Updated Name'
      };

      const form = { invalid: false };
      component.saveDependent(form);

      expect(mockMemberService.updateDependent).toHaveBeenCalledWith('1', expect.objectContaining({
        full_name: 'Updated Name'
      }));
      expect(mockToast.success).toHaveBeenCalledWith('Dependent updated successfully');
    });

    it('should handle error when updating dependent', () => {
      const error = new Error('Update failed');
      mockMemberService.updateDependent.mockReturnValue(throwError(() => error));
      component.editingDependent = { dependent_id: '1' } as any;
      component.dependentFormData = { full_name: 'Updated Name' };

      const form = { invalid: false };
      component.saveDependent(form);

      expect(mockLogger.error).toHaveBeenCalledWith('Error updating dependent:', error);
      expect(mockToast.error).toHaveBeenCalledWith('Failed to update dependent');
    });

    it('should not save dependent if form is invalid', () => {
      component.dependentFormData = { full_name: 'Test' };

      const form = { invalid: true };
      component.saveDependent(form);

      expect(mockMemberService.createDependent).not.toHaveBeenCalled();
      expect(mockMemberService.updateDependent).not.toHaveBeenCalled();
    });

    it('should not save dependent if member is null', () => {
      component.member = null;
      component.dependentFormData = { full_name: 'Test' };

      const form = { invalid: false };
      component.saveDependent(form);

      expect(mockMemberService.createDependent).not.toHaveBeenCalled();
      expect(mockMemberService.updateDependent).not.toHaveBeenCalled();
    });

    it('should toggle dependent to inactive successfully', () => {
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      const dependent: any = {
        dependent_id: '1',
        principal_member_id: '1',
        full_name: 'Jane Doe',
        is_active: true
      };

      component.toggleDependentActive(dependent);

      expect(mockMemberService.toggleDependentActive).toHaveBeenCalledWith('1', false);
      expect(mockToast.success).toHaveBeenCalledWith('Dependent deactivated successfully');
    });

    it('should toggle dependent to active successfully', () => {
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      const dependent: any = {
        dependent_id: '1',
        principal_member_id: '1',
        full_name: 'Jane Doe',
        is_active: false
      };

      component.toggleDependentActive(dependent);

      expect(mockMemberService.toggleDependentActive).toHaveBeenCalledWith('1', true);
      expect(mockToast.success).toHaveBeenCalledWith('Dependent activated successfully');
    });

    it('should not toggle dependent if user cancels confirmation', () => {
      vi.spyOn(window, 'confirm').mockReturnValue(false);
      const dependent: any = {
        dependent_id: '1',
        is_active: true
      };

      component.toggleDependentActive(dependent);

      expect(mockMemberService.toggleDependentActive).not.toHaveBeenCalled();
    });

    it('should handle error when toggling dependent', () => {
      const error = new Error('Toggle failed');
      mockMemberService.toggleDependentActive.mockReturnValue(throwError(() => error));
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      const dependent: any = {
        dependent_id: '1',
        is_active: true
      };

      component.toggleDependentActive(dependent);

      expect(mockLogger.error).toHaveBeenCalledWith('Error deactivateing dependent:', error);
      expect(mockToast.error).toHaveBeenCalledWith('Failed to deactivate dependent');
    });

    it('should delete dependent successfully', () => {
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      const dependent: any = {
        dependent_id: '1',
        principal_member_id: '1',
        full_name: 'Jane Doe'
      };

      component.deleteDependent(dependent);

      expect(mockMemberService.deleteDependent).toHaveBeenCalledWith('1');
      expect(mockToast.success).toHaveBeenCalledWith('Dependent deleted successfully');
    });

    it('should clear PEC view when deleting selected dependent', () => {
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      const dependent: any = {
        dependent_id: '1',
        principal_member_id: '1',
        full_name: 'Jane Doe'
      };
      component.selectedDependentForPEC = dependent;
      component.pecConditions = [{ pec_id: '1' } as any];

      component.deleteDependent(dependent);

      expect(component.selectedDependentForPEC).toBeNull();
      expect(component.pecConditions).toEqual([]);
    });

    it('should not delete dependent if user cancels confirmation', () => {
      vi.spyOn(window, 'confirm').mockReturnValue(false);
      const dependent: any = {
        dependent_id: '1'
      };

      component.deleteDependent(dependent);

      expect(mockMemberService.deleteDependent).not.toHaveBeenCalled();
    });

    it('should handle error when deleting dependent', () => {
      const error = new Error('Delete failed');
      mockMemberService.deleteDependent.mockReturnValue(throwError(() => error));
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      const dependent: any = {
        dependent_id: '1'
      };

      component.deleteDependent(dependent);

      expect(mockLogger.error).toHaveBeenCalledWith('Error deleting dependent:', error);
      expect(mockToast.error).toHaveBeenCalledWith('Failed to delete dependent');
    });

    it('should cancel dependent form and reset state', () => {
      component.showDependentForm = true;
      component.editingDependent = { dependent_id: '1' } as any;
      component.dependentFormData = { full_name: 'Test' };

      component.cancelDependentForm();

      expect(component.showDependentForm).toBe(false);
      expect(component.editingDependent).toBeNull();
      expect(component.dependentFormData.full_name).toBe('');
    });

    it('should reset dependent form with default values', () => {
      component.dependentFormData = {
        full_name: 'Test',
        ic_no: '123456',
        is_active: false
      };

      component.resetDependentForm();

      expect(component.dependentFormData.full_name).toBe('');
      expect(component.dependentFormData.ic_no).toBe('');
      expect(component.dependentFormData.is_active).toBe(true);
    });
  });

  describe('PEC Management', () => {
    const mockDependent: any = {
      dependent_id: 'dep1',
      principal_member_id: '1',
      full_name: 'Jane Doe',
      is_active: true
    };

    beforeEach(() => {
      component.member = mockMember;
      component.selectedDependentForPEC = mockDependent;
    });

    it('should view dependent PEC and load conditions', () => {
      component.selectedDependentForPEC = null;

      component.viewDependentPEC(mockDependent);

      expect(component.selectedDependentForPEC).toEqual(mockDependent);
      expect(mockMemberService.getPECsByDependentId).toHaveBeenCalledWith('dep1');
    });

    it('should close PEC view and clear data', () => {
      component.pecConditions = [{ pec_id: '1' } as any];

      component.closePECView();

      expect(component.selectedDependentForPEC).toBeNull();
      expect(component.pecConditions).toEqual([]);
    });

    it('should load PEC conditions successfully', () => {
      const mockPECs: any[] = [
        { pec_id: '1', condition_code: 'C001', condition_name: 'Diabetes' }
      ];
      mockMemberService.getPECsByDependentId.mockReturnValue(of(mockPECs));

      component.loadPECConditions();

      expect(mockMemberService.getPECsByDependentId).toHaveBeenCalledWith('dep1');
      expect(component.pecConditions).toEqual(mockPECs);
      expect(component.loadingPEC).toBe(false);
    });

    it('should handle error when loading PEC conditions', () => {
      const error = new Error('Load PEC failed');
      mockMemberService.getPECsByDependentId.mockReturnValue(throwError(() => error));

      component.loadPECConditions();

      expect(mockLogger.error).toHaveBeenCalledWith('Error loading PEC conditions:', error);
      expect(mockToast.error).toHaveBeenCalledWith('Failed to load PEC conditions');
      expect(component.loadingPEC).toBe(false);
    });

    it('should not load PEC conditions if no dependent selected', () => {
      component.selectedDependentForPEC = null;

      component.loadPECConditions();

      expect(mockMemberService.getPECsByDependentId).not.toHaveBeenCalled();
    });

    it('should show PEC form for new PEC', () => {
      component.showPECFormDialog();

      expect(component.showPECForm).toBe(true);
      expect(component.editingPEC).toBeNull();
    });

    it('should show PEC form for editing with populated data', () => {
      const pec: any = {
        pec_id: '1',
        dependent_id: 'dep1',
        condition_code: 'C001',
        condition_name: 'Diabetes',
        diagnosis_date: '2020-01-01',
        is_excluded: true,
        notes: 'Test notes'
      };

      component.showPECFormDialog(pec);

      expect(component.showPECForm).toBe(true);
      expect(component.editingPEC).toEqual(pec);
      expect(component.pecFormData.condition_code).toBe('C001');
      expect(component.pecFormData.condition_name).toBe('Diabetes');
      expect(component.pecFormData.is_excluded).toBe(true);
    });

    it('should not show PEC form if no dependent selected', () => {
      component.selectedDependentForPEC = null;

      component.showPECFormDialog();

      expect(component.showPECForm).toBe(false);
    });

    it('should create new PEC successfully', () => {
      component.pecFormData = {
        dependent_id: 'dep1',
        condition_code: 'C002',
        condition_name: 'Hypertension',
        diagnosis_date: '2021-01-01',
        is_excluded: false,
        notes: 'New condition'
      };

      const form = { invalid: false };
      component.savePEC(form);

      expect(mockMemberService.createPEC).toHaveBeenCalledWith(
        expect.objectContaining({
          dependent_id: 'dep1',
          condition_code: 'C002',
          condition_name: 'Hypertension'
        })
      );
      expect(mockToast.success).toHaveBeenCalledWith('PEC condition created successfully');
    });

    it('should handle error when creating PEC', () => {
      const error = new Error('Create failed');
      mockMemberService.createPEC.mockReturnValue(throwError(() => error));
      component.pecFormData = {
        dependent_id: 'dep1',
        condition_code: 'C002'
      };

      const form = { invalid: false };
      component.savePEC(form);

      expect(mockLogger.error).toHaveBeenCalledWith('Error creating PEC:', error);
      expect(mockToast.error).toHaveBeenCalledWith('Failed to create PEC condition');
    });

    it('should update existing PEC successfully', () => {
      component.editingPEC = {
        pec_id: '1',
        dependent_id: 'dep1',
        condition_code: 'C001'
      } as any;
      component.pecFormData = {
        condition_code: 'C001',
        condition_name: 'Diabetes Type 2'
      };

      const form = { invalid: false };
      component.savePEC(form);

      expect(mockMemberService.updatePEC).toHaveBeenCalledWith('1', expect.objectContaining({
        condition_code: 'C001',
        condition_name: 'Diabetes Type 2'
      }));
      expect(mockToast.success).toHaveBeenCalledWith('PEC condition updated successfully');
    });

    it('should handle error when updating PEC', () => {
      const error = new Error('Update failed');
      mockMemberService.updatePEC.mockReturnValue(throwError(() => error));
      component.editingPEC = { pec_id: '1' } as any;
      component.pecFormData = { condition_code: 'C001' };

      const form = { invalid: false };
      component.savePEC(form);

      expect(mockLogger.error).toHaveBeenCalledWith('Error updating PEC:', error);
      expect(mockToast.error).toHaveBeenCalledWith('Failed to update PEC condition');
    });

    it('should not save PEC if form is invalid', () => {
      component.pecFormData = { condition_code: 'C001' };

      const form = { invalid: true };
      component.savePEC(form);

      expect(mockMemberService.createPEC).not.toHaveBeenCalled();
      expect(mockMemberService.updatePEC).not.toHaveBeenCalled();
    });

    it('should not save PEC if member is null', () => {
      component.member = null;
      component.pecFormData = { condition_code: 'C001' };

      const form = { invalid: false };
      component.savePEC(form);

      expect(mockMemberService.createPEC).not.toHaveBeenCalled();
      expect(mockMemberService.updatePEC).not.toHaveBeenCalled();
    });

    it('should not save PEC if no dependent selected', () => {
      component.selectedDependentForPEC = null;
      component.pecFormData = { condition_code: 'C001' };

      const form = { invalid: false };
      component.savePEC(form);

      expect(mockMemberService.createPEC).not.toHaveBeenCalled();
      expect(mockMemberService.updatePEC).not.toHaveBeenCalled();
    });

    it('should toggle PEC to excluded successfully', () => {
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      const pec: any = {
        pec_id: '1',
        dependent_id: 'dep1',
        condition_code: 'C001',
        is_excluded: false
      };

      component.togglePECExcluded(pec);

      expect(mockMemberService.togglePECExcluded).toHaveBeenCalledWith('1', true);
      expect(mockToast.success).toHaveBeenCalledWith('PEC condition excluded successfully');
    });

    it('should toggle PEC to included successfully', () => {
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      const pec: any = {
        pec_id: '1',
        dependent_id: 'dep1',
        condition_code: 'C001',
        is_excluded: true
      };

      component.togglePECExcluded(pec);

      expect(mockMemberService.togglePECExcluded).toHaveBeenCalledWith('1', false);
      expect(mockToast.success).toHaveBeenCalledWith('PEC condition included successfully');
    });

    it('should not toggle PEC if user cancels confirmation', () => {
      vi.spyOn(window, 'confirm').mockReturnValue(false);
      const pec: any = {
        pec_id: '1',
        is_excluded: false
      };

      component.togglePECExcluded(pec);

      expect(mockMemberService.togglePECExcluded).not.toHaveBeenCalled();
    });

    it('should handle error when toggling PEC', () => {
      const error = new Error('Toggle failed');
      mockMemberService.togglePECExcluded.mockReturnValue(throwError(() => error));
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      const pec: any = {
        pec_id: '1',
        is_excluded: false
      };

      component.togglePECExcluded(pec);

      expect(mockLogger.error).toHaveBeenCalledWith('Error excludeing PEC:', error);
      expect(mockToast.error).toHaveBeenCalledWith('Failed to exclude PEC condition');
    });

    it('should delete PEC successfully', () => {
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      const pec: any = {
        pec_id: '1',
        dependent_id: 'dep1',
        condition_code: 'C001'
      };

      component.deletePEC(pec);

      expect(mockMemberService.deletePEC).toHaveBeenCalledWith('1');
      expect(mockToast.success).toHaveBeenCalledWith('PEC condition deleted successfully');
    });

    it('should not delete PEC if user cancels confirmation', () => {
      vi.spyOn(window, 'confirm').mockReturnValue(false);
      const pec: any = {
        pec_id: '1'
      };

      component.deletePEC(pec);

      expect(mockMemberService.deletePEC).not.toHaveBeenCalled();
    });

    it('should handle error when deleting PEC', () => {
      const error = new Error('Delete failed');
      mockMemberService.deletePEC.mockReturnValue(throwError(() => error));
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      const pec: any = {
        pec_id: '1'
      };

      component.deletePEC(pec);

      expect(mockLogger.error).toHaveBeenCalledWith('Error deleting PEC:', error);
      expect(mockToast.error).toHaveBeenCalledWith('Failed to delete PEC condition');
    });

    it('should cancel PEC form and reset state', () => {
      component.showPECForm = true;
      component.editingPEC = { pec_id: '1' } as any;
      component.pecFormData = { condition_code: 'C001' };

      component.cancelPECForm();

      expect(component.showPECForm).toBe(false);
      expect(component.editingPEC).toBeNull();
      expect(component.pecFormData.condition_code).toBe('');
    });

    it('should reset PEC form with default values', () => {
      component.pecFormData = {
        condition_code: 'C001',
        condition_name: 'Diabetes',
        is_excluded: true,
        notes: 'Test'
      };

      component.resetPECForm();

      expect(component.pecFormData.condition_code).toBe('');
      expect(component.pecFormData.condition_name).toBe('');
      expect(component.pecFormData.is_excluded).toBe(false);
      expect(component.pecFormData.notes).toBe('');
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

  describe('Template Rendering', () => {
    it('should render member name in header after loading', () => {
      fixture.detectChanges();
      const compiled: HTMLElement = fixture.nativeElement;
      expect(compiled.textContent).toContain('John Doe');
    });

    it('should render details tab content by default', () => {
      fixture.detectChanges();
      const compiled: HTMLElement = fixture.nativeElement;
      expect(compiled.textContent).toContain('IC Number');
      expect(compiled.textContent).toContain('Member Information');
      expect(compiled.textContent).toContain('900101011234');
    });

    it('should render member status badge for active member', () => {
      fixture.detectChanges();
      const compiled: HTMLElement = fixture.nativeElement;
      expect(compiled.textContent).toContain('Active');
    });

    it('should render tabs navigation', () => {
      fixture.detectChanges();
      const compiled: HTMLElement = fixture.nativeElement;
      expect(compiled.textContent).toContain('Addresses');
      expect(compiled.textContent).toContain('Contacts');
    });

    it('should show loading spinner when member is loading', () => {
      const loadSubject = new Subject<typeof mockMember>();
      mockMemberService.getMemberById.mockReturnValue(loadSubject.asObservable());
      fixture.detectChanges();
      expect(component.loading).toBe(true);
    });

    it('should render addresses tab empty state when tab is pre-set', () => {
      component.activeTab = 'addresses';
      component.addresses = [];
      fixture.detectChanges();
      const compiled: HTMLElement = fixture.nativeElement;
      expect(compiled.textContent).toContain('Member Addresses');
      expect(compiled.textContent).toContain('No addresses found');
    });

    it('should render address cards when addresses are pre-loaded', () => {
      component.activeTab = 'addresses';
      component.addresses = [
        {
          address_id: 'addr1',
          member_id: '1',
          address_type: 'PRIMARY',
          street_line1: '123 Main St',
          city: 'Kuala Lumpur',
          is_primary: true,
          is_deleted: false
        } as any
      ];
      fixture.detectChanges();
      const compiled: HTMLElement = fixture.nativeElement;
      expect(compiled.textContent).toContain('123 Main St');
    });

    it('should render contacts tab empty state when tab is pre-set', () => {
      component.activeTab = 'contacts';
      component.contacts = [];
      fixture.detectChanges();
      const compiled: HTMLElement = fixture.nativeElement;
      expect(compiled.textContent).toContain('Member Contacts');
      expect(compiled.textContent).toContain('No contacts found');
    });

    it('should render contacts list when contacts are pre-loaded', () => {
      component.activeTab = 'contacts';
      component.contacts = [
        {
          contact_id: 'c1',
          member_id: '1',
          contact_type: 'MOBILE',
          contact_value: '+601234567890',
          is_primary: true,
          is_deleted: false
        } as any
      ];
      fixture.detectChanges();
      const compiled: HTMLElement = fixture.nativeElement;
      expect(compiled.textContent).toContain('+601234567890');
    });

    it('should render policies tab empty state when tab is pre-set', () => {
      component.activeTab = 'policies';
      component.policies = [];
      fixture.detectChanges();
      const compiled: HTMLElement = fixture.nativeElement;
      expect(compiled.textContent).toContain('Member Policies');
    });

    it('should render dependents tab empty state when tab is pre-set', () => {
      component.activeTab = 'dependents';
      component.dependents = [];
      fixture.detectChanges();
      const compiled: HTMLElement = fixture.nativeElement;
      expect(compiled.textContent).toContain('Dependents');
    });

    it('should render deleted member with deleted badge', () => {
      const deletedMember = { ...mockMember, is_deleted: true };
      mockMemberService.getMemberById.mockReturnValue(of(deletedMember));
      fixture.detectChanges();
      const compiled: HTMLElement = fixture.nativeElement;
      expect(compiled.textContent).toContain('Deleted');
    });

    it('should render address form when showAddressForm is true', () => {
      component.activeTab = 'addresses';
      component.addresses = [];
      component.showAddressForm = true;
      fixture.detectChanges();
      const compiled: HTMLElement = fixture.nativeElement;
      expect(compiled.textContent).toContain('Add New Address');
    });

    it('should render edit address form when editingAddress is set', () => {
      component.activeTab = 'addresses';
      component.showAddressForm = true;
      component.editingAddress = { address_id: 'a1', member_id: '1', address_type: 'PRIMARY', is_primary: true, is_deleted: false } as any;
      fixture.detectChanges();
      const compiled: HTMLElement = fixture.nativeElement;
      expect(compiled.textContent).toContain('Edit Address');
    });

    it('should render contact form when showContactForm is true', () => {
      component.activeTab = 'contacts';
      component.contacts = [];
      component.showContactForm = true;
      fixture.detectChanges();
      const compiled: HTMLElement = fixture.nativeElement;
      expect(compiled.textContent).toContain('Add New Contact');
    });

    it('should render edit contact form when editingContact is set', () => {
      component.activeTab = 'contacts';
      component.showContactForm = true;
      component.editingContact = { contact_id: 'c1', member_id: '1', contact_type: 'MOBILE', contact_value: '+60123', is_primary: true, is_deleted: false } as any;
      fixture.detectChanges();
      const compiled: HTMLElement = fixture.nativeElement;
      expect(compiled.textContent).toContain('Edit Contact');
    });

    it('should render policy form when showPolicyForm is true', () => {
      component.activeTab = 'policies';
      component.policies = [];
      component.showPolicyForm = true;
      fixture.detectChanges();
      const compiled: HTMLElement = fixture.nativeElement;
      expect(compiled.textContent).toContain('Add New Policy');
    });

    it('should render dependent form when showDependentForm is true', () => {
      component.activeTab = 'dependents';
      component.dependents = [];
      component.showDependentForm = true;
      fixture.detectChanges();
      const compiled: HTMLElement = fixture.nativeElement;
      expect(compiled.textContent).toContain('Add New Dependent');
    });

    it('should render PEC section when selectedDependentForPEC is set', () => {
      component.activeTab = 'dependents';
      component.selectedDependentForPEC = { dependent_id: 'd1', member_id: '1', full_name: 'Jane Doe', ic_no: 'IC001', is_deleted: false } as any;
      component.pecConditions = [];
      fixture.detectChanges();
      const compiled: HTMLElement = fixture.nativeElement;
      expect(compiled.textContent).toContain('PEC Conditions for Jane Doe');
    });

    it('should render PEC form when showPECForm is true', () => {
      component.activeTab = 'dependents';
      component.selectedDependentForPEC = { dependent_id: 'd1', member_id: '1', full_name: 'Jane Doe', ic_no: 'IC001', is_deleted: false } as any;
      component.showPECForm = true;
      component.pecConditions = [];
      fixture.detectChanges();
      const compiled: HTMLElement = fixture.nativeElement;
      expect(compiled.textContent).toContain('Add New PEC Condition');
    });

    it('should render PEC table when pecConditions are pre-loaded', () => {
      component.activeTab = 'dependents';
      component.selectedDependentForPEC = { dependent_id: 'd1', member_id: '1', full_name: 'Jane Doe', ic_no: 'IC001', is_deleted: false } as any;
      component.pecConditions = [
        { pec_id: 'p1', dependent_id: 'd1', condition_code: 'A01', condition_name: 'Hypertension', is_excluded: false } as any
      ];
      fixture.detectChanges();
      const compiled: HTMLElement = fixture.nativeElement;
      expect(compiled.textContent).toContain('A01');
      expect(compiled.textContent).toContain('Hypertension');
    });

    it('should render excluded PEC status badge', () => {
      component.activeTab = 'dependents';
      component.selectedDependentForPEC = { dependent_id: 'd1', member_id: '1', full_name: 'Jane Doe', ic_no: 'IC001', is_deleted: false } as any;
      component.pecConditions = [
        { pec_id: 'p2', dependent_id: 'd1', condition_code: 'B02', condition_name: 'Diabetes', is_excluded: true } as any
      ];
      fixture.detectChanges();
      const compiled: HTMLElement = fixture.nativeElement;
      expect(compiled.textContent).toContain('Excluded');
    });

    it('should render edit PEC form when editingPEC is set', () => {
      component.activeTab = 'dependents';
      component.selectedDependentForPEC = { dependent_id: 'd1', member_id: '1', full_name: 'Jane Doe', ic_no: 'IC001', is_deleted: false } as any;
      component.showPECForm = true;
      component.editingPEC = { pec_id: 'p1', dependent_id: 'd1', condition_code: 'A01', is_excluded: false } as any;
      component.pecConditions = [];
      fixture.detectChanges();
      const compiled: HTMLElement = fixture.nativeElement;
      expect(compiled.textContent).toContain('Edit PEC Condition');
    });

    it('should render dependent cards when dependents are pre-loaded', () => {
      component.activeTab = 'dependents';
      component.dependents = [
        { dependent_id: 'd1', member_id: '1', full_name: 'Child One', ic_no: 'IC123', relationship: 'CHILD', is_deleted: false } as any
      ];
      fixture.detectChanges();
      const compiled: HTMLElement = fixture.nativeElement;
      expect(compiled.textContent).toContain('Child One');
    });

    it('should render policy table when policies are pre-loaded', () => {
      component.activeTab = 'policies';
      component.policies = [
        { policy_id: 'pol1', member_id: '1', policy_no: 'POL-001', product_id: 'p1', is_deleted: false } as any
      ];
      fixture.detectChanges();
      const compiled: HTMLElement = fixture.nativeElement;
      expect(compiled.textContent).toContain('POL-001');
    });
  });
});
