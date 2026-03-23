const mongoose = require('mongoose');

const EvidenceSchema = new mongoose.Schema({
    reportId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Report', 
        required: true 
    },
    organizationId: { 
        type: String, 
        required: true, 
        index: true 
    },
    s3Url: { 
        type: String, 
        required: true 
    },
    // The name of the file AFTER metadata stripping
    cleanedFileName: { 
        type: String, 
        required: true 
    },
    fileType: { 
        type: String 
    },
    virusScanStatus: { 
        type: String, 
        enum: ['Pending', 'Clean', 'Infected'], 
        default: 'Pending' 
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
});

module.exports = mongoose.model('Evidence', EvidenceSchema);