import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotifications } from '../../contexts/NotificationContext';
import { HiOutlineXMark, HiOutlineBell, HiOutlineExclamationTriangle, HiOutlineInformationCircle } from 'react-icons/hi2';
import { formatTimeAgo } from '../../utils/helpers';

const typeIcons = {
  low_attendance: HiOutlineExclamationTriangle,
  absence_alert: HiOutlineExclamationTriangle,
  system: HiOutlineInformationCircle,
  session_started: HiOutlineBell,
  attendance_marked: HiOutlineBell,
};

const typeColors = {
  low_attendance: 'text-amber-400 bg-amber-500/10',
  absence_alert: 'text-red-400 bg-red-500/10',
  system: 'text-blue-400 bg-blue-500/10',
  session_started: 'text-green-400 bg-green-500/10',
  attendance_marked: 'text-emerald-400 bg-emerald-500/10',
};

export default function NotificationDrawer({ isOpen, onClose }) {
  const { notifications, markAsRead, markAllAsRead } = useNotifications();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-96 glass-sidebar z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 h-[72px] border-b border-gray-200/50 dark:border-white/[0.06]">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Notifications</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors font-medium"
                >
                  Mark all read
                </button>
                <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.06] text-gray-500 dark:text-gray-400 transition-colors">
                  <HiOutlineXMark className="text-xl" />
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                  <HiOutlineBell className="text-4xl mb-3 opacity-30" />
                  <p className="text-sm">No notifications yet</p>
                </div>
              ) : (
                notifications.map((notif, idx) => {
                  const Icon = typeIcons[notif.type] || HiOutlineBell;
                  const colorClass = typeColors[notif.type] || 'text-gray-400 bg-gray-500/10';
                  return (
                    <motion.div
                      key={notif._id || idx}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      onClick={() => markAsRead(notif._id)}
                      className={`flex gap-3 p-4 rounded-xl cursor-pointer transition-all hover:bg-gray-100 dark:hover:bg-white/[0.04]
                                ${notif.isRead ? 'opacity-60' : 'bg-gray-50/50 dark:bg-white/[0.02]'}`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                        <Icon className="text-lg" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{notif.title}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 line-clamp-2">{notif.message}</p>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1.5">{formatTimeAgo(notif.createdAt)}</p>
                      </div>
                      {!notif.isRead && (
                        <div className="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0 mt-2" />
                      )}
                    </motion.div>
                  );
                })
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
