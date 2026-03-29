import { AdmissionsRepository } from './admissions.repository';
import { AdmissionAssessmentRepository } from './admission-assessment.repository';
import { MonitoringRepository } from '../monitoring/monitoring.repository';
import { UpsertAdmissionAssessmentsDto, AdmissionAssessment } from './dto/admission-assessment.dto';
import {
  Admission,
  AdmissionFilters,
  PaginatedAdmissions
} from './entities/admission.entity';
import {
  CreateAdmissionDto,
  UpdateAdmissionDto,
  ApproveAdmissionDto,
  RejectAdmissionDto,
  SendMedicalQueryDto,
  RespondToMQDto,
  DeferAdmissionDto,
  ResolveDefermentDto
} from './dto/admission.dto';
import { BaseService } from '../../core/base/base.service';
import { logger } from '../../core/utils/logger.util';

/**
 * Admissions Service
 * Business logic layer for admission management
 * 
 * Key Features:
 * - CRUD operations with validation
 * - GL generation workflow
 * - Approval/rejection workflow with remarks
 * - Status validation (prevent duplicate approvals, etc.)
 * - Business rule enforcement
 * 
 * v7 Schema Compliance: All operations use ccms_admissions + ccms_remarks
 */
export class AdmissionsService extends BaseService<Admission> {
  protected repository: AdmissionsRepository;
  private assessmentRepository = new AdmissionAssessmentRepository();

  constructor() {
    const repository = new AdmissionsRepository();
    super(repository);
    this.repository = repository;
  }

  // ============================================================================
  // ADMISSION CRUD
  // ============================================================================

  /**
   * Get paginated list of admissions with filters
   */
  public async getAdmissions(filters: AdmissionFilters): Promise<PaginatedAdmissions> {
    return await this.repository.getAdmissions(filters);
  }

  /**
   * Get admission by ID with related data
   */
  public async getAdmissionById(admissionId: number): Promise<Admission | null> {
    return await this.repository.getAdmissionById(admissionId);
  }

  /**
   * Get admission with workflow history (remarks)
   */
  public async getAdmissionWithRemarks(admissionId: number): Promise<any> {
    const admission = await this.repository.getAdmissionById(admissionId);
    
    if (!admission) {
      return null;
    }

    const remarks = await this.repository.getAdmissionRemarks(admissionId);

    return {
      ...admission,
      remarks
    };
  }

  /**
   * Create new admission with auto-claim creation
   * 
   * Workflow:
   * 1. Validates required fields (member, hospital, dates)
   * 2. Auto-creates claim record (CLM-YYYY-NNNNN)
   * 3. Creates admission record linked to claim
   * 4. Initial status: PENDING_APPROVAL
   * 
   * Business Rules:
   * - Member ID, Hospital ID, Admission date required
   * - Admission type and room type required
   * - Claim auto-created (NOT a prerequisite)
   * - GL generated only when MO approves
   * 
   * @param dto - Admission data (with memberId, hospitalId, NOT claimId)
   * @param createdBy - Username of creator
   * @returns Object with admissionId, claimId, and claimRefNo
   */
  public async createAdmission(
    dto: CreateAdmissionDto, 
    createdBy: string
  ): Promise<{ admissionId: number; claimId: number; claimRefNo: string }> {
    // Validation: Member ID required
    if (!dto.member_id) {
      throw new Error('Member ID is required');
    }

    // Validation: Hospital ID required
    if (!dto.hospital_id) {
      throw new Error('Hospital ID is required');
    }

    // Validation: Admission date required
    if (!dto.admission_date) {
      throw new Error('Admission date is required');
    }

    // Validation: Admission type required
    if (!dto.admission_type) {
      throw new Error('Admission type is required');
    }

    // Validation: Room type required
    if (!dto.room_type) {
      throw new Error('Room type is required');
    }

    // TODO: Optional - Validate member exists and policy is active
    // const member = await memberRepository.getMemberById(dto.member_id);
    // if (!member) throw new Error('Member not found');

    // TODO: Optional - Validate hospital exists and is active
    // const hospital = await hospitalRepository.getHospitalById(dto.hospital_id);
    // if (!hospital) throw new Error('Hospital not found');

    return await this.repository.createAdmission(dto, createdBy);
  }

  /**
   * Update admission details
   * 
   * Business Rules:
   * - Cannot update approved/rejected admissions
   * - Cannot update GL reference
   * - Cannot update admission_status directly (use approve/reject)
   * 
   * @param admissionId - Admission ID
   * @param dto - Update data
   * @param updatedBy - Username of updater
   */
  public async updateAdmission(
    admissionId: number,
    dto: UpdateAdmissionDto,
    updatedBy: string
  ): Promise<void> {
    // Get current admission
    const admission = await this.repository.getAdmissionById(admissionId);

    if (!admission) {
      throw new Error('Admission not found');
    }

    // Validation: Cannot update approved/rejected admissions
    if (admission.admission_status === 'APPROVED' || admission.admission_status === 'REJECTED') {
      throw new Error(`Cannot update ${admission.admission_status.toLowerCase()} admission`);
    }

    // Validation: Cannot update deleted admissions
    if (admission.is_deleted) {
      throw new Error('Cannot update deleted admission');
    }

    // TASK 11: Check if discharge is being set
    const isDischarging = dto.discharge_date !== undefined && dto.discharge_date !== null;

    await this.repository.updateAdmission(admissionId, dto, updatedBy);

    // TASK 11: Complete monitoring when patient is discharged
    if (isDischarging) {
      try {
        logger.info(`[Discharge] Completing monitoring for admission ${admissionId}`);
        
        const monitoringRepository = new MonitoringRepository();
        
        // Mark all pending 8HM checks as completed
        await monitoringRepository.complete8HMMonitoring(admissionId);
        
        // Resolve all active LOS alerts
        await monitoringRepository.resolveLOSAlerts(admissionId);
        
        logger.info(`[Discharge] Monitoring completed for admission ${admissionId}`);
      } catch (error) {
        console.error(`[Discharge] Error completing monitoring for admission ${admissionId}:`, error);
        // Don't throw - we still want the discharge to succeed even if monitoring cleanup fails
        // Log for manual review
      }
    }
  }

  /**
   * Soft delete admission
   * 
   * Business Rules:
   * - Cannot delete approved admissions (with GL)
   * - Can delete pending/rejected admissions
   * 
   * @param admissionId - Admission ID
   * @param deletedBy - Username of deleter
   */
  public async deleteAdmission(admissionId: number, deletedBy: string): Promise<void> {
    const admission = await this.repository.getAdmissionById(admissionId);

    if (!admission) {
      throw new Error('Admission not found');
    }

    // Validation: Cannot delete approved admissions
    if (admission.admission_status === 'APPROVED' && admission.gl_ref_no) {
      throw new Error('Cannot delete approved admission with GL reference');
    }

    await this.repository.deleteAdmission(admissionId, deletedBy);
  }

  // ============================================================================
  // WORKFLOW: APPROVAL & REJECTION
  // ============================================================================

  /**
   * Approve admission
   * 
   * Workflow:
   * 1. Validate admission can be approved
   * 2. Generate GL reference (GL-YYYY-NNNN)
   * 3. Update admission_status = 'APPROVED'
   * 4. Create remark entry (ref_type='ADMISSION', action_for='APPROVAL')
   * 
   * Business Rules:
   * - Only PENDING_APPROVAL/PENDING_MQ admissions can be approved
   * - Cannot approve already approved admissions
   * - Cannot approve rejected admissions
   * - Transaction ensures atomicity (GL generation + status update + remark)
   * 
   * @param admissionId - Admission ID
   * @param dto - Approval data (optional remarks)
   * @param approvedBy - Username of approver (Medical Officer)
   * @returns Generated GL reference number
   */
  public async approveAdmission(
    admissionId: number,
    dto: ApproveAdmissionDto,
    approvedBy: string
  ): Promise<string> {
    // Get current admission
    const admission = await this.repository.getAdmissionById(admissionId);

    if (!admission) {
      throw new Error('Admission not found');
    }

    // Validation: Already approved
    if (admission.admission_status === 'APPROVED') {
      throw new Error('Admission is already approved');
    }

    // Validation: Already rejected
    if (admission.admission_status === 'REJECTED') {
      throw new Error('Cannot approve rejected admission');
    }

    // Validation: Deleted
    if (admission.is_deleted) {
      throw new Error('Cannot approve deleted admission');
    }

    // Validation: Only PENDING_APPROVAL or PENDING_MQ can be approved
    const approvableStatuses = ['PENDING_APPROVAL', 'PENDING_MQ', 'MQ_RESPONDED'];
    if (!approvableStatuses.includes(admission.admission_status || '')) {
      throw new Error(`Cannot approve admission with status: ${admission.admission_status}`);
    }

    // Execute approval with GL generation (transaction)
    const glRefNo = await this.repository.approveAdmission(admissionId, dto, approvedBy);

    return glRefNo;
  }

  /**
   * Reject admission
   * 
   * Workflow:
   * 1. Validate admission can be rejected
   * 2. Update admission_status = 'REJECTED'
   * 3. Create remark entry (ref_type='ADMISSION', action_for='REJECTION', reason in remark_text)
   * 
   * Business Rules:
   * - Only PENDING_APPROVAL/PENDING_MQ admissions can be rejected
   * - Cannot reject already approved admissions
   * - Cannot reject already rejected admissions
   * - Rejection reason is mandatory
   * 
   * @param admissionId - Admission ID
   * @param dto - Rejection data (reason required)
   * @param rejectedBy - Username of rejecter (Medical Officer)
   */
  public async rejectAdmission(
    admissionId: number,
    dto: RejectAdmissionDto,
    rejectedBy: string
  ): Promise<void> {
    // Validation: Rejection reason required
    if (!dto.rejectionReason || dto.rejectionReason.trim() === '') {
      throw new Error('Rejection reason is required');
    }

    // Get current admission
    const admission = await this.repository.getAdmissionById(admissionId);

    if (!admission) {
      throw new Error('Admission not found');
    }

    // Validation: Already approved
    if (admission.admission_status === 'APPROVED') {
      throw new Error('Cannot reject approved admission');
    }

    // Validation: Already rejected
    if (admission.admission_status === 'REJECTED') {
      throw new Error('Admission is already rejected');
    }

    // Validation: Deleted
    if (admission.is_deleted) {
      throw new Error('Cannot reject deleted admission');
    }

    // Validation: Only PENDING_APPROVAL or PENDING_MQ can be rejected
    const rejectableStatuses = ['PENDING_APPROVAL', 'PENDING_MQ', 'MQ_RESPONDED'];
    if (!rejectableStatuses.includes(admission.admission_status || '')) {
      throw new Error(`Cannot reject admission with status: ${admission.admission_status}`);
    }

    // Execute rejection (transaction)
    await this.repository.rejectAdmission(admissionId, dto, rejectedBy);
  }

  // ============================================================================
  // ANALYTICS & REPORTING
  // ============================================================================

  /**
   * Get admission statistics
   * 
   * Returns:
   * - Total admissions
   * - Pending approvals
   * - Approved count
   * - Rejected count
   * - Average LOS
   * - Total approved amount
   */
  public async getAdmissionStats(filters?: { dateFrom?: Date; dateTo?: Date }): Promise<any> {
    // TODO: Implement analytics queries
    // This is for future dashboard implementation
    return {
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
      averageLOS: 0,
      totalApprovedAmount: 0
    };
  }

  /**
   * Send Medical Query to hospital
   */
  public async sendMedicalQuery(
    admissionId: number,
    dto: SendMedicalQueryDto,
    sentBy: string
  ): Promise<void> {
    // Validation: Only PENDING_APPROVAL admissions can have MQ sent
    const admission = await this.repository.getAdmissionById(admissionId);
    
    if (!admission) {
      throw new Error('Admission not found');
    }

    const finalizedStatuses = ['APPROVED', 'REJECTED', 'DELETED'];
    if (finalizedStatuses.includes(admission.admission_status || '') || admission.is_deleted) {
      throw new Error(`Cannot send MQ for admission with status: ${admission.admission_status}`);
    }

    await this.repository.sendMedicalQuery(
      admissionId,
      dto.queryText,
      dto.dueDate,
      sentBy
    );
  }

  /**
   * Respond to Medical Query (hospital response)
   */
  public async respondToMQ(
    admissionId: number,
    dto: RespondToMQDto,
    respondedBy: string
  ): Promise<void> {
    // Validation: Only PENDING_MQ admissions can receive MQ response
    const admission = await this.repository.getAdmissionById(admissionId);
    
    if (!admission) {
      throw new Error('Admission not found');
    }

    if (admission.admission_status !== 'PENDING_MQ') {
      throw new Error(`Cannot respond to MQ for admission with status: ${admission.admission_status}`);
    }

    await this.repository.respondToMQ(
      admissionId,
      dto.responseText,
      respondedBy,
      dto.document
    );
  }

  /**
   * Defer admission for additional review
   */
  public async deferAdmission(
    admissionId: number,
    dto: DeferAdmissionDto,
    deferredBy: string
  ): Promise<void> {
    // Validation: Only PENDING_APPROVAL or MQ_RESPONDED admissions can be deferred
    const admission = await this.repository.getAdmissionById(admissionId);
    
    if (!admission) {
      throw new Error('Admission not found');
    }

    const deferrableStatuses = ['PENDING_APPROVAL', 'MQ_RESPONDED'];
    if (!deferrableStatuses.includes(admission.admission_status || '')) {
      throw new Error(`Cannot defer admission with status: ${admission.admission_status}`);
    }

    await this.repository.deferAdmission(
      admissionId,
      dto.defermentReason,
      dto.followUpDate,
      dto.assignedTo,
      deferredBy
    );
  }

  /**
   * Resolve deferment
   */
  public async resolveDeferment(
    admissionId: number,
    dto: ResolveDefermentDto,
    resolvedBy: string
  ): Promise<void> {
    // Validation: Only deferred admissions can be resolved
    const admission = await this.repository.getAdmissionById(admissionId);
    
    if (!admission) {
      throw new Error('Admission not found');
    }

    if (admission.deferment_status !== 'PENDING_DEFERMENT') {
      throw new Error(`Cannot resolve deferment for admission with deferment status: ${admission.deferment_status}`);
    }

    await this.repository.resolveDeferment(
      admissionId,
      dto.resolutionNotes,
      resolvedBy
    );
  }

  /**
   * Get global medical query history with pagination and filtering
   */
  public async getMQHistory(filters: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  } = {}): Promise<{ data: any[], total: number }> {
    return await this.repository.getGlobalMQHistory(filters);
  }

  public async updateMQStatus(admissionId: number, status: string, updatedBy: string): Promise<void> {
    return await this.repository.updateMQStatus(admissionId, status, updatedBy);
  }

  // ============================================================================
  // ASSESSMENTS
  // ============================================================================

  public async getAdmissionAssessments(admissionId: number): Promise<AdmissionAssessment[]> {
    return await this.assessmentRepository.getByAdmissionId(admissionId);
  }

  public async upsertAdmissionAssessments(dto: UpsertAdmissionAssessmentsDto, performedBy: string): Promise<void> {
    await this.assessmentRepository.upsertAssessments(dto, performedBy);
  }
}
