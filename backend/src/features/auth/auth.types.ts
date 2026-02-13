export interface User {
  user_id: number;
  username: string;
  password_hash: string;
  full_name: string;
  role_id: number;
  permissions_json: string;
  is_active: boolean;
  last_login: Date | null;
}

export interface LoginDto {
  username: string;
  password: string;
}

export interface TokenPayload {
  userId: number;
  username: string;
  roleId: number;
  tokenType: 'access' | 'refresh';
  iat?: number;
  exp?: number;
}

export interface LoginResponse {
  user: {
    userId: number;
    username: string;
    fullName: string;
    roleId: number;
    permissions: any;
  };
  message: string;
}
