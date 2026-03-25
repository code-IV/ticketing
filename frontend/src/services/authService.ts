import { api } from '@/lib/api';
import { User, ApiResponse } from '@/types';

export const authService = {
  async register(data: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    password: string;
  }): Promise<ApiResponse<{ user: User }>> {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  async login(email: string, password: string): Promise<ApiResponse<{ user: User }>> {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  async logout(): Promise<ApiResponse> {
    const response = await api.post('/auth/logout');
    return response.data;
  },

  async getMe(): Promise<ApiResponse<{ user: User }>> {
    const response = await api.get('/auth/me');
    return response.data;
  },

  async updateProfile(data: {
    firstName?: string;
    lastName?: string;
    phone?: string;
  }): Promise<ApiResponse<{ user: User }>> {
    const response = await api.put('/auth/profile', data);
    return response.data;
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<ApiResponse> {
    const response = await api.put('/auth/change-password', {
      currentPassword,
      newPassword,
    });
    return response.data;
  },
};
