import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Form, Input, Modal, Typography } from 'antd';
import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { env } from '../../shared/config/env';
import { notify } from '../../shared/ui/notify';
import { changePasswordApi } from './authApi';
import { useAuth } from './AuthContext';

type LoginForm = {
  userName: string;
  password: string;
};

type ChangePasswordForm = {
  userName: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

function getErrorDetail(err: unknown, fallback: string) {
  return (
    (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? fallback
  );
}

export function LoginPage() {
  const { user, login, loading } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [changing, setChanging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [changeOpen, setChangeOpen] = useState(false);
  const [changeForm] = Form.useForm<ChangePasswordForm>();

  if (!loading && user) {
    return <Navigate to="/" replace />;
  }

  const onFinish = async (values: LoginForm) => {
    setSubmitting(true);
    setError(null);
    try {
      await login(values.userName.trim(), values.password);
      notify.success('Welcome', 'Signed in successfully.');
      navigate('/', { replace: true });
    } catch (err: unknown) {
      const detail = getErrorDetail(err, 'Invalid username or password.');
      setError(detail);
      notify.warning('Login failed', detail);
    } finally {
      setSubmitting(false);
    }
  };

  const onChangePassword = async (values: ChangePasswordForm) => {
    setChanging(true);
    try {
      await changePasswordApi({
        userName: values.userName.trim(),
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      notify.success('Password changed', 'You can sign in with your new password.');
      setChangeOpen(false);
      changeForm.resetFields();
    } catch (err: unknown) {
      const detail = getErrorDetail(err, 'Could not change password.');
      notify.warning('Change password failed', detail);
    } finally {
      setChanging(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background:
          'radial-gradient(circle at top left, #1a5c5c 0%, #0b3d3d 45%, #071f1f 100%)',
      }}
    >
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16,
        }}
      >
      <Card
        style={{ width: '100%', maxWidth: 420, borderRadius: 12 }}
        bodyStyle={{ padding: 28 }}
      >
        <Typography.Title level={3} style={{ marginTop: 0, marginBottom: 4 }}>
          {env.reportBrandName}
        </Typography.Title>
        <Typography.Paragraph type="secondary" style={{ marginBottom: 24 }}>
          Sign in to {env.appName}
        </Typography.Paragraph>

        {error ? (
          <Alert type="error" showIcon message={error} style={{ marginBottom: 16 }} />
        ) : null}

        <Form layout="vertical" onFinish={onFinish} requiredMark={false} size="large">
          <Form.Item
            label="UserName"
            name="userName"
            rules={[{ required: true, message: 'Enter username' }]}
          >
            <Input prefix={<UserOutlined />} autoComplete="username" />
          </Form.Item>
          <Form.Item
            label="Password"
            name="password"
            rules={[{ required: true, message: 'Enter password' }]}
          >
            <Input.Password prefix={<LockOutlined />} autoComplete="current-password" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block loading={submitting}>
            Login
          </Button>
          <Button
            type="link"
            block
            style={{ marginTop: 8 }}
            onClick={() => {
              setChangeOpen(true);
              changeForm.resetFields();
            }}
          >
            Change password
          </Button>
        </Form>
      </Card>

      <Modal
        title="Change password"
        open={changeOpen}
        onCancel={() => setChangeOpen(false)}
        onOk={() => changeForm.submit()}
        confirmLoading={changing}
        okText="Update password"
        destroyOnClose
        width={420}
      >
        <Form
          form={changeForm}
          layout="vertical"
          onFinish={onChangePassword}
          requiredMark={false}
        >
          <Form.Item
            label="UserName"
            name="userName"
            rules={[{ required: true, message: 'Enter username' }]}
          >
            <Input prefix={<UserOutlined />} autoComplete="username" />
          </Form.Item>
          <Form.Item
            label="Current password"
            name="currentPassword"
            rules={[{ required: true, message: 'Enter current password' }]}
          >
            <Input.Password prefix={<LockOutlined />} autoComplete="current-password" />
          </Form.Item>
          <Form.Item
            label="New password"
            name="newPassword"
            rules={[
              { required: true, message: 'Enter new password' },
              { min: 6, message: 'Min 6 characters' },
            ]}
          >
            <Input.Password prefix={<LockOutlined />} autoComplete="new-password" />
          </Form.Item>
          <Form.Item
            label="Confirm new password"
            name="confirmPassword"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: 'Confirm new password' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Passwords do not match'));
                },
              }),
            ]}
          >
            <Input.Password prefix={<LockOutlined />} autoComplete="new-password" />
          </Form.Item>
        </Form>
      </Modal>
      </div>
      <div
        style={{
          textAlign: 'center',
          padding: '12px 16px',
          color: 'rgba(255, 255, 255, 0.55)',
          fontSize: 13,
        }}
      >
        Powered by{' '}
        <a
          href="https://codebasesln.com"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: 'rgba(255, 255, 255, 0.85)' }}
        >
          CodeBase Solutions
        </a>
      </div>
    </div>
  );
}
