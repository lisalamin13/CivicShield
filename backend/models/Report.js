const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    reporterUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    trackingCode: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    accessKeyHash: {
      type: String,
      required: true,
      select: false,
    },
    anonymous: {
      type: Boolean,
      default: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      default: 'unclassified',
      index: true,
    },
    department: String,
    incidentDate: Date,
    location: String,
    narrativeEncrypted: {
      type: String,
      required: true,
    },
    reporterEmailEncrypted: String,
    reporterPhoneEncrypted: String,
    status: {
      type: String,
      enum: [
        'submitted',
        'under_review',
        'investigating',
        'waiting_on_reporter',
        'resolved',
        'closed',
        'escalated',
      ],
      default: 'submitted',
      index: true,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
      index: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    assignedDepartment: String,
    resolutionSummary: String,
    aiSummary: String,
    aiSentiment: String,
    aiUrgency: String,
    aiRiskScore: { type: Number, default: 0 },
    aiTags: {
      type: [String],
      default: [],
    },
    evidenceCount: {
      type: Number,
      default: 0,
    },
    replyCount: {
      type: Number,
      default: 0,
    },
    abuseFlagsCount: {
      type: Number,
      default: 0,
    },
    lastActivityAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    metadata: {
      submissionChannel: { type: String, default: 'web' },
      sourceIpHash: String,
      userAgentHash: String,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model('Report', reportSchema);
