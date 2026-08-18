import { http } from '../../shared/api/http';
import type { PagedResult, Product, RawMaterial } from '../../shared/api/types';

export type CalculationType = 'Ad' | 'Alkali' | 'Salt' | 'Moisture' | 'Insoluble' | 'Complete';
export type QuantityUom = 'Kg' | 'G' | 'Litre' | 'Ml';

export type CalculateMaterialLineRequest = {
  rawMaterialId: string;
  quantity: number;
  uom: QuantityUom;
  adPercent: number;
  alkaliPercent: number;
  saltPercent: number;
  moisturePercent: number;
  insolublePercent: number;
};

export type CalculateRequest = {
  productId: string;
  calculationType: CalculationType;
  materials: CalculateMaterialLineRequest[];
};

export type CalculationMaterialLine = {
  rawMaterialId: string;
  materialName: string;
  adPercent?: number | null;
  alkaliPercent?: number | null;
  saltPercent?: number | null;
  moisturePercent?: number | null;
  insolublePercent?: number | null;
  quantity: number;
  uom: QuantityUom;
  quantityKg: number;
  recipePercent: number;
};

export type CalculationAudit = {
  sessionId?: string | null;
  ipAddress?: string | null;
  deviceInfo?: string | null;
  locationInfo?: string | null;
  calculatedAt: string;
};

export type CalculationResult = {
  reportId: string;
  calculatedAt: string;
  productName: string;
  productCategory: string;
  calculationType: CalculationType;
  userName: string;
  companyName: string;
  totalQuantityKg: number;
  finalAdPercent?: number | null;
  finalAlkaliPercent?: number | null;
  finalSaltPercent?: number | null;
  finalMoisturePercent?: number | null;
  finalInsolublePercent?: number | null;
  creditsCharged: number;
  materials: CalculationMaterialLine[];
  audit?: CalculationAudit | null;
};

export async function searchCalculatorProducts(search: string, page = 1, pageSize = 50) {
  const { data } = await http.get<PagedResult<Product>>('/api/calculator/products', {
    params: { search, page, pageSize },
  });
  return data;
}

export async function searchCalculatorMaterials(search: string, page = 1, pageSize = 50) {
  const { data } = await http.get<PagedResult<RawMaterial>>('/api/calculator/materials', {
    params: { search, page, pageSize },
  });
  return data;
}

export async function calculateFormula(payload: CalculateRequest) {
  const { data } = await http.post<CalculationResult>('/api/calculator/calculate', payload);
  return data;
}

export async function downloadReportPdf(reportId: string) {
  const { data } = await http.get<Blob>(`/api/calculator/reports/${reportId}/pdf`, {
    responseType: 'blob',
  });
  return data;
}

export type CalculatorReportListItem = {
  reportId: string;
  calculatedAt: string;
  productId: string;
  productName: string;
  productCategory: string;
  calculationType: CalculationType;
  userName: string;
  companyName: string;
  totalQuantityKg: number;
  creditsCharged: number;
};

export type CalculatorDashboard = {
  successfulCalculatesThisMonth: number;
  creditsSpentThisMonth: number;
  recentReports: CalculatorReportListItem[];
};

export async function fetchCalculatorDashboard() {
  const { data } = await http.get<CalculatorDashboard>('/api/calculator/dashboard');
  return data;
}

export async function searchCalculatorReports(params: {
  productId?: string;
  userId?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}) {
  const { data } = await http.get<PagedResult<CalculatorReportListItem>>('/api/calculator/reports', {
    params: {
      productId: params.productId,
      userId: params.userId,
      from: params.from,
      to: params.to,
      page: params.page ?? 1,
      pageSize: params.pageSize ?? 25,
    },
  });
  return data;
}
