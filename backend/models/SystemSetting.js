const mongoose = require('mongoose');

const systemSettingSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      default: 'platform',
      unique: true,
    },
    supportPhone: String,
    twilioSenderNumber: String,
    contactEmail: String,
    maintenanceMode: {
      type: Boolean,
      default: false,
    },
    maintenanceMessage: {
      type: String,
      default: 'CivicShield is under scheduled maintenance.',
    },
    brandingLogoUrl: String,
    deepseekModelName: {
      type: String,
      default: 'deepseek-chat',
    },
    aiMonthlyTokenLimit: {
      type: Number,
      default: 500000,
    },
    otpExpiryMinutes: {
      type: Number,
      default: 10,
    },
    otpMaxAttempts: {
      type: Number,
      default: 5,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model('SystemSetting', systemSettingSchema);
