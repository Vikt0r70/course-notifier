import React, { useEffect, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/authStore';
import { PageSpinner } from './components/ui';

// Read OAuth token from URL before React renders (avoids timing issue with PrivateRoute)
(function initOAuthToken() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');
  if (token) {
    localStorage.setItem('token', token);
    window.history.replaceState({}, '', window.location.pathname);
  }
})();

import MainLayout from './layouts/MainLayout';
import AdminLayout from './layouts/AdminLayout';

const Login = React.lazy(() => import('./pages/Login'));
const Register = React.lazy(() => import('./pages/Register'));
const ForgotPassword = React.lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = React.lazy(() => import('./pages/ResetPassword'));
const Landing = React.lazy(() => import('./pages/Landing'));
const Onboarding = React.lazy(() => import('./pages/Onboarding'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Watchlist = React.lazy(() => import('./pages/Watchlist'));
const Profile = React.lazy(() => import('./pages/Profile'));
const Notifications = React.lazy(() => import('./pages/Notifications'));
const AdminDashboard = React.lazy(() => import('./pages/admin/AdminDashboard'));
const AdminUsers = React.lazy(() => import('./pages/admin/AdminUsers'));
const AdminCourses = React.lazy(() => import('./pages/admin/AdminCourses'));
const AdminWatchlists = React.lazy(() => import('./pages/admin/AdminWatchlists'));
const AdminReports = React.lazy(() => import('./pages/admin/AdminReports'));
const AdminSettings = React.lazy(() => import('./pages/admin/AdminSettings'));
const VerifyEmail = React.lazy(() => import('./pages/VerifyEmail'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30000,
    },
  },
});

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return <PageSpinner message="Loading..." />;
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return <PageSpinner message="Loading..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (!user?.isAdmin) {
    return <Navigate to="/dashboard" />;
  }

  return <>{children}</>;
};

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return <PageSpinner message="Loading..." />;
  }

  return isAuthenticated ? <Navigate to="/dashboard" /> : <>{children}</>;
};

function App() {
  const loadUser = useAuthStore((state) => state.loadUser);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Suspense fallback={<PageSpinner message="Loading..." />}>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
          <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
          <Route path="/reset-password/:token" element={<PublicRoute><ResetPassword /></PublicRoute>} />
          <Route path="/verify-email" element={<VerifyEmail />} />

          {/* Public route - landing page (no auth required) */}
          <Route
            path="/"
            element={<MainLayout />}
          >
            <Route index element={<Landing />} />
          </Route>

          {/* Protected Routes - authenticated users only */}
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <MainLayout />
              </PrivateRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="watchlist" element={<Watchlist />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="profile" element={<Profile />} />
            <Route path="onboarding" element={<Onboarding />} />
          </Route>

          {/* Admin Routes */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminLayout />
              </AdminRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="courses" element={<AdminCourses />} />
            <Route path="watchlists" element={<AdminWatchlists />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
        </Suspense>
        <Toaster 
          position="top-center"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#18181b',
              color: '#fafafa',
              border: '1px solid rgba(63, 63, 70, 0.5)',
              borderRadius: '12px',
            },
            success: {
              iconTheme: {
                primary: '#22c55e',
                secondary: '#fafafa',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fafafa',
              },
            },
          }}
        />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
