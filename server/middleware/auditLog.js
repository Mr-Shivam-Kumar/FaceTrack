const AuditLog = require('../models/AuditLog');

/**
 * Middleware factory for creating audit log entries
 * Logs the action after the response has been sent
 * @param {string} action - Description of the action (e.g., 'CREATE_STUDENT')
 * @param {string} resource - Resource type (e.g., 'Student')
 */
const createAuditLog = (action, resource) => {
  return (req, res, next) => {
    // Store original json method to intercept response
    const originalJson = res.json.bind(res);

    res.json = function (body) {
      // After response is sent, create audit log asynchronously
      setImmediate(async () => {
        try {
          const logEntry = {
            action,
            resource,
            actor: req.user ? req.user._id : null,
            actorRole: req.user ? req.user.role : 'anonymous',
            ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
            changes: {
              method: req.method,
              path: req.originalUrl,
              body: req.method !== 'GET' ? sanitizeBody(req.body) : undefined,
              statusCode: res.statusCode,
            },
          };

          // Try to extract resourceId from params or response body
          if (req.params.id) {
            logEntry.resourceId = req.params.id;
          } else if (body && body.data && body.data._id) {
            logEntry.resourceId = body.data._id;
          }

          await AuditLog.create(logEntry);
        } catch (err) {
          console.error('Audit log error:', err.message);
        }
      });

      return originalJson(body);
    };

    next();
  };
};

/**
 * Remove sensitive fields from request body before logging
 */
function sanitizeBody(body) {
  if (!body) return undefined;
  const sanitized = { ...body };
  const sensitiveFields = ['password', 'newPassword', 'oldPassword', 'token', 'secret'];
  sensitiveFields.forEach((field) => {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  });
  return sanitized;
}

module.exports = { createAuditLog };
