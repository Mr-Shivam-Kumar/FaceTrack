const Attendance = require('../models/Attendance');
const AttendanceSession = require('../models/AttendanceSession');
const Student = require('../models/Student');
const Subject = require('../models/Subject');

/**
 * @desc    Mark single student attendance (during face recognition)
 * @route   POST /api/attendance/mark
 * @access  Private (faculty)
 */
const markAttendance = async (req, res, next) => {
  try {
    const { studentId, sessionId, status, faceConfidence, verificationMethod } = req.body;

    if (!studentId || !sessionId || !status) {
      return res.status(400).json({
        success: false,
        message: 'Please provide studentId, sessionId, and status',
      });
    }

    const session = await AttendanceSession.findById(sessionId);
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

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    // Check if already marked
    const existing = await Attendance.findOne({ session: sessionId, student: studentId });
    if (existing) {
      // Update existing record
      existing.status = status;
      existing.faceConfidence = faceConfidence || existing.faceConfidence;
      existing.verificationMethod = verificationMethod || existing.verificationMethod;
      existing.markedAt = new Date();
      await existing.save();

      const populated = await Attendance.findById(existing._id)
        .populate({
          path: 'student',
          populate: { path: 'user', select: 'name email' },
        })
        .populate('subject', 'name code');

      // Update session counts
      await updateSessionCounts(sessionId);

      // Emit socket event if io is available
      const io = req.app.get('io');
      if (io) {
        io.to(`session:${sessionId}`).emit('attendance:updated', {
          attendance: populated,
          sessionId,
        });
      }

      return res.status(200).json({
        success: true,
        data: populated,
        message: 'Attendance updated',
      });
    }

    // Create new attendance record
    const attendance = await Attendance.create({
      student: studentId,
      subject: session.subject,
      session: sessionId,
      date: session.date,
      status,
      faceConfidence: faceConfidence || null,
      verificationMethod: verificationMethod || 'manual',
      markedAt: new Date(),
    });

    const populated = await Attendance.findById(attendance._id)
      .populate({
        path: 'student',
        populate: { path: 'user', select: 'name email' },
      })
      .populate('subject', 'name code');

    // Update session counts
    await updateSessionCounts(sessionId);

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.to(`session:${sessionId}`).emit('attendance:marked', {
        attendance: populated,
        sessionId,
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
 * @desc    Mark bulk attendance
 * @route   POST /api/attendance/bulk
 * @access  Private (faculty)
 */
const markBulkAttendance = async (req, res, next) => {
  try {
    const { sessionId, records } = req.body;

    if (!sessionId || !records || !Array.isArray(records) || records.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide sessionId and records array',
      });
    }

    const session = await AttendanceSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found',
      });
    }

    const results = [];
    const errors = [];

    for (const record of records) {
      try {
        const existing = await Attendance.findOne({
          session: sessionId,
          student: record.studentId,
        });

        if (existing) {
          existing.status = record.status;
          existing.faceConfidence = record.faceConfidence || existing.faceConfidence;
          existing.verificationMethod = record.verificationMethod || existing.verificationMethod;
          existing.markedAt = new Date();
          await existing.save();
          results.push(existing);
        } else {
          const attendance = await Attendance.create({
            student: record.studentId,
            subject: session.subject,
            session: sessionId,
            date: session.date,
            status: record.status,
            faceConfidence: record.faceConfidence || null,
            verificationMethod: record.verificationMethod || 'manual',
            markedAt: new Date(),
          });
          results.push(attendance);
        }
      } catch (err) {
        errors.push({ studentId: record.studentId, error: err.message });
      }
    }

    // Update session counts
    await updateSessionCounts(sessionId);

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.to(`session:${sessionId}`).emit('attendance:bulk-marked', {
        count: results.length,
        sessionId,
      });
    }

    res.status(201).json({
      success: true,
      data: {
        marked: results.length,
        errors: errors.length > 0 ? errors : undefined,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get attendance by session
 * @route   GET /api/attendance/session/:sessionId
 * @access  Private
 */
const getAttendanceBySession = async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    const session = await AttendanceSession.findById(sessionId)
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

    const attendance = await Attendance.find({ session: sessionId })
      .populate({
        path: 'student',
        populate: [
          { path: 'user', select: 'name email profileImage' },
          { path: 'department', select: 'name code' },
        ],
      })
      .populate('subject', 'name code')
      .sort({ 'student.rollNumber': 1 });

    res.status(200).json({
      success: true,
      data: {
        session,
        attendance,
        summary: {
          total: attendance.length,
          present: attendance.filter((a) => a.status === 'present').length,
          absent: attendance.filter((a) => a.status === 'absent').length,
          late: attendance.filter((a) => a.status === 'late').length,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get attendance by student
 * @route   GET /api/attendance/student/:studentId
 * @access  Private
 */
const getAttendanceByStudent = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const { startDate, endDate, subject } = req.query;

    const query = { student: studentId };
    if (subject) query.subject = subject;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const attendance = await Attendance.find(query)
      .populate('subject', 'name code')
      .populate({
        path: 'session',
        populate: {
          path: 'faculty',
          populate: { path: 'user', select: 'name' },
        },
      })
      .sort({ date: -1 });

    const total = attendance.length;
    const present = attendance.filter((a) => a.status === 'present' || a.status === 'late').length;

    res.status(200).json({
      success: true,
      data: attendance,
      summary: {
        total,
        present,
        absent: total - present,
        percentage: total > 0 ? ((present / total) * 100).toFixed(2) : 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get attendance by subject
 * @route   GET /api/attendance/subject/:subjectId
 * @access  Private
 */
const getAttendanceBySubject = async (req, res, next) => {
  try {
    const { subjectId } = req.params;
    const { startDate, endDate } = req.query;

    const query = { subject: subjectId };
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const attendance = await Attendance.find(query)
      .populate({
        path: 'student',
        populate: [
          { path: 'user', select: 'name email' },
          { path: 'department', select: 'name code' },
        ],
      })
      .populate('session', 'date startTime endTime')
      .sort({ date: -1 });

    const total = attendance.length;
    const present = attendance.filter((a) => a.status === 'present' || a.status === 'late').length;

    res.status(200).json({
      success: true,
      data: attendance,
      summary: {
        total,
        present,
        absent: total - present,
        percentage: total > 0 ? ((present / total) * 100).toFixed(2) : 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get attendance statistics
 * @route   GET /api/attendance/stats
 * @access  Private (admin, faculty)
 */
const getAttendanceStats = async (req, res, next) => {
  try {
    const { department, semester, startDate, endDate } = req.query;

    let targetDept = department;
    if (req.user.role === 'faculty' && req.user.isHOD) {
      targetDept = req.user.hodDepartment;
    }

    const matchStage = {};
    if (startDate || endDate) {
      matchStage.date = {};
      if (startDate) matchStage.date.$gte = new Date(startDate);
      if (endDate) matchStage.date.$lte = new Date(endDate);
    }

    if (targetDept) {
      const students = await Student.find({ department: targetDept }).select('_id');
      const studentIds = students.map(s => s._id);
      matchStage.student = { $in: studentIds };
    }

    // Overall stats
    const totalRecords = await Attendance.countDocuments(matchStage);
    const presentRecords = await Attendance.countDocuments({
      ...matchStage,
      status: { $in: ['present', 'late'] },
    });

    // Daily trend (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dailyStats = await Attendance.aggregate([
      { $match: { date: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          total: { $sum: 1 },
          present: {
            $sum: { $cond: [{ $in: ['$status', ['present', 'late']] }, 1, 0] },
          },
          absent: {
            $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Subject-wise stats
    const subjectStats = await Attendance.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$subject',
          total: { $sum: 1 },
          present: {
            $sum: { $cond: [{ $in: ['$status', ['present', 'late']] }, 1, 0] },
          },
        },
      },
    ]);

    const populatedSubjectStats = await Subject.populate(subjectStats, {
      path: '_id',
      select: 'name code',
    });

    res.status(200).json({
      success: true,
      data: {
        overall: {
          totalRecords,
          present: presentRecords,
          absent: totalRecords - presentRecords,
          percentage: totalRecords > 0 ? ((presentRecords / totalRecords) * 100).toFixed(2) : 0,
        },
        dailyTrend: dailyStats,
        subjectWise: populatedSubjectStats.map((s) => ({
          subject: s._id,
          total: s.total,
          present: s.present,
          percentage: s.total > 0 ? ((s.present / s.total) * 100).toFixed(2) : 0,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a single attendance record
 * @route   PUT /api/attendance/:id
 * @access  Private (faculty, admin)
 */
const updateAttendanceRecord = async (req, res, next) => {
  try {
    const { status, verificationMethod } = req.body;

    const attendance = await Attendance.findById(req.params.id);
    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found',
      });
    }

    if (status) attendance.status = status;
    if (verificationMethod) attendance.verificationMethod = verificationMethod;
    attendance.markedAt = new Date();

    await attendance.save();

    // Update session counts
    await updateSessionCounts(attendance.session);

    const populated = await Attendance.findById(attendance._id)
      .populate({
        path: 'student',
        populate: { path: 'user', select: 'name email' },
      })
      .populate('subject', 'name code');

    res.status(200).json({
      success: true,
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Helper: Update session present/absent counts
 */
async function updateSessionCounts(sessionId) {
  const presentCount = await Attendance.countDocuments({
    session: sessionId,
    status: { $in: ['present', 'late'] },
  });
  const absentCount = await Attendance.countDocuments({
    session: sessionId,
    status: 'absent',
  });

  await AttendanceSession.findByIdAndUpdate(sessionId, {
    totalPresent: presentCount,
    totalAbsent: absentCount,
  });
}

/**
 * @desc    Get all attendance records with optional filters
 * @route   GET /api/attendance
 * @access  Private (admin, faculty)
 */
const getAttendanceRecords = async (req, res, next) => {
  try {
    const { department, subject, startDate, endDate, status, semester } = req.query;
    const query = {};

    if (status) query.status = status;

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    if (subject) query.subject = subject;

    let targetDept = department;
    if (req.user.role === 'faculty' && req.user.isHOD) {
      targetDept = req.user.hodDepartment;
    }

    if (targetDept || semester) {
      const studentQuery = {};
      if (targetDept) studentQuery.department = targetDept;
      if (semester) studentQuery.semester = parseInt(semester);
      
      const students = await Student.find(studentQuery).select('_id');
      const studentIds = students.map(s => s._id);
      query.student = { $in: studentIds };
    }

    const records = await Attendance.find(query)
      .populate({
        path: 'student',
        populate: [
          { path: 'user', select: 'name email profileImage' },
          { path: 'department', select: 'name code' }
        ]
      })
      .populate('subject', 'name code')
      .populate({
        path: 'session',
        populate: {
          path: 'faculty',
          populate: { path: 'user', select: 'name' }
        }
      })
      .sort({ date: -1, markedAt: -1 });

    res.status(200).json({
      success: true,
      data: records
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  markAttendance,
  markBulkAttendance,
  getAttendanceBySession,
  getAttendanceByStudent,
  getAttendanceBySubject,
  getAttendanceStats,
  getAttendanceRecords,
  updateAttendanceRecord,
};
