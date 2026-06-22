const FaceEmbedding = require('../models/FaceEmbedding');
const Student = require('../models/Student');

/**
 * @desc    Register face for a student (save descriptors + photos)
 * @route   POST /api/face/register/:studentId
 * @access  Private (admin, faculty)
 */
const registerFace = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    let { descriptors } = req.body;

    if (typeof descriptors === 'string') {
      try {
        descriptors = JSON.parse(descriptors);
      } catch (err) {
        return res.status(400).json({
          success: false,
          message: 'Invalid descriptors JSON format',
        });
      }
    }

    if (!descriptors || !Array.isArray(descriptors) || descriptors.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide at least one face descriptor array',
      });
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    // Collect uploaded photo paths
    const photos = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach((file) => {
        photos.push(file.path.replace(/\\/g, '/'));
      });
    } else if (req.file) {
      photos.push(req.file.path.replace(/\\/g, '/'));
    }

    // Upsert face embedding
    let faceEmbedding = await FaceEmbedding.findOne({ student: studentId });

    if (faceEmbedding) {
      // Append new descriptors and photos
      faceEmbedding.descriptors = [...faceEmbedding.descriptors, ...descriptors];
      faceEmbedding.photos = [...faceEmbedding.photos, ...photos];
      await faceEmbedding.save();
    } else {
      faceEmbedding = await FaceEmbedding.create({
        student: studentId,
        descriptors,
        photos,
      });
    }

    // Update student face registration status
    student.faceRegistered = true;
    await student.save();

    res.status(200).json({
      success: true,
      data: {
        studentId,
        descriptorCount: faceEmbedding.descriptors.length,
        photoCount: faceEmbedding.photos.length,
      },
      message: 'Face registered successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get face data for a student
 * @route   GET /api/face/:studentId
 * @access  Private
 */
const getFaceData = async (req, res, next) => {
  try {
    const { studentId } = req.params;

    const faceEmbedding = await FaceEmbedding.findOne({ student: studentId }).populate({
      path: 'student',
      populate: { path: 'user', select: 'name email' },
    });

    if (!faceEmbedding) {
      return res.status(404).json({
        success: false,
        message: 'No face data found for this student',
      });
    }

    res.status(200).json({
      success: true,
      data: faceEmbedding,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all face embeddings (for building FaceMatcher on client)
 * @route   GET /api/face/all
 * @access  Private (faculty)
 */
const getAllFaceData = async (req, res, next) => {
  try {
    const faceEmbeddings = await FaceEmbedding.find()
      .populate({
        path: 'student',
        populate: [
          { path: 'user', select: 'name email profileImage' },
          { path: 'department', select: 'name code' },
        ],
      })
      .select('student descriptors');

    // Format for client-side FaceMatcher: array of { studentId, name, rollNumber, descriptors }
    const formatted = faceEmbeddings
      .filter((fe) => fe.student && fe.student.user)
      .map((fe) => ({
        studentId: fe.student._id,
        userId: fe.student.user._id,
        name: fe.student.user.name,
        rollNumber: fe.student.rollNumber,
        department: fe.student.department,
        descriptors: fe.descriptors,
      }));

    res.status(200).json({
      success: true,
      data: formatted,
      total: formatted.length,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get face data for students in a specific class/department/semester
 * @route   GET /api/face/class
 * @access  Private (faculty)
 */
const getClassFaceData = async (req, res, next) => {
  try {
    const { department, semester, section } = req.query;

    if (!department || !semester) {
      return res.status(400).json({
        success: false,
        message: 'Please provide department and semester',
      });
    }

    const studentQuery = {
      department,
      semester: parseInt(semester),
      faceRegistered: true,
    };
    if (section) studentQuery.section = section.toUpperCase();

    const students = await Student.find(studentQuery).select('_id');
    const studentIds = students.map((s) => s._id);

    const faceEmbeddings = await FaceEmbedding.find({ student: { $in: studentIds } }).populate({
      path: 'student',
      populate: [
        { path: 'user', select: 'name email profileImage' },
        { path: 'department', select: 'name code' },
      ],
    });

    const formatted = faceEmbeddings
      .filter((fe) => fe.student && fe.student.user)
      .map((fe) => ({
        studentId: fe.student._id,
        userId: fe.student.user._id,
        name: fe.student.user.name,
        rollNumber: fe.student.rollNumber,
        department: fe.student.department,
        descriptors: fe.descriptors,
      }));

    res.status(200).json({
      success: true,
      data: formatted,
      total: formatted.length,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete face data for a student
 * @route   DELETE /api/face/:studentId
 * @access  Private (admin)
 */
const deleteFaceData = async (req, res, next) => {
  try {
    const { studentId } = req.params;

    const result = await FaceEmbedding.findOneAndDelete({ student: studentId });
    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'No face data found for this student',
      });
    }

    // Update student face registration status
    await Student.findByIdAndUpdate(studentId, { faceRegistered: false });

    res.status(200).json({
      success: true,
      message: 'Face data deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerFace,
  getFaceData,
  getAllFaceData,
  getClassFaceData,
  deleteFaceData,
};
