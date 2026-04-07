const Conversation = require('../models/Conversation');
const Report = require('../models/Report');
const Policy = require('../models/Policy'); // Needed for AI Context
const { encrypt } = require('../utils/encryption');
const { generateAIResponse } = require('../services/aiServices'); // Ensure the 's' is there

// @desc    Send a message (Anonymous or Staff)
exports.sendMessage = async (req, res) => {
    try {
        const { reportId, message, senderType } = req.body;
        const orgId = req.organizationId;

        // 1. Verify report exists and belongs to the organization
        // Note: Field name 'organizationId' must match your Report model screenshot
        const report = await Report.findOne({ _id: reportId, organizationId: orgId });
        if (!report) {
            return res.status(404).json({ success: false, error: "Report not found." });
        }

        // 2. Encrypt the message for "Zero-Knowledge" storage
        const encryptedMessage = encrypt(message);

        // 3. AI-Assisted drafting for Staff
        let aiDraft = null;
        if (senderType === 'Staff') {
            // Fetch policies to give the AI context on how to respond
            const policies = await Policy.find({ organization: orgId });
            const policyText = policies.map(p => p.content).join("\n");

            const prompt = `
                Context: A whistleblower sent this message: "${message}"
                Institutional Policy: ${policyText}
                Task: Draft a professional, empathetic, and neutral response. 
                Constraint: Do NOT ask for their identity or personal details.
            `;
            
            aiDraft = await generateAIResponse(prompt);
        }

        const newMessage = await Conversation.create({
            reportId,
            organizationId: orgId,
            senderType,
            encryptedMessage,
            aiDraftedResponse: aiDraft,
            isApprovedByHuman: senderType === 'Staff' ? true : false
        });

        res.status(201).json({ 
            success: true, 
            data: newMessage,
            message: senderType === 'Staff' ? "Message sent with AI assistance." : "Message sent anonymously."
        });
    } catch (err) {
        console.error("Conversation Error:", err.message);
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

        // Note: In the frontend, you will need to decrypt 'encryptedMessage' to read it.
        res.status(200).json({ success: true, count: messages.length, data: messages });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};