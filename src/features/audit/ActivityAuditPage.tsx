import { DownloadOutlined, FileExcelOutlined, FilePdfOutlined } from '@ant-design/icons';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button, DatePicker, Input, Select, Space, Tag, Typography } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { useCallback, useState } from 'react';
import { searchUsers } from '../users/usersApi';
import { AsyncSelect } from '../../shared/ui/AsyncSelect';
import { DataTable } from '../../shared/ui/DataTable';
import { notify } from '../../shared/ui/notify';
import {
  ACTIVITY_TYPE_OPTIONS,
  ADMIN_ACTIVITY_TYPE_OPTIONS,
  exportActivityAudit,
  searchActivityAudit,
  type ActivityAuditItem,
  type ActivityType,
} from './auditApi';
import { useAuth } from '../auth/AuthContext';

function getErrorDetail(err: unknown) {
  return (
    (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
    'Request failed'
  );
}

export function ActivityAuditPage() {
  const { isSuperAdmin } = useAuth();
  const [userId, setUserId] = useState<string | undefined>();
  const [activityType, setActivityType] = useState<ActivityType | undefined>();
  const [success, setSuccess] = useState<boolean | undefined>();
  const [search, setSearch] = useState('');
  const [range, setRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const [page, setPage] = useState(1);

  const activityTypeOptions = isSuperAdmin ? ACTIVITY_TYPE_OPTIONS : ADMIN_ACTIVITY_TYPE_OPTIONS;

  const fetchUsers = useCallback(async (term: string) => {
    const data = await searchUsers(term, 1, 50);
    return data.items.map((item) => ({
      value: item.id,
      label: `${item.userName} (${item.companyName})`,
    }));
  }, []);

  const filterParams = {
    userId,
    activityType,
    from: range?.[0]?.startOf('day').toISOString(),
    to: range?.[1]?.endOf('day').toISOString(),
    search: search || undefined,
    success,
  };

  const query = useQuery({
    queryKey: ['activity-audit', filterParams, page],
    queryFn: () => searchActivityAudit({ ...filterParams, page, pageSize: 50 }),
  });

  const exportMutation = useMutation({
    mutationFn: (format: 'xlsx' | 'pdf') => exportActivityAudit(format, filterParams),
    onError: (err: unknown) => notify.error('Export', getErrorDetail(err)),
  });

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 12,
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <Typography.Title level={3} style={{ margin: 0 }}>
            Activity audit
          </Typography.Title>
          <Typography.Text type="secondary">
            {isSuperAdmin
              ? 'Explorer for logins, calculates, and other actions (page size 50).'
              : 'Login, logout, and calculate activity for users (excludes SuperAdmin).'}
          </Typography.Text>
        </div>
        <Space wrap>
          <Button
            icon={<FileExcelOutlined />}
            loading={exportMutation.isPending && exportMutation.variables === 'xlsx'}
            onClick={() => exportMutation.mutate('xlsx')}
          >
            Export Excel
          </Button>
          <Button
            icon={<FilePdfOutlined />}
            loading={exportMutation.isPending && exportMutation.variables === 'pdf'}
            onClick={() => exportMutation.mutate('pdf')}
          >
            Export PDF
          </Button>
        </Space>
      </div>

      <Space wrap size="middle" style={{ width: '100%' }}>
        <AsyncSelect
          style={{ minWidth: 240 }}
          placeholder="Filter by user"
          allowClear
          value={userId}
          fetchOptions={fetchUsers}
          onChange={(value) => {
            setUserId(value as string | undefined);
            setPage(1);
          }}
        />
        <Select
          allowClear
          placeholder="Activity type"
          style={{ minWidth: 180 }}
          options={activityTypeOptions}
          value={activityType}
          onChange={(value) => {
            setActivityType(value);
            setPage(1);
          }}
        />
        <Select
          allowClear
          placeholder="Success"
          style={{ minWidth: 120 }}
          value={success}
          options={[
            { value: true, label: 'Success' },
            { value: false, label: 'Failed' },
          ]}
          onChange={(value) => {
            setSuccess(value);
            setPage(1);
          }}
        />
        <DatePicker.RangePicker
          value={range}
          onChange={(value) => {
            setRange(value);
            setPage(1);
          }}
        />
        <Input.Search
          allowClear
          placeholder="Search user, company, IP"
          style={{ maxWidth: 260 }}
          onSearch={(value) => {
            setSearch(value.trim());
            setPage(1);
          }}
        />
      </Space>

      <DataTable<ActivityAuditItem>
        loading={query.isLoading}
        dataSource={query.data?.items ?? []}
        rowKey="id"
        page={page}
        pageSize={50}
        total={query.data?.total ?? 0}
        onPageChange={(next) => setPage(next)}
        scroll={{ x: 1400 }}
        columns={[
          {
            title: 'When',
            dataIndex: 'activityAt',
            width: 160,
            render: (value: string) => dayjs(value).format('YYYY-MM-DD HH:mm:ss'),
          },
          {
            title: 'Type',
            dataIndex: 'activityType',
            width: 140,
            render: (value: ActivityType) => <Tag>{value}</Tag>,
          },
          { title: 'User', dataIndex: 'userName', width: 120, render: (v?: string | null) => v ?? '—' },
          { title: 'Role', dataIndex: 'role', width: 110, render: (v?: string | null) => v ?? '—' },
          {
            title: 'Company',
            dataIndex: 'companyName',
            width: 140,
            render: (v?: string | null) => v ?? '—',
          },
          {
            title: 'OK',
            dataIndex: 'success',
            width: 80,
            render: (value: boolean) => (
              <Tag color={value ? 'green' : 'red'}>{value ? 'Yes' : 'No'}</Tag>
            ),
          },
          { title: 'IP', dataIndex: 'ipAddress', width: 120, render: (v?: string | null) => v ?? '—' },
          {
            title: 'Device',
            dataIndex: 'deviceInfo',
            width: 180,
            ellipsis: true,
            render: (v?: string | null) => v ?? '—',
          },
          {
            title: 'Location',
            dataIndex: 'locationInfo',
            width: 120,
            render: (v?: string | null) => v ?? '—',
          },
          {
            title: 'Failure',
            dataIndex: 'failureReason',
            width: 160,
            ellipsis: true,
            render: (v?: string | null) => v ?? '—',
          },
        ]}
      />

      <Typography.Text type="secondary">
        <DownloadOutlined /> Exports use the active filters above (all matching rows, not just this page).
      </Typography.Text>
    </Space>
  );
}
