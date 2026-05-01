const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema(
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
    senderType: {
      type: String,
      enum: ['anonymous_reporter', 'reporter', 'org_admin', 'investigator', 'ai_assistant'],
      required: true,
    },
    senderUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    bodyEncrypted: {
      type: String,
      required: true,
    },
    visibleToReporter: {
      type: Boolean,
      default: true,
    },
    readAt: Date,
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
