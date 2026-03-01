import { ClausesRepository } from './clauses.repository';
import { CreateClauseDto, UpdateClauseDto, ClauseFilters, PaginatedClauses, Clause } from './clauses.types';
import { BaseService } from '../../core/base/base.service';

export class ClausesService extends BaseService<Clause> {
  protected repository: ClausesRepository;

  constructor() {
    const repository = new ClausesRepository();
    super(repository);
    this.repository = repository;
  }

  /**
   * Get paginated list of clauses
   */
  public async getClauses(filters: ClauseFilters): Promise<PaginatedClauses> {
    return await this.repository.getClauses(filters);
  }

  /**
   * Get clause by ID
   */
  public async getClauseById(clauseId: number): Promise<Clause | null> {
    return await this.repository.getClauseById(clauseId);
  }

  /**
   * Validate GUID format
   */
  private isValidGuid(guid: string): boolean {
    const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return guidRegex.test(guid);
  }

  /**
   * Create new clause
   */
  public async createClause(dto: CreateClauseDto): Promise<number> {
    // Validate clause code
    if (!dto.clause_code || dto.clause_code.length < 2 || dto.clause_code.length > 20) {
      throw new Error('Clause code must be between 2 and 20 characters');
    }

    // Validate clause text
    if (!dto.clause_text) {
      throw new Error('Clause text is required');
    }

    // Validate legacy_config_id if provided
    if (dto.legacy_config_id && dto.legacy_config_id.trim() !== '') {
      if (!this.isValidGuid(dto.legacy_config_id)) {
        throw new Error('Legacy Config ID must be a valid GUID format (e.g., 12345678-1234-1234-1234-123456789012)');
      }
    }

    // Check if clause code exists
    const exists = await this.repository.clauseCodeExists(dto.clause_code);
    if (exists) {
      throw new Error('Clause code already exists');
    }

    // Create clause
    const clauseId = await this.repository.createClause(
      dto.clause_code,
      dto.clause_text,
      dto.is_active !== undefined ? dto.is_active : true,
      dto.legacy_config_id,
      dto.clause_category
    );

    return clauseId;
  }

  /**
   * Update clause
   */
  public async updateClause(clauseId: number, dto: UpdateClauseDto): Promise<void> {
    // Check if clause exists
    const clause = await this.repository.getClauseById(clauseId);
    if (!clause) {
      throw new Error('Clause not found');
    }

    // Validate clausecode if being updated
    if (dto.clause_code !== undefined) {
      if (dto.clause_code.length < 2 || dto.clause_code.length > 20) {
        throw new Error('Clause code must be between 2 and 20 characters');
      }

      // Check if clause code already exists (excluding current clause)
      const exists = await this.repository.clauseCodeExists(dto.clause_code, clauseId);
      if (exists) {
        throw new Error('Clause code already exists');
      }
    }

    // Validate legacy_config_id if being updated
    if (dto.legacy_config_id !== undefined && dto.legacy_config_id.trim() !== '') {
      if (!this.isValidGuid(dto.legacy_config_id)) {
        throw new Error('Legacy Config ID must be a valid GUID format (e.g., 12345678-1234-1234-1234-123456789012)');
      }
    }

    await this.repository.updateClause(
      clauseId,
      dto.clause_code,
      dto.clause_text,
      dto.legacy_config_id,
      dto.is_active
    );
  }

  /**
   * Delete clause (soft delete)
   */
  public async deleteClause(clauseId: number): Promise<void> {
    // Check if clause exists
    const clause = await this.repository.getClauseById(clauseId);
    if (!clause) {
      throw new Error('Clause not found');
    }

    await this.repository.deleteClause(clauseId);
  }

  /**
   * Check if clause code is available
   */
  public async checkClauseCodeAvailability(clauseCode: string, excludeClauseId?: number): Promise<boolean> {
    const exists = await this.repository.clauseCodeExists(clauseCode, excludeClauseId);
    return !exists;
  }
}
