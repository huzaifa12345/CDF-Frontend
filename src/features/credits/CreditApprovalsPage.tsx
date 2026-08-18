import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Form, Image, Input, InputNumber, Modal, Select, Space, Tag, Typography } from 'antd';
import dayjs from 'dayjs';
import { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { DataTable } from '../../shared/ui/DataTable';
import { confirmApprove, confirmReject } from '../../shared/ui/confirm';
import { notify } from '../../shared/ui/notify';
import {
  approveTopUp,
  rejectTopUp,
  resolveProofUrl,
  searchTopUpRequests,
  type CreditTopUpRequest,
  type CreditTopUpStatus,
} from './creditsApi';

function getErrorDetail(err: unknown) {
  return (
    (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
    'Request failed'
  );
}

export function CreditApprovalsPage() {
  const { isSuperAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<CreditTopUpStatus | undefined>('Pending');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [approveTarget, setApproveTarget] = useState<CreditTopUpRequest | null>(null);
  const [rejectTarget, setRejectTarget] = useState<CreditTopUpRequest | null>(null);
  const [approveForm] = Form.useForm<{ credits: number }>();
  const [rejectForm] = Form.useForm<{ reason: string }>();

  const query = useQuery({
    queryKey: ['credit-top-ups', status, search, page],
    queryFn: () => searchTopUpRequests({ status, search, page, pageSize: 50 }),
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, credits }: { id: string; credits: number }) => approveTopUp(id, credits),
    onSuccess: () => {
      notify.success('Request approved');
      setApproveTarget(null);
      approveForm.resetFields();
      queryClient.invalidateQueries({ queryKey: ['credit-top-ups'] });
      queryClient.invalidateQueries({ queryKey: ['credits-ledger'] });
      queryClient.invalidateQueries({ queryKey: ['credits-balance'] });
    },
    onError: (err: unknown) => notify.error('Approve', getErrorDetail(err)),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => rejectTopUp(id, reason),
    onSuccess: () => {
      notify.success('Request rejected');
      setRejectTarget(null);
      rejectForm.resetFields();
      queryClient.invalidateQueries({ queryKey: ['credit-top-ups'] });
    },
    onError: (err: unknown) => notify.error('Reject', getErrorDetail(err)),
  });

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <div>
        <Typography.Title level={3} style={{ margin: 0 }}>
          Credit approvals
        </Typography.Title>
        <Typography.Text type="secondary">
          Review payment screenshots and approve or reject top-up requests.
        </Typography.Text>
      </div>

      <Space wrap>
        <Select
          allowClear
          placeholder="Status"
          style={{ minWidth: 160 }}
          value={status}
          options={[
            { value: 'Pending', label: 'Pending' },
            { value: 'Approved', label: 'Approved' },
            { value: 'Rejected', label: 'Rejected' },
          ]}
          onChange={(value) => {
            setStatus(value);
            setPage(1);
          }}
        />
        <Input.Search
          allowClear
          placeholder="Search user or company"
          style={{ maxWidth: 280 }}
          onSearch={(value) => {
            setSearch(value.trim());
            setPage(1);
          }}
        />
      </Space>

      <DataTable<CreditTopUpRequest>
        loading={query.isLoading}
        dataSource={query.data?.items ?? []}
        rowKey="id"
        page={page}
        pageSize={50}
        total={query.data?.total ?? 0}
        onPageChange={(next) => setPage(next)}
        scroll={{ x: 1100 }}
        columns={[
          {
            title: 'Requested',
            dataIndex: 'requestedAt',
            width: 150,
            render: (value: string) => dayjs(value).format('YYYY-MM-DD HH:mm'),
          },
          { title: 'User', dataIndex: 'userName', width: 120 },
          { title: 'Company', dataIndex: 'companyName', width: 140 },
          {
            title: 'Status',
            dataIndex: 'status',
            width: 110,
            render: (value: CreditTopUpStatus) => (
              <Tag
                color={
                  value === 'Pending' ? 'gold' : value === 'Approved' ? 'green' : 'red'
                }
              >
                {value}
              </Tag>
            ),
          },
          {
            title: 'Screenshot',
            dataIndex: 'fileUrl',
            width: 120,
            render: (value: string) => (
              <Image src={resolveProofUrl(value)} width={64} height={64} style={{ objectFit: 'cover' }} />
            ),
          },
          {
            title: 'Credits',
            dataIndex: 'approvedCredits',
            width: 90,
            render: (value?: number | null) => value?.toLocaleString() ?? '—',
          },
          ...(isSuperAdmin
            ? [
                {
                  title: 'IP',
                  dataIndex: 'ipAddress',
                  width: 120,
                  render: (value?: string | null) => value ?? '—',
                },
                {
                  title: 'Device',
                  dataIndex: 'deviceInfo',
                  width: 160,
                  ellipsis: true,
                  render: (value?: string | null) => value ?? '—',
                },
                {
                  title: 'Location',
                  dataIndex: 'locationInfo',
                  width: 120,
                  render: (value?: string | null) => value ?? '—',
                },
              ]
            : []),
          {
            title: 'Actions',
            key: 'actions',
            width: 170,
            fixed: 'right' as const,
            render: (_: unknown, row: CreditTopUpRequest) =>
              row.status === 'Pending' ? (
                <Space>
                  <Button
                    size="small"
                    type="primary"
                    onClick={() => {
                      setApproveTarget(row);
                      approveForm.setFieldsValue({ credits: 200 });
                    }}
                  >
                    Approve
                  </Button>
                  <Button size="small" danger onClick={() => setRejectTarget(row)}>
                    Reject
                  </Button>
                </Space>
              ) : (
                <Typography.Text type="secondary">
                  {row.reviewedByUserName ?? '—'}
                </Typography.Text>
              ),
          },
        ]}
      />

      <Modal
        title="Approve top-up"
        open={!!approveTarget}
        onCancel={() => setApproveTarget(null)}
        confirmLoading={approveMutation.isPending}
        onOk={async () => {
          const values = await approveForm.validateFields();
          const target = approveTarget;
          if (!target) return;
          setApproveTarget(null);
          confirmApprove(async () => {
            await approveMutation.mutateAsync({ id: target.id, credits: values.credits });
          });
        }}
        okText="Continue"
      >
        <Form form={approveForm} layout="vertical">
          <Form.Item
            name="credits"
            label="Credits to grant"
            rules={[{ required: true, message: 'Enter credits' }]}
          >
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Reject top-up"
        open={!!rejectTarget}
        onCancel={() => setRejectTarget(null)}
        confirmLoading={rejectMutation.isPending}
        onOk={async () => {
          const values = await rejectForm.validateFields();
          const target = rejectTarget;
          if (!target) return;
          setRejectTarget(null);
          confirmReject(async () => {
            await rejectMutation.mutateAsync({ id: target.id, reason: values.reason.trim() });
          });
        }}
        okText="Continue"
        okButtonProps={{ danger: true }}
      >
        <Form form={rejectForm} layout="vertical">
          <Form.Item
            name="reason"
            label="Reason"
            rules={[{ required: true, message: 'Enter a rejection reason' }]}
          >
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}
