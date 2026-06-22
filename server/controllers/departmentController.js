const Department = require('../models/Department');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const Subject = require('../models/Subject');
const User = require('../models/User');

// Helper to resolve HOD name to Faculty reference
const resolveHod = async (hodName, departmentId) => {
  if (!hodName) return null;
  const users = await User.find({ name: hodName, role: 'faculty' }).select('_id');
  if (users.length > 0) {
    const faculty = await Faculty.findOne({
      user: { $in: users.map(u => u._id) },
      department: departmentId
    });
    return faculty ? faculty._id : null;
  }
  return null;
};

/**
 * @desc    Get all departments with student count
 * @route   GET /api/departments
 * @access  Private
 */
const getDepartments = async (req, res, next) => {
  try {
    let query = {};
    if (req.user.role === 'faculty' && req.user.isHOD) {
      query = { _id: req.user.hodDepartment };
    }
    const departments = await Department.find(query).sort({ name: 1 });

    // Get student counts for each department
    const deptData = await Promise.all(
      departments.map(async (dept) => {
        const studentCount = await Student.countDocuments({ department: dept._id });
        const facultyCount = await Faculty.countDocuments({ department: dept._id });
        const subjectCount = await Subject.countDocuments({ department: dept._id });
        return {
          ...dept.toObject(),
          studentCount,
          facultyCount,
          subjectCount,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: deptData,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single department with stats
 * @route   GET /api/departments/:id
 * @access  Private
 */
const getDepartment = async (req, res, next) => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found',
      });
    }

    const studentCount = await Student.countDocuments({ department: department._id });
    const facultyCount = await Faculty.countDocuments({ department: department._id });
    const subjects = await Subject.find({ department: department._id }).populate('faculty');
    const faculties = await Faculty.find({ department: department._id }).populate(
      'user',
      'name email'
    );

    res.status(200).json({
      success: true,
      data: {
        ...department.toObject(),
        studentCount,
        facultyCount,
        subjects,
        faculties,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create department
 * @route   POST /api/departments
 * @access  Private (admin)
 */
const createDepartment = async (req, res, next) => {
  try {
    const { name, code, hodName } = req.body;

    if (!name || !code) {
      return res.status(400).json({
        success: false,
        message: 'Please provide department name and code',
      });
    }

    const department = await Department.create({ name, code, hodName });

    if (hodName) {
      const hodId = await resolveHod(hodName, department._id);
      if (hodId) {
        department.hod = hodId;
        await department.save();
      }
    }

    res.status(201).json({
      success: true,
      data: department,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update department
 * @route   PUT /api/departments/:id
 * @access  Private (admin)
 */
const updateDepartment = async (req, res, next) => {
  try {
    const { name, code, hodName } = req.body;

    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found',
      });
    }

    const updateFields = {};
    if (name) updateFields.name = name;
    if (code) updateFields.code = code;
    if (hodName !== undefined) {
      updateFields.hodName = hodName;
      updateFields.hod = await resolveHod(hodName, req.params.id);
    }

    const updated = await Department.findByIdAndUpdate(req.params.id, updateFields, {
      new: true,
      runValidators: true,
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
 * @desc    Delete department
 * @route   DELETE /api/departments/:id
 * @access  Private (admin)
 */
const deleteDepartment = async (req, res, next) => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found',
      });
    }

    // Check for related entities
    const studentCount = await Student.countDocuments({ department: req.params.id });
    const facultyCount = await Faculty.countDocuments({ department: req.params.id });

    if (studentCount > 0 || facultyCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete department. It has ${studentCount} students and ${facultyCount} faculty members. Reassign them first.`,
      });
    }

    await Department.findByIdAndDelete(req.params.id);
    await Subject.deleteMany({ department: req.params.id });

    res.status(200).json({
      success: true,
      message: 'Department deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDepartments,
  getDepartment,
  createDepartment,
  updateDepartment,
  deleteDepartment,
};
