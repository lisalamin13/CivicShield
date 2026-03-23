const Report = require('../models/Report');
const crypto = require('crypto');
const { encrypt } = require('../utils/encryption'); 
const { analyzeGrievance } = require('../services/aiServices');

// @desc    Submit an anonymous report with AI Analysis & Encryption
exports.submitReport = async (req, res) => {
    try {
        const { content } = req.body;

        if (!content) {
            return res.status(400).json({ success: false, error: "Please provide grievance content." });
        }

        // 1. Generate a unique 16-digit Tracking ID
        const trackingId = crypto.randomBytes(8).toString('hex').toUpperCase();

        // 2. Perform AI Analysis (Gemini 3 Flash)
        const aiAnalysis = await analyzeGrievance(content);

        // 3. Encrypt the original content for Absolute Anonymity
        const secureContent = encrypt(content); 

        // 4. Prepare the report object - Mapped to match your RAW AI RESPONSE
        const reportData = {
            organizationId: req.organizationId, 
            encryptedContent: secureContent,
            trackingId: trackingId,
            aiSummary: aiAnalysis.executive_summary || "Summary unavailable.", 
            category: aiAnalysis.category || "Uncategorized", 
            redFlagScore: aiAnalysis.urgency_score || 50, 
            status: 'Open'
        };

        // 5. Save to MongoDB Atlas
        await Report.create(reportData);

        res.status(201).json({
            success: true,
            message: "Report submitted and analyzed successfully.",
            trackingId: trackingId 
        });
    } catch (err) {
        console.error("Submission Error:", err.message);
        res.status(500).json({ success: false, error: err.message });
    }
};

// @desc    Get all reports for an organization, sorted by Red Flag Score
exports.getOrgReports = async (req, res) => {
    try {
        // We added .sort({ redFlagScore: -1 }) so Admins see urgent cases first
        const reports = await Report.find({ organizationId: req.organizationId })
            .sort({ redFlagScore: -1 });

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
            trackingId: req.params.trackingId,
            organizationId: req.organizationId 
        }).select('status createdAt aiSummary'); 

        if (!report) {
            return res.status(404).json({ success: false, error: 'Invalid Tracking ID' });
        }

        res.status(200).json({ success: true, data: report });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// @desc    Get report statistics for the Admin Dashboard (Pie/Bar Chart Data)
// @route   GET /api/v1/admin/analytics
// @access  Private (Investigator)
exports.getAdminAnalytics = async (req, res) => {
    try {
        // We group reports by their AI-generated category and count them
        const stats = await Report.aggregate([
            { $match: { organizationId: req.organizationId } }, // Only current org
            {
                $group: {
                    _id: "$category",
                    count: { $sum: 1 },
                    avgUrgency: { $avg: "$redFlagScore" }
                }
            },
            { $sort: { count: -1 } }
        ]);

        // Calculate total reports and average organization risk
        const totalReports = await Report.countDocuments({ organizationId: req.organizationId });
        
        res.status(200).json({
            success: true,
            total: totalReports,
            categories: stats
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};