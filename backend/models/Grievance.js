const mongoose = require('mongoose');

const GrievanceSchema = new mongoose.Schema({
    subject: {
        type: String,
        required: [true, 'Please add a subject'],
        trim: true,
        maxlength: [100, 'Subject cannot be more than 100 characters']
    },
    description: {
        type: String,
        required: [true, 'Please add a description']
    },
    category: {
        type: String,
        required: [true, 'Please specify a category'],
        enum: ['Harassment', 'Corruption', 'Academic', 'Infrastructure', 'Other']
    },
    status: {
        type: String,
        enum: ['Pending', 'Under Investigation', 'Resolved', 'Dismissed'],
        default: 'Pending'
    },
    isAnonymous: {
        type: Boolean,
        default: false
    },
    organization: {
        type: String,
        ref: 'Organization',
        required: true,
        index: true
    },
    reporter: {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
    },
    evidence: {
        type: String,
        default: 'no-evidence.jpg'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Grievance', GrievanceSchema);
