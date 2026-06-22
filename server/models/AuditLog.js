const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: [true, 'Action is required'],
      trim: true,
    },
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    actorRole: {
      type: String,
      trim: true,
    },
    resource: {
      type: String,
      trim: true,
    },
    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    changes: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    ipAddress: {
      type: String,
      trim: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      immutable: true,
    },
  },
  { timestamps: false }
);

auditLogSchema.index({ timestamp: -1 });
auditLogSchema.index({ actor: 1, timestamp: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
