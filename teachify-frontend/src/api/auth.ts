// src/api/auth.ts
import http, { tokenManager } from './http';

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  company?: string;
}

export interface LoginData {
  username: string;
  password: string;
}

export interface UserProfile {
  username: string;
  email: string;
  company: string;
  avatar_url?: string | null;
  created_at: string;
}

export interface UpdateProfilePayload {
  email?: string;
  company?: string;
}

export interface DeleteAccountPayload {
  password: string;
  confirm: string; // must be "DELETE"
}

export const authApi = {
  register: async (data: RegisterData) => {
    const response = await http.post('/auth/register', data);
    return response.data;
  },

  login: async (data: LoginData) => {
    // OAuth2 password flow requires form-urlencoded
    const formData = new URLSearchParams();
    formData.append('username', data.username);
    formData.append('password', data.password);

    const response = await http.post('/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const { access_token, refresh_token } = response.data;
    tokenManager.setTokens(access_token, refresh_token);

    return response.data;
  },

  logout: async () => {
    const refreshToken = tokenManager.getRefreshToken();
    if (refreshToken) {
      try {
        await http.post('/auth/logout', { refresh_token: refreshToken });
      } catch (error) {
        // Best effort - always clear tokens locally
        console.error('Logout error:', error);
      }
    }
    tokenManager.clearTokens();
  },

  getProfile: async (): Promise<UserProfile> => {
    const response = await http.get('/auth/profile');
    return response.data;
  },

  updateProfile: async (payload: UpdateProfilePayload): Promise<UserProfile> => {
    const response = await http.patch('/auth/profile', payload);
    return response.data;
  },

  uploadAvatar: async (file: File): Promise<{ avatar_url: string }> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await http.post('/auth/profile/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },

  deleteAvatar: async (): Promise<void> => {
    await http.delete('/auth/profile/avatar');
  },

  deleteAccount: async (payload: DeleteAccountPayload): Promise<void> => {
    await http.delete('/auth/account', { data: payload });
    // Local token clean-up; caller should also call logout()
    tokenManager.clearTokens();
  },

  checkAuth: async (): Promise<boolean> => {
    try {
      await authApi.getProfile();
      return true;
    } catch {
      return false;
    }
  },
};
