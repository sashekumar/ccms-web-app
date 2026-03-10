import { User, Role, Permission } from '../types';

/**
 * API Helper - Direct API calls for test setup
 * 
 * Following coding-standards.md principles:
 * - REUSABILITY: API calls used across all tests
 * - COMMONIZATION: Centralized API interactions
 * - DRY: No duplicate API code in tests
 * 
 * Use API calls to set up test state quickly without going through UI.
 * This makes tests much faster.
 */

export class ApiHelper {
  private static readonly apiUrl = process.env.API_URL || 'http://localhost:3000';
  private static authToken: string | null = null;

  /**
   * Set authentication token
   * @param token - JWT token
   */
  static setAuthToken(token: string): void {
    this.authToken = token;
  }

  /**
   * Clear authentication token
   */
  static clearAuthToken(): void {
    this.authToken = null;
  }

  /**
   * Login and get authentication token
   * @param username - Username
   * @param password - User password
   */
  static async login(username: string, password: string): Promise<string> {
    const response = await fetch(`${this.apiUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      throw new Error(`Login failed: ${response.statusText}`);
    }

    const data = await response.json();
    this.authToken = data.data.token;
    return this.authToken!;
  }

  /**
   * Make authenticated GET request
   * @param endpoint - API endpoint (e.g., '/users')
   */
  static async get<T = any>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.apiUrl}/api${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(this.authToken && { 'Authorization': `Bearer ${this.authToken}` }),
      },
    });

    if (!response.ok) {
      throw new Error(`GET ${endpoint} failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data;
  }

  /**
   * Make authenticated POST request
   * @param endpoint - API endpoint
   * @param body - Request body
   */
  static async post<T = any>(endpoint: string, body: any): Promise<T> {
    const response = await fetch(`${this.apiUrl}/api${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.authToken && { 'Authorization': `Bearer ${this.authToken}` }),
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(`POST ${endpoint} failed: ${errorData?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.data;
  }

  /**
   * Make authenticated PUT request
   * @param endpoint - API endpoint
   * @param body - Request body
   */
  static async put<T = any>(endpoint: string, body: any): Promise<T> {
    const response = await fetch(`${this.apiUrl}/api${endpoint}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(this.authToken && { 'Authorization': `Bearer ${this.authToken}` }),
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(`PUT ${endpoint} failed: ${errorData?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.data;
  }

  /**
   * Make authenticated DELETE request
   * @param endpoint - API endpoint
   */
  static async delete<T = any>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.apiUrl}/api${endpoint}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(this.authToken && { 'Authorization': `Bearer ${this.authToken}` }),
      },
    });

    if (!response.ok) {
      throw new Error(`DELETE ${endpoint} failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data;
  }

  // ========== User Management API ==========

  /**
   * Get all users
   */
  static async getUsers(): Promise<User[]> {
    return await this.get<User[]>('/users');
  }

  /**
   * Get user by ID
   * @param userId - User ID
   */
  static async getUserById(userId: number): Promise<User> {
    return await this.get<User>(`/users/${userId}`);
  }

  /**
   * Create user via API
   * @param userData - User data
   */
  static async createUser(userData: {
    email: string;
    username: string;
    password: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
  }): Promise<User> {
    return await this.post<User>('/users', userData);
  }

  /**
   * Update user via API
   * @param userId - User ID
   * @param userData - User data
   */
  static async updateUser(userId: number, userData: Partial<User>): Promise<User> {
    return await this.put<User>(`/users/${userId}`, userData);
  }

  /**
   * Delete user via API
   * @param userId - User ID
   */
  static async deleteUser(userId: number): Promise<void> {
    return await this.delete(`/users/${userId}`);
  }

  // ========== Role Management API ==========

  /**
   * Get all roles
   */
  static async getRoles(): Promise<Role[]> {
    return await this.get<Role[]>('/roles');
  }

  /**
   * Get role by ID
   * @param roleId - Role ID
   */
  static async getRoleById(roleId: number): Promise<Role> {
    return await this.get<Role>(`/roles/${roleId}`);
  }

  /**
   * Create role via API
   * @param roleData - Role data
   */
  static async createRole(roleData: {
    roleName: string;
    roleCode: string;
    description?: string;
  }): Promise<Role> {
    return await this.post<Role>('/roles', roleData);
  }

  /**
   * Update role via API
   * @param roleId - Role ID
   * @param roleData - Role data
   */
  static async updateRole(roleId: number, roleData: Partial<Role>): Promise<Role> {
    return await this.put<Role>(`/roles/${roleId}`, roleData);
  }

  /**
   * Delete role via API
   * @param roleId - Role ID
   */
  static async deleteRole(roleId: number): Promise<void> {
    return await this.delete(`/roles/${roleId}`);
  }

  /**
   * Assign role to user
   * @param userId - User ID
   * @param roleId - Role ID
   */
  static async assignRoleToUser(userId: number, roleId: number): Promise<void> {
    await this.post(`/users/${userId}/roles`, { roleId });
  }

  /**
   * Remove role from user
   * @param userId - User ID
   * @param roleId - Role ID
   */
  static async removeRoleFromUser(userId: number, roleId: number): Promise<void> {
    await this.delete(`/users/${userId}/roles/${roleId}`);
  }

  // ========== Permission Management API ==========

  /**
   * Get user permissions
   * @param userId - User ID
   */
  static async getUserPermissions(userId: number): Promise<Permission[]> {
    return await this.get<Permission[]>(`/permissions/user/${userId}`);
  }

  /**
   * Get role permissions
   * @param roleId - Role ID
   */
  static async getRolePermissions(roleId: number): Promise<Permission[]> {
    return await this.get<Permission[]>(`/permissions/role/${roleId}`);
  }

  /**
   * Grant permission to role
   * @param roleId - Role ID
   * @param moduleActionId - Module Action ID
   */
  static async grantPermission(roleId: number, moduleActionId: number): Promise<void> {
    await this.post('/permissions/grant', { roleId, moduleActionId });
  }

  /**
   * Revoke permission from role
   * @param roleId - Role ID
   * @param moduleActionId - Module Action ID
   */
  static async revokePermission(roleId: number, moduleActionId: number): Promise<void> {
    await this.post('/permissions/revoke', { roleId, moduleActionId });
  }

  // ========== Test Helpers ==========

  /**
   * Create test user with specific role
   * @param userData - User data
   * @param roleCode - Role code
   */
  static async createTestUserWithRole(
    userData: {
      email: string;
      username: string;
      password: string;
      firstName: string;
      lastName: string;
      phoneNumber?: string;
    },
    roleCode: string
  ): Promise<User> {
    // Create user
    const user = await this.createUser(userData);

    // Get role by code
    const roles = await this.getRoles();
    const role = roles.find(r => r.role_code === roleCode);

    if (role) {
      // Assign role to user
      await this.assignRoleToUser(user.user_id, role.role_id);
    }

    return user;
  }

  /**
   * Delete test user by email
   * @param email - User email
   */
  static async deleteTestUserByEmail(email: string): Promise<void> {
    try {
      const users = await this.getUsers();
      const user = users.find(u => u.email === email);
      if (user) {
        await this.deleteUser(user.user_id);
      }
    } catch (error) {
      // Ignore if user doesn't exist
      console.warn(`Could not delete test user: ${email}`);
    }
  }

  /**
   * Health check - verify API is running
   */
  static async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiUrl}/health`);
      return response.ok;
    } catch {
      return false;
    }
  }
}
