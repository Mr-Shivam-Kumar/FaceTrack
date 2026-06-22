const Faculty = require('../models/Faculty');
const User = require('../models/User');
const Subject = require('../models/Subject');
const Class = require('../models/Class');
const AttendanceSession = require('../models/AttendanceSession');

/**
 * @desc    Get all faculty with filters
 * @route   GET /api/faculty
 * @access  Private (admin)
 */
const getFaculties = async (req, res, next) => {
  try {
    const { department, search, page = 1, limit = 50 } = req.query;

    const query = {};
    if (req.user.role === 'faculty' && req.user.isHOD) {
      query.department = req.user.hodDepartment;
    } else if (department) {
      query.department = department;
    }

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      const matchingUsers = await User.find({ name: searchRegex, role: 'faculty' }).select('_id');
      const userIds = matchingUsers.map((u) => u._id);
      query.$or = [{ user: { $in: userIds } }, { employeeId: searchRegex }];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Faculty.countDocuments(query);

    const faculties = await Faculty.find(query)
      .populate('user', 'name email profileImage isActive')
      .populate('department', 'name code')
      .populate('subjects', 'name code')
      .sort({ employeeId: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      data: faculties,
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
 * @desc    Get single faculty
 * @route   GET /api/faculty/:id
 * @access  Private
 */
const getFaculty = async (req, res, next) => {
  try {
    const faculty = await Faculty.findById(req.params.id)
      .populate('user', 'name email profileImage isActive createdAt')
      .populate('department', 'name code')
      .populate('subjects', 'name code semester creditHours');

    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: 'Faculty not found',
      });
    }

    res.status(200).json({
      success: true,
      data: faculty,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create faculty (User + Faculty)
 * @route   POST /api/faculty
 * @access  Private (admin)
 */
const createFaculty = async (req, res, next) => {
  try {
    const { name, email, password, employeeId, department, subjects, designation } = req.body;

    if (!name || !email || !password || !employeeId || !department) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, password, employeeId, and department',
      });
    }

    if (req.user.role === 'faculty' && req.user.isHOD) {
      if (department.toString() !== req.user.hodDepartment.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: HOD can only manage faculty in their own department',
        });
      }
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered',
      });
    }

    const existingEmpId = await Faculty.findOne({ employeeId: employeeId.toUpperCase() });
    if (existingEmpId) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID already exists',
      });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: 'faculty',
    });

    const faculty = await Faculty.create({
      user: user._id,
      employeeId,
      department,
      subjects: subjects || [],
      designation: designation || 'Assistant Professor',
    });

    const populated = await Faculty.findById(faculty._id)
      .populate('user', 'name email profileImage isActive')
      .populate('department', 'name code')
      .populate('subjects', 'name code');

    res.status(201).json({
      success: true,
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update faculty
 * @route   PUT /api/faculty/:id
 * @access  Private (admin)
 */
const updateFaculty = async (req, res, next) => {
  try {
    const { name, email, department, subjects, designation, employeeId, isActive } = req.body;

    const faculty = await Faculty.findById(req.params.id);
    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: 'Faculty not found',
      });
    }

    if (req.user.role === 'faculty' && req.user.isHOD) {
      if (faculty.department.toString() !== req.user.hodDepartment.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: HOD can only manage faculty in their own department',
        });
      }
      if (department && department.toString() !== req.user.hodDepartment.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: HOD cannot reassign a faculty member to a different department',
        });
      }
    }

    // Update user fields
    const userUpdate = {};
    if (name) userUpdate.name = name;
    if (email) {
      const existing = await User.findOne({ email, _id: { $ne: faculty.user } });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'Email already in use',
        });
      }
      userUpdate.email = email;
    }
    if (typeof isActive === 'boolean') userUpdate.isActive = isActive;

    if (Object.keys(userUpdate).length > 0) {
      await User.findByIdAndUpdate(faculty.user, userUpdate, { runValidators: true });
    }

    // Update faculty fields
    const facultyUpdate = {};
    if (department) facultyUpdate.department = department;
    if (subjects) facultyUpdate.subjects = subjects;
    if (designation) facultyUpdate.designation = designation;
    if (employeeId) {
      const existingEmp = await Faculty.findOne({
        employeeId: employeeId.toUpperCase(),
        _id: { $ne: faculty._id },
      });
      if (existingEmp) {
        return res.status(400).json({
          success: false,
          message: 'Employee ID already exists',
        });
      }
      facultyUpdate.employeeId = employeeId;
    }

    const updated = await Faculty.findByIdAndUpdate(req.params.id, facultyUpdate, {
      new: true,
      runValidators: true,
    })
      .populate('user', 'name email profileImage isActive')
      .populate('department', 'name code')
      .populate('subjects', 'name code');

    res.status(200).json({
      success: true,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete faculty and user
 * @route   DELETE /api/faculty/:id
 * @access  Private (admin)
 */
const deleteFaculty = async (req, res, next) => {
  try {
    const faculty = await Faculty.findById(req.params.id);
    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: 'Faculty not found',
      });
    }

    if (req.user.role === 'faculty' && req.user.isHOD) {
      if (faculty.department.toString() !== req.user.hodDepartment.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: HOD can only manage faculty in their own department',
        });
      }
    }

    await User.findByIdAndDelete(faculty.user);
    await Faculty.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Faculty deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get faculty's assigned classes and subjects
 * @route   GET /api/faculty/:id/classes
 * @access  Private
 */
const getFacultyClasses = async (req, res, next) => {
  try {
    const faculty = await Faculty.findById(req.params.id);
    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: 'Faculty not found',
      });
    }

    const classes = await Class.find({ faculty: req.params.id })
      .populate('subject', 'name code semester creditHours')
      .populate('department', 'name code');

    const subjects = await Subject.find({ faculty: req.params.id }).populate('department', 'name code');

    const recentSessions = await AttendanceSession.find({ faculty: req.params.id })
      .populate('subject', 'name code')
      .populate('department', 'name code')
      .sort({ date: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      data: {
        classes,
        subjects,
        recentSessions,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getFaculties,
  getFaculty,
  createFaculty,
  updateFaculty,
  deleteFaculty,
  getFacultyClasses,
};
