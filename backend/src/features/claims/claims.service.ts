import { BaseService } from '../../core/base/base.service';
import { Claim, ClaimFilters, PaginatedClaims } from './entities/claim.entity';
import { UpdateClaimDto } from './dto/claim.dto';
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
}
