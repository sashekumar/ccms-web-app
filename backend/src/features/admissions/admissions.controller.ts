import { Request, Response } from 'express';
import { AdmissionsService } from './admissions.service';
import {
  AdmissionFilterDto,
  CreateAdmissionDto,
  UpdateAdmissionDto,
  ApproveAdmissionDto,
  RejectAdmissionDto,
  SendMedicalQueryDto,
  RespondToMQDto,
  DeferAdmissionDto,
  ResolveDefermentDto
} from './dto/admission.dto';
import { ResponseUtil } from '../../core/utils/response.util';
import { getErrorMessage } from '../../core/utils/error.util';

/**
 * Admissions Controller
 * Handles HTTP requests for admission management
 * 
 * Permissions Required (from ACL):
 * - ADMISSIONS.VIEW: List and view admission details
 * - ADMISSIONS.CREATE: Create new admissions
 * - ADMISSIONS.UPDATE: Update admission details
 * - ADMISSIONS.DELETE: Soft delete admissions
 * - ADMISSIONS.APPROVE: Approve/reject admissions (Medical Officer)
 * 
 * All routes require authentication (applied in routes.ts)
 * Permission checks applied at route level via requirePermission middleware
 */
export class AdmissionsController {
  private service: AdmissionsService;

  constructor() {
    this.service = new AdmissionsService();
  }

  // ============================================================================
  // ADMISSION CRUD
  // ============================================================================

  /**
   * Get paginated list of admissions
   * POST /api/admissions/list
   * Permission: ADMISSIONS.VIEW
   * Body: AdmissionFilterDto
   */
  public getAdmissions = async (req: Request, res: Response): Promise<void> => {
    try {
      const filters: AdmissionFilterDto = {
        admissionStatus: req.body.admissionStatus,
        admissionType: req.body.admissionType,
        roomType: req.body.roomType,
        claimId: req.body.claimId,
        hospitalId: req.body.hospitalId,
        memberId: req.body.memberId,
        admissionDateFrom: req.body.admissionDateFrom,
        admissionDateTo: req.body.admissionDateTo,
        dischargeDateFrom: req.body.dischargeDateFrom,
        dischargeDateTo: req.body.dischargeDateTo,
        hasAlert: req.body.hasAlert,
        search: req.body.search,
        isDeleted: req.body.isDeleted ?? false,
        page: req.body.page ?? 1,
        limit: req.body.limit ?? 10,
        sortBy: req.body.sortBy ?? 'admission_id',
        sortOrder: req.body.sortOrder ?? 'DESC'
      };

      const result = await this.service.getAdmissions(filters);

      ResponseUtil.success(res, result, 'Admissions retrieved successfully');
    } catch (error: unknown) {
      ResponseUtil.error(res, 'Error fetching admissions', 500, getErrorMessage(error));
    }
  };

  /**
   * Get admission by ID
   * POST /api/admissions/get
   * Permission: ADMISSIONS.VIEW
   * Body: { admission_id: number }
   */
  public getAdmissionById = async (req: Request, res: Response): Promise<void> => {
    try {
      const admissionId = req.body.admission_id;

      if (!admissionId || isNaN(admissionId)) {
        ResponseUtil.error(res, 'Invalid admission ID', 400);
        return;
      }

      const admission = await this.service.getAdmissionById(admissionId);

      if (!admission) {
        ResponseUtil.notFound(res, 'Admission not found');
        return;
      }

      ResponseUtil.success(res, admission, 'Admission retrieved successfully');
    } catch (error: unknown) {
      ResponseUtil.error(res, 'Error fetching admission', 500, getErrorMessage(error));
    }
  };

  /**
   * Get admission with workflow history (remarks)
   * POST /api/admissions/get-with-remarks
   * Permission: ADMISSIONS.VIEW
   * Body: { admission_id: number }
   */
  public getAdmissionWithRemarks = async (req: Request, res: Response): Promise<void> => {
    try {
      const admissionId = req.body.admission_id;

      if (!admissionId || isNaN(admissionId)) {
        ResponseUtil.error(res, 'Invalid admission ID', 400);
        return;
      }

      const admission = await this.service.getAdmissionWithRemarks(admissionId);

      if (!admission) {
        ResponseUtil.notFound(res, 'Admission not found');
        return;
      }

      ResponseUtil.success(res, admission, 'Admission retrieved successfully');
    } catch (error: unknown) {
      ResponseUtil.error(res, 'Error fetching admission', 500, getErrorMessage(error));
    }
  };

  /**
   * Create new admission with auto-claim creation
   * POST /api/admissions/create
   * Permission: ADMISSIONS.CREATE
   * Body: CreateAdmissionDto
   * 
   * Workflow:
   * 1. Validates member, hospital, dates
   * 2. Auto-creates claim (CLM-YYYY-NNNNN)
   * 3. Creates admission linked to claim
   * 4. Returns admissionId, claimId, claimRefNo
   */
  public createAdmission = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.userId?.toString() || 'system';
      const dto: CreateAdmissionDto = req.body;

      // Validation
      if (!dto.memberId) {
        ResponseUtil.error(res, 'memberId is required', 400);
        return;
      }

      if (!dto.hospitalId) {
        ResponseUtil.error(res, 'hospitalId is required', 400);
        return;
      }

      if (!dto.admissionDate) {
        ResponseUtil.error(res, 'admissionDate is required', 400);
        return;
      }

      if (!dto.admissionType) {
        ResponseUtil.error(res, 'admissionType is required', 400);
        return;
      }

      if (!dto.roomType) {
        ResponseUtil.error(res, 'roomType is required', 400);
        return;
      }

      const result = await this.service.createAdmission(dto, userId);

      ResponseUtil.success(
        res,
        {
          admission_id: result.admissionId,
          claim_id: result.claimId,
          claim_ref_no: result.claimRefNo
        },
        'Admission and claim created successfully',
        201
      );
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);

      // Handle specific business logic errors
      if (errorMessage.includes('Member not found') || errorMessage.includes('Hospital not found')) {
        ResponseUtil.notFound(res, errorMessage);
        return;
      }

      if (errorMessage.includes('required')) {
        ResponseUtil.error(res, errorMessage, 400);
        return;
      }

      ResponseUtil.error(res, 'Error creating admission', 500, errorMessage);
    }
  };

  /**
   * Update admission details
   * PUT /api/admissions/update
   * Permission: ADMISSIONS.UPDATE
   * Body: { admission_id: number, ...UpdateAdmissionDto }
   */
  public updateAdmission = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.userId?.toString() || 'system';
      const admissionId = req.body.admission_id;

      if (!admissionId || isNaN(admissionId)) {
        ResponseUtil.error(res, 'Invalid admission ID', 400);
        return;
      }

      const dto: UpdateAdmissionDto = {
        admissionDate: req.body.admissionDate,
        dischargeDate: req.body.dischargeDate,
        admissionType: req.body.admissionType,
        roomType: req.body.roomType,
        roomRate: req.body.roomRate,
        icuDays: req.body.icuDays,
        icuRate: req.body.icuRate,
        ehmStatus: req.body.ehmStatus,
        defermentStatus: req.body.defermentStatus,
        alertFlag: req.body.alertFlag
      };

      await this.service.updateAdmission(admissionId, dto, userId);

      ResponseUtil.success(res, null, 'Admission updated successfully');
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);

      if (errorMessage.includes('not found')) {
        ResponseUtil.notFound(res, errorMessage);
        return;
      }

      if (errorMessage.includes('Cannot update')) {
        ResponseUtil.error(res, errorMessage, 403);
        return;
      }

      ResponseUtil.error(res, 'Error updating admission', 500, errorMessage);
    }
  };

  /**
   * Delete admission (soft delete)
   * DELETE /api/admissions/delete
   * Permission: ADMISSIONS.DELETE
   * Body: { admission_id: number }
   */
  public deleteAdmission = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.userId?.toString() || 'system';
      const admissionId = req.body.admission_id;

      if (!admissionId || isNaN(admissionId)) {
        ResponseUtil.error(res, 'Invalid admission ID', 400);
        return;
      }

      await this.service.deleteAdmission(admissionId, userId);

      ResponseUtil.success(res, null, 'Admission deleted successfully');
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);

      if (errorMessage.includes('not found')) {
        ResponseUtil.notFound(res, errorMessage);
        return;
      }

      if (errorMessage.includes('Cannot delete')) {
        ResponseUtil.error(res, errorMessage, 403);
        return;
      }

      ResponseUtil.error(res, 'Error deleting admission', 500, errorMessage);
    }
  };

  // ============================================================================
  // WORKFLOW: APPROVAL & REJECTION
  // ============================================================================

  /**
   * Approve admission (generates GL)
   * POST /api/admissions/approve
   * Permission: ADMISSIONS.APPROVE
   * Body: { admission_id: number, remarks?: string }
   * 
   * Workflow:
   * - Validates admission can be approved
   * - Generates GL reference (GL-YYYY-NNNN)
   * - Updates status to APPROVED
   * - Creates remark entry in ccms_remarks
   * 
   * Returns: { gl_ref_no: string }
   */
  public approveAdmission = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.userId?.toString() || 'system';
      const admissionId = req.body.admission_id;

      if (!admissionId || isNaN(admissionId)) {
        ResponseUtil.error(res, 'Invalid admission ID', 400);
        return;
      }

      const dto: ApproveAdmissionDto = {
        remarks: req.body.remarks
      };

      const glRefNo = await this.service.approveAdmission(admissionId, dto, userId);

      ResponseUtil.success(
        res,
        { gl_ref_no: glRefNo },
        `Admission approved successfully (GL: ${glRefNo})`
      );
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);

      if (errorMessage.includes('not found')) {
        ResponseUtil.notFound(res, errorMessage);
        return;
      }

      if (
        errorMessage.includes('already approved') ||
        errorMessage.includes('Cannot approve') ||
        errorMessage.includes('rejected admission')
      ) {
        ResponseUtil.error(res, errorMessage, 403);
        return;
      }

      ResponseUtil.error(res, 'Error approving admission', 500, errorMessage);
    }
  };

  /**
   * Reject admission
   * POST /api/admissions/reject
   * Permission: ADMISSIONS.APPROVE
   * Body: { admission_id: number, rejectionReason: string }
   * 
   * Workflow:
   * - Validates admission can be rejected
   * - Updates status to REJECTED
   * - Creates remark entry in ccms_remarks with rejection reason
   */
  public rejectAdmission = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.userId?.toString() || 'system';
      const admissionId = req.body.admission_id;

      if (!admissionId || isNaN(admissionId)) {
        ResponseUtil.error(res, 'Invalid admission ID', 400);
        return;
      }

      if (!req.body.rejectionReason || req.body.rejectionReason.trim() === '') {
        ResponseUtil.error(res, 'rejectionReason is required', 400);
        return;
      }

      const dto: RejectAdmissionDto = {
        rejectionReason: req.body.rejectionReason
      };

      await this.service.rejectAdmission(admissionId, dto, userId);

      ResponseUtil.success(res, null, 'Admission rejected successfully');
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);

      if (errorMessage.includes('not found')) {
        ResponseUtil.notFound(res, errorMessage);
        return;
      }

      if (
        errorMessage.includes('already rejected') ||
        errorMessage.includes('Cannot reject') ||
        errorMessage.includes('approved admission')
      ) {
        ResponseUtil.error(res, errorMessage, 403);
        return;
      }

      ResponseUtil.error(res, 'Error rejecting admission', 500, errorMessage);
    }
  };

  // ============================================================================
  // WORKFLOW: MEDICAL QUERY (MQ)
  // ============================================================================

  /**
   * Send Medical Query to hospital
   * POST /api/admissions/send-mq
   * Permission: ADMISSIONS.APPROVE
   * Body: { admission_id: number, queryText: string, dueDate?: string }
   * 
   * Workflow:
   * - Validates admission is PENDING_APPROVAL
   * - Updates status to PENDING_MQ
   * - Creates MQ_SENT remark
   */
  public sendMedicalQuery = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.userId?.toString() || 'system';
      const admissionId = req.body.admission_id;

      if (!admissionId || isNaN(admissionId)) {
        ResponseUtil.error(res, 'Invalid admission ID', 400);
        return;
      }

      if (!req.body.queryText || req.body.queryText.trim() === '') {
        ResponseUtil.error(res, 'queryText is required', 400);
        return;
      }

      const dto: SendMedicalQueryDto = {
        queryText: req.body.queryText,
        dueDate: req.body.dueDate
      };

      await this.service.sendMedicalQuery(admissionId, dto, userId);

      ResponseUtil.success(res, null, 'Medical query sent successfully');
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);

      if (errorMessage.includes('not found')) {
        ResponseUtil.notFound(res, errorMessage);
        return;
      }

      if (errorMessage.includes('Cannot send') || errorMessage.includes('only be sent')) {
        ResponseUtil.error(res, errorMessage, 403);
        return;
      }

      ResponseUtil.error(res, 'Error sending medical query', 500, errorMessage);
    }
  };

  /**
   * Respond to Medical Query (Hospital)
   * POST /api/admissions/respond-mq
   * Permission: ADMISSIONS.UPDATE
   * Body: { admission_id: number, responseText: string, attachments?: string }
   * 
   * Workflow:
   * - Validates admission is PENDING_MQ
   * - Updates status to MQ_RESPONDED
   * - Creates MQ_RESPONSE remark
   */
  public respondToMQ = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.userId?.toString() || 'system';
      const admissionId = req.body.admission_id;

      if (!admissionId || isNaN(admissionId)) {
        ResponseUtil.error(res, 'Invalid admission ID', 400);
        return;
      }

      if (!req.body.responseText || req.body.responseText.trim() === '') {
        ResponseUtil.error(res, 'responseText is required', 400);
        return;
      }

      const dto: RespondToMQDto = {
        responseText: req.body.responseText,
        attachments: req.body.attachments
      };

      await this.service.respondToMQ(admissionId, dto, userId);

      ResponseUtil.success(res, null, 'Medical query response recorded successfully');
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);

      if (errorMessage.includes('not found')) {
        ResponseUtil.notFound(res, errorMessage);
        return;
      }

      if (errorMessage.includes('Cannot respond') || errorMessage.includes('awaiting medical query')) {
        ResponseUtil.error(res, errorMessage, 403);
        return;
      }

      ResponseUtil.error(res, 'Error responding to medical query', 500, errorMessage);
    }
  };

  // ============================================================================
  // WORKFLOW: DEFERMENT
  // ============================================================================

  /**
   * Defer admission for later review
   * POST /api/admissions/defer
   * Permission: ADMISSIONS.APPROVE
   * Body: { admission_id: number, defermentReason: string, followUpDate?: string, assignedTo?: string }
   * 
   * Workflow:
   * - Validates admission is PENDING_APPROVAL or MQ_RESPONDED
   * - Sets deferment_status to PENDING_DEFERMENT
   * - Creates DEFERMENT remark
   */
  public deferAdmission = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.userId?.toString() || 'system';
      const admissionId = req.body.admission_id;

      if (!admissionId || isNaN(admissionId)) {
        ResponseUtil.error(res, 'Invalid admission ID', 400);
        return;
      }

      if (!req.body.defermentReason || req.body.defermentReason.trim() === '') {
        ResponseUtil.error(res, 'defermentReason is required', 400);
        return;
      }

      const dto: DeferAdmissionDto = {
        defermentReason: req.body.defermentReason,
        followUpDate: req.body.followUpDate,
        assignedTo: req.body.assignedTo
      };

      await this.service.deferAdmission(admissionId, dto, userId);

      ResponseUtil.success(res, null, 'Admission deferred successfully');
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);

      if (errorMessage.includes('not found')) {
        ResponseUtil.notFound(res, errorMessage);
        return;
      }

      if (errorMessage.includes('Cannot defer') || errorMessage.includes('already approved')) {
        ResponseUtil.error(res, errorMessage, 403);
        return;
      }

      ResponseUtil.error(res, 'Error deferring admission', 500, errorMessage);
    }
  };

  /**
   * Resolve deferment and continue review
   * POST /api/admissions/resolve-deferment
   * Permission: ADMISSIONS.APPROVE
   * Body: { admission_id: number, resolutionNotes: string }
   * 
   * Workflow:
   * - Validates deferment_status is PENDING_DEFERMENT
   * - Sets deferment_status to DEFERMENT_RESOLVED
   * - Creates DEFERMENT_RESOLVED remark
   */
  public resolveDeferment = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.userId?.toString() || 'system';
      const admissionId = req.body.admission_id;

      if (!admissionId || isNaN(admissionId)) {
        ResponseUtil.error(res, 'Invalid admission ID', 400);
        return;
      }

      if (!req.body.resolutionNotes || req.body.resolutionNotes.trim() === '') {
        ResponseUtil.error(res, 'resolutionNotes is required', 400);
        return;
      }

      const dto: ResolveDefermentDto = {
        resolutionNotes: req.body.resolutionNotes
      };

      await this.service.resolveDeferment(admissionId, dto, userId);

      ResponseUtil.success(res, null, 'Deferment resolved successfully');
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);

      if (errorMessage.includes('not found')) {
        ResponseUtil.notFound(res, errorMessage);
        return;
      }

      if (errorMessage.includes('Cannot resolve') || errorMessage.includes('not currently deferred')) {
        ResponseUtil.error(res, errorMessage, 403);
        return;
      }

      ResponseUtil.error(res, 'Error resolving deferment', 500, errorMessage);
    }
  };
}
