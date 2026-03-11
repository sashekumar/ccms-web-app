import { MemberContactsRepository } from './member-contacts.repository';
import { connectionManager } from '../../core/database/connection-manager';
import sql from 'mssql';
import { CreateMemberContactDto, UpdateMemberContactDto } from './member-contacts.types';

// Mock dependencies
jest.mock('../../core/database/connection-manager');
jest.mock('mssql', () => ({
  BigInt: 'BigInt',
  VarChar: jest.fn(),
  Bit: 'Bit',
}));

describe('MemberContactsRepository', () => {
  let repository: MemberContactsRepository;
  let mockPool: any;
  let mockRequest: any;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create mock request with proper MSSQL pattern
    mockRequest = {
      input: jest.fn().mockReturnThis(),
      query: jest.fn(),
    };

    // Create mock pool
    mockPool = {
      request: jest.fn().mockReturnValue(mockRequest),
    };

    // Setup connectionManager mock
    (connectionManager.getPool as jest.Mock).mockResolvedValue(mockPool);

    // Create repository instance
    repository = new MemberContactsRepository();
  });

  describe('getContactsByMemberId', () => {
    it('should return array of contacts for a member', async () => {
      const mockContacts = [
        {
          contact_id: '1',
          legacy_member_contact_id: null,
          member_id: '100',
          contact_type: 'EMAIL',
          contact_value: 'member@email.com',
          is_primary: true,
        },
        {
          contact_id: '2',
          legacy_member_contact_id: null,
          member_id: '100',
          contact_type: 'MOBILE',
          contact_value: '0123456789',
          is_primary: false,
        },
      ];

      mockRequest.query.mockResolvedValue({ recordset: mockContacts });

      const result = await repository.getContactsByMemberId('100');

      expect(result).toEqual(mockContacts);
      expect(mockRequest.input).toHaveBeenCalledWith('member_id', sql.BigInt, '100');
      expect(mockRequest.query).toHaveBeenCalledWith(expect.stringContaining('SELECT'));
      expect(mockRequest.query).toHaveBeenCalledWith(expect.stringContaining('WHERE member_id = @member_id'));
    });

    it('should return empty array when no contacts found', async () => {
      mockRequest.query.mockResolvedValue({ recordset: [] });

      const result = await repository.getContactsByMemberId('999');

      expect(result).toEqual([]);
    });

    it('should order contacts by type and primary flag', async () => {
      mockRequest.query.mockResolvedValue({ recordset: [] });

      await repository.getContactsByMemberId('100');

      expect(mockRequest.query).toHaveBeenCalledWith(expect.stringContaining('ORDER BY'));
      expect(mockRequest.query).toHaveBeenCalledWith(expect.stringContaining('is_primary DESC'));
    });
  });

  describe('getContactById', () => {
    it('should return contact when found', async () => {
      const mockContact = {
        contact_id: '1',
        legacy_member_contact_id: null,
        member_id: '100',
        contact_type: 'EMAIL',
        contact_value: 'member@email.com',
        is_primary: true,
      };

      mockRequest.query.mockResolvedValue({ recordset: [mockContact] });

      const result = await repository.getContactById('1');

      expect(result).toEqual(mockContact);
      expect(mockRequest.input).toHaveBeenCalledWith('contact_id', sql.BigInt, '1');
    });

    it('should return null when contact not found', async () => {
      mockRequest.query.mockResolvedValue({ recordset: [] });

      const result = await repository.getContactById('999');

      expect(result).toBeNull();
    });
  });

  describe('createContact', () => {
    it('should create contact with all fields and return ID', async () => {
      const newContactId = '123';
      mockRequest.query.mockResolvedValue({ recordset: [{ contact_id: newContactId }] });

      const dto: CreateMemberContactDto = {
        member_id: '100',
        contact_type: 'EMAIL',
        contact_value: 'member@email.com',
        is_primary: true,
      };

      const result = await repository.createContact(dto, 'test-user');

      expect(result).toBe(newContactId);
      expect(mockRequest.input).toHaveBeenCalledWith('member_id', sql.BigInt, '100');
      expect(mockRequest.input).toHaveBeenCalledWith('contact_type', undefined, 'EMAIL');
      expect(mockRequest.input).toHaveBeenCalledWith('contact_value', undefined, 'member@email.com');
      expect(mockRequest.input).toHaveBeenCalledWith('is_primary', sql.Bit, true);
      expect(mockRequest.input).toHaveBeenCalledWith('createdBy', undefined, 'test-user');
      expect(mockRequest.query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO'));
    });

    it('should create contact without optional createdBy', async () => {
      mockRequest.query.mockResolvedValue({ recordset: [{ contact_id: '124' }] });

      const dto: CreateMemberContactDto = {
        member_id: '100',
        contact_type: 'MOBILE',
        contact_value: '0123456789',
        is_primary: false,
      };

      const result = await repository.createContact(dto);

      expect(result).toBe('124');
      expect(mockRequest.input).not.toHaveBeenCalledWith('createdBy', expect.anything(), expect.anything());
    });

    it('should default is_primary to false when not provided', async () => {
      mockRequest.query.mockResolvedValue({ recordset: [{ contact_id: '125' }] });

      const dto: CreateMemberContactDto = {
        member_id: '100',
        contact_type: 'EMAIL',
        contact_value: 'test@email.com',
      };

      await repository.createContact(dto, 'test-user');

      expect(mockRequest.input).toHaveBeenCalledWith('is_primary', sql.Bit, false);
    });

    it('should handle null contact_value', async () => {
      mockRequest.query.mockResolvedValue({ recordset: [{ contact_id: '126' }] });

      const dto: CreateMemberContactDto = {
        member_id: '100',
        contact_type: 'PHONE',
        contact_value: undefined,
        is_primary: false,
      };

      await repository.createContact(dto);

      expect(mockRequest.input).toHaveBeenCalledWith('contact_value', undefined, null);
    });
  });

  describe('updateContact', () => {
    it('should update all fields when provided', async () => {
      // Mock for getContactById call (when is_primary = true)
      mockRequest.query.mockResolvedValueOnce({
        recordset: [{
          contact_id: '1',
          member_id: '100',
          contact_type: 'EMAIL',
          is_primary: false,
        }],
      });
      // Mock for unsetPrimaryForMemberAndType update query
      mockRequest.query.mockResolvedValueOnce({ rowsAffected: [1] });
      // Mock for the actual update query
      mockRequest.query.mockResolvedValueOnce({ rowsAffected: [1] });

      const dto: UpdateMemberContactDto = {
        contact_id: '1',
        contact_type: 'MOBILE',
        contact_value: '0999999999',
        is_primary: true,
      };

      const result = await repository.updateContact('1', dto, 'test-user');

      expect(result).toBe(true);
      expect(mockRequest.input).toHaveBeenCalledWith('contact_id', sql.BigInt, '1');
      expect(mockRequest.input).toHaveBeenCalledWith('contact_type', undefined, 'MOBILE');
      expect(mockRequest.input).toHaveBeenCalledWith('contact_value', undefined, '0999999999');
      expect(mockRequest.input).toHaveBeenCalledWith('is_primary', sql.Bit, true);
      expect(mockRequest.input).toHaveBeenCalledWith('updatedBy', undefined, 'test-user');
    });

    it('should return false when no fields to update', async () => {
      const dto: UpdateMemberContactDto = {
        contact_id: '1',
      };

      const result = await repository.updateContact('1', dto); // No updatedBy

      expect(result).toBe(false);
    });

    it('should update without updatedBy parameter', async () => {
      mockRequest.query.mockResolvedValue({ rowsAffected: [1] });

      const dto: UpdateMemberContactDto = {
        contact_id: '1',
        contact_value: 'new@email.com',
      };

      await repository.updateContact('1', dto);

      expect(mockRequest.input).not.toHaveBeenCalledWith('updatedBy', expect.anything(), expect.anything());
    });

    it('should handle failed update', async () => {
      mockRequest.query.mockResolvedValue({ rowsAffected: [0] });

      const dto: UpdateMemberContactDto = {
        contact_id: '999',
        contact_value: 'new@email.com',
      };

      const result = await repository.updateContact('999', dto);

      expect(result).toBe(false);
    });
  });

  describe('deleteContact', () => {
    it('should delete contact successfully', async () => {
      mockRequest.query.mockResolvedValue({ rowsAffected: [1] });

      const result = await repository.deleteContact('1');

      expect(result).toBe(true);
      expect(mockRequest.input).toHaveBeenCalledWith('contact_id', sql.BigInt, '1');
      expect(mockRequest.query).toHaveBeenCalledWith(expect.stringContaining('DELETE FROM'));
    });

    it('should return false when contact not found', async () => {
      mockRequest.query.mockResolvedValue({ rowsAffected: [0] });

      const result = await repository.deleteContact('999');

      expect(result).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should propagate database errors', async () => {
      const dbError = new Error('Database connection failed');
      mockRequest.query.mockRejectedValue(dbError);

      await expect(repository.getContactsByMemberId('100')).rejects.toThrow('Database connection failed');
    });

    it('should handle SQL injection attempts safely', async () => {
      mockRequest.query.mockResolvedValue({ recordset: [{ contact_id: '123' }] });

      const dto: CreateMemberContactDto = {
        member_id: '100',
        contact_type: "'; DROP TABLE member_contacts; --",
        contact_value: 'test@email.com',
        is_primary: false,
      };

      await repository.createContact(dto, 'test-user');

      expect(mockRequest.input).toHaveBeenCalledWith('contact_type', undefined, "'; DROP TABLE member_contacts; --");
    });
  });

  describe('edge cases', () => {
    it('should handle very long contact values', async () => {
      mockRequest.query.mockResolvedValue({ recordset: [{ contact_id: '127' }] });

      const longEmail = 'a'.repeat(90) + '@email.com';
      const dto: CreateMemberContactDto = {
        member_id: '100',
        contact_type: 'EMAIL',
        contact_value: longEmail,
        is_primary: false,
      };

      await repository.createContact(dto);

      expect(mockRequest.input).toHaveBeenCalledWith('contact_value', undefined, longEmail);
    });

    it('should handle special characters in contact values', async () => {
      mockRequest.query.mockResolvedValue({ recordset: [{ contact_id: '128' }] });

      const specialEmail = "test+special.123_456@domain-name.co.uk";
      const dto: CreateMemberContactDto = {
        member_id: '100',
        contact_type: 'EMAIL',
        contact_value: specialEmail,
        is_primary: false,
      };

      await repository.createContact(dto);

      expect(mockRequest.input).toHaveBeenCalledWith('contact_value', undefined, specialEmail);
    });
  });
});
