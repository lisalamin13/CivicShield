const mongoose = require('mongoose');

const reportStatusHistorySchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    reportId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Report',
      required: true,
      index: true,
    },
    previousStatus: String,
    newStatus: {
      type: String,
      required: true,
    },
    changedByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    note: String,
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model('ReportStatusHistory', reportStatusHistorySchema);
