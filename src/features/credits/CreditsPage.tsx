import { FileExcelOutlined, FilePdfOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, DatePicker, Form, Input, InputNumber, Modal, Select, Space, Tag, Typography } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { useCallback, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { searchUsers } from '../users/usersApi';
import { AsyncSelect } from '../../shared/ui/AsyncSelect';
import { DataTable } from '../../shared/ui/DataTable';
import { notify } from '../../shared/ui/notify';
import {
  exportCreditLedger,
  fetchCreditBalance,
  manualAdjustCredits,
  searchCreditLedger,
  type CreditLedgerEntryType,
  type CreditLedgerItem,
} from './creditsApi';

const ENTRY_OPTIONS: { value: CreditLedgerEntryType; label: string }[] = [
  { value: 'Consume', label: 'Consume' },
  { value: 'TopUpApproved', label: 'Top-up approved' },
  { value: 'ManualAdjust', label: 'Manual adjust' },
  { value: 'Welcome', label: 'Welcome' },
];

function getErrorDetail(err: unknown) {
  return (
    (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
    'Request failed'
  );
}

export function CreditsPage() {
  const { user, isAdminOrAbove, isSuperAdmin, refreshUser } = useAuth();
  const queryClient = useQueryClient();
  const [selectedUserId, setSelectedUserId] = useState<string | undefined>();
  const [entryType, setEntryType] = useState<CreditLedgerEntryType | undefined>();
  const [range, setRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const [page, setPage] = useState(1);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [adjustForm] = Form.useForm<{ userId: string; amount: number; reason: string }>();

  const targetUserId = isAdminOrAbove ? selectedUserId : undefined;

  const fetchUsers = useCallback(async (search: string) => {
    const data = await searchUsers(search, 1, 50);
    return data.items.map((item) => ({
      value: item.id,
      label: `${item.userName} (${item.companyName})`,
    }));
  }, []);

  const balanceQuery = useQuery({
    queryKey: ['credits-balance', targetUserId ?? user?.id],
    queryFn: () => fetchCreditBalance(targetUserId),
    enabled: !!user,
  });

  const ledgerQuery = useQuery({
    queryKey: [
      'credits-ledger',
      targetUserId ?? user?.id,
      entryType,
      range?.[0]?.toISOString(),
      range?.[1]?.toISOString(),
      page,
    ],
    queryFn: () =>
      searchCreditLedger({
        userId: targetUserId,
        entryType,
        from: range?.[0]?.startOf('day').toISOString(),
        to: range?.[1]?.endOf('day').toISOString(),
        page,
        pageSize: 50,
      }),
    enabled: !!user,
  });

  const adjustMutation = useMutation({
    mutationFn: manualAdjustCredits,
    onSuccess: async () => {
      notify.success('Credits adjusted');
      setAdjustOpen(false);
      adjustForm.resetFields();
      queryClient.invalidateQueries({ queryKey: ['credits-ledger'] });
      queryClient.invalidateQueries({ queryKey: ['credits-balance'] });
      try {
        await refreshUser();
      } catch {
        /* ignore */
      }
    },
    onError: (err: unknown) => notify.error('Manual adjust', getErrorDetail(err)),
  });

  const exportFilters = {
    userId: targetUserId,
    entryType,
    from: range?.[0]?.startOf('day').toISOString(),
    to: range?.[1]?.endOf('day').toISOString(),
  };

  const exportMutation = useMutation({
    mutationFn: (format: 'xlsx' | 'pdf') => exportCreditLedger(format, exportFilters),
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
            Credits
          </Typography.Title>
          <Typography.Text type="secondary">
            Balance and ledger history (50 rows per page).
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
          {isSuperAdmin ? (
            <Button type="primary" onClick={() => setAdjustOpen(true)}>
              Manual adjust
            </Button>
          ) : null}
        </Space>
      </div>

      <Space wrap size="middle" style={{ width: '100%' }}>
        <Tag color="cyan" style={{ fontSize: 14, padding: '4px 10px' }}>
          Balance: {balanceQuery.data?.balance?.toLocaleString() ?? '—'}
          {balanceQuery.data?.userName ? ` · ${balanceQuery.data.userName}` : ''}
        </Tag>

        {isAdminOrAbove ? (
          <AsyncSelect
            style={{ minWidth: 260 }}
            placeholder="View user ledger (optional)"
            allowClear
            value={selectedUserId}
            fetchOptions={fetchUsers}
            onChange={(value) => {
              setSelectedUserId(value as string | undefined);
              setPage(1);
            }}
          />
        ) : null}

        <Select
          allowClear
          placeholder="Entry type"
          style={{ minWidth: 180 }}
          options={ENTRY_OPTIONS}
          value={entryType}
          onChange={(value) => {
            setEntryType(value);
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
      </Space>

      <DataTable<CreditLedgerItem>
        loading={ledgerQuery.isLoading}
        dataSource={ledgerQuery.data?.items ?? []}
        rowKey="id"
        page={page}
        pageSize={50}
        total={ledgerQuery.data?.total ?? 0}
        onPageChange={(next) => setPage(next)}
        columns={[
          {
            title: 'When',
            dataIndex: 'occurredAt',
            width: 170,
            render: (value: string) => dayjs(value).format('YYYY-MM-DD HH:mm'),
          },
          {
            title: 'Type',
            dataIndex: 'entryType',
            width: 130,
            render: (value: CreditLedgerEntryType) => <Tag>{value}</Tag>,
          },
          {
            title: 'Change',
            dataIndex: 'changeAmount',
            width: 110,
            render: (value: number) => (
              <Typography.Text type={value < 0 ? 'danger' : 'success'}>
                {value > 0 ? `+${value}` : value}
              </Typography.Text>
            ),
          },
          {
            title: 'Balance after',
            dataIndex: 'balanceAfter',
            width: 120,
            render: (value: number) => value.toLocaleString(),
          },
          {
            title: 'Description',
            dataIndex: 'description',
          },
        ]}
      />

      <Modal
        title="Manual credit adjust"
        open={adjustOpen}
        onCancel={() => setAdjustOpen(false)}
        confirmLoading={adjustMutation.isPending}
        onOk={() =>
          adjustForm.validateFields().then((values) =>
            adjustMutation.mutate({
              userId: values.userId,
              amount: values.amount,
              reason: values.reason.trim(),
            }),
          )
        }
        okText="Apply"
      >
        <Form form={adjustForm} layout="vertical">
          <Form.Item name="userId" label="User" rules={[{ required: true, message: 'Select a user' }]}>
            <AsyncSelect fetchOptions={fetchUsers} placeholder="Select user" />
          </Form.Item>
          <Form.Item
            name="amount"
            label="Amount (+ credit / − debit)"
            rules={[{ required: true, message: 'Enter amount' }]}
          >
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="reason" label="Reason" rules={[{ required: true, message: 'Enter reason' }]}>
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}
