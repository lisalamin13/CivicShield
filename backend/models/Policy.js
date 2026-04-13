const mongoose = require('mongoose');

const PolicySchema = new mongoose.Schema({
    organization: {
        type: String,
        ref: 'Organization',
        required: true,
        index: true
    },
    title: { type: String, required: true },
    content: { type: String, required: true },
    category: {
        type: String,
        enum: ['Ethics', 'Financial', 'Academic', 'General'],
        default: 'General'
    }
}, { timestamps: true });

module.exports = mongoose.model('Policy', PolicySchema);
