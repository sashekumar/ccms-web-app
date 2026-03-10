import request from 'supertest';
import express, { Express } from 'express';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

// Mock dependencies
jest.mock('./users.service');

describe('UsersController Integration Tests', () => {
  let app: Express;
  let usersController: UsersController;
  let mockUsersService: jest.Mocked<UsersService>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create Express app
    app = express();
    app.use(express.json());

    // Mock UsersService
    mockUsersService = {
      getUsers: jest.fn(),
      getUserById: jest.fn(),
      createUser: jest.fn(),
      updateUser: jest.fn(),
      deleteUser: jest.fn(),
      checkUsernameAvailability: jest.fn(),
    } as any;

    (UsersService as jest.MockedClass<typeof UsersService>).mockImplementation(() => mockUsersService);

    // Initialize controller and setup routes
    usersController = new UsersController();
    
    app.post('/api/users/list', usersController.getUsers);
    app.get('/api/users/:userId', usersController.getUserById);
    app.post('/api/users', (req, res, next) => {
      req.user = { userId: 1, username: 'admin', roles: [] } as any;
      usersController.createUser(req, res);
    });
    app.put('/api/users/:userId', (req, res) => {
      req.user = { userId: 1, username: 'admin', roles: [] } as any;
      usersController.updateUser(req, res);
    });
    app.delete('/api/users/:userId', (req, res) => {
      req.user = { userId: 1, username: 'admin', roles: [] } as any;
      usersController.deleteUser(req, res);
    });
    app.post('/api/users/check-username', usersController.checkUsername);
  });

  describe('POST /api/users/list', () => {
    const mockUsersResult = {
      users: [
        { user_id: 1, username: 'user1', full_name: 'User One', is_active: true, last_login: null, roles: [] },
        { user_id: 2, username: 'user2', full_name: 'User Two', is_active: true, last_login: null, roles: [] }
      ],
      total: 2,
      page: 1,
      limit: 10,
      totalPages: 1
    };

    it('should return paginated list of users', async () => {
      mockUsersService.getUsers.mockResolvedValue(mockUsersResult);

      const response = await request(app)
        .post('/api/users/list')
        .send({})
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockUsersResult);
      expect(mockUsersService.getUsers).toHaveBeenCalled();
    });

    it('should apply search filter', async () => {
      mockUsersService.getUsers.mockResolvedValue(mockUsersResult);

      await request(app)
        .post('/api/users/list')
        .send({ search: 'john' })
        .expect(200);

      expect(mockUsersService.getUsers).toHaveBeenCalledWith(
        expect.objectContaining({ search: 'john' })
      );
    });

    it('should apply isActive filter', async () => {
      mockUsersService.getUsers.mockResolvedValue(mockUsersResult);

      await request(app)
        .post('/api/users/list')
        .send({ isActive: true })
        .expect(200);

      expect(mockUsersService.getUsers).toHaveBeenCalledWith(
        expect.objectContaining({ isActive: true })
      );
    });

    it('should apply roleId filter', async () => {
      mockUsersService.getUsers.mockResolvedValue(mockUsersResult);

      await request(app)
        .post('/api/users/list')
        .send({ roleId: 2 })
        .expect(200);

      expect(mockUsersService.getUsers).toHaveBeenCalledWith(
        expect.objectContaining({ roleId: 2 })
      );
    });

    it('should apply pagination', async () => {
      mockUsersService.getUsers.mockResolvedValue(mockUsersResult);

      await request(app)
        .post('/api/users/list')
        .send({ page: 2, limit: 20 })
        .expect(200);

      expect(mockUsersService.getUsers).toHaveBeenCalledWith(
        expect.objectContaining({ page: 2, limit: 20 })
      );
    });

    it('should apply sorting', async () => {
      mockUsersService.getUsers.mockResolvedValue(mockUsersResult);

      await request(app)
        .post('/api/users/list')
        .send({ sortBy: 'username', sortOrder: 'ASC' })
        .expect(200);

      expect(mockUsersService.getUsers).toHaveBeenCalledWith(
        expect.objectContaining({ sortBy: 'username', sortOrder: 'ASC' })
      );
    });

    it('should use default pagination when not provided', async () => {
      mockUsersService.getUsers.mockResolvedValue(mockUsersResult);

      await request(app)
        .post('/api/users/list')
        .send({})
        .expect(200);

      expect(mockUsersService.getUsers).toHaveBeenCalledWith(
        expect.objectContaining({ page: 1, limit: 10 })
      );
    });

    it('should handle service errors', async () => {
      mockUsersService.getUsers.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/api/users/list')
        .send({})
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Error fetching users');
    });
  });

  describe('GET /api/users/:userId', () => {
    const mockUser = {
      user: {
        user_id: 1,
        username: 'testuser',
        full_name: 'Test User',
        is_active: true,
        last_login: null
      },
      roles: [{ role_id: 1, role_name: 'Admin', role_code: 'ADMIN', assigned_at: new Date('2024-01-01'), assigned_by: 'system', expires_at: null }]
    };

    it('should return user by ID', async () => {
      mockUsersService.getUserById.mockResolvedValue(mockUser);

      const response = await request(app)
        .get('/api/users/1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toEqual(mockUser.user);
      expect(response.body.data.roles).toHaveLength(1);
      expect(response.body.data.roles[0].role_id).toBe(1);
      expect(response.body.data.roles[0].role_name).toBe('Admin');
      expect(mockUsersService.getUserById).toHaveBeenCalledWith(1);
    });

    it('should return 404 when user not found', async () => {
      mockUsersService.getUserById.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/users/999')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('User not found');
    });

    it('should return 400 for invalid user ID', async () => {
      const response = await request(app)
        .get('/api/users/invalid')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid user ID');
      expect(mockUsersService.getUserById).not.toHaveBeenCalled();
    });

    it('should handle service errors', async () => {
      mockUsersService.getUserById.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/users/1')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Error fetching user');
    });
  });

  describe('POST /api/users', () => {
    const validUserDto = {
      username: 'newuser',
      password: 'password123',
      full_name: 'New User'
    };

    it('should create user successfully', async () => {
      mockUsersService.createUser.mockResolvedValue(123);

      const response = await request(app)
        .post('/api/users')
        .send(validUserDto)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.userId).toBe(123);
      expect(response.body.message).toBe('User created successfully');
      expect(mockUsersService.createUser).toHaveBeenCalledWith(validUserDto, 'admin');
    });

    it('should return 400 when username is missing', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({ password: 'password123', full_name: 'Test' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('username, password, and full_name are required');
      expect(mockUsersService.createUser).not.toHaveBeenCalled();
    });

    it('should return 400 when password is missing', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({ username: 'testuser', full_name: 'Test' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('username, password, and full_name are required');
    });

    it('should return 400 when full_name is missing', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({ username: 'testuser', password: 'password123' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('username, password, and full_name are required');
    });

    it('should return 409 when username already exists', async () => {
      mockUsersService.createUser.mockRejectedValue(new Error('Username already exists'));

      const response = await request(app)
        .post('/api/users')
        .send(validUserDto)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Username already exists');
    });

    it('should return 400 for validation errors', async () => {
      mockUsersService.createUser.mockRejectedValue(
        new Error('Username must be between 3 and 50 characters')
      );

      const response = await request(app)
        .post('/api/users')
        .send({ ...validUserDto, username: 'ab' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('must be');
    });

    it('should handle general service errors', async () => {
      mockUsersService.createUser.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .post('/api/users')
        .send(validUserDto)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Error creating user');
    });
  });

  describe('PUT /api/users/:userId', () => {
    const updateDto = {
      full_name: 'Updated Name',
      is_active: false
    };

    it('should update user successfully', async () => {
      mockUsersService.updateUser.mockResolvedValue(undefined);

      const response = await request(app)
        .put('/api/users/5')
        .send(updateDto)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('User updated successfully');
      expect(mockUsersService.updateUser).toHaveBeenCalledWith(5, updateDto, 'admin');
    });

    it('should return 400 for invalid user ID', async () => {
      const response = await request(app)
        .put('/api/users/invalid')
        .send(updateDto)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid user ID');
      expect(mockUsersService.updateUser).not.toHaveBeenCalled();
    });

    it('should return 404 when user not found', async () => {
      mockUsersService.updateUser.mockRejectedValue(new Error('User not found'));

      const response = await request(app)
        .put('/api/users/999')
        .send(updateDto)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('User not found');
    });

    it('should return 400 for validation errors', async () => {
      mockUsersService.updateUser.mockRejectedValue(
        new Error('Password must be at least 8 characters')
      );

      const response = await request(app)
        .put('/api/users/1')
        .send({ password: 'short' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('must be');
    });

    it('should handle service errors', async () => {
      mockUsersService.updateUser.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .put('/api/users/1')
        .send(updateDto)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Error updating user');
    });
  });

  describe('DELETE /api/users/:userId', () => {
    it('should delete user successfully', async () => {
      mockUsersService.deleteUser.mockResolvedValue(undefined);

      const response = await request(app)
        .delete('/api/users/5')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('User deleted successfully');
      expect(mockUsersService.deleteUser).toHaveBeenCalledWith(5, 'admin');
    });

    it('should return 400 for invalid user ID', async () => {
      const response = await request(app)
        .delete('/api/users/invalid')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid user ID');
      expect(mockUsersService.deleteUser).not.toHaveBeenCalled();
    });

    it('should prevent self-deletion', async () => {
      const response = await request(app)
        .delete('/api/users/1')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Cannot delete your own account');
      expect(mockUsersService.deleteUser).not.toHaveBeenCalled();
    });

    it('should return 404 when user not found', async () => {
      mockUsersService.deleteUser.mockRejectedValue(new Error('User not found'));

      const response = await request(app)
        .delete('/api/users/999')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('User not found');
    });

    it('should handle service errors', async () => {
      mockUsersService.deleteUser.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .delete('/api/users/5')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Error deleting user');
    });
  });

  describe('POST /api/users/check-username', () => {
    it('should return username is available', async () => {
      mockUsersService.checkUsernameAvailability.mockResolvedValue(true);

      const response = await request(app)
        .post('/api/users/check-username')
        .send({ username: 'newuser' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.available).toBe(true);
      expect(mockUsersService.checkUsernameAvailability).toHaveBeenCalledWith('newuser', undefined);
    });

    it('should return username is not available', async () => {
      mockUsersService.checkUsernameAvailability.mockResolvedValue(false);

      const response = await request(app)
        .post('/api/users/check-username')
        .send({ username: 'existinguser' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.available).toBe(false);
    });

    it('should support excludeUserId parameter', async () => {
      mockUsersService.checkUsernameAvailability.mockResolvedValue(true);

      await request(app)
        .post('/api/users/check-username')
        .send({ username: 'testuser', excludeUserId: 5 })
        .expect(200);

      expect(mockUsersService.checkUsernameAvailability).toHaveBeenCalledWith('testuser', 5);
    });

    it('should handle service errors', async () => {
      mockUsersService.checkUsernameAvailability.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/api/users/check-username')
        .send({ username: 'testuser' })
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Error checking username');
    });
  });
});
