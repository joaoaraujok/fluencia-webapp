export type UserRole = 'SUPERADMIN' | 'ADMIN' | 'SUPERVISOR';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
  schoolId?: string | null;
  school?: { id: string; name: string; city?: string; state?: string } | null;
  lastLoginAt?: string | null;
}

export interface AuthState {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
}
