import { downloadBlob } from '../../shared/api/download';
import { http } from '../../shared/api/http';
import type { PagedResult, UserRole } from '../../shared/api/types';

export type ActivityType =
  | 'Login'
  | 'Logout'
  | 'Calculate'
  | 'CreditRequest'
  | 'CreditApprove'
  | 'CreditReject'
  | 'ManualCreditAdjust'
  | 'UserCreate'
  | 'UserUpdate'
  | 'PasswordChange'
  | 'ProductSave'
  | 'MaterialSave';

export type ActivityAuditItem = {
  id: string;
  activityType: ActivityType;
  activityAt: string;
  userId?: string | null;
  userName?: string | null;
  role?: UserRole | null;
  companyName?: string | null;
  ipAddress?: string | null;
  deviceInfo?: string | null;
  locationInfo?: string | null;
  sessionId?: string | null;
  success: boolean;
  failureReason?: string | null;
  entityType?: string | null;
  entityId?: string | null;
};

export const ACTIVITY_TYPE_OPTIONS: { value: ActivityType; label: string }[] = [
  { value: 'Login', label: 'Login' },
  { value: 'Logout', label: 'Logout' },
  { value: 'Calculate', label: 'Calculate' },
  { value: 'CreditRequest', label: 'Credit request' },
  { value: 'CreditApprove', label: 'Credit approve' },
  { value: 'CreditReject', label: 'Credit reject' },
  { value: 'ManualCreditAdjust', label: 'Manual adjust' },
  { value: 'UserCreate', label: 'User create' },
  { value: 'UserUpdate', label: 'User update' },
  { value: 'PasswordChange', label: 'Password change' },
  { value: 'ProductSave', label: 'Product save' },
  { value: 'MaterialSave', label: 'Material save' },
];

export const ADMIN_ACTIVITY_TYPE_OPTIONS = ACTIVITY_TYPE_OPTIONS.filter((option) =>
  ['Login', 'Logout', 'Calculate'].includes(option.value),
);
export async function searchActivityAudit(params: {
  userId?: string;
  activityType?: ActivityType;
  from?: string;
  to?: string;
  search?: string;
  success?: boolean;
  page: number;
  pageSize?: number;
}) {
  const { data } = await http.get<PagedResult<ActivityAuditItem>>('/api/audit', {
    params: {
      userId: params.userId,
      activityType: params.activityType,
      from: params.from,
      to: params.to,
      search: params.search,
      success: params.success,
      page: params.page,
      pageSize: params.pageSize ?? 50,
    },
  });
  return data;
}

export async function exportActivityAudit(
  format: 'xlsx' | 'pdf',
  params: {
    userId?: string;
    activityType?: ActivityType;
    from?: string;
    to?: string;
    search?: string;
    success?: boolean;
  },
) {
  await downloadBlob('/api/audit/export', { format, ...params });
}
