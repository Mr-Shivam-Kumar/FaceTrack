const express = require('express');
const router = express.Router();
const {
  getNotifications, markAsRead, markAllAsRead, getUnreadCount, createNotification
} = require('../controllers/notificationController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/', getNotifications);
router.post('/', authorize('admin'), createNotification);
router.get('/unread-count', getUnreadCount);
router.put('/:id/read', markAsRead);
router.put('/read-all', markAllAsRead);

module.exports = router;
