import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../../services/api';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineBuildingOffice2, HiOutlineUserGroup, HiOutlineAcademicCap } from 'react-icons/hi2';

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', code: '', hodName: '' });

  useEffect(() => { fetchDepartments(); }, []);

  const fetchDepartments = async () => {
    try {
      const { data } = await api.get('/departments');
      setDepartments(data.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) { await api.put(`/departments/${editing._id}`, form); }
      else { await api.post('/departments', form); }
      setShowModal(false); setEditing(null); fetchDepartments();
    } catch (err) { alert(err.response?.data?.message || 'Error'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this department?')) return;
    try { await api.delete(`/departments/${id}`); fetchDepartments(); }
    catch (err) { alert(err.response?.data?.message || 'Error'); }
  };

  const colors = ['from-blue-500 to-cyan-500', 'from-purple-500 to-pink-500', 'from-emerald-500 to-green-500', 'from-amber-500 to-orange-500', 'from-rose-500 to-red-500'];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Departments</h1>
          <p className="text-gray-500 text-sm mt-1">Manage departments and organizational structure</p>
        </div>
        <Button onClick={() => { setEditing(null); setForm({ name: '', code: '', hodName: '' }); setShowModal(true); }}>
          <HiOutlinePlus className="mr-2 text-lg" /> Add Department
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="glass-card p-6 animate-pulse"><div className="h-6 bg-gray-200 dark:bg-white/5 rounded w-32 mb-4" /><div className="h-4 bg-gray-200 dark:bg-white/5 rounded w-20" /></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {departments.map((dept, i) => (
            <motion.div key={dept._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className="glass-card p-6 hover:border-gray-200 dark:hover:border-white/10 transition-all group">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colors[i % colors.length]} flex items-center justify-center shadow-lg`}>
                  <HiOutlineBuildingOffice2 className="text-white text-xl" />
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => { setEditing(dept); setForm({ name: dept.name, code: dept.code, hodName: dept.hodName || '' }); setShowModal(true); }} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.06] text-gray-400"><HiOutlinePencil /></button>
                  <button onClick={() => handleDelete(dept._id)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.06] text-gray-400 hover:text-red-400"><HiOutlineTrash /></button>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{dept.name}</h3>
              <p className="text-sm text-gray-500 mb-4">Code: {dept.code}</p>
              {dept.hodName && <p className="text-xs text-gray-500">HOD: {dept.hodName}</p>}
              <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-white/[0.06]">
                <div className="flex items-center gap-1.5 text-xs text-gray-500"><HiOutlineUserGroup />{dept.studentCount || 0} Students</div>
                <div className="flex items-center gap-1.5 text-xs text-gray-500"><HiOutlineAcademicCap />{dept.facultyCount || 0} Faculty</div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Department' : 'Add Department'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">Department Name</label>
            <input value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className="input-field" required placeholder="e.g., Computer Science & Engineering" /></div>
          <div><label className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">Code</label>
            <input value={form.code} onChange={(e) => setForm({...form, code: e.target.value.toUpperCase()})} className="input-field" required placeholder="e.g., CSE" maxLength={5} /></div>
          <div><label className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">HOD Name</label>
            <input value={form.hodName} onChange={(e) => setForm({...form, hodName: e.target.value})} className="input-field" placeholder="e.g., Dr. Rajesh Sharma" /></div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit">{editing ? 'Update' : 'Create'}</Button>
          </div>
        </form>
      </Modal>
    </motion.div>
  );
}
