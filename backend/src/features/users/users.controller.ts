import { Request, Response } from 'express';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto, UserFilters } from './users.types';
import { getErrorMessage } from '../../core/utils/error.util';
import { ResponseUtil } from '../../core/utils/response.util';

export class UsersController {
  private service: UsersService;

  constructor() {
    this.service = new UsersService();
  }

  /**
   * Get paginated list of users
   * POST /api/users/list
   * Body: { search?, isActive?, roleId?, page?, limit?, sortBy?, sortOrder? }
   */
  public getUsers = async (req: Request, res: Response): Promise<void> => {
    try {
      // Accept both camelCase and snake_case from frontend
      const filters: UserFilters = {
        search: req.body.search,
        isActive: req.body.isActive ?? req.body.is_active,
        roleId: req.body.roleId ?? req.body.role_id,
        page: req.body.page || 1,
        limit: req.body.limit || 10,
        sortBy: req.body.sortBy ?? req.body.sort_by ?? 'user_id',
        sortOrder: req.body.sortOrder ?? req.body.sort_order ?? 'DESC'
      };

      const result = await this.service.getUsers(filters);

      ResponseUtil.success(res, result);
    } catch (error: unknown) {
      ResponseUtil.error(res, 'Error fetching users', 500, getErrorMessage(error));
    }
  };

  /**
   * Get user by ID
   * GET /api/users/:userId
   */
  public getUserById = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = parseInt(req.params.userId);

      if (isNaN(userId)) {
        ResponseUtil.error(res, 'Invalid user ID', 400);
        return;
      }

      const user = await this.service.getUserById(userId);

      if (!user) {
        ResponseUtil.notFound(res, 'User not found');
        return;
      }

      ResponseUtil.success(res, user);
    } catch (error: unknown) {
      ResponseUtil.error(res, 'Error fetching user', 500, getErrorMessage(error));
    }
  };

  /**
   * Create new user
   * POST /api/users
   * Body: { username, password, fullName, email?, phoneNumber?, isActive? }
   */
  public createUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const createdBy = (req as any).user.username;
      const dto: CreateUserDto = req.body;

      if (!dto.username || !dto.password || !dto.full_name) {
        ResponseUtil.error(res, 'username, password, and full_name are required', 400);
        return;
      }

      const userId = await this.service.createUser(dto, createdBy);

      ResponseUtil.success(res, { userId }, 'User created successfully', 201);
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);
      
      if (errorMessage === 'Username already exists') {
        ResponseUtil.conflict(res, errorMessage);
        return;
      }

      if (errorMessage.includes('must be')) {
        ResponseUtil.error(res, errorMessage, 400);
        return;
      }

      ResponseUtil.error(res, 'Error creating user', 500, errorMessage);
    }
  };

  /**
   * Update user
   * PUT /api/users/:userId
   * Body: { fullName?, email?, phoneNumber?, isActive?, password? }
   */
  public updateUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const updatedBy = (req as any).user.username;
      const userId = parseInt(req.params.userId);
      const dto: UpdateUserDto = req.body;

      if (isNaN(userId)) {
        ResponseUtil.error(res, 'Invalid user ID', 400);
        return;
      }

      await this.service.updateUser(userId, dto, updatedBy);

      ResponseUtil.success(res, null, 'User updated successfully');
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);
      
      if (errorMessage === 'User not found') {
        ResponseUtil.notFound(res, errorMessage);
        return;
      }

      if (errorMessage.includes('must be')) {
        ResponseUtil.error(res, errorMessage, 400);
        return;
      }

      ResponseUtil.error(res, 'Error updating user', 500, errorMessage);
    }
  };

  /**
   * Delete user (soft delete)
   * DELETE /api/users/:userId
   */
  public deleteUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const deletedBy = (req as any).user.username;
      const currentUserId = (req as any).user.userId;
      const userId = parseInt(req.params.userId);

      if (isNaN(userId)) {
        ResponseUtil.error(res, 'Invalid user ID', 400);
        return;
      }

      // Prevent self-deletion
      if (userId === currentUserId) {
        ResponseUtil.error(res, 'Cannot delete your own account', 400);
        return;
      }

      await this.service.deleteUser(userId, deletedBy);

      ResponseUtil.success(res, null, 'User deleted successfully');
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);
      
      if (errorMessage === 'User not found') {
        ResponseUtil.notFound(res, errorMessage);
        return;
      }

      ResponseUtil.error(res, 'Error deleting user', 500, errorMessage);
    }
  };

  /**
   * Check username availability
   * POST /api/users/check-username
   * Body: { username, excludeUserId? }
   */
  public checkUsername = async (req: Request, res: Response): Promise<void> => {
    try {
      const { username, excludeUserId } = req.body;

      const isAvailable = await this.service.checkUsernameAvailability(username, excludeUserId);

      ResponseUtil.success(res, { available: isAvailable });
    } catch (error: unknown) {
      ResponseUtil.error(res, 'Error checking username', 500, getErrorMessage(error));
    }
  };
}
