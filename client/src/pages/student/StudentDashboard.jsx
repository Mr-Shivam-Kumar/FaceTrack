import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import StatCard from '../../components/ui/StatCard';
import Badge from '../../components/ui/Badge';
import AttendanceHeatmap from '../../components/charts/AttendanceHeatmap';
import { HiOutlineChartBar, HiOutlineCalendarDays, HiOutlineCheckCircle, HiOutlineXCircle, HiOutlineExclamationTriangle } from 'react-icons/hi2';
import { formatDate, getAttendanceColor, getStatusColors } from '../../utils/helpers';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [subjectStats, setSubjectStats] = useState([]);
  const [recentRecords, setRecentRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const myStudentId = user?.profile?._id;
      if (myStudentId) {
        const { data: statsData } = await api.get(`/students/${myStudentId}/stats`);
        setStats(statsData.data || statsData);
        setSubjectStats(statsData.data?.subjectWise || statsData.subjectWise || []);
        
        const { data: attendanceData } = await api.get(`/students/${myStudentId}/attendance`);
        setRecentRecords((attendanceData.data || []).slice(0, 10));
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const overallPercent = stats?.overallPercentage || stats?.attendancePercentage || 82;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-6 transform-gpu will-change-transform"
    >
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome, {user?.name?.split(' ')[0] || 'Student'}!</h1>
        <p className="text-gray-500 text-sm mt-1">Here's your attendance summary</p>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Overall Attendance" value={`${overallPercent}%`} icon={HiOutlineChartBar} color={overallPercent >= 75 ? 'emerald' : 'red'} />
        <StatCard title="Classes Attended" value={stats?.totalPresent || 0} icon={HiOutlineCheckCircle} color="green" />
        <StatCard title="Classes Missed" value={stats?.totalAbsent || 0} icon={HiOutlineXCircle} color="red" />
        <StatCard title="Total Classes" value={stats?.totalClasses || 0} icon={HiOutlineCalendarDays} color="blue" />
      </div>

      {/* Warning if below 75% */}
      {overallPercent < 75 && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-300">
          <HiOutlineExclamationTriangle className="text-xl flex-shrink-0" />
          <div>
            <p className="text-sm font-medium">Low Attendance Warning</p>
            <p className="text-xs text-red-500 dark:text-red-400/70">Your attendance is below 75%. Please attend classes regularly to avoid detention.</p>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance by subject */}
        <div className="glass-card p-6">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Subject-wise Attendance</h3>
          <div className="space-y-4">
            {(subjectStats.length > 0 ? subjectStats : [
              { subject: 'Data Structures', percentage: 88 },
              { subject: 'DBMS', percentage: 76 },
              { subject: 'Operating Systems', percentage: 82 },
              { subject: 'Computer Networks', percentage: 70 },
            ]).map((s, i) => (
              <div key={i}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-gray-800 dark:text-gray-300">{s.subject?.name || s.subject || s.subjectName}</span>
                  <span className={getAttendanceColor(s.percentage || s.attendancePercentage || 0)}>{s.percentage || s.attendancePercentage || 0}%</span>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-dark-200 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${s.percentage || s.attendancePercentage || 0}%` }}
                    transition={{ duration: 1, delay: i * 0.2 }}
                    className={`h-full rounded-full ${(s.percentage || s.attendancePercentage || 0) >= 75 ? 'bg-gradient-to-r from-emerald-500 to-green-500' : 'bg-gradient-to-r from-red-500 to-rose-500'}`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Overall donut */}
        <div className="glass-card p-6">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Attendance Overview</h3>
          <div className="flex items-center justify-center py-8">
            <div className="relative w-40 h-40">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none" stroke="rgba(148,163,184,0.3)" strokeWidth="3" />
                <motion.path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none" stroke={overallPercent >= 75 ? '#10b981' : '#f43f5e'} strokeWidth="3" strokeLinecap="round"
                  initial={{ strokeDasharray: '0, 100' }}
                  animate={{ strokeDasharray: `${overallPercent}, 100` }}
                  transition={{ duration: 1.5, ease: 'easeOut' }} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-3xl font-bold ${overallPercent >= 75 ? 'text-emerald-400' : 'text-red-400'}`}>{overallPercent}%</span>
                <span className="text-xs text-gray-500">Overall</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Records */}
      <div className="glass-card p-6">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Recent Attendance</h3>
        <div className="space-y-2">
          {(recentRecords.length > 0 ? recentRecords : [
            { date: new Date(), subject: { name: 'Data Structures' }, status: 'present' },
            { date: new Date(Date.now() - 86400000), subject: { name: 'DBMS' }, status: 'present' },
            { date: new Date(Date.now() - 172800000), subject: { name: 'OS' }, status: 'absent' },
          ]).map((r, i) => {
            const colors = getStatusColors(r.status);
            return (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${colors.dot}`} />
                  <div>
                    <p className="text-sm">{r.subject?.name || 'N/A'}</p>
                    <p className="text-xs text-gray-500">{formatDate(r.date)}</p>
                  </div>
                </div>
                <Badge color={r.status === 'present' ? 'success' : r.status === 'late' ? 'warning' : 'danger'} variant="dot">
                  {r.status}
                </Badge>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
