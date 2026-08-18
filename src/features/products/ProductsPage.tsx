import { PlusOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Form, Input, Modal, Select, Space, Tag, Typography } from 'antd';
import { useState } from 'react';
import type { ActivationStatus, Product } from '../../shared/api/types';
import { DataTable } from '../../shared/ui/DataTable';
import { notify } from '../../shared/ui/notify';
import { createProduct, searchProducts, updateProduct } from './productsApi';

function getErrorDetail(err: unknown) {
  return (
    (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
    'Request failed'
  );
}

export function ProductsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form] = Form.useForm();

  const query = useQuery({
    queryKey: ['products', search, page],
    queryFn: () => searchProducts(search, page, 50),
  });

  const saveMutation = useMutation({
    mutationFn: async (values: {
      name: string;
      category: string;
      status: ActivationStatus;
    }) => {
      const payload = {
        name: values.name.trim(),
        category: values.category.trim(),
        status: values.status,
      };
      if (editing) {
        return updateProduct(editing.id, payload);
      }
      return createProduct(payload);
    },
    onSuccess: () => {
      notify.success(editing ? 'Product updated' : 'Product created');
      setOpen(false);
      setEditing(null);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (err: unknown) => notify.error('Products', getErrorDetail(err)),
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
            Products
          </Typography.Title>
          <Typography.Text type="secondary">
            Product master for the Formula Calculator dropdown.
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
          Add product
        </Button>
      </div>

      <Input.Search
        allowClear
        placeholder="Search by name or category"
        onSearch={(value) => {
          setPage(1);
          setSearch(value.trim());
        }}
        style={{ maxWidth: 420 }}
      />

      <DataTable<Product>
        loading={query.isLoading}
        dataSource={query.data?.items ?? []}
        total={query.data?.total ?? 0}
        page={page}
        pageSize={50}
        onPageChange={(next) => setPage(next)}
        scroll={{ x: 720 }}
        columns={[
          { title: 'Name', dataIndex: 'name' },
          { title: 'Category', dataIndex: 'category' },
          {
            title: 'Status',
            dataIndex: 'status',
            width: 110,
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
        title={editing ? 'Edit product' : 'Create product'}
        open={open}
        onCancel={() => {
          setOpen(false);
          setEditing(null);
        }}
        onOk={() => form.submit()}
        confirmLoading={saveMutation.isPending}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={(values) => saveMutation.mutate(values)}>
          <Form.Item label="Name" name="name" rules={[{ required: true, message: 'Required' }]}>
            <Input />
          </Form.Item>
          <Form.Item
            label="Category"
            name="category"
            rules={[{ required: true, message: 'Required' }]}
          >
            <Input />
          </Form.Item>
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
