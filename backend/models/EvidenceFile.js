const mongoose = require('mongoose');

const evidenceFileSchema = new mongoose.Schema(
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
    uploadedByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    uploadedByAnonymous: {
      type: Boolean,
      default: false,
    },
    originalName: String,
    mimeType: String,
    size: Number,
    storageProvider: {
      type: String,
      enum: ['cloudinary', 'local'],
      default: 'local',
    },
    storagePath: String,
    url: String,
    scrubbed: {
      type: Boolean,
      default: false,
    },
    scrubNotes: String,
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model('EvidenceFile', evidenceFileSchema);
