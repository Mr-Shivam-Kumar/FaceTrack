const express = require('express');
const router = express.Router();
const { generatePDFReport, generateExcelReport, generateCSVReport } = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/pdf', authorize('admin', 'faculty'), generatePDFReport);
router.get('/excel', authorize('admin', 'faculty'), generateExcelReport);
router.get('/csv', authorize('admin', 'faculty'), generateCSVReport);

module.exports = router;
