const Grievance = require('../models/Grievance');

// @desc    Submit a new grievance
// @route   POST /api/v1/grievances
exports.submitGrievance = async (req, res) => {
    try {
        // We take the organization ID from the body for now
        // Later, we can get it from the logged-in user's data
        const grievance = await Grievance.create(req.body);

        res.status(201).json({
            success: true,
            data: grievance
        });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};
// Add this below your submitGrievance function
exports.getOrgGrievances = async (req, res) => {
    try {
        // Look for all grievances where the organization matches the ID in the URL
        const grievances = await Grievance.find({ organization: req.params.orgId });

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
        let grievance = await Grievance.findById(req.params.id);

        if (!grievance) {
            return res.status(404).json({ success: false, error: 'Grievance not found' });
        }

        // We only want to allow updating the status and maybe admin comments
        const { status } = req.body;

        grievance = await Grievance.findByIdAndUpdate(
            req.params.id, 
            { status }, 
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            data: grievance
        });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

// @desc    Delete a grievance
// @route   DELETE /api/v1/grievances/:id
exports.deleteGrievance = async (req, res) => {
    try {
        const grievance = await Grievance.findById(req.params.id);

        if (!grievance) {
            return res.status(404).json({ success: false, error: 'Grievance not found' });
        }

        await grievance.deleteOne();

        res.status(200).json({
            success: true,
            data: {},
            message: 'Grievance removed successfully'
        });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

exports.getGrievances = async (req, res) => {
    try {
        // Find grievances that match the Admin's organization ID
        const grievances = await Grievance.find({ organization: req.user.organization });

        res.status(200).json({
            success: true,
            count: grievances.length,
            data: grievances
        });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

// @desc    Update grievance status
// @route   PUT /api/v1/grievances/:id
// @access  Private (Admin only)
exports.updateGrievanceStatus = async (req, res) => {
    try {
        let grievance = await Grievance.findById(req.params.id);

        if (!grievance) {
            return res.status(404).json({ success: false, error: 'Grievance not found' });
        }

        // Update the status to 'Resolved' (or whatever is sent in the body)
        grievance = await Grievance.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

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
        const grievance = await Grievance.findByIdAndDelete(req.params.id);

        if (!grievance) {
            return res.status(404).json({ success: false, error: 'Grievance not found' });
        }

        res.status(200).json({ success: true, data: {} });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};