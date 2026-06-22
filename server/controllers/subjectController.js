const Subject = require('../models/Subject');

/**
 * @desc    Get all subjects with filters
 * @route   GET /api/subjects
 * @access  Private
 */
const getSubjects = async (req, res, next) => {
  try {
    const { department, semester, faculty, search } = req.query;

    const query = {};
    if (req.user.role === 'faculty' && req.user.isHOD) {
      query.department = req.user.hodDepartment;
    } else if (department) {
      query.department = department;
    }
    if (semester) query.semester = parseInt(semester);
    if (faculty) query.faculty = faculty;

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [{ name: searchRegex }, { code: searchRegex }];
    }

    const subjects = await Subject.find(query)
      .populate('department', 'name code')
      .populate({
        path: 'faculty',
        populate: { path: 'user', select: 'name email' },
      })
      .sort({ code: 1 });

    res.status(200).json({
      success: true,
      data: subjects,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single subject
 * @route   GET /api/subjects/:id
 * @access  Private
 */
const getSubject = async (req, res, next) => {
  try {
    const subject = await Subject.findById(req.params.id)
      .populate('department', 'name code')
      .populate({
        path: 'faculty',
        populate: { path: 'user', select: 'name email' },
      });

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found',
      });
    }

    res.status(200).json({
      success: true,
      data: subject,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create subject
 * @route   POST /api/subjects
 * @access  Private (admin)
 */
const createSubject = async (req, res, next) => {
  try {
    const { name, code, department, semester, creditHours, faculty } = req.body;

    if (!name || !code || !department || !semester) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, code, department, and semester',
      });
    }

    if (req.user.role === 'faculty' && req.user.isHOD) {
      if (department.toString() !== req.user.hodDepartment.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: HOD can only manage subjects in their own department',
        });
      }
    }

    const subject = await Subject.create({
      name,
      code,
      department,
      semester,
      creditHours: creditHours || 3,
      faculty: faculty || null,
    });

    // If faculty is assigned, add subject to faculty's subjects array
    if (faculty) {
      const Faculty = require('../models/Faculty');
      await Faculty.findByIdAndUpdate(faculty, {
        $addToSet: { subjects: subject._id },
      });
    }

    const populated = await Subject.findById(subject._id)
      .populate('department', 'name code')
      .populate({
        path: 'faculty',
        populate: { path: 'user', select: 'name email' },
      });

    res.status(201).json({
      success: true,
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update subject
 * @route   PUT /api/subjects/:id
 * @access  Private (admin)
 */
const updateSubject = async (req, res, next) => {
  try {
    const { name, code, department, semester, creditHours, faculty } = req.body;

    const subject = await Subject.findById(req.params.id);
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found',
      });
    }

    if (req.user.role === 'faculty' && req.user.isHOD) {
      if (subject.department.toString() !== req.user.hodDepartment.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: HOD can only manage subjects in their own department',
        });
      }
      if (department && department.toString() !== req.user.hodDepartment.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: HOD cannot reassign a subject to a different department',
        });
      }
    }

    const updateFields = {};
    if (name) updateFields.name = name;
    if (code) updateFields.code = code;
    if (department) updateFields.department = department;
    if (semester) updateFields.semester = semester;
    if (creditHours) updateFields.creditHours = creditHours;
    if (faculty !== undefined) updateFields.faculty = faculty || null;

    // Handle faculty assignment change
    if (faculty !== undefined) {
      const FacultyModel = require('../models/Faculty');
      // Remove from old faculty
      if (subject.faculty) {
        await FacultyModel.findByIdAndUpdate(subject.faculty, {
          $pull: { subjects: subject._id },
        });
      }
      // Add to new faculty
      if (faculty) {
        await FacultyModel.findByIdAndUpdate(faculty, {
          $addToSet: { subjects: subject._id },
        });
      }
    }

    const updated = await Subject.findByIdAndUpdate(req.params.id, updateFields, {
      new: true,
      runValidators: true,
    })
      .populate('department', 'name code')
      .populate({
        path: 'faculty',
        populate: { path: 'user', select: 'name email' },
      });

    res.status(200).json({
      success: true,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete subject
 * @route   DELETE /api/subjects/:id
 * @access  Private (admin)
 */
const deleteSubject = async (req, res, next) => {
  try {
    const subject = await Subject.findById(req.params.id);
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found',
      });
    }

    if (req.user.role === 'faculty' && req.user.isHOD) {
      if (subject.department.toString() !== req.user.hodDepartment.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: HOD can only manage subjects in their own department',
        });
      }
    }

    // Remove from faculty's subjects array
    if (subject.faculty) {
      const FacultyModel = require('../models/Faculty');
      await FacultyModel.findByIdAndUpdate(subject.faculty, {
        $pull: { subjects: subject._id },
      });
    }

    await Subject.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Subject deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSubjects,
  getSubject,
  createSubject,
  updateSubject,
  deleteSubject,
};
