
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { AuthProvider, useAuth } from './context/AuthContext';
import theme from './theme';

// Core Pages
import LoginPage from './views/LoginPage';
import DashboardPage from './views/DashboardPage';
import CheckInPage from './views/CheckInPage';
import RequestsPage from './views/RequestsPage';
import ProfilePage from './views/ProfilePage';
import SettingsPage from './views/SettingsPage';
import ErrorPage from './views/ErrorPage';

// HRM Pages
import HrmEmployeesPage from './views/viewsHRM/HrmEmployeesPage';
import HrmTimeReportPage from './views/viewsHRM/HrmTimeReportPage';
import HrmApprovalsPage from './views/viewsHRM/HrmApprovalsPage';
import HrmSchedulesPage from './views/viewsHRM/HrmSchedulesPage';
import HrmHolidaysPage from './views/viewsHRM/HrmHolidaysPage';
import HrmLeaveMgmtPage from './views/viewsHRM/HrmLeaveMgmtPage';
import HrmEvaluationPage from './views/viewsHRM/HrmEvaluationPage';
import HrmReportsPage from './views/viewsHRM/HrmReportsPage';

// Payroll Pages
import PayPayrollPage from './views/viewsPay/PayPayrollPage';
import PayLoansPage from './views/viewsPay/PayLoansPage';
import PayCertificatesPage from './views/viewsPay/PayCertificatesPage';
import PayBonusesPage from './views/viewsPay/PayBonusesPage';

// ACC Module (iframe-based — loads standalone ACC app)
import AccIframePage from './views/viewsACC/AccIframePage';

// Layout
import MainLayout from './components/MainLayout';

// Protected Route wrapper
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', background: '#F0F2F5',
        fontFamily: 'Inter, sans-serif', color: '#6B7280',
      }}>
        กำลังโหลด...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

// Login Route — redirect if already logged in
function LoginRoute() {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;

  return <LoginPage />;
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter basename="/v3_1/frontend">
        <AuthProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<LoginRoute />} />

            {/* Protected Routes */}
            <Route path="/" element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="checkin" element={<CheckInPage />} />
              <Route path="requests" element={<RequestsPage />} />
              <Route path="profile" element={<ProfilePage />} />

              {/* HRM */}
              <Route path="hrm/employees" element={<HrmEmployeesPage />} />
              <Route path="hrm/time-report" element={<HrmTimeReportPage />} />
              <Route path="hrm/schedules" element={<HrmSchedulesPage />} />
              <Route path="hrm/holidays" element={<HrmHolidaysPage />} />
              <Route path="hrm/leave-mgmt" element={<HrmLeaveMgmtPage />} />
              <Route path="hrm/approvals" element={<HrmApprovalsPage />} />
              <Route path="hrm/evaluation" element={<HrmEvaluationPage />} />
              <Route path="hrm/reports" element={<HrmReportsPage />} />

              {/* Payroll */}
              <Route path="pay/payroll" element={<PayPayrollPage />} />
              <Route path="pay/loans" element={<PayLoansPage />} />
              <Route path="pay/certificates" element={<PayCertificatesPage />} />
              <Route path="pay/bonuses" element={<PayBonusesPage />} />

              {/* Settings */}
              <Route path="settings/*" element={<SettingsPage />} />

              {/* ACC Module (iframe → standalone ACC app) */}
              <Route path="acc/*" element={<AccIframePage />} />
            </Route>

            {/* 404 — full screen, no layout */}
            <Route path="*" element={<ErrorPage />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;

