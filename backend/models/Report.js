const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema({
    // Link to the Organization (Tenant) - Indexed for fast multi-tenant lookup
   organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
    },
    // AES-256 Encrypted grievance text
    encryptedContent: { 
        type: String, 
        required: [true, 'Please add the grievance content'] 
    },
    // 16-character alphanumeric token for anonymous tracking
    trackingId: { 
        type: String, 
        unique: true, 
        required: true,
        index: true 
    },
    // Case status
    status: { 
        type: String, 
        enum: ['Open', 'Under Review', 'Resolved', 'Dismissed'], 
        default: 'Open' 
    },
    // AI-generated analytics fields
    aiSummary: { type: String },
    
    // Categorized by NLP engine - Indexed for the Analytics Dashboard
    category: { 
        type: String, 
        index: true, 
        default: 'Uncategorized' 
    },
    
    // Urgency score calculated by Gemini 3 Flash
    redFlagScore: { 
        type: Number, 
        min: 0, 
        max: 100, 
        default: 0 
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
});

// Create a compound index to speed up Admin queries (Org + Score)
ReportSchema.index({ organizationId: 1, redFlagScore: -1 });

module.exports = mongoose.model('Report', ReportSchema);