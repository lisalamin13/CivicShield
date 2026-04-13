const crypto = require('crypto');
const Report = require('../models/Report');
const { encrypt } = require('../utils/encryption');
const { analyzeGrievance } = require('../services/aiServices');
const { buildReportOrganizationFilter } = require('../utils/organizationFilter');

exports.submitReport = async (req, res) => {
    try {
        const organizationId = req.organizationId ? String(req.organizationId) : null;
        const content = typeof req.body.content === 'string' ? req.body.content.trim() : '';

        if (!organizationId) {
            return res.status(400).json({ success: false, error: 'Organization context is required.' });
        }

        if (!content) {
            return res.status(400).json({ success: false, error: 'Please provide grievance content.' });
        }

        const trackingId = crypto.randomBytes(8).toString('hex').toUpperCase();
        const aiAnalysis = await analyzeGrievance(content);
        const secureContent = encrypt(content);

        const report = await Report.create({
            organizationId,
            encryptedContent: secureContent,
            trackingId,
            aiSummary: aiAnalysis.executive_summary || 'Summary unavailable.',
            category: aiAnalysis.category || 'Uncategorized',
            redFlagScore: Number.isFinite(aiAnalysis.urgency_score) ? aiAnalysis.urgency_score : 50,
            status: 'Open'
        });

        res.status(201).json({
            success: true,
            message: 'Report submitted and analyzed successfully.',
            trackingId,
            data: {
                id: report._id,
                status: report.status
            }
        });
    } catch (err) {
        console.error('Submission Error:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.getOrgReports = async (req, res) => {
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

exports.getReportStatus = async (req, res) => {
    try {
        const report = await Report.findOne({
            trackingId: String(req.params.trackingId).toUpperCase(),
            ...buildReportOrganizationFilter(req.organizationId)
        }).select('status createdAt aiSummary category redFlagScore');

        if (!report) {
            return res.status(404).json({ success: false, error: 'Invalid tracking ID.' });
        }

        res.status(200).json({ success: true, data: report });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.getAdminAnalytics = async (req, res) => {
    try {
        const tenantFilter = buildReportOrganizationFilter(req.organizationId);

        const stats = await Report.aggregate([
            { $match: tenantFilter },
            {
                $group: {
                    _id: '$category',
                    totalReports: { $sum: 1 },
                    avgUrgency: { $avg: '$redFlagScore' },
                    openCases: {
                        $sum: { $cond: [{ $eq: ['$status', 'Open'] }, 1, 0] }
                    }
                }
            },
            { $sort: { avgUrgency: -1 } }
        ]);

        const totalReportsCount = await Report.countDocuments(tenantFilter);
        const criticalReports = await Report.countDocuments({
            ...tenantFilter,
            redFlagScore: { $gte: 80 }
        });

        res.status(200).json({
            success: true,
            summary: {
                totalReports: totalReportsCount,
                criticalReports,
                uniqueCategories: stats.length
            },
            breakdown: stats
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.getReportDetails = async (req, res) => {
    try {
        const report = await Report.findOne({
            _id: req.params.reportId,
            ...buildReportOrganizationFilter(req.organizationId)
        });

        if (!report) {
            return res.status(404).json({
                success: false,
                error: 'Report not found or you do not have permission to view it.'
            });
        }

        res.status(200).json({
            success: true,
            data: report
        });
    } catch (err) {
        if (err.name === 'CastError') {
            return res.status(400).json({
                success: false,
                error: 'Invalid report ID format.'
            });
        }

        res.status(500).json({
            success: false,
            error: err.message
        });
    }
};
