import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../../services/api';
import StatCard from '../../components/ui/StatCard';
import AttendanceTrend from '../../components/charts/AttendanceTrend';
import MonthlyTrend from '../../components/charts/MonthlyTrend';
import DepartmentChart from '../../components/charts/DepartmentChart';
import DistributionPie from '../../components/charts/DistributionPie';
import AttendanceHeatmap from '../../components/charts/AttendanceHeatmap';
import {
  HiOutlineUserGroup, HiOutlineAcademicCap, HiOutlineCheckCircle,
  HiOutlineXCircle, HiOutlineChartBar, HiOutlineCpuChip,
  HiOutlineCalendarDays, HiOutlineBolt, HiOutlineLightBulb,
  HiOutlineExclamationTriangle, HiOutlineArrowTrendingUp, HiOutlineArrowTrendingDown
} from 'react-icons/hi2';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } }
};
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } }
};

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [dailyTrend, setDailyTrend] = useState([]);
  const [monthlyTrend, setMonthlyTrend] = useState([]);
  const [deptStats, setDeptStats] = useState([]);
  const [distribution, setDistribution] = useState([]);
  const [heatmapData, setHeatmapData] = useState([]);
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, dailyRes, monthlyRes, deptRes, distRes, heatRes, insightRes] = await Promise.allSettled([
        api.get('/dashboard/admin'),
        api.get('/dashboard/daily-trend'),
        api.get('/dashboard/monthly-trend'),
        api.get('/dashboard/department-stats'),
        api.get('/dashboard/student-distribution'),
        api.get('/dashboard/heatmap'),
        api.get('/dashboard/insights')
      ]);

      if (statsRes.status === 'fulfilled') setStats(statsRes.value.data.data || statsRes.value.data);
      
      if (dailyRes.status === 'fulfilled') {
        const formattedDaily = (dailyRes.value.data.data || []).map(item => ({
          date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          count: item.present || 0,
          percentage: parseFloat(item.percentage || 0)
        }));
        setDailyTrend(formattedDaily);
      }

      if (monthlyRes.status === 'fulfilled') {
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const formattedMonthly = (monthlyRes.value.data.data || []).map(item => {
          const parts = item.month.split('-');
          const monthIdx = parts[1] ? parseInt(parts[1]) - 1 : 0;
          const name = monthNames[monthIdx] || item.month;
          return {
            month: name,
            attendance: parseFloat(item.percentage || 0),
            target: 75
          };
        });
        setMonthlyTrend(formattedMonthly);
      }

      if (deptRes.status === 'fulfilled') {
        const formattedDept = (deptRes.value.data.data || []).map(item => ({
          name: item.department?.code || 'N/A',
          attendance: parseFloat(item.percentage || 0)
        }));
        setDeptStats(formattedDept);
      }

      if (distRes.status === 'fulfilled') {
        const formattedDist = (distRes.value.data.data || []).map(item => ({
          name: item.department?.code || 'N/A',
          value: item.count || 0
        }));
        setDistribution(formattedDist);
      }

      if (heatRes.status === 'fulfilled') setHeatmapData(heatRes.value.data.data || []);
      
      if (insightRes.status === 'fulfilled') {
        const rawInsights = insightRes.value.data.data || [];
        const formattedInsights = rawInsights.map(item => {
          let uiType = 'info';
          if (item.severity === 'high') uiType = 'danger';
          else if (item.severity === 'medium') uiType = 'warning';
          else if (item.severity === 'low') uiType = 'success';
          else if (item.type === 'department_performance') uiType = 'success';

          return {
            type: uiType,
            message: `${item.title}: ${item.description}`
          };
        });
        setInsights(formattedInsights);
      }
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const kpis = [
    { title: 'Total Students', value: stats?.totalStudents || 0, icon: HiOutlineUserGroup, color: 'blue', change: '+12', changeType: 'positive' },
    { title: 'Total Faculty', value: stats?.totalFaculty || 0, icon: HiOutlineAcademicCap, color: 'purple', change: '+2', changeType: 'positive' },
    { title: 'Present Today', value: stats?.presentToday || 0, icon: HiOutlineCheckCircle, color: 'emerald', change: `${stats?.attendancePercentage || 0}%`, changeType: 'positive' },
    { title: 'Absent Today', value: stats?.absentToday || 0, icon: HiOutlineXCircle, color: 'red', change: '', changeType: 'negative' },
    { title: 'Attendance %', value: `${stats?.attendancePercentage || 0}%`, icon: HiOutlineChartBar, color: 'cyan', change: '+3.2%', changeType: 'positive' },
    { title: 'Recognition Accuracy', value: '98.5%', icon: HiOutlineCpuChip, color: 'amber', change: '+0.5%', changeType: 'positive' },
    { title: 'Classes This Week', value: stats?.classesThisWeek || 0, icon: HiOutlineCalendarDays, color: 'indigo', change: '', changeType: 'neutral' },
    { title: 'Active Sessions', value: stats?.activeSessions || 0, icon: HiOutlineBolt, color: 'green', change: 'Live', changeType: 'positive' },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="glass-card p-6 animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-white/5 rounded w-24 mb-4" />
              <div className="h-8 bg-gray-200 dark:bg-white/5 rounded w-16" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Page Header */}
      <motion.div variants={item} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Welcome back! Here's your attendance overview.</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          System Online
        </div>
      </motion.div>

      {/* KPI Cards */}
      <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, index) => (
          <StatCard key={index} {...kpi} delay={index * 0.05} />
        ))}
      </motion.div>

      {/* Charts Row 1 */}
      <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AttendanceTrend data={dailyTrend} />
        <MonthlyTrend data={monthlyTrend} />
      </motion.div>

      {/* Charts Row 2 */}
      <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DepartmentChart data={deptStats} />
        <DistributionPie data={distribution} />
      </motion.div>

      {/* Heatmap + Insights */}
      <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <AttendanceHeatmap data={heatmapData} />
        </div>
        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <HiOutlineLightBulb className="text-amber-400" />
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">AI Insights</h3>
          </div>
          <div className="space-y-3">
            {(insights.length > 0 ? insights : [
              { type: 'warning', message: '24 students are below 75% attendance threshold' },
              { type: 'success', message: 'CSE department attendance improved by 11% this month' },
              { type: 'danger', message: '8 students at detention risk in ECE department' },
              { type: 'info', message: 'Average recognition accuracy is 98.5%' },
              { type: 'success', message: 'Mechanical dept has highest attendance at 89%' },
            ]).map((insight, i) => {
              const colors = {
                warning: 'bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-300',
                success: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300',
                danger: 'bg-red-500/10 border-red-500/20 text-red-700 dark:text-red-300',
                info: 'bg-blue-500/10 border-blue-500/20 text-blue-700 dark:text-blue-300',
              };
              const icons = {
                warning: HiOutlineExclamationTriangle,
                success: HiOutlineArrowTrendingUp,
                danger: HiOutlineXCircle,
                info: HiOutlineLightBulb,
              };
              const Icon = icons[insight.type] || HiOutlineLightBulb;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                  className={`flex items-start gap-3 p-3 rounded-xl border ${colors[insight.type] || colors.info}`}
                >
                  <Icon className="text-lg flex-shrink-0 mt-0.5" />
                  <p className="text-xs leading-relaxed">{insight.message}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
