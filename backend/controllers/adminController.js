const Report = require('../models/Report');
const { decrypt } = require('../utils/encryption');
const { buildReportOrganizationFilter } = require('../utils/organizationFilter');

exports.getAdminReports = async (req, res) => {
    try {
        const reports = await Report.find(buildReportOrganizationFilter(req.organizationId))
            .sort({ redFlagScore: -1, createdAt: -1 });

        res.status(200).json({
            success: true,
            count: reports.length,
            data: reports
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.getSingleReport = async (req, res) => {
    try {
        const report = await Report.findOne({
            _id: req.params.id,
            ...buildReportOrganizationFilter(req.organizationId)
        });

        if (!report) {
            return res.status(404).json({ success: false, error: 'Report not found.' });
        }

        const decryptedContent = decrypt(report.encryptedContent);

        res.status(200).json({
            success: true,
            data: {
                ...report.toObject(),
                decryptedContent
            }
        });
    } catch (err) {
        if (err.name === 'CastError') {
            return res.status(400).json({ success: false, error: 'Invalid report ID format.' });
        }

        res.status(500).json({ success: false, error: err.message });
    }
};
