import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { AuthUser } from '../../shared/api/types';
import { fetchMeApi, loginApi, logoutApi } from './authApi';
import { authStorage } from './authStorage';

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  login: (userName: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  isAdminOrAbove: boolean;
  isSuperAdmin: boolean;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(authStorage.getUser());
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    if (!authStorage.getAccessToken()) {
      setUser(null);
      return;
    }
    const me = await fetchMeApi();
    const refresh = authStorage.getRefreshToken() ?? '';
    const access = authStorage.getAccessToken() ?? '';
    authStorage.setSession(access, refresh, me);
    setUser(me);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        if (authStorage.getAccessToken()) {
          await refreshUser();
        }
      } catch {
        authStorage.clear();
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [refreshUser]);

  const login = useCallback(async (userName: string, password: string) => {
    const result = await loginApi(userName, password);
    authStorage.setSession(result.accessToken, result.refreshToken, result.user);
    setUser(result.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      if (authStorage.getAccessToken()) {
        await logoutApi();
      }
    } catch {
      /* still clear local session */
    } finally {
      authStorage.clear();
      setUser(null);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      login,
      logout,
      refreshUser,
      isAdminOrAbove: user?.role === 'SuperAdmin' || user?.role === 'Admin',
      isSuperAdmin: user?.role === 'SuperAdmin',
    }),
    [user, loading, login, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
