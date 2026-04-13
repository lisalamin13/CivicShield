const Staff = require('../models/Staff');
const SuperAdmin = require('../models/superAdmin');
const jwt = require('jsonwebtoken');

// 1. requestOTP
exports.requestOTP = async (req, res) => {
    try {
        const { phoneNumber } = req.body;
        const staff = await Staff.findOne({ phoneNumber });
        if (!staff) return res.status(404).json({ success: false, error: "Staff not found" });
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        staff.otp = otp;
        staff.otpExpires = Date.now() + 5 * 60 * 1000;
        await staff.save();
        console.log(`\n🔑 STAFF OTP: [ ${otp} ]\n`);
        res.status(200).json({ success: true, message: "OTP sent to terminal" });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// 2. verifyOTP
exports.verifyOTP = async (req, res) => {
    try {
        const { phoneNumber, otp } = req.body;
        const staff = await Staff.findOne({ phoneNumber, otp, otpExpires: { $gt: Date.now() } });
        if (!staff) return res.status(401).json({ success: false, error: "Invalid/Expired OTP" });
        staff.otp = undefined;
        staff.otpExpires = undefined;
        await staff.save();
        const token = jwt.sign({ id: staff._id, organizationId: staff.organizationId, role: staff.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
        res.status(200).json({ success: true, token, role: staff.role });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// 3. requestSuperOTP
exports.requestSuperOTP = async (req, res) => {
    try {
        const { phoneNumber } = req.body;
        const admin = await SuperAdmin.findOne({ phoneNumber });
        if (!admin) return res.status(404).json({ success: false, error: "Super Admin not found" });
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        admin.otp = otp;
        admin.otpExpires = Date.now() + 5 * 60 * 1000;
        await admin.save();
        console.log(`\n👑 SUPER ADMIN OTP: [ ${otp} ]\n`);
        res.status(200).json({ success: true, message: "Super OTP sent to terminal" });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// 4. verifySuperOTP
exports.verifySuperOTP = async (req, res) => {
    try {
        const { phoneNumber, otp } = req.body;
        const admin = await SuperAdmin.findOne({ phoneNumber, otp, otpExpires: { $gt: Date.now() } });
        if (!admin) return res.status(401).json({ success: false, error: "Invalid/Expired Super OTP" });
        admin.otp = undefined;
        admin.otpExpires = undefined;
        await admin.save();
        const token = jwt.sign({ id: admin._id, role: 'SUPER_ADMIN' }, process.env.JWT_SECRET, { expiresIn: '12h' });
        res.status(200).json({ success: true, token, role: 'SUPER_ADMIN' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};