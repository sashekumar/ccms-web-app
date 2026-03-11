import { MemberAddressesRepository } from './member-addresses.repository';
import { CreateMemberAddressDto, UpdateMemberAddressDto } from './member-addresses.types';
import { connectionManager } from '../../core/database/connection-manager';
import sql from 'mssql';

// Mock the database service
jest.mock('../../core/database/connection-manager');

describe('MemberAddressesRepository', () => {
  let repository: MemberAddressesRepository;
  let mockPool: any;
  let mockRequest: any;
  let mockTransaction: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock request
    mockRequest = {
      input: jest.fn().mockReturnThis(),
      query: jest.fn()
    };

    // Create mock transaction
    mockTransaction = {
      request: jest.fn().mockReturnValue(mockRequest),
      begin: jest.fn().mockResolvedValue(undefined),
      commit: jest.fn().mockResolvedValue(undefined),
      rollback: jest.fn().mockResolvedValue(undefined)
    };

    // Create mock pool
    mockPool = {
      request: jest.fn().mockReturnValue(mockRequest),
      transaction: jest.fn().mockReturnValue(mockTransaction)
    };

    // Mock connectionManager
    (connectionManager.getPool as jest.Mock).mockResolvedValue(mockPool);

    repository = new MemberAddressesRepository();
  });

  describe('getAddressesByMemberId', () => {
    it('should return array of addresses for a member', async () => {
      const mockAddresses = [
        {
          address_id: '1',
          member_id: '100',
          address_type: 'PRIMARY',
          street_line1: '123 Main St',
          city: 'New York',
          state: 'NY',
          postal_code: '10001',
          country: 'USA',
          is_primary: true
        },
        {
          address_id: '2',
          member_id: '100',
          address_type: 'MAILING',
          street_line1: '456 Second Ave',
          city: 'Brooklyn',
          state: 'NY',
          postal_code: '11201',
          country: 'USA',
          is_primary: false
        }
      ];

      mockRequest.query.mockResolvedValueOnce({ recordset: mockAddresses });

      const result = await repository.getAddressesByMemberId('100');

      expect(result).toEqual(mockAddresses);
      expect(mockRequest.input).toHaveBeenCalledWith('member_id', sql.BigInt, '100');
      expect(mockRequest.query).toHaveBeenCalledWith(expect.stringContaining('WHERE member_id = @member_id'));
    });

    it('should return empty array when no addresses found', async () => {
      mockRequest.query.mockResolvedValueOnce({ recordset: [] });

      const result = await repository.getAddressesByMemberId('999');

      expect(result).toEqual([]);
      expect(mockRequest.input).toHaveBeenCalledWith('member_id', sql.BigInt, '999');
    });

    it('should order by is_primary DESC and address_id ASC', async () => {
      mockRequest.query.mockResolvedValueOnce({ recordset: [] });

      await repository.getAddressesByMemberId('100');

      expect(mockRequest.query).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY is_primary DESC, address_id ASC')
      );
    });
  });

  describe('getAddressById', () => {
    it('should return address when found', async () => {
      const mockAddress = {
        address_id: '1',
        member_id: '100',
        address_type: 'PRIMARY',
        street_line1: '123 Main St',
        city: 'New York',
        is_primary: true
      };

      mockRequest.query.mockResolvedValueOnce({ recordset: [mockAddress] });

      const result = await repository.getAddressById('1');

      expect(result).toEqual(mockAddress);
      expect(mockRequest.input).toHaveBeenCalledWith('address_id', sql.BigInt, '1');
    });

    it('should return null when address not found', async () => {
      mockRequest.query.mockResolvedValueOnce({ recordset: [] });

      const result = await repository.getAddressById('999');

      expect(result).toBeNull();
    });
  });

  describe('createAddress', () => {
    it('should create address with all fields', async () => {
      const dto: CreateMemberAddressDto = {
        member_id: '100',
        address_type: 'PRIMARY',
        street_line1: '123 Main St',
        street_line2: 'Apt 5',
        city: 'New York',
        state: 'NY',
        postal_code: '10001',
        country: 'USA',
        is_primary: false
      };

      mockRequest.query.mockResolvedValueOnce({ recordset: [{ address_id: '1' }] });

      const result = await repository.createAddress(dto, 'admin');

      expect(result).toBe('1');
      expect(mockRequest.input).toHaveBeenCalledWith('member_id', sql.BigInt, '100');
      expect(mockRequest.input).toHaveBeenCalledWith('address_type', sql.VarChar(50), 'PRIMARY');
      expect(mockRequest.input).toHaveBeenCalledWith('street_line1', sql.NVarChar(255), '123 Main St');
      expect(mockRequest.input).toHaveBeenCalledWith('street_line2', sql.NVarChar(255), 'Apt 5');
      expect(mockRequest.input).toHaveBeenCalledWith('city', sql.NVarChar(100), 'New York');
      expect(mockRequest.input).toHaveBeenCalledWith('state', sql.VarChar(50), 'NY');
      expect(mockRequest.input).toHaveBeenCalledWith('postal_code', sql.VarChar(20), '10001');
      expect(mockRequest.input).toHaveBeenCalledWith('country', sql.VarChar(100), 'USA');
      expect(mockRequest.input).toHaveBeenCalledWith('is_primary', sql.Bit, false);
      expect(mockRequest.input).toHaveBeenCalledWith('createdBy', sql.VarChar(50), 'admin');
      expect(mockRequest.query).toHaveBeenCalledWith(expect.stringContaining('SELECT CAST(SCOPE_IDENTITY() AS VARCHAR)'));
    });

    it('should create address without createdBy', async () => {
      const dto: CreateMemberAddressDto = {
        member_id: '100',
        address_type: 'MAILING',
        is_primary: false
      };

      mockRequest.query.mockResolvedValueOnce({ recordset: [{ address_id: '2' }] });

      const result = await repository.createAddress(dto);

      expect(result).toBe('2');
      expect(mockRequest.input).toHaveBeenCalledWith('member_id', sql.BigInt, '100');
      expect(mockRequest.input).not.toHaveBeenCalledWith('createdBy', expect.anything(), expect.anything());
    });

    it('should unset primary for member when creating primary address', async () => {
      const dto: CreateMemberAddressDto = {
        member_id: '100',
        address_type: 'PRIMARY',
        is_primary: true
      };

      // Mock both queries: unsetPrimaryForMember and createAddress
      mockRequest.query
        .mockResolvedValueOnce({ rowsAffected: [1] })  // unsetPrimaryForMember
        .mockResolvedValueOnce({ recordset: [{ address_id: '3' }] });  // createAddress

      const result = await repository.createAddress(dto, 'admin');

      expect(result).toBe('3');
      // Verify unsetPrimaryForMember was called
      expect(mockRequest.query).toHaveBeenCalledTimes(2);
    });

    it('should default address_type to PRIMARY when not provided', async () => {
      const dto: CreateMemberAddressDto = {
        member_id: '100'
      };

      mockRequest.query.mockResolvedValueOnce({ recordset: [{ address_id: '4' }] });

      await repository.createAddress(dto);

      expect(mockRequest.input).toHaveBeenCalledWith('address_type', sql.VarChar(50), 'PRIMARY');
    });

    it('should handle null values for optional fields', async () => {
      const dto: CreateMemberAddressDto = {
        member_id: '100',
        street_line1: undefined,
        city: undefined,
        state: undefined
      };

      mockRequest.query.mockResolvedValueOnce({ recordset: [{ address_id: '5' }] });

      await repository.createAddress(dto);

      expect(mockRequest.input).toHaveBeenCalledWith('street_line1', sql.NVarChar(255), null);
      expect(mockRequest.input).toHaveBeenCalledWith('city', sql.NVarChar(100), null);
      expect(mockRequest.input).toHaveBeenCalledWith('state', sql.VarChar(50), null);
    });
  });

  describe('updateAddress', () => {
    it('should update address with all fields', async () => {
      const addressId = '1';
      const dto: UpdateMemberAddressDto = {
        address_id: addressId,
        address_type: 'BILLING',
        street_line1: '789 New St',
        street_line2: 'Floor 3',
        city: 'Boston',
        state: 'MA',
        postal_code: '02101',
        country: 'USA',
        is_primary: false
      };

      mockRequest.query.mockResolvedValueOnce({ rowsAffected: [1] });

      const result = await repository.updateAddress(addressId, dto, 'admin');

      expect(result).toBe(true);
      expect(mockRequest.input).toHaveBeenCalledWith('address_type', sql.VarChar(50), 'BILLING');
      expect(mockRequest.input).toHaveBeenCalledWith('street_line1', sql.NVarChar(255), '789 New St');
      expect(mockRequest.input).toHaveBeenCalledWith('street_line2', sql.NVarChar(255), 'Floor 3');
      expect(mockRequest.input).toHaveBeenCalledWith('city', sql.NVarChar(100), 'Boston');
      expect(mockRequest.input).toHaveBeenCalledWith('state', sql.VarChar(50), 'MA');
      expect(mockRequest.input).toHaveBeenCalledWith('postal_code', sql.VarChar(20), '02101');
      expect(mockRequest.input).toHaveBeenCalledWith('country', sql.VarChar(100), 'USA');
      expect(mockRequest.input).toHaveBeenCalledWith('is_primary', sql.Bit, false);
      expect(mockRequest.input).toHaveBeenCalledWith('updatedBy', sql.VarChar(50), 'admin');
    });

    it('should return false when no fields to update', async () => {
      const result = await repository.updateAddress('1', { address_id: '1' });

      expect(result).toBe(false);
      expect(mockRequest.query).not.toHaveBeenCalled();
    });

    it('should update only specified fields', async () => {
      const dto: UpdateMemberAddressDto = {
        address_id: '1',
        city: 'San Francisco'
      };

      mockRequest.query.mockResolvedValueOnce({ rowsAffected: [1] });

      const result = await repository.updateAddress('1', dto, 'admin');

      expect(result).toBe(true);
      expect(mockRequest.input).toHaveBeenCalledWith('city', sql.NVarChar(100), 'San Francisco');
      expect(mockRequest.input).toHaveBeenCalledWith('updatedBy', sql.VarChar(50), 'admin');
    });

    it('should unset primary for member when setting is_primary to true', async () => {
      const dto: UpdateMemberAddressDto = {
        address_id: '1',
        is_primary: true
      };

      // Mock both queries: getAddressById, unsetPrimaryForMember, and updateAddress
      mockRequest.query
        .mockResolvedValueOnce({ recordset: [{ address_id: '1', member_id: '100' }] })  // getAddressById
        .mockResolvedValueOnce({ rowsAffected: [1] })  // unsetPrimaryForMember
        .mockResolvedValueOnce({ rowsAffected: [1] });  // updateAddress

      const result = await repository.updateAddress('1', dto);

      expect(result).toBe(true);
      expect(mockRequest.query).toHaveBeenCalledTimes(3);
    });

    it('should return false when no rows affected', async () => {
      const dto: UpdateMemberAddressDto = {
        address_id: '999',
        city: 'Miami'
      };

      mockRequest.query.mockResolvedValueOnce({ rowsAffected: [0] });

      const result = await repository.updateAddress('999', dto);

      expect(result).toBe(false);
    });
  });

  describe('deleteAddress', () => {
    it('should delete address successfully', async () => {
      mockRequest.query.mockResolvedValueOnce({ rowsAffected: [1] });

      const result = await repository.deleteAddress('1');

      expect(result).toBe(true);
      expect(mockRequest.input).toHaveBeenCalledWith('address_id', sql.BigInt, '1');
      expect(mockRequest.query).toHaveBeenCalledWith(expect.stringContaining('DELETE FROM'));
    });

    it('should return false when no rows affected', async () => {
      mockRequest.query.mockResolvedValueOnce({ rowsAffected: [0] });

      const result = await repository.deleteAddress('999');

      expect(result).toBe(false);
    });
  });

  describe('setPrimaryAddress', () => {
    it('should set address as primary successfully', async () => {
      mockRequest.query
        .mockResolvedValueOnce({ rowsAffected: [1] })  // Unset primary
        .mockResolvedValueOnce({ rowsAffected: [1] });  // Set primary

      const result = await repository.setPrimaryAddress('100', '1');

      expect(result).toBe(true);
      expect(mockTransaction.begin).toHaveBeenCalled();
      expect(mockTransaction.commit).toHaveBeenCalled();
      expect(mockTransaction.rollback).not.toHaveBeenCalled();
    });

    it('should rollback on error', async () => {
      const error = new Error('Database error');
      mockRequest.query.mockRejectedValueOnce(error);

      await expect(repository.setPrimaryAddress('100', '1')).rejects.toThrow('Database error');

      expect(mockTransaction.begin).toHaveBeenCalled();
      expect(mockTransaction.rollback).toHaveBeenCalled();
      expect(mockTransaction.commit).not.toHaveBeenCalled();
    });

    it('should return false when address not found', async () => {
      mockRequest.query
        .mockResolvedValueOnce({ rowsAffected: [0] })  // Unset primary
        .mockResolvedValueOnce({ rowsAffected: [0] });  // Set primary (not found)

      const result = await repository.setPrimaryAddress('100', '999');

      expect(result).toBe(false);
    });

    it('should use correct SQL parameters', async () => {
      mockRequest.query
        .mockResolvedValueOnce({ rowsAffected: [1] })
        .mockResolvedValueOnce({ rowsAffected: [1] });

      await repository.setPrimaryAddress('200', '5');

      expect(mockRequest.input).toHaveBeenCalledWith('member_id', sql.BigInt, '200');
      expect(mockRequest.input).toHaveBeenCalledWith('address_id', sql.BigInt, '5');
    });
  });
});
