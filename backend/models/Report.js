const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema({
    organizationId: {
        type: String,
        ref: 'Organization',
        required: true,
        index: true
    },
    encryptedContent: {
        type: String,
        required: [true, 'Please add the grievance content']
    },
    trackingId: {
        type: String,
        unique: true,
        required: true,
        index: true
    },
    status: {
        type: String,
        enum: ['Open', 'Under Review', 'Resolved', 'Dismissed'],
        default: 'Open'
    },
    aiSummary: { type: String },
    category: {
        type: String,
        index: true,
        default: 'Uncategorized'
    },
    redFlagScore: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
    }
}, { timestamps: true });

ReportSchema.index({ organizationId: 1, redFlagScore: -1 });

module.exports = mongoose.model('Report', ReportSchema);
