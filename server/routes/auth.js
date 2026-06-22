const express = require('express');
const router = express.Router();
const { register, login, getMe, updateProfile, changePassword } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { createAuditLog } = require('../middleware/auditLog');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/profile', protect, createAuditLog('UPDATE_PROFILE', 'User'), updateProfile);
router.put('/change-password', protect, createAuditLog('CHANGE_PASSWORD', 'User'), changePassword);

module.exports = router;
