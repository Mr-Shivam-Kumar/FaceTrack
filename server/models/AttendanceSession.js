const mongoose = require('mongoose');

const attendanceSessionSchema = new mongoose.Schema(
  {
    faculty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Faculty',
      required: [true, 'Faculty is required'],
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: [true, 'Subject is required'],
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: [true, 'Department is required'],
    },
    semester: {
      type: Number,
      required: true,
      min: 1,
      max: 8,
    },
    section: {
      type: String,
      default: 'A',
      uppercase: true,
      trim: true,
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
    },
    startTime: {
      type: String,
      required: [true, 'Start time is required'],
    },
    endTime: {
      type: String,
      default: null,
    },
    totalPresent: {
      type: Number,
      default: 0,
    },
    totalAbsent: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: {
        values: ['active', 'completed', 'cancelled'],
        message: 'Status must be active, completed, or cancelled',
      },
      default: 'active',
    },
  },
  { timestamps: true }
);

attendanceSessionSchema.index({ faculty: 1, date: 1 });

module.exports = mongoose.model('AttendanceSession', attendanceSessionSchema);
