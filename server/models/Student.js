const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      unique: true,
    },
    rollNumber: {
      type: String,
      required: [true, 'Roll number is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: [true, 'Department is required'],
    },
    semester: {
      type: Number,
      required: [true, 'Semester is required'],
      min: [1, 'Semester must be between 1 and 8'],
      max: [8, 'Semester must be between 1 and 8'],
    },
    section: {
      type: String,
      trim: true,
      uppercase: true,
      default: 'A',
    },
    batch: {
      type: String,
      trim: true,
    },
    faceRegistered: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

studentSchema.index({ department: 1, semester: 1 });

module.exports = mongoose.model('Student', studentSchema);
