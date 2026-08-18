export type UserRole = 'SuperAdmin' | 'Admin' | 'User';
export type UserStatus = 'Active' | 'Inactive';
export type ActivationStatus = 'Active' | 'Inactive';

export type AuthUser = {
  id: string;
  userName: string;
  companyName: string;
  role: UserRole;
  status: UserStatus;
  creditBalance: number;
};

export type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
};

export type PagedResult<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
};

export type UserListItem = {
  id: string;
  userName: string;
  companyName: string;
  role: UserRole;
  status: UserStatus;
  creditBalance: number;
  createdAt: string;
};

export type Product = {
  id: string;
  name: string;
  category: string;
  status: ActivationStatus;
  createdAt: string;
  updatedAt?: string | null;
};

export type RawMaterial = {
  id: string;
  name: string;
  adPercent?: number | null;
  alkaliPercent?: number | null;
  saltPercent?: number | null;
  moisturePercent?: number | null;
  insolublePercent?: number | null;
  status: ActivationStatus;
  createdAt: string;
  updatedAt?: string | null;
};
