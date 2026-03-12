import { LookupsRepository } from './lookups.repository';
import {
  CreateLookupCategoryDto,
  UpdateLookupCategoryDto,
  LookupCategoryFilters,
  PaginatedLookupCategories,
  LookupCategory,
  CreateLookupDto,
  UpdateLookupDto,
  LookupFilters,
  PaginatedLookups,
  Lookup,
  CreateLookupMetadataDto,
  UpdateLookupMetadataDto,
  LookupMetadataFilters,
  PaginatedLookupMetadata,
  LookupMetadata
} from './lookups.types';

export class LookupsService {
  private repository: LookupsRepository;

  constructor() {
    this.repository = new LookupsRepository();
  }

  // ========================================================================
  // LOOKUP CATEGORIES
  // ========================================================================

  public async getLookupCategories(filters: LookupCategoryFilters): Promise<PaginatedLookupCategories> {
    return await this.repository.getLookupCategories(filters);
  }

  public async getLookupCategoryById(categoryId: number): Promise<LookupCategory | null> {
    return await this.repository.getLookupCategoryById(categoryId);
  }

  public async createLookupCategory(dto: CreateLookupCategoryDto, createdBy: string): Promise<number> {
    if (!dto.category_name || dto.category_name.length < 2 || dto.category_name.length > 100) {
      throw new Error('Category name must be between 2 and 100 characters');
    }

    const exists = await this.repository.categoryNameExists(dto.category_name);
    if (exists) {
      throw new Error('Category name already exists');
    }

    const categoryId = await this.repository.createLookupCategory(
      dto.category_name,
      dto.description,
      dto.is_active !== undefined ? dto.is_active : true,
      createdBy
    );

    return categoryId;
  }

  public async updateLookupCategory(categoryId: number, dto: UpdateLookupCategoryDto, updatedBy: string): Promise<void> {
    const category = await this.repository.getLookupCategoryById(categoryId);
    if (!category) {
      throw new Error('Category not found');
    }

    if (dto.category_name !== undefined) {
      if (dto.category_name.length < 2 || dto.category_name.length > 100) {
        throw new Error('Category name must be between 2 and 100 characters');
      }

      const exists = await this.repository.categoryNameExists(dto.category_name, categoryId);
      if (exists) {
        throw new Error('Category name already exists');
      }
    }

    await this.repository.updateLookupCategory(
      categoryId,
      dto.category_name,
      dto.description,
      dto.is_active,
      updatedBy
    );
  }

  public async deleteLookupCategory(categoryId: number): Promise<void> {
    const category = await this.repository.getLookupCategoryById(categoryId);
    if (!category) {
      throw new Error('Category not found');
    }

    await this.repository.deleteLookupCategory(categoryId);
  }

  public async checkCategoryNameAvailability(categoryName: string, excludeCategoryId?: number): Promise<boolean> {
    const exists = await this.repository.categoryNameExists(categoryName, excludeCategoryId);
    return !exists;
  }

  // ========================================================================
  // LOOKUPS
  // ========================================================================

  public async getLookups(filters: LookupFilters): Promise<PaginatedLookups> {
    return await this.repository.getLookups(filters);
  }

  public async getLookupById(lookupId: number): Promise<Lookup | null> {
    return await this.repository.getLookupById(lookupId);
  }

  public async getLookupsByCategory(categoryId: number, isActive?: boolean): Promise<Lookup[]> {
    return await this.repository.getLookupsByCategory(categoryId, isActive);
  }

  public async getLookupsByCategoryName(categoryName: string, isActive?: boolean): Promise<Lookup[]> {
    return await this.repository.getLookupsByCategoryName(categoryName, isActive);
  }

  public async createLookup(dto: CreateLookupDto, createdBy: string): Promise<number> {
    let categoryId = dto.category_id;

    // If new category is provided, create it first
    if (!categoryId && dto.new_category_name) {
      const categoryDto: CreateLookupCategoryDto = {
        category_name: dto.new_category_name,
        description: dto.new_category_description,
        is_active: true
      };
      categoryId = await this.createLookupCategory(categoryDto, createdBy);
    }

    if (!categoryId) {
      throw new Error('Category ID or new category name is required');
    }

    const category = await this.repository.getLookupCategoryById(categoryId);
    if (!category) {
      throw new Error('Category not found');
    }

    if (!dto.lookup_code || dto.lookup_code.length < 2 || dto.lookup_code.length > 20) {
      throw new Error('Lookup code must be between 2 and 20 characters');
    }

    if (!dto.lookup_value || dto.lookup_value.length < 1 || dto.lookup_value.length > 255) {
      throw new Error('Lookup value must be between 1 and 255 characters');
    }

    const exists = await this.repository.lookupCodeExists(categoryId, dto.lookup_code);
    if (exists) {
      throw new Error('Lookup code already exists in this category');
    }

    // Auto-calculate sort order if not provided
    let sortOrder = dto.sort_order;
    if (sortOrder === undefined || sortOrder === null) {
      sortOrder = await this.repository.getNextSortOrder(categoryId);
    }

    const lookupId = await this.repository.createLookup(
      categoryId,
      dto.lookup_code,
      dto.lookup_value,
      sortOrder,
      dto.is_active !== undefined ? dto.is_active : true,
      createdBy
    );

    return lookupId;
  }

  public async updateLookup(lookupId: number, dto: UpdateLookupDto, updatedBy: string): Promise<void> {
    const lookup = await this.repository.getLookupById(lookupId);
    if (!lookup) {
      throw new Error('Lookup not found');
    }

    if (dto.category_id !== undefined) {
      const category = await this.repository.getLookupCategoryById(dto.category_id);
      if (!category) {
        throw new Error('Category not found');
      }
    }

    if (dto.lookup_code !== undefined) {
      if (dto.lookup_code.length < 2 || dto.lookup_code.length > 20) {
        throw new Error('Lookup code must be between 2 and 20 characters');
      }

      const categoryId = dto.category_id || lookup.category_id;
      const exists = await this.repository.lookupCodeExists(categoryId, dto.lookup_code, lookupId);
      if (exists) {
        throw new Error('Lookup code already exists in this category');
      }
    }

    if (dto.lookup_value !== undefined && (dto.lookup_value.length < 1 || dto.lookup_value.length > 255)) {
      throw new Error('Lookup value must be between 1 and 255 characters');
    }

    await this.repository.updateLookup(
      lookupId,
      dto.category_id,
      dto.lookup_code,
      dto.lookup_value,
      dto.sort_order,
      dto.is_active,
      updatedBy
    );
  }

  public async deleteLookup(lookupId: number): Promise<void> {
    const lookup = await this.repository.getLookupById(lookupId);
    if (!lookup) {
      throw new Error('Lookup not found');
    }

    await this.repository.deleteLookup(lookupId);
  }

  public async checkLookupCodeAvailability(categoryId: number, lookupCode: string, excludeLookupId?: number): Promise<boolean> {
    const exists = await this.repository.lookupCodeExists(categoryId, lookupCode, excludeLookupId);
    return !exists;
  }

  // ========================================================================
  // LOOKUP METADATA
  // ========================================================================

  public async getLookupMetadata(filters: LookupMetadataFilters): Promise<PaginatedLookupMetadata> {
    return await this.repository.getLookupMetadata(filters);
  }

  public async getLookupMetadataById(metadataId: number): Promise<LookupMetadata | null> {
    return await this.repository.getLookupMetadataById(metadataId);
  }

  public async createLookupMetadata(dto: CreateLookupMetadataDto, createdBy: string): Promise<number> {
    if (!dto.lookup_id) {
      throw new Error('Lookup ID is required');
    }

    const lookup = await this.repository.getLookupById(dto.lookup_id);
    if (!lookup) {
      throw new Error('Lookup not found');
    }

    if (!dto.metadata_key || dto.metadata_key.length < 1 || dto.metadata_key.length > 100) {
      throw new Error('Metadata key must be between 1 and 100 characters');
    }

    if (!dto.metadata_value || dto.metadata_value.length < 1 || dto.metadata_value.length > 500) {
      throw new Error('Metadata value must be between 1 and 500 characters');
    }

    const exists = await this.repository.metadataKeyExists(dto.lookup_id, dto.metadata_key);
    if (exists) {
      throw new Error('Metadata key already exists for this lookup');
    }

    const metadataId = await this.repository.createLookupMetadata(
      dto.lookup_id,
      dto.metadata_key,
      dto.metadata_value,
      createdBy
    );

    return metadataId;
  }

  public async updateLookupMetadata(metadataId: number, dto: UpdateLookupMetadataDto, updatedBy: string): Promise<void> {
    const metadata = await this.repository.getLookupMetadataById(metadataId);
    if (!metadata) {
      throw new Error('Metadata not found');
    }

    if (dto.metadata_key !== undefined) {
      if (dto.metadata_key.length < 1 || dto.metadata_key.length > 100) {
        throw new Error('Metadata key must be between 1 and 100 characters');
      }

      const exists = await this.repository.metadataKeyExists(metadata.lookup_id, dto.metadata_key, metadataId);
      if (exists) {
        throw new Error('Metadata key already exists for this lookup');
      }
    }

    if (dto.metadata_value !== undefined && (dto.metadata_value.length < 1 || dto.metadata_value.length > 500)) {
      throw new Error('Metadata value must be between 1 and 500 characters');
    }

    await this.repository.updateLookupMetadata(
      metadataId,
      dto.metadata_key,
      dto.metadata_value,
      updatedBy
    );
  }

  public async deleteLookupMetadata(metadataId: number, deletedBy: string): Promise<void> {
    const metadata = await this.repository.getLookupMetadataById(metadataId);
    if (!metadata) {
      throw new Error('Metadata not found');
    }

    await this.repository.deleteLookupMetadata(metadataId, deletedBy);
  }

  public async checkMetadataKeyAvailability(lookupId: number, metadataKey: string, excludeMetadataId?: number): Promise<boolean> {
    const exists = await this.repository.metadataKeyExists(lookupId, metadataKey, excludeMetadataId);
    return !exists;
  }
}
