import { Request, Response } from 'express';
import { MembersController } from './members.controller';
import { MembersService } from './members.service';
import { ResponseUtil } from '../../core/utils/response.util';

jest.mock('./members.service');
jest.mock('../../core/utils/response.util');

describe('MembersController', () => {
  let controller: MembersController;
  let mockService: jest.Mocked<MembersService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    controller = new MembersController();
    mockService = (controller as any).service as jest.Mocked<MembersService>;
    
    mockRequest = { 
      body: {}, 
      params: {} as any,
      user: { userId: 1 }
    } as any;
    mockResponse = {};
    
    jest.clearAllMocks();
  });

  // ============================================================================
  // MEMBERS
  // ============================================================================

  describe('getMembers', () => {
    it('should return paginated members successfully', async () => {
      const mockResult = {
        data: [{ member_id: 'M001', full_name: 'John Doe', ic_no: '123456789012' }],
        pagination: { total: 1, page: 1, limit: 10, total_pages: 1 }
      };
      
      mockService.getMembers.mockResolvedValue(mockResult);
      mockRequest.body = { page: 1, limit: 10 };

      await controller.getMembers(mockRequest as Request, mockResponse as Response);

      expect(mockService.getMembers).toHaveBeenCalledWith({
        search: undefined,
        is_deleted: undefined,
        page: 1,
        limit: 10,
        sort_by: 'member_id',
        sort_order: 'DESC'
      });
      expect(ResponseUtil.success).toHaveBeenCalledWith(
        mockResponse,
        mockResult,
        'Members retrieved successfully'
      );
    });

    it('should apply search filter', async () => {
      mockService.getMembers.mockResolvedValue({ data: [], pagination: {} } as any);
      mockRequest.body = { search: 'John', page: 1, limit: 10 };

      await controller.getMembers(mockRequest as Request, mockResponse as Response);

      expect(mockService.getMembers).toHaveBeenCalledWith(
        expect.objectContaining({ search: 'John' })
      );
    });

    it('should apply is_deleted filter', async () => {
      mockService.getMembers.mockResolvedValue({ data: [], pagination: {} } as any);
      mockRequest.body = { is_deleted: false, page: 1, limit: 10 };

      await controller.getMembers(mockRequest as Request, mockResponse as Response);

      expect(mockService.getMembers).toHaveBeenCalledWith(
        expect.objectContaining({ is_deleted: false })
      );
    });

    it('should use default pagination values', async () => {
      mockService.getMembers.mockResolvedValue({ data: [], pagination: {} } as any);
      mockRequest.body = {};

      await controller.getMembers(mockRequest as Request, mockResponse as Response);

      expect(mockService.getMembers).toHaveBeenCalledWith(
        expect.objectContaining({ page: 1, limit: 10, sort_by: 'member_id', sort_order: 'DESC' })
      );
    });

    it('should apply custom sort parameters', async () => {
      mockService.getMembers.mockResolvedValue({ data: [], pagination: {} } as any);
      mockRequest.body = { sort_by: 'full_name', sort_order: 'ASC' };

      await controller.getMembers(mockRequest as Request, mockResponse as Response);

      expect(mockService.getMembers).toHaveBeenCalledWith(
        expect.objectContaining({ sort_by: 'full_name', sort_order: 'ASC' })
      );
    });

    it('should handle service errors', async () => {
      mockService.getMembers.mockRejectedValue(new Error('Database error'));
      mockRequest.body = {};

      await controller.getMembers(mockRequest as Request, mockResponse as Response);

      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Error fetching members',
        500,
        'Database error'
      );
    });
  });

  describe('getMemberById', () => {
    it('should return member when found', async () => {
      const mockMember = { member_id: 'M001', full_name: 'John Doe', ic_no: '123456789012' };
      mockService.getMemberById.mockResolvedValue(mockMember as any);
      mockRequest.body = { member_id: 'M001' };

      await controller.getMemberById(mockRequest as Request, mockResponse as Response);

      expect(mockService.getMemberById).toHaveBeenCalledWith('M001');
      expect(ResponseUtil.success).toHaveBeenCalledWith(
        mockResponse,
        mockMember,
        'Member retrieved successfully'
      );
    });

    it('should return 400 for missing member_id', async () => {
      mockRequest.body = {};

      await controller.getMemberById(mockRequest as Request, mockResponse as Response);

      expect(mockService.getMemberById).not.toHaveBeenCalled();
      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Invalid member ID',
        400
      );
    });

    it('should return 400 for empty member_id', async () => {
      mockRequest.body = { member_id: '   ' };

      await controller.getMemberById(mockRequest as Request, mockResponse as Response);

      expect(mockService.getMemberById).not.toHaveBeenCalled();
      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Invalid member ID',
        400
      );
    });

    it('should return 404 when member not found', async () => {
      mockService.getMemberById.mockResolvedValue(null);
      mockRequest.body = { member_id: 'M999' };

      await controller.getMemberById(mockRequest as Request, mockResponse as Response);

      expect(mockService.getMemberById).toHaveBeenCalledWith('M999');
      expect(ResponseUtil.notFound).toHaveBeenCalledWith(
        mockResponse,
        'Member not found'
      );
    });

    it('should handle service errors', async () => {
      mockService.getMemberById.mockRejectedValue(new Error('Database connection failed'));
      mockRequest.body = { member_id: 'M001' };

      await controller.getMemberById(mockRequest as Request, mockResponse as Response);

      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Error fetching member',
        500,
        'Database connection failed'
      );
    });
  });

  describe('checkICExists', () => {
    it('should return exists=true when IC exists', async () => {
      mockService.checkICExists.mockResolvedValue(true);
      mockRequest.body = { ic_no: '123456789012' };

      await controller.checkICExists(mockRequest as Request, mockResponse as Response);

      expect(mockService.checkICExists).toHaveBeenCalledWith('123456789012', undefined);
      expect(ResponseUtil.success).toHaveBeenCalledWith(
        mockResponse,
        { exists: true, message: 'IC number already exists' },
        'IC check completed'
      );
    });

    it('should return exists=false when IC does not exist', async () => {
      mockService.checkICExists.mockResolvedValue(false);
      mockRequest.body = { ic_no: '999999999999' };

      await controller.checkICExists(mockRequest as Request, mockResponse as Response);

      expect(mockService.checkICExists).toHaveBeenCalledWith('999999999999', undefined);
      expect(ResponseUtil.success).toHaveBeenCalledWith(
        mockResponse,
        { exists: false, message: 'IC number is available' },
        'IC check completed'
      );
    });

    it('should exclude current member when member_id provided', async () => {
      mockService.checkICExists.mockResolvedValue(false);
      mockRequest.body = { ic_no: '123456789012', member_id: 'M001' };

      await controller.checkICExists(mockRequest as Request, mockResponse as Response);

      expect(mockService.checkICExists).toHaveBeenCalledWith('123456789012', 'M001');
    });

    it('should return 400 when ic_no is missing', async () => {
      mockRequest.body = {};

      await controller.checkICExists(mockRequest as Request, mockResponse as Response);

      expect(mockService.checkICExists).not.toHaveBeenCalled();
      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'IC number is required',
        400
      );
    });

    it('should handle service errors', async () => {
      mockService.checkICExists.mockRejectedValue(new Error('Query failed'));
      mockRequest.body = { ic_no: '123456789012' };

      await controller.checkICExists(mockRequest as Request, mockResponse as Response);

      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Error checking IC number',
        500,
        'Query failed'
      );
    });
  });

  describe('createMember', () => {
    it('should create member successfully', async () => {
      mockService.checkICExists.mockResolvedValue(false);
      mockService.createMember.mockResolvedValue('M002');
      mockRequest.body = {
        ic_no: '123456789012',
        full_name: 'Jane Smith',
        email: 'jane@example.com'
      };

      await controller.createMember(mockRequest as Request, mockResponse as Response);

      expect(mockService.checkICExists).toHaveBeenCalledWith('123456789012');
      expect(mockService.createMember).toHaveBeenCalledWith(mockRequest.body, '1');
      expect(ResponseUtil.success).toHaveBeenCalledWith(
        mockResponse,
        { member_id: 'M002' },
        'Member created successfully',
        201
      );
    });

    it('should return 400 when ic_no is missing', async () => {
      mockRequest.body = { full_name: 'Jane Smith' };

      await controller.createMember(mockRequest as Request, mockResponse as Response);

      expect(mockService.checkICExists).not.toHaveBeenCalled();
      expect(mockService.createMember).not.toHaveBeenCalled();
      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'IC number is required',
        400
      );
    });

    it('should return 400 when full_name is missing', async () => {
      mockRequest.body = { ic_no: '123456789012' };

      await controller.createMember(mockRequest as Request, mockResponse as Response);

      expect(mockService.checkICExists).not.toHaveBeenCalled();
      expect(mockService.createMember).not.toHaveBeenCalled();
      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Full name is required',
        400
      );
    });

    it('should return 400 when IC already exists', async () => {
      mockService.checkICExists.mockResolvedValue(true);
      mockRequest.body = {
        ic_no: '123456789012',
        full_name: 'Jane Smith'
      };

      await controller.createMember(mockRequest as Request, mockResponse as Response);

      expect(mockService.checkICExists).toHaveBeenCalledWith('123456789012');
      expect(mockService.createMember).not.toHaveBeenCalled();
      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'IC number already exists',
        400
      );
    });

    it('should handle service errors', async () => {
      mockService.checkICExists.mockResolvedValue(false);
      mockService.createMember.mockRejectedValue(new Error('Insert failed'));
      mockRequest.body = {
        ic_no: '123456789012',
        full_name: 'Jane Smith'
      };

      await controller.createMember(mockRequest as Request, mockResponse as Response);

      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Error creating member',
        500,
        'Insert failed'
      );
    });
  });

  describe('updateMember', () => {
    it('should update member successfully', async () => {
      const existingMember = { member_id: 'M001', full_name: 'John Doe', ic_no: '111111111111' };
      mockService.getMemberById.mockResolvedValue(existingMember as any);
      mockService.updateMember.mockResolvedValue(true);
      mockRequest.body = {
        member_id: 'M001',
        full_name: 'John Updated',
        email: 'john@example.com'
      };

      await controller.updateMember(mockRequest as Request, mockResponse as Response);

      expect(mockService.getMemberById).toHaveBeenCalledWith('M001');
      expect(mockService.updateMember).toHaveBeenCalledWith(
        'M001',
        { full_name: 'John Updated', email: 'john@example.com' },
        '1'
      );
      expect(ResponseUtil.success).toHaveBeenCalledWith(
        mockResponse,
        { member_id: 'M001' },
        'Member updated successfully'
      );
    });

    it('should return 400 for missing member_id', async () => {
      mockRequest.body = { full_name: 'John Updated' };

      await controller.updateMember(mockRequest as Request, mockResponse as Response);

      expect(mockService.getMemberById).not.toHaveBeenCalled();
      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Invalid member ID',
        400
      );
    });

    it('should return 400 for empty member_id', async () => {
      mockRequest.body = { member_id: '  ', full_name: 'John Updated' };

      await controller.updateMember(mockRequest as Request, mockResponse as Response);

      expect(mockService.getMemberById).not.toHaveBeenCalled();
      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Invalid member ID',
        400
      );
    });

    it('should return 404 when member not found', async () => {
      mockService.getMemberById.mockResolvedValue(null);
      mockRequest.body = { member_id: 'M999', full_name: 'John Updated' };

      await controller.updateMember(mockRequest as Request, mockResponse as Response);

      expect(mockService.getMemberById).toHaveBeenCalledWith('M999');
      expect(mockService.updateMember).not.toHaveBeenCalled();
      expect(ResponseUtil.notFound).toHaveBeenCalledWith(
        mockResponse,
        'Member not found'
      );
    });

    it('should check IC uniqueness when updating IC', async () => {
      const existingMember = { member_id: 'M001', ic_no: '111111111111' };
      mockService.getMemberById.mockResolvedValue(existingMember as any);
      mockService.checkICExists.mockResolvedValue(false);
      mockService.updateMember.mockResolvedValue(true);
      mockRequest.body = {
        member_id: 'M001',
        ic_no: '222222222222',
        full_name: 'John Updated'
      };

      await controller.updateMember(mockRequest as Request, mockResponse as Response);

      expect(mockService.checkICExists).toHaveBeenCalledWith('222222222222', 'M001');
      expect(mockService.updateMember).toHaveBeenCalled();
    });

    it('should return 400 when updated IC already exists', async () => {
      const existingMember = { member_id: 'M001', ic_no: '111111111111' };
      mockService.getMemberById.mockResolvedValue(existingMember as any);
      mockService.checkICExists.mockResolvedValue(true);
      mockRequest.body = {
        member_id: 'M001',
        ic_no: '222222222222',
        full_name: 'John Updated'
      };

      await controller.updateMember(mockRequest as Request, mockResponse as Response);

      expect(mockService.checkICExists).toHaveBeenCalledWith('222222222222', 'M001');
      expect(mockService.updateMember).not.toHaveBeenCalled();
      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'IC number already exists',
        400
      );
    });

    it('should not check IC when IC unchanged', async () => {
      const existingMember = { member_id: 'M001', ic_no: '111111111111' };
      mockService.getMemberById.mockResolvedValue(existingMember as any);
      mockService.updateMember.mockResolvedValue(true);
      mockRequest.body = {
        member_id: 'M001',
        ic_no: '111111111111',
        full_name: 'John Updated'
      };

      await controller.updateMember(mockRequest as Request, mockResponse as Response);

      expect(mockService.checkICExists).not.toHaveBeenCalled();
      expect(mockService.updateMember).toHaveBeenCalled();
    });

    it('should return 400 when no changes made', async () => {
      const existingMember = { member_id: 'M001', ic_no: '111111111111' };
      mockService.getMemberById.mockResolvedValue(existingMember as any);
      mockService.updateMember.mockResolvedValue(false);
      mockRequest.body = { member_id: 'M001', full_name: 'John' };

      await controller.updateMember(mockRequest as Request, mockResponse as Response);

      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'No changes made',
        400
      );
    });

    it('should handle service errors', async () => {
      const existingMember = { member_id: 'M001', ic_no: '111111111111' };
      mockService.getMemberById.mockResolvedValue(existingMember as any);
      mockService.updateMember.mockRejectedValue(new Error('Update failed'));
      mockRequest.body = { member_id: 'M001', full_name: 'John Updated' };

      await controller.updateMember(mockRequest as Request, mockResponse as Response);

      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Error updating member',
        500,
        'Update failed'
      );
    });
  });

  describe('deleteMember', () => {
    it('should delete member successfully', async () => {
      mockService.deleteMember.mockResolvedValue(true);
      mockRequest.body = { member_id: 'M001' };

      await controller.deleteMember(mockRequest as Request, mockResponse as Response);

      expect(mockService.deleteMember).toHaveBeenCalledWith('M001');
      expect(ResponseUtil.success).toHaveBeenCalledWith(
        mockResponse,
        { member_id: 'M001' },
        'Member deleted successfully'
      );
    });

    it('should return 400 for missing member_id', async () => {
      mockRequest.body = {};

      await controller.deleteMember(mockRequest as Request, mockResponse as Response);

      expect(mockService.deleteMember).not.toHaveBeenCalled();
      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Invalid member ID',
        400
      );
    });

    it('should return 400 for empty member_id', async () => {
      mockRequest.body = { member_id: '  ' };

      await controller.deleteMember(mockRequest as Request, mockResponse as Response);

      expect(mockService.deleteMember).not.toHaveBeenCalled();
      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Invalid member ID',
        400
      );
    });

    it('should return 404 when member not found', async () => {
      mockService.deleteMember.mockResolvedValue(false);
      mockRequest.body = { member_id: 'M999' };

      await controller.deleteMember(mockRequest as Request, mockResponse as Response);

      expect(mockService.deleteMember).toHaveBeenCalledWith('M999');
      expect(ResponseUtil.notFound).toHaveBeenCalledWith(
        mockResponse,
        'Member not found'
      );
    });

    it('should handle service errors', async () => {
      mockService.deleteMember.mockRejectedValue(new Error('Delete failed'));
      mockRequest.body = { member_id: 'M001' };

      await controller.deleteMember(mockRequest as Request, mockResponse as Response);

      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Error deleting member',
        500,
        'Delete failed'
      );
    });
  });

  describe('restoreMember', () => {
    it('should restore member successfully', async () => {
      mockService.setMemberDeletedStatus.mockResolvedValue(true);
      mockRequest.params = { memberId: 'M001' };

      await controller.restoreMember(mockRequest as Request, mockResponse as Response);

      expect(mockService.setMemberDeletedStatus).toHaveBeenCalledWith('M001', false);
      expect(ResponseUtil.success).toHaveBeenCalledWith(
        mockResponse,
        { member_id: 'M001' },
        'Member restored successfully'
      );
    });

    it('should return 400 for missing memberId', async () => {
      mockRequest.params = { memberId: '' };

      await controller.restoreMember(mockRequest as Request, mockResponse as Response);

      expect(mockService.setMemberDeletedStatus).not.toHaveBeenCalled();
      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Invalid member ID',
        400
      );
    });

    it('should return 404 when member not found', async () => {
      mockService.setMemberDeletedStatus.mockResolvedValue(false);
      mockRequest.params = { memberId: 'M999' };

      await controller.restoreMember(mockRequest as Request, mockResponse as Response);

      expect(ResponseUtil.notFound).toHaveBeenCalledWith(
        mockResponse,
        'Member not found'
      );
    });

    it('should handle service errors', async () => {
      mockService.setMemberDeletedStatus.mockRejectedValue(new Error('Restore failed'));
      mockRequest.params = { memberId: 'M001' };

      await controller.restoreMember(mockRequest as Request, mockResponse as Response);

      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Error restoring member',
        500,
        'Restore failed'
      );
    });
  });

  // ============================================================================
  // MEMBER ADDRESSES
  // ============================================================================

  describe('getAddresses', () => {
    it('should return member addresses successfully', async () => {
      const mockAddresses = [
        { address_id: 'A001', member_id: 'M001', address_line1: '123 Main St', is_primary: true }
      ];
      mockService.getAddressesByMemberId.mockResolvedValue(mockAddresses as any);
      mockRequest.params = { memberId: 'M001' };

      await controller.getAddresses(mockRequest as Request, mockResponse as Response);

      expect(mockService.getAddressesByMemberId).toHaveBeenCalledWith('M001');
      expect(ResponseUtil.success).toHaveBeenCalledWith(
        mockResponse,
        mockAddresses,
        'Member addresses retrieved successfully'
      );
    });

    it('should return 400 for invalid memberId', async () => {
      mockRequest.params = { memberId: '' };

      await controller.getAddresses(mockRequest as Request, mockResponse as Response);

      expect(mockService.getAddressesByMemberId).not.toHaveBeenCalled();
      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Invalid member ID',
        400
      );
    });

    it('should handle service errors', async () => {
      mockService.getAddressesByMemberId.mockRejectedValue(new Error('Query failed'));
      mockRequest.params = { memberId: 'M001' };

      await controller.getAddresses(mockRequest as Request, mockResponse as Response);

      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Error fetching addresses',
        500,
        'Query failed'
      );
    });
  });

  describe('getAddressById', () => {
    it('should return address when found', async () => {
      const mockAddress = { address_id: 'A001', member_id: 'M001', address_line1: '123 Main St' };
      mockService.getAddressById.mockResolvedValue(mockAddress as any);
      mockRequest.body = { address_id: 'A001' };

      await controller.getAddressById(mockRequest as Request, mockResponse as Response);

      expect(mockService.getAddressById).toHaveBeenCalledWith('A001');
      expect(ResponseUtil.success).toHaveBeenCalledWith(
        mockResponse,
        mockAddress,
        'Address retrieved successfully'
      );
    });

    it('should return 400 for missing address_id', async () => {
      mockRequest.body = {};

      await controller.getAddressById(mockRequest as Request, mockResponse as Response);

      expect(mockService.getAddressById).not.toHaveBeenCalled();
      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Invalid address ID',
        400
      );
    });

    it('should return 404 when address not found', async () => {
      mockService.getAddressById.mockResolvedValue(null);
      mockRequest.body = { address_id: 'A999' };

      await controller.getAddressById(mockRequest as Request, mockResponse as Response);

      expect(ResponseUtil.notFound).toHaveBeenCalledWith(
        mockResponse,
        'Address not found'
      );
    });

    it('should handle service errors', async () => {
      mockService.getAddressById.mockRejectedValue(new Error('Query failed'));
      mockRequest.body = { address_id: 'A001' };

      await controller.getAddressById(mockRequest as Request, mockResponse as Response);

      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Error fetching address',
        500,
        'Query failed'
      );
    });
  });

  describe('createAddress', () => {
    it('should create address successfully', async () => {
      mockService.getMemberById.mockResolvedValue({ member_id: 'M001' } as any);
      mockService.createAddress.mockResolvedValue('A002');
      mockRequest.body = {
        member_id: 'M001',
        address_line1: '456 Oak Ave',
        city: 'Kuala Lumpur'
      };

      await controller.createAddress(mockRequest as Request, mockResponse as Response);

      expect(mockService.getMemberById).toHaveBeenCalledWith('M001');
      expect(mockService.createAddress).toHaveBeenCalledWith(mockRequest.body, '1');
      expect(ResponseUtil.success).toHaveBeenCalledWith(
        mockResponse,
        { address_id: 'A002' },
        'Address created successfully',
        201
      );
    });

    it('should return 400 for missing member_id', async () => {
      mockRequest.body = { address_line1: '456 Oak Ave' };

      await controller.createAddress(mockRequest as Request, mockResponse as Response);

      expect(mockService.getMemberById).not.toHaveBeenCalled();
      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Valid member ID is required',
        400
      );
    });

    it('should return 404 when member not found', async () => {
      mockService.getMemberById.mockResolvedValue(null);
      mockRequest.body = { member_id: 'M999', address_line1: '456 Oak Ave' };

      await controller.createAddress(mockRequest as Request, mockResponse as Response);

      expect(mockService.getMemberById).toHaveBeenCalledWith('M999');
      expect(mockService.createAddress).not.toHaveBeenCalled();
      expect(ResponseUtil.notFound).toHaveBeenCalledWith(
        mockResponse,
        'Member not found'
      );
    });

    it('should handle service errors', async () => {
      mockService.getMemberById.mockResolvedValue({ member_id: 'M001' } as any);
      mockService.createAddress.mockRejectedValue(new Error('Insert failed'));
      mockRequest.body = { member_id: 'M001', address_line1: '456 Oak Ave' };

      await controller.createAddress(mockRequest as Request, mockResponse as Response);

      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Error creating address',
        500,
        'Insert failed'
      );
    });
  });

  describe('updateAddress', () => {
    it('should update address successfully', async () => {
      mockService.updateAddress.mockResolvedValue(true);
      mockRequest.params = { addressId: 'A001' };
      mockRequest.body = { address_line1: '789 Pine St', city: 'Petaling Jaya' };

      await controller.updateAddress(mockRequest as Request, mockResponse as Response);

      expect(mockService.updateAddress).toHaveBeenCalledWith('A001', mockRequest.body, '1');
      expect(ResponseUtil.success).toHaveBeenCalledWith(
        mockResponse,
        { address_id: 'A001' },
        'Address updated successfully'
      );
    });

    it('should return 400 for invalid addressId', async () => {
      mockRequest.params = { addressId: '' };
      mockRequest.body = { address_line1: '789 Pine St' };

      await controller.updateAddress(mockRequest as Request, mockResponse as Response);

      expect(mockService.updateAddress).not.toHaveBeenCalled();
      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Invalid address ID',
        400
      );
    });

    it('should return 400 when no changes made', async () => {
      mockService.updateAddress.mockResolvedValue(false);
      mockRequest.params = { addressId: 'A001' };
      mockRequest.body = { address_line1: '789 Pine St' };

      await controller.updateAddress(mockRequest as Request, mockResponse as Response);

      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'No changes made or address not found',
        400
      );
    });

    it('should handle service errors', async () => {
      mockService.updateAddress.mockRejectedValue(new Error('Update failed'));
      mockRequest.params = { addressId: 'A001' };
      mockRequest.body = { address_line1: '789 Pine St' };

      await controller.updateAddress(mockRequest as Request, mockResponse as Response);

      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Error updating address',
        500,
        'Update failed'
      );
    });
  });

  describe('deleteAddress', () => {
    it('should delete address successfully', async () => {
      mockService.deleteAddress.mockResolvedValue(true);
      mockRequest.params = { addressId: 'A001' };

      await controller.deleteAddress(mockRequest as Request, mockResponse as Response);

      expect(mockService.deleteAddress).toHaveBeenCalledWith('A001');
      expect(ResponseUtil.success).toHaveBeenCalledWith(
        mockResponse,
        { address_id: 'A001' },
        'Address deleted successfully'
      );
    });

    it('should return 400 for invalid addressId', async () => {
      mockRequest.params = { addressId: '' };

      await controller.deleteAddress(mockRequest as Request, mockResponse as Response);

      expect(mockService.deleteAddress).not.toHaveBeenCalled();
      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Invalid address ID',
        400
      );
    });

    it('should return 404 when address not found', async () => {
      mockService.deleteAddress.mockResolvedValue(false);
      mockRequest.params = { addressId: 'A999' };

      await controller.deleteAddress(mockRequest as Request, mockResponse as Response);

      expect(ResponseUtil.notFound).toHaveBeenCalledWith(
        mockResponse,
        'Address not found'
      );
    });

    it('should handle service errors', async () => {
      mockService.deleteAddress.mockRejectedValue(new Error('Delete failed'));
      mockRequest.params = { addressId: 'A001' };

      await controller.deleteAddress(mockRequest as Request, mockResponse as Response);

      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Error deleting address',
        500,
        'Delete failed'
      );
    });
  });

  describe('setPrimaryAddress', () => {
    it('should set primary address successfully', async () => {
      const mockAddress = { address_id: 'A001', member_id: 'M001' };
      mockService.getAddressById.mockResolvedValue(mockAddress as any);
      mockService.setPrimaryAddress.mockResolvedValue(true);
      mockRequest.params = { addressId: 'A001' };

      await controller.setPrimaryAddress(mockRequest as Request, mockResponse as Response);

      expect(mockService.getAddressById).toHaveBeenCalledWith('A001');
      expect(mockService.setPrimaryAddress).toHaveBeenCalledWith('M001', 'A001');
      expect(ResponseUtil.success).toHaveBeenCalledWith(
        mockResponse,
        { address_id: 'A001' },
        'Primary address set successfully'
      );
    });

    it('should return 400 for invalid addressId', async () => {
      mockRequest.params = { addressId: '' };

      await controller.setPrimaryAddress(mockRequest as Request, mockResponse as Response);

      expect(mockService.getAddressById).not.toHaveBeenCalled();
      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Invalid address ID',
        400
      );
    });

    it('should return 404 when address not found', async () => {
      mockService.getAddressById.mockResolvedValue(null);
      mockRequest.params = { addressId: 'A999' };

      await controller.setPrimaryAddress(mockRequest as Request, mockResponse as Response);

      expect(mockService.setPrimaryAddress).not.toHaveBeenCalled();
      expect(ResponseUtil.notFound).toHaveBeenCalledWith(
        mockResponse,
        'Address not found'
      );
    });

    it('should return 404 when setPrimaryAddress fails', async () => {
      const mockAddress = { address_id: 'A001', member_id: 'M001' };
      mockService.getAddressById.mockResolvedValue(mockAddress as any);
      mockService.setPrimaryAddress.mockResolvedValue(false);
      mockRequest.params = { addressId: 'A001' };

      await controller.setPrimaryAddress(mockRequest as Request, mockResponse as Response);

      expect(ResponseUtil.notFound).toHaveBeenCalledWith(
        mockResponse,
        'Address not found'
      );
    });

    it('should handle service errors', async () => {
      const mockAddress = { address_id: 'A001', member_id: 'M001' };
      mockService.getAddressById.mockResolvedValue(mockAddress as any);
      mockService.setPrimaryAddress.mockRejectedValue(new Error('Update failed'));
      mockRequest.params = { addressId: 'A001' };

      await controller.setPrimaryAddress(mockRequest as Request, mockResponse as Response);

      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Error setting primary address',
        500,
        'Update failed'
      );
    });
  });

  // ============================================================================
  // MEMBER CONTACTS
  // ============================================================================

  describe('getContacts', () => {
    it('should return member contacts successfully', async () => {
      const mockContacts = [
        { contact_id: 'C001', member_id: 'M001', contact_type: 'email', contact_value: 'john@example.com' }
      ];
      mockService.getContactsByMemberId.mockResolvedValue(mockContacts as any);
      mockRequest.params = { memberId: 'M001' };

      await controller.getContacts(mockRequest as Request, mockResponse as Response);

      expect(mockService.getContactsByMemberId).toHaveBeenCalledWith('M001');
      expect(ResponseUtil.success).toHaveBeenCalledWith(
        mockResponse,
        mockContacts,
        'Member contacts retrieved successfully'
      );
    });

    it('should return 400 for invalid memberId', async () => {
      mockRequest.params = { memberId: '' };

      await controller.getContacts(mockRequest as Request, mockResponse as Response);

      expect(mockService.getContactsByMemberId).not.toHaveBeenCalled();
      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Invalid member ID',
        400
      );
    });

    it('should handle service errors', async () => {
      mockService.getContactsByMemberId.mockRejectedValue(new Error('Query failed'));
      mockRequest.params = { memberId: 'M001' };

      await controller.getContacts(mockRequest as Request, mockResponse as Response);

      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Error fetching contacts',
        500,
        'Query failed'
      );
    });
  });

  describe('getContactById', () => {
    it('should return contact when found', async () => {
      const mockContact = { contact_id: 'C001', contact_type: 'email', contact_value: 'john@example.com' };
      mockService.getContactById.mockResolvedValue(mockContact as any);
      mockRequest.body = { contact_id: 'C001' };

      await controller.getContactById(mockRequest as Request, mockResponse as Response);

      expect(mockService.getContactById).toHaveBeenCalledWith('C001');
      expect(ResponseUtil.success).toHaveBeenCalledWith(
        mockResponse,
        mockContact,
        'Contact retrieved successfully'
      );
    });

    it('should return 400 for missing contact_id', async () => {
      mockRequest.body = {};

      await controller.getContactById(mockRequest as Request, mockResponse as Response);

      expect(mockService.getContactById).not.toHaveBeenCalled();
      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Invalid contact ID',
        400
      );
    });

    it('should return 404 when contact not found', async () => {
      mockService.getContactById.mockResolvedValue(null);
      mockRequest.body = { contact_id: 'C999' };

      await controller.getContactById(mockRequest as Request, mockResponse as Response);

      expect(ResponseUtil.notFound).toHaveBeenCalledWith(
        mockResponse,
        'Contact not found'
      );
    });

    it('should handle service errors', async () => {
      mockService.getContactById.mockRejectedValue(new Error('Query failed'));
      mockRequest.body = { contact_id: 'C001' };

      await controller.getContactById(mockRequest as Request, mockResponse as Response);

      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Error fetching contact',
        500,
        'Query failed'
      );
    });
  });

  describe('createContact', () => {
    it('should create contact successfully', async () => {
      const mockMember = { member_id: 'M001', full_name: 'John Doe' };
      mockService.getMemberById.mockResolvedValue(mockMember as any);
      mockService.createContact.mockResolvedValue('C001');
      mockRequest.body = { member_id: 'M001', contact_type: 'Email', contact_value: 'test@example.com' };

      await controller.createContact(mockRequest as Request, mockResponse as Response);

      expect(mockService.getMemberById).toHaveBeenCalledWith('M001');
      expect(mockService.createContact).toHaveBeenCalledWith(mockRequest.body, '1');
      expect(ResponseUtil.success).toHaveBeenCalledWith(
        mockResponse,
        { contact_id: 'C001' },
        'Contact created successfully',
        201
      );
    });

    it('should return 400 for missing member_id', async () => {
      mockRequest.body = { contact_type: 'Email' };

      await controller.createContact(mockRequest as Request, mockResponse as Response);

      expect(mockService.getMemberById).not.toHaveBeenCalled();
      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Valid member ID is required',
        400
      );
    });

    it('should return 400 for empty member_id', async () => {
      mockRequest.body = { member_id: '   ', contact_type: 'Email' };

      await controller.createContact(mockRequest as Request, mockResponse as Response);

      expect(mockService.getMemberById).not.toHaveBeenCalled();
      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Valid member ID is required',
        400
      );
    });

    it('should return 400 for missing contact_type', async () => {
      mockRequest.body = { member_id: 'M001' };

      await controller.createContact(mockRequest as Request, mockResponse as Response);

      expect(mockService.getMemberById).not.toHaveBeenCalled();
      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Contact type is required',
        400
      );
    });

    it('should return 404 when member not found', async () => {
      mockService.getMemberById.mockResolvedValue(null);
      mockRequest.body = { member_id: 'M999', contact_type: 'Email' };

      await controller.createContact(mockRequest as Request, mockResponse as Response);

      expect(mockService.getMemberById).toHaveBeenCalledWith('M999');
      expect(mockService.createContact).not.toHaveBeenCalled();
      expect(ResponseUtil.notFound).toHaveBeenCalledWith(
        mockResponse,
        'Member not found'
      );
    });

    it('should handle service errors', async () => {
      const mockMember = { member_id: 'M001', full_name: 'John Doe' };
      mockService.getMemberById.mockResolvedValue(mockMember as any);
      mockService.createContact.mockRejectedValue(new Error('Database error'));
      mockRequest.body = { member_id: 'M001', contact_type: 'Email' };

      await controller.createContact(mockRequest as Request, mockResponse as Response);

      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Error creating contact',
        500,
        'Database error'
      );
    });
  });

  describe('updateContact', () => {
    it('should update contact successfully', async () => {
      mockService.updateContact.mockResolvedValue(true);
      mockRequest.params = { contactId: 'C001' };
      mockRequest.body = { contact_value: 'newemail@example.com' };

      await controller.updateContact(mockRequest as Request, mockResponse as Response);

      expect(mockService.updateContact).toHaveBeenCalledWith('C001', mockRequest.body, '1');
      expect(ResponseUtil.success).toHaveBeenCalledWith(
        mockResponse,
        { contact_id: 'C001' },
        'Contact updated successfully'
      );
    });

    it('should return 400 for missing contactId', async () => {
      mockRequest.params = {};
      mockRequest.body = { contact_value: 'test@example.com' };

      await controller.updateContact(mockRequest as Request, mockResponse as Response);

      expect(mockService.updateContact).not.toHaveBeenCalled();
      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Invalid contact ID',
        400
      );
    });

    it('should return 400 for empty contactId', async () => {
      mockRequest.params = { contactId: '   ' };
      mockRequest.body = { contact_value: 'test@example.com' };

      await controller.updateContact(mockRequest as Request, mockResponse as Response);

      expect(mockService.updateContact).not.toHaveBeenCalled();
      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Invalid contact ID',
        400
      );
    });

    it('should return 400 when no changes made', async () => {
      mockService.updateContact.mockResolvedValue(false);
      mockRequest.params = { contactId: 'C001' };
      mockRequest.body = { contact_value: 'test@example.com' };

      await controller.updateContact(mockRequest as Request, mockResponse as Response);

      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'No changes made or contact not found',
        400
      );
    });

    it('should handle service errors', async () => {
      mockService.updateContact.mockRejectedValue(new Error('Update failed'));
      mockRequest.params = { contactId: 'C001' };
      mockRequest.body = { contact_value: 'test@example.com' };

      await controller.updateContact(mockRequest as Request, mockResponse as Response);

      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Error updating contact',
        500,
        'Update failed'
      );
    });
  });

  describe('deleteContact', () => {
    it('should delete contact successfully', async () => {
      mockService.deleteContact.mockResolvedValue(true);
      mockRequest.params = { contactId: 'C001' };

      await controller.deleteContact(mockRequest as Request, mockResponse as Response);

      expect(mockService.deleteContact).toHaveBeenCalledWith('C001');
      expect(ResponseUtil.success).toHaveBeenCalledWith(
        mockResponse,
        { contact_id: 'C001' },
        'Contact deleted successfully'
      );
    });

    it('should return 400 for missing contactId', async () => {
      mockRequest.params = {};

      await controller.deleteContact(mockRequest as Request, mockResponse as Response);

      expect(mockService.deleteContact).not.toHaveBeenCalled();
      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Invalid contact ID',
        400
      );
    });

    it('should return 400 for empty contactId', async () => {
      mockRequest.params = { contactId: '   ' };

      await controller.deleteContact(mockRequest as Request, mockResponse as Response);

      expect(mockService.deleteContact).not.toHaveBeenCalled();
      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Invalid contact ID',
        400
      );
    });

    it('should return 404 when contact not found', async () => {
      mockService.deleteContact.mockResolvedValue(false);
      mockRequest.params = { contactId: 'C999' };

      await controller.deleteContact(mockRequest as Request, mockResponse as Response);

      expect(mockService.deleteContact).toHaveBeenCalledWith('C999');
      expect(ResponseUtil.notFound).toHaveBeenCalledWith(
        mockResponse,
        'Contact not found'
      );
    });

    it('should handle service errors', async () => {
      mockService.deleteContact.mockRejectedValue(new Error('Delete failed'));
      mockRequest.params = { contactId: 'C001' };

      await controller.deleteContact(mockRequest as Request, mockResponse as Response);

      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Error deleting contact',
        500,
        'Delete failed'
      );
    });
  });

  describe('setPrimaryContact', () => {
    it('should set primary contact successfully', async () => {
      const mockContact = { contact_id: 'C001', member_id: 'M001', contact_type: 'Email' };
      mockService.getContactById.mockResolvedValue(mockContact as any);
      mockService.setPrimaryContact.mockResolvedValue(true);
      mockRequest.params = { contactId: 'C001' };

      await controller.setPrimaryContact(mockRequest as Request, mockResponse as Response);

      expect(mockService.getContactById).toHaveBeenCalledWith('C001');
      expect(mockService.setPrimaryContact).toHaveBeenCalledWith('M001', 'C001', 'Email');
      expect(ResponseUtil.success).toHaveBeenCalledWith(
        mockResponse,
        { contact_id: 'C001' },
        'Primary contact set successfully'
      );
    });

    it('should return 400 for missing contactId', async () => {
      mockRequest.params = {};

      await controller.setPrimaryContact(mockRequest as Request, mockResponse as Response);

      expect(mockService.getContactById).not.toHaveBeenCalled();
      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Invalid contact ID',
        400
      );
    });

    it('should return 400 for empty contactId', async () => {
      mockRequest.params = { contactId: '   ' };

      await controller.setPrimaryContact(mockRequest as Request, mockResponse as Response);

      expect(mockService.getContactById).not.toHaveBeenCalled();
      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Invalid contact ID',
        400
      );
    });

    it('should return 404 when contact not found', async () => {
      mockService.getContactById.mockResolvedValue(null);
      mockRequest.params = { contactId: 'C999' };

      await controller.setPrimaryContact(mockRequest as Request, mockResponse as Response);

      expect(mockService.getContactById).toHaveBeenCalledWith('C999');
      expect(mockService.setPrimaryContact).not.toHaveBeenCalled();
      expect(ResponseUtil.notFound).toHaveBeenCalledWith(
        mockResponse,
        'Contact not found'
      );
    });

    it('should return 400 when contact_type is missing', async () => {
      const mockContact = { contact_id: 'C001', member_id: 'M001', contact_type: null };
      mockService.getContactById.mockResolvedValue(mockContact as any);
      mockRequest.params = { contactId: 'C001' };

      await controller.setPrimaryContact(mockRequest as Request, mockResponse as Response);

      expect(mockService.setPrimaryContact).not.toHaveBeenCalled();
      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Contact type is missing',
        400
      );
    });

    it('should return 404 when setPrimaryContact fails', async () => {
      const mockContact = { contact_id: 'C001', member_id: 'M001', contact_type: 'Email' };
      mockService.getContactById.mockResolvedValue(mockContact as any);
      mockService.setPrimaryContact.mockResolvedValue(false);
      mockRequest.params = { contactId: 'C001' };

      await controller.setPrimaryContact(mockRequest as Request, mockResponse as Response);

      expect(ResponseUtil.notFound).toHaveBeenCalledWith(
        mockResponse,
        'Contact not found'
      );
    });

    it('should handle service errors', async () => {
      mockService.getContactById.mockRejectedValue(new Error('Database error'));
      mockRequest.params = { contactId: 'C001' };

      await controller.setPrimaryContact(mockRequest as Request, mockResponse as Response);

      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Error setting primary contact',
        500,
        'Database error'
      );
    });
  });

  // ============================================================================
  // MEMBER POLICIES
  // ============================================================================

  describe('getPolicies', () => {
    it('should return member policies successfully', async () => {
      const mockPolicies = [
        { policy_id: 'P001', member_id: 'M001', policy_no: 'POL123', coverage_amount: 100000 }
      ];
      mockService.getPoliciesByMemberId.mockResolvedValue(mockPolicies as any);
      mockRequest.params = { memberId: 'M001' };

      await controller.getPolicies(mockRequest as Request, mockResponse as Response);

      expect(mockService.getPoliciesByMemberId).toHaveBeenCalledWith('M001');
      expect(ResponseUtil.success).toHaveBeenCalledWith(
        mockResponse,
        mockPolicies,
        'Member policies retrieved successfully'
      );
    });

    it('should return 400 for invalid memberId', async () => {
      mockRequest.params = { memberId: '' };

      await controller.getPolicies(mockRequest as Request, mockResponse as Response);

      expect(mockService.getPoliciesByMemberId).not.toHaveBeenCalled();
      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Invalid member ID',
        400
      );
    });

    it('should handle service errors', async () => {
      mockService.getPoliciesByMemberId.mockRejectedValue(new Error('Query failed'));
      mockRequest.params = { memberId: 'M001' };

      await controller.getPolicies(mockRequest as Request, mockResponse as Response);

      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Error fetching policies',
        500,
        'Query failed'
      );
    });
  });

  describe('checkPolicyNo', () => {
    it('should return exists=true when policy exists', async () => {
      mockService.checkPolicyNoExists.mockResolvedValue(true);
      mockRequest.body = { policy_no: 'POL123' };

      await controller.checkPolicyNo(mockRequest as Request, mockResponse as Response);

      expect(mockService.checkPolicyNoExists).toHaveBeenCalledWith('POL123', undefined);
      expect(ResponseUtil.success).toHaveBeenCalledWith(
        mockResponse,
        { exists: true, message: 'Policy number already exists' },
        'Policy number check completed'
      );
    });

    it('should return exists=false when policy does not exist', async () => {
      mockService.checkPolicyNoExists.mockResolvedValue(false);
      mockRequest.body = { policy_no: 'POL999' };

      await controller.checkPolicyNo(mockRequest as Request, mockResponse as Response);

      expect(mockService.checkPolicyNoExists).toHaveBeenCalledWith('POL999', undefined);
      expect(ResponseUtil.success).toHaveBeenCalledWith(
        mockResponse,
        { exists: false, message: 'Policy number is available' },
        'Policy number check completed'
      );
    });

    it('should exclude current policy when policy_id provided', async () => {
      mockService.checkPolicyNoExists.mockResolvedValue(false);
      mockRequest.body = { policy_no: 'POL123', policy_id: 'P001' };

      await controller.checkPolicyNo(mockRequest as Request, mockResponse as Response);

      expect(mockService.checkPolicyNoExists).toHaveBeenCalledWith('POL123', 'P001');
    });

    it('should return 400 when policy_no is missing', async () => {
      mockRequest.body = {};

      await controller.checkPolicyNo(mockRequest as Request, mockResponse as Response);

      expect(mockService.checkPolicyNoExists).not.toHaveBeenCalled();
      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Policy number is required',
        400
      );
    });

    it('should handle service errors', async () => {
      mockService.checkPolicyNoExists.mockRejectedValue(new Error('Query failed'));
      mockRequest.body = { policy_no: 'POL123' };

      await controller.checkPolicyNo(mockRequest as Request, mockResponse as Response);

      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Error checking policy number',
        500,
        'Query failed'
      );
    });
  });

  describe('getPolicyById', () => {
    it('should return policy when found', async () => {
      const mockPolicy = { policy_id: 'P001', member_id: 'M001', policy_no: 'POL123', coverage_amount: 100000 };
      mockService.getPolicyById.mockResolvedValue(mockPolicy as any);
      mockRequest.body = { policy_id: 'P001' };

      await controller.getPolicyById(mockRequest as Request, mockResponse as Response);

      expect(mockService.getPolicyById).toHaveBeenCalledWith('P001');
      expect(ResponseUtil.success).toHaveBeenCalledWith(
        mockResponse,
        mockPolicy,
        'Policy retrieved successfully'
      );
    });

    it('should return 400 for missing policy_id', async () => {
      mockRequest.body = {};

      await controller.getPolicyById(mockRequest as Request, mockResponse as Response);

      expect(mockService.getPolicyById).not.toHaveBeenCalled();
      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Invalid policy ID',
        400
      );
    });

    it('should return 400 for empty policy_id', async () => {
      mockRequest.body = { policy_id: '   ' };

      await controller.getPolicyById(mockRequest as Request, mockResponse as Response);

      expect(mockService.getPolicyById).not.toHaveBeenCalled();
      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Invalid policy ID',
        400
      );
    });

    it('should return 404 when policy not found', async () => {
      mockService.getPolicyById.mockResolvedValue(null);
      mockRequest.body = { policy_id: 'P999' };

      await controller.getPolicyById(mockRequest as Request, mockResponse as Response);

      expect(mockService.getPolicyById).toHaveBeenCalledWith('P999');
      expect(ResponseUtil.notFound).toHaveBeenCalledWith(
        mockResponse,
        'Policy not found'
      );
    });

    it('should handle service errors', async () => {
      mockService.getPolicyById.mockRejectedValue(new Error('Query failed'));
      mockRequest.body = { policy_id: 'P001' };

      await controller.getPolicyById(mockRequest as Request, mockResponse as Response);

      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Error fetching policy',
        500,
        'Query failed'
      );
    });
  });

  describe('createPolicy', () => {
    it('should create policy successfully', async () => {
      const mockMember = { member_id: 'M001', full_name: 'John Doe' };
      mockService.getMemberById.mockResolvedValue(mockMember as any);
      mockService.checkPolicyNoExists.mockResolvedValue(false);
      mockService.createPolicy.mockResolvedValue('P001');
      mockRequest.body = { member_id: 'M001', product_id: 'PROD001', policy_no: 'POL123' };

      await controller.createPolicy(mockRequest as Request, mockResponse as Response);

      expect(mockService.getMemberById).toHaveBeenCalledWith('M001');
      expect(mockService.checkPolicyNoExists).toHaveBeenCalledWith('POL123');
      expect(mockService.createPolicy).toHaveBeenCalledWith(mockRequest.body, '1');
      expect(ResponseUtil.success).toHaveBeenCalledWith(
        mockResponse,
        { policy_id: 'P001' },
        'Policy created successfully',
        201
      );
    });

    it('should return 400 for missing member_id', async () => {
      mockRequest.body = { product_id: 'PROD001' };

      await controller.createPolicy(mockRequest as Request, mockResponse as Response);

      expect(mockService.getMemberById).not.toHaveBeenCalled();
      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Valid member ID is required',
        400
      );
    });

    it('should return 400 for empty member_id', async () => {
      mockRequest.body = { member_id: '   ', product_id: 'PROD001' };

      await controller.createPolicy(mockRequest as Request, mockResponse as Response);

      expect(mockService.getMemberById).not.toHaveBeenCalled();
      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Valid member ID is required',
        400
      );
    });

    it('should return 400 for missing product_id', async () => {
      mockRequest.body = { member_id: 'M001' };

      await controller.createPolicy(mockRequest as Request, mockResponse as Response);

      expect(mockService.getMemberById).not.toHaveBeenCalled();
      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Valid product ID is required',
        400
      );
    });

    it('should return 400 for empty product_id', async () => {
      mockRequest.body = { member_id: 'M001', product_id: '   ' };

      await controller.createPolicy(mockRequest as Request, mockResponse as Response);

      expect(mockService.getMemberById).not.toHaveBeenCalled();
      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Valid product ID is required',
        400
      );
    });

    it('should return 404 when member not found', async () => {
      mockService.getMemberById.mockResolvedValue(null);
      mockRequest.body = { member_id: 'M999', product_id: 'PROD001' };

      await controller.createPolicy(mockRequest as Request, mockResponse as Response);

      expect(mockService.getMemberById).toHaveBeenCalledWith('M999');
      expect(mockService.createPolicy).not.toHaveBeenCalled();
      expect(ResponseUtil.notFound).toHaveBeenCalledWith(
        mockResponse,
        'Member not found'
      );
    });

    it('should return 400 when policy number already exists', async () => {
      const mockMember = { member_id: 'M001', full_name: 'John Doe' };
      mockService.getMemberById.mockResolvedValue(mockMember as any);
      mockService.checkPolicyNoExists.mockResolvedValue(true);
      mockRequest.body = { member_id: 'M001', product_id: 'PROD001', policy_no: 'POL123' };

      await controller.createPolicy(mockRequest as Request, mockResponse as Response);

      expect(mockService.createPolicy).not.toHaveBeenCalled();
      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Policy number already exists',
        400
      );
    });

    it('should create policy without checking policy_no if not provided', async () => {
      const mockMember = { member_id: 'M001', full_name: 'John Doe' };
      mockService.getMemberById.mockResolvedValue(mockMember as any);
      mockService.createPolicy.mockResolvedValue('P001');
      mockRequest.body = { member_id: 'M001', product_id: 'PROD001' };

      await controller.createPolicy(mockRequest as Request, mockResponse as Response);

      expect(mockService.checkPolicyNoExists).not.toHaveBeenCalled();
      expect(mockService.createPolicy).toHaveBeenCalledWith(mockRequest.body, '1');
      expect(ResponseUtil.success).toHaveBeenCalledWith(
        mockResponse,
        { policy_id: 'P001' },
        'Policy created successfully',
        201
      );
    });

    it('should handle service errors', async () => {
      const mockMember = { member_id: 'M001', full_name: 'John Doe' };
      mockService.getMemberById.mockResolvedValue(mockMember as any);
      mockService.createPolicy.mockRejectedValue(new Error('Database error'));
      mockRequest.body = { member_id: 'M001', product_id: 'PROD001' };

      await controller.createPolicy(mockRequest as Request, mockResponse as Response);

      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Error creating policy',
        500,
        'Database error'
      );
    });
  });

  describe('updatePolicy', () => {
    it('should update policy successfully', async () => {
      mockService.checkPolicyNoExists.mockResolvedValue(false);
      mockService.updatePolicy.mockResolvedValue(true);
      mockRequest.params = { policyId: 'P001' };
      mockRequest.body = { policy_no: 'POL456' };

      await controller.updatePolicy(mockRequest as Request, mockResponse as Response);

      expect(mockService.checkPolicyNoExists).toHaveBeenCalledWith('POL456', 'P001');
      expect(mockService.updatePolicy).toHaveBeenCalledWith('P001', mockRequest.body, '1');
      expect(ResponseUtil.success).toHaveBeenCalledWith(
        mockResponse,
        { policy_id: 'P001' },
        'Policy updated successfully'
      );
    });

    it('should return 400 for missing policyId', async () => {
      mockRequest.params = {};
      mockRequest.body = { policy_no: 'POL123' };

      await controller.updatePolicy(mockRequest as Request, mockResponse as Response);

      expect(mockService.updatePolicy).not.toHaveBeenCalled();
      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Invalid policy ID',
        400
      );
    });

    it('should return 400 for empty policyId', async () => {
      mockRequest.params = { policyId: '   ' };
      mockRequest.body = { policy_no: 'POL123' };

      await controller.updatePolicy(mockRequest as Request, mockResponse as Response);

      expect(mockService.updatePolicy).not.toHaveBeenCalled();
      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Invalid policy ID',
        400
      );
    });

    it('should return 400 when policy number already exists', async () => {
      mockService.checkPolicyNoExists.mockResolvedValue(true);
      mockRequest.params = { policyId: 'P001' };
      mockRequest.body = { policy_no: 'POL456' };

      await controller.updatePolicy(mockRequest as Request, mockResponse as Response);

      expect(mockService.updatePolicy).not.toHaveBeenCalled();
      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Policy number already exists',
        400
      );
    });

    it('should update without checking policy_no if not provided', async () => {
      mockService.updatePolicy.mockResolvedValue(true);
      mockRequest.params = { policyId: 'P001' };
      mockRequest.body = { product_id: 'PROD002' };

      await controller.updatePolicy(mockRequest as Request, mockResponse as Response);

      expect(mockService.checkPolicyNoExists).not.toHaveBeenCalled();
      expect(mockService.updatePolicy).toHaveBeenCalledWith('P001', mockRequest.body, '1');
    });

    it('should return 400 when no changes made', async () => {
      mockService.updatePolicy.mockResolvedValue(false);
      mockRequest.params = { policyId: 'P001' };
      mockRequest.body = { product_id: 'PROD002' };

      await controller.updatePolicy(mockRequest as Request, mockResponse as Response);

      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'No changes made or policy not found',
        400
      );
    });

    it('should handle service errors', async () => {
      mockService.updatePolicy.mockRejectedValue(new Error('Update failed'));
      mockRequest.params = { policyId: 'P001' };
      mockRequest.body = { product_id: 'PROD002' };

      await controller.updatePolicy(mockRequest as Request, mockResponse as Response);

      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Error updating policy',
        500,
        'Update failed'
      );
    });
  });

  describe('deletePolicy', () => {
    it('should delete policy successfully', async () => {
      mockService.deletePolicy.mockResolvedValue(true);
      mockRequest.params = { policyId: 'P001' };

      await controller.deletePolicy(mockRequest as Request, mockResponse as Response);

      expect(mockService.deletePolicy).toHaveBeenCalledWith('P001');
      expect(ResponseUtil.success).toHaveBeenCalledWith(
        mockResponse,
        { policy_id: 'P001' },
        'Policy deleted successfully'
      );
    });

    it('should return 400 for missing policyId', async () => {
      mockRequest.params = {};

      await controller.deletePolicy(mockRequest as Request, mockResponse as Response);

      expect(mockService.deletePolicy).not.toHaveBeenCalled();
      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Invalid policy ID',
        400
      );
    });

    it('should return 400 for empty policyId', async () => {
      mockRequest.params = { policyId: '   ' };

      await controller.deletePolicy(mockRequest as Request, mockResponse as Response);

      expect(mockService.deletePolicy).not.toHaveBeenCalled();
      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Invalid policy ID',
        400
      );
    });

    it('should return 404 when policy not found', async () => {
      mockService.deletePolicy.mockResolvedValue(false);
      mockRequest.params = { policyId: 'P999' };

      await controller.deletePolicy(mockRequest as Request, mockResponse as Response);

      expect(mockService.deletePolicy).toHaveBeenCalledWith('P999');
      expect(ResponseUtil.notFound).toHaveBeenCalledWith(
        mockResponse,
        'Policy not found'
      );
    });

    it('should handle service errors', async () => {
      mockService.deletePolicy.mockRejectedValue(new Error('Delete failed'));
      mockRequest.params = { policyId: 'P001' };

      await controller.deletePolicy(mockRequest as Request, mockResponse as Response);

      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Error deleting policy',
        500,
        'Delete failed'
      );
    });
  });

  // ============================================================================
  // MEMBER DEPENDENTS
  // ============================================================================

  describe('getDependents', () => {
    it('should return member dependents successfully', async () => {
      const mockDependents = [
        { dependent_id: 'D001', member_id: 'M001', full_name: 'Jane Doe', relationship: 'Spouse' }
      ];
      mockService.getDependentsByMemberId.mockResolvedValue(mockDependents as any);
      mockRequest.params = { memberId: 'M001' };

      await controller.getDependents(mockRequest as Request, mockResponse as Response);

      expect(mockService.getDependentsByMemberId).toHaveBeenCalledWith('M001');
      expect(ResponseUtil.success).toHaveBeenCalledWith(
        mockResponse,
        mockDependents,
        'Member dependents retrieved successfully'
      );
    });

    it('should return 400 for invalid memberId', async () => {
      mockRequest.params = { memberId: '' };

      await controller.getDependents(mockRequest as Request, mockResponse as Response);

      expect(mockService.getDependentsByMemberId).not.toHaveBeenCalled();
      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Invalid member ID',
        400
      );
    });

    it('should handle service errors', async () => {
      mockService.getDependentsByMemberId.mockRejectedValue(new Error('Query failed'));
      mockRequest.params = { memberId: 'M001' };

      await controller.getDependents(mockRequest as Request, mockResponse as Response);

      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Error fetching dependents',
        500,
        'Query failed'
      );
    });
  });

  describe('getDependentById', () => {
    it('should return dependent when found', async () => {
      const mockDependent = { dependent_id: 'D001', principal_member_id: 'M001', full_name: 'Jane Doe', relationship: 'Spouse' };
      mockService.getDependentById.mockResolvedValue(mockDependent as any);
      mockRequest.body = { dependent_id: 'D001' };

      await controller.getDependentById(mockRequest as Request, mockResponse as Response);

      expect(mockService.getDependentById).toHaveBeenCalledWith('D001');
      expect(ResponseUtil.success).toHaveBeenCalledWith(
        mockResponse,
        mockDependent,
        'Dependent retrieved successfully'
      );
    });

    it('should return 400 for missing dependent_id', async () => {
      mockRequest.body = {};

      await controller.getDependentById(mockRequest as Request, mockResponse as Response);

      expect(mockService.getDependentById).not.toHaveBeenCalled();
      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Invalid dependent ID',
        400
      );
    });

    it('should return 400 for empty dependent_id', async () => {
      mockRequest.body = { dependent_id: '   ' };

      await controller.getDependentById(mockRequest as Request, mockResponse as Response);

      expect(mockService.getDependentById).not.toHaveBeenCalled();
      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Invalid dependent ID',
        400
      );
    });

    it('should return 404 when dependent not found', async () => {
      mockService.getDependentById.mockResolvedValue(null);
      mockRequest.body = { dependent_id: 'D999' };

      await controller.getDependentById(mockRequest as Request, mockResponse as Response);

      expect(mockService.getDependentById).toHaveBeenCalledWith('D999');
      expect(ResponseUtil.notFound).toHaveBeenCalledWith(
        mockResponse,
        'Dependent not found'
      );
    });

    it('should handle service errors', async () => {
      mockService.getDependentById.mockRejectedValue(new Error('Query failed'));
      mockRequest.body = { dependent_id: 'D001' };

      await controller.getDependentById(mockRequest as Request, mockResponse as Response);

      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Error fetching dependent',
        500,
        'Query failed'
      );
    });
  });

  describe('createDependent', () => {
    it('should create dependent successfully', async () => {
      const mockMember = { member_id: 'M001', full_name: 'John Doe' };
      mockService.getMemberById.mockResolvedValue(mockMember as any);
      mockService.createDependent.mockResolvedValue('D001');
      mockRequest.body = { principal_member_id: 'M001', full_name: 'Jane Doe', relationship_id: 1 };

      await controller.createDependent(mockRequest as Request, mockResponse as Response);

      expect(mockService.getMemberById).toHaveBeenCalledWith('M001');
      expect(mockService.createDependent).toHaveBeenCalledWith(mockRequest.body, '1');
      expect(ResponseUtil.success).toHaveBeenCalledWith(
        mockResponse,
        { dependent_id: 'D001' },
        'Dependent created successfully',
        201
      );
    });

    it('should return 400 for missing principal_member_id', async () => {
      mockRequest.body = { full_name: 'Jane Doe' };

      await controller.createDependent(mockRequest as Request, mockResponse as Response);

      expect(mockService.getMemberById).not.toHaveBeenCalled();
      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Valid principal member ID is required',
        400
      );
    });

    it('should return 400 for empty principal_member_id', async () => {
      mockRequest.body = { principal_member_id: '   ', full_name: 'Jane Doe' };

      await controller.createDependent(mockRequest as Request, mockResponse as Response);

      expect(mockService.getMemberById).not.toHaveBeenCalled();
      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Valid principal member ID is required',
        400
      );
    });

    it('should return 400 for missing full_name', async () => {
      mockRequest.body = { principal_member_id: 'M001' };

      await controller.createDependent(mockRequest as Request, mockResponse as Response);

      expect(mockService.getMemberById).not.toHaveBeenCalled();
      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Dependent name is required',
        400
      );
    });

    it('should return 404 when principal member not found', async () => {
      mockService.getMemberById.mockResolvedValue(null);
      mockRequest.body = { principal_member_id: 'M999', full_name: 'Jane Doe' };

      await controller.createDependent(mockRequest as Request, mockResponse as Response);

      expect(mockService.getMemberById).toHaveBeenCalledWith('M999');
      expect(mockService.createDependent).not.toHaveBeenCalled();
      expect(ResponseUtil.notFound).toHaveBeenCalledWith(
        mockResponse,
        'Principal member not found'
      );
    });

    it('should handle service errors', async () => {
      const mockMember = { member_id: 'M001', full_name: 'John Doe' };
      mockService.getMemberById.mockResolvedValue(mockMember as any);
      mockService.createDependent.mockRejectedValue(new Error('Database error'));
      mockRequest.body = { principal_member_id: 'M001', full_name: 'Jane Doe' };

      await controller.createDependent(mockRequest as Request, mockResponse as Response);

      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Error creating dependent',
        500,
        'Database error'
      );
    });
  });

  describe('updateDependent', () => {
    it('should update dependent successfully', async () => {
      mockService.updateDependent.mockResolvedValue(true);
      mockRequest.params = { dependentId: 'D001' };
      mockRequest.body = { full_name: 'Jane Smith' };

      await controller.updateDependent(mockRequest as Request, mockResponse as Response);

      expect(mockService.updateDependent).toHaveBeenCalledWith('D001', mockRequest.body, '1');
      expect(ResponseUtil.success).toHaveBeenCalledWith(
        mockResponse,
        { dependent_id: 'D001' },
        'Dependent updated successfully'
      );
    });

    it('should return 400 for missing dependentId', async () => {
      mockRequest.params = {};
      mockRequest.body = { full_name: 'Jane Smith' };

      await controller.updateDependent(mockRequest as Request, mockResponse as Response);

      expect(mockService.updateDependent).not.toHaveBeenCalled();
      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Invalid dependent ID',
        400
      );
    });

    it('should return 400 for empty dependentId', async () => {
      mockRequest.params = { dependentId: '   ' };
      mockRequest.body = { full_name: 'Jane Smith' };

      await controller.updateDependent(mockRequest as Request, mockResponse as Response);

      expect(mockService.updateDependent).not.toHaveBeenCalled();
      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Invalid dependent ID',
        400
      );
    });

    it('should return 400 when no changes made', async () => {
      mockService.updateDependent.mockResolvedValue(false);
      mockRequest.params = { dependentId: 'D001' };
      mockRequest.body = { full_name: 'Jane Smith' };

      await controller.updateDependent(mockRequest as Request, mockResponse as Response);

      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'No changes made or dependent not found',
        400
      );
    });

    it('should handle service errors', async () => {
      mockService.updateDependent.mockRejectedValue(new Error('Update failed'));
      mockRequest.params = { dependentId: 'D001' };
      mockRequest.body = { full_name: 'Jane Smith' };

      await controller.updateDependent(mockRequest as Request, mockResponse as Response);

      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Error updating dependent',
        500,
        'Update failed'
      );
    });
  });

  describe('deleteDependent', () => {
    it('should delete dependent successfully', async () => {
      mockService.deleteDependent.mockResolvedValue(true);
      mockRequest.params = { dependentId: 'D001' };

      await controller.deleteDependent(mockRequest as Request, mockResponse as Response);

      expect(mockService.deleteDependent).toHaveBeenCalledWith('D001');
      expect(ResponseUtil.success).toHaveBeenCalledWith(
        mockResponse,
        { dependent_id: 'D001' },
        'Dependent deleted successfully'
      );
    });

    it('should return 400 for missing dependentId', async () => {
      mockRequest.params = {};

      await controller.deleteDependent(mockRequest as Request, mockResponse as Response);

      expect(mockService.deleteDependent).not.toHaveBeenCalled();
      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Invalid dependent ID',
        400
      );
    });

    it('should return 400 for empty dependentId', async () => {
      mockRequest.params = { dependentId: '   ' };

      await controller.deleteDependent(mockRequest as Request, mockResponse as Response);

      expect(mockService.deleteDependent).not.toHaveBeenCalled();
      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Invalid dependent ID',
        400
      );
    });

    it('should return 404 when dependent not found', async () => {
      mockService.deleteDependent.mockResolvedValue(false);
      mockRequest.params = { dependentId: 'D999' };

      await controller.deleteDependent(mockRequest as Request, mockResponse as Response);

      expect(mockService.deleteDependent).toHaveBeenCalledWith('D999');
      expect(ResponseUtil.notFound).toHaveBeenCalledWith(
        mockResponse,
        'Dependent not found'
      );
    });

    it('should handle service errors', async () => {
      mockService.deleteDependent.mockRejectedValue(new Error('Delete failed'));
      mockRequest.params = { dependentId: 'D001' };

      await controller.deleteDependent(mockRequest as Request, mockResponse as Response);

      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Error deleting dependent',
        500,
        'Delete failed'
      );
    });
  });

  describe('toggleDependentActive', () => {
    it('should toggle dependent active status to false', async () => {
      mockService.setDependentActiveStatus.mockResolvedValue(true);
      mockRequest.params = { dependentId: 'D001' };
      mockRequest.body = { is_active: false };

      await controller.toggleDependentActive(mockRequest as Request, mockResponse as Response);

      expect(mockService.setDependentActiveStatus).toHaveBeenCalledWith('D001', false);
      expect(ResponseUtil.success).toHaveBeenCalledWith(
        mockResponse,
        { dependent_id: 'D001', is_active: false },
        'Dependent deactivated successfully'
      );
    });

    it('should toggle dependent active status to true', async () => {
      mockService.setDependentActiveStatus.mockResolvedValue(true);
      mockRequest.params = { dependentId: 'D001' };
      mockRequest.body = { is_active: true };

      await controller.toggleDependentActive(mockRequest as Request, mockResponse as Response);

      expect(mockService.setDependentActiveStatus).toHaveBeenCalledWith('D001', true);
      expect(ResponseUtil.success).toHaveBeenCalledWith(
        mockResponse,
        { dependent_id: 'D001', is_active: true },
        'Dependent activated successfully'
      );
    });

    it('should return 400 for invalid dependentId', async () => {
      mockRequest.params = { dependentId: '' };
      mockRequest.body = { is_active: true };

      await controller.toggleDependentActive(mockRequest as Request, mockResponse as Response);

      expect(mockService.setDependentActiveStatus).not.toHaveBeenCalled();
      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Invalid dependent ID',
        400
      );
    });

    it('should return 400 for missing is_active', async () => {
      mockRequest.params = { dependentId: 'D001' };
      mockRequest.body = {};

      await controller.toggleDependentActive(mockRequest as Request, mockResponse as Response);

      expect(mockService.setDependentActiveStatus).not.toHaveBeenCalled();
      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'is_active must be a boolean value',
        400
      );
    });

    it('should return 404 when update fails', async () => {
      mockService.setDependentActiveStatus.mockResolvedValue(false);
      mockRequest.params = { dependentId: 'D999' };
      mockRequest.body = { is_active: false };

      await controller.toggleDependentActive(mockRequest as Request, mockResponse as Response);

      expect(ResponseUtil.notFound).toHaveBeenCalledWith(
        mockResponse,
        'Dependent not found'
      );
    });

    it('should handle service errors', async () => {
      mockService.setDependentActiveStatus.mockRejectedValue(new Error('Update failed'));
      mockRequest.params = { dependentId: 'D001' };
      mockRequest.body = { is_active: false };

      await controller.toggleDependentActive(mockRequest as Request, mockResponse as Response);

      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Error toggling dependent status',
        500,
        'Update failed'
      );
    });
  });

  // ============================================================================
  // MEMBER PEC (PRE-EXISTING CONDITIONS)
  // ============================================================================

  describe('getPECs', () => {
    it('should return member PECs successfully', async () => {
      const mockPECs = [
        { pec_id: 'PEC001', member_id: 'M001', condition_name: 'Diabetes', is_excluded: true }
      ];
      mockService.getPECsByDependentId.mockResolvedValue(mockPECs as any);
      mockRequest.params = { dependentId: 'D001' };

      await controller.getPECs(mockRequest as Request, mockResponse as Response);

      expect(mockService.getPECsByDependentId).toHaveBeenCalledWith('D001');
      expect(ResponseUtil.success).toHaveBeenCalledWith(
        mockResponse,
        mockPECs,
        'PEC conditions retrieved successfully'
      );
    });

    it('should return 400 for invalid dependentId', async () => {
      mockRequest.params = { dependentId: '' };

      await controller.getPECs(mockRequest as Request, mockResponse as Response);

      expect(mockService.getPECsByDependentId).not.toHaveBeenCalled();
      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Invalid dependent ID',
        400
      );
    });

    it('should handle service errors', async () => {
      mockService.getPECsByDependentId.mockRejectedValue(new Error('Query failed'));
      mockRequest.params = { dependentId: 'D001' };

      await controller.getPECs(mockRequest as Request, mockResponse as Response);

      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Error fetching PEC conditions',
        500,
        'Query failed'
      );
    });
  });

  describe('getPECById', () => {
    it('should return PEC when found', async () => {
      const mockPEC = { pec_id: 'PEC001', dependent_id: 'D001', condition_name: 'Diabetes', is_excluded: false };
      mockService.getPECById.mockResolvedValue(mockPEC as any);
      mockRequest.body = { pec_id: 'PEC001' };

      await controller.getPECById(mockRequest as Request, mockResponse as Response);

      expect(mockService.getPECById).toHaveBeenCalledWith('PEC001');
      expect(ResponseUtil.success).toHaveBeenCalledWith(
        mockResponse,
        mockPEC,
        'PEC condition retrieved successfully'
      );
    });

    it('should return 400 for missing pec_id', async () => {
      mockRequest.body = {};

      await controller.getPECById(mockRequest as Request, mockResponse as Response);

      expect(mockService.getPECById).not.toHaveBeenCalled();
      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Invalid PEC ID',
        400
      );
    });

    it('should return 400 for empty pec_id', async () => {
      mockRequest.body = { pec_id: '   ' };

      await controller.getPECById(mockRequest as Request, mockResponse as Response);

      expect(mockService.getPECById).not.toHaveBeenCalled();
      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Invalid PEC ID',
        400
      );
    });

    it('should return 404 when PEC not found', async () => {
      mockService.getPECById.mockResolvedValue(null);
      mockRequest.body = { pec_id: 'PEC999' };

      await controller.getPECById(mockRequest as Request, mockResponse as Response);

      expect(mockService.getPECById).toHaveBeenCalledWith('PEC999');
      expect(ResponseUtil.notFound).toHaveBeenCalledWith(
        mockResponse,
        'PEC condition not found'
      );
    });

    it('should handle service errors', async () => {
      mockService.getPECById.mockRejectedValue(new Error('Query failed'));
      mockRequest.body = { pec_id: 'PEC001' };

      await controller.getPECById(mockRequest as Request, mockResponse as Response);

      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Error fetching PEC condition',
        500,
        'Query failed'
      );
    });
  });

  describe('createPEC', () => {
    it('should create PEC successfully', async () => {
      mockService.getDependentById.mockResolvedValue({ dependent_id: 'D001', principal_member_id: 'M001', full_name: 'Child' } as any);
      mockService.createPEC.mockResolvedValue('PEC001');
      mockRequest.body = { dependent_id: 'D001', condition_name: 'Diabetes' };

      await controller.createPEC(mockRequest as Request, mockResponse as Response);

      expect(mockService.createPEC).toHaveBeenCalledWith(mockRequest.body, '1');
      expect(ResponseUtil.success).toHaveBeenCalledWith(
        mockResponse,
        { pec_id: 'PEC001' },
        'PEC condition created successfully',
        201
      );
    });

    it('should return 400 for missing dependent_id', async () => {
      mockRequest.body = { condition_name: 'Diabetes' };

      await controller.createPEC(mockRequest as Request, mockResponse as Response);

      expect(mockService.createPEC).not.toHaveBeenCalled();
      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Valid dependent ID is required',
        400
      );
    });

    it('should return 400 for empty dependent_id', async () => {
      mockRequest.body = { dependent_id: '   ', condition_name: 'Diabetes' };

      await controller.createPEC(mockRequest as Request, mockResponse as Response);

      expect(mockService.createPEC).not.toHaveBeenCalled();
      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Valid dependent ID is required',
        400
      );
    });

    it('should return 404 when dependent not found', async () => {
      mockService.getDependentById.mockResolvedValue(null);
      mockRequest.body = { dependent_id: 'D999', condition_name: 'Diabetes' };

      await controller.createPEC(mockRequest as Request, mockResponse as Response);

      expect(mockService.createPEC).not.toHaveBeenCalled();
      expect(ResponseUtil.notFound).toHaveBeenCalledWith(
        mockResponse,
        'Dependent not found'
      );
    });

    it('should handle service errors', async () => {
      mockService.getDependentById.mockResolvedValue({ dependent_id: 'D001', principal_member_id: 'M001', full_name: 'Child' } as any);
      mockService.createPEC.mockRejectedValue(new Error('Database error'));
      mockRequest.body = { dependent_id: 'D001', condition_name: 'Diabetes' };

      await controller.createPEC(mockRequest as Request, mockResponse as Response);

      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Error creating PEC condition',
        500,
        'Database error'
      );
    });
  });

  describe('updatePEC', () => {
    it('should update PEC successfully', async () => {
      mockService.updatePEC.mockResolvedValue(true);
      mockRequest.params = { pecId: 'PEC001' };
      mockRequest.body = { condition_name: 'Type 2 Diabetes' };

      await controller.updatePEC(mockRequest as Request, mockResponse as Response);

      expect(mockService.updatePEC).toHaveBeenCalledWith('PEC001', mockRequest.body, '1');
      expect(ResponseUtil.success).toHaveBeenCalledWith(
        mockResponse,
        { pec_id: 'PEC001' },
        'PEC condition updated successfully'
      );
    });

    it('should return 400 for missing pecId', async () => {
      mockRequest.params = {};
      mockRequest.body = { condition_name: 'Diabetes' };

      await controller.updatePEC(mockRequest as Request, mockResponse as Response);

      expect(mockService.updatePEC).not.toHaveBeenCalled();
      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Invalid PEC ID',
        400
      );
    });

    it('should return 400 for empty pecId', async () => {
      mockRequest.params = { pecId: '   ' };
      mockRequest.body = { condition_name: 'Diabetes' };

      await controller.updatePEC(mockRequest as Request, mockResponse as Response);

      expect(mockService.updatePEC).not.toHaveBeenCalled();
      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Invalid PEC ID',
        400
      );
    });

    it('should return 400 when no changes made', async () => {
      mockService.updatePEC.mockResolvedValue(false);
      mockRequest.params = { pecId: 'PEC001' };
      mockRequest.body = { condition_name: 'Diabetes' };

      await controller.updatePEC(mockRequest as Request, mockResponse as Response);

      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'No changes made or PEC condition not found',
        400
      );
    });

    it('should handle service errors', async () => {
      mockService.updatePEC.mockRejectedValue(new Error('Update failed'));
      mockRequest.params = { pecId: 'PEC001' };
      mockRequest.body = { condition_name: 'Diabetes' };

      await controller.updatePEC(mockRequest as Request, mockResponse as Response);

      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Error updating PEC condition',
        500,
        'Update failed'
      );
    });
  });

  describe('deletePEC', () => {
    it('should delete PEC successfully', async () => {
      mockService.deletePEC.mockResolvedValue(true);
      mockRequest.params = { pecId: 'PEC001' };

      await controller.deletePEC(mockRequest as Request, mockResponse as Response);

      expect(mockService.deletePEC).toHaveBeenCalledWith('PEC001');
      expect(ResponseUtil.success).toHaveBeenCalledWith(
        mockResponse,
        { pec_id: 'PEC001' },
        'PEC condition deleted successfully'
      );
    });

    it('should return 400 for missing pecId', async () => {
      mockRequest.params = {};

      await controller.deletePEC(mockRequest as Request, mockResponse as Response);

      expect(mockService.deletePEC).not.toHaveBeenCalled();
      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Invalid PEC ID',
        400
      );
    });

    it('should return 400 for empty pecId', async () => {
      mockRequest.params = { pecId: '   ' };

      await controller.deletePEC(mockRequest as Request, mockResponse as Response);

      expect(mockService.deletePEC).not.toHaveBeenCalled();
      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Invalid PEC ID',
        400
      );
    });

    it('should return 404 when PEC not found', async () => {
      mockService.deletePEC.mockResolvedValue(false);
      mockRequest.params = { pecId: 'PEC999' };

      await controller.deletePEC(mockRequest as Request, mockResponse as Response);

      expect(mockService.deletePEC).toHaveBeenCalledWith('PEC999');
      expect(ResponseUtil.notFound).toHaveBeenCalledWith(
        mockResponse,
        'PEC condition not found'
      );
    });

    it('should handle service errors', async () => {
      mockService.deletePEC.mockRejectedValue(new Error('Delete failed'));
      mockRequest.params = { pecId: 'PEC001' };

      await controller.deletePEC(mockRequest as Request, mockResponse as Response);

      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Error deleting PEC condition',
        500,
        'Delete failed'
      );
    });
  });

  describe('togglePECExcluded', () => {
    it('should toggle PEC excluded status to false', async () => {
      mockService.setPECExcludedStatus.mockResolvedValue(true);
      mockRequest.params = { pecId: 'PEC001' };
      mockRequest.body = { is_excluded: false };

      await controller.togglePECExcluded(mockRequest as Request, mockResponse as Response);

      expect(mockService.setPECExcludedStatus).toHaveBeenCalledWith('PEC001', false);
      expect(ResponseUtil.success).toHaveBeenCalledWith(
        mockResponse,
        { pec_id: 'PEC001', is_excluded: false },
        'PEC condition included successfully'
      );
    });

    it('should toggle PEC excluded status to true', async () => {
      mockService.setPECExcludedStatus.mockResolvedValue(true);
      mockRequest.params = { pecId: 'PEC001' };
      mockRequest.body = { is_excluded: true };

      await controller.togglePECExcluded(mockRequest as Request, mockResponse as Response);

      expect(mockService.setPECExcludedStatus).toHaveBeenCalledWith('PEC001', true);
      expect(ResponseUtil.success).toHaveBeenCalledWith(
        mockResponse,
        { pec_id: 'PEC001', is_excluded: true },
        'PEC condition excluded successfully'
      );
    });

    it('should return 400 for invalid pecId', async () => {
      mockRequest.params = { pecId: '' };
      mockRequest.body = { is_excluded: true };

      await controller.togglePECExcluded(mockRequest as Request, mockResponse as Response);

      expect(mockService.setPECExcludedStatus).not.toHaveBeenCalled();
      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Invalid PEC ID',
        400
      );
    });

    it('should return 400 for missing is_excluded', async () => {
      mockRequest.params = { pecId: 'PEC001' };
      mockRequest.body = {};

      await controller.togglePECExcluded(mockRequest as Request, mockResponse as Response);

      expect(mockService.setPECExcludedStatus).not.toHaveBeenCalled();
      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'is_excluded must be a boolean value',
        400
      );
    });

    it('should return 404 when update fails', async () => {
      mockService.setPECExcludedStatus.mockResolvedValue(false);
      mockRequest.params = { pecId: 'PEC999' };
      mockRequest.body = { is_excluded: false };

      await controller.togglePECExcluded(mockRequest as Request, mockResponse as Response);

      expect(ResponseUtil.notFound).toHaveBeenCalledWith(
        mockResponse,
        'PEC condition not found'
      );
    });

    it('should handle service errors', async () => {
      mockService.setPECExcludedStatus.mockRejectedValue(new Error('Update failed'));
      mockRequest.params = { pecId: 'PEC001' };
      mockRequest.body = { is_excluded: false };

      await controller.togglePECExcluded(mockRequest as Request, mockResponse as Response);

      expect(ResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        'Error toggling PEC excluded status',
        500,
        'Update failed'
      );
    });
  });
});
