const Student = require('../models/Student');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Subject = require('../models/Subject');

/**
 * @desc    Get all students with filters
 * @route   GET /api/students
 * @access  Private (admin, faculty)
 */
const getStudents = async (req, res, next) => {
  try {
    const { department, semester, section, search, page = 1, limit = 50 } = req.query;

    const query = {};

    if (req.user.role === 'faculty' && req.user.isHOD) {
      query.department = req.user.hodDepartment;
    } else if (department) {
      query.department = department;
    }
    if (semester) query.semester = parseInt(semester);
    if (section) query.section = section.toUpperCase();

    let studentQuery = Student.find(query)
      .populate('user', 'name email profileImage isActive')
      .populate('department', 'name code')
      .sort({ rollNumber: 1 });

    // If search is provided, we need to filter by user name or roll number
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      // First find matching users
      const matchingUsers = await User.find({ name: searchRegex, role: 'student' }).select('_id');
      const userIds = matchingUsers.map((u) => u._id);

      query.$or = [{ user: { $in: userIds } }, { rollNumber: searchRegex }];
      studentQuery = Student.find(query)
        .populate('user', 'name email profileImage isActive')
        .populate('department', 'name code')
        .sort({ rollNumber: 1 });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Student.countDocuments(query);

    const students = await studentQuery.skip(skip).limit(parseInt(limit));

    res.status(200).json({
      success: true,
      data: students,
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
 * @desc    Get single student by ID
 * @route   GET /api/students/:id
 * @access  Private
 */
const getStudent = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id)
      .populate('user', 'name email profileImage isActive createdAt')
      .populate('department', 'name code');

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    res.status(200).json({
      success: true,
      data: student,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new student (creates User + Student)
 * @route   POST /api/students
 * @access  Private (admin)
 */
const createStudent = async (req, res, next) => {
  try {
    const { name, email, password, rollNumber, department, semester, section, batch } = req.body;

    if (!name || !email || !password || !rollNumber || !department || !semester) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, password, rollNumber, department, and semester',
      });
    }

    if (req.user.role === 'faculty' && req.user.isHOD) {
      if (department.toString() !== req.user.hodDepartment.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: HOD can only manage students in their own department',
        });
      }
    }

    // Check if email or roll number already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered',
      });
    }

    const existingRoll = await Student.findOne({ rollNumber: rollNumber.toUpperCase() });
    if (existingRoll) {
      return res.status(400).json({
        success: false,
        message: 'Roll number already exists',
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role: 'student',
    });

    // Create student profile
    const student = await Student.create({
      user: user._id,
      rollNumber,
      department,
      semester,
      section: section || 'A',
      batch: batch || new Date().getFullYear().toString(),
    });

    const populated = await Student.findById(student._id)
      .populate('user', 'name email profileImage isActive')
      .populate('department', 'name code');

    res.status(201).json({
      success: true,
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update student
 * @route   PUT /api/students/:id
 * @access  Private (admin)
 */
const updateStudent = async (req, res, next) => {
  try {
    const { name, email, department, semester, section, batch, rollNumber, isActive } = req.body;

    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    if (req.user.role === 'faculty' && req.user.isHOD) {
      if (student.department.toString() !== req.user.hodDepartment.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: HOD can only manage students in their own department',
        });
      }
      if (department && department.toString() !== req.user.hodDepartment.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: HOD cannot reassign a student to a different department',
        });
      }
    }

    // Update user fields if provided
    const userUpdate = {};
    if (name) userUpdate.name = name;
    if (email) {
      const existing = await User.findOne({ email, _id: { $ne: student.user } });
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
      await User.findByIdAndUpdate(student.user, userUpdate, { runValidators: true });
    }

    // Update student fields
    const studentUpdate = {};
    if (department) studentUpdate.department = department;
    if (semester) studentUpdate.semester = semester;
    if (section) studentUpdate.section = section;
    if (batch) studentUpdate.batch = batch;
    if (rollNumber) {
      const existingRoll = await Student.findOne({
        rollNumber: rollNumber.toUpperCase(),
        _id: { $ne: student._id },
      });
      if (existingRoll) {
        return res.status(400).json({
          success: false,
          message: 'Roll number already exists',
        });
      }
      studentUpdate.rollNumber = rollNumber;
    }

    const updatedStudent = await Student.findByIdAndUpdate(req.params.id, studentUpdate, {
      new: true,
      runValidators: true,
    })
      .populate('user', 'name email profileImage isActive')
      .populate('department', 'name code');

    res.status(200).json({
      success: true,
      data: updatedStudent,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete student and associated user
 * @route   DELETE /api/students/:id
 * @access  Private (admin)
 */
const deleteStudent = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    if (req.user.role === 'faculty' && req.user.isHOD) {
      if (student.department.toString() !== req.user.hodDepartment.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: HOD can only manage students in their own department',
        });
      }
    }

    await User.findByIdAndDelete(student.user);
    await Student.findByIdAndDelete(req.params.id);
    await Attendance.deleteMany({ student: req.params.id });

    res.status(200).json({
      success: true,
      message: 'Student deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get student attendance records
 * @route   GET /api/students/:id/attendance
 * @access  Private
 */
const getStudentAttendance = async (req, res, next) => {
  try {
    const { startDate, endDate, subject } = req.query;

    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    const query = { student: req.params.id };

    if (subject) query.subject = subject;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const attendance = await Attendance.find(query)
      .populate('subject', 'name code')
      .populate('session', 'date startTime endTime faculty')
      .sort({ date: -1 });

    res.status(200).json({
      success: true,
      data: attendance,
      total: attendance.length,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get student attendance statistics
 * @route   GET /api/students/:id/stats
 * @access  Private
 */
const getStudentStats = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id).populate('department', 'name code');
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    // Overall stats
    const totalRecords = await Attendance.countDocuments({ student: req.params.id });
    const presentCount = await Attendance.countDocuments({
      student: req.params.id,
      status: { $in: ['present', 'late'] },
    });
    const absentCount = await Attendance.countDocuments({
      student: req.params.id,
      status: 'absent',
    });

    const overallPercentage = totalRecords > 0 ? ((presentCount / totalRecords) * 100).toFixed(2) : 0;

    // Subject-wise breakdown
    const subjectStats = await Attendance.aggregate([
      { $match: { student: student._id } },
      {
        $group: {
          _id: '$subject',
          total: { $sum: 1 },
          present: {
            $sum: {
              $cond: [{ $in: ['$status', ['present', 'late']] }, 1, 0],
            },
          },
          absent: {
            $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] },
          },
        },
      },
    ]);

    // Populate subject info
    const populatedSubjectStats = await Subject.populate(subjectStats, {
      path: '_id',
      select: 'name code',
    });

    const subjectBreakdown = populatedSubjectStats.map((s) => ({
      subject: s._id,
      total: s.total,
      present: s.present,
      absent: s.absent,
      percentage: s.total > 0 ? ((s.present / s.total) * 100).toFixed(2) : 0,
    }));

    res.status(200).json({
      success: true,
      data: {
        student: {
          _id: student._id,
          rollNumber: student.rollNumber,
          department: student.department,
          semester: student.semester,
        },
        overall: {
          totalClasses: totalRecords,
          present: presentCount,
          absent: absentCount,
          percentage: parseFloat(overallPercentage),
        },
        subjectWise: subjectBreakdown,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStudents,
  getStudent,
  createStudent,
  updateStudent,
  deleteStudent,
  getStudentAttendance,
  getStudentStats,
};
