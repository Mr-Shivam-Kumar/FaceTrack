const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Protect routes - verify JWT token and attach user to request
 */
const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.query && req.query.token) {
      token = req.query.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route. No token provided.',
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User no longer exists',
        });
      }

      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'User account has been deactivated',
        });
      }

      // Resolve HOD status if user is faculty
      if (user.role === 'faculty') {
        const Faculty = require('../models/Faculty');
        const Department = require('../models/Department');
        const faculty = await Faculty.findOne({ user: user._id });
        if (faculty) {
          let dept = await Department.findOne({ hod: faculty._id });
          if (!dept) {
            dept = await Department.findOne({ hodName: user.name });
            if (dept) {
              dept.hod = faculty._id;
              await dept.save();
            }
          }
          if (dept) {
            user.isHOD = true;
            user.hodDepartment = dept._id;
          } else {
            user.isHOD = false;
          }
        } else {
          user.isHOD = false;
        }
      } else {
        user.isHOD = false;
      }

      req.user = user;
      next();
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized. Token is invalid or expired.',
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Authorize by role - check if user has required role
 * @param  {...string} roles - Allowed roles
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user.role}' is not authorized to access this route`,
      });
    }

    next();
  };
};

/**
 * Authorize Admin or HOD - allows global admins and HOD faculties
 */
const authorizeAdminOrHOD = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }

  if (req.user.role === 'admin' || (req.user.role === 'faculty' && req.user.isHOD)) {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: 'Access denied: Requires Admin or Head of Department (HOD) privileges',
  });
};

module.exports = { protect, authorize, authorizeAdminOrHOD };
