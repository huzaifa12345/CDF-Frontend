import {
  ApiOutlined,
  AppstoreOutlined,
  AuditOutlined,
  CalculatorOutlined,
  DashboardOutlined,
  ExperimentOutlined,
  FilePdfOutlined,
  HistoryOutlined,
  LogoutOutlined,
  PlusCircleOutlined,
  TeamOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import { Button, Drawer, Grid, Layout, Menu, Tag, Typography } from 'antd';
import { useMemo, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';
import { env } from '../shared/config/env';

const { Header, Sider, Content, Footer } = Layout;
const { useBreakpoint } = Grid;

export function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const screens = useBreakpoint();
  const isMobile = !screens.lg;
  const [open, setOpen] = useState(false);
  const { user, logout, isAdminOrAbove, isSuperAdmin } = useAuth();

  const menuItems = useMemo(() => {
    const items = [
      {
        key: '/',
        icon: <DashboardOutlined />,
        label: <Link to="/">Dashboard</Link>,
      },
      {
        key: '/calculator',
        icon: <CalculatorOutlined />,
        label: <Link to="/calculator">Calculator</Link>,
      },
      {
        key: '/credits',
        icon: <WalletOutlined />,
        label: <Link to="/credits">Credits</Link>,
      },
      {
        key: '/add-credits',
        icon: <PlusCircleOutlined />,
        label: <Link to="/add-credits">Add Credits</Link>,
      },
      {
        key: '/reports',
        icon: <FilePdfOutlined />,
        label: <Link to="/reports">Reports</Link>,
      },
    ];

    if (isSuperAdmin) {
      items.push(
        {
          key: '/system',
          icon: <ApiOutlined />,
          label: <Link to="/system">System</Link>,
        },
        {
          key: '/users',
          icon: <TeamOutlined />,
          label: <Link to="/users">Users</Link>,
        },
      );
    }

    if (isAdminOrAbove) {
      items.push(
        {
          key: '/activity-audit',
          icon: <HistoryOutlined />,
          label: <Link to="/activity-audit">Activity audit</Link>,
        },
        {
          key: '/credit-approvals',
          icon: <AuditOutlined />,
          label: <Link to="/credit-approvals">Credit approvals</Link>,
        },
        {
          key: '/products',
          icon: <AppstoreOutlined />,
          label: <Link to="/products">Products</Link>,
        },
        {
          key: '/raw-materials',
          icon: <ExperimentOutlined />,
          label: <Link to="/raw-materials">Raw materials</Link>,
        },
      );
    }

    return items;
  }, [isAdminOrAbove, isSuperAdmin]);

  const menu = (
    <Menu
      theme="dark"
      mode="inline"
      selectedKeys={[location.pathname]}
      items={menuItems}
      onClick={() => setOpen(false)}
    />
  );

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {!isMobile ? (
        <Sider breakpoint="lg" collapsedWidth={64} width={220}>
          <div
            style={{
              color: '#e8f5f5',
              fontWeight: 700,
              letterSpacing: 1,
              padding: '16px 20px',
              fontSize: 18,
            }}
          >
            {env.reportBrandName}
          </div>
          {menu}
        </Sider>
      ) : (
        <Drawer
          title={env.reportBrandName}
          placement="left"
          open={open}
          onClose={() => setOpen(false)}
          bodyStyle={{ padding: 0, background: '#102a2a' }}
        >
          {menu}
        </Drawer>
      )}

      <Layout>
        <Header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            paddingInline: 16,
            flexWrap: 'wrap',
            height: 'auto',
            minHeight: 64,
            lineHeight: 'normal',
            paddingBlock: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {isMobile ? (
              <Button type="default" onClick={() => setOpen(true)}>
                Menu
              </Button>
            ) : null}
            <Typography.Title level={4} style={{ color: '#fff', margin: 0, fontSize: 18 }}>
              {env.appName}
            </Typography.Title>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <Tag color="cyan">Credits: {user?.creditBalance?.toLocaleString() ?? '—'}</Tag>
            <Tag>{user?.userName}</Tag>
            <Tag color="geekblue">{user?.role}</Tag>
            <Button
              icon={<LogoutOutlined />}
              onClick={() => {
                logout();
                navigate('/login', { replace: true });
              }}
            >
              Logout
            </Button>
          </div>
        </Header>
        <Content style={{ margin: isMobile ? 12 : 24 }}>
          <div
            style={{
              background: '#fff',
              borderRadius: 8,
              padding: isMobile ? 14 : 20,
              minHeight: 360,
            }}
          >
            <Outlet />
          </div>
        </Content>
        <Footer
          style={{
            textAlign: 'center',
            padding: '12px 16px',
            color: 'rgba(0, 0, 0, 0.45)',
            background: 'transparent',
          }}
        >
          Powered by{' '}
          <a href="https://codebasesln.com" target="_blank" rel="noopener noreferrer">
            CodeBase Solutions
          </a>
        </Footer>
      </Layout>
    </Layout>
  );
}
