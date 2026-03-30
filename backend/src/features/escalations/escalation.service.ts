import { BaseService } from '../../core/base/base.service';
import { Escalation, EscalationSource, EscalationNature, EscalationFilters } from './entities/escalation.entity';
import { CreateEscalationDto, UpdateEscalationDto, AddEscalationUpdateDto, CloseEscalationDto } from './dto/escalation.dto';
import { EscalationRepository } from './escalation.repository';

/**
 * Escalation Service
 * Business logic for escalation management and auto-escalation rules
 */
export class EscalationService extends BaseService<Escalation> {
  protected repository: EscalationRepository;

  constructor() {
    const repo = new EscalationRepository();
    super(repo);
    this.repository = repo;
  }

  /**
   * Get escalations with pagination and filters
   */
  async getEscalations(filters: EscalationFilters = {}): Promise<{
    escalations: Escalation[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = filters.page || 1;
    const limit = filters.limit || 10;

    const result = await this.repository.getEscalations(filters);

    return {
      escalations: result.escalations,
      total: result.total,
      page,
      limit,
      totalPages: Math.ceil(result.total / limit)
    };
  }

  /**
   * Get escalation by ID with all details
   */
  async getEscalationById(id: number): Promise<Escalation> {
    const escalation = await this.repository.getEscalationById(id);
    if (!escalation) {
      throw new Error(`Escalation with ID ${id} not found`);
    }
    return escalation;
  }

  /**
   * Create escalation (UNASSIGNED - officers assign manually)
   */
  async createEscalation(dto: CreateEscalationDto, createdBy: string): Promise<Escalation> {
    // Validate priority
    const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
    if (!validPriorities.includes(dto.priority)) {
      throw new Error(`Invalid priority. Must be one of: ${validPriorities.join(', ')}`);
    }

    const escalationId = await this.repository.createEscalation(dto, createdBy);
    return await this.getEscalationById(escalationId);
  }

  /**
   * Update escalation (assign, change priority, change status)
   */
  async updateEscalation(id: number, dto: UpdateEscalationDto, updatedBy: string): Promise<Escalation> {
    await this.getEscalationById(id); // Verify exists

    if (dto.status && !['UNASSIGNED', 'ASSIGNED', 'IN_PROGRESS', 'PENDING_ACTION', 'CLOSED'].includes(dto.status)) {
      throw new Error('Invalid status');
    }

    if (dto.priority && !['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(dto.priority)) {
      throw new Error('Invalid priority');
    }

    await this.repository.updateEscalation(id, dto, updatedBy);
    return await this.getEscalationById(id);
  }

  /**
   * Add update/remark to escalation
   */
  async addEscalationUpdate(escalationId: number, dto: AddEscalationUpdateDto, createdBy: string): Promise<void> {
    await this.getEscalationById(escalationId); // Verify exists

    if (!dto.update_description || !dto.update_description.trim()) {
      throw new Error('Update description is required');
    }

    await this.repository.addEscalationUpdate(escalationId, dto, createdBy);
  }

  /**
   * Close escalation
   */
  async closeEscalation(id: number, dto: CloseEscalationDto, closedBy: string): Promise<Escalation> {
    const escalation = await this.getEscalationById(id);

    if (escalation.status === 'CLOSED') {
      throw new Error('Escalation is already closed');
    }

    await this.repository.closeEscalation(id, dto, closedBy);
    return await this.getEscalationById(id);
  }

  /**
   * Get lookups for escalation sources
   */
  async getEscalationSources(): Promise<EscalationSource[]> {
    return await this.repository.getEscalationSources();
  }

  /**
   * Get lookups for escalation natures
   */
  async getEscalationNatures(): Promise<EscalationNature[]> {
    return await this.repository.getEscalationNatures();
  }

  // ============================================================================
  // AUTO-ESCALATION RULES
  // ============================================================================

  /**
   * Auto-escalate FOR LOS LEVEL 3 ALERTS (21+ days LOS)
   * Called by MonitoringService when Level 3 alert is triggered
   */
  async autoEscalateForLOSLevel3(claimId: number, trigerredBy: string): Promise<Escalation | null> {
    // Check if escalation already exists for this claim with LOS source
    const LOS_SOURCE_ID = 1; // From ccms_escalation_source lookup
    const exists = await this.repository.checkExistingEscalation(claimId, LOS_SOURCE_ID);

    if (exists) {
      // Escalation already exists, don't create duplicate
      return null;
    }

    // Create new escalation
    const escalation = await this.createEscalation(
      {
        claim_id: claimId,
        source_id: LOS_SOURCE_ID,
        nature_id: 3, // "Requires Executive Review" - from ccms_escalation_nature
        priority: 'CRITICAL'
      },
      trigerredBy
    );

    return escalation;
  }

  /**
   * Auto-escalate FOR 8HM OVERDUE >4 HOURS  
   * Called by MonitoringJobs hourly when overdue check found
   */
  async autoEscalateFor8HMOverdue(claimId: number, hoursOverdue: number, triggeredBy: string): Promise<Escalation | null> {
    // Only escalate if overdue > 4 hours
    if (hoursOverdue <= 4) {
      return null;
    }

    // Check if escalation already exists for this claim with 8HM source
    const EHM_SOURCE_ID = 2; // From ccms_escalation_source lookup
    const exists = await this.repository.checkExistingEscalation(claimId, EHM_SOURCE_ID);

    if (exists) {
      // Escalation already exists, don't create duplicate
      return null;
    }

    // Determine priority based on hours overdue
    let priority = 'HIGH';
    let natureId = 1; // "Requires Immediate Attention"

    if (hoursOverdue > 6) {
      priority = 'CRITICAL';
      natureId = 2; // "Requires Urgent Action"
    }

    // Create new escalation
    const escalation = await this.createEscalation(
      {
        claim_id: claimId,
        source_id: EHM_SOURCE_ID,
        nature_id: natureId,
        priority
      },
      triggeredBy
    );

    return escalation;
  }

  /**
   * Get escalation updates for an escalation
   */
  async getEscalationUpdates(escalationId: number): Promise<any[]> {
    await this.getEscalationById(escalationId); // Verify exists
    return await this.repository.getEscalationUpdates(escalationId);
  }
}
