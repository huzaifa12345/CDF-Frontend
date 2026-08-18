import { PlusOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Button,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Tag,
  Typography,
} from 'antd';
import { useMemo, useState } from 'react';
import type { UserListItem, UserRole, UserStatus } from '../../shared/api/types';
import { DataTable } from '../../shared/ui/DataTable';
import { notify } from '../../shared/ui/notify';
import { useAuth } from '../auth/AuthContext';
import { createUser, searchUsers, updateUser } from './usersApi';

export function UsersPage() {
  const { isSuperAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<UserListItem | null>(null);
  const [form] = Form.useForm();

  const query = useQuery({
    queryKey: ['users', search, page],
    queryFn: () => searchUsers(search, page, 50),
  });

  const roleOptions = useMemo(() => {
    // Admin must never see SuperAdmin in role dropdowns.
    const roles: UserRole[] = isSuperAdmin
      ? ['SuperAdmin', 'Admin', 'User']
      : ['Admin', 'User'];
    return roles.map((role) => ({ label: role, value: role }));
  }, [isSuperAdmin]);

  const saveMutation = useMutation({
    mutationFn: async (values: {
      userName?: string;
      password?: string;
      companyName: string;
      role: UserRole;
      status: UserStatus;
      newPassword?: string;
    }) => {
      if (editing) {
        return updateUser(editing.id, {
          companyName: values.companyName,
          role: values.role,
          status: values.status,
          newPassword: values.newPassword || undefined,
        });
      }
      return createUser({
        userName: values.userName!.trim(),
        password: values.password!,
        companyName: values.companyName.trim(),
        role: values.role,
        status: values.status,
      });
    },
    onSuccess: () => {
      notify.success(editing ? 'User updated' : 'User created');
      setOpen(false);
      setEditing(null);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err: unknown) => {
      const detail =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        'Request failed';
      notify.error('Users', detail);
    },
  });

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ role: 'User', status: 'Active' });
    setOpen(true);
  };

  const openEdit = (record: UserListItem) => {
    setEditing(record);
    form.setFieldsValue({
      companyName: record.companyName,
      role: record.role,
      status: record.status,
      newPassword: undefined,
    });
    setOpen(true);
  };

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
            Users
          </Typography.Title>
          <Typography.Text type="secondary">
            Create and manage Active/Inactive users with company name.
          </Typography.Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          Add user
        </Button>
      </div>

      <Input.Search
        allowClear
        placeholder="Search by username or company"
        onSearch={(value) => {
          setPage(1);
          setSearch(value.trim());
        }}
        style={{ maxWidth: 420 }}
      />

      <DataTable<UserListItem>
        loading={query.isLoading}
        dataSource={query.data?.items ?? []}
        total={query.data?.total ?? 0}
        page={page}
        pageSize={50}
        onPageChange={(next) => setPage(next)}
        columns={[
          { title: 'UserName', dataIndex: 'userName' },
          { title: 'Company', dataIndex: 'companyName' },
          {
            title: 'Role',
            dataIndex: 'role',
            render: (role: UserRole) => <Tag>{role}</Tag>,
          },
          {
            title: 'Status',
            dataIndex: 'status',
            render: (status: UserStatus) => (
              <Tag color={status === 'Active' ? 'green' : 'default'}>{status}</Tag>
            ),
          },
          {
            title: 'Credits',
            dataIndex: 'creditBalance',
            width: 110,
            render: (value: number) => value.toLocaleString(),
          },
          {
            title: 'Actions',
            key: 'actions',
            width: 100,
            render: (_, record) =>
              !isSuperAdmin && record.role === 'SuperAdmin' ? null : (
                <Button type="link" onClick={() => openEdit(record)} style={{ padding: 0 }}>
                  Edit
                </Button>
              ),
          },
        ]}
      />

      <Modal
        title={editing ? 'Edit user' : 'Create user'}
        open={open}
        onCancel={() => {
          setOpen(false);
          setEditing(null);
        }}
        onOk={() => form.submit()}
        confirmLoading={saveMutation.isPending}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={(values) => saveMutation.mutate(values)}
        >
          {!editing ? (
            <>
              <Form.Item
                label="UserName"
                name="userName"
                rules={[{ required: true, message: 'Required' }]}
              >
                <Input />
              </Form.Item>
              <Form.Item
                label="Password"
                name="password"
                rules={[
                  { required: true, message: 'Required' },
                  { min: 6, message: 'Min 6 characters' },
                ]}
              >
                <Input.Password />
              </Form.Item>
            </>
          ) : (
            <Form.Item label="New password (optional)" name="newPassword">
              <Input.Password placeholder="Leave blank to keep current" />
            </Form.Item>
          )}
          <Form.Item
            label="Company name"
            name="companyName"
            rules={[{ required: true, message: 'Required' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item label="Role" name="role" rules={[{ required: true }]}>
            <Select options={roleOptions} />
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
