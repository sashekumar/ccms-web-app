import { Request, Response } from 'express';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto, UserFilters } from './users.types';

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

      res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Error fetching users',
        error: error.message
      });
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
        res.status(400).json({
          success: false,
          message: 'Invalid user ID'
        });
        return;
      }

      const user = await this.service.getUserById(userId);

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      res.json({
        success: true,
        data: user
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Error fetching user',
        error: error.message
      });
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
        res.status(400).json({
          success: false,
          message: 'username, password, and full_name are required'
        });
        return;
      }

      const userId = await this.service.createUser(dto, createdBy);

      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: { userId }
      });
    } catch (error: any) {
      if (error.message === 'Username already exists') {
        res.status(409).json({
          success: false,
          message: error.message
        });
        return;
      }

      if (error.message.includes('must be')) {
        res.status(400).json({
          success: false,
          message: error.message
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Error creating user',
        error: error.message
      });
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
        res.status(400).json({
          success: false,
          message: 'Invalid user ID'
        });
        return;
      }

      await this.service.updateUser(userId, dto, updatedBy);

      res.json({
        success: true,
        message: 'User updated successfully'
      });
    } catch (error: any) {
      if (error.message === 'User not found') {
        res.status(404).json({
          success: false,
          message: error.message
        });
        return;
      }

      if (error.message.includes('must be')) {
        res.status(400).json({
          success: false,
          message: error.message
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Error updating user',
        error: error.message
      });
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
        res.status(400).json({
          success: false,
          message: 'Invalid user ID'
        });
        return;
      }

      // Prevent self-deletion
      if (userId === currentUserId) {
        res.status(400).json({
          success: false,
          message: 'Cannot delete your own account'
        });
        return;
      }

      await this.service.deleteUser(userId, deletedBy);

      res.json({
        success: true,
        message: 'User deleted successfully'
      });
    } catch (error: any) {
      if (error.message === 'User not found') {
        res.status(404).json({
          success: false,
          message: error.message
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Error deleting user',
        error: error.message
      });
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

      res.json({
        success: true,
        data: { available: isAvailable }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Error checking username',
        error: error.message
      });
    }
  };
}
