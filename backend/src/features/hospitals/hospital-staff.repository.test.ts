import { HospitalStaffRepository } from './hospital-staff.repository';
import { connectionManager } from '../../core/database/connection-manager';
import sql from 'mssql';

// Mock the database service
jest.mock('../../core/database/connection-manager');

describe('HospitalStaffRepository', () => {
  let repository: HospitalStaffRepository;
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

    repository = new HospitalStaffRepository();
  });

  describe('getStaffByHospitalId', () => {
    it('should return array of staff for a hospital', async () => {
      const mockStaff = [
        {
          staff_id: 1,
          hospital_id: 100,
          staff_name: 'Dr. John Smith',
          staff_type: 'DOCTOR',
          specialty: 'Cardiology',
          is_active: true
        },
        {
          staff_id: 2,
          hospital_id: 100,
          staff_name: 'Dr. Jane Doe',
          staff_type: 'DOCTOR',
          specialty: 'Neurology',
          is_active: true
        },
        {
          staff_id: 3,
          hospital_id: 100,
          staff_name: 'Nurse Mary Johnson',
          staff_type: 'NURSE',
          specialty: null,
          is_active: true
        }
      ];

      mockRequest.query.mockResolvedValueOnce({ recordset: mockStaff });

      const result = await repository.getStaffByHospitalId(100);

      expect(result).toEqual(mockStaff);
      expect(mockRequest.input).toHaveBeenCalledWith('hospitalId', sql.BigInt, 100);
      expect(mockRequest.query).toHaveBeenCalledWith(expect.stringContaining('WHERE hospital_id = @hospitalId'));
    });

    it('should return empty array when no staff found', async () => {
      mockRequest.query.mockResolvedValueOnce({ recordset: [] });

      const result = await repository.getStaffByHospitalId(999);

      expect(result).toEqual([]);
      expect(mockRequest.input).toHaveBeenCalledWith('hospitalId', sql.BigInt, 999);
    });

    it('should order by staff_name ASC', async () => {
      mockRequest.query.mockResolvedValueOnce({ recordset: [] });

      await repository.getStaffByHospitalId(100);

      expect(mockRequest.query).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY staff_name ASC')
      );
    });
  });

  describe('getStaffById', () => {
    it('should return staff when found', async () => {
      const mockStaff = {
        staff_id: 1,
        hospital_id: 100,
        staff_name: 'Dr. John Smith',
        staff_type: 'DOCTOR',
        specialty: 'Cardiology',
        is_active: true
      };

      mockRequest.query.mockResolvedValueOnce({ recordset: [mockStaff] });

      const result = await repository.getStaffById(1);

      expect(result).toEqual(mockStaff);
    });

    it('should return null when staff not found', async () => {
      mockRequest.query.mockResolvedValueOnce({ recordset: [] });

      const result = await repository.getStaffById(999);

      expect(result).toBeNull();
    });
  });

  describe('createStaff', () => {
    it('should create staff with all fields', async () => {
      mockRequest.query.mockResolvedValueOnce({ recordset: [{ staff_id: 1 }] });

      const result = await repository.createStaff(
        100,                   // hospitalId
        'Dr. John Smith',      // staffName
        'DOCTOR',              // staffType
        'Cardiology',          // specialty
        true,                  // isActive
        'admin'                // createdBy
      );

      expect(result).toBe(1);
      expect(mockRequest.input).toHaveBeenCalledWith('hospitalId', sql.BigInt, 100);
      expect(mockRequest.input).toHaveBeenCalledWith('staffName', sql.NVarChar(255), 'Dr. John Smith');
      expect(mockRequest.input).toHaveBeenCalledWith('staffType', sql.VarChar(50), 'DOCTOR');
      expect(mockRequest.input).toHaveBeenCalledWith('specialty', sql.NVarChar(255), 'Cardiology');
      expect(mockRequest.input).toHaveBeenCalledWith('isActive', sql.Bit, true);
      expect(mockRequest.input).toHaveBeenCalledWith('createdBy', sql.VarChar(50), 'admin');
      expect(mockRequest.query).toHaveBeenCalledWith(expect.stringContaining('OUTPUT INSERTED.staff_id'));
    });

    it('should create staff with only required fields', async () => {
      mockRequest.query.mockResolvedValueOnce({ recordset: [{ staff_id: 2 }] });

      const result = await repository.createStaff(
        100,                   // hospitalId
        'Nurse Mary Johnson',  // staffName
        undefined,             // staffType
        undefined,             // specialty
        false,                 // isActive
        'admin'                // createdBy
      );

      expect(result).toBe(2);
      expect(mockRequest.input).toHaveBeenCalledWith('hospitalId', sql.BigInt, 100);
      expect(mockRequest.input).toHaveBeenCalledWith('staffName', sql.NVarChar(255), 'Nurse Mary Johnson');
      expect(mockRequest.input).toHaveBeenCalledWith('isActive', sql.Bit, false);
      expect(mockRequest.input).toHaveBeenCalledWith('createdBy', sql.VarChar(50), 'admin');
      expect(mockRequest.input).not.toHaveBeenCalledWith('staffType', expect.anything(), expect.anything());
      expect(mockRequest.input).not.toHaveBeenCalledWith('specialty', expect.anything(), expect.anything());
    });

    it('should handle staff_type when provided', async () => {
      mockRequest.query.mockResolvedValueOnce({ recordset: [{ staff_id: 3 }] });

      await repository.createStaff(100, 'Dr. Sarah Jones', 'SURGEON', undefined, true, 'admin');

      expect(mockRequest.input).toHaveBeenCalledWith('staffType', sql.VarChar(50), 'SURGEON');
    });

    it('should handle specialty when provided', async () => {
      mockRequest.query.mockResolvedValueOnce({ recordset: [{ staff_id: 4 }] });

      await repository.createStaff(100, 'Dr. Mike Brown', undefined, 'Orthopedics', true, 'admin');

      expect(mockRequest.input).toHaveBeenCalledWith('specialty', sql.NVarChar(255), 'Orthopedics');
    });
  });

  describe('updateStaff', () => {
    it('should update staff with all fields', async () => {
      mockRequest.query.mockResolvedValueOnce({ rowsAffected: [1] });

      await repository.updateStaff(
        1,                     // staffId
        'Dr. John A. Smith',   // staffName
        'CONSULTANT',          // staffType
        'Cardiology & ICU',    // specialty
        false,                 // isActive
        'admin'                // updatedBy
      );

      expect(mockRequest.input).toHaveBeenCalledWith('staffName', sql.NVarChar(255), 'Dr. John A. Smith');
      expect(mockRequest.input).toHaveBeenCalledWith('staffType', sql.VarChar(50), 'CONSULTANT');
      expect(mockRequest.input).toHaveBeenCalledWith('specialty', sql.NVarChar(255), 'Cardiology & ICU');
      expect(mockRequest.input).toHaveBeenCalledWith('isActive', sql.Bit, false);
      expect(mockRequest.input).toHaveBeenCalledWith('updatedBy', sql.VarChar(50), 'admin');
      expect(mockRequest.input).toHaveBeenCalledWith('staffId', sql.BigInt, 1);
      expect(mockRequest.query).toHaveBeenCalledWith(expect.stringContaining('UPDATE'));
      expect(mockRequest.query).toHaveBeenCalledWith(expect.stringContaining('updated_at = GETDATE()'));
    });

    it('should return early when no fields to update', async () => {
      await repository.updateStaff(
        1, undefined, undefined, undefined, undefined, 'admin'
      );

      expect(mockRequest.query).not.toHaveBeenCalled();
    });

    it('should update only specified fields', async () => {
      mockRequest.query.mockResolvedValueOnce({ rowsAffected: [1] });

      await repository.updateStaff(
        1, undefined, undefined, undefined, false, 'admin'
      );

      expect(mockRequest.input).toHaveBeenCalledWith('isActive', sql.Bit, false);
      expect(mockRequest.input).toHaveBeenCalledWith('updatedBy', sql.VarChar(50), 'admin');
      expect(mockRequest.input).toHaveBeenCalledWith('staffId', sql.BigInt, 1);
      expect(mockRequest.input).not.toHaveBeenCalledWith('staffName', expect.anything(), expect.anything());
      expect(mockRequest.input).not.toHaveBeenCalledWith('staffType', expect.anything(), expect.anything());
    });

    it('should handle null values for fields being cleared', async () => {
      mockRequest.query.mockResolvedValueOnce({ rowsAffected: [1] });

      await repository.updateStaff(
        1, undefined, '', '', undefined, 'admin'
      );

      expect(mockRequest.input).toHaveBeenCalledWith('staffType', sql.VarChar(50), null);
      expect(mockRequest.input).toHaveBeenCalledWith('specialty', sql.NVarChar(255), null);
    });

    it('should update staff_name', async () => {
      mockRequest.query.mockResolvedValueOnce({ rowsAffected: [1] });

      await repository.updateStaff(1, 'Dr. Updated Name', undefined, undefined, undefined, 'admin');

      expect(mockRequest.input).toHaveBeenCalledWith('staffName', sql.NVarChar(255), 'Dr. Updated Name');
    });

    it('should update specialty', async () => {
      mockRequest.query.mockResolvedValueOnce({ rowsAffected: [1] });

      await repository.updateStaff(1, undefined, undefined, 'Pediatrics', undefined, 'admin');

      expect(mockRequest.input).toHaveBeenCalledWith('specialty', sql.NVarChar(255), 'Pediatrics');
    });
  });

  describe('deleteStaff', () => {
    it('should delete staff successfully', async () => {
      mockRequest.query.mockResolvedValueOnce({ rowsAffected: [1] });

      await repository.deleteStaff(1);

      expect(mockRequest.input).toHaveBeenCalledWith('staffId', sql.BigInt, 1);
      expect(mockRequest.query).toHaveBeenCalledWith(expect.stringContaining('DELETE FROM'));
      expect(mockRequest.query).toHaveBeenCalledWith(expect.stringContaining('WHERE staff_id = @staffId'));
    });

    it('should use correct SQL parameters', async () => {
      mockRequest.query.mockResolvedValueOnce({ rowsAffected: [1] });

      await repository.deleteStaff(999);

      expect(mockRequest.input).toHaveBeenCalledWith('staffId', sql.BigInt, 999);
    });

    it('should handle hard delete', async () => {
      mockRequest.query.mockResolvedValueOnce({ rowsAffected: [1] });

      await repository.deleteStaff(5);

      // Verify it's a hard delete (DELETE FROM) not soft delete (UPDATE)
      expect(mockRequest.query).toHaveBeenCalledWith(expect.stringContaining('DELETE FROM'));
      expect(mockRequest.query).not.toHaveBeenCalledWith(expect.stringContaining('UPDATE'));
    });
  });
});
