import { BaseService } from '../../core/base/base.service';
import { Claim, ClaimFilters, PaginatedClaims } from './entities/claim.entity';
import { CreateClaimDto, UpdateClaimDto, ApproveClaimDto, RejectClaimDto } from './dto/claim.dto';
import { ClaimsRepository } from './claims.repository';

export class ClaimsService extends BaseService<Claim> {
  protected repository: ClaimsRepository;

  constructor() {
    const repo = new ClaimsRepository();
    super(repo);
    this.repository = repo;
  }

  public async getClaims(filters: ClaimFilters): Promise<PaginatedClaims> {
    return await this.repository.getClaims(filters);
  }

  public async getClaimById(id: number): Promise<Claim> {
    const claim = await this.repository.getClaimById(id);
    if (!claim) {
      throw new Error(`Claim with ID ${id} not found`);
    }
    return claim;
  }

  public async updateClaim(
    id: number,
    dto: UpdateClaimDto,
    updatedBy: string
  ): Promise<Claim> {
    const claim = await this.getClaimById(id);

    // Finalization guard: APPROVED/SETTLED claims are read-only
    if (claim.claim_status === 'APPROVED' || claim.claim_status === 'SETTLED') {
      throw new Error(`Cannot update a claim with status '${claim.claim_status}'. Use the approve/reject endpoints for workflow transitions.`);
    }

    // REJECTED claims can only be re-opened (changed back to PENDING)
    if (claim.claim_status === 'REJECTED' && dto.claim_status && dto.claim_status !== 'PENDING') {
      throw new Error('A rejected claim can only be re-opened back to PENDING status.');
    }

    await this.repository.updateClaim(id, dto, updatedBy);
    return await this.getClaimById(id);
  }

  public async deleteClaim(id: number, deletedBy: string): Promise<void> {
    await this.getClaimById(id);
    await this.repository.deleteClaim(id, deletedBy);
  }

  public async createClaim(
    dto: CreateClaimDto,
    createdBy: string
  ): Promise<Claim> {
    // Inject SLA: 14 days from today
    const now = new Date();
    const slaDays = 14;
    const slaDeadline = new Date(now);
    slaDeadline.setDate(slaDeadline.getDate() + slaDays);

    const dtoWithSLA: CreateClaimDto = {
      ...dto,
      sla_days: slaDays,
      sla_deadline: slaDeadline,
      sla_status: 'ON_TIME'
    };

    const { claimId } = await this.repository.createClaim(dtoWithSLA, createdBy);
    return await this.getClaimById(claimId);
  }

  // ============================================================================
  // WORKFLOW: APPROVE & REJECT
  // ============================================================================

  public async approveClaimSubmission(
    id: number,
    dto: ApproveClaimDto,
    approvedBy: string
  ): Promise<Claim> {
    const claim = await this.getClaimById(id);

    if (claim.claim_status !== 'PENDING') {
      throw new Error(`Cannot approve a claim with status '${claim.claim_status}'. Only PENDING claims can be approved.`);
    }

    if (!dto.total_approved || dto.total_approved <= 0) {
      throw new Error('Approved amount must be greater than 0');
    }

    // Calculate SLA status at time of approval
    const now = new Date();
    const slaDeadline = claim.sla_deadline ? new Date(claim.sla_deadline) : null;
    const slaStatus = slaDeadline && now > slaDeadline ? 'OVERDUE' : 'ON_TIME';

    await this.repository.approveClaimSubmission(id, { ...dto, sla_status: slaStatus, approved_by: approvedBy }, approvedBy);
    return await this.getClaimById(id);
  }

  public async rejectClaimSubmission(
    id: number,
    dto: RejectClaimDto,
    rejectedBy: string
  ): Promise<Claim> {
    const claim = await this.getClaimById(id);

    if (claim.claim_status !== 'PENDING') {
      throw new Error(`Cannot reject a claim with status '${claim.claim_status}'. Only PENDING claims can be rejected.`);
    }

    if (!dto.rejection_reason || !dto.rejection_reason.trim()) {
      throw new Error('Rejection reason is required');
    }

    await this.repository.rejectClaimSubmission(id, dto, rejectedBy);
    return await this.getClaimById(id);
  }

  public async getClaimRemarks(claimId: number): Promise<any[]> {
    await this.getClaimById(claimId);
    return await this.repository.getClaimRemarks(claimId);
  }

  // ============================================================================
  // CLAIM EXPENSES
  // ============================================================================

  public async getClaimExpenses(claimId: number): Promise<any[]> {
    await this.getClaimById(claimId); // Ensure claim exists
    return await this.repository.getClaimExpenses(claimId);
  }

  public async addClaimExpense(claimId: number, expense: {
    benefit_category: string;
    description?: string;
    billed_amt: number;
    receipt_no?: string;
    receipt_date?: string;
  }, userId: string): Promise<{ expense_id: number }> {
    const claim = await this.getClaimById(claimId);
    if (claim.claim_status === 'APPROVED' || claim.claim_status === 'SETTLED') {
      throw new Error(`Cannot modify expenses on a claim with status '${claim.claim_status}'`);
    }
    const expenseId = await this.repository.addClaimExpense(claimId, expense, userId);
    return { expense_id: expenseId };
  }

  public async updateClaimExpense(claimId: number, expenseId: number, expense: {
    benefit_category?: string;
    description?: string;
    billed_amt?: number;
    receipt_no?: string;
    receipt_date?: string;
  }, userId: string): Promise<void> {
    const claim = await this.getClaimById(claimId);
    if (claim.claim_status === 'APPROVED' || claim.claim_status === 'SETTLED') {
      throw new Error(`Cannot modify expenses on a claim with status '${claim.claim_status}'`);
    }
    await this.repository.updateClaimExpense(expenseId, expense, userId);
  }

  public async deleteClaimExpense(claimId: number, expenseId: number): Promise<void> {
    const claim = await this.getClaimById(claimId);
    if (claim.claim_status === 'APPROVED' || claim.claim_status === 'SETTLED') {
      throw new Error(`Cannot modify expenses on a claim with status '${claim.claim_status}'`);
    }
    await this.repository.deleteClaimExpense(expenseId);
  }

  // ============================================================================
  // CLAIM DOCUMENTS
  // ============================================================================

  public async getClaimDocuments(claimId: number): Promise<any[]> {
    await this.getClaimById(claimId);
    return await this.repository.getClaimDocuments(claimId);
  }

  public async addClaimDocument(claimId: number, doc: {
    file_name: string;
    doc_category: string;
    file_path: string;
    file_extension?: string;
    file_size_bytes?: number;
  }, userId: string): Promise<{ doc_id: number }> {
    const claim = await this.getClaimById(claimId);
    if (claim.claim_status === 'APPROVED' || claim.claim_status === 'SETTLED') {
      throw new Error(`Cannot modify documents on a claim with status '${claim.claim_status}'`);
    }
    const docId = await this.repository.addClaimDocument(claimId, doc, userId);
    return { doc_id: docId };
  }

  public async updateClaimDocument(claimId: number, docId: number, doc: {
    file_name?: string;
    doc_category?: string;
    file_path?: string;
    remarks?: string;
  }, userId: string): Promise<void> {
    const claim = await this.getClaimById(claimId);
    if (claim.claim_status === 'APPROVED' || claim.claim_status === 'SETTLED') {
      throw new Error(`Cannot modify documents on a claim with status '${claim.claim_status}'`);
    }
    await this.repository.updateClaimDocument(docId, doc, userId);
  }

  public async deleteClaimDocument(claimId: number, docId: number, userId: string): Promise<void> {
    const claim = await this.getClaimById(claimId);
    if (claim.claim_status === 'APPROVED' || claim.claim_status === 'SETTLED') {
      throw new Error(`Cannot modify documents on a claim with status '${claim.claim_status}'`);
    }
    await this.repository.deleteClaimDocument(docId, userId);
  }
}
