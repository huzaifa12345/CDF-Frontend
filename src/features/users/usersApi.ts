import { http } from '../../shared/api/http';
import type { PagedResult, UserListItem, UserRole, UserStatus } from '../../shared/api/types';

export type CreateUserPayload = {
  userName: string;
  password: string;
  companyName: string;
  role: UserRole;
  status: UserStatus;
};

export type UpdateUserPayload = {
  companyName: string;
  role: UserRole;
  status: UserStatus;
  newPassword?: string;
};

export async function searchUsers(search: string, page: number, pageSize = 50) {
  const { data } = await http.get<PagedResult<UserListItem>>('/api/users', {
    params: { search, page, pageSize },
  });
  return data;
}

export async function createUser(payload: CreateUserPayload) {
  const { data } = await http.post<UserListItem>('/api/users', payload);
  return data;
}

export async function updateUser(id: string, payload: UpdateUserPayload) {
  const { data } = await http.put<UserListItem>(`/api/users/${id}`, payload);
  return data;
}
