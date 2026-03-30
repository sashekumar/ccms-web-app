/**
 * Checklists - Service
 * Business logic for checklists operations
 */

import { BaseService } from '../../core/base/base.service';
import { ChecklistsRepository } from './checklists.repository';
import { ChecklistEntity } from './entities/checklists.entity';
import {
  ChecklistFilters,
  CreateChecklistDto,
  UpdateChecklistDto,
  ChecklistRecord,
  ChecklistsStatsResponse
} from './dto/checklists.dto';

export class ChecklistsService extends BaseService<ChecklistEntity> {
  private readonly checklistsRepository: ChecklistsRepository;

  constructor() {
    const repo = new ChecklistsRepository();
    super(repo);
    this.checklistsRepository = repo;
  }

  /**
   * Get filtered checklists with pagination
   */
  async getChecklists(
    filters: ChecklistFilters,
    page: number = 1,
    limit: number = 10
  ): Promise<{ data: ChecklistRecord[]; total: number }> {
    return this.checklistsRepository.getChecklists(filters, page, limit);
  }

  /**
   * Get checklists for a specific claim
   */
  async getClaimChecklists(claim_id: bigint): Promise<ChecklistRecord[]> {
    return this.checklistsRepository.getClaimChecklists(claim_id);
  }

  /**
   * Create a new checklist entry
   */
  async createChecklist(dto: CreateChecklistDto): Promise<ChecklistEntity> {
    return this.checklistsRepository.createChecklist(dto);
  }

  /**
   * Update an existing checklist entry
   */
  async updateChecklist(checklist_id: bigint, dto: UpdateChecklistDto): Promise<ChecklistEntity> {
    return this.checklistsRepository.updateChecklist(checklist_id, dto);
  }

  /**
   * Delete a checklist entry
   */
  async deleteChecklist(checklist_id: bigint): Promise<boolean> {
    return this.checklistsRepository.deleteChecklist(checklist_id);
  }

  /**
   * Get checklists statistics
   */
  async getStats(): Promise<ChecklistsStatsResponse> {
    return this.checklistsRepository.getStats();
  }
}
