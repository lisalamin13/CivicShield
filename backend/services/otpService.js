const OTPVerification = require('../models/OTPVerification');
const SystemSetting = require('../models/SystemSetting');
const { hashValue } = require('../utils/crypto');

const twilioConfigured = () =>
  process.env.TWILIO_ACCOUNT_SID &&
  process.env.TWILIO_AUTH_TOKEN &&
  process.env.TWILIO_PHONE_NUMBER;

const createTwilioClient = () => {
  const twilio = require('twilio');
  return twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
};

const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000));

const requestOtp = async ({ phone, purpose = 'login', userId = null, organizationId = null }) => {
  const settings = await SystemSetting.findOne({ key: 'platform' }).lean();
  const expiryMinutes = settings?.otpExpiryMinutes || 10;
  const maxAttempts = settings?.otpMaxAttempts || 5;
  const otp = generateOtp();

  await OTPVerification.create({
    phone,
    purpose,
    userId,
    organizationId,
    otpHash: hashValue(otp),
    maxAttempts,
    expiresAt: new Date(Date.now() + expiryMinutes * 60 * 1000),
  });

  if (twilioConfigured()) {
    const client = createTwilioClient();
    await client.messages.create({
      body: `Your CivicShield OTP is ${otp}. It expires in ${expiryMinutes} minutes.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone,
    });

    return { delivery: 'twilio' };
  }

  return {
    delivery: 'mock',
    previewCode: otp,
  };
};

const verifyOtp = async ({ phone, otp, purpose = 'login' }) => {
  const record = await OTPVerification.findOne({
    phone,
    purpose,
    verifiedAt: { $exists: false },
  })
    .sort({ createdAt: -1 })
    .select('+otpHash');

  if (!record) {
    return { valid: false, reason: 'OTP session not found' };
  }

  if (record.expiresAt < new Date()) {
    return { valid: false, reason: 'OTP expired' };
  }

  if (record.attempts >= record.maxAttempts) {
    return { valid: false, reason: 'OTP attempts exceeded' };
  }

  record.attempts += 1;

  if (record.otpHash !== hashValue(otp)) {
    await record.save();
    return { valid: false, reason: 'Invalid OTP' };
  }

  record.verifiedAt = new Date();
  await record.save();

  return {
    valid: true,
    record,
  };
};

module.exports = {
  requestOtp,
  verifyOtp,
};
