const Policy = require('../models/Policy');

// @desc    Add a new policy/rule for an org
// @route   POST /api/v1/policies
exports.addPolicy = async (req, res) => {
    try {
        const policy = await Policy.create(req.body);
        res.status(201).json({ success: true, data: policy });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

// @desc    Get all policies for a specific college/org
// @route   GET /api/v1/policies/:orgId
exports.getPolicies = async (req, res) => {
    try {
        const policies = await Policy.find({ organization: req.params.orgId });
        res.status(200).json({ success: true, data: policies });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};