import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import {
  HiOutlineHome, HiOutlineUserGroup, HiOutlineAcademicCap,
  HiOutlineBuildingOffice2, HiOutlineBookOpen, HiOutlineClipboardDocumentList,
  HiOutlineDocumentChartBar, HiOutlineCog6Tooth, HiOutlineCamera,
  HiOutlineChevronLeft, HiOutlineChevronRight, HiOutlineArrowRightOnRectangle,
  HiOutlineIdentification, HiOutlineChartBarSquare, HiOutlineDocumentText
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

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 80 : 280 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="glass-sidebar h-screen flex flex-col fixed left-0 top-0 z-40"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 h-[72px] border-b border-gray-200/50 dark:border-white/[0.06]">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-purple-600 
                        flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary-500/20">
          <RiShieldUserLine className="text-white text-xl" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              <h1 className="text-lg font-bold gradient-text whitespace-nowrap">FaceTrack</h1>
              <p className="text-[10px] text-gray-500 -mt-1">Smart Attendance</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.end}
            className={({ isActive }) => isActive ? 'nav-item-active' : 'nav-item'}
          >
            {({ isActive }) => (
              <>
                <item.icon className={`text-xl flex-shrink-0 ${isActive ? 'text-primary-400' : ''}`} />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="text-sm font-medium whitespace-nowrap"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User Info & Logout */}
      <div className="p-3 border-t border-gray-200/50 dark:border-white/[0.06]">
        <button
          onClick={handleLogout}
          className="nav-item w-full text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 hover:bg-red-500/10"
        >
          <HiOutlineArrowRightOnRectangle className="text-xl flex-shrink-0" />
          {!collapsed && <span className="text-sm font-medium">Logout</span>}
        </button>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 bg-white dark:bg-dark-50 border border-gray-200 dark:border-white/10 
                   rounded-full flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white
                   hover:bg-primary-500/20 transition-all z-50"
      >
        {collapsed ? <HiOutlineChevronRight className="text-xs" /> : <HiOutlineChevronLeft className="text-xs" />}
      </button>
    </motion.aside>
  );
}
