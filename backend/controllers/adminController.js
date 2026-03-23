const Report = require('../models/Report');
const { decrypt } = require('../utils/encryption');

exports.getAdminReports = async (req, res) => 
{
    try 
    {
        // Enforce strict isolation: Only fetch reports for the Admin's Org
        // We sort by redFlagScore (descending) to highlight urgent issues
        const reports = await Report.find({ organizationId: req.organizationId })
            .sort({ redFlagScore: -1, createdAt: -1 });

        res.status(200).json({
            success: true,
            count: reports.length,
            data: reports
        });
    } 
    catch (err) 
    {
        res.status(500).json({ success: false, error: err.message });
    }
};

// @desc    Get single report and decrypt the content
// @route   GET /api/v1/admin/reports/:id
// @access  Private
exports.getSingleReport = async (req, res) => 
{
    try 
    {
        const report = await Report.findOne({ 
            _id: req.params.id, 
            organizationId: req.organizationId 
        });

        if (!report) 
        {
            return res.status(404).json({ success: false, error: 'Report not found' });
        }

        // Decrypt the grievance content for the investigator
        const decryptedContent = decrypt(report.encryptedContent);

        res.status(200).json({
            success: true,
            data: {
                ...report._doc,
                decryptedContent: decryptedContent
            }
        });
    } 
    catch (err) 
    {
        res.status(500).json({ success: false, error: err.message });
    }
};