const express = require('express');
const router = express.Router();
const {
  getFaculties, getFaculty, createFaculty, updateFaculty, deleteFaculty, getFacultyClasses
} = require('../controllers/facultyController');
const { protect, authorize, authorizeAdminOrHOD } = require('../middleware/auth');
const { createAuditLog } = require('../middleware/auditLog');

router.use(protect);

router.route('/')
  .get(authorizeAdminOrHOD, getFaculties)
  .post(authorizeAdminOrHOD, createAuditLog('CREATE_FACULTY', 'Faculty'), createFaculty);

router.route('/:id')
  .get(authorize('admin', 'faculty'), getFaculty)
  .put(authorizeAdminOrHOD, createAuditLog('UPDATE_FACULTY', 'Faculty'), updateFaculty)
  .delete(authorizeAdminOrHOD, createAuditLog('DELETE_FACULTY', 'Faculty'), deleteFaculty);

router.get('/:id/classes', authorize('admin', 'faculty'), getFacultyClasses);

module.exports = router;
