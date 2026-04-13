const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Staff = require('../models/Staff');
const SuperAdmin = require('../models/superAdmin');

const signToken = ({
    id,
    role,
    organizationId,
    actorType,
    expiresIn = process.env.JWT_EXPIRE || '1d'
}) => jwt.sign(
    { id, role, organizationId, actorType },
    process.env.JWT_SECRET,
    { expiresIn }
);

const buildAuthPayload = (principal, actorType) => ({
    id: principal._id,
    role: principal.role,
    organizationId: principal.organizationId || principal.organization || undefined,
    actorType
});

exports.register = async (req, res) => {
    try {
        const { name, email, password, role, organization, organizationId } = req.body;
        const resolvedOrganizationId = organizationId || organization;

        if (!name || !email || !password || !resolvedOrganizationId) {
            return res.status(400).json({
                success: false,
                error: 'Please provide name, email, password, and organization.'
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

        const token = signToken(buildAuthPayload(user, 'user'));

        res.status(200).json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                organization: user.organization
            }
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

        const staff = await Staff.findOne({ phoneNumber, isActive: true });
        if (!staff) {
            return res.status(404).json({ success: false, error: 'Active staff member not found.' });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        staff.otp = otp;
        staff.otpExpires = Date.now() + 5 * 60 * 1000;
        await staff.save();

        console.log(`STAFF OTP: ${otp}`);

        res.status(200).json({ success: true, message: 'OTP generated successfully.' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.verifyOTP = async (req, res) => {
    try {
        const { phoneNumber, otp } = req.body;
        const staff = await Staff.findOne({
            phoneNumber,
            otp,
            otpExpires: { $gt: Date.now() },
            isActive: true
        });

        if (!staff) {
            return res.status(401).json({ success: false, error: 'Invalid or expired OTP.' });
        }

        staff.otp = undefined;
        staff.otpExpires = undefined;
        await staff.save();

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

        const admin = await SuperAdmin.findOne({ phoneNumber });
        if (!admin) {
            return res.status(404).json({ success: false, error: 'Super admin not found.' });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        admin.otp = otp;
        admin.otpExpires = Date.now() + 5 * 60 * 1000;
        await admin.save();

        console.log(`SUPER ADMIN OTP: ${otp}`);

        res.status(200).json({ success: true, message: 'Super admin OTP generated successfully.' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.verifySuperOTP = async (req, res) => {
    try {
        const { phoneNumber, otp } = req.body;
        const admin = await SuperAdmin.findOne({
            phoneNumber,
            otp,
            otpExpires: { $gt: Date.now() }
        });

        if (!admin) {
            return res.status(401).json({ success: false, error: 'Invalid or expired super admin OTP.' });
        }

        admin.otp = undefined;
        admin.otpExpires = undefined;
        await admin.save();

        const token = signToken({
            ...buildAuthPayload(admin, 'super_admin'),
            expiresIn: '12h'
        });

        res.status(200).json({
            success: true,
            token,
            role: admin.role
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};
