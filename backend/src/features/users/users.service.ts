import { UsersRepository } from './users.repository';
import { CreateUserDto, UpdateUserDto, UserFilters, PaginatedUsers, UserDetailResponse, User } from './users.types';
import { CryptoUtil } from '../../core/utils/crypto.util';
import { BaseService } from '../../core/base/base.service';

export class UsersService extends BaseService<User> {
  protected repository: UsersRepository;

  constructor() {
    const repository = new UsersRepository();
    super(repository);
    this.repository = repository;
  }

  /**
   * Get paginated list of users
   */
  public async getUsers(filters: UserFilters): Promise<PaginatedUsers> {
    return await this.repository.getUsers(filters);
  }

  /**
   * Get user by ID
   */
  public async getUserById(userId: number): Promise<UserDetailResponse | null> {
    return await this.repository.getUserById(userId);
  }

  /**
   * Create new user
   */
  public async createUser(dto: CreateUserDto, createdBy: string): Promise<number> {
    // Validate username
    if (!dto.username || dto.username.length < 3 || dto.username.length > 50) {
      throw new Error('Username must be between 3 and 50 characters');
    }

    // Check if username exists
    const exists = await this.repository.usernameExists(dto.username);
    if (exists) {
      throw new Error('Username already exists');
    }

    // Validate password
    if (!dto.password || dto.password.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }

    // Hash password
    const passwordHash = await CryptoUtil.hashPassword(dto.password);

    // Create user using base repository
    const userData: Partial<User> = {
      username: dto.username,
      password_hash: passwordHash,
      full_name: dto.full_name,
      is_active: dto.is_active !== undefined ? dto.is_active : true
    };

    const user = await this.repository.create(userData);
    return user.user_id;
  }

  /**
   * Update user
   */
  public async updateUser(userId: number, dto: UpdateUserDto, updatedBy: string): Promise<void> {
    // Check if user exists
    const user = await this.repository.getUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const updateData: Partial<User> = {};

    if (dto.full_name !== undefined) {
      updateData.full_name = dto.full_name;
    }

    if (dto.is_active !== undefined) {
      updateData.is_active = dto.is_active;
    }

    if (dto.password) {
      if (dto.password.length < 8) {
        throw new Error('Password must be at least 8 characters');
      }
      updateData.password_hash = await CryptoUtil.hashPassword(dto.password);
    }

    await this.repository.update(userId, updateData);
  }

  /**
   * Delete user (soft delete by setting is_active to false)
   */
  public async deleteUser(userId: number, deletedBy: string): Promise<void> {
    // Check if user exists
    const user = await this.repository.getUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Prevent deleting self
    // This check should be done in the controller based on logged-in user
    // But added here as additional safeguard

    await this.repository.update(userId, { is_active: false });
  }

  /**
   * Check if username is available
   */
  public async checkUsernameAvailability(username: string, excludeUserId?: number): Promise<boolean> {
    const exists = await this.repository.usernameExists(username, excludeUserId);
    return !exists;
  }
}
