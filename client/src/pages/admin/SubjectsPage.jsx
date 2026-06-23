import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../../services/api';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash } from 'react-icons/hi2';
import { useAuth } from '../../contexts/AuthContext';

export default function SubjectsPage() {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [filterDept, setFilterDept] = useState('');

  const isHOD = user?.role === 'faculty' && user?.profile?.isHOD;
  const hodDept = user?.profile?.hodDepartment;

  const [form, setForm] = useState({ name: '', code: '', department: '', semester: 1, creditHours: 3 });

  const resetForm = () => {
    setForm({
      name: '',
      code: '',
      department: isHOD && hodDept ? hodDept : '',
      semester: 1,
      creditHours: 3
    });
  };

  useEffect(() => {
    if (isHOD && hodDept) {
      setForm(f => ({ ...f, department: hodDept }));
    }
  }, [user]);

  useEffect(() => { fetchAll(); }, []);
  useEffect(() => { fetchSubjects(); }, [filterDept]);

  const fetchAll = async () => {
    try {
      const [subRes, deptRes] = await Promise.all([api.get('/subjects'), api.get('/departments')]);
      setSubjects(subRes.data.data || []);
      setDepartments(deptRes.data.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchSubjects = async () => {
    try {
      const params = filterDept ? { department: filterDept } : {};
      const { data } = await api.get('/subjects', { params });
      setSubjects(data.data || []);
    } catch (err) { console.error(err); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) { await api.put(`/subjects/${editing._id}`, form); }
      else { await api.post('/subjects', form); }
      setShowModal(false); setEditing(null); resetForm(); fetchSubjects();
    } catch (err) { alert(err.response?.data?.message || 'Error'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this subject?')) return;
    try { await api.delete(`/subjects/${id}`); fetchSubjects(); } catch (err) { alert('Error'); }
  };

  const columns = [
    { key: 'code', label: 'Code', render: (r) => <span className="font-mono text-primary-400">{r.code}</span> },
    { key: 'name', label: 'Subject Name' },
    { key: 'department', label: 'Department', render: (r) => r.department?.code || 'N/A' },
    { key: 'semester', label: 'Semester', render: (r) => `Sem ${r.semester}` },
    { key: 'creditHours', label: 'Credits' },
    { key: 'actions', label: 'Actions', render: (r) => (
      <div className="flex gap-1">
        <button onClick={() => { setEditing(r); setForm({ name: r.name, code: r.code, department: r.department?._id || '', semester: r.semester, creditHours: r.creditHours || 3 }); setShowModal(true); }} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.06] text-gray-400 hover:text-primary-400"><HiOutlinePencil /></button>
        <button onClick={() => handleDelete(r._id)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.06] text-gray-400 hover:text-red-400"><HiOutlineTrash /></button>
      </div>
    )}
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-6 transform-gpu will-change-transform"
    >
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900 dark:text-white">Subjects</h1><p className="text-gray-500 text-sm mt-1">Manage subjects and course offerings</p></div>
        <Button onClick={() => { setEditing(null); resetForm(); setShowModal(true); }}><HiOutlinePlus className="mr-2 text-lg" /> Add Subject</Button>
      </div>
      <div className="flex gap-3">
        <select value={filterDept} onChange={(e) => setFilterDept(e.target.value)} className="input-field w-48"><option value="">All Departments</option>{departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}</select>
      </div>
      <DataTable columns={columns} data={subjects} loading={loading} searchable pagination />
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Subject' : 'Add Subject'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">Subject Name</label><input value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className="input-field" required /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">Code</label><input value={form.code} onChange={(e) => setForm({...form, code: e.target.value.toUpperCase()})} className="input-field" required /></div>
            <div><label className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">Credits</label><input type="number" value={form.creditHours} onChange={(e) => setForm({...form, creditHours: parseInt(e.target.value)})} className="input-field" min={1} max={6} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">Department</label><select value={form.department} onChange={(e) => setForm({...form, department: e.target.value})} className="input-field" required><option value="">Select</option>{departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}</select></div>
            <div><label className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">Semester</label><select value={form.semester} onChange={(e) => setForm({...form, semester: parseInt(e.target.value)})} className="input-field">{[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>{s}</option>)}</select></div>
          </div>
          <div className="flex justify-end gap-3 pt-4"><Button variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button><Button type="submit">{editing ? 'Update' : 'Create'}</Button></div>
        </form>
      </Modal>
    </motion.div>
  );
}
