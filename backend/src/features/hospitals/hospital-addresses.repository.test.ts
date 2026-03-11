import { HospitalAddressesRepository } from './hospital-addresses.repository';
import { connectionManager } from '../../core/database/connection-manager';
import sql from 'mssql';

// Mock the database service
jest.mock('../../core/database/connection-manager');

describe('HospitalAddressesRepository', () => {
  let repository: HospitalAddressesRepository;
  let mockPool: any;
  let mockRequest: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock request
    mockRequest = {
      input: jest.fn().mockReturnThis(),
      query: jest.fn()
    };

    // Create mock pool
    mockPool = {
      request: jest.fn().mockReturnValue(mockRequest)
    };

    // Mock connectionManager
    (connectionManager.getPool as jest.Mock).mockResolvedValue(mockPool);

    repository = new HospitalAddressesRepository();
  });

  describe('getAddressesByHospitalId', () => {
    it('should return array of addresses for a hospital', async () => {
      const mockAddresses = [
        {
          address_id: 1,
          hospital_id: 1,
          address_type: 'MAIN',
          street_line1: '123 Main St',
          city: 'New York',
          state: 'NY',
          postal_code: '10001',
          country: 'USA',
          is_primary: true
        },
        {
          address_id: 2,
          hospital_id: 1,
          address_type: 'BILLING',
          street_line1: '456 Second Ave',
          city: 'New York',
          state: 'NY',
          postal_code: '10002',
          country: 'USA',
          is_primary: false
        }
      ];

      mockRequest.query.mockResolvedValueOnce({ recordset: mockAddresses });

      const result = await repository.getAddressesByHospitalId(1);

      expect(result).toEqual(mockAddresses);
      expect(mockRequest.input).toHaveBeenCalledWith('hospitalId', sql.BigInt, 1);
      expect(mockRequest.query).toHaveBeenCalledWith(expect.stringContaining('WHERE hospital_id = @hospitalId'));
    });

    it('should return empty array when no addresses found', async () => {
      mockRequest.query.mockResolvedValueOnce({ recordset: [] });

      const result = await repository.getAddressesByHospitalId(999);

      expect(result).toEqual([]);
      expect(mockRequest.input).toHaveBeenCalledWith('hospitalId', sql.BigInt, 999);
    });

    it('should order by is_primary DESC and address_id ASC', async () => {
      mockRequest.query.mockResolvedValueOnce({ recordset: [] });

      await repository.getAddressesByHospitalId(1);

      expect(mockRequest.query).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY is_primary DESC, address_id ASC')
      );
    });
  });

  describe('getAddressById', () => {
    it('should return address when found', async () => {
      const mockAddress = {
        address_id: 1,
        hospital_id: 1,
        address_type: 'MAIN',
        street_line1: '123 Main St',
        city: 'New York',
        is_primary: true
      };

      mockRequest.query.mockResolvedValueOnce({ recordset: [mockAddress] });

      const result = await repository.getAddressById(1);

      expect(result).toEqual(mockAddress);
    });

    it('should return null when address not found', async () => {
      mockRequest.query.mockResolvedValueOnce({ recordset: [] });

      const result = await repository.getAddressById(999);

      expect(result).toBeNull();
    });
  });

  describe('createAddress', () => {
    it('should create address with all required fields', async () => {
      const addressId = 1;
      mockRequest.query.mockResolvedValueOnce({ recordset: [{ address_id: addressId }] });

      const result = await repository.createAddress(
        1,                    // hospitalId
        'MAIN',              // addressType
        '123 Main St',       // streetLine1
        undefined,           // streetLine2
        'New York',          // city
        'NY',                // state
        '10001',             // postalCode
        'USA',               // country
        40.7128,             // latitude
        -74.0060,            // longitude
        true,                // isPrimary
        'admin'              // createdBy
      );

      expect(result).toBe(addressId);
      expect(mockRequest.input).toHaveBeenCalledWith('hospitalId', sql.BigInt, 1);
      expect(mockRequest.input).toHaveBeenCalledWith('addressType', sql.VarChar(50), 'MAIN');
      expect(mockRequest.input).toHaveBeenCalledWith('isPrimary', sql.Bit, true);
      expect(mockRequest.input).toHaveBeenCalledWith('createdBy', sql.VarChar(50), 'admin');
      expect(mockRequest.input).toHaveBeenCalledWith('streetLine1', sql.NVarChar(255), '123 Main St');
      expect(mockRequest.input).toHaveBeenCalledWith('city', sql.NVarChar(100), 'New York');
      expect(mockRequest.input).toHaveBeenCalledWith('state', sql.VarChar(50), 'NY');
      expect(mockRequest.input).toHaveBeenCalledWith('postalCode', sql.VarChar(20), '10001');
      expect(mockRequest.input).toHaveBeenCalledWith('country', sql.VarChar(100), 'USA');
      expect(mockRequest.input).toHaveBeenCalledWith('latitude', sql.Decimal(10, 8), 40.7128);
      expect(mockRequest.input).toHaveBeenCalledWith('longitude', sql.Decimal(11, 8), -74.0060);
      expect(mockRequest.query).toHaveBeenCalledWith(expect.stringContaining('OUTPUT INSERTED.address_id'));
    });

    it('should create address with only required fields', async () => {
      const addressId = 2;
      mockRequest.query.mockResolvedValueOnce({ recordset: [{ address_id: addressId }] });

      const result = await repository.createAddress(
        1,           // hospitalId
        'BILLING',   // addressType
        undefined,   // streetLine1
        undefined,   // streetLine2
        undefined,   // city
        undefined,   // state
        undefined,   // postalCode
        undefined,   // country
        undefined,   // latitude
        undefined,   // longitude
        false,       // isPrimary
        'admin'      // createdBy
      );

      expect(result).toBe(addressId);
      expect(mockRequest.input).toHaveBeenCalledWith('hospitalId', sql.BigInt, 1);
      expect(mockRequest.input).toHaveBeenCalledWith('addressType', sql.VarChar(50), 'BILLING');
      expect(mockRequest.input).toHaveBeenCalledWith('isPrimary', sql.Bit, false);
      expect(mockRequest.input).toHaveBeenCalledWith('createdBy', sql.VarChar(50), 'admin');
      // Optional fields should not be called
      expect(mockRequest.input).not.toHaveBeenCalledWith('streetLine1', expect.anything(), expect.anything());
      expect(mockRequest.input).not.toHaveBeenCalledWith('city', expect.anything(), expect.anything());
    });

    it('should handle streetLine2 when provided', async () => {
      const addressId = 3;
      mockRequest.query.mockResolvedValueOnce({ recordset: [{ address_id: addressId }] });

      await repository.createAddress(
        1, 'MAIN', '123 Main St', 'Suite 100', undefined, undefined, undefined, undefined, undefined, undefined, true, 'admin'
      );

      expect(mockRequest.input).toHaveBeenCalledWith('streetLine2', sql.NVarChar(255), 'Suite 100');
    });
  });

  describe('updateAddress', () => {
    it('should update address with all fields', async () => {
      mockRequest.query.mockResolvedValueOnce({ rowsAffected: [1] });

      await repository.updateAddress(
        1,                    // addressId
        'BILLING',           // addressType
        '456 New St',        // streetLine1
        'Apt 5',             // streetLine2
        'Boston',            // city
        'MA',                // state
        '02101',             // postalCode
        'USA',               // country
        42.3601,             // latitude
        -71.0589,            // longitude
        false,               // isPrimary
        'admin'              // updatedBy
      );

      expect(mockRequest.input).toHaveBeenCalledWith('addressType', sql.VarChar(50), 'BILLING');
      expect(mockRequest.input).toHaveBeenCalledWith('streetLine1', sql.NVarChar(255), '456 New St');
      expect(mockRequest.input).toHaveBeenCalledWith('streetLine2', sql.NVarChar(255), 'Apt 5');
      expect(mockRequest.input).toHaveBeenCalledWith('city', sql.NVarChar(100), 'Boston');
      expect(mockRequest.input).toHaveBeenCalledWith('state', sql.VarChar(50), 'MA');
      expect(mockRequest.input).toHaveBeenCalledWith('postalCode', sql.VarChar(20), '02101');
      expect(mockRequest.input).toHaveBeenCalledWith('country', sql.VarChar(100), 'USA');
      expect(mockRequest.input).toHaveBeenCalledWith('latitude', sql.Decimal(10, 8), 42.3601);
      expect(mockRequest.input).toHaveBeenCalledWith('longitude', sql.Decimal(11, 8), -71.0589);
      expect(mockRequest.input).toHaveBeenCalledWith('isPrimary', sql.Bit, false);
      expect(mockRequest.input).toHaveBeenCalledWith('updatedBy', sql.VarChar(50), 'admin');
      expect(mockRequest.input).toHaveBeenCalledWith('addressId', sql.BigInt, 1);
      expect(mockRequest.query).toHaveBeenCalledWith(expect.stringContaining('UPDATE'));
    });

    it('should return early when no fields to update', async () => {
      await repository.updateAddress(
        1, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, 'admin'
      );

      expect(mockRequest.query).not.toHaveBeenCalled();
    });

    it('should update only specified fields', async () => {
      mockRequest.query.mockResolvedValueOnce({ rowsAffected: [1] });

      await repository.updateAddress(
        1, 'MAIN', undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, 'admin'
      );

      expect(mockRequest.input).toHaveBeenCalledWith('addressType', sql.VarChar(50), 'MAIN');
      expect(mockRequest.input).toHaveBeenCalledWith('updatedBy', sql.VarChar(50), 'admin');
      expect(mockRequest.input).toHaveBeenCalledWith('addressId', sql.BigInt, 1);
      expect(mockRequest.query).toHaveBeenCalledWith(expect.stringContaining('updated_at = GETDATE()'));
    });

    it('should handle null values for optional fields', async () => {
      mockRequest.query.mockResolvedValueOnce({ rowsAffected: [1] });

      await repository.updateAddress(
        1, undefined, '', undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, 'admin'
      );

      expect(mockRequest.input).toHaveBeenCalledWith('streetLine1', sql.NVarChar(255), null);
    });
  });

  describe('deleteAddress', () => {
    it('should delete address successfully', async () => {
      mockRequest.query.mockResolvedValueOnce({ rowsAffected: [1] });

      await repository.deleteAddress(1);

      expect(mockRequest.input).toHaveBeenCalledWith('addressId', sql.BigInt, 1);
      expect(mockRequest.query).toHaveBeenCalledWith(expect.stringContaining('DELETE FROM'));
      expect(mockRequest.query).toHaveBeenCalledWith(expect.stringContaining('WHERE address_id = @addressId'));
    });

    it('should use correct SQL parameters', async () => {
      mockRequest.query.mockResolvedValueOnce({ rowsAffected: [1] });

      await repository.deleteAddress(999);

      expect(mockRequest.input).toHaveBeenCalledWith('addressId', sql.BigInt, 999);
    });
  });

  describe('clearPrimaryFlags', () => {
    it('should clear primary flags for all addresses of a hospital', async () => {
      mockRequest.query.mockResolvedValueOnce({ rowsAffected: [2] });

      await repository.clearPrimaryFlags(1);

      expect(mockRequest.input).toHaveBeenCalledWith('hospitalId', sql.BigInt, 1);
      expect(mockRequest.query).toHaveBeenCalledWith(expect.stringContaining('UPDATE'));
      expect(mockRequest.query).toHaveBeenCalledWith(expect.stringContaining('SET is_primary = 0'));
      expect(mockRequest.query).toHaveBeenCalledWith(expect.stringContaining('WHERE hospital_id = @hospitalId'));
    });

    it('should use correct SQL parameters', async () => {
      mockRequest.query.mockResolvedValueOnce({ rowsAffected: [0] });

      await repository.clearPrimaryFlags(999);

      expect(mockRequest.input).toHaveBeenCalledWith('hospitalId', sql.BigInt, 999);
    });
  });
});
