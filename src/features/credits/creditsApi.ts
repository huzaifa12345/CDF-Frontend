import { downloadBlob } from '../../shared/api/download';
import { http } from '../../shared/api/http';
import { env } from '../../shared/config/env';
import type { PagedResult } from '../../shared/api/types';

export type CreditLedgerEntryType = 'Consume' | 'TopUpApproved' | 'ManualAdjust' | 'Welcome';
export type CreditTopUpStatus = 'Pending' | 'Approved' | 'Rejected';

export type CreditBalance = {
  userId: string;
  userName: string;
  balance: number;
};

export type CreditLedgerItem = {
  id: string;
  userId: string;
  userName: string;
  entryType: CreditLedgerEntryType;
  changeAmount: number;
  balanceAfter: number;
  description: string;
  entityType?: string | null;
  entityId?: string | null;
  occurredAt: string;
};

export type CreditReceiveAccount = {
  accountNumber: string;
  bankName: string;
  accountTitle: string;
  userEtaHours: number;
};

export type CreditTopUpRequest = {
  id: string;
  userId: string;
  userName: string;
  companyName: string;
  status: CreditTopUpStatus;
  storageProvider: 'Local' | 'Cloudinary';
  fileUrl: string;
  originalFileName: string;
  requestedAt: string;
  ipAddress?: string | null;
  deviceInfo?: string | null;
  locationInfo?: string | null;
  reviewedByUserId?: string | null;
  reviewedByUserName?: string | null;
  reviewedAt?: string | null;
  approvedCredits?: number | null;
  rejectionReason?: string | null;
};

export type SubmitTopUpResult = {
  requestId: string;
  userEtaHours: number;
  message: string;
};

export function resolveProofUrl(fileUrl: string) {
  if (!fileUrl) return fileUrl;
  if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
    return fileUrl;
  }
  return `${env.apiBaseUrl}${fileUrl.startsWith('/') ? '' : '/'}${fileUrl}`;
}

export async function fetchCreditBalance(userId?: string) {
  const { data } = await http.get<CreditBalance>('/api/credits/balance', {
    params: { userId },
  });
  return data;
}

export async function searchCreditLedger(params: {
  userId?: string;
  entryType?: CreditLedgerEntryType;
  from?: string;
  to?: string;
  page: number;
  pageSize?: number;
}) {
  const { data } = await http.get<PagedResult<CreditLedgerItem>>('/api/credits/ledger', {
    params: {
      userId: params.userId,
      entryType: params.entryType,
      from: params.from,
      to: params.to,
      page: params.page,
      pageSize: params.pageSize ?? 50,
    },
  });
  return data;
}

export async function fetchReceiveAccount() {
  const { data } = await http.get<CreditReceiveAccount>('/api/credits/receive-account');
  return data;
}

export async function submitTopUp(screenshot: File) {
  const form = new FormData();
  form.append('screenshot', screenshot);
  const { data } = await http.post<SubmitTopUpResult>('/api/credits/top-up', form);
  return data;
}

export async function searchTopUpRequests(params: {
  status?: CreditTopUpStatus;
  search?: string;
  page: number;
  pageSize?: number;
}) {
  const { data } = await http.get<PagedResult<CreditTopUpRequest>>('/api/credits/top-up-requests', {
    params: {
      status: params.status,
      search: params.search,
      page: params.page,
      pageSize: params.pageSize ?? 50,
    },
  });
  return data;
}

export async function approveTopUp(id: string, credits: number) {
  const { data } = await http.post<CreditTopUpRequest>(`/api/credits/top-up-requests/${id}/approve`, {
    credits,
  });
  return data;
}

export async function rejectTopUp(id: string, reason: string) {
  const { data } = await http.post<CreditTopUpRequest>(`/api/credits/top-up-requests/${id}/reject`, {
    reason,
  });
  return data;
}

export async function manualAdjustCredits(payload: {
  userId: string;
  amount: number;
  reason: string;
}) {
  await http.post('/api/credits/manual-adjust', payload);
}

export async function exportCreditLedger(
  format: 'xlsx' | 'pdf',
  params: {
    userId?: string;
    entryType?: CreditLedgerEntryType;
    from?: string;
    to?: string;
  },
) {
  await downloadBlob('/api/credits/ledger/export', { format, ...params });
}
