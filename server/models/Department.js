const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Department name is required'],
      unique: true,
      trim: true,
    },
    code: {
      type: String,
      required: [true, 'Department code is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    hodName: {
      type: String,
      trim: true,
      default: null,
    },
    hod: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Faculty',
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Department', departmentSchema);
