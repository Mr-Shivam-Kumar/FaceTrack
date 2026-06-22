const mongoose = require('mongoose');

const faceEmbeddingSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Student is required'],
    },
    descriptors: {
      type: [[Number]],
      default: [],
    },
    photos: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

faceEmbeddingSchema.index({ student: 1 });

module.exports = mongoose.model('FaceEmbedding', faceEmbeddingSchema);
