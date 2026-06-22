import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { SocketProvider } from './contexts/SocketContext';
import { NotificationProvider } from './contexts/NotificationContext';

// Layout
import MainLayout from './components/layout/MainLayout';

// Pages
import LoginPage from './pages/auth/LoginPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import StudentsPage from './pages/admin/StudentsPage';
import FacultyPage from './pages/admin/FacultyPage';
import DepartmentsPage from './pages/admin/DepartmentsPage';
import SubjectsPage from './pages/admin/SubjectsPage';
import AttendancePage from './pages/admin/AttendancePage';
import ReportsPage from './pages/admin/ReportsPage';
import SettingsPage from './pages/admin/SettingsPage';
import AuditLogsPage from './pages/admin/AuditLogsPage';
import FacultyDashboard from './pages/faculty/FacultyDashboard';
import TakeAttendancePage from './pages/faculty/TakeAttendancePage';
import StudentDashboard from './pages/student/StudentDashboard';
import StudentProfilePage from './pages/student/StudentProfilePage';

// Protected Route component
function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading, isAuthenticated } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
          <p className="text-gray-400 animate-pulse">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    if (allowedRoles.includes('admin') && user?.role === 'faculty' && user?.profile?.isHOD) {
      // Allow HOD to access admin routes
    } else {
      const roleRedirects = { admin: '/admin', faculty: '/faculty', student: '/student' };
      return <Navigate to={roleRedirects[user?.role] || '/login'} replace />;
    }
  }
  
  return children;
}

function AppRoutes() {
  const { user, isAuthenticated } = useAuth();
  
  const getDefaultRoute = () => {
    if (!isAuthenticated) return '/login';
    const routes = { admin: '/admin', faculty: '/faculty', student: '/student' };
    return routes[user?.role] || '/login';
  };

  return (
    <AnimatePresence mode="wait">
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<Navigate to={getDefaultRoute()} replace />} />
        
        {/* Admin Routes */}
        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <MainLayout />
          </ProtectedRoute>
        }>
          <Route index element={<AdminDashboard />} />
          <Route path="students" element={<StudentsPage />} />
          <Route path="faculty" element={<FacultyPage />} />
          <Route path="departments" element={<DepartmentsPage />} />
          <Route path="subjects" element={<SubjectsPage />} />
          <Route path="attendance" element={<AttendancePage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="audit-logs" element={<AuditLogsPage />} />
        </Route>

        {/* Faculty Routes */}
        <Route path="/faculty" element={
          <ProtectedRoute allowedRoles={['faculty']}>
            <MainLayout />
          </ProtectedRoute>
        }>
          <Route index element={<FacultyDashboard />} />
          <Route path="take-attendance" element={<TakeAttendancePage />} />
          <Route path="reports" element={<ReportsPage />} />
        </Route>

        {/* Student Routes */}
        <Route path="/student" element={
          <ProtectedRoute allowedRoles={['student']}>
            <MainLayout />
          </ProtectedRoute>
        }>
          <Route index element={<StudentDashboard />} />
          <Route path="attendance" element={<AttendancePage />} />
          <Route path="profile" element={<StudentProfilePage />} />
        </Route>

        <Route path="*" element={<Navigate to={getDefaultRoute()} replace />} />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <SocketProvider>
            <NotificationProvider>
              <AppRoutes />
            </NotificationProvider>
          </SocketProvider>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
