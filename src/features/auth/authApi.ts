import { http } from '../../shared/api/http';
import type { AuthResponse, AuthUser } from '../../shared/api/types';

export async function loginApi(userName: string, password: string): Promise<AuthResponse> {
  const { data } = await http.post<AuthResponse>('/api/auth/login', { userName, password });
  return data;
}

export async function fetchMeApi(): Promise<AuthUser> {
  const { data } = await http.get<AuthUser>('/api/auth/me');
  return data;
}

export async function fetchBalanceApi(): Promise<number> {
  const { data } = await http.get<{ balance: number }>('/api/credits/balance');
  return data.balance;
}

export async function changePasswordApi(payload: {
  userName: string;
  currentPassword: string;
  newPassword: string;
}): Promise<void> {
  await http.post('/api/auth/change-password', payload);
}

export async function logoutApi(): Promise<void> {
  await http.post('/api/auth/logout');
}
