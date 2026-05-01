const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
  },
  { _id: true },
);

const organizationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    type: {
      type: String,
      default: 'institution',
    },
    industry: String,
    sizeBand: {
      type: String,
      enum: ['1-50', '51-200', '201-1000', '1000+'],
      default: '51-200',
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'suspended'],
      default: 'pending',
      index: true,
    },
    contactEmail: String,
    contactPhone: String,
    adminUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    branding: {
      logoUrl: String,
      primaryColor: { type: String, default: '#183B2B' },
      accentColor: { type: String, default: '#C48A3A' },
    },
    departments: {
      type: [departmentSchema],
      default: [],
    },
    complianceSettings: {
      requireEvidence: { type: Boolean, default: false },
      allowAnonymous: { type: Boolean, default: true },
      autoAiClassification: { type: Boolean, default: true },
    },
    subscriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subscription',
    },
    approvedAt: Date,
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    notes: String,
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model('Organization', organizationSchema);
