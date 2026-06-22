const express = require('express');
const router = express.Router();
const {
  startSession, endSession, getActiveSessions, getSessionsByFaculty, getSession
} = require('../controllers/sessionController');
const { protect, authorize } = require('../middleware/auth');
const { createAuditLog } = require('../middleware/auditLog');

router.use(protect);

router.post('/start', authorize('admin', 'faculty'), createAuditLog('START_SESSION', 'AttendanceSession'), startSession);
router.put('/:id/end', authorize('admin', 'faculty'), createAuditLog('END_SESSION', 'AttendanceSession'), endSession);
router.get('/active', authorize('admin', 'faculty'), getActiveSessions);
router.get('/faculty/:facultyId', authorize('admin', 'faculty'), getSessionsByFaculty);
router.get('/:id', authorize('admin', 'faculty'), getSession);

module.exports = router;
