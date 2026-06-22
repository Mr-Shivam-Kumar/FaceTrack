const express = require('express');
const router = express.Router();
const {
  markAttendance, markBulkAttendance, getAttendanceBySession,
  getAttendanceByStudent, getAttendanceBySubject, getAttendanceStats, 
  getAttendanceRecords, updateAttendanceRecord
} = require('../controllers/attendanceController');
const { protect, authorize } = require('../middleware/auth');
const { createAuditLog } = require('../middleware/auditLog');

router.use(protect);

router.post('/mark', authorize('admin', 'faculty'), createAuditLog('MARK_ATTENDANCE', 'Attendance'), markAttendance);
router.post('/bulk', authorize('admin', 'faculty'), createAuditLog('MARK_BULK_ATTENDANCE', 'Attendance'), markBulkAttendance);
router.get('/session/:sessionId', authorize('admin', 'faculty'), getAttendanceBySession);
router.get('/student/:studentId', authorize('admin', 'faculty', 'student'), getAttendanceByStudent);
router.get('/subject/:subjectId', authorize('admin', 'faculty'), getAttendanceBySubject);
router.get('/stats', authorize('admin', 'faculty'), getAttendanceStats);
router.get('/', authorize('admin', 'faculty'), getAttendanceRecords);
router.put('/:id', authorize('admin', 'faculty'), createAuditLog('UPDATE_ATTENDANCE', 'Attendance'), updateAttendanceRecord);

module.exports = router;
