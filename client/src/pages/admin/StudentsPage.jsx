import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../../services/api';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import FaceRegistration from '../../components/face/FaceRegistration';
import { HiOutlineUserPlus, HiOutlinePencil, HiOutlineTrash, HiOutlineCamera } from 'react-icons/hi2';
import { useAuth } from '../../contexts/AuthContext';

export default function StudentsPage() {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showFaceModal, setShowFaceModal] = useState(false);
  const [faceStudent, setFaceStudent] = useState(null);
  const [editingStudent, setEditingStudent] = useState(null);
  const [filterDept, setFilterDept] = useState('');
  const [filterSemester, setFilterSemester] = useState('');
  
  const isHOD = user?.role === 'faculty' && user?.profile?.isHOD;
  const hodDept = user?.profile?.hodDepartment;

  const [form, setForm] = useState({ 
    name: '', 
    email: '', 
    rollNumber: '', 
    department: '', 
    semester: 3, 
    section: 'A', 
    batch: '2023-2027', 
    password: '' 
  });

  const resetForm = () => {
    setForm({
      name: '',
      email: '',
      rollNumber: '',
      department: isHOD && hodDept ? hodDept : '',
      semester: 3,
      section: 'A',
      batch: '2023-2027',
      password: ''
    });
  };

  useEffect(() => { 
    fetchStudents(); 
    fetchDepartments(); 
  }, []);

  useEffect(() => {
    if (isHOD && hodDept) {
      setForm(f => ({ ...f, department: hodDept }));
    }
  }, [user]);

  const fetchStudents = async () => {
    try {
      const params = {};
      if (filterDept) params.department = filterDept;
      if (filterSemester) params.semester = filterSemester;
      const { data } = await api.get('/students', { params });
      setStudents(data.data || data.students || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchDepartments = async () => {
    try {
      const { data } = await api.get('/departments');
      setDepartments(data.data || []);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchStudents(); }, [filterDept, filterSemester]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingStudent) {
        await api.put(`/students/${editingStudent._id}`, form);
      } else {
        await api.post('/students', form);
      }
      setShowModal(false);
      setEditingStudent(null);
      resetForm();
      fetchStudents();
    } catch (err) { alert(err.response?.data?.message || 'Error saving student'); }
  };

  const handleEdit = (student) => {
    setEditingStudent(student);
    setForm({
      name: student.user?.name || '',
      email: student.user?.email || '',
      rollNumber: student.rollNumber,
      department: student.department?._id || '',
      semester: student.semester,
      section: student.section || 'A',
      batch: student.batch || '2023-2027',
      password: ''
    });
    setShowModal(true);
  };

  const handleRegisterFace = (student) => {
    setFaceStudent(student);
    setShowFaceModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this student?')) return;
    try {
      await api.delete(`/students/${id}`);
      fetchStudents();
    } catch (err) { alert(err.response?.data?.message || 'Error deleting'); }
  };

  const columns = [
    { key: 'rollNumber', label: 'Roll No', render: (row) => <span className="font-mono text-primary-400">{row.rollNumber}</span> },
    { key: 'name', label: 'Name', render: (row) => (
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
          {row.user?.name?.charAt(0) || '?'}
        </div>
        <div>
          <p className="text-sm font-medium">{row.user?.name || 'N/A'}</p>
          <p className="text-xs text-gray-500">{row.user?.email || ''}</p>
        </div>
      </div>
    )},
    { key: 'department', label: 'Department', render: (row) => row.department?.code || 'N/A' },
    { key: 'semester', label: 'Semester', render: (row) => <span className="text-gray-700 dark:text-gray-300">Sem {row.semester}</span> },
    { key: 'section', label: 'Section' },
    { key: 'faceRegistered', label: 'Face', render: (row) => (
      <Badge color={row.faceRegistered ? 'success' : 'danger'} variant="dot">
        {row.faceRegistered ? 'Registered' : 'Pending'}
      </Badge>
    )},
    { key: 'actions', label: 'Actions', render: (row) => (
      <div className="flex gap-1">
        <button onClick={() => handleRegisterFace(row)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.06] text-gray-400 hover:text-primary-400" title="Register Face"><HiOutlineCamera /></button>
        <button onClick={() => handleEdit(row)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.06] text-gray-400 hover:text-primary-400" title="Edit"><HiOutlinePencil /></button>
        <button onClick={() => handleDelete(row._id)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.06] text-gray-400 hover:text-red-400" title="Delete"><HiOutlineTrash /></button>
      </div>
    )}
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Students</h1>
          <p className="text-gray-500 text-sm mt-1">Manage student records and face registrations</p>
        </div>
        <Button onClick={() => { setEditingStudent(null); resetForm(); setShowModal(true); }}>
          <HiOutlineUserPlus className="mr-2 text-lg" /> Add Student
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <select value={filterDept} onChange={(e) => setFilterDept(e.target.value)} className="input-field w-48">
          <option value="">All Departments</option>
          {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
        </select>
        <select value={filterSemester} onChange={(e) => setFilterSemester(e.target.value)} className="input-field w-40">
          <option value="">All Semesters</option>
          {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
        </select>
      </div>

      <DataTable columns={columns} data={students} loading={loading} searchable pagination />

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingStudent ? 'Edit Student' : 'Add Student'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">Full Name</label>
            <input value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className="input-field" required />
          </div>
          <div>
            <label className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">Email</label>
            <input type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} className="input-field" required />
          </div>
          <div>
            <label className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">Roll Number</label>
            <input value={form.rollNumber} onChange={(e) => setForm({...form, rollNumber: e.target.value})} className="input-field" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">Department</label>
              <select value={form.department} onChange={(e) => setForm({...form, department: e.target.value})} className="input-field" required>
                <option value="">Select</option>
                {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">Semester</label>
              <select value={form.semester} onChange={(e) => setForm({...form, semester: parseInt(e.target.value)})} className="input-field">
                {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">Section</label>
              <select value={form.section} onChange={(e) => setForm({...form, section: e.target.value})} className="input-field">
                {['A','B','C','D'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">Batch</label>
              <input value={form.batch} onChange={(e) => setForm({...form, batch: e.target.value})} className="input-field" />
            </div>
          </div>
          {!editingStudent && (
            <div>
              <label className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">Password</label>
              <input type="password" value={form.password} onChange={(e) => setForm({...form, password: e.target.value})} className="input-field" required placeholder="Minimum 6 characters" />
            </div>
          )}
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit">{editingStudent ? 'Update' : 'Create'} Student</Button>
          </div>
        </form>
      </Modal>
      <Modal isOpen={showFaceModal} onClose={() => setShowFaceModal(false)} title="Face Registration" size="lg">
        {faceStudent && (
          <FaceRegistration
            studentId={faceStudent._id}
            studentName={faceStudent.user?.name}
            onSuccess={() => {
              fetchStudents();
              setShowFaceModal(false);
            }}
            onClose={() => setShowFaceModal(false)}
          />
        )}
      </Modal>
    </motion.div>
  );
}
