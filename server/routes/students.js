const express = require('express');
const router = express.Router();
const {
  getStudents, getStudent, createStudent, updateStudent, deleteStudent,
  getStudentAttendance, getStudentStats
} = require('../controllers/studentController');
const { protect, authorize, authorizeAdminOrHOD } = require('../middleware/auth');
const { createAuditLog } = require('../middleware/auditLog');

router.use(protect);

router.route('/')
  .get(authorize('admin', 'faculty'), getStudents)
  .post(authorizeAdminOrHOD, createAuditLog('CREATE_STUDENT', 'Student'), createStudent);

router.route('/:id')
  .get(authorize('admin', 'faculty', 'student'), getStudent)
  .put(authorizeAdminOrHOD, createAuditLog('UPDATE_STUDENT', 'Student'), updateStudent)
  .delete(authorizeAdminOrHOD, createAuditLog('DELETE_STUDENT', 'Student'), deleteStudent);

router.get('/:id/attendance', authorize('admin', 'faculty', 'student'), getStudentAttendance);
router.get('/:id/stats', authorize('admin', 'faculty', 'student'), getStudentStats);

module.exports = router;
