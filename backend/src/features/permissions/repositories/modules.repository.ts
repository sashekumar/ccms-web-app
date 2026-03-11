import { BaseRepository } from '../../../core/base/base.repository';
import { DB_TABLES } from '../../../core/constants';
import { Module } from '../permissions.types';

/**
 * Modules Repository
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
export class ModulesRepository extends BaseRepository<Module> {
  constructor() {
    super(
      DB_TABLES.MODULES,              // Table name: ccms_acl_modules
      'module_id',                    // Primary key
      false                           // No soft delete (hard delete)
    );
  }

  /**
   * Find module by code
   * Custom method not provided by BaseRepository
   */
  async findByCode(code: string): Promise<Module | null> {
    return this.findOne({ module_code: code });
  }

  /**
   * Get all active modules ordered by display order
   * Override to provide custom default ordering
   */
  async findAllActive(): Promise<Module[]> {
    return this.findAll({
      filters: { is_active: true },
      sort_by: 'display_order',
      sort_order: 'ASC'
    });
  }

  /**
   * Get modules by category
   */
  async findByCategory(categoryId: number): Promise<Module[]> {
    return this.findAll({
      filters: { category_id: categoryId, is_active: true },
      sort_by: 'display_order',
      sort_order: 'ASC'
    });
  }

  /**
   * Check if module code already exists
   */
  async codeExists(code: string, excludeId?: number): Promise<boolean> {
    const filters: Partial<Module> = { module_code: code };
    const existingModule = await this.findOne(filters);
    
    if (excludeId) {
      return existingModule !== null && existingModule.module_id !== excludeId;
    }
    
    return existingModule !== null;
  }
}
