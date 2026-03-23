const mongoose = require('mongoose');

const ConversationSchema = new mongoose.Schema({
    reportId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Report', 
        required: true,
        index: true 
    },
    organizationId: { 
        type: String, 
        required: true 
    },
    // Allows us to distinguish who sent the message
    senderType: { 
        type: String, 
        enum: ['Staff', 'Anonymous'], 
        required: true 
    },
    // Encrypted using your AES-256 utility
    encryptedMessage: { 
        type: String, 
        required: true 
    },
    // For your "AI-assisted response drafting" feature
    aiDraftedResponse: { 
        type: String 
    },
    isApprovedByHuman: { 
        type: Boolean, 
        default: false 
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
});

module.exports = mongoose.model('Conversation', ConversationSchema);