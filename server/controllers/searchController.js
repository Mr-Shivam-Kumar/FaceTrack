const User = require('../models/User');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const Department = require('../models/Department');
const Subject = require('../models/Subject');

/**
 * @desc    Global search across students, faculty, departments, subjects
 * @route   GET /api/search?q=query
 * @access  Private
 */
const globalSearch = async (req, res, next) => {
  try {
    const { q, type } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters',
      });
    }

    const searchRegex = new RegExp(q.trim(), 'i');
    const results = {};

    // Search based on type filter or all
    const searchAll = !type;

    if (searchAll || type === 'students') {
      // Find users matching the name
      const matchingUsers = await User.find({
        name: searchRegex,
        role: 'student',
      }).select('_id');
      const userIds = matchingUsers.map((u) => u._id);

      const students = await Student.find({
        $or: [{ user: { $in: userIds } }, { rollNumber: searchRegex }],
      })
        .populate('user', 'name email profileImage')
        .populate('department', 'name code')
        .limit(10);

      results.students = students;
    }

    if (searchAll || type === 'faculty') {
      const matchingUsers = await User.find({
        name: searchRegex,
        role: 'faculty',
      }).select('_id');
      const userIds = matchingUsers.map((u) => u._id);

      const faculty = await Faculty.find({
        $or: [{ user: { $in: userIds } }, { employeeId: searchRegex }],
      })
        .populate('user', 'name email profileImage')
        .populate('department', 'name code')
        .limit(10);

      results.faculty = faculty;
    }

    if (searchAll || type === 'departments') {
      const departments = await Department.find({
        $or: [{ name: searchRegex }, { code: searchRegex }],
      }).limit(10);

      results.departments = departments;
    }

    if (searchAll || type === 'subjects') {
      const subjects = await Subject.find({
        $or: [{ name: searchRegex }, { code: searchRegex }],
      })
        .populate('department', 'name code')
        .populate({
          path: 'faculty',
          populate: { path: 'user', select: 'name' },
        })
        .limit(10);

      results.subjects = subjects;
    }

    // Count total results
    const totalResults = Object.values(results).reduce(
      (sum, arr) => sum + (arr ? arr.length : 0),
      0
    );

    res.status(200).json({
      success: true,
      data: results,
      total: totalResults,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  globalSearch,
};
