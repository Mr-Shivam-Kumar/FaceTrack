import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineBell, HiOutlineSun, HiOutlineMoon, HiOutlineMagnifyingGlass } from 'react-icons/hi2';
import NotificationDrawer from '../notifications/NotificationDrawer';
import api from '../../services/api';

export default function Header() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { unreadCount } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  
  const profileRef = useRef(null);
  const searchContainerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfile(false);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setShowResults(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults(null);
      setSearching(false);
      return;
    }

    setSearching(true);
    const delayDebounceFn = setTimeout(async () => {
      try {
        const { data } = await api.get('/search', { params: { q: searchQuery } });
        setSearchResults(data.data || {});
      } catch (err) {
        console.error(err);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  return (
    <>
      <header className="glass-header sticky top-0 z-30 px-6 h-[72px] flex items-center justify-between">
        {/* Search */}
        <div ref={searchContainerRef} className="relative w-96 max-w-md">
          <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search students, faculty, subjects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setShowResults(true)}
            className="w-full pl-10 pr-10 py-2.5 bg-gray-100 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.06] rounded-xl
                       text-sm text-gray-800 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:border-primary-500/30
                       focus:bg-gray-200/50 dark:focus:bg-white/[0.06] transition-all"
          />
          {searching ? (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-primary-500/20 border-t-primary-500 rounded-full animate-spin" />
          ) : (
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 dark:text-gray-600 
                           bg-gray-200/50 dark:bg-white/[0.06] px-1.5 py-0.5 rounded border border-gray-300 dark:border-white/[0.06]">⌘K</kbd>
          )}

          <AnimatePresence>
            {showResults && searchResults && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute left-0 mt-2 w-full max-h-[350px] overflow-y-auto glass-card p-3 shadow-2xl space-y-4"
              >
                {/* Students */}
                {searchResults.students && searchResults.students.length > 0 && (
                  <div>
                    <p className="text-[10px] text-primary-500 dark:text-primary-400 font-mono tracking-wider uppercase mb-1.5 px-2">Students</p>
                    <div className="space-y-1">
                      {searchResults.students.map((student) => (
                        <div key={student._id} className="flex items-center justify-between p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/[0.04] transition-colors text-xs cursor-pointer" onClick={() => setShowResults(false)}>
                          <div>
                            <p className="font-semibold text-gray-800 dark:text-gray-200">{student.user?.name}</p>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400">{student.rollNumber} • {student.department?.code} Sem {student.semester}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Faculty */}
                {searchResults.faculty && searchResults.faculty.length > 0 && (
                  <div>
                    <p className="text-[10px] text-primary-500 dark:text-primary-400 font-mono tracking-wider uppercase mb-1.5 px-2">Faculty</p>
                    <div className="space-y-1">
                      {searchResults.faculty.map((f) => (
                        <div key={f._id} className="flex items-center justify-between p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/[0.04] transition-colors text-xs cursor-pointer" onClick={() => setShowResults(false)}>
                          <div>
                            <p className="font-semibold text-gray-800 dark:text-gray-200">{f.user?.name}</p>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400">{f.designation} • {f.department?.code}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Departments */}
                {searchResults.departments && searchResults.departments.length > 0 && (
                  <div>
                    <p className="text-[10px] text-primary-500 dark:text-primary-400 font-mono tracking-wider uppercase mb-1.5 px-2">Departments</p>
                    <div className="space-y-1">
                      {searchResults.departments.map((dept) => (
                        <div key={dept._id} className="flex items-center justify-between p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/[0.04] transition-colors text-xs cursor-pointer" onClick={() => setShowResults(false)}>
                          <div>
                            <p className="font-semibold text-gray-800 dark:text-gray-200">{dept.name} ({dept.code})</p>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400">HOD: {dept.hodName || 'N/A'}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Subjects */}
                {searchResults.subjects && searchResults.subjects.length > 0 && (
                  <div>
                    <p className="text-[10px] text-primary-500 dark:text-primary-400 font-mono tracking-wider uppercase mb-1.5 px-2">Subjects</p>
                    <div className="space-y-1">
                      {searchResults.subjects.map((sub) => (
                        <div key={sub._id} className="flex items-center justify-between p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/[0.04] transition-colors text-xs cursor-pointer" onClick={() => setShowResults(false)}>
                          <div>
                            <p className="font-semibold text-gray-800 dark:text-gray-200">{sub.name} ({sub.code})</p>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400">{sub.department?.code} • Sem {sub.semester}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {Object.values(searchResults).every(arr => !arr || arr.length === 0) && (
                  <p className="text-xs text-gray-500 italic text-center py-4">No results found.</p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-white/[0.06] text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all"
          >
            {theme === 'dark' ? <HiOutlineSun className="text-xl" /> : <HiOutlineMoon className="text-xl" />}
          </button>

          {/* Notifications */}
          <button
            onClick={() => setShowNotifications(true)}
            className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-white/[0.06] text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all relative"
          >
            <HiOutlineBell className="text-xl" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 rounded-full 
                             text-[10px] text-white flex items-center justify-center font-bold animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Profile dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setShowProfile(!showProfile)}
              className="flex items-center gap-3 pl-3 pr-2 py-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-all"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-purple-600 
                              flex items-center justify-center text-white text-sm font-bold">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="text-left hidden md:block">
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{user?.name}</p>
                <p className="text-[11px] text-gray-500">
                  {user?.role === 'faculty' && user?.profile?.isHOD 
                    ? 'Faculty | HOD' 
                    : (user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : '')}
                </p>
              </div>
            </button>

            <AnimatePresence>
              {showProfile && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-56 bg-white dark:bg-dark-50 border border-gray-200 dark:border-white/[0.06] rounded-2xl py-2 shadow-2xl"
                >
                  <div className="px-4 py-3 border-b border-gray-200/50 dark:border-white/[0.06]">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
                  </div>
                  <button
                    onClick={() => { logout(); setShowProfile(false); }}
                    className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-500/10 transition-colors"
                  >
                    Sign out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Notification Drawer */}
      <NotificationDrawer isOpen={showNotifications} onClose={() => setShowNotifications(false)} />
    </>
  );
}
