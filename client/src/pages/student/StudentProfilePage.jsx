import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import Badge from '../../components/ui/Badge';
import { HiOutlineUserCircle, HiOutlineAcademicCap, HiOutlineBuildingOffice2, HiOutlineCalendarDays, HiOutlineCheckCircle, HiOutlineFingerPrint } from 'react-icons/hi2';
import { getAttendanceColor } from '../../utils/helpers';

export default function StudentProfilePage() {
  const { user } = useAuth();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const myStudentId = user?.profile?._id;
        if (myStudentId) {
          const { data: full } = await api.get(`/students/${myStudentId}`);
          setStudent(full.data || full);
        }
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchProfile();
  }, [user]);

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" /></div>;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto space-y-6">
      {/* Profile Header */}
      <div className="glass-card p-8">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-primary-500/20">
            <span className="text-white text-3xl font-bold">{user?.name?.charAt(0) || '?'}</span>
          </div>
          <div className="text-center md:text-left">
            <h1 className="text-2xl font-bold">{user?.name || 'Student'}</h1>
            <p className="text-gray-500">{user?.email}</p>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <Badge color="info">{student?.department?.code || 'N/A'}</Badge>
              <Badge color="neutral">Semester {student?.semester || '?'}</Badge>
              <Badge color="neutral">Section {student?.section || '?'}</Badge>
              <Badge color={student?.faceRegistered ? 'success' : 'warning'} variant="dot">
                {student?.faceRegistered ? 'Face Registered' : 'Face Not Registered'}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal Info */}
        <div className="glass-card p-6">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2"><HiOutlineUserCircle className="text-primary-400" /> Personal Information</h3>
          <div className="space-y-4">
            {[
              ['Full Name', user?.name || 'N/A'],
              ['Email', user?.email || 'N/A'],
              ['Roll Number', student?.rollNumber || 'N/A'],
              ['Batch', student?.batch || 'N/A'],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between">
                <span className="text-sm text-gray-500">{k}</span>
                <span className="text-sm text-gray-800 dark:text-gray-300 font-medium">{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Academic Info */}
        <div className="glass-card p-6">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2"><HiOutlineAcademicCap className="text-primary-400" /> Academic Information</h3>
          <div className="space-y-4">
            {[
              ['Department', student?.department?.name || 'N/A'],
              ['Dept Code', student?.department?.code || 'N/A'],
              ['Semester', student?.semester || 'N/A'],
              ['Section', student?.section || 'N/A'],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between">
                <span className="text-sm text-gray-500">{k}</span>
                <span className="text-sm text-gray-300 font-medium">{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Face Registration */}
        <div className="glass-card p-6">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2"><HiOutlineFingerPrint className="text-primary-400" /> Face Recognition</h3>
          <div className="text-center py-6">
            <div className={`w-16 h-16 rounded-2xl mx-auto mb-3 flex items-center justify-center ${student?.faceRegistered ? 'bg-emerald-500/10' : 'bg-amber-500/10'}`}>
              <HiOutlineFingerPrint className={`text-3xl ${student?.faceRegistered ? 'text-emerald-400' : 'text-amber-400'}`} />
            </div>
            <p className="text-sm font-medium">{student?.faceRegistered ? 'Face Profile Active' : 'Not Registered'}</p>
            <p className="text-xs text-gray-500 mt-1">
              {student?.faceRegistered ? 'Your face is registered for attendance' : 'Contact faculty to register your face'}
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="glass-card p-6">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2"><HiOutlineCheckCircle className="text-primary-400" /> Attendance Status</h3>
          <div className="text-center py-6">
            <div className="relative w-28 h-28 mx-auto">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="rgba(148,163,184,0.3)" strokeWidth="3" />
                <motion.path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round"
                  initial={{ strokeDasharray: '0, 100' }} animate={{ strokeDasharray: '82, 100' }}
                  transition={{ duration: 1.5 }} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-emerald-400">82%</span>
                <span className="text-[10px] text-gray-500">Attendance</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
