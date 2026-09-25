import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserProfile, UserRole } from '../types/auth';
import { api } from '../services/api';

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<UserProfile>;
  logout: () => void;
  hasRole: (...roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const existingToken = api.getToken();
    if (existingToken) {
      setToken(existingToken);
      api
        .getProfile()
        .then((res) => {
          if (res && res.user) {
            setUser(res.user);
          } else {
            api.logout();
            setUser(null);
            setToken(null);
          }
        })
        .catch(() => {
          // Token expirado ou offline
          const cachedUser = localStorage.getItem('fluencia_user_cache');
          if (cachedUser) {
            try {
              setUser(JSON.parse(cachedUser));
            } catch {}
          }
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, pass: string): Promise<UserProfile> => {
    const res = await api.login({ email, password: pass });
    setUser(res.user);
    setToken(res.token);
    localStorage.setItem('fluencia_user_cache', JSON.stringify(res.user));
    return res.user;
  };

  const logout = () => {
    api.logout();
    setUser(null);
    setToken(null);
    localStorage.removeItem('fluencia_user_cache');
  };

  const hasRole = (...roles: UserRole[]): boolean => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        hasRole
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider');
  }
  return context;
}
