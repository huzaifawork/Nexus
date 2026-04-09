import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/AuthContext';

// Layouts
import { DashboardLayout } from './components/layout/DashboardLayout';

// Auth Pages
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';

// Dashboard Pages
import { EntrepreneurDashboard } from './pages/dashboard/EntrepreneurDashboard';
import { InvestorDashboard } from './pages/dashboard/InvestorDashboard';

// Profile Pages
import { EntrepreneurProfile } from './pages/profile/EntrepreneurProfile';
import { InvestorProfile } from './pages/profile/InvestorProfile';

// Feature Pages
import { InvestorsPage } from './pages/investors/InvestorsPage';
import { EntrepreneursPage } from './pages/entrepreneurs/EntrepreneursPage';
import { MessagesPage } from './pages/messages/MessagesPage';
import { NotificationsPage } from './pages/notifications/NotificationsPage';
import { DocumentsPage } from './pages/documents/DocumentsPage';
import { SettingsPage } from './pages/settings/SettingsPage';
import { HelpPage } from './pages/help/HelpPage';
import { DealsPage } from './pages/deals/DealsPage';
import { ChatPage } from './pages/chat/ChatPage';

// Role-based guard: redirects if user doesn't have the required role
const RoleRoute: React.FC<{ role: 'entrepreneur' | 'investor'; children: React.ReactNode }> = ({ role, children }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role !== role) {
    return <Navigate to={user?.role === 'entrepreneur' ? '/dashboard/entrepreneur' : '/dashboard/investor'} replace />;
  }
  return <>{children}</>;
};

function AppRoutes() {
  const { user, isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Auth Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

      {/* Entrepreneur-only dashboard */}
      <Route path="/dashboard" element={<DashboardLayout />}>
        <Route path="entrepreneur" element={
          <RoleRoute role="entrepreneur"><EntrepreneurDashboard /></RoleRoute>
        } />
        <Route path="investor" element={
          <RoleRoute role="investor"><InvestorDashboard /></RoleRoute>
        } />
      </Route>

      {/* Profile Routes */}
      <Route path="/profile" element={<DashboardLayout />}>
        <Route path="entrepreneur/:id" element={<EntrepreneurProfile />} />
        <Route path="investor/:id" element={<InvestorProfile />} />
      </Route>

      {/* Feature Routes */}
      <Route path="/investors" element={<DashboardLayout />}>
        <Route index element={<InvestorsPage />} />
      </Route>
      <Route path="/entrepreneurs" element={<DashboardLayout />}>
        <Route index element={<EntrepreneursPage />} />
      </Route>
      <Route path="/messages" element={<DashboardLayout />}>
        <Route index element={<MessagesPage />} />
      </Route>
      <Route path="/notifications" element={<DashboardLayout />}>
        <Route index element={<NotificationsPage />} />
      </Route>
      <Route path="/documents" element={<DashboardLayout />}>
        <Route index element={<DocumentsPage />} />
      </Route>
      <Route path="/settings" element={<DashboardLayout />}>
        <Route index element={<SettingsPage />} />
      </Route>
      <Route path="/help" element={<DashboardLayout />}>
        <Route index element={<HelpPage />} />
      </Route>
      <Route path="/deals" element={<DashboardLayout />}>
        <Route index element={<DealsPage />} />
      </Route>
      <Route path="/chat" element={<DashboardLayout />}>
        <Route index element={<ChatPage />} />
        <Route path=":userId" element={<ChatPage />} />
      </Route>

      {/* Root redirect based on role */}
      <Route path="/" element={
        isAuthenticated
          ? <Navigate to={user?.role === 'entrepreneur' ? '/dashboard/entrepreneur' : '/dashboard/investor'} replace />
          : <Navigate to="/login" replace />
      } />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
