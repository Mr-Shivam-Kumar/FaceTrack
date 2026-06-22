const express = require('express');
const router = express.Router();
const {
  getSubjects, getSubject, createSubject, updateSubject, deleteSubject
} = require('../controllers/subjectController');
const { protect, authorize, authorizeAdminOrHOD } = require('../middleware/auth');
const { createAuditLog } = require('../middleware/auditLog');

router.use(protect);

router.route('/')
  .get(getSubjects)
  .post(authorizeAdminOrHOD, createAuditLog('CREATE_SUBJECT', 'Subject'), createSubject);

router.route('/:id')
  .get(getSubject)
  .put(authorizeAdminOrHOD, createAuditLog('UPDATE_SUBJECT', 'Subject'), updateSubject)
  .delete(authorizeAdminOrHOD, createAuditLog('DELETE_SUBJECT', 'Subject'), deleteSubject);

module.exports = router;
