const mongoose = require('mongoose');

const classSchema = new mongoose.Schema(
  {
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: [true, 'Subject is required'],
    },
    faculty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Faculty',
      required: [true, 'Faculty is required'],
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
    schedule: {
      day: {
        type: String,
        enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      },
      startTime: {
        type: String,
      },
      endTime: {
        type: String,
      },
    },
    room: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Class', classSchema);
