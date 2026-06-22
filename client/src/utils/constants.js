// ─── API Configuration ───────────────────────────────────────────────────────
const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || `http://${hostname}:5000/api`;
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || `http://${hostname}:5000`;

// ─── Face Recognition ────────────────────────────────────────────────────────
export const FACE_MATCH_THRESHOLD = 0.65;
export const MIN_FACE_SAMPLES = 3;
export const MAX_FACE_SAMPLES = 5;
export const FACE_DETECTION_SCORE_THRESHOLD = 0.5;

// ─── Attendance ──────────────────────────────────────────────────────────────
export const MIN_ATTENDANCE_PERCENTAGE = 75;
export const SESSION_TIMEOUT_MINUTES = 30;

// ─── Colors ──────────────────────────────────────────────────────────────────
export const COLORS = {
  primary: '#6366f1',
  primaryLight: '#818cf8',
  primaryDark: '#4f46e5',
  secondary: '#8b5cf6',
  accent: '#06b6d4',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#f43f5e',
  info: '#3b82f6',
  dark: {
    bg: '#0a0a1a',
    surface: '#111827',
    card: '#1e293b',
    border: 'rgba(255,255,255,0.05)',
    text: '#f1f5f9',
    textSecondary: '#94a3b8',
  },
  light: {
    bg: '#f8fafc',
    surface: '#ffffff',
    card: '#ffffff',
    border: '#e2e8f0',
    text: '#0f172a',
    textSecondary: '#64748b',
  },
  chart: ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#f43f5e', '#ec4899', '#14b8a6'],
};

// ─── Gradient Definitions ────────────────────────────────────────────────────
export const GRADIENTS = {
  primary: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
  accent: 'linear-gradient(135deg, #06b6d4, #22d3ee)',
  success: 'linear-gradient(135deg, #10b981, #34d399)',
  warning: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
  danger: 'linear-gradient(135deg, #f43f5e, #fb7185)',
};

// ─── Routes ──────────────────────────────────────────────────────────────────
export const ROUTES = {
  LOGIN: '/login',
  ADMIN: {
    DASHBOARD: '/admin/dashboard',
    STUDENTS: '/admin/students',
    FACULTY: '/admin/faculty',
    DEPARTMENTS: '/admin/departments',
    SUBJECTS: '/admin/subjects',
    ATTENDANCE: '/admin/attendance',
    REPORTS: '/admin/reports',
    SETTINGS: '/admin/settings',
    AUDIT_LOGS: '/admin/audit-logs',
  },
  FACULTY: {
    DASHBOARD: '/faculty/dashboard',
    TAKE_ATTENDANCE: '/faculty/take-attendance',
    MY_CLASSES: '/faculty/my-classes',
    REPORTS: '/faculty/reports',
  },
  STUDENT: {
    DASHBOARD: '/student/dashboard',
    ATTENDANCE: '/student/attendance',
    PROFILE: '/student/profile',
  },
};

// ─── Demo Accounts ───────────────────────────────────────────────────────────
export const DEMO_ACCOUNTS = [
  { label: 'Admin', email: 'admin@facetrack.com', password: 'admin123', role: 'admin' },
  { label: 'Faculty', email: 'faculty@facetrack.com', password: 'faculty123', role: 'faculty' },
  { label: 'Student', email: 'student@facetrack.com', password: 'student123', role: 'student' },
];

// ─── Semesters ───────────────────────────────────────────────────────────────
export const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

// ─── Days of Week ────────────────────────────────────────────────────────────
export const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
