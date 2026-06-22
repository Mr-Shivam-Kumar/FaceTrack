const AuditLog = require('../models/AuditLog');

/**
 * @desc    Get all audit logs (paginated, sorted, and filtered)
 * @route   GET /api/audit-logs
 * @access  Private (admin)
 */
const getAuditLogs = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const query = {};

    // Filters
    if (req.query.action) {
      query.action = { $regex: req.query.action, $options: 'i' };
    }
    if (req.query.actorRole) {
      query.actorRole = req.query.actorRole;
    }
    if (req.query.resource) {
      query.resource = req.query.resource;
    }
    if (req.query.actor) {
      query.actor = req.query.actor;
    }

    const logs = await AuditLog.find(query)
      .populate('actor', 'name email profileImage')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);

    const total = await AuditLog.countDocuments(query);

    res.status(200).json({
      success: true,
      count: logs.length,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
      data: logs,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAuditLogs,
};
