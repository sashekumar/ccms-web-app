import { HospitalStaffContactsRepository } from './hospital-staff-contacts.repository';
import { connectionManager } from '../../core/database/connection-manager';
import sql from 'mssql';

// Mock dependencies
jest.mock('../../core/database/connection-manager');
jest.mock('mssql', () => ({
  BigInt: 'BigInt',
  VarChar: jest.fn(),
  Bit: 'Bit',
}));

describe('HospitalStaffContactsRepository', () => {
  let repository: HospitalStaffContactsRepository;
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
    repository = new HospitalStaffContactsRepository();
  });

  describe('getContactsByStaffId', () => {
    it('should return array of contacts for a staff member', async () => {
      const mockContacts = [
        {
          contact_id: 1,
          legacy_hospital_contact_id: null,
          staff_id: 100,
          contact_type: 'EMAIL',
          contact_value: 'staff@hospital.com',
          is_primary: true,
        },
        {
          contact_id: 2,
          legacy_hospital_contact_id: null,
          staff_id: 100,
          contact_type: 'MOBILE',
          contact_value: '0123456789',
          is_primary: false,
        },
      ];

      mockRequest.query.mockResolvedValue({ recordset: mockContacts });

      const result = await repository.getContactsByStaffId(100);

      expect(result).toEqual(mockContacts);
      expect(mockRequest.input).toHaveBeenCalledWith('staffId', sql.BigInt, 100);
      expect(mockRequest.query).toHaveBeenCalledWith(expect.stringContaining('SELECT'));
      expect(mockRequest.query).toHaveBeenCalledWith(expect.stringContaining('WHERE staff_id = @staffId'));
    });

    it('should return empty array when no contacts found', async () => {
      mockRequest.query.mockResolvedValue({ recordset: [] });

      const result = await repository.getContactsByStaffId(999);

      expect(result).toEqual([]);
      expect(mockRequest.input).toHaveBeenCalledWith('staffId', sql.BigInt, 999);
    });

    it('should order contacts by is_primary DESC, contact_type ASC', async () => {
      mockRequest.query.mockResolvedValue({ recordset: [] });

      await repository.getContactsByStaffId(100);

      expect(mockRequest.query).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY is_primary DESC, contact_type ASC')
      );
    });
  });

  describe('getContactById', () => {
    it('should return contact when found', async () => {
      const mockContact = {
        contact_id: 1,
        legacy_hospital_contact_id: null,
        staff_id: 100,
        contact_type: 'EMAIL',
        contact_value: 'staff@hospital.com',
        is_primary: true,
      };

      mockRequest.query.mockResolvedValue({ recordset: [mockContact] });

      const result = await repository.getContactById(1);

      expect(result).toEqual(mockContact);
      expect(mockPool.request).toHaveBeenCalled();
    });

    it('should return null when contact not found', async () => {
      mockRequest.query.mockResolvedValue({ recordset: [] });

      const result = await repository.getContactById(999);

      expect(result).toBeNull();
    });
  });

  describe('createContact', () => {
    it('should create contact with all fields and return ID', async () => {
      const newContactId = 123;
      mockRequest.query.mockResolvedValue({ recordset: [{ contact_id: newContactId }] });

      const result = await repository.createContact(
        100,
        'EMAIL',
        'staff@hospital.com',
        true,
        'test-user'
      );

      expect(result).toBe(newContactId);
      expect(mockRequest.input).toHaveBeenCalledWith('staffId', sql.BigInt, 100);
      expect(mockRequest.input).toHaveBeenCalledWith('contactType', undefined, 'EMAIL');
      expect(mockRequest.input).toHaveBeenCalledWith('contactValue', undefined, 'staff@hospital.com');
      expect(mockRequest.input).toHaveBeenCalledWith('isPrimary', sql.Bit, true);
      expect(mockRequest.input).toHaveBeenCalledWith('createdBy', undefined, 'test-user');
      expect(mockRequest.query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO'));
      expect(mockRequest.query).toHaveBeenCalledWith(expect.stringContaining('OUTPUT INSERTED.contact_id'));
    });

    it('should create contact without optional contact_value', async () => {
      const newContactId = 124;
      mockRequest.query.mockResolvedValue({ recordset: [{ contact_id: newContactId }] });

      const result = await repository.createContact(
        100,
        'MOBILE',
        undefined,
        false,
        'test-user'
      );

      expect(result).toBe(newContactId);
      expect(mockRequest.input).not.toHaveBeenCalledWith('contactValue', expect.anything(), expect.anything());
    });

    it('should handle non-primary contact creation', async () => {
      mockRequest.query.mockResolvedValue({ recordset: [{ contact_id: 125 }] });

      await repository.createContact(
        100,
        'PHONE',
        '0123456789',
        false,
        'test-user'
      );

      expect(mockRequest.input).toHaveBeenCalledWith('isPrimary', sql.Bit, false);
    });
  });

  describe('updateContact', () => {
    it('should update all fields when provided', async () => {
      mockRequest.query.mockResolvedValue({ rowsAffected: [1] });

      await repository.updateContact(
        1,
        'EMAIL',
        'newemail@hospital.com',
        false,
        'test-user'
      );

      expect(mockRequest.input).toHaveBeenCalledWith('contactId', sql.BigInt, 1);
      expect(mockRequest.input).toHaveBeenCalledWith('contactType', undefined, 'EMAIL');
      expect(mockRequest.input).toHaveBeenCalledWith('contactValue', undefined, 'newemail@hospital.com');
      expect(mockRequest.input).toHaveBeenCalledWith('isPrimary', sql.Bit, false);
      expect(mockRequest.input).toHaveBeenCalledWith('updatedBy', undefined, 'test-user');
      expect(mockRequest.query).toHaveBeenCalledWith(expect.stringContaining('UPDATE'));
      expect(mockRequest.query).toHaveBeenCalledWith(expect.stringContaining('contact_type = @contactType'));
      expect(mockRequest.query).toHaveBeenCalledWith(expect.stringContaining('contact_value = @contactValue'));
      expect(mockRequest.query).toHaveBeenCalledWith(expect.stringContaining('is_primary = @isPrimary'));
      expect(mockRequest.query).toHaveBeenCalledWith(expect.stringContaining('updated_at = GETDATE()'));
    });

    it('should update only contactType when other fields are undefined', async () => {
      mockRequest.query.mockResolvedValue({ rowsAffected: [1] });

      await repository.updateContact(
        1,
        'MOBILE',
        undefined,
        undefined,
        'test-user'
      );

      expect(mockRequest.input).toHaveBeenCalledWith('contactType', undefined, 'MOBILE');
      expect(mockRequest.input).not.toHaveBeenCalledWith('contactValue', expect.anything(), expect.anything());
      expect(mockRequest.input).not.toHaveBeenCalledWith('isPrimary', expect.anything(), expect.anything());
    });

    it('should return early when no fields to update', async () => {
      await repository.updateContact(
        1,
        undefined,
        undefined,
        undefined,
        'test-user'
      );

      expect(mockRequest.query).not.toHaveBeenCalled();
    });

    it('should set contactValue to null when empty string provided', async () => {
      mockRequest.query.mockResolvedValue({ rowsAffected: [1] });

      await repository.updateContact(
        1,
        undefined,
        '',
        undefined,
        'test-user'
      );

      expect(mockRequest.input).toHaveBeenCalledWith('contactValue', undefined, null);
    });

    it('should handle changing primary flag', async () => {
      mockRequest.query.mockResolvedValue({ rowsAffected: [1] });

      await repository.updateContact(
        1,
        undefined,
        undefined,
        true,
        'test-user'
      );

      expect(mockRequest.input).toHaveBeenCalledWith('isPrimary', sql.Bit, true);
    });
  });

  describe('deleteContact', () => {
    it('should delete contact successfully', async () => {
      mockRequest.query.mockResolvedValue({ rowsAffected: [1] });

      await repository.deleteContact(1);

      expect(mockRequest.input).toHaveBeenCalledWith('contactId', sql.BigInt, 1);
      expect(mockRequest.query).toHaveBeenCalledWith(expect.stringContaining('DELETE FROM'));
      expect(mockRequest.query).toHaveBeenCalledWith(expect.stringContaining('WHERE contact_id = @contactId'));
    });

    it('should handle deletion of non-existent contact', async () => {
      mockRequest.query.mockResolvedValue({ rowsAffected: [0] });

      // Should not throw error
      await expect(repository.deleteContact(999)).resolves.not.toThrow();
    });
  });

  describe('clearPrimaryFlags', () => {
    it('should clear all primary flags for a staff member', async () => {
      mockRequest.query.mockResolvedValue({ rowsAffected: [3] });

      await repository.clearPrimaryFlags(100);

      expect(mockRequest.input).toHaveBeenCalledWith('staffId', sql.BigInt, 100);
      expect(mockRequest.query).toHaveBeenCalledWith(expect.stringContaining('UPDATE'));
      expect(mockRequest.query).toHaveBeenCalledWith(expect.stringContaining('SET is_primary = 0'));
      expect(mockRequest.query).toHaveBeenCalledWith(expect.stringContaining('WHERE staff_id = @staffId'));
    });

    it('should handle staff with no primary contacts', async () => {
      mockRequest.query.mockResolvedValue({ rowsAffected: [0] });

      await expect(repository.clearPrimaryFlags(999)).resolves.not.toThrow();
    });
  });

  describe('error handling', () => {
    it('should propagate database errors', async () => {
      const dbError = new Error('Database connection failed');
      mockRequest.query.mockRejectedValue(dbError);

      await expect(repository.getContactsByStaffId(100)).rejects.toThrow('Database connection failed');
    });

    it('should handle SQL injection attempts safely', async () => {
      mockRequest.query.mockResolvedValue({ recordset: [{ contact_id: 123 }] });

      // SQL injection attempt should be parameterized
      await repository.createContact(
        100,
        "'; DROP TABLE staff_contacts; --",
        'test@email.com',
        true,
        'test-user'
      );

      expect(mockRequest.input).toHaveBeenCalledWith('contactType', undefined, "'; DROP TABLE staff_contacts; --");
      expect(mockRequest.query).toHaveBeenCalledWith(expect.not.stringContaining('DROP TABLE'));
    });
  });
});
