import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';
import { CryptoUtil } from '../../core/utils/crypto.util';
import { CreateUserDto, UpdateUserDto, UserFilters, PaginatedUsers, UserDetailResponse, User } from './users.types';

// Mock dependencies
jest.mock('./users.repository');
jest.mock('../../core/utils/crypto.util');

describe('UsersService', () => {
  let service: UsersService;
  let mockRepository: jest.Mocked<UsersRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create mock repository
    mockRepository = {
      getUsers: jest.fn(),
      getUserById: jest.fn(),
      usernameExists: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findById: jest.fn(),
    } as any;

    // Mock the UsersRepository constructor
    (UsersRepository as jest.MockedClass<typeof UsersRepository>).mockImplementation(() => mockRepository);

    service = new UsersService();
  });

  describe('getUsers', () => {
    it('should get users from repository', async () => {
      const mockResult: PaginatedUsers = {
        users: [
          {
            user_id: 1,
            username: 'testuser',
            full_name: 'Test User',
            is_active: true,
            last_login: null,
            roles: []
          }
        ],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1
      };

      mockRepository.getUsers.mockResolvedValue(mockResult);

      const filters: UserFilters = { page: 1, limit: 10 };
      const result = await service.getUsers(filters);

      expect(result).toEqual(mockResult);
      expect(mockRepository.getUsers).toHaveBeenCalledWith(filters);
    });

    it('should pass filters to repository', async () => {
      mockRepository.getUsers.mockResolvedValue({
        users: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0
      });

      const filters: UserFilters = {
        search: 'john',
        isActive: true,
        roleId: 2,
        sortBy: 'username',
        sortOrder: 'ASC'
      };

      await service.getUsers(filters);

      expect(mockRepository.getUsers).toHaveBeenCalledWith(filters);
    });
  });

  describe('getUserById', () => {
    it('should get user by ID from repository', async () => {
      const mockUser: UserDetailResponse = {
        user: {
          user_id: 1,
          username: 'testuser',
          full_name: 'Test User',
          is_active: true,
          last_login: null
        },
        roles: []
      };

      mockRepository.getUserById.mockResolvedValue(mockUser);

      const result = await service.getUserById(1);

      expect(result).toEqual(mockUser);
      expect(mockRepository.getUserById).toHaveBeenCalledWith(1);
    });

    it('should return null when user not found', async () => {
      mockRepository.getUserById.mockResolvedValue(null);

      const result = await service.getUserById(999);

      expect(result).toBeNull();
    });
  });

  describe('createUser', () => {
    const mockHashedPassword = '$2b$10$hashedpassword';

    beforeEach(() => {
      (CryptoUtil.hashPassword as jest.Mock).mockResolvedValue(mockHashedPassword);
      mockRepository.usernameExists.mockResolvedValue(false);
      mockRepository.create.mockResolvedValue({ user_id: 1 } as User);
    });

    it('should create user successfully', async () => {
      const dto: CreateUserDto = {
        username: 'newuser',
        password: 'password123',
        full_name: 'New User',
        is_active: true
      };

      const userId = await service.createUser(dto, 'admin');

      expect(userId).toBe(1);
      expect(CryptoUtil.hashPassword).toHaveBeenCalledWith('password123');
      expect(mockRepository.create).toHaveBeenCalledWith(
        {
          username: 'newuser',
          password_hash: mockHashedPassword,
          full_name: 'New User',
          is_active: true
        },
        'admin'
      );
    });

    it('should default is_active to true if not provided', async () => {
      const dto: CreateUserDto = {
        username: 'newuser',
        password: 'password123',
        full_name: 'New User'
      };

      await service.createUser(dto, 'admin');

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ is_active: true }),
        'admin'
      );
    });

    it('should throw error if username is too short', async () => {
      const dto: CreateUserDto = {
        username: 'ab',
        password: 'password123',
        full_name: 'Test'
      };

      await expect(service.createUser(dto, 'admin')).rejects.toThrow(
        'Username must be between 3 and 50 characters'
      );

      expect(mockRepository.usernameExists).not.toHaveBeenCalled();
    });

    it('should throw error if username is too long', async () => {
      const dto: CreateUserDto = {
        username: 'a'.repeat(51),
        password: 'password123',
        full_name: 'Test'
      };

      await expect(service.createUser(dto, 'admin')).rejects.toThrow(
        'Username must be between 3 and 50 characters'
      );
    });

    it('should throw error if username is empty', async () => {
      const dto: CreateUserDto = {
        username: '',
        password: 'password123',
        full_name: 'Test'
      };

      await expect(service.createUser(dto, 'admin')).rejects.toThrow(
        'Username must be between 3 and 50 characters'
      );
    });

    it('should throw error if username already exists', async () => {
      mockRepository.usernameExists.mockResolvedValue(true);

      const dto: CreateUserDto = {
        username: 'existinguser',
        password: 'password123',
        full_name: 'Test'
      };

      await expect(service.createUser(dto, 'admin')).rejects.toThrow(
        'Username already exists'
      );

      expect(mockRepository.create).not.toHaveBeenCalled();
    });

    it('should throw error if password is too short', async () => {
      const dto: CreateUserDto = {
        username: 'newuser',
        password: 'short',
        full_name: 'Test'
      };

      await expect(service.createUser(dto, 'admin')).rejects.toThrow(
        'Password must be at least 8 characters'
      );

      expect(CryptoUtil.hashPassword).not.toHaveBeenCalled();
    });

    it('should throw error if password is empty', async () => {
      const dto: CreateUserDto = {
        username: 'newuser',
        password: '',
        full_name: 'Test'
      };

      await expect(service.createUser(dto, 'admin')).rejects.toThrow(
        'Password must be at least 8 characters'
      );
    });

    it('should check username availability before creating', async () => {
      const dto: CreateUserDto = {
        username: 'newuser',
        password: 'password123',
        full_name: 'Test'
      };

      await service.createUser(dto, 'admin');

      expect(mockRepository.usernameExists).toHaveBeenCalledWith('newuser');
    });

    it('should hash password before storing', async () => {
      const dto: CreateUserDto = {
        username: 'newuser',
        password: 'mypassword',
        full_name: 'Test'
      };

      await service.createUser(dto, 'admin');

      expect(CryptoUtil.hashPassword).toHaveBeenCalledWith('mypassword');
      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ password_hash: mockHashedPassword }),
        'admin'
      );
    });
  });

  describe('updateUser', () => {
    const mockUserDetail: UserDetailResponse = {
      user: {
        user_id: 1,
        username: 'testuser',
        full_name: 'Test User',
        is_active: true,
        last_login: null
      },
      roles: []
    };

    beforeEach(() => {
      mockRepository.getUserById.mockResolvedValue(mockUserDetail);
      (mockRepository.update as jest.Mock).mockResolvedValue(undefined);
    });

    it('should update user full name', async () => {
      const dto: UpdateUserDto = {
        full_name: 'Updated Name'
      };

      await service.updateUser(1, dto, 'admin');

      expect(mockRepository.update).toHaveBeenCalledWith(
        1,
        { full_name: 'Updated Name' },
        'admin'
      );
    });

    it('should update user is_active status', async () => {
      const dto: UpdateUserDto = {
        is_active: false
      };

      await service.updateUser(1, dto, 'admin');

      expect(mockRepository.update).toHaveBeenCalledWith(
        1,
        { is_active: false },
        'admin'
      );
    });

    it('should update user password', async () => {
      const mockHashedPassword = '$2b$10$newhash';
      (CryptoUtil.hashPassword as jest.Mock).mockResolvedValue(mockHashedPassword);

      const dto: UpdateUserDto = {
        password: 'newpassword123'
      };

      await service.updateUser(1, dto, 'admin');

      expect(CryptoUtil.hashPassword).toHaveBeenCalledWith('newpassword123');
      expect(mockRepository.update).toHaveBeenCalledWith(
        1,
        { password_hash: mockHashedPassword },
        'admin'
      );
    });

    it('should update multiple fields at once', async () => {
      const mockHashedPassword = '$2b$10$newhash';
      (CryptoUtil.hashPassword as jest.Mock).mockResolvedValue(mockHashedPassword);

      const dto: UpdateUserDto = {
        full_name: 'New Name',
        is_active: false,
        password: 'newpass123'
      };

      await service.updateUser(1, dto, 'admin');

      expect(mockRepository.update).toHaveBeenCalledWith(
        1,
        {
          full_name: 'New Name',
          is_active: false,
          password_hash: mockHashedPassword
        },
        'admin'
      );
    });

    it('should throw error if user not found', async () => {
      mockRepository.getUserById.mockResolvedValue(null);

      const dto: UpdateUserDto = {
        full_name: 'New Name'
      };

      await expect(service.updateUser(999, dto, 'admin')).rejects.toThrow(
        'User not found'
      );

      expect(mockRepository.update).not.toHaveBeenCalled();
    });

    it('should throw error if new password is too short', async () => {
      const dto: UpdateUserDto = {
        password: 'short'
      };

      await expect(service.updateUser(1, dto, 'admin')).rejects.toThrow(
        'Password must be at least 8 characters'
      );

      expect(CryptoUtil.hashPassword).not.toHaveBeenCalled();
      expect(mockRepository.update).not.toHaveBeenCalled();
    });

    it('should not hash password if not provided', async () => {
      const dto: UpdateUserDto = {
        full_name: 'New Name'
      };

      await service.updateUser(1, dto, 'admin');

      expect(CryptoUtil.hashPassword).not.toHaveBeenCalled();
    });

    it('should check user exists before updating', async () => {
      const dto: UpdateUserDto = {
        full_name: 'New Name'
      };

      await service.updateUser(1, dto, 'admin');

      expect(mockRepository.getUserById).toHaveBeenCalledWith(1);
    });
  });

  describe('deleteUser', () => {
    const mockUserDetail: UserDetailResponse = {
      user: {
        user_id: 1,
        username: 'testuser',
        full_name: 'Test User',
        is_active: true,
        last_login: null
      },
      roles: []
    };

    beforeEach(() => {
      mockRepository.getUserById.mockResolvedValue(mockUserDetail);
      (mockRepository.update as jest.Mock).mockResolvedValue(undefined);
    });

    it('should delete user by setting is_active to false', async () => {
      await service.deleteUser(1, 'admin');

      expect(mockRepository.update).toHaveBeenCalledWith(
        1,
        { is_active: false },
        'admin'
      );
    });

    it('should throw error if user not found', async () => {
      mockRepository.getUserById.mockResolvedValue(null);

      await expect(service.deleteUser(999, 'admin')).rejects.toThrow(
        'User not found'
      );

      expect(mockRepository.update).not.toHaveBeenCalled();
    });

    it('should check user exists before deleting', async () => {
      await service.deleteUser(1, 'admin');

      expect(mockRepository.getUserById).toHaveBeenCalledWith(1);
    });
  });

  describe('checkUsernameAvailability', () => {
    it('should return true when username is available', async () => {
      mockRepository.usernameExists.mockResolvedValue(false);

      const result = await service.checkUsernameAvailability('newuser');

      expect(result).toBe(true);
      expect(mockRepository.usernameExists).toHaveBeenCalledWith('newuser', undefined);
    });

    it('should return false when username is taken', async () => {
      mockRepository.usernameExists.mockResolvedValue(true);

      const result = await service.checkUsernameAvailability('existinguser');

      expect(result).toBe(false);
    });

    it('should support excluding user ID', async () => {
      mockRepository.usernameExists.mockResolvedValue(false);

      const result = await service.checkUsernameAvailability('testuser', 5);

      expect(result).toBe(true);
      expect(mockRepository.usernameExists).toHaveBeenCalledWith('testuser', 5);
    });
  });
});
