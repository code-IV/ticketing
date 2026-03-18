'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/types';
import { authService } from '@/services/authService';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    password: string;
  }) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const response = await authService.getMe();
      if (response.data) {
        // Handle the roles array structure from backend
        const user = response.data.user;
        if (user.roles && Array.isArray(user.roles) && user.roles.length > 0) {
          // Convert roles array of objects to array of strings
          user.roles = user.roles.map((role: any) => role.name || role);
        }
        setUser(user);
      }
    } catch (error) {
      setUser(null);
    }
  };

  useEffect(() => {
    refreshUser().finally(() => setLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    const response = await authService.login(email, password);
    if (response.data) {
      // Handle the roles array structure from backend
      const user = response.data.user;
      if (user.roles && Array.isArray(user.roles) && user.roles.length > 0) {
        // Convert roles array of objects to array of strings
        user.roles = user.roles.map((role: any) => role.name || role);
      }
      setUser(user);
    }
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  const register = async (data: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    password: string;
  }) => {
    const response = await authService.register(data);
    if (response.data) {
      // Handle the roles array structure from backend
      const user = response.data.user;
      if (user.roles && Array.isArray(user.roles) && user.roles.length > 0) {
        // Convert roles array of objects to array of strings
        user.roles = user.roles.map((role: any) => role.name || role);
      }
      setUser(user);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
