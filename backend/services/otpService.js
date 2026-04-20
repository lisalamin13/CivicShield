const https = require('node:https');

const CONSOLE_OTP_TTL_MS = Number(process.env.CONSOLE_OTP_TTL_MS || 5 * 60 * 1000);
const consoleOtpStore = new Map();

const normalizePhoneNumber = (value) => String(value || '')
    .trim()
    .replace(/\s+/g, '');

const maskPhoneNumber = (value) => {
    const normalized = normalizePhoneNumber(value);

    if (!normalized) {
        return '';
    }

    if (normalized.length <= 4) {
        return normalized;
    }

    const visibleDigits = normalized.slice(-4);
    const maskedPrefix = normalized
        .slice(0, -4)
        .replace(/\d/g, '*');

    return `${maskedPrefix}${visibleDigits}`;
};

const hasTwilioConfig = () => Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_VERIFY_SERVICE_SID
);

const resolveOtpProvider = () => {
    const configuredProvider = String(process.env.OTP_PROVIDER || '').trim().toLowerCase();

    if (configuredProvider) {
        return configuredProvider;
    }

    return hasTwilioConfig() ? 'twilio' : 'console';
};

const twilioVerifyRequest = (resourcePath, payload) => new Promise((resolve, reject) => {
    if (!hasTwilioConfig()) {
        reject(new Error('Twilio Verify is not configured.'));
        return;
    }

    const body = new URLSearchParams(payload).toString();
    const auth = Buffer.from(
        `${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`
    ).toString('base64');

    const request = https.request(
        {
            method: 'POST',
            hostname: 'verify.twilio.com',
            path: `/v2/Services/${encodeURIComponent(process.env.TWILIO_VERIFY_SERVICE_SID)}${resourcePath}`,
            headers: {
                Authorization: `Basic ${auth}`,
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(body)
            }
        },
        (response) => {
            const chunks = [];

            response.on('data', (chunk) => chunks.push(chunk));
            response.on('end', () => {
                const rawBody = Buffer.concat(chunks).toString('utf8');
                let parsedBody = {};

                if (rawBody) {
                    try {
                        parsedBody = JSON.parse(rawBody);
                    } catch (err) {
                        reject(new Error('Twilio returned an unexpected response.'));
                        return;
                    }
                }

                if ((response.statusCode || 500) >= 400) {
                    reject(new Error(parsedBody.message || 'Twilio OTP request failed.'));
                    return;
                }

                resolve(parsedBody);
            });
        }
    );

    request.on('error', (err) => reject(new Error(`Twilio OTP request failed: ${err.message}`)));
    request.write(body);
    request.end();
});

const startConsoleVerification = async (phoneNumber) => {
    const normalizedPhoneNumber = normalizePhoneNumber(phoneNumber);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    consoleOtpStore.set(normalizedPhoneNumber, {
        otp,
        expiresAt: Date.now() + CONSOLE_OTP_TTL_MS
    });

    console.log(`[OTP][console] ${normalizedPhoneNumber}: ${otp}`);

    return {
        provider: 'console',
        status: 'pending',
        channel: 'sms'
    };
};

const checkConsoleVerification = async (phoneNumber, otp) => {
    const normalizedPhoneNumber = normalizePhoneNumber(phoneNumber);
    const storedOtp = consoleOtpStore.get(normalizedPhoneNumber);

    if (!storedOtp) {
        return false;
    }

    if (storedOtp.expiresAt <= Date.now()) {
        consoleOtpStore.delete(normalizedPhoneNumber);
        return false;
    }

    const isValid = String(otp || '').trim() === storedOtp.otp;

    if (isValid) {
        consoleOtpStore.delete(normalizedPhoneNumber);
    }

    return isValid;
};

const startPhoneVerification = async (phoneNumber) => {
    const normalizedPhoneNumber = normalizePhoneNumber(phoneNumber);

    if (!normalizedPhoneNumber) {
        throw new Error('Phone number is required for OTP delivery.');
    }

    if (resolveOtpProvider() === 'twilio') {
        const response = await twilioVerifyRequest('/Verifications', {
            To: normalizedPhoneNumber,
            Channel: process.env.TWILIO_VERIFY_CHANNEL || 'sms'
        });

        return {
            provider: 'twilio',
            status: response.status,
            channel: response.channel,
            sid: response.sid
        };
    }

    return startConsoleVerification(normalizedPhoneNumber);
};

const checkPhoneVerification = async (phoneNumber, otp) => {
    const normalizedPhoneNumber = normalizePhoneNumber(phoneNumber);

    if (!normalizedPhoneNumber || !String(otp || '').trim()) {
        return false;
    }

    if (resolveOtpProvider() === 'twilio') {
        const response = await twilioVerifyRequest('/VerificationCheck', {
            To: normalizedPhoneNumber,
            Code: String(otp).trim()
        });

        return response.status === 'approved';
    }

    return checkConsoleVerification(normalizedPhoneNumber, otp);
};

module.exports = {
    startPhoneVerification,
    checkPhoneVerification,
    normalizePhoneNumber,
    maskPhoneNumber
};
