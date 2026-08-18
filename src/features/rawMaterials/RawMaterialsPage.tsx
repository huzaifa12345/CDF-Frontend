import { PlusOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Form, Input, InputNumber, Modal, Select, Space, Tag, Typography } from 'antd';
import { useState } from 'react';
import type { ActivationStatus, RawMaterial } from '../../shared/api/types';
import { DataTable } from '../../shared/ui/DataTable';
import { notify } from '../../shared/ui/notify';
import {
  createRawMaterial,
  searchRawMaterials,
  updateRawMaterial,
  type RawMaterialPayload,
} from './rawMaterialsApi';

function getErrorDetail(err: unknown) {
  return (
    (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
    'Request failed'
  );
}

function formatPercent(value?: number | null) {
  return value == null ? '—' : `${value}%`;
}

export function RawMaterialsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<RawMaterial | null>(null);
  const [form] = Form.useForm();

  const query = useQuery({
    queryKey: ['raw-materials', search, page],
    queryFn: () => searchRawMaterials(search, page, 50),
  });

  const saveMutation = useMutation({
    mutationFn: async (values: RawMaterialPayload) => {
      const payload: RawMaterialPayload = {
        name: values.name.trim(),
        adPercent: values.adPercent ?? null,
        alkaliPercent: values.alkaliPercent ?? null,
        saltPercent: values.saltPercent ?? null,
        moisturePercent: values.moisturePercent ?? null,
        insolublePercent: values.insolublePercent ?? null,
        status: values.status,
      };
      if (editing) {
        return updateRawMaterial(editing.id, payload);
      }
      return createRawMaterial(payload);
    },
    onSuccess: () => {
      notify.success(editing ? 'Material updated' : 'Material created');
      setOpen(false);
      setEditing(null);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ['raw-materials'] });
    },
    onError: (err: unknown) => notify.error('Raw materials', getErrorDetail(err)),
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
            Raw materials
          </Typography.Title>
          <Typography.Text type="secondary">
            Empty property % means the material does not contain that property (0 in calculations).
          </Typography.Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditing(null);
            form.resetFields();
            form.setFieldsValue({ status: 'Active' });
            setOpen(true);
          }}
        >
          Add material
        </Button>
      </div>

      <Input.Search
        allowClear
        placeholder="Search by material name"
        onSearch={(value) => {
          setPage(1);
          setSearch(value.trim());
        }}
        style={{ maxWidth: 420 }}
      />

      <DataTable<RawMaterial>
        loading={query.isLoading}
        dataSource={query.data?.items ?? []}
        total={query.data?.total ?? 0}
        page={page}
        pageSize={50}
        onPageChange={(next) => setPage(next)}
        scroll={{ x: 980 }}
        columns={[
          { title: 'Name', dataIndex: 'name', fixed: 'left', width: 160 },
          {
            title: 'AD %',
            dataIndex: 'adPercent',
            width: 90,
            render: formatPercent,
          },
          {
            title: 'Alkali %',
            dataIndex: 'alkaliPercent',
            width: 90,
            render: formatPercent,
          },
          {
            title: 'Salt %',
            dataIndex: 'saltPercent',
            width: 90,
            render: formatPercent,
          },
          {
            title: 'Moisture %',
            dataIndex: 'moisturePercent',
            width: 110,
            render: formatPercent,
          },
          {
            title: 'Insoluble %',
            dataIndex: 'insolublePercent',
            width: 110,
            render: formatPercent,
          },
          {
            title: 'Status',
            dataIndex: 'status',
            width: 100,
            render: (status: ActivationStatus) => (
              <Tag color={status === 'Active' ? 'green' : 'default'}>{status}</Tag>
            ),
          },
          {
            title: 'Actions',
            key: 'actions',
            width: 90,
            render: (_, record) => (
              <Button
                type="link"
                style={{ padding: 0 }}
                onClick={() => {
                  setEditing(record);
                  form.setFieldsValue(record);
                  setOpen(true);
                }}
              >
                Edit
              </Button>
            ),
          },
        ]}
      />

      <Modal
        title={editing ? 'Edit raw material' : 'Create raw material'}
        open={open}
        onCancel={() => {
          setOpen(false);
          setEditing(null);
        }}
        onOk={() => form.submit()}
        confirmLoading={saveMutation.isPending}
        destroyOnClose
        width={560}
      >
        <Form form={form} layout="vertical" onFinish={(values) => saveMutation.mutate(values)}>
          <Form.Item label="Name" name="name" rules={[{ required: true, message: 'Required' }]}>
            <Input />
          </Form.Item>
          <Space wrap size="middle" style={{ display: 'flex' }}>
            <Form.Item label="AD %" name="adPercent">
              <InputNumber min={0} max={100} step={0.01} style={{ width: 120 }} />
            </Form.Item>
            <Form.Item label="Alkali %" name="alkaliPercent">
              <InputNumber min={0} max={100} step={0.01} style={{ width: 120 }} />
            </Form.Item>
            <Form.Item label="Salt %" name="saltPercent">
              <InputNumber min={0} max={100} step={0.01} style={{ width: 120 }} />
            </Form.Item>
            <Form.Item label="Moisture %" name="moisturePercent">
              <InputNumber min={0} max={100} step={0.01} style={{ width: 120 }} />
            </Form.Item>
            <Form.Item label="Insoluble %" name="insolublePercent">
              <InputNumber min={0} max={100} step={0.01} style={{ width: 120 }} />
            </Form.Item>
          </Space>
          <Form.Item label="Status" name="status" rules={[{ required: true }]}>
            <Select
              options={[
                { label: 'Active', value: 'Active' },
                { label: 'Inactive', value: 'Inactive' },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}
