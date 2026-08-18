import axios from 'axios';
import { env } from '../config/env';
import { authStorage } from '../../features/auth/authStorage';

export const http = axios.create({
  baseURL: env.apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

http.interceptors.request.use((config) => {
  const token = authStorage.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  return config;
});

http.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config as typeof error.config & { _retry?: boolean };
    if (error.response?.status === 401 && original && !original._retry) {
      original._retry = true;
      const refreshToken = authStorage.getRefreshToken();
      if (refreshToken && !String(original.url ?? '').includes('/api/auth/login')) {
        try {
          const { data } = await axios.post(`${env.apiBaseUrl}/api/auth/refresh`, {
            refreshToken,
          });
          authStorage.setSession(data.accessToken, data.refreshToken, data.user);
          original.headers = original.headers ?? {};
          original.headers.Authorization = `Bearer ${data.accessToken}`;
          return http(original);
        } catch {
          authStorage.clear();
        }
      }
    }
    return Promise.reject(error);
  },
);
