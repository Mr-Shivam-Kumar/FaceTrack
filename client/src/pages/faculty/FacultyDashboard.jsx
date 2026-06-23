import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import StatCard from '../../components/ui/StatCard';
import AttendanceTrend from '../../components/charts/AttendanceTrend';
import { useAuth } from '../../contexts/AuthContext';
import { HiOutlineCamera, HiOutlineCalendarDays, HiOutlineUserGroup, HiOutlineChartBar, HiOutlineClipboardDocumentList } from 'react-icons/hi2';
import { formatDate, formatTime } from '../../utils/helpers';

export default function FacultyDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes] = await Promise.allSettled([
          api.get('/dashboard/faculty')
        ]);
        if (statsRes.status === 'fulfilled') {
          const data = statsRes.value.data.data || statsRes.value.data;
          setStats(data);
          setSessions(data.recentSessions || []);
        }
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  const kpis = [
    { title: 'My Subjects', value: stats?.subjectCount || 0, icon: HiOutlineClipboardDocumentList, color: 'purple' },
    { title: 'Total Students', value: stats?.studentCount || 0, icon: HiOutlineUserGroup, color: 'blue' },
    { title: 'Classes Today', value: stats?.classesToday || 0, icon: HiOutlineCalendarDays, color: 'emerald' },
    { title: 'Avg Attendance', value: `${stats?.avgAttendance || 0}%`, icon: HiOutlineChartBar, color: 'cyan' },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Welcome, {user?.name || 'Faculty'}!</h1>
          <p className="text-gray-500 text-sm mt-1">Here's your teaching overview for today</p>
        </div>
        <Link to="/faculty/take-attendance">
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            className="gradient-btn px-6 py-3 flex items-center gap-2 text-sm font-medium">
            <HiOutlineCamera className="text-lg" />
            Start Attendance
          </motion.button>
        </Link>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => <StatCard key={i} {...kpi} />)}
      </div>

      {/* Recent Sessions */}
      <div className="glass-card p-6">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Recent Attendance Sessions</h3>
        {sessions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <HiOutlineClipboardDocumentList className="text-3xl mx-auto mb-2 opacity-30" />
            <p className="text-sm">No recent sessions</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.slice(0, 5).map((s, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-white/[0.02] hover:bg-gray-100 dark:hover:bg-white/[0.04] transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center"><HiOutlineCalendarDays className="text-primary-400" /></div>
                  <div>
                    <p className="text-sm font-medium">{s.subject?.name || 'N/A'}</p>
                    <p className="text-xs text-gray-500">{formatDate(s.date)} • {formatTime(s.startTime)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-emerald-400">{s.totalPresent || 0} present</p>
                  <p className="text-xs text-gray-500">{s.totalAbsent || 0} absent</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
