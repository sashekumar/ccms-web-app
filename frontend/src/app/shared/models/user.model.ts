/**
 * User-related models and interfaces
 */

export interface User {
  user_id: number;
  username: string;
  full_name: string;
  is_active: boolean;
  last_login: Date | null;
  roles: UserRole[];
}

export interface UserRole {
  role_id: number;
  role_name: string;
  role_code: string;
}

export interface UserDetailRole {
  role_id: number;
  role_name: string;
  role_code: string;
  assigned_at: Date;
  assigned_by: string;
  expires_at: string | null;
}

export interface UserDetail {
  user: {
    user_id: number;
    username: string;
    full_name: string;
    is_active: boolean;
    last_login: Date | null;
  };
  roles: UserDetailRole[];
}

export interface CreateUserDto {
  username: string;
  password: string;
  full_name: string;
  is_active?: boolean;
}

export interface UpdateUserDto {
  full_name?: string;
  is_active?: boolean;
  password?: string;
}

export interface UserFilters {
  search?: string;
  is_active?: boolean;
  role_id?: number;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'ASC' | 'DESC';
}

export interface PaginatedUsers {
  users: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
