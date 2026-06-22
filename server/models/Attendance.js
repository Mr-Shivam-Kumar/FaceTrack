const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Student is required'],
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: [true, 'Subject is required'],
    },
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AttendanceSession',
      required: [true, 'Session is required'],
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
    },
    status: {
      type: String,
      enum: {
        values: ['present', 'absent', 'late'],
        message: 'Status must be present, absent, or late',
      },
      required: [true, 'Status is required'],
    },
    faceConfidence: {
      type: Number,
      min: 0,
      max: 1,
      default: null,
    },
    verificationMethod: {
      type: String,
      enum: {
        values: ['face', 'manual'],
        message: 'Verification method must be face or manual',
      },
      default: 'manual',
    },
    markedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// A student can only have one attendance record per session
attendanceSchema.index({ session: 1, student: 1 }, { unique: true });
attendanceSchema.index({ student: 1, subject: 1, date: 1 });

module.exports = mongoose.model('Attendance', attendanceSchema);
