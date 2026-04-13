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

        // 1. Generate a unique 16-digit Tracking ID (8 bytes = 16 hex chars)
        const trackingId = crypto.randomBytes(8).toString('hex').toUpperCase();

        // 2. Perform AI Analysis (Gemini 3 Flash)
        const aiAnalysis = await analyzeGrievance(content);

        // 3. Encrypt the original content for Absolute Anonymity
        const secureContent = encrypt(content); 

        // 4. Prepare the report object - Matches your DB Screenshot
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
        // Admins see urgent cases first based on Red Flag Score
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

// @desc    Track report status using the 16-digit Tracking ID
exports.getReportStatus = async (req, res) => {
    try {
        const report = await Report.findOne({ 
            trackingId: req.params.trackingId,
            organizationId: req.organizationId 
        }).select('status createdAt aiSummary category redFlagScore'); 

        if (!report) {
            return res.status(404).json({ success: false, error: 'Invalid Tracking ID' });
        }

        res.status(200).json({ success: true, data: report });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// @desc    Get advanced statistics for the Admin Dashboard
exports.getAdminAnalytics = async (req, res) => {
    try {
        const orgId = req.organizationId; 

        const stats = await Report.aggregate([
            // 1. Filter by organization
            { $match: { organizationId: orgId } },
            
            // 2. Group by category and calculate metrics
            {
                $group: {
                    _id: "$category",
                    totalReports: { $sum: 1 },
                    avgUrgency: { $avg: "$redFlagScore" },
                    openCases: {
                        $sum: { $cond: [{ $eq: ["$status", "Open"] }, 1, 0] }
                    }
                }
            },
            
            // 3. Sort by average urgency (highest risk first)
            { $sort: { avgUrgency: -1 } }
        ]);

        // Calculate summary cards
        const totalReportsCount = await Report.countDocuments({ organizationId: orgId });
        const criticalReports = await Report.countDocuments({ 
            organizationId : orgId,
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

// @desc    Get single report details for Admin/Staff viewing
// @route   GET /api/v1/reports/:reportId
exports.getReportDetails = async (req, res) => {
    try {
        // Find the report by _id AND ensure it belongs to the organization (Tenant Isolation)
        const report = await Report.findOne({ 
            _id: req.params.reportId, 
            organizationId: req.organizationId 
        });

        if (!report) {
            return res.status(404).json({ 
                success: false, 
                error: "Report not found or you do not have permission to view it." 
            });
        }

        res.status(200).json({
            success: true,
            data: report
        });
    } catch (err) {
        // Catch invalid MongoDB ObjectIDs
        res.status(500).json({ 
            success: false, 
            error: "Invalid Report ID format." 
        });
    }
};