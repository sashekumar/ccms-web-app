export interface User {
  user_id: number;
  legacy_user_id: string | null;
  username: string;
  password_hash: string;
  full_name: string;
  is_active: boolean;
  last_login: Date | null;
  created_at: Date;
  created_by: string | null;
  updated_at: Date | null;
  updated_by: string | null;
}

export interface UserListItem {
  user_id: number;
  username: string;
  full_name: string;
  is_active: boolean;
  last_login: Date | null;
  roles: {
    role_id: number;
    role_name: string;
    role_code: string;
  }[];
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
  isActive?: boolean;
  roleId?: number;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface PaginatedUsers {
  users: UserListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UserDetailResponse {
  user: {
    user_id: number;
    username: string;
    full_name: string;
    is_active: boolean;
    last_login: Date | null;
  };
  roles: {
    role_id: number;
    role_name: string;
    role_code: string;
    assigned_at: Date;
    assigned_by: string;
    expires_at: Date | null;
  }[];
}
