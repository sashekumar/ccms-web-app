import { BaseService } from '../../core/base/base.service';
import { Claim, ClaimFilters, PaginatedClaims } from './entities/claim.entity';
import { CreateClaimDto, UpdateClaimDto } from './dto/claim.dto';
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
    // Audit check if it exists
    await this.getClaimById(id);
    
    // Additional domain logic e.g., SLA adjustments could go here.
    if (dto.claim_status === 'APPROVED' && (!dto.total_approved || dto.total_approved <= 0)) {
       throw new Error('Approved claims must have an approved amount greater than 0');
    }

    if (dto.claim_status === 'REJECTED' && !dto.rejection_reason) {
       throw new Error('Rejected claims must include a rejection reason');
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
    const { claimId } = await this.repository.createClaim(dto, createdBy);
    return await this.getClaimById(claimId);
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
    await this.getClaimById(claimId); // Ensure claim exists
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
    await this.getClaimById(claimId);
    await this.repository.updateClaimExpense(expenseId, expense, userId);
  }

  public async deleteClaimExpense(claimId: number, expenseId: number): Promise<void> {
    await this.getClaimById(claimId);
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
    await this.getClaimById(claimId);
    const docId = await this.repository.addClaimDocument(claimId, doc, userId);
    return { doc_id: docId };
  }

  public async updateClaimDocument(claimId: number, docId: number, doc: {
    file_name?: string;
    doc_category?: string;
    file_path?: string;
    remarks?: string;
  }, userId: string): Promise<void> {
    await this.getClaimById(claimId);
    await this.repository.updateClaimDocument(docId, doc, userId);
  }

  public async deleteClaimDocument(claimId: number, docId: number, userId: string): Promise<void> {
    await this.getClaimById(claimId);
    await this.repository.deleteClaimDocument(docId, userId);
  }
}
