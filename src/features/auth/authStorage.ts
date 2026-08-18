import type { AuthUser } from '../../shared/api/types';

const ACCESS_KEY = 'cdf_access_token';
const REFRESH_KEY = 'cdf_refresh_token';
const USER_KEY = 'cdf_user';

export const authStorage = {
  getAccessToken() {
    return localStorage.getItem(ACCESS_KEY);
  },
  getRefreshToken() {
    return localStorage.getItem(REFRESH_KEY);
  },
  getUser(): AuthUser | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  },
  setSession(accessToken: string, refreshToken: string, user: AuthUser) {
    localStorage.setItem(ACCESS_KEY, accessToken);
    localStorage.setItem(REFRESH_KEY, refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  clear() {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
  },
};
