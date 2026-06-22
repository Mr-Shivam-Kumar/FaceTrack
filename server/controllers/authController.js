const User = require('../models/User');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password',
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered',
      });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: 'student',
    });

    const token = user.getSignedJwtToken();

    res.status(201).json({
      success: true,
      data: {
        token,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account has been deactivated. Contact admin.',
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    const token = user.getSignedJwtToken();

    // Get additional profile data based on role
    let profile = null;
    if (user.role === 'student') {
      profile = await Student.findOne({ user: user._id }).populate('department');
    } else if (user.role === 'faculty') {
      const facultyDoc = await Faculty.findOne({ user: user._id }).populate('department').populate('subjects');
      if (facultyDoc) {
        const Department = require('../models/Department');
        let dept = await Department.findOne({ hod: facultyDoc._id });
        if (!dept) {
          dept = await Department.findOne({ hodName: user.name });
          if (dept) {
            dept.hod = facultyDoc._id;
            await dept.save();
          }
        }
        profile = facultyDoc.toObject();
        profile.isHOD = !!dept;
        profile.hodDepartment = dept ? dept._id : null;
      }
    }

    res.status(200).json({
      success: true,
      data: {
        token,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
          profileImage: user.profileImage,
          profile,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get current logged-in user
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    let profile = null;
    if (user.role === 'student') {
      profile = await Student.findOne({ user: user._id }).populate('department');
    } else if (user.role === 'faculty') {
      const facultyDoc = await Faculty.findOne({ user: user._id }).populate('department').populate('subjects');
      if (facultyDoc) {
        const Department = require('../models/Department');
        let dept = await Department.findOne({ hod: facultyDoc._id });
        if (!dept) {
          dept = await Department.findOne({ hodName: user.name });
          if (dept) {
            dept.hod = facultyDoc._id;
            await dept.save();
          }
        }
        profile = facultyDoc.toObject();
        profile.isHOD = !!dept;
        profile.hodDepartment = dept ? dept._id : null;
      }
    }

    res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        profileImage: user.profileImage,
        profile,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update profile (name, email)
 * @route   PUT /api/auth/profile
 * @access  Private
 */
const updateProfile = async (req, res, next) => {
  try {
    const { name, email } = req.body;
    const updateFields = {};

    if (name) updateFields.name = name;
    if (email) {
      // Check if email is already taken by another user
      const existing = await User.findOne({ email, _id: { $ne: req.user._id } });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'Email is already in use',
        });
      }
      updateFields.email = email;
    }

    const user = await User.findByIdAndUpdate(req.user._id, updateFields, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Change password
 * @route   PUT /api/auth/change-password
 * @access  Private
 */
const changePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide old and new password',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters',
      });
    }

    const user = await User.findById(req.user._id).select('+password');

    const isMatch = await user.matchPassword(oldPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    user.password = newPassword;
    await user.save();

    const token = user.getSignedJwtToken();

    res.status(200).json({
      success: true,
      data: { token },
      message: 'Password changed successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
};
