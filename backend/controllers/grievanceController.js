const Grievance = require('../models/Grievance');
const { buildOrganizationFilter } = require('../utils/organizationFilter');

exports.submitGrievance = async (req, res) => {
    try {
        const { subject, description, category, isAnonymous, evidence } = req.body;

        if (!req.organizationId) {
            return res.status(400).json({ success: false, error: 'Organization context is required.' });
        }

        const grievance = await Grievance.create({
            subject,
            description,
            category,
            isAnonymous: Boolean(isAnonymous),
            evidence,
            organization: req.organizationId,
            reporter: !isAnonymous && req.actorType === 'user' ? req.user._id : undefined
        });

        res.status(201).json({
            success: true,
            data: grievance
        });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

exports.getOrgGrievances = async (req, res) => {
    try {
        const grievances = await Grievance.find(
            buildOrganizationFilter('organization', req.params.orgId)
        ).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: grievances.length,
            data: grievances
        });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

exports.getGrievances = async (req, res) => {
    try {
        const grievances = await Grievance.find(
            buildOrganizationFilter('organization', req.organizationId)
        ).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: grievances.length,
            data: grievances
        });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

exports.updateGrievanceStatus = async (req, res) => {
    try {
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({ success: false, error: 'Status is required.' });
        }

        const grievance = await Grievance.findOneAndUpdate(
            { _id: req.params.id, ...buildOrganizationFilter('organization', req.organizationId) },
            { status },
            { new: true, runValidators: true }
        );

        if (!grievance) {
            return res.status(404).json({ success: false, error: 'Grievance not found.' });
        }

        res.status(200).json({
            success: true,
            data: grievance
        });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

exports.deleteGrievance = async (req, res) => {
    try {
        const grievance = await Grievance.findOneAndDelete({
            _id: req.params.id,
            ...buildOrganizationFilter('organization', req.organizationId)
        });

        if (!grievance) {
            return res.status(404).json({ success: false, error: 'Grievance not found.' });
        }

        res.status(200).json({
            success: true,
            data: {},
            message: 'Grievance removed successfully.'
        });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};
