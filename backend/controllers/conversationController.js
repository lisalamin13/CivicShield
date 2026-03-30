const Conversation = require('../models/Conversation');
const Report = require('../models/Report');
const { encrypt } = require('../utils/encryption');
const { analyzeGrievance } = require('../services/aiServices');

// @desc    Send a message (Anonymous or Admin)
exports.sendMessage = async (req, res) => {
    try {
        const { reportId, message, senderType } = req.body;

        // 1. Verify report exists and belongs to the organization
        const report = await Report.findOne({ _id: reportId, organizationId: req.organizationId });
        if (!report) {
            return res.status(404).json({ success: false, error: "Report not found." });
        }

        // 2. Encrypt the message for "Zero-Knowledge" storage
        const encryptedMessage = encrypt(message);

        // 3. Optional: AI-Assisted drafting for Admins
        let aiDraft = null;
        if (senderType === 'Staff') {
            // You can call a simplified AI function to suggest professional wording
            // const aiResponse = await generateAIDraft(message);
            // aiDraft = aiResponse;
        }

        const newMessage = await Conversation.create({
            reportId,
            organizationId: req.organizationId,
            senderType,
            encryptedMessage,
            aiDraftedResponse: aiDraft
        });

        res.status(201).json({ success: true, data: newMessage });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// @desc    Get chat history for a specific report
exports.getChatHistory = async (req, res) => {
    try {
        const messages = await Conversation.find({ 
            reportId: req.params.reportId,
            organizationId: req.organizationId 
        }).sort({ createdAt: 1 });

        res.status(200).json({ success: true, data: messages });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};