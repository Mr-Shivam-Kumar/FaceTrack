const AttendanceSession = require('../models/AttendanceSession');
const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const Subject = require('../models/Subject');

/**
 * @desc    Start a new attendance session
 * @route   POST /api/sessions/start
 * @access  Private (faculty)
 */
const startSession = async (req, res, next) => {
  try {
    const { subject, subjectId, department, semester, section } = req.body;
    const finalSubjectId = subjectId || subject;

    if (!finalSubjectId || !department || !semester) {
      return res.status(400).json({
        success: false,
        message: 'Please provide subjectId/subject, department, and semester',
      });
    }

    // Get faculty profile for the logged-in user
    const faculty = await Faculty.findOne({ user: req.user._id });
    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: 'Faculty profile not found',
      });
    }

    // Check if there's already an active session by this faculty
    const activeSession = await AttendanceSession.findOne({
      faculty: faculty._id,
      status: 'active',
    });
    if (activeSession) {
      return res.status(400).json({
        success: false,
        message: 'You already have an active session. Please end it first.',
        data: activeSession,
      });
    }

    const now = new Date();
    const session = await AttendanceSession.create({
      faculty: faculty._id,
      subject: finalSubjectId,
      department,
      semester,
      section: section || 'A',
      date: now,
      startTime: now.toTimeString().split(' ')[0].substring(0, 5),
      status: 'active',
    });

    const populated = await AttendanceSession.findById(session._id)
      .populate('subject', 'name code')
      .populate('department', 'name code')
      .populate({
        path: 'faculty',
        populate: { path: 'user', select: 'name email' },
      });

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.emit('session:started', {
        session: populated,
      });
    }

    res.status(201).json({
      success: true,
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    End an attendance session
 * @route   PUT /api/sessions/:id/end
 * @access  Private (faculty)
 */
const endSession = async (req, res, next) => {
  try {
    const session = await AttendanceSession.findById(req.params.id);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found',
      });
    }

    if (session.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Session is not active',
      });
    }

    // Get all students in this department/semester/section who haven't been marked
    const allStudents = await Student.find({
      department: session.department,
      semester: session.semester,
      section: session.section,
    });

    const markedStudentIds = await Attendance.find({ session: session._id }).distinct('student');
    const markedSet = new Set(markedStudentIds.map((id) => id.toString()));

    // Mark unmarked students as absent
    const absentRecords = [];
    for (const student of allStudents) {
      if (!markedSet.has(student._id.toString())) {
        absentRecords.push({
          student: student._id,
          subject: session.subject,
          session: session._id,
          date: session.date,
          status: 'absent',
          verificationMethod: 'manual',
          markedAt: new Date(),
        });
      }
    }

    if (absentRecords.length > 0) {
      await Attendance.insertMany(absentRecords, { ordered: false }).catch(() => {
        // Ignore duplicate key errors from insertMany
      });
    }

    // Calculate totals
    const presentCount = await Attendance.countDocuments({
      session: session._id,
      status: { $in: ['present', 'late'] },
    });
    const absentCount = await Attendance.countDocuments({
      session: session._id,
      status: 'absent',
    });

    const now = new Date();
    session.status = 'completed';
    session.endTime = now.toTimeString().split(' ')[0].substring(0, 5);
    session.totalPresent = presentCount;
    session.totalAbsent = absentCount;
    await session.save();

    const populated = await AttendanceSession.findById(session._id)
      .populate('subject', 'name code')
      .populate('department', 'name code')
      .populate({
        path: 'faculty',
        populate: { path: 'user', select: 'name email' },
      });

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.emit('session:ended', {
        session: populated,
      });
    }

    res.status(200).json({
      success: true,
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all active sessions
 * @route   GET /api/sessions/active
 * @access  Private
 */
const getActiveSessions = async (req, res, next) => {
  try {
    const sessions = await AttendanceSession.find({ status: 'active' })
      .populate('subject', 'name code')
      .populate('department', 'name code')
      .populate({
        path: 'faculty',
        populate: { path: 'user', select: 'name email' },
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: sessions,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get sessions by faculty
 * @route   GET /api/sessions/faculty/:facultyId
 * @access  Private
 */
const getSessionsByFaculty = async (req, res, next) => {
  try {
    const { facultyId } = req.params;
    const { startDate, endDate, status, page = 1, limit = 20 } = req.query;

    const query = { faculty: facultyId };
    if (status) query.status = status;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await AttendanceSession.countDocuments(query);

    const sessions = await AttendanceSession.find(query)
      .populate('subject', 'name code')
      .populate('department', 'name code')
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      data: sessions,
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
 * @desc    Get single session with attendance
 * @route   GET /api/sessions/:id
 * @access  Private
 */
const getSession = async (req, res, next) => {
  try {
    const session = await AttendanceSession.findById(req.params.id)
      .populate('subject', 'name code')
      .populate('department', 'name code')
      .populate({
        path: 'faculty',
        populate: { path: 'user', select: 'name email' },
      });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found',
      });
    }

    const attendance = await Attendance.find({ session: req.params.id })
      .populate({
        path: 'student',
        populate: [
          { path: 'user', select: 'name email profileImage' },
          { path: 'department', select: 'name code' },
        ],
      })
      .sort({ markedAt: 1 });

    res.status(200).json({
      success: true,
      data: {
        session,
        attendance,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  startSession,
  endSession,
  getActiveSessions,
  getSessionsByFaculty,
  getSession,
};
