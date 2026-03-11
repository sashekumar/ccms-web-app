import { FeeSchedulesRepository } from './fee-schedules.repository';
import { FeeScheduleFilters } from './fee-schedules.types';
import { connectionManager } from '../../core/database/connection-manager';
import sql from 'mssql';

// Mock the database service
jest.mock('../../core/database/connection-manager');

describe('FeeSchedulesRepository', () => {
  let repository: FeeSchedulesRepository;
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

    repository = new FeeSchedulesRepository();
  });

  describe('getFeesByHospitalId', () => {
    it('should return array of fees for a hospital', async () => {
      const mockFees = [
        {
          fee_id: 1,
          hospital_id: 100,
          fee_type: 'CONSULTATION',
          item_code: 'CONS001',
          description: 'General consultation',
          amount: 150,
          effective_date: new Date('2024-01-01'),
          expiry_date: new Date('2024-12-31'),
          is_active: true
        },
        {
          fee_id: 2,
          hospital_id: 100,
          fee_type: 'PROCEDURE',
          item_code: 'PROC001',
          description: 'Minor surgery',
          amount: 500,
          effective_date: new Date('2024-01-01'),
          expiry_date: null,
          is_active: true
        }
      ];

      mockRequest.query.mockResolvedValueOnce({ recordset: mockFees });

      const result = await repository.getFeesByHospitalId(100);

      expect(result).toEqual(mockFees);
      expect(mockRequest.input).toHaveBeenCalledWith('hospitalId', sql.BigInt, 100);
      expect(mockRequest.query).toHaveBeenCalledWith(expect.stringContaining('WHERE hospital_id = @hospitalId'));
    });

    it('should return empty array when no fees found', async () => {
      mockRequest.query.mockResolvedValueOnce({ recordset: [] });

      const result = await repository.getFeesByHospitalId(999);

      expect(result).toEqual([]);
      expect(mockRequest.input).toHaveBeenCalledWith('hospitalId', sql.BigInt, 999);
    });

    it('should apply fee_type filter', async () => {
      const filters: FeeScheduleFilters = {
        fee_type: 'CONSULTATION'
      };

      mockRequest.query.mockResolvedValueOnce({ recordset: [] });

      await repository.getFeesByHospitalId(100, filters);

      expect(mockRequest.input).toHaveBeenCalledWith('hospitalId', sql.BigInt, 100);
      expect(mockRequest.input).toHaveBeenCalledWith('feeType', sql.VarChar(50), 'CONSULTATION');
      expect(mockRequest.query).toHaveBeenCalledWith(expect.stringContaining('fee_type = @feeType'));
    });

    it('should apply is_active filter', async () => {
      const filters: FeeScheduleFilters = {
        is_active: true
      };

      mockRequest.query.mockResolvedValueOnce({ recordset: [] });

      await repository.getFeesByHospitalId(100, filters);

      expect(mockRequest.input).toHaveBeenCalledWith('hospitalId', sql.BigInt, 100);
      expect(mockRequest.input).toHaveBeenCalledWith('isActive', sql.Bit, true);
      expect(mockRequest.query).toHaveBeenCalledWith(expect.stringContaining('is_active = @isActive'));
    });

    it('should apply multiple filters', async () => {
      const filters: FeeScheduleFilters = {
        fee_type: 'PROCEDURE',
        is_active: false
      };

      mockRequest.query.mockResolvedValueOnce({ recordset: [] });

      await repository.getFeesByHospitalId(100, filters);

      expect(mockRequest.input).toHaveBeenCalledWith('hospitalId', sql.BigInt, 100);
      expect(mockRequest.input).toHaveBeenCalledWith('feeType', sql.VarChar(50), 'PROCEDURE');
      expect(mockRequest.input).toHaveBeenCalledWith('isActive', sql.Bit, false);
    });

    it('should order by fee_type ASC and item_code ASC', async () => {
      mockRequest.query.mockResolvedValueOnce({ recordset: [] });

      await repository.getFeesByHospitalId(100);

      expect(mockRequest.query).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY fee_type ASC, item_code ASC')
      );
    });
  });

  describe('getFeeById', () => {
    it('should return fee when found', async () => {
      const mockFee = {
        fee_id: 1,
        hospital_id: 100,
        fee_type: 'CONSULTATION',
        item_code: 'CONS001',
        description: 'General consultation',
        amount: 150,
        is_active: true
      };

      mockRequest.query.mockResolvedValueOnce({ recordset: [mockFee] });

      const result = await repository.getFeeById(1);

      expect(result).toEqual(mockFee);
    });

    it('should return null when fee not found', async () => {
      mockRequest.query.mockResolvedValueOnce({ recordset: [] });

      const result = await repository.getFeeById(999);

      expect(result).toBeNull();
    });
  });

  describe('createFee', () => {
    it('should create fee with all fields', async () => {
      const effectiveDate = new Date('2024-01-01');
      const expiryDate = new Date('2024-12-31');

      mockRequest.query.mockResolvedValueOnce({ recordset: [{ fee_id: 1 }] });

      const result = await repository.createFee(
        100,                    // hospitalId
        'CONSULTATION',        // feeType
        'CONS001',             // itemCode
        'General consultation', // description
        150,                   // amount
        effectiveDate,         // effectiveDate
        expiryDate,            // expiryDate
        true,                  // isActive
        'admin'                // createdBy
      );

      expect(result).toBe(1);
      expect(mockRequest.input).toHaveBeenCalledWith('hospitalId', sql.BigInt, 100);
      expect(mockRequest.input).toHaveBeenCalledWith('feeType', sql.VarChar(50), 'CONSULTATION');
      expect(mockRequest.input).toHaveBeenCalledWith('itemCode', sql.VarChar(50), 'CONS001');
      expect(mockRequest.input).toHaveBeenCalledWith('description', sql.NVarChar(sql.MAX), 'General consultation');
      expect(mockRequest.input).toHaveBeenCalledWith('amount', sql.Money, 150);
      expect(mockRequest.input).toHaveBeenCalledWith('effectiveDate', sql.Date, effectiveDate);
      expect(mockRequest.input).toHaveBeenCalledWith('expiryDate', sql.Date, expiryDate);
      expect(mockRequest.input).toHaveBeenCalledWith('isActive', sql.Bit, true);
      expect(mockRequest.input).toHaveBeenCalledWith('createdBy', sql.VarChar(50), 'admin');
      expect(mockRequest.query).toHaveBeenCalledWith(expect.stringContaining('OUTPUT INSERTED.fee_id'));
    });

    it('should create fee with only required fields', async () => {
      mockRequest.query.mockResolvedValueOnce({ recordset: [{ fee_id: 2 }] });

      const result = await repository.createFee(
        undefined,   // hospitalId
        undefined,   // feeType
        undefined,   // itemCode
        undefined,   // description
        undefined,   // amount
        undefined,   // effectiveDate
        undefined,   // expiryDate
        false,       // isActive
        'admin'      // createdBy
      );

      expect(result).toBe(2);
      expect(mockRequest.input).toHaveBeenCalledWith('isActive', sql.Bit, false);
      expect(mockRequest.input).toHaveBeenCalledWith('createdBy', sql.VarChar(50), 'admin');
      // Optional fields should not be added
      expect(mockRequest.input).not.toHaveBeenCalledWith('hospitalId', expect.anything(), expect.anything());
      expect(mockRequest.input).not.toHaveBeenCalledWith('feeType', expect.anything(), expect.anything());
    });

    it('should handle optional fields individually', async () => {
      mockRequest.query.mockResolvedValueOnce({ recordset: [{ fee_id: 3 }] });

      await repository.createFee(
        100,         // hospitalId
        'PROCEDURE', // feeType
        undefined,   // itemCode
        undefined,   // description
        250,         // amount
        undefined,   // effectiveDate
        undefined,   // expiryDate
        true,        // isActive
        'admin'      // createdBy
      );

      expect(mockRequest.input).toHaveBeenCalledWith('hospitalId', sql.BigInt, 100);
      expect(mockRequest.input).toHaveBeenCalledWith('feeType', sql.VarChar(50), 'PROCEDURE');
      expect(mockRequest.input).toHaveBeenCalledWith('amount', sql.Money, 250);
      expect(mockRequest.input).not.toHaveBeenCalledWith('itemCode', expect.anything(), expect.anything());
      expect(mockRequest.input).not.toHaveBeenCalledWith('description', expect.anything(), expect.anything());
    });
  });

  describe('updateFee', () => {
    it('should update fee with all fields', async () => {
      const effectiveDate = new Date('2024-02-01');
      const expiryDate = new Date('2024-11-30');

      mockRequest.query.mockResolvedValueOnce({ rowsAffected: [1] });

      await repository.updateFee(
        1,                     // feeId
        'PROCEDURE',          // feeType
        'PROC002',            // itemCode
        'Major surgery',      // description
        1000,                 // amount
        effectiveDate,        // effectiveDate
        expiryDate,           // expiryDate
        false,                // isActive
        'admin'               // updatedBy
      );

      expect(mockRequest.input).toHaveBeenCalledWith('feeType', sql.VarChar(50), 'PROCEDURE');
      expect(mockRequest.input).toHaveBeenCalledWith('itemCode', sql.VarChar(50), 'PROC002');
      expect(mockRequest.input).toHaveBeenCalledWith('description', sql.NVarChar(sql.MAX), 'Major surgery');
      expect(mockRequest.input).toHaveBeenCalledWith('amount', sql.Money, 1000);
      expect(mockRequest.input).toHaveBeenCalledWith('effectiveDate', sql.Date, effectiveDate);
      expect(mockRequest.input).toHaveBeenCalledWith('expiryDate', sql.Date, expiryDate);
      expect(mockRequest.input).toHaveBeenCalledWith('isActive', sql.Bit, false);
      expect(mockRequest.input).toHaveBeenCalledWith('updatedBy', sql.VarChar(50), 'admin');
      expect(mockRequest.input).toHaveBeenCalledWith('feeId', sql.BigInt, 1);
      expect(mockRequest.query).toHaveBeenCalledWith(expect.stringContaining('updated_at = GETDATE()'));
    });

    it('should return early when no fields to update', async () => {
      await repository.updateFee(
        1, undefined, undefined, undefined, undefined, undefined, undefined, undefined, 'admin'
      );

      expect(mockRequest.query).not.toHaveBeenCalled();
    });

    it('should update only specified fields', async () => {
      mockRequest.query.mockResolvedValueOnce({ rowsAffected: [1] });

      await repository.updateFee(
        1, undefined, undefined, undefined, 200, undefined, undefined, undefined, 'admin'
      );

      expect(mockRequest.input).toHaveBeenCalledWith('amount', sql.Money, 200);
      expect(mockRequest.input).toHaveBeenCalledWith('updatedBy', sql.VarChar(50), 'admin');
      expect(mockRequest.input).toHaveBeenCalledWith('feeId', sql.BigInt, 1);
      expect(mockRequest.input).not.toHaveBeenCalledWith('feeType', expect.anything(), expect.anything());
    });

    it('should handle null values for fields being cleared', async () => {
      mockRequest.query.mockResolvedValueOnce({ rowsAffected: [1] });

      await repository.updateFee(
        1, '', '', '', undefined, undefined, undefined, undefined, 'admin'
      );

      expect(mockRequest.input).toHaveBeenCalledWith('feeType', sql.VarChar(50), null);
      expect(mockRequest.input).toHaveBeenCalledWith('itemCode', sql.VarChar(50), null);
      expect(mockRequest.input).toHaveBeenCalledWith('description', sql.NVarChar(sql.MAX), null);
    });
  });

  describe('deleteFee', () => {
    it('should delete fee successfully', async () => {
      mockRequest.query.mockResolvedValueOnce({ rowsAffected: [1] });

      await repository.deleteFee(1);

      expect(mockRequest.input).toHaveBeenCalledWith('feeId', sql.BigInt, 1);
      expect(mockRequest.query).toHaveBeenCalledWith(expect.stringContaining('DELETE FROM'));
      expect(mockRequest.query).toHaveBeenCalledWith(expect.stringContaining('WHERE fee_id = @feeId'));
    });

    it('should use correct SQL parameters', async () => {
      mockRequest.query.mockResolvedValueOnce({ rowsAffected: [1] });

      await repository.deleteFee(999);

      expect(mockRequest.input).toHaveBeenCalledWith('feeId', sql.BigInt, 999);
    });
  });
});
