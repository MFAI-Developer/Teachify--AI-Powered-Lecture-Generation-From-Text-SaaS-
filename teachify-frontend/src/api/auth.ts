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
  company: string;
  created_at: string;
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

  checkAuth: async (): Promise<boolean> => {
    try {
      await authApi.getProfile();
      return true;
    } catch {
      return false;
    }
  },
};
