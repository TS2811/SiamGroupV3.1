
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { AuthProvider, useAuth } from './context/AuthContext';
import theme from './theme';

// Pages
import LoginPage from './views/LoginPage';
import DashboardPage from './views/DashboardPage';
import CheckInPage from './views/CheckInPage';
import RequestsPage from './views/RequestsPage';
import ProfilePage from './views/ProfilePage';

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

// Placeholder page
function PlaceholderPage({ title }) {
  return (
    <div style={{ padding: 24 }}>
      <h2>{title}</h2>
      <p style={{ color: '#6B7280' }}>หน้านี้อยู่ระหว่างการพัฒนา...</p>
    </div>
  );
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
              <Route path="hrm/employees" element={<PlaceholderPage title="จัดการพนักงาน" />} />
              <Route path="hrm/time-report" element={<PlaceholderPage title="รายงานเวลา" />} />
              <Route path="hrm/schedules" element={<PlaceholderPage title="ตารางกะ" />} />
              <Route path="hrm/holidays" element={<PlaceholderPage title="วันหยุด" />} />
              <Route path="hrm/leave-mgmt" element={<PlaceholderPage title="จัดการสิทธิ์ลา" />} />
              <Route path="hrm/approvals" element={<PlaceholderPage title="อนุมัติคำร้อง" />} />
              <Route path="hrm/evaluation" element={<PlaceholderPage title="ประเมินผลงาน" />} />
              <Route path="hrm/reports" element={<PlaceholderPage title="รายงานสรุป" />} />

              {/* Settings */}
              <Route path="settings/company" element={<PlaceholderPage title="บริษัท" />} />
              <Route path="settings/branch" element={<PlaceholderPage title="สาขา" />} />
              <Route path="settings/org" element={<PlaceholderPage title="โครงสร้างองค์กร" />} />
              <Route path="settings/permission" element={<PlaceholderPage title="สิทธิ์การเข้าถึง" />} />
              <Route path="settings/menu" element={<PlaceholderPage title="โครงสร้างเมนู" />} />
              <Route path="settings/config" element={<PlaceholderPage title="ค่าระบบ" />} />
              <Route path="settings/admin" element={<PlaceholderPage title="ผู้ดูแลระบบ" />} />

              {/* 404 */}
              <Route path="*" element={<PlaceholderPage title="404 — ไม่พบหน้านี้" />} />
            </Route>
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
