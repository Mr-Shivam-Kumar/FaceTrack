const express = require('express');
const router = express.Router();
const {
  getDepartments, getDepartment, createDepartment, updateDepartment, deleteDepartment
} = require('../controllers/departmentController');
const { protect, authorize } = require('../middleware/auth');
const { createAuditLog } = require('../middleware/auditLog');

router.use(protect);

router.route('/')
  .get(getDepartments)
  .post(authorize('admin'), createAuditLog('CREATE_DEPARTMENT', 'Department'), createDepartment);

router.route('/:id')
  .get(getDepartment)
  .put(authorize('admin'), createAuditLog('UPDATE_DEPARTMENT', 'Department'), updateDepartment)
  .delete(authorize('admin'), createAuditLog('DELETE_DEPARTMENT', 'Department'), deleteDepartment);

module.exports = router;
