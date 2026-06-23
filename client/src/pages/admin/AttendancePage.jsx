import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../../services/api';
import DataTable from '../../components/ui/DataTable';
import Badge from '../../components/ui/Badge';
import { HiOutlineFunnel, HiOutlineArrowDownTray } from 'react-icons/hi2';
import { formatDate, formatTime, getStatusColors } from '../../utils/helpers';
import { useAuth } from '../../contexts/AuthContext';

export default function AttendancePage() {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ department: '', subject: '', startDate: '', endDate: '', status: '' });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      if (user?.role === 'student') {
        const subRes = await api.get('/subjects');
        setSubjects(subRes.data.data || []);
      } else {
        const [deptRes, subRes] = await Promise.all([api.get('/departments'), api.get('/subjects')]);
        setDepartments(deptRes.data.data || []);
        setSubjects(subRes.data.data || []);
      }
      await fetchRecords();
    } catch (err) {
      console.error(err);
      await fetchRecords();
    }
  };

  const fetchRecords = async () => {
    setLoading(true);
    try {
      let recordsList = [];
      if (user?.role === 'student') {
        const studentId = user?.profile?._id;
        if (studentId) {
          const { data } = await api.get(`/students/${studentId}/attendance`, {
            params: {
              subject: filters.subject,
              startDate: filters.startDate,
              endDate: filters.endDate
            }
          });
          recordsList = data.data || data || [];
          if (filters.status) {
            recordsList = recordsList.filter(r => r.status === filters.status);
          }
        }
      } else {
        const { data } = await api.get('/attendance', { params: filters });
        recordsList = data.data?.records || data.records || data.data || [];
      }
      setRecords(recordsList);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchRecords(); }, [filters]);

  const handleExport = async (format) => {
    try {
      const response = await api.get(`/reports/${format}`, { params: filters, responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `attendance_report.${format === 'excel' ? 'xlsx' : format}`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) { alert('Export failed: ' + (err.response?.data?.message || err.message)); }
  };

  const columns = [
    ...(user?.role !== 'student' ? [{ key: 'student', label: 'Student', render: (r) => (
      <div><p className="text-sm font-medium">{r.student?.user?.name || r.studentName || 'N/A'}</p>
        <p className="text-xs text-gray-500">{r.student?.rollNumber || ''}</p></div>
    )}] : []),
    { key: 'subject', label: 'Subject', render: (r) => r.subject?.name || 'N/A' },
    { key: 'date', label: 'Date', render: (r) => formatDate(r.date) },
    { key: 'time', label: 'Time', render: (r) => formatTime(r.markedAt || r.createdAt) },
    { key: 'status', label: 'Status', render: (r) => {
      const colors = getStatusColors(r.status);
      return <Badge color={r.status === 'present' ? 'success' : r.status === 'late' ? 'warning' : 'danger'} variant="dot">{r.status}</Badge>;
    }},
    { key: 'confidence', label: 'Confidence', render: (r) => r.faceConfidence ? `${(r.faceConfidence * 100).toFixed(1)}%` : '—' },
    { key: 'method', label: 'Method', render: (r) => <span className="text-xs text-gray-500 capitalize">{r.verificationMethod || 'manual'}</span> }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-6 transform-gpu will-change-transform"
    >
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Attendance Records</h1><p className="text-gray-500 text-sm mt-1">View and manage attendance data</p></div>
        {user?.role !== 'student' && (
          <div className="flex gap-2">
            <button onClick={() => handleExport('pdf')} className="flex items-center gap-2 px-4 py-2 glass-card text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"><HiOutlineArrowDownTray /> PDF</button>
            <button onClick={() => handleExport('excel')} className="flex items-center gap-2 px-4 py-2 glass-card text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"><HiOutlineArrowDownTray /> Excel</button>
            <button onClick={() => handleExport('csv')} className="flex items-center gap-2 px-4 py-2 glass-card text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"><HiOutlineArrowDownTray /> CSV</button>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="glass-card p-4">
        <div className="flex items-center gap-2 mb-3"><HiOutlineFunnel className="text-gray-400" /><span className="text-sm text-gray-400">Filters</span></div>
        <div className={`grid grid-cols-2 ${user?.role === 'student' ? 'md:grid-cols-4' : 'md:grid-cols-5'} gap-3`}>
          {user?.role !== 'student' && (
            <select value={filters.department} onChange={(e) => setFilters({...filters, department: e.target.value})} className="input-field text-sm">
              <option value="">All Departments</option>{departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
            </select>
          )}
          <select value={filters.subject} onChange={(e) => setFilters({...filters, subject: e.target.value})} className="input-field text-sm">
            <option value="">All Subjects</option>{subjects.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
          </select>
          <input type="date" value={filters.startDate} onChange={(e) => setFilters({...filters, startDate: e.target.value})} className="input-field text-sm" />
          <input type="date" value={filters.endDate} onChange={(e) => setFilters({...filters, endDate: e.target.value})} className="input-field text-sm" />
          <select value={filters.status} onChange={(e) => setFilters({...filters, status: e.target.value})} className="input-field text-sm">
            <option value="">All Status</option><option value="present">Present</option><option value="absent">Absent</option><option value="late">Late</option>
          </select>
        </div>
      </div>

      <DataTable columns={columns} data={records} loading={loading} searchable pagination />
    </motion.div>
  );
}
