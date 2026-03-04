import { ActionsRepository } from './actions.repository';
import { ModulesRepository } from './modules.repository';
import { CategoriesRepository } from './categories.repository';
import { BaseRepository } from '../../../core/base/base.repository';

// Mock BaseRepository
jest.mock('../../../core/base/base.repository');

describe('Permissions Repositories', () => {
  describe('ActionsRepository', () => {
    let repository: ActionsRepository;

    beforeEach(() => {
      jest.clearAllMocks();
      
      repository = new ActionsRepository();
      
      // Spy on BaseRepository methods
      jest.spyOn(repository as any, 'findOne').mockImplementation(jest.fn());
      jest.spyOn(repository as any, 'findAll').mockImplementation(jest.fn());
    });

    describe('findByCode', () => {
      it('should find action by code', async () => {
        const mockAction = { action_id: 1, action_code: 'VIEW', action_name: 'View' };
        (repository as any).findOne.mockResolvedValue(mockAction);

        const result = await repository.findByCode('VIEW');

        expect(result).toEqual(mockAction);
        expect(repository['findOne']).toHaveBeenCalledWith({ action_code: 'VIEW' });
      });

      it('should return null when action not found', async () => {
        (repository as any).findOne.mockResolvedValue(null);

        const result = await repository.findByCode('NONEXISTENT');

        expect(result).toBeNull();
      });
    });

    describe('findAllActive', () => {
      it('should return all active actions sorted by name', async () => {
        const mockActions = [
          { action_id: 1, action_code: 'VIEW', action_name: 'View', is_active: true },
          { action_id: 2, action_code: 'EDIT', action_name: 'Edit', is_active: true },
        ];
        (repository as any).findAll.mockResolvedValue(mockActions);

        const result = await repository.findAllActive();

        expect(result).toEqual(mockActions);
        expect(repository['findAll']).toHaveBeenCalledWith({
          filters: { is_active: true },
          sortBy: 'action_name',
          sortOrder: 'ASC'
        });
      });
    });

    describe('codeExists', () => {
      it('should return true when code exists', async () => {
        (repository as any).findOne.mockResolvedValue({ action_id: 1, action_code: 'VIEW' });

        const result = await repository.codeExists('VIEW');

        expect(result).toBe(true);
      });

      it('should return false when code does not exist', async () => {
        (repository as any).findOne.mockResolvedValue(null);

        const result = await repository.codeExists('NONEXISTENT');

        expect(result).toBe(false);
      });

      it('should exclude specified ID when checking', async () => {
        (repository as any).findOne.mockResolvedValue({ action_id: 5, action_code: 'VIEW' });

        const result = await repository.codeExists('VIEW', 5);

        expect(result).toBe(false);
      });

      it('should return true when code exists for different ID', async () => {
        (repository as any).findOne.mockResolvedValue({ action_id: 5, action_code: 'VIEW' });

        const result = await repository.codeExists('VIEW', 10);

        expect(result).toBe(true);
      });
    });
  });

  describe('ModulesRepository', () => {
    let repository: ModulesRepository;

    beforeEach(() => {
      jest.clearAllMocks();
      
      repository = new ModulesRepository();
      
      // Spy on BaseRepository methods
      jest.spyOn(repository as any, 'findOne').mockImplementation(jest.fn());
      jest.spyOn(repository as any, 'findAll').mockImplementation(jest.fn());
    });

    describe('findByCode', () => {
      it('should find module by code', async () => {
        const mockModule = { module_id: 1, module_code: 'USERS', module_name: 'Users' };
        (repository as any).findOne.mockResolvedValue(mockModule);

        const result = await repository.findByCode('USERS');

        expect(result).toEqual(mockModule);
        expect(repository['findOne']).toHaveBeenCalledWith({ module_code: 'USERS' });
      });

      it('should return null when module not found', async () => {
        (repository as any).findOne.mockResolvedValue(null);

        const result = await repository.findByCode('NONEXISTENT');

        expect(result).toBeNull();
      });
    });

    describe('findAllActive', () => {
      it('should return all active modules sorted by display order', async () => {
        const mockModules = [
          { module_id: 1, module_code: 'USERS', display_order: 1, is_active: true },
          { module_id: 2, module_code: 'ROLES', display_order: 2, is_active: true },
        ];
        (repository as any).findAll.mockResolvedValue(mockModules);

        const result = await repository.findAllActive();

        expect(result).toEqual(mockModules);
        expect(repository['findAll']).toHaveBeenCalledWith({
          filters: { is_active: true },
          sortBy: 'display_order',
          sortOrder: 'ASC'
        });
      });
    });

    describe('findByCategory', () => {
      it('should return modules in specified category', async () => {
        const mockModules = [
          { module_id: 1, category_id: 5, module_code: 'USERS', display_order: 1 },
        ];
        (repository as any).findAll.mockResolvedValue(mockModules);

        const result = await repository.findByCategory(5);

        expect(result).toEqual(mockModules);
        expect(repository['findAll']).toHaveBeenCalledWith({
          filters: { category_id: 5, is_active: true },
          sortBy: 'display_order',
          sortOrder: 'ASC'
        });
      });

      it('should return empty array when category has no modules', async () => {
        (repository as any).findAll.mockResolvedValue([]);

        const result = await repository.findByCategory(999);

        expect(result).toEqual([]);
      });
    });

    describe('codeExists', () => {
      it('should return true when code exists', async () => {
        (repository as any).findOne.mockResolvedValue({ module_id: 1, module_code: 'USERS' });

        const result = await repository.codeExists('USERS');

        expect(result).toBe(true);
      });

      it('should return false when code does not exist', async () => {
        (repository as any).findOne.mockResolvedValue(null);

        const result = await repository.codeExists('NONEXISTENT');

        expect(result).toBe(false);
      });

      it('should exclude specified ID when checking', async () => {
        (repository as any).findOne.mockResolvedValue({ module_id: 5, module_code: 'USERS' });

        const result = await repository.codeExists('USERS', 5);

        expect(result).toBe(false);
      });

      it('should return true when code exists for different ID', async () => {
        (repository as any).findOne.mockResolvedValue({ module_id: 5, module_code: 'USERS' });

        const result = await repository.codeExists('USERS', 10);

        expect(result).toBe(true);
      });
    });
  });

  describe('CategoriesRepository', () => {
    let repository: CategoriesRepository;

    beforeEach(() => {
      jest.clearAllMocks();
      
      repository = new CategoriesRepository();
      
      // Spy on BaseRepository methods
      jest.spyOn(repository as any, 'findOne').mockImplementation(jest.fn());
      jest.spyOn(repository as any, 'findAll').mockImplementation(jest.fn());
    });

    describe('findByCode', () => {
      it('should find category by code', async () => {
        const mockCategory = { category_id: 1, category_code: 'SYSTEM', category_name: 'System' };
        (repository as any).findOne.mockResolvedValue(mockCategory);

        const result = await repository.findByCode('SYSTEM');

        expect(result).toEqual(mockCategory);
        expect(repository['findOne']).toHaveBeenCalledWith({ category_code: 'SYSTEM' });
      });

      it('should return null when category not found', async () => {
        (repository as any).findOne.mockResolvedValue(null);

        const result = await repository.findByCode('NONEXISTENT');

        expect(result).toBeNull();
      });
    });

    describe('findAllActive', () => {
      it('should return all active categories sorted by display order', async () => {
        const mockCategories = [
          { category_id: 1, category_code: 'SYSTEM', display_order: 1, is_active: true },
          { category_id: 2, category_code: 'BUSINESS', display_order: 2, is_active: true },
        ];
        (repository as any).findAll.mockResolvedValue(mockCategories);

        const result = await repository.findAllActive();

        expect(result).toEqual(mockCategories);
        expect(repository['findAll']).toHaveBeenCalledWith({
          filters: { is_active: true },
          sortBy: 'display_order',
          sortOrder: 'ASC'
        });
      });
    });

    describe('codeExists', () => {
      it('should return true when code exists', async () => {
        (repository as any).findOne.mockResolvedValue({ category_id: 1, category_code: 'SYSTEM' });

        const result = await repository.codeExists('SYSTEM');

        expect(result).toBe(true);
      });

      it('should return false when code does not exist', async () => {
        (repository as any).findOne.mockResolvedValue(null);

        const result = await repository.codeExists('NONEXISTENT');

        expect(result).toBe(false);
      });

      it('should exclude specified ID when checking', async () => {
        (repository as any).findOne.mockResolvedValue({ category_id: 5, category_code: 'SYSTEM' });

        const result = await repository.codeExists('SYSTEM', 5);

        expect(result).toBe(false);
      });

      it('should return true when code exists for different ID', async () => {
        (repository as any).findOne.mockResolvedValue({ category_id: 5, category_code: 'SYSTEM' });

        const result = await repository.codeExists('SYSTEM', 10);

        expect(result).toBe(true);
      });
    });
  });
});
