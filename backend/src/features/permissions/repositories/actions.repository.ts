import { BaseRepository } from '../../../core/base/base.repository';
import { DB_TABLES } from '../../../core/constants';
import { Action } from '../permissions.types';

/**
 * Actions Repository
 * Extends BaseRepository to inherit all standard CRUD operations
 * 
 * Inherited methods:
 * - findAll(filters?, orderBy?, limit?, offset?)
 * - findById(id)
 * - findOne(filters)
 * - create(data)
 * - update(id, data)
 * - delete(id)
 * - count(filters?)
 * - exists(filters)
 */
export class ActionsRepository extends BaseRepository<Action> {
  constructor() {
    super(
      DB_TABLES.ACTIONS,              // Table name: ccms_acl_actions
      'action_id',                    // Primary key
      false                           // No soft delete (hard delete)
    );
  }

  /**
   * Find action by code
   * Custom method not provided by BaseRepository
   */
  async findByCode(code: string): Promise<Action | null> {
    return this.findOne({ action_code: code });
  }

  /**
   * Get all active actions ordered by name
   */
  async findAllActive(): Promise<Action[]> {
    return this.findAll({
      filters: { is_active: true },
      sort_by: 'action_name',
      sort_order: 'ASC'
    });
  }

  /**
   * Check if action code already exists
   */
  async codeExists(code: string, excludeId?: number): Promise<boolean> {
    const filters: Partial<Action> = { action_code: code };
    const existingAction = await this.findOne(filters);
    
    if (excludeId) {
      return existingAction !== null && existingAction.action_id !== excludeId;
    }
    
    return existingAction !== null;
  }
}
