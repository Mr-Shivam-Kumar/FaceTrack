const express = require('express');
const router = express.Router();
const {
  getAdminDashboard, getDailyTrend, getMonthlyTrend,
  getDepartmentStats, getStudentDistribution, getAttendanceHeatmap,
  getInsights, getFacultyDashboard
} = require('../controllers/dashboardController');
const { protect, authorize, authorizeAdminOrHOD } = require('../middleware/auth');

router.use(protect);

router.get('/admin', authorizeAdminOrHOD, getAdminDashboard);
router.get('/faculty', authorize('admin', 'faculty'), getFacultyDashboard);
router.get('/daily-trend', authorize('admin', 'faculty'), getDailyTrend);
router.get('/monthly-trend', authorize('admin', 'faculty'), getMonthlyTrend);
router.get('/department-stats', authorizeAdminOrHOD, getDepartmentStats);
router.get('/student-distribution', authorizeAdminOrHOD, getStudentDistribution);
router.get('/heatmap', authorize('admin', 'faculty'), getAttendanceHeatmap);
router.get('/insights', authorize('admin', 'faculty'), getInsights);

module.exports = router;
