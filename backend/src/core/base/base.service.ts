import { BaseRepository, QueryOptions } from './base.repository';

/**
 * Base Service Pattern
 * Provides common business logic operations
 * All feature services should extend this class
 * 
 * @template T - The entity type this service works with
 */
export abstract class BaseService<T> {
  protected repository: BaseRepository<T>;

  /**
   * @param repository - The repository instance for this service
   */
  constructor(repository: BaseRepository<T>) {
    this.repository = repository;
  }

  /**
   * Get all records with optional filters
   */
  public async getAll(options?: QueryOptions): Promise<T[]> {
    return this.repository.findAll(options);
  }

  /**
   * Get a single record by ID
   */
  public async getById(id: string | number): Promise<T | null> {
    const record = await this.repository.findById(id);
    
    if (!record) {
      throw new Error(`Record with ID ${id} not found`);
    }
    
    return record;
  }

  /**
   * Get a single record by conditions
   */
  public async getOne(conditions: Record<string, unknown>): Promise<T | null> {
    return this.repository.findOne(conditions);
  }

  /**
   * Create a new record
   * Override this method to add validation and business logic
   * @param data - Record data to insert
   * @param createdBy - Username of the user creating the record
   */
  public async create(data: Partial<T>, createdBy?: string): Promise<T> {
    // Add business logic validation here in child classes
    return this.repository.create(data, createdBy);
  }

  /**
   * Update a record
   * Override this method to add validation and business logic
   * @param id - Primary key value
   * @param data - Record data to update
   * @param updatedBy - Username of the user updating the record
   */
  public async update(id: string | number, data: Partial<T>, updatedBy?: string): Promise<T> {
    // Verify record exists
    await this.getById(id);
    
    // Add business logic validation here in child classes
    return this.repository.update(id, data, updatedBy);
  }

  /**
   * Delete a record (soft delete)
   */
  public async delete(id: string | number): Promise<void> {
    // Verify record exists
    await this.getById(id);
    
    return this.repository.delete(id);
  }

  /**
   * Count records with optional filters
   */
  public async count(filters?: Record<string, unknown>): Promise<number> {
    return this.repository.count(filters);
  }

  /**
   * Check if a record exists
   */
  public async exists(id: string | number): Promise<boolean> {
    return this.repository.exists(id);
  }
}
