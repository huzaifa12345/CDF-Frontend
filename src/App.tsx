import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './app/AppLayout';
import { AuthProvider } from './features/auth/AuthContext';
import { LoginPage } from './features/auth/LoginPage';
import { RequireAuth } from './features/auth/RequireAuth';
import { ActivityAuditPage } from './features/audit/ActivityAuditPage';
import { CalculatorPage } from './features/calculator/CalculatorPage';
import { AddCreditsPage } from './features/credits/AddCreditsPage';
import { CreditApprovalsPage } from './features/credits/CreditApprovalsPage';
import { CreditsPage } from './features/credits/CreditsPage';
import { DashboardPage } from './features/dashboard/DashboardPage';
import { ProductsPage } from './features/products/ProductsPage';
import { RawMaterialsPage } from './features/rawMaterials/RawMaterialsPage';
import { ReportsPage } from './features/reports/ReportsPage';
import { SystemStatusPage } from './features/system/SystemStatusPage';
import { UsersPage } from './features/users/UsersPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<RequireAuth />}>
            <Route element={<AppLayout />}>
              <Route index element={<DashboardPage />} />
              <Route path="calculator" element={<CalculatorPage />} />
              <Route path="credits" element={<CreditsPage />} />
              <Route path="add-credits" element={<AddCreditsPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route element={<RequireAuth roles={['SuperAdmin']} />}>
                <Route path="system" element={<SystemStatusPage />} />
                <Route path="users" element={<UsersPage />} />
              </Route>
              <Route element={<RequireAuth roles={['SuperAdmin', 'Admin']} />}>
                <Route path="activity-audit" element={<ActivityAuditPage />} />
                <Route path="credit-approvals" element={<CreditApprovalsPage />} />
                <Route path="products" element={<ProductsPage />} />
                <Route path="raw-materials" element={<RawMaterialsPage />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
