const jwt = require('jsonwebtoken');
const User = require('../models/User');

// @desc    Login user & issue tenant-aware token
// @route   POST /api/v1/auth/login
// @access  Public
exports.login = async (req, res) => 
{
    const { email, password } = req.body;
        // Check for email & password
    if (!email || !password) 
    {
        return res.status(400).json({ success: false, error: 'Please provide an email and password' });
    }

    try 
    {
        const user = await User.findOne({ email }).select('+password');
        if (!user) 
        {
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }
        // Check if password matches
        const isMatch = await user.matchPassword(password);
        if (!isMatch) 
        {
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }

        // Create token including organizationId for strict multi-tenant isolation [cite: 346, 621]
        const token = jwt.sign(
            { 
                id: user._id, 
                organizationId: user.organizationId 
            }, 
            process.env.JWT_SECRET, 
            { expiresIn: process.env.JWT_EXPIRE }
        );

        res.status(200).json({ success: true, token });
    } 
    catch (err) 
    {
        res.status(500).json({ success: false, error: err.message });
    }
};

// @desc    Protect routes & enforce tenant boundaries
// @access  Private
// In controllers/auth.js
exports.protect = async (req, res, next) => 
    {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) 
    {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) 
    {
        return res.status(401).json({ success: false, error: 'Not authorized' });
    }

    try 
    {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id);

        // Attach organizationId from the token to enforce data isolation
        req.organizationId = decoded.organizationId;

        next(); 
    } 
    catch (err) 
    {
        return res.status(401).json({ success: false, error: 'Not authorized' });
    }
};