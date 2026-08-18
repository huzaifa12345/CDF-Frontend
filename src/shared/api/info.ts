import { http } from './http';

export type ApiInfo = {
  application: string;
  brand: string;
  environment: string;
};

export async function fetchApiInfo(): Promise<ApiInfo> {
  const { data } = await http.get<ApiInfo>('/api/info');
  return data;
}

export async function fetchHealth(): Promise<unknown> {
  const { data } = await http.get('/health');
  return data;
}
