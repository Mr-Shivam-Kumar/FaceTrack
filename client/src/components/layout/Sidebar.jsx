import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import {
  HiOutlineHome, HiOutlineUserGroup, HiOutlineAcademicCap,
  HiOutlineBuildingOffice2, HiOutlineBookOpen, HiOutlineClipboardDocumentList,
  HiOutlineDocumentChartBar, HiOutlineCog6Tooth,
  HiOutlineChevronLeft, HiOutlineChevronRight, HiOutlineArrowRightOnRectangle,
  HiOutlineIdentification, HiOutlineChartBarSquare, HiOutlineDocumentText,
  HiOutlineCamera
} from 'react-icons/hi2';
import { RiShieldUserLine } from 'react-icons/ri';

const adminNav = [
  { path: '/admin', icon: HiOutlineHome, label: 'Dashboard', end: true },
  { path: '/admin/students', icon: HiOutlineUserGroup, label: 'Students' },
  { path: '/admin/faculty', icon: HiOutlineAcademicCap, label: 'Faculty' },
  { path: '/admin/departments', icon: HiOutlineBuildingOffice2, label: 'Departments' },
  { path: '/admin/subjects', icon: HiOutlineBookOpen, label: 'Subjects' },
  { path: '/admin/attendance', icon: HiOutlineClipboardDocumentList, label: 'Attendance' },
  { path: '/admin/reports', icon: HiOutlineDocumentChartBar, label: 'Reports' },
  { path: '/admin/settings', icon: HiOutlineCog6Tooth, label: 'Settings' },
  { path: '/admin/audit-logs', icon: HiOutlineDocumentText, label: 'Audit Logs' },
];

const facultyNav = [
  { path: '/faculty', icon: HiOutlineHome, label: 'Dashboard', end: true },
  { path: '/faculty/take-attendance', icon: HiOutlineCamera, label: 'Take Attendance' },
  { path: '/faculty/reports', icon: HiOutlineDocumentChartBar, label: 'Reports' },
];

const studentNav = [
  { path: '/student', icon: HiOutlineHome, label: 'Dashboard', end: true },
  { path: '/student/attendance', icon: HiOutlineChartBarSquare, label: 'My Attendance' },
  { path: '/student/profile', icon: HiOutlineIdentification, label: 'Profile' },
];

export default function Sidebar({ collapsed, setCollapsed }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const isHOD = user?.role === 'faculty' && user?.profile?.isHOD;

  let navItems = studentNav;
  if (user?.role === 'admin') {
    navItems = adminNav;
  } else if (user?.role === 'faculty') {
    if (isHOD) {
      navItems = [
        { path: '/faculty', icon: HiOutlineHome, label: 'Dashboard', end: true },
        { path: '/faculty/take-attendance', icon: HiOutlineCamera, label: 'Take Attendance' },
        { path: '/admin/students', icon: HiOutlineUserGroup, label: 'Manage Students' },
        { path: '/admin/faculty', icon: HiOutlineAcademicCap, label: 'Manage Faculty' },
        { path: '/admin/subjects', icon: HiOutlineBookOpen, label: 'Manage Subjects' },
        { path: '/admin/attendance', icon: HiOutlineClipboardDocumentList, label: 'Attendance' },
        { path: '/admin/reports', icon: HiOutlineDocumentChartBar, label: 'Reports' },
      ];
    } else {
      navItems = facultyNav;
    }
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const sidebarTransition = { type: 'spring', stiffness: 220, damping: 26 };

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 80 : 280 }}
      transition={sidebarTransition}
      className="glass-sidebar h-screen flex flex-col fixed left-0 top-0 z-40 select-none transform-gpu will-change-[width]"
    >
      <div className="w-full h-full flex flex-col overflow-hidden">
        {/* Logo */}
        <div className="flex items-center px-5 h-[72px] border-b border-gray-200/50 dark:border-white/[0.06] flex-shrink-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-purple-600 
                          flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary-500/20">
            <RiShieldUserLine className="text-white text-xl" />
          </div>
          <motion.div
            initial={false}
            animate={{
              opacity: collapsed ? 0 : 1,
              width: collapsed ? 0 : 'auto',
              marginLeft: collapsed ? 0 : 12,
            }}
            transition={sidebarTransition}
            className="overflow-hidden flex flex-col justify-center"
          >
            <h1 className="text-lg font-bold gradient-text whitespace-nowrap">FaceTrack</h1>
            <p className="text-[10px] text-gray-500 -mt-1 whitespace-nowrap">Smart Attendance</p>
          </motion.div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto overflow-x-hidden">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                `relative flex items-center px-4 py-3 rounded-xl transition-colors duration-300 border border-transparent cursor-pointer ${
                  isActive
                    ? 'text-primary-600 dark:text-white font-semibold'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/[0.06]'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon className={`text-xl flex-shrink-0 relative z-10 ${isActive ? 'text-primary-600 dark:text-primary-400' : ''}`} />
                  <motion.span
                    initial={false}
                    animate={{
                      opacity: collapsed ? 0 : 1,
                      width: collapsed ? 0 : 'auto',
                      marginLeft: collapsed ? 0 : 12,
                    }}
                    transition={sidebarTransition}
                    className="text-sm font-medium whitespace-nowrap overflow-hidden relative z-10"
                  >
                    {item.label}
                  </motion.span>
                  {isActive && (
                    <motion.div
                      layoutId="activeNavBubble"
                      className="absolute inset-0 bg-primary-500/10 dark:bg-primary-500/20 rounded-xl border border-primary-500/20 dark:border-primary-500/20 z-0"
                      transition={{ type: 'spring', stiffness: 220, damping: 26 }}
                    />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User Info & Logout */}
        <div className="p-3 border-t border-gray-200/50 dark:border-white/[0.06] flex-shrink-0">
          <button
            onClick={handleLogout}
            className="relative flex items-center px-4 py-3 rounded-xl text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 hover:bg-red-500/10 transition-colors duration-200 cursor-pointer w-full"
          >
            <HiOutlineArrowRightOnRectangle className="text-xl flex-shrink-0 relative z-10" />
            <motion.span
              initial={false}
              animate={{
                opacity: collapsed ? 0 : 1,
                width: collapsed ? 0 : 'auto',
                marginLeft: collapsed ? 0 : 12,
              }}
              transition={sidebarTransition}
              className="text-sm font-medium whitespace-nowrap overflow-hidden relative z-10"
            >
              Logout
            </motion.span>
          </button>
        </div>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 bg-white dark:bg-dark-50 border border-gray-200 dark:border-white/10 
                   rounded-full flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white
                   hover:bg-primary-500/20 transition-all z-50 shadow-md"
      >
        {collapsed ? <HiOutlineChevronRight className="text-xs" /> : <HiOutlineChevronLeft className="text-xs" />}
      </button>
    </motion.aside>
  );
}
