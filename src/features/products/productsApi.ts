import { http } from '../../shared/api/http';
import type { ActivationStatus, PagedResult, Product } from '../../shared/api/types';

export type ProductPayload = {
  name: string;
  category: string;
  status: ActivationStatus;
};

export async function searchProducts(search: string, page: number, pageSize = 50) {
  const { data } = await http.get<PagedResult<Product>>('/api/products', {
    params: { search, page, pageSize },
  });
  return data;
}

export async function createProduct(payload: ProductPayload) {
  const { data } = await http.post<Product>('/api/products', payload);
  return data;
}

export async function updateProduct(id: string, payload: ProductPayload) {
  const { data } = await http.put<Product>(`/api/products/${id}`, payload);
  return data;
}
