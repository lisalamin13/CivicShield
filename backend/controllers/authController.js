const User = require('../models/User');
const Organization = require('../models/Organization');

// @desc    Register a new user (Admin)
// @route   POST /api/v1/auth/register
exports.register = async (req, res) => {
    try {
        // Use organization as the primary name to match your Postman tests
        const { name, email, password, role, organization } = req.body;

        // Use organization (the ID string) to find the record
        const org = await Organization.findById(organization);
        
        if (!org) {
            return res.status(404).json({ 
                success: false, 
                error: `Organization not found. Searched for ID: ${organization}` 
            });
        }

        const user = await User.create({
            name,
            email,
            password,
            role,
            organization: organization // Links the user to the ID
        });

        const token = user.getSignedJwtToken();

        res.status(201).json({
            success: true,
            message: `User created and linked to ${org.name}`,
            token,
            data: { id: user._id, name: user.name, email: user.email, role: user.role }
        });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

// @desc    Login user
// @route   POST /api/v1/auth/login
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Validation for email & password
        if (!email || !password) {
            return res.status(400).json({ success: false, error: 'Please provide an email and password' });
        }

        // 2. Check for user (must manually select password because of "select: false" in Model)
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }

        // 3. Check if password matches
        const isMatch = await user.matchPassword(password);

        if (!isMatch) {
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }

        // 4. Create token
        const token = user.getSignedJwtToken();

        res.status(200).json({
            success: true,
            token
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};