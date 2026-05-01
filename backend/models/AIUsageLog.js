const mongoose = require('mongoose');

const aiUsageLogSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      default: null,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    feature: {
      type: String,
      enum: ['ethics_chat', 'report_intelligence', 'draft_reply', 'analytics'],
      required: true,
    },
    modelName: String,
    tokenIn: { type: Number, default: 0 },
    tokenOut: { type: Number, default: 0 },
    totalTokens: { type: Number, default: 0 },
    latencyMs: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['success', 'fallback', 'error'],
      default: 'success',
    },
    costEstimate: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model('AIUsageLog', aiUsageLogSchema);
