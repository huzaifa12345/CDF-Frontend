import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Spin } from 'antd';
import type { UserRole } from '../../shared/api/types';
import { useAuth } from './AuthContext';

type RequireAuthProps = {
  roles?: UserRole[];
};

export function RequireAuth({ roles }: RequireAuthProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', minHeight: '40vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
