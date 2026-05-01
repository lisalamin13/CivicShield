const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      unique: true,
      index: true,
    },
    planName: {
      type: String,
      default: 'Growth',
    },
    status: {
      type: String,
      enum: ['trial', 'active', 'past_due', 'canceled'],
      default: 'trial',
    },
    billingCycle: {
      type: String,
      enum: ['monthly', 'yearly'],
      default: 'monthly',
    },
    price: {
      type: Number,
      default: 0,
    },
    seatLimit: {
      type: Number,
      default: 10,
    },
    aiTokenLimit: {
      type: Number,
      default: 100000,
    },
    aiTokensUsed: {
      type: Number,
      default: 0,
    },
    renewalDate: Date,
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model('Subscription', subscriptionSchema);
