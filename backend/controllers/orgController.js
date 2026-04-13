const Organization = require('../models/Organization');

const slugify = (value) => String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

exports.registerOrganization = async (req, res) => {
    try {
        const { name, email, status } = req.body;

        if (!name || !email) {
            return res.status(400).json({
                success: false,
                error: 'Please provide both organization name and email.'
            });
        }

        const slug = slugify(req.body.slug || name);
        const organization = await Organization.create({
            _id: req.body._id || slug,
            name,
            email,
            slug,
            status
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
