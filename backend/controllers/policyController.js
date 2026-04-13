const Policy = require('../models/Policy');
const { buildOrganizationFilter } = require('../utils/organizationFilter');

exports.addPolicy = async (req, res) => {
    try {
        const { title, content, category } = req.body;

        if (!req.organizationId) {
            return res.status(400).json({ success: false, error: 'Organization context is required.' });
        }

        const policy = await Policy.create({
            organization: req.organizationId,
            title,
            content,
            category
        });

        res.status(201).json({ success: true, data: policy });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

exports.getPolicies = async (req, res) => {
    try {
        const policies = await Policy.find(
            buildOrganizationFilter('organization', req.params.orgId)
        ).sort({ createdAt: -1 });

        res.status(200).json({ success: true, data: policies });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};
