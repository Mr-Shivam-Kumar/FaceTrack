import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import Button from '../../components/ui/Button';
import { HiOutlineDocumentArrowDown, HiOutlineDocumentChartBar } from 'react-icons/hi2';

export default function ReportsPage() {
  const [departments, setDepartments] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [generating, setGenerating] = useState('');
  const [config, setConfig] = useState({ type: 'daily', department: '', subject: '', startDate: '', endDate: '', format: 'pdf' });

  useEffect(() => {
    const fetch = async () => {
      try {
        const [d, s] = await Promise.all([api.get('/departments'), api.get('/subjects')]);
        setDepartments(d.data.data || []);
        setSubjects(s.data.data || []);
      } catch (e) { console.error(e); }
    };
    fetch();
  }, []);

  const handleGenerate = async (format) => {
    const reportFormat = format || config.format;
    setGenerating(reportFormat);
    try {
      const response = await api.get(`/reports/${reportFormat}`, { 
        params: { ...config, format: reportFormat }, 
        responseType: 'blob' 
      });
      const ext = reportFormat === 'excel' ? 'xlsx' : reportFormat;
      const url = URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url; link.download = `attendance_${config.type}_report.${ext}`; link.click();
      URL.revokeObjectURL(url);
    } catch (err) { alert('Failed to generate report'); }
    finally { setGenerating(''); }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-6 transform-gpu will-change-transform"
    >
      <div><h1 className="text-2xl font-bold">Reports</h1><p className="text-gray-500 text-sm mt-1">Generate and export attendance reports</p></div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Config */}
        <div className="lg:col-span-2 glass-card p-6 space-y-5">
          <h3 className="text-lg font-semibold flex items-center gap-2"><HiOutlineDocumentChartBar className="text-primary-400" /> Report Configuration</h3>
          <div>
            <label className="text-sm text-gray-600 dark:text-gray-400 mb-2 block">Report Type</label>
            <div className="grid grid-cols-4 gap-2">
              {['daily', 'weekly', 'monthly', 'semester'].map(t => (
                <button key={t} onClick={() => setConfig({...config, type: t})}
                  className={`py-2.5 rounded-xl text-sm font-medium transition-all capitalize
                    ${config.type === t ? 'gradient-btn' : 'glass-card text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">Department</label>
              <select value={config.department} onChange={(e) => setConfig({...config, department: e.target.value})} className="input-field">
                <option value="">All Departments</option>{departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
              </select></div>
            <div><label className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">Subject</label>
              <select value={config.subject} onChange={(e) => setConfig({...config, subject: e.target.value})} className="input-field">
                <option value="">All Subjects</option>{subjects.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">Start Date</label><input type="date" value={config.startDate} onChange={(e) => setConfig({...config, startDate: e.target.value})} className="input-field" /></div>
            <div><label className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">End Date</label><input type="date" value={config.endDate} onChange={(e) => setConfig({...config, endDate: e.target.value})} className="input-field" /></div>
          </div>
        </div>

        {/* Export */}
        <div className="glass-card p-6 space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2"><HiOutlineDocumentArrowDown className="text-primary-400" /> Export</h3>
          <div className="space-y-3">
            {[
              { format: 'pdf', label: 'PDF Report', desc: 'Formatted PDF with tables and charts', color: 'from-red-500 to-rose-600' },
              { format: 'excel', label: 'Excel Spreadsheet', desc: 'XLSX file with formatted sheets', color: 'from-emerald-500 to-green-600' },
              { format: 'csv', label: 'CSV File', desc: 'Plain data for further analysis', color: 'from-blue-500 to-cyan-600' }
            ].map(opt => (
              <motion.button key={opt.format}
                whileHover={{ scale: 1.015, y: -2 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                onClick={() => { setConfig({...config, format: opt.format}); handleGenerate(opt.format); }}
                disabled={!!generating}
                className="w-full p-4 glass-card hover:border-primary-500/20 dark:hover:border-white/10 transition-[border-color,background-color,box-shadow] duration-300 text-left flex items-center gap-4 disabled:opacity-50 transform-gpu will-change-transform">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${opt.color} flex items-center justify-center flex-shrink-0`}>
                  <HiOutlineDocumentArrowDown className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium">{opt.label}</p>
                  <p className="text-xs text-gray-500">{opt.desc}</p>
                </div>
                <AnimatePresence>
                  {generating === opt.format && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.6 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.6 }}
                      transition={{ duration: 0.15 }}
                      className="ml-auto w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin flex-shrink-0"
                    />
                  )}
                </AnimatePresence>
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
