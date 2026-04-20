const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Staff = require('../models/Staff');
const SuperAdmin = require('../models/superAdmin');
const {
    startPhoneVerification,
    checkPhoneVerification,
    normalizePhoneNumber,
    maskPhoneNumber
} = require('../services/otpService');

const ADMIN_OTP_REQUIRED_ROLES = new Set(['SuperAdmin', 'OrgAdmin']);
const ADMIN_OTP_SESSION_PURPOSE = 'admin_login_otp';
const ADMIN_OTP_SESSION_EXPIRE = process.env.ADMIN_OTP_SESSION_EXPIRE || '10m';

const signToken = (
    payload,
    expiresIn = process.env.JWT_EXPIRE || '1d'
) => jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });

const buildAuthPayload = (principal, actorType) => ({
    id: principal._id,
    role: principal.role,
    organizationId: principal.organizationId || principal.organization || undefined,
    actorType
});

const buildUserResponse = (user) => ({
    id: user._id,
    name: user.name,
    email: user.email,
    phoneNumber: user.phoneNumber,
    role: user.role,
    organization: user.organization
});

const buildPhoneLookup = (phoneNumber) => {
    const normalizedPhoneNumber = normalizePhoneNumber(phoneNumber);

    return [...new Set([
        String(phoneNumber || '').trim(),
        normalizedPhoneNumber
    ].filter(Boolean))];
};

const requiresAdminOtp = (role) => ADMIN_OTP_REQUIRED_ROLES.has(role);

const signAdminOtpSessionToken = (user) => signToken(
    {
        id: user._id,
        role: user.role,
        organizationId: user.organization || undefined,
        actorType: 'user',
        purpose: ADMIN_OTP_SESSION_PURPOSE
    },
    ADMIN_OTP_SESSION_EXPIRE
);

const verifyAdminOtpSessionToken = (otpSessionToken) => {
    try {
        const decoded = jwt.verify(otpSessionToken, process.env.JWT_SECRET);

        if (decoded.purpose !== ADMIN_OTP_SESSION_PURPOSE || decoded.actorType !== 'user') {
            return null;
        }

        return decoded;
    } catch (err) {
        return null;
    }
};

const sendAdminOtpChallenge = async (user) => {
    if (!user.phoneNumber) {
        throw new Error('A phone number is required on the admin account before OTP login can be used.');
    }

    await startPhoneVerification(user.phoneNumber);

    return {
        otpSessionToken: signAdminOtpSessionToken(user),
        phoneNumberHint: maskPhoneNumber(user.phoneNumber)
    };
};

exports.register = async (req, res) => {
    try {
        const { name, email, password, phoneNumber, role, organization, organizationId } = req.body;
        const resolvedOrganizationId = organizationId || organization;

        if (!name || !email || !password || !resolvedOrganizationId) {
            return res.status(400).json({
                success: false,
                error: 'Please provide name, email, password, and organization.'
            });
        }

        if (requiresAdminOtp(role) && !phoneNumber) {
            return res.status(400).json({
                success: false,
                error: 'A phone number is required for SuperAdmin and OrgAdmin accounts.'
            });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({
                success: false,
                error: 'A user with this email already exists.'
            });
        }

        const user = await User.create({
            name,
            email,
            password,
            phoneNumber,
            role,
            organization: resolvedOrganizationId
        });

        const token = signToken(buildAuthPayload(user, 'user'));

        res.status(201).json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phoneNumber: user.phoneNumber,
                role: user.role,
                organization: user.organization
            }
        });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

exports.login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            success: false,
            error: 'Please provide an email and password.'
        });
    }

    try {
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }

        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }

        if (requiresAdminOtp(user.role)) {
            if (!user.phoneNumber) {
                return res.status(400).json({
                    success: false,
                    error: 'This admin account does not have a phone number configured for OTP.'
                });
            }

            const otpChallenge = await sendAdminOtpChallenge(user);

            return res.status(200).json({
                success: true,
                requiresOtp: true,
                otpSessionToken: otpChallenge.otpSessionToken,
                phoneNumberHint: otpChallenge.phoneNumberHint,
                message: 'OTP sent to the registered phone number.'
            });
        }

        const token = signToken(buildAuthPayload(user, 'user'));

        res.status(200).json({
            success: true,
            token,
            user: buildUserResponse(user)
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.verifyAdminLoginOTP = async (req, res) => {
    try {
        const { otpSessionToken, otp } = req.body;

        if (!otpSessionToken || !otp) {
            return res.status(400).json({
                success: false,
                error: 'OTP session token and OTP are required.'
            });
        }

        const decodedSession = verifyAdminOtpSessionToken(otpSessionToken);
        if (!decodedSession) {
            return res.status(401).json({
                success: false,
                error: 'Invalid or expired OTP session.'
            });
        }

        const user = await User.findById(decodedSession.id);
        if (!user || !requiresAdminOtp(user.role)) {
            return res.status(401).json({
                success: false,
                error: 'Admin account not found for OTP verification.'
            });
        }

        if (!user.phoneNumber) {
            return res.status(400).json({
                success: false,
                error: 'No phone number is configured for this admin account.'
            });
        }

        const isOtpValid = await checkPhoneVerification(user.phoneNumber, otp);
        if (!isOtpValid) {
            return res.status(401).json({
                success: false,
                error: 'Invalid or expired OTP.'
            });
        }

        const token = signToken(buildAuthPayload(user, 'user'));

        res.status(200).json({
            success: true,
            token,
            user: buildUserResponse(user)
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.resendAdminLoginOTP = async (req, res) => {
    try {
        const { otpSessionToken } = req.body;

        if (!otpSessionToken) {
            return res.status(400).json({
                success: false,
                error: 'OTP session token is required.'
            });
        }

        const decodedSession = verifyAdminOtpSessionToken(otpSessionToken);
        if (!decodedSession) {
            return res.status(401).json({
                success: false,
                error: 'Invalid or expired OTP session.'
            });
        }

        const user = await User.findById(decodedSession.id);
        if (!user || !requiresAdminOtp(user.role)) {
            return res.status(401).json({
                success: false,
                error: 'Admin account not found for OTP verification.'
            });
        }

        if (!user.phoneNumber) {
            return res.status(400).json({
                success: false,
                error: 'This admin account does not have a phone number configured for OTP.'
            });
        }

        const otpChallenge = await sendAdminOtpChallenge(user);

        res.status(200).json({
            success: true,
            otpSessionToken: otpChallenge.otpSessionToken,
            phoneNumberHint: otpChallenge.phoneNumberHint,
            message: 'OTP resent to the registered phone number.'
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.requestOTP = async (req, res) => {
    try {
        const { phoneNumber } = req.body;
        if (!phoneNumber) {
            return res.status(400).json({ success: false, error: 'Phone number is required.' });
        }

        const staff = await Staff.findOne({
            phoneNumber: { $in: buildPhoneLookup(phoneNumber) },
            isActive: true
        });
        if (!staff) {
            return res.status(404).json({ success: false, error: 'Active staff member not found.' });
        }

        await startPhoneVerification(staff.phoneNumber);

        res.status(200).json({ success: true, message: 'OTP sent successfully.' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.verifyOTP = async (req, res) => {
    try {
        const { phoneNumber, otp } = req.body;
        const staff = await Staff.findOne({
            phoneNumber: { $in: buildPhoneLookup(phoneNumber) },
            isActive: true
        });

        if (!staff) {
            return res.status(404).json({ success: false, error: 'Active staff member not found.' });
        }

        const isOtpValid = await checkPhoneVerification(staff.phoneNumber, otp);
        if (!isOtpValid) {
            return res.status(401).json({ success: false, error: 'Invalid or expired OTP.' });
        }

        const token = signToken(buildAuthPayload(staff, 'staff'));

        res.status(200).json({
            success: true,
            token,
            role: staff.role,
            organizationId: staff.organizationId
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.requestSuperOTP = async (req, res) => {
    try {
        const { phoneNumber } = req.body;
        if (!phoneNumber) {
            return res.status(400).json({ success: false, error: 'Phone number is required.' });
        }

        const admin = await SuperAdmin.findOne({
            phoneNumber: { $in: buildPhoneLookup(phoneNumber) }
        });
        if (!admin) {
            return res.status(404).json({ success: false, error: 'Super admin not found.' });
        }

        await startPhoneVerification(admin.phoneNumber);

        res.status(200).json({ success: true, message: 'Super admin OTP sent successfully.' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.verifySuperOTP = async (req, res) => {
    try {
        const { phoneNumber, otp } = req.body;
        const admin = await SuperAdmin.findOne({
            phoneNumber: { $in: buildPhoneLookup(phoneNumber) }
        });

        if (!admin) {
            return res.status(404).json({ success: false, error: 'Super admin not found.' });
        }

        const isOtpValid = await checkPhoneVerification(admin.phoneNumber, otp);
        if (!isOtpValid) {
            return res.status(401).json({ success: false, error: 'Invalid or expired super admin OTP.' });
        }

        const token = signToken(buildAuthPayload(admin, 'super_admin'), '12h');

        res.status(200).json({
            success: true,
            token,
            role: admin.role
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};
