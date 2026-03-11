import { BaseRepository } from '../../../core/base/base.repository';
import { DB_TABLES } from '../../../core/constants';
import { Category } from '../permissions.types';

/**
 * Categories Repository
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
export class CategoriesRepository extends BaseRepository<Category> {
  constructor() {
    super(
      DB_TABLES.CATEGORIES,           // Table name: ccms_acl_categories
      'category_id',                  // Primary key
      false                           // No soft delete (hard delete)
    );
  }

  /**
   * Find category by code
   * Custom method not provided by BaseRepository
   */
  async findByCode(code: string): Promise<Category | null> {
    return this.findOne({ category_code: code });
  }

  /**
   * Get all active categories ordered by display order
   * Override to provide custom default ordering
   */
  async findAllActive(): Promise<Category[]> {
    return this.findAll({
      filters: { is_active: true },
      sort_by: 'display_order',
      sort_order: 'ASC'
    });
  }

  /**
   * Check if category code already exists
   */
  async codeExists(code: string, excludeId?: number): Promise<boolean> {
    const filters: Partial<Category> = { category_code: code };
    const existingCategory = await this.findOne(filters);
    
    if (excludeId) {
      // When updating, exclude current category from check
      return existingCategory !== null && existingCategory.category_id !== excludeId;
    }
    
    return existingCategory !== null;
  }
}
