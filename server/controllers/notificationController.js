const Notification = require('../models/Notification');

/**
 * @desc    Get user's notifications (paginated)
 * @route   GET /api/notifications
 * @access  Private
 */
const getNotifications = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, type, isRead } = req.query;

    const query = { recipient: req.user._id };
    if (type) query.type = type;
    if (isRead !== undefined) query.isRead = isRead === 'true';

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Notification.countDocuments(query);

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      data: notifications,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mark notification as read
 * @route   PUT /api/notifications/:id/read
 * @access  Private
 */
const markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      recipient: req.user._id,
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    notification.isRead = true;
    await notification.save();

    res.status(200).json({
      success: true,
      data: notification,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mark all notifications as read
 * @route   PUT /api/notifications/read-all
 * @access  Private
 */
const markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { isRead: true }
    );

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get unread notification count
 * @route   GET /api/notifications/unread-count
 * @access  Private
 */
const getUnreadCount = async (req, res, next) => {
  try {
    const count = await Notification.countDocuments({
      recipient: req.user._id,
      isRead: false,
    });

    res.status(200).json({
      success: true,
      data: { count },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a notification (internal/system use)
 * @route   POST /api/notifications
 * @access  Private (admin, system)
 */
const createNotification = async (req, res, next) => {
  try {
    const { recipient, title, message, type, metadata } = req.body;

    if (!recipient || !title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Please provide recipient, title, and message',
      });
    }

    const notification = await Notification.create({
      recipient,
      title,
      message,
      type: type || 'system',
      metadata: metadata || {},
    });

    // Emit socket event for real-time notification
    const io = req.app.get('io');
    if (io) {
      io.to(`user:${recipient}`).emit('notification:new', notification);
    }

    res.status(201).json({
      success: true,
      data: notification,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  createNotification,
};
