import { http } from '../../shared/api/http';
import type { ActivationStatus, PagedResult, RawMaterial } from '../../shared/api/types';

export type RawMaterialPayload = {
  name: string;
  adPercent?: number | null;
  alkaliPercent?: number | null;
  saltPercent?: number | null;
  moisturePercent?: number | null;
  insolublePercent?: number | null;
  status: ActivationStatus;
};

export async function searchRawMaterials(search: string, page: number, pageSize = 50) {
  const { data } = await http.get<PagedResult<RawMaterial>>('/api/raw-materials', {
    params: { search, page, pageSize },
  });
  return data;
}

export async function createRawMaterial(payload: RawMaterialPayload) {
  const { data } = await http.post<RawMaterial>('/api/raw-materials', payload);
  return data;
}

export async function updateRawMaterial(id: string, payload: RawMaterialPayload) {
  const { data } = await http.put<RawMaterial>(`/api/raw-materials/${id}`, payload);
  return data;
}
