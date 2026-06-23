import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../../services/api';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import { HiOutlineUserPlus, HiOutlinePencil, HiOutlineTrash } from 'react-icons/hi2';
import { useAuth } from '../../contexts/AuthContext';

export default function FacultyPage() {
  const { user } = useAuth();
  const [faculty, setFaculty] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);

  const isHOD = user?.role === 'faculty' && user?.profile?.isHOD;
  const hodDept = user?.profile?.hodDepartment;

  const [form, setForm] = useState({
    name: '',
    email: '',
    employeeId: '',
    department: '',
    designation: 'Assistant Professor',
    subjects: [],
    password: ''
  });

  const resetForm = () => {
    setForm({
      name: '',
      email: '',
      employeeId: '',
      department: isHOD && hodDept ? hodDept : '',
      designation: 'Assistant Professor',
      subjects: [],
      password: ''
    });
  };

  useEffect(() => {
    if (isHOD && hodDept) {
      setForm(f => ({ ...f, department: hodDept }));
    }
  }, [user]);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      const [facRes, deptRes, subRes] = await Promise.all([
        api.get('/faculty'), api.get('/departments'), api.get('/subjects')
      ]);
      setFaculty(facRes.data.data || []);
      setDepartments(deptRes.data.data || []);
      setSubjects(subRes.data.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) { await api.put(`/faculty/${editing._id}`, form); }
      else { await api.post('/faculty', form); }
      setShowModal(false); setEditing(null); resetForm(); fetchAll();
    } catch (err) { alert(err.response?.data?.message || 'Error'); }
  };

  const handleEdit = (f) => {
    setEditing(f);
    setForm({ name: f.user?.name || '', email: f.user?.email || '', employeeId: f.employeeId, department: f.department?._id || '', designation: f.designation || '', subjects: f.subjects?.map(s => s._id || s) || [], password: '' });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this faculty member?')) return;
    try { await api.delete(`/faculty/${id}`); fetchAll(); }
    catch (err) { alert(err.response?.data?.message || 'Error'); }
  };

  const columns = [
    { key: 'employeeId', label: 'Emp ID', render: (r) => <span className="font-mono text-primary-400">{r.employeeId}</span> },
    { key: 'name', label: 'Name', render: (r) => (
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white text-xs font-bold">
          {r.user?.name?.charAt(0) || '?'}
        </div>
        <div>
          <p className="text-sm font-medium">{r.user?.name || 'N/A'}</p>
          <p className="text-xs text-gray-500">{r.user?.email}</p>
        </div>
      </div>
    )},
    { key: 'department', label: 'Department', render: (r) => r.department?.code || 'N/A' },
    { key: 'designation', label: 'Designation', render: (r) => <span className="text-xs text-gray-600 dark:text-gray-400">{r.designation || 'N/A'}</span> },
    { key: 'subjects', label: 'Subjects', render: (r) => <span className="text-xs text-gray-600 dark:text-gray-400">{r.subjects?.length || 0} assigned</span> },
    { key: 'actions', label: 'Actions', render: (r) => (
      <div className="flex gap-1">
        <button onClick={() => handleEdit(r)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.06] text-gray-400 hover:text-primary-400"><HiOutlinePencil /></button>
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
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Faculty</h1>
          <p className="text-gray-500 text-sm mt-1">Manage faculty members and their subject assignments</p>
        </div>
        <Button onClick={() => { setEditing(null); resetForm(); setShowModal(true); }}>
          <HiOutlineUserPlus className="mr-2 text-lg" /> Add Faculty
        </Button>
      </div>
      <DataTable columns={columns} data={faculty} loading={loading} searchable pagination />
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Faculty' : 'Add Faculty'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">Full Name</label>
              <input value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className="input-field" required /></div>
            <div><label className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">Email</label>
              <input type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} className="input-field" required /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">Employee ID</label>
              <input value={form.employeeId} onChange={(e) => setForm({...form, employeeId: e.target.value})} className="input-field" required /></div>
            <div><label className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">Department</label>
              <select value={form.department} onChange={(e) => setForm({...form, department: e.target.value})} className="input-field" required>
                <option value="">Select</option>
                {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
              </select></div>
          </div>
          <div><label className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">Designation</label>
            <select value={form.designation} onChange={(e) => setForm({...form, designation: e.target.value})} className="input-field">
              <option>Assistant Professor</option><option>Associate Professor</option><option>Professor</option><option>HOD</option>
            </select></div>
          <div>
            <label className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">Assign Subjects (Filtered by Department)</label>
            <div className="max-h-40 overflow-y-auto border border-gray-200 dark:border-white/10 rounded-xl p-3 bg-gray-50 dark:bg-white/[0.01] space-y-2">
              {subjects
                .filter(s => !form.department || s.department?._id === form.department || s.department === form.department)
                .map(sub => {
                  const isChecked = form.subjects.includes(sub._id);
                  return (
                    <label key={sub._id} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setForm({ ...form, subjects: [...form.subjects, sub._id] });
                          } else {
                            setForm({ ...form, subjects: form.subjects.filter(id => id !== sub._id) });
                          }
                        }}
                        className="rounded border-gray-300 dark:border-white/10 text-primary-500 focus:ring-0 focus:ring-offset-0 bg-transparent"
                      />
                      <span>{sub.name} ({sub.code})</span>
                    </label>
                  );
                })}
              {subjects.filter(s => !form.department || s.department?._id === form.department || s.department === form.department).length === 0 && (
                <p className="text-xs text-gray-500 italic">No subjects available for this department.</p>
              )}
            </div>
          </div>
          {!editing && (
            <div>
              <label className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">Password</label>
              <input type="password" value={form.password} onChange={(e) => setForm({...form, password: e.target.value})} className="input-field" required placeholder="Minimum 6 characters" />
            </div>
          )}
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit">{editing ? 'Update' : 'Create'}</Button>
          </div>
        </form>
      </Modal>
    </motion.div>
  );
}
