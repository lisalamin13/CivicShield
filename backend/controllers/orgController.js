const Organization = require('../models/Organization');

// @desc    Register a new organization
// @route   POST /api/v1/organizations
exports.registerOrganization = async (req, res) => {
    try {
        const { name, email } = req.body;

        // Generate a simple slug from the name (e.g., "Don Bosco" -> "don-bosco")
        const slug = name.split(' ').join('-').toLowerCase();

        const organization = await Organization.create({
            name,
            email,
            slug
        });

        res.status(201).json({
            success: true,
            data: organization
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};