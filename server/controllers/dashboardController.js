const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const Department = require('../models/Department');
const Attendance = require('../models/Attendance');
const AttendanceSession = require('../models/AttendanceSession');
const Subject = require('../models/Subject');

/**
 * @desc    Get admin dashboard KPIs
 * @route   GET /api/dashboard/admin
 * @access  Private (admin)
 */
const getAdminDashboard = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const isHOD = req.user.role === 'faculty' && req.user.isHOD;
    const hodDept = req.user.hodDepartment;

    // Basic counts
    const totalStudents = await Student.countDocuments(isHOD ? { department: hodDept } : {});
    const totalFaculty = await Faculty.countDocuments(isHOD ? { department: hodDept } : {});
    const totalDepartments = isHOD ? 1 : await Department.countDocuments();

    // Today's attendance
    const attendanceQuery = { date: { $gte: today, $lt: tomorrow } };
    if (isHOD) {
      const students = await Student.find({ department: hodDept }).select('_id');
      attendanceQuery.student = { $in: students.map(s => s._id) };
    }
    const todayAttendance = await Attendance.find(attendanceQuery);

    const presentToday = todayAttendance.filter(
      (a) => a.status === 'present' || a.status === 'late'
    ).length;
    const absentToday = todayAttendance.filter((a) => a.status === 'absent').length;
    const totalToday = todayAttendance.length;
    const attendancePercentage =
      totalToday > 0 ? ((presentToday / totalToday) * 100).toFixed(2) : 0;

    // Active sessions
    const activeSessionsQuery = { status: 'active' };
    if (isHOD) activeSessionsQuery.department = hodDept;
    const activeSessions = await AttendanceSession.countDocuments(activeSessionsQuery);

    // This week's classes
    const startOfWeek = new Date(today);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const weekSessionsQuery = { date: { $gte: startOfWeek } };
    if (isHOD) weekSessionsQuery.department = hodDept;
    const classesThisWeek = await AttendanceSession.countDocuments(weekSessionsQuery);

    // Total subjects
    const totalSubjects = await Subject.countDocuments(isHOD ? { department: hodDept } : {});

    // Registered faces count
    const registeredFaces = await Student.countDocuments(isHOD ? { department: hodDept, faceRegistered: true } : { faceRegistered: true });

    res.status(200).json({
      success: true,
      data: {
        totalStudents,
        totalFaculty,
        totalDepartments,
        totalSubjects,
        presentToday,
        absentToday,
        attendancePercentage: parseFloat(attendancePercentage),
        activeSessions,
        classesThisWeek,
        registeredFaces,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get daily attendance trend (last 30 days)
 * @route   GET /api/dashboard/daily-trend
 * @access  Private (admin, faculty)
 */
const getDailyTrend = async (req, res, next) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const matchStage = { date: { $gte: thirtyDaysAgo } };
    if (req.user.role === 'faculty' && req.user.isHOD) {
      const students = await Student.find({ department: req.user.hodDepartment }).select('_id');
      matchStage.student = { $in: students.map(s => s._id) };
    }

    const dailyData = await Attendance.aggregate([
      { $match: matchStage },
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
      {
        $project: {
          date: '$_id',
          total: 1,
          present: 1,
          absent: 1,
          percentage: {
            $cond: [
              { $gt: ['$total', 0] },
              { $multiply: [{ $divide: ['$present', '$total'] }, 100] },
              0,
            ],
          },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: dailyData,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get monthly attendance trend (last 6 months)
 * @route   GET /api/dashboard/monthly-trend
 * @access  Private (admin)
 */
const getMonthlyTrend = async (req, res, next) => {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const matchStage = { date: { $gte: sixMonthsAgo } };
    if (req.user.role === 'faculty' && req.user.isHOD) {
      const students = await Student.find({ department: req.user.hodDepartment }).select('_id');
      matchStage.student = { $in: students.map(s => s._id) };
    }

    const monthlyData = await Attendance.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$date' } },
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
      {
        $project: {
          month: '$_id',
          total: 1,
          present: 1,
          absent: 1,
          percentage: {
            $cond: [
              { $gt: ['$total', 0] },
              { $multiply: [{ $divide: ['$present', '$total'] }, 100] },
              0,
            ],
          },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: monthlyData,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get attendance stats by department
 * @route   GET /api/dashboard/department-stats
 * @access  Private (admin)
 */
const getDepartmentStats = async (req, res, next) => {
  try {
    let query = {};
    if (req.user.role === 'faculty' && req.user.isHOD) {
      query = { _id: req.user.hodDepartment };
    }
    const departments = await Department.find(query);

    const stats = await Promise.all(
      departments.map(async (dept) => {
        const students = await Student.find({ department: dept._id }).select('_id');
        const studentIds = students.map((s) => s._id);

        const totalRecords = await Attendance.countDocuments({ student: { $in: studentIds } });
        const presentRecords = await Attendance.countDocuments({
          student: { $in: studentIds },
          status: { $in: ['present', 'late'] },
        });

        return {
          department: { _id: dept._id, name: dept.name, code: dept.code },
          studentCount: students.length,
          totalRecords,
          present: presentRecords,
          absent: totalRecords - presentRecords,
          percentage: totalRecords > 0 ? ((presentRecords / totalRecords) * 100).toFixed(2) : 0,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get student distribution by department
 * @route   GET /api/dashboard/student-distribution
 * @access  Private (admin)
 */
const getStudentDistribution = async (req, res, next) => {
  try {
    const matchStage = {};
    if (req.user.role === 'faculty' && req.user.isHOD) {
      matchStage.department = req.user.hodDepartment;
    }

    const distribution = await Student.aggregate([
      ...(Object.keys(matchStage).length > 0 ? [{ $match: matchStage }] : []),
      {
        $group: {
          _id: '$department',
          count: { $sum: 1 },
        },
      },
    ]);

    const populated = await Department.populate(distribution, {
      path: '_id',
      select: 'name code',
    });

    const result = populated.map((d) => ({
      department: d._id,
      count: d.count,
    }));

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get attendance heatmap data (last 6 months daily)
 * @route   GET /api/dashboard/heatmap
 * @access  Private (admin)
 */
const getAttendanceHeatmap = async (req, res, next) => {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const matchStage = { date: { $gte: sixMonthsAgo } };
    if (req.user.role === 'faculty' && req.user.isHOD) {
      const students = await Student.find({ department: req.user.hodDepartment }).select('_id');
      matchStage.student = { $in: students.map(s => s._id) };
    }

    const heatmapData = await Attendance.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          total: { $sum: 1 },
          present: {
            $sum: { $cond: [{ $in: ['$status', ['present', 'late']] }, 1, 0] },
          },
        },
      },
      {
        $project: {
          date: '$_id',
          count: '$total',
          percentage: {
            $cond: [
              { $gt: ['$total', 0] },
              { $round: [{ $multiply: [{ $divide: ['$present', '$total'] }, 100] }, 1] },
              0,
            ],
          },
        },
      },
      { $sort: { date: 1 } },
    ]);

    res.status(200).json({
      success: true,
      data: heatmapData,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get AI-like insights
 * @route   GET /api/dashboard/insights
 * @access  Private (admin)
 */
const getInsights = async (req, res, next) => {
  try {
    const insights = [];

    const isHOD = req.user.role === 'faculty' && req.user.isHOD;
    const hodDept = req.user.hodDepartment;

    // 1. Students below 75% attendance
    const studentQuery = {};
    if (isHOD) studentQuery.department = hodDept;
    
    const allStudents = await Student.find(studentQuery).populate('user', 'name email').populate('department', 'name code');
    const lowAttendanceStudents = [];

    for (const student of allStudents) {
      const total = await Attendance.countDocuments({ student: student._id });
      if (total === 0) continue;

      const present = await Attendance.countDocuments({
        student: student._id,
        status: { $in: ['present', 'late'] },
      });

      const percentage = (present / total) * 100;
      if (percentage < 75) {
        lowAttendanceStudents.push({
          student: {
            _id: student._id,
            name: student.user ? student.user.name : 'Unknown',
            rollNumber: student.rollNumber,
            department: student.department,
          },
          percentage: percentage.toFixed(2),
          totalClasses: total,
          attended: present,
        });
      }
    }

    insights.push({
      type: 'low_attendance',
      title: 'Students Below 75% Attendance',
      description: `${lowAttendanceStudents.length} students have attendance below 75%`,
      severity: lowAttendanceStudents.length > 10 ? 'high' : lowAttendanceStudents.length > 5 ? 'medium' : 'low',
      data: lowAttendanceStudents.sort((a, b) => a.percentage - b.percentage).slice(0, 20),
    });

    // 2. Attendance trend (compare last 7 days vs previous 7 days)
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const fourteenDaysAgo = new Date(now);
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const trendQuery = {};
    if (isHOD) {
      const students = await Student.find({ department: hodDept }).select('_id');
      trendQuery.student = { $in: students.map(s => s._id) };
    }

    const recentTotal = await Attendance.countDocuments({ ...trendQuery, date: { $gte: sevenDaysAgo } });
    const recentPresent = await Attendance.countDocuments({
      ...trendQuery,
      date: { $gte: sevenDaysAgo },
      status: { $in: ['present', 'late'] },
    });
    const prevTotal = await Attendance.countDocuments({
      ...trendQuery,
      date: { $gte: fourteenDaysAgo, $lt: sevenDaysAgo },
    });
    const prevPresent = await Attendance.countDocuments({
      ...trendQuery,
      date: { $gte: fourteenDaysAgo, $lt: sevenDaysAgo },
      status: { $in: ['present', 'late'] },
    });

    const recentPct = recentTotal > 0 ? (recentPresent / recentTotal) * 100 : 0;
    const prevPct = prevTotal > 0 ? (prevPresent / prevTotal) * 100 : 0;
    const trendChange = recentPct - prevPct;

    insights.push({
      type: 'attendance_trend',
      title: 'Weekly Attendance Trend',
      description:
        trendChange >= 0
          ? `Attendance increased by ${trendChange.toFixed(1)}% compared to last week`
          : `Attendance decreased by ${Math.abs(trendChange).toFixed(1)}% compared to last week`,
      severity: trendChange < -5 ? 'high' : trendChange < 0 ? 'medium' : 'low',
      data: {
        currentWeek: recentPct.toFixed(2),
        previousWeek: prevPct.toFixed(2),
        change: trendChange.toFixed(2),
      },
    });

    // 3. Best and worst departments
    const deptQuery = {};
    if (isHOD) deptQuery._id = hodDept;
    
    const departments = await Department.find(deptQuery);
    const deptPerformance = [];

    for (const dept of departments) {
      const deptStudents = await Student.find({ department: dept._id }).select('_id');
      const deptStudentIds = deptStudents.map((s) => s._id);
      if (deptStudentIds.length === 0) continue;

      const total = await Attendance.countDocuments({ student: { $in: deptStudentIds } });
      if (total === 0) continue;

      const present = await Attendance.countDocuments({
        student: { $in: deptStudentIds },
        status: { $in: ['present', 'late'] },
      });

      deptPerformance.push({
        department: { _id: dept._id, name: dept.name, code: dept.code },
        percentage: ((present / total) * 100).toFixed(2),
        totalRecords: total,
      });
    }

    deptPerformance.sort((a, b) => b.percentage - a.percentage);

    if (deptPerformance.length > 0) {
      insights.push({
        type: 'department_performance',
        title: 'Department Performance',
        description: isHOD
          ? `Department ${deptPerformance[0].department.name} average attendance is ${deptPerformance[0].percentage}%`
          : `Best: ${deptPerformance[0].department.name} (${deptPerformance[0].percentage}%) | Worst: ${deptPerformance[deptPerformance.length - 1].department.name} (${deptPerformance[deptPerformance.length - 1].percentage}%)`,
        severity: 'info',
        data: deptPerformance,
      });
    }

    res.status(200).json({
      success: true,
      data: insights,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get faculty-specific dashboard
 * @route   GET /api/dashboard/faculty
 * @access  Private (faculty)
 */
const getFacultyDashboard = async (req, res, next) => {
  try {
    const faculty = await Faculty.findOne({ user: req.user._id });
    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: 'Faculty profile not found',
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Assigned subjects
    const subjects = await Subject.find({ faculty: faculty._id }).populate('department', 'name code');

    // Today's sessions
    const todaySessions = await AttendanceSession.find({
      faculty: faculty._id,
      date: { $gte: today, $lt: tomorrow },
    })
      .populate('subject', 'name code')
      .populate('department', 'name code');

    // Active sessions
    const activeSessions = await AttendanceSession.find({
      faculty: faculty._id,
      status: 'active',
    })
      .populate('subject', 'name code')
      .populate('department', 'name code');

    // Total sessions conducted
    const totalSessions = await AttendanceSession.countDocuments({
      faculty: faculty._id,
      status: 'completed',
    });

    // This month's stats
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthSessions = await AttendanceSession.find({
      faculty: faculty._id,
      date: { $gte: startOfMonth },
      status: 'completed',
    });

    const monthSessionIds = monthSessions.map((s) => s._id);
    const monthTotal = await Attendance.countDocuments({ session: { $in: monthSessionIds } });
    const monthPresent = await Attendance.countDocuments({
      session: { $in: monthSessionIds },
      status: { $in: ['present', 'late'] },
    });

    // Recent sessions
    const recentSessions = await AttendanceSession.find({ faculty: faculty._id })
      .populate('subject', 'name code')
      .populate('department', 'name code')
      .sort({ date: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      data: {
        faculty: {
          _id: faculty._id,
          employeeId: faculty.employeeId,
          designation: faculty.designation,
        },
        subjects,
        todaySessions,
        activeSessions,
        totalSessions,
        monthlyStats: {
          sessionsHeld: monthSessions.length,
          totalRecords: monthTotal,
          present: monthPresent,
          absent: monthTotal - monthPresent,
          percentage: monthTotal > 0 ? ((monthPresent / monthTotal) * 100).toFixed(2) : 0,
        },
        recentSessions,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAdminDashboard,
  getDailyTrend,
  getMonthlyTrend,
  getDepartmentStats,
  getStudentDistribution,
  getAttendanceHeatmap,
  getInsights,
  getFacultyDashboard,
};
